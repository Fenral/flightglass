/**
 * §5.6 — Carry, Apex, Landing Angle og Total. Det empiriske 7-jern-fittet.
 *
 * BASELINE. Reproduserer kilde-commit 410a365d47de5c7a1542edc71d0336cd5b7d1b56
 * eksakt. Ingen forbedring, ingen opprydding. Fixturen er fasit.
 *
 * Navnet sier hva dette er: en LEGACY longitudinalmodell. Den er ikke en
 * ballbane. Den er et kompakt fit mot et begrenset offentlig TrackMan-bag-
 * datasett, kalibrert på 7-jern, og den kjøres på alle køller. Spec §5.6 sier
 * det selv: «modellestimater … ikke resultatet av en full longitudinal
 * ball-/bane-/underlagsmodell». Carry kommer fra ballhastighet og launch alene
 * — spinn inngår ikke. Landing angle kommer fra vertikal spin loft alene —
 * ballhastighet, carry og apex inngår ikke. De to leddene som SKULLE koblet
 * dem sammen (`landingLaunchTerm`, `landingApexTerm`) er hardkodet 0 i alle
 * 5028 baseline-caser. Modellen er altså tre uavhengige enkeltfit limt sammen.
 * Behold det. Senere faser bytter den ut versjonert.
 *
 * Enheter: `ballSpeed` i mph inn; `carry`, `apex`, `total` og `roll` i YARD ut.
 * Fittet er kalibrert direkte i yard — ingen meterkonvertering skjer i §5.6.
 * (UI-adapteren i §6 konverterer yard → meter med 0.9144 lenger ute.)
 *
 * Spec §5.6:
 *
 *   carrySpeedFit    = 0.9205937574433162 × BallSpeed
 *                    + 0.004072298666112809 × BallSpeed²
 *   launchEfficiency = sqrt(clamp(max(0, LaunchAngle) / 10, 0, 1))
 *   Carry            = carrySpeedFit × launchEfficiency
 *
 *   apexBase   = 0.1300557732 × BallSpeed × launchEfficiency
 *   apexLaunch = 0.0079993922 × BallSpeed × max(0, LaunchAngle) × launchEfficiency
 *   Apex       = apexBase + apexLaunch
 *
 *   verticalSpinLoft = abs(DynamicLoft − AttackAngle)
 *   landingModel     = 52.8 − 41.5 × exp(−verticalSpinLoft / 10.9)
 *   LandingAngle     = hasFlight ? clamp(landingModel, 32, 60) : 0
 *
 *   rollFraction = Carry > 0
 *                ? clamp(0.04 − (LandingAngle − 45) × 0.0015, 0.012, 0.055)
 *                : 0
 *   Total        = Carry × (1 + rollFraction)
 *
 * ⚠ DEN SISTE LINJEN I SPEC-EN ER FEIL. Motoren regner `Carry + Carry ×
 * rollFraction`, ikke `Carry × (1 + rollFraction)`. De to er algebraisk like og
 * numerisk ulike: den distribuerte formen avviker 1 ULP i 1443 av 5028 caser.
 * Fixturen har addisjonsformen. Se {@link totalFrom}.
 *
 * `hasFlight` er ENGINE-GAPS §2: `hasFlight = (carry > 0)`. Den er lokal og
 * returneres ikke av `solveFlight` — derfor returneres den ikke herfra heller.
 *
 * Alle numeriske konstanter kommer fra `constants.js`. Ingen tall hardkodes her.
 */

import {
  carryBallSpeedLinear,
  carryBallSpeedQuadratic,
  carryFullLaunchAtDeg,
  apexBasePerBallSpeed,
  apexLaunchPerBallSpeedDeg,
  landingBase,
  landingSpinAmplitude,
  landingSpinLoftTau,
  landingMinimum,
  landingMaximum,
  rollFracIntercept,
  rollFracLandingReferenceDeg,
  rollFracLandingSlope,
  rollFracMinimum,
  rollFracMaximum,
} from './constants.js';

/**
 * Lokal clamp. `src/math.js` er ikke lagt ennå, og denne modulen eier bare sin
 * egen fil — derfor står den her og ikke i en fellesmodul. Samme kropp og samme
 * rekkefølge som i `smashBallSpeed.js`; flyttes de to sammen senere, må
 * `min(max(v, lo), hi)` følge med.
 *
 * Rekkefølgen er verifisert irrelevant mot fixturen (begge retninger gir
 * 5028/5028 bit-eksakt på alle tre klampene i §5.6), men holdes fast slik at en
 * senere NaN- eller −0-diskusjon ikke flytter baseline i stillhet.
 */
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

/* ── Carry ──────────────────────────────────────────────────────────────── */

/**
 * `carryLaunchEfficiency` — hvor stor andel av speed-fittet launch-vinkelen
 * frigjør. Kvadratrot av en klampet rampe: 0 ved launch ≤ 0°, 1 ved ≥ 10°.
 *
 * ⚠ DETTE ER MODELLENS SYNLIGE GRENSE, IKKE ET UNNTAK. Øvre klamp fyrer i
 * 3715 av 5028 baseline-caser. Over 10° launch skiller modellen ikke lenger
 * mellom to slag: en 11°-launch og en 30°-launch gir samme carry ved samme
 * ballhastighet. Under 0° launch er carry eksakt 0 — ballen «flyr ikke» i det
 * hele tatt, uansett hvor hardt den er truffet (381 caser).
 *
 * @param {number} launchAngleDeg launch-vinkel i grader
 * @returns {number} effektivitet i [0, 1]
 */
export function launchEfficiency(launchAngleDeg) {
  return Math.sqrt(
    clamp(Math.max(0, launchAngleDeg) / carryFullLaunchAtDeg, 0, 1),
  );
}

/**
 * `carryBallSpeedFit` — carry i yard ved full launch-effektivitet.
 * Kvadratisk i ballhastighet. Spinn inngår ikke.
 *
 * ⚠ ULP-FELLE, VERIFISERT MOT FIXTUREN. Kvadratleddet må grupperes som
 * `koeffisient × (BallSpeed × BallSpeed)`. Den venstreassosiative formen
 * `koeffisient × BallSpeed × BallSpeed`, altså `(k × B) × B`, avviker 1 ULP i
 * 728 av 5028 caser. `B ** 2` er bit-identisk med den grupperte formen og er
 * også trygg. Ikke «rydd» parentesen bort. Samme felle som i §5.5.
 *
 * @param {number} ballSpeedMph ballhastighet i mph
 * @returns {number} carry-fit i yard, før launch-effektivitet
 */
export function carryBallSpeedFit(ballSpeedMph) {
  const ballSpeedSquared = ballSpeedMph * ballSpeedMph;
  return (
    carryBallSpeedLinear * ballSpeedMph +
    carryBallSpeedQuadratic * ballSpeedSquared
  );
}

/**
 * `carry` — spec §5.6: `Carry = carrySpeedFit × launchEfficiency`.
 *
 * @param {number} ballSpeedFit fra {@link carryBallSpeedFit}, yard
 * @param {number} efficiency fra {@link launchEfficiency}
 * @returns {number} carry i yard
 */
export function carryFrom(ballSpeedFit, efficiency) {
  return ballSpeedFit * efficiency;
}

/* ── Apex ───────────────────────────────────────────────────────────────── */

/**
 * `apexBallSpeedTerm` — apex-bidraget som bare avhenger av ballhastighet.
 *
 * ⚠ ULP-FELLE. Faktorene multipliseres VENSTRE MOT HØYRE:
 * `(k × BallSpeed) × efficiency`. Formen `k × (BallSpeed × efficiency)` avviker
 * 1 ULP i 360 av 5028 caser. Ikke sett parentes rundt de to siste.
 *
 * @param {number} ballSpeedMph ballhastighet i mph
 * @param {number} efficiency fra {@link launchEfficiency}
 * @returns {number} apex-ledd i yard
 */
export function apexBallSpeedTerm(ballSpeedMph, efficiency) {
  return apexBasePerBallSpeed * ballSpeedMph * efficiency;
}

/**
 * `apexLaunchTerm` — apex-bidraget fra launch-vinkelen.
 *
 * Launch teller altså to ganger i apex: én gang gjennom `efficiency` og én
 * gang direkte som `max(0, LaunchAngle)`. Over 10° launch er `efficiency`
 * mettet, og bare det direkte leddet vokser videre.
 *
 * ⚠ ULP-FELLE. Alle fire faktorene multipliseres VENSTRE MOT HØYRE:
 * `((k × BallSpeed) × max(0, launch)) × efficiency`. Formen
 * `k × BallSpeed × (max(0, launch) × efficiency)` avviker 1 ULP i 299 av 5028
 * caser. Ikke omgrupper.
 *
 * @param {number} ballSpeedMph ballhastighet i mph
 * @param {number} launchAngleDeg launch-vinkel i grader
 * @param {number} efficiency fra {@link launchEfficiency}
 * @returns {number} apex-ledd i yard
 */
export function apexLaunchTerm(ballSpeedMph, launchAngleDeg, efficiency) {
  return (
    apexLaunchPerBallSpeedDeg *
    ballSpeedMph *
    Math.max(0, launchAngleDeg) *
    efficiency
  );
}

/**
 * `apexLaunchFactor` — hvor mange ganger høyere apex blir av launch-leddet.
 * Rent diagnostisk; ingenting nedstrøms leser den.
 *
 * ⚠ DEN ER EN MÅLT RATIO, IKKE EN FORMEL. Motoren regner `apex /
 * apexBallSpeedTerm`. Den algebraisk identiske lukkede formen
 * `1 + (apexLaunchPerBallSpeedDeg / apexBasePerBallSpeed) × max(0, launch)`
 * avviker i 1747 av 5028 caser, og `1 + apexLaunchTerm / apexBallSpeedTerm` i
 * 1551. Beviset ligger i fixturen selv: 59 distinkte launch-vinkler produserer
 * 132 distinkte faktorer. En lukket form av launch alene kan ikke gjøre det.
 *
 * Vakten står på NEVNEREN, ikke på `efficiency`. `edge.club-speed-zero` har
 * `efficiency = 1` og `ballSpeed = 0`, altså nevner 0 og teller 0. Uten vakten
 * blir det 0/0 = NaN, og fixturen inneholder ikke ett eneste ikke-endelig tall.
 * Alle 382 casene med nevner 0 har faktor eksakt 1.
 *
 * @param {number} apex fra {@link apexFrom}
 * @param {number} baseTerm fra {@link apexBallSpeedTerm}
 * @returns {number} ratio; 1 når basisleddet er 0
 */
export function apexLaunchFactor(apex, baseTerm) {
  return baseTerm === 0 ? 1 : apex / baseTerm;
}

/**
 * `apex` — spec §5.6: `Apex = apexBase + apexLaunch`.
 *
 * ⚠ SUMMEN ER PRIMÆR. Ikke regn apex som `apexBallSpeedTerm ×
 * apexLaunchFactor` — den runde turen gjennom divisjon og multiplikasjon
 * avviker 1 ULP i 479 av 5028 caser.
 *
 * @param {number} baseTerm fra {@link apexBallSpeedTerm}
 * @param {number} launchTerm fra {@link apexLaunchTerm}
 * @returns {number} apex i yard
 */
export function apexFrom(baseTerm, launchTerm) {
  return baseTerm + launchTerm;
}

/* ── Landing angle ──────────────────────────────────────────────────────── */

/**
 * `verticalSpinLoft` — spec §5.4 og §5.6: `abs(DynamicLoft − AttackAngle)`.
 *
 * Dette er den VERTIKALE spin loften, ikke den 3-dimensjonale `spinLoft3DDeg`
 * som §5.5 bruker. De to skiller seg i 4392 av 5028 caser. Verdien er
 * identisk med `abs(signedVerticalSpinLoftDeg)` i alle caser.
 *
 * @param {number} dynamicLoftDeg dynamisk loft i grader
 * @param {number} attackAngleDeg angrepsvinkel i grader
 * @returns {number} ikke-negativ vertikal spin loft i grader
 */
export function verticalSpinLoft(dynamicLoftDeg, attackAngleDeg) {
  return Math.abs(dynamicLoftDeg - attackAngleDeg);
}

/**
 * `landingSpinTerm` — det eneste leddet som faktisk former landingsvinkelen:
 * `−41.5 × exp(−verticalSpinLoft / 10.9)`.
 *
 * Ledd, ikke vinkel. Det er negativt (i [−41.5, 0)) og legges til
 * `landingBase = 52.8`. Verdien beregnes ALLTID, også når det ikke er noen
 * flukt — den nulles i så fall ut av {@link landingDomainTerm}, ikke av en
 * tidlig retur. Fixturen har ingen case med `landingSpinTerm === 0`.
 *
 * @param {number} verticalSpinLoftDeg fra {@link verticalSpinLoft}
 * @returns {number} negativt gradledd
 */
export function landingSpinTerm(verticalSpinLoftDeg) {
  return (
    -landingSpinAmplitude *
    Math.exp(-verticalSpinLoftDeg / landingSpinLoftTau)
  );
}

/**
 * `landingDomainTerm` — domenevakten, uttrykt som et LEDD i stedet for en gren.
 *
 * Er det ingen flukt, er dette nøyaktig det negative av alt annet, slik at
 * `landingRaw` summerer til 0. Er det flukt, er det 0. Slik ser motoren ut:
 * dekomponeringen skal alltid gå opp, også i det degenererte tilfellet.
 * Fyrer i 382 av 5028 caser.
 *
 * MERK at det er `landingBase + spinTerm` som nulles ut, ikke den KLAMPEDE
 * vinkelen. Ville man brukt `−clamp(model, 32, 60)`, ville 254 caser brutt.
 * Klampen ligger etter dekomponeringen, ikke inni den.
 *
 * @param {boolean} hasFlight ENGINE-GAPS §2: `carry > 0`
 * @param {number} spinTerm fra {@link landingSpinTerm}
 * @returns {number} 0 ved flukt, ellers `−(landingBase + spinTerm)`
 */
export function landingDomainTerm(hasFlight, spinTerm) {
  return hasFlight ? 0 : -(landingBase + spinTerm);
}

/**
 * `landingRaw` — summen av alle fem leddene, UKLAMPET.
 *
 * ⚠ RÅ BETYR RÅ. `landingRaw` er ikke det samme tallet som `landingAngle`:
 * i 455 av 5028 caser ligger den under gulvet på 32° og blir løftet av klampen
 * først i {@link landingAngleFrom}. Nedstrøms (`rollFrac`) leser den KLAMPEDE
 * vinkelen. Ikke bytt om på de to.
 *
 * Summeringen går venstre mot høyre i den rekkefølgen argumentene står. Det er
 * den rekkefølgen som får `landingBase + spinTerm + domainTerm` til å bli
 * eksakt 0 i de 382 casene uten flukt.
 *
 * @param {number} spinTerm fra {@link landingSpinTerm}
 * @param {number} launchTerm dødt ledd, alltid 0 — se {@link landingDeadTerms}
 * @param {number} apexTerm dødt ledd, alltid 0 — se {@link landingDeadTerms}
 * @param {number} domainTerm fra {@link landingDomainTerm}
 * @returns {number} uklampet landingsvinkel i grader, 0 uten flukt
 */
export function landingRaw(spinTerm, launchTerm, apexTerm, domainTerm) {
  return landingBase + spinTerm + launchTerm + apexTerm + domainTerm;
}

/**
 * `landingAngle` — spec §5.6: `hasFlight ? clamp(landingModel, 32, 60) : 0`.
 *
 * Gulvet på 32° fyrer i 455 av 5028 caser. Taket på 60° fyrer aldri i
 * baseline: modellen har asymptote 52.8° og kan ikke nå 60 uansett input.
 * Taket beholdes fordi motoren har det, ikke fordi det gjør noe.
 *
 * @param {boolean} hasFlight ENGINE-GAPS §2: `carry > 0`
 * @param {number} raw fra {@link landingRaw}
 * @returns {number} landingsvinkel i grader
 */
export function landingAngleFrom(hasFlight, raw) {
  return hasFlight ? clamp(raw, landingMinimum, landingMaximum) : 0;
}

/**
 * Landingsmodellens to døde ledd, eksponert fordi de er FELT i fixturen og en
 * reproduksjon må emittere dem for å matche.
 *
 * Begge er eksakt 0 i alle 5028 baseline-caser. Motoren har altså plass til et
 * launch-bidrag og et apex-bidrag i landingsvinkelen, men koeffisientene er
 * null: landingsvinkelen avhenger av vertikal spin loft og ingenting annet. Et
 * slag med 40 yard apex og et med 90 yard apex får identisk landingsvinkel så
 * lenge spin loften er lik. Det er en kjent modellgrense, ikke en bug å fikse
 * her.
 */
export const landingDeadTerms = Object.freeze({
  landingLaunchTerm: 0,
  landingApexTerm: 0,
});

/* ── Roll og total ──────────────────────────────────────────────────────── */

/**
 * `rollFrac` — utrullingen som andel av carry.
 *
 * Leser den KLAMPEDE `landingAngle`, slik motoren gjør. Underlag,
 * ballhastighet og spinn inngår ikke; bare landingsvinkelen. Flatere landing
 * ruller mer.
 *
 * ⚠ Øvre klamp på 0.055 fyrer i 531 av 5028 caser — alle med landingsvinkel
 * under 35°. Nedre klamp på 0.012 fyrer aldri i baseline: den ville krevd
 * landingsvinkel over 63.7°, og modellen har asymptote 52.8°.
 *
 * ⚠ BASELINE KAN IKKE SKILLE klampet fra uklampet input her. Roll-taket metter
 * under 35°, landingsgulvet ligger på 32°, så begge valgene gir 0.055 i alle
 * 455 klampede caser. Valget er tatt fordi motoren har det, ikke fordi
 * fixturen beviser det. Løftes landingsgulvet over 35° senere, blir det
 * plutselig observerbart — testen `landingsklampen er USYNLIG for rollFrac`
 * står som varsel.
 *
 * @param {number} carry carry i yard; `carry > 0` er ENGINE-GAPS §2 `hasFlight`
 * @param {number} landingAngleDeg fra {@link landingAngleFrom}
 * @returns {number} andel i [0.012, 0.055], eller 0 uten carry
 */
export function rollFraction(carry, landingAngleDeg) {
  return carry > 0
    ? clamp(
        rollFracIntercept -
          (landingAngleDeg - rollFracLandingReferenceDeg) * rollFracLandingSlope,
        rollFracMinimum,
        rollFracMaximum,
      )
    : 0;
}

/**
 * `roll` — utrulling i yard: `carry × rollFrac`.
 *
 * @param {number} carry carry i yard
 * @param {number} rollFrac fra {@link rollFraction}
 * @returns {number} utrulling i yard
 */
export function rollFrom(carry, rollFrac) {
  return carry * rollFrac;
}

/**
 * `total` — carry pluss utrulling.
 *
 * ⚠ SPEC §5.6 SIER `Total = Carry × (1 + rollFraction)`. MOTOREN GJØR DET
 * IKKE. Den regner `carry + roll`, altså `Carry + Carry × rollFraction`. De to
 * er algebraisk identiske og numerisk ulike: den distribuerte formen avviker
 * 1 ULP i 1443 av 5028 caser. Fixturen har addisjonsformen. Dette er et
 * dokumentert avvik mellom spec-tekst og motor, og motoren er fasit.
 *
 * Følgen: `total − carry` gjenskaper ikke `roll` bit-eksakt (4492 caser
 * avviker). Vil du ha utrullingen, bruk {@link rollFrom} — ikke subtraher.
 *
 * @param {number} carry carry i yard
 * @param {number} roll fra {@link rollFrom}
 * @returns {number} total distanse i yard
 */
export function totalFrom(carry, roll) {
  return carry + roll;
}

/* ── Hele §5.6 ──────────────────────────────────────────────────────────── */

/**
 * Hele §5.6 i ett kall.
 *
 * `hasFlight` (ENGINE-GAPS §2: `carry > 0`) beregnes internt og returneres
 * IKKE. Den er lokal i dagens motor og `solveFlight` eksponerer den ikke.
 *
 * @param {{ballSpeed: number, launchAngle: number, dynamicLoft: number,
 *          attackAngle: number}} input
 *   `ballSpeed` i mph. De tre andre i grader. `dynamicLoft` og `attackAngle`
 *   brukes bare til den vertikale spin loften i landingsmodellen.
 * @returns {{carry: number, apex: number, total: number, landingAngle: number,
 *            rollFrac: number, roll: number, carryLaunchEfficiency: number,
 *            carryBallSpeedFit: number, apexBallSpeedTerm: number,
 *            apexLaunchTerm: number, apexLaunchFactor: number,
 *            landingSpinTerm: number, landingLaunchTerm: number,
 *            landingApexTerm: number, landingDomainTerm: number,
 *            landingRaw: number}}
 *   Alle 16 §5.6-feltene fixturen har, i yard og grader. Ingen presentasjons-
 *   data.
 */
export function solveLongitudinalLegacy({
  ballSpeed,
  launchAngle,
  dynamicLoft,
  attackAngle,
}) {
  const efficiency = launchEfficiency(launchAngle);
  const ballSpeedFit = carryBallSpeedFit(ballSpeed);
  const carry = carryFrom(ballSpeedFit, efficiency);

  const baseTerm = apexBallSpeedTerm(ballSpeed, efficiency);
  const launchTerm = apexLaunchTerm(ballSpeed, launchAngle, efficiency);
  const apex = apexFrom(baseTerm, launchTerm);

  // ENGINE-GAPS §2. Lokal, ikke returnert.
  const hasFlight = carry > 0;

  const spinTerm = landingSpinTerm(verticalSpinLoft(dynamicLoft, attackAngle));
  const { landingLaunchTerm, landingApexTerm } = landingDeadTerms;
  const domainTerm = landingDomainTerm(hasFlight, spinTerm);
  const raw = landingRaw(
    spinTerm,
    landingLaunchTerm,
    landingApexTerm,
    domainTerm,
  );
  const landingAngle = landingAngleFrom(hasFlight, raw);

  const rollFrac = rollFraction(carry, landingAngle);
  const roll = rollFrom(carry, rollFrac);
  const total = totalFrom(carry, roll);

  return {
    carry,
    apex,
    total,
    landingAngle,
    rollFrac,
    roll,
    carryLaunchEfficiency: efficiency,
    carryBallSpeedFit: ballSpeedFit,
    apexBallSpeedTerm: baseTerm,
    apexLaunchTerm: launchTerm,
    apexLaunchFactor: apexLaunchFactor(apex, baseTerm),
    landingSpinTerm: spinTerm,
    landingLaunchTerm,
    landingApexTerm,
    landingDomainTerm: domainTerm,
    landingRaw: raw,
  };
}
