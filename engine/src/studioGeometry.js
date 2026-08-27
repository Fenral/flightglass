/**
 * §8.1–8.4 Impact Studio-geometri — buens low point, treffparameter og den
 * geometrisk avledede leveringen (`attackAngle`, `clubPath`).
 *
 * BASELINE. Reproduserer dagens motor eksakt. Ingen forbedring, ingen
 * opprydding, ingen modernisering. `motor/export/studio-golden.json` er fasit.
 * Avviker koden fra fixturen, er det koden som har feil.
 *
 * Studio bruker en stiv, sirkulær bue i et plan. Verdensaksene er (spec §8):
 *
 *   +X = target
 *   +Y = bort fra Face On-kamera
 *   +Z = opp
 *
 * Denne modulen eier de seks skalarene i §8.1–8.4:
 *
 *   lowPointX, lowPointZ, effectiveLowPointX, thetaAtImpact,
 *   attackAngle, clubPath
 *
 * Den eier IKKE `lowPointWorld`, `planeBasis`, `impactPoint`, `shaftPivot`,
 * `tangentAtImpact` eller `planePolygon` (verdensrom, ENGINE-GAPS §8), og
 * heller ikke `contactHeight`, `clubBallContact`, `faceCentreOffsetMm`,
 * bakkekryssingene eller strike-båndene (ENGINE-GAPS §7–9, spec §8.5).
 * De hører hjemme i egne moduler og importerer disse funksjonene.
 *
 * Studio beregner aldri spinn, carry eller ballflukt (spec §11.3).
 *
 * ── Spec §8.1–8.4, ordrett ───────────────────────────────────────────────
 *
 *   LowPointX        = (10.5 − BallPositionCm) / 100
 *   Iron LowPointZ   = (ArcHeightCm − 0.2) / 100
 *   Driver LowPointZ = (ArcHeightCm + 1.8) / 100
 *
 *   perDegree           = Radius × cos(SwingPlane × π/180) × π / 180
 *   EffectiveLowPointX  = LowPointX − SwingDirection × perDegree
 *
 *   thetaAtImpact = asin(clamp(−EffectiveLowPointX / Radius, −0.999, 0.999))
 *
 *   horizontalParallel      = cos(theta)
 *   horizontalPerpendicular = −sin(theta) × cos(phi)
 *   vertical                = sin(theta) × sin(phi)
 *
 *   AttackAngle = atan2(vertical,
 *                       hypot(horizontalParallel, horizontalPerpendicular))
 *                 × 180/π
 *   ClubPath    = SwingDirection
 *                 + atan2(horizontalPerpendicular, horizontalParallel) × 180/π
 *
 * ── ULP-konvensjoner: tre grupperinger som IKKE er utbyttbare ─────────────
 *
 * Alle seks feltene er BIT-EKSAKTE mot fixturen i 2500/2500 caser (avvik
 * nøyaktig 0). Det krever tre grupperinger som ser like ut algebraisk, men
 * skiller seg med 1–2 ULP. Måltall er antall bit-eksakte caser av 2500:
 *
 *   1. grader → radianer for `phi`:  `(deg * Math.PI) / 180`, IKKE
 *      `deg * degToRad`. Se engine/README.md; `thetaAtImpact` faller til
 *      2300/2500 med den motsatte rekkefølgen.
 *
 *   2. den avsluttende gradskalaen i `perDegree`: `* degToRad`, altså
 *      `* (Math.PI / 180)` — motsatt av punkt 1, i samme uttrykk.
 *      `* Math.PI / 180` gir 2370/2500 på `effectiveLowPointX`.
 *
 *   3. radianer → grader for `attackAngle` og `clubPath`:
 *      `(rad * 180) / Math.PI`, IKKE `rad * radToDeg`.
 *      `radToDeg` gir 1910/2500 og 1990/2500.
 *
 * Blandingen finnes i dagens kode (`swing-parameters-and-impact.js`) og skal
 * beholdes. Derfor importeres `degToRad` fra `constants.js`, mens `radToDeg`
 * bevisst IKKE importeres: konstanten finnes, men er feil verktøy her.
 * Litteralene `180` og `Math.PI` i denne filen er ikke fysiske konstanter —
 * de er selve grupperingen, og den er testdekket i
 * `test/studioGeometry.test.js`.
 *
 * `Math.hypot(a, b)` er heller ikke utbyttbar med `Math.sqrt(a*a + b*b)`:
 * den siste gir 1630/2500 på `attackAngle`.
 *
 * ── VERIFISERT FAKTUM: kølle rører kun `lowPointZ` ───────────────────────
 *
 * `attackAngle`, `clubPath`, `thetaAtImpact`, `effectiveLowPointX` og
 * `lowPointX` er bit-identiske for iron og driver i alle 1250 parene i
 * fixturen. `clubMode` går kun inn i `lowPointZ`, via `arcZ0Cm`. Det er en
 * strukturell egenskap, ikke en tilfeldighet: `clubMode` forekommer ingen
 * andre steder i §8.1–8.4.
 *
 * Ingen I/O. Ingen skjult tilstand. Ingen presentasjonsdata.
 */

import {
  studioRadius,
  studioBallPositionOffsetCm,
  cmPerMetre,
  arcZ0Cm,
  studioThetaSinClamp,
  degToRad,
} from './constants.js';

/**
 * Lokal clamp. `src/math.js` er planlagt i README-ens modultabell, men finnes
 * ikke ennå, og denne modulen eier ikke den filen. Samme form og samme
 * rekkefølge som den lokale clampen i `src/startDirection.js`, slik at de kan
 * slås sammen uten å endre noe når `math.js` kommer.
 *
 * @param {number} value
 * @param {number} minimum
 * @param {number} maximum
 * @returns {number}
 */
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Studios grader → radianer. `(deg * Math.PI) / 180`.
 *
 * ⚠ IKKE `deg * degToRad`. Se ULP-konvensjon 1 i filhodet. Flight-motoren
 * bruker den motsatte rekkefølgen; de to skal ikke deles.
 *
 * Alle plan-vinkler i denne filen går gjennom denne ene funksjonen, slik at
 * konvensjonen finnes ett sted.
 *
 * @param {number} deg vinkel i grader
 * @returns {number} vinkel i radianer, Studios gruppering
 */
export function swingPlaneRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * §8.1: `LowPointX = (10.5 − BallPositionCm) / 100`.
 *
 * Ballposisjonen er i cm, positiv forover/mot målet. Resultatet er buens rå
 * low point langs X i meter, relativt til ballen. `10.5 cm` er UI-mappingens
 * nullpunkt (`studioBallPositionOffsetCm`), ikke en fysisk lengde.
 *
 * ⚠ DIVIDER med `cmPerMetre` (= 100). `* 0.01` er 1 ULP unna og gir feil
 * `lowPointX` i 250 av 2500 caser.
 *
 * @param {number} ballPositionCm ballposisjon i cm, `+` = forover
 * @returns {number} rå low point X i meter
 */
export function ballLowPointX(ballPositionCm) {
  return (studioBallPositionOffsetCm - ballPositionCm) / cmPerMetre;
}

/**
 * §8.1: `LowPointZ = (ArcHeightCm + z_club) / 100`, der `z_club` er
 * `−0.2 cm` for iron og `+1.8 cm` for driver (`arcZ0Cm`).
 *
 * Dette er DET ENESTE stedet `clubMode` inngår i §8.1–8.4. Offsetene er del
 * av dagens visualiserte eksempel, ikke universelle kølledata; driveroffseten
 * tilhører den uvaliderte stand-in-modusen (spec §8.1, FUNN F1).
 *
 * `arcZ0Cm` har nøyaktig to nøkler, og fixturen har nøyaktig de to modusene.
 * Andre verdier er utenfor baseline: oppslaget gir `undefined` og dermed
 * `NaN`. Ingen validering legges til her — en kastende sjekk ville vært ny
 * oppførsel, ikke baseline (jf. spec §3: parsing hører hjemme i et adapterlag).
 *
 * @param {number} arcHeightCm buehøyde i cm, køllerelativ UI-verdi
 * @param {'iron'|'driver'} clubMode
 * @returns {number} low point Z i meter
 */
export function clubLowPointZ(arcHeightCm, clubMode) {
  return (arcHeightCm + arcZ0Cm[clubMode]) / cmPerMetre;
}

/**
 * §8.2: `perDegree = Radius × cos(SwingPlane × π/180) × π / 180`.
 *
 * Horisontal forskyvning av low point per grad Swing Direction. En flatere
 * plane gir større forskyvning per grad enn en brattere plane.
 *
 * ⚠ Den avsluttende gradskalaen er gruppert som `* degToRad`, altså
 * `* (Math.PI / 180)` — mens `phi` inni cosinus bruker den MOTSATTE
 * grupperingen. Se ULP-konvensjon 1 og 2 i filhodet. Begge kreves i samme
 * uttrykk for 2500/2500.
 *
 * @param {number} swingPlaneDeg svingplanets helning i grader
 * @returns {number} meter per grad Swing Direction
 */
export function lowPointShiftPerDegree(swingPlaneDeg) {
  return studioRadius * Math.cos(swingPlaneRadians(swingPlaneDeg)) * degToRad;
}

/**
 * §8.2: `EffectiveLowPointX = LowPointX − SwingDirection × perDegree`.
 *
 * `perDegree` tas som eksplisitt argument slik at kalleren kan gjenbruke den
 * (den avhenger bare av swing plane).
 *
 * @param {number} lowPointX fra {@link ballLowPointX}, meter
 * @param {number} swingDirection grader
 * @param {number} perDegree fra {@link lowPointShiftPerDegree}, meter per grad
 * @returns {number} effektivt low point X i meter
 */
export function shiftLowPointX(lowPointX, swingDirection, perDegree) {
  return lowPointX - swingDirection * perDegree;
}

/**
 * §8.3: `thetaAtImpact = asin(clamp(−EffectiveLowPointX / Radius, −0.999, 0.999))`.
 *
 * Treffparameteren på buen, i radianer. Negativ theta = treff før low point
 * (kølla er fortsatt på vei ned), positiv = etter.
 *
 * Clampen på `±0.999` (`studioThetaSinClamp`) er spec-belagt, men IKKE
 * fixture-belagt: største `|−eff/R|` i baseline er `0.4355`, så clampen biter
 * aldri i de 2500 casene. Grenen reproduseres likevel uendret.
 *
 * @param {number} effectiveLowPointX meter
 * @returns {number} theta ved treff, radianer
 */
export function impactTheta(effectiveLowPointX) {
  return Math.asin(
    clamp(
      -effectiveLowPointX / studioRadius,
      -studioThetaSinClamp,
      studioThetaSinClamp,
    ),
  );
}

/**
 * §8.4: de tre tangentkomponentene i buens eget plan.
 *
 *   horizontalParallel      = cos(theta)
 *   horizontalPerpendicular = −sin(theta) × cos(phi)
 *   vertical                = sin(theta) × sin(phi)
 *
 * ⚠ Dette er IKKE fixturens `tangentAtImpact`. Den er den samme tangenten
 * skalert med radius og rotert til verdensrom via `planeBasis` (ENGINE-GAPS
 * §8) og eies av verdensrom-modulen. Komponentene her er dimensjonsløse og
 * brukes kun til å utlede `attackAngle` og `clubPath`.
 *
 * @param {number} theta treffparameter i radianer, fra {@link impactTheta}
 * @param {number} swingPlaneDeg svingplanets helning i grader
 * @returns {{horizontalParallel: number, horizontalPerpendicular: number, vertical: number}}
 */
export function arcDeliveryComponents(theta, swingPlaneDeg) {
  const phi = swingPlaneRadians(swingPlaneDeg);

  return {
    horizontalParallel: Math.cos(theta),
    horizontalPerpendicular: -Math.sin(theta) * Math.cos(phi),
    vertical: Math.sin(theta) * Math.sin(phi),
  };
}

/**
 * §8.4: `AttackAngle = atan2(vertical, hypot(hPar, hPerp)) × 180/π`.
 *
 * Fortegn: `+` = kølla går oppover gjennom treff, `−` = nedover.
 *
 * ⚠ `Math.hypot`, ikke `Math.sqrt(a*a + b*b)` (1630/2500), og `(rad * 180) /
 * Math.PI`, ikke `rad * radToDeg` (1910/2500). Se filhodet.
 *
 * @param {{horizontalParallel: number, horizontalPerpendicular: number, vertical: number}} components
 * @returns {number} attack angle i grader
 */
export function attackAngleFromComponents(components) {
  const { horizontalParallel, horizontalPerpendicular, vertical } = components;

  return (
    (Math.atan2(vertical, Math.hypot(horizontalParallel, horizontalPerpendicular)) *
      180) /
    Math.PI
  );
}

/**
 * §8.4: `ClubPath = SwingDirection + atan2(hPerp, hPar) × 180/π`.
 *
 * Fortegn (spec §4, høyrehendt golfer): `+` = in-to-out/høyre.
 *
 * ⚠ `(rad * 180) / Math.PI`, ikke `rad * radToDeg` (1990/2500). Se filhodet.
 *
 * @param {{horizontalParallel: number, horizontalPerpendicular: number}} components
 * @param {number} swingDirection grader
 * @returns {number} club path i grader
 */
export function clubPathFromComponents(components, swingDirection) {
  const { horizontalParallel, horizontalPerpendicular } = components;

  return (
    swingDirection +
    (Math.atan2(horizontalPerpendicular, horizontalParallel) * 180) / Math.PI
  );
}

/**
 * §8.1–8.4 samlet. Ren funksjon.
 *
 * Inputfeltene har samme navn som `in` i `studio-golden.json`, slik at en case
 * kan sendes rett inn: `solveStudioGeometry(c.in)`.
 *
 * Returnerer nøyaktig de seks skalarene modulen eier — ingen vektorer, ingen
 * bånd, ingen farger, ingen UI-strenger.
 *
 * Ingen validering av input (spec §3: parsing og coercion hører hjemme i et
 * separat adapterlag).
 *
 * @param {{swingPlane: number, swingDirection: number, ballPositionCm: number,
 *          arcHeightCm: number, clubMode: 'iron'|'driver'}} input
 * @returns {{lowPointX: number, lowPointZ: number, effectiveLowPointX: number,
 *            thetaAtImpact: number, attackAngle: number, clubPath: number}}
 */
export function solveStudioGeometry({
  swingPlane,
  swingDirection,
  ballPositionCm,
  arcHeightCm,
  clubMode,
}) {
  const lowPointX = ballLowPointX(ballPositionCm);
  const lowPointZ = clubLowPointZ(arcHeightCm, clubMode);

  const effectiveLowPointX = shiftLowPointX(
    lowPointX,
    swingDirection,
    lowPointShiftPerDegree(swingPlane),
  );

  const thetaAtImpact = impactTheta(effectiveLowPointX);
  const components = arcDeliveryComponents(thetaAtImpact, swingPlane);

  return {
    lowPointX,
    lowPointZ,
    effectiveLowPointX,
    thetaAtImpact,
    attackAngle: attackAngleFromComponents(components),
    clubPath: clubPathFromComponents(components, swingDirection),
  };
}
