/**
 * REFERANSEIMPLEMENTASJON — ikke produksjonssti.
 *
 * Denne modulen er en UAVHENGIG utledning av koeffisientbroen i spec §5.7.
 * Produksjonskjeden bruker `rk4Integrator.js`, som har sin egen kopi av de
 * samme funksjonene av en målt ytelsesgrunn: derivatet kalles ~10 millioner
 * ganger over fixturen, og `aeroStep` allokerer fire arrays per kall.
 *
 * Formålet med å beholde to implementasjoner er DIFFERENSIALTESTING. To
 * uavhengige utledninger som gir bit-identiske tall er et sterkere bevis enn
 * én implementasjon testet mot seg selv. `test/aero-differential.test.js`
 * håndhever likheten; divergerer de, er det en bug i én av dem.
 *
 * Hette lagt til 2026-08-25 etter BASELINE-FUNN [19], som korrekt påpekte at
 * modulen ikke hadde noen konsument og derfor leste som utilsiktet duplikat.
 * Den er ikke det — men formålet sto ingen steder.
 *
 * Flightglass engine — §5.7 aerodynamiske koeffisienter.
 *
 * BASELINE. Denne modulen reproduserer koeffisientbroen dagens motor bruker i
 * hvert RK4-derivatkall. Den integrerer ikke, den bygger ingen krefter og den
 * eier ingen tilstand. Den svarer på ett spørsmål:
 *
 *   gitt hastighet og spinnvektor akkurat nå — hva er Reynolds, spin parameter,
 *   Cl og Cd?
 *
 * pluss bokføringen av observerte min/maks som `aerodynamicDiagnostics` er
 * bygget av.
 *
 * ── Kilder ──────────────────────────────────────────────────────────────────
 *   01-PHYSICS-AND-MECHANICS-ENGINE.md §5.7  — formlene og konstantene
 *   motor/export/flight-golden.json          — fasit (5028 caser)
 *   motor/FUNN.md F2                         — `extrapolated: true` er
 *                                              normaltilstanden, ikke unntaket
 *
 * ── Verifiserte flyttallsdetaljer ───────────────────────────────────────────
 * Spec-en skriver formlene som matematikk. Matematikk er assosiativ; IEEE-754
 * er det ikke. Følgende valg er ikke stil — de er målt mot fixturen ved å
 * evaluere det eksakte starttilstands-kallet (k1 ved t=0), som kan reproduseres
 * bit-for-bit uten RK4-akkumulering, og telle treff mot
 * `aerodynamicDiagnostics.*RangeObserved`:
 *
 *   1. Begge normer er `Math.hypot`, ikke `Math.sqrt(x*x+y*y+z*z)`.
 *      Reynolds: hypot 5027/5027, sqrt 3349/5027.
 *      Spin parameter: hypot/hypot 3998, hypot/sqrt 3039, sqrt/hypot 2728,
 *      sqrt/sqrt 2165. (3998 er taket her: t=0 er ikke et ekstrempunkt for S i
 *      alle caser, så resten er ikke uenighet, bare ikke-observerbare.)
 *
 *   2. Reynolds grupperes `(speed * 2 * ballRadius) / kinematicViscosity`.
 *      Forhåndsregnet `speed * (2*ballRadius/kinematicViscosity)` gir 3785/5027.
 *
 *   3. Spin parameter grupperes `(ballRadius * perp) / speed`.
 *      `ballRadius * (perp / speed)` gir 2752, `perp * (ballRadius / speed)`
 *      gir 2628.
 *
 *   4. Vinkelrett spinn er projeksjonssubtraksjon `ω − (ω·û)û`, ikke `|ω × û|`
 *      og ikke `|ω × v| / speed`. 3998 mot 2229 og 2221.
 *
 *   5. Enhetsvektoren normeres med RESIPROK MULTIPLIKASJON, `v × (1/speed)`,
 *      ikke `v / speed`. Dette er den ene detaljen som ikke kan leses ut av
 *      spec-teksten. Full RK4 over alle 5028 caser, drevet av denne modulen:
 *
 *        metrikk                              v/speed      v*(1/speed)
 *        bit-eksakte caser                      2874           3112
 *        bit-eksakt flukttid                    3998           4072
 *        største absolutte avvik             5.82e-11       4.37e-11
 *        eksakt endepunkt ved t=0 (av 5027)     3994           4022
 *
 *      Vektorbiblioteker skriver typisk `scale(v, 1/len(v))`. Dagens motor
 *      gjør det samme. Skriv ikke om til `v / speed`.
 *
 *      Uavhengig bekreftelse: `src/rk4Integrator.js`, skrevet parallelt og uten
 *      kontakt med denne filen, kom til nøyaktig samme konklusjon for alle fem
 *      punktene over — inkludert `unit(v) = v · (1/speed)`. To reverse-
 *      utledninger som lander likt er sterkere bevis enn én.
 *
 *   6. Ved `speed === 0` gjør motoren ingen observasjon i det hele tatt.
 *      Bevis: `edge.club-speed-zero` har ballSpeed 0, altså speed 0 ved t=0,
 *      men `reynoldsRangeObserved` er `[143.30449892537908, 286.608997852011]`
 *      — verdiene fra k2/k3 (halvsteget) og k4. Hadde motoren bokført k1 ville
 *      minimum vært 0; hadde den delt på null ville S vært NaN, og fixturen
 *      inneholder ikke ett eneste ikke-endelig tall. `aeroStep` returnerer
 *      derfor `null` der, og `observeAero` hopper over `null`.
 *
 * Ikke «rydd» noen av disse. Hver av dem er en målt egenskap ved baseline.
 */

import {
  ballRadius,
  kinematicViscosity,
  wind,
  liftCoefficientFactor,
  liftCoefficientExponent,
  dragBridgeBase,
  dragBridgeReynoldsAmplitude,
  dragBridgeReynoldsMidpoint,
  dragBridgeReynoldsWidth,
  dragBridgeSpinAmplitude,
  dragBridgeSpinHalf,
  dragCompatibilityScale,
  reynoldsValidity,
  spinParameterValidity,
  aeroModelIdentity,
} from './constants.js';

/* ─────────────────────────────────────────────────────────────────────────
 * Skalarkjernen
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Reynolds-tall for en gitt lufthastighet.
 *
 *   Reynolds = speed × 2 × BallRadius / KinematicViscosity      (spec §5.7)
 *
 * Grupperingen er målt, se punkt 2 i filhodet.
 *
 * @param {number} speed lufthastighetens størrelse i m/s
 * @returns {number} dimensjonsløst Reynolds-tall
 */
export function reynoldsNumber(speed) {
  return (speed * 2 * ballRadius) / kinematicViscosity;
}

/**
 * Spin parameter S.
 *
 *   S = BallRadius × |ω vinkelrett på airVelocity| / speed      (spec §5.7)
 *
 * Grupperingen er målt, se punkt 3 i filhodet.
 *
 * @param {number} perpendicularSpinRadPerSec |ω⊥| i rad/s
 * @param {number} speed lufthastighetens størrelse i m/s
 * @returns {number} dimensjonsløs spin parameter
 */
export function spinParameter(perpendicularSpinRadPerSec, speed) {
  return (ballRadius * perpendicularSpinRadPerSec) / speed;
}

/**
 * Løftkoeffisient.
 *
 *   Cl = 0.4072 × max(0, S)^0.4                                 (spec §5.7)
 *
 * Klampen på 0 er den eneste behandlingen av negativ S. Motoren modellerer
 * ikke revers-Magnus; `aeroModelIdentity.reverseMagnusPolicy` sier det rett ut.
 *
 * @param {number} spinParameterValue S
 * @returns {number} Cl
 */
export function liftCoefficient(spinParameterValue) {
  return (
    liftCoefficientFactor *
    Math.max(0, spinParameterValue) ** liftCoefficientExponent
  );
}

/**
 * Koeffisientbroens rå dragledd, uten kompatibilitetsskaleringen.
 *
 *   CdBridge = 0.2016141765
 *            + 0.0463816544 / (1 + exp((Re − 85000) / 9000))
 *            + 0.06 × S / (0.15 + S)                            (spec §5.7)
 *
 * Tredje ledd leses venstre-mot-høyre: `(0.06 × S) / (0.15 + S)`.
 *
 * @param {number} reynolds
 * @param {number} spinParameterValue
 * @returns {number} CdBridge
 */
export function dragBridge(reynolds, spinParameterValue) {
  return (
    dragBridgeBase +
    dragBridgeReynoldsAmplitude /
      (1 +
        Math.exp(
          (reynolds - dragBridgeReynoldsMidpoint) / dragBridgeReynoldsWidth,
        )) +
    (dragBridgeSpinAmplitude * spinParameterValue) /
      (dragBridgeSpinHalf + spinParameterValue)
  );
}

/**
 * Dragkoeffisient.
 *
 *   Cd = CdBridge × 1.275116456035                              (spec §5.7)
 *
 * Faktoren er en fast 7-jern-kompatibilitetskalibrering for curve-solven, ikke
 * en fysisk egenskap ved ballen. Spec §5.7 sier det eksplisitt. Den hører til
 * her likevel, fordi det er her dagens motor har den.
 *
 * @param {number} reynolds
 * @param {number} spinParameterValue
 * @returns {number} Cd
 */
export function dragCoefficient(reynolds, spinParameterValue) {
  return dragBridge(reynolds, spinParameterValue) * dragCompatibilityScale;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Vektorlaget — ett RK4-derivatkall
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Komponenten av spinnvektoren som står vinkelrett på lufthastigheten,
 * `ω − (ω·û)û`. Se punkt 4 i filhodet for hvorfor det ikke er et kryssprodukt.
 *
 * @param {readonly number[]} spinVector ω i rad/s, [x,y,z]
 * @param {readonly number[]} unitAirVelocity û, [x,y,z]
 * @returns {number[]} ω⊥ i rad/s, [x,y,z]
 */
export function perpendicularSpin(spinVector, unitAirVelocity) {
  const alongAxis =
    spinVector[0] * unitAirVelocity[0] +
    spinVector[1] * unitAirVelocity[1] +
    spinVector[2] * unitAirVelocity[2];
  return [
    spinVector[0] - alongAxis * unitAirVelocity[0],
    spinVector[1] - alongAxis * unitAirVelocity[1],
    spinVector[2] - alongAxis * unitAirVelocity[2],
  ];
}

/**
 * Alle aerodynamiske størrelser for ETT integrasjonssteg.
 *
 * Ren funksjon. Ingen kraft beregnes her — `dragForce` og `liftForce` skalerer
 * `dragCoefficient` og `liftCoefficient` med `0.5 ρ π r² speed²`, og det leddet
 * eier integratoren, ikke koeffisientbroen.
 *
 * Returnerer `null` når lufthastigheten er null. Det er ikke defensiv koding;
 * det er baseline-atferd, målt. Se punkt 6 i filhodet.
 *
 * @param {readonly number[]} velocity ballens hastighet i m/s, [x,y,z]
 * @param {readonly number[]} spinVector ω i rad/s, [x,y,z]
 * @param {readonly number[]} [windVector] vind i m/s; spec §5.7 er null vind
 * @returns {{
 *   airVelocity: number[],
 *   speed: number,
 *   unitAirVelocity: number[],
 *   spinPerpendicular: number[],
 *   spinPerpendicularMagnitude: number,
 *   reynolds: number,
 *   spinParameter: number,
 *   liftCoefficient: number,
 *   dragBridge: number,
 *   dragCoefficient: number,
 * } | null}
 */
export function aeroStep(velocity, spinVector, windVector = wind) {
  const airVelocity = [
    velocity[0] - windVector[0],
    velocity[1] - windVector[1],
    velocity[2] - windVector[2],
  ];
  const speed = Math.hypot(airVelocity[0], airVelocity[1], airVelocity[2]);
  if (!(speed > 0)) return null;

  // Resiprok multiplikasjon, ikke divisjon. Se punkt 5 i filhodet.
  const inverseSpeed = 1 / speed;
  const unitAirVelocity = [
    airVelocity[0] * inverseSpeed,
    airVelocity[1] * inverseSpeed,
    airVelocity[2] * inverseSpeed,
  ];
  const spinPerpendicular = perpendicularSpin(spinVector, unitAirVelocity);
  const spinPerpendicularMagnitude = Math.hypot(
    spinPerpendicular[0],
    spinPerpendicular[1],
    spinPerpendicular[2],
  );

  const s = spinParameter(spinPerpendicularMagnitude, speed);
  const reynolds = reynoldsNumber(speed);
  const bridge = dragBridge(reynolds, s);

  return {
    airVelocity,
    speed,
    unitAirVelocity,
    spinPerpendicular,
    spinPerpendicularMagnitude,
    reynolds,
    spinParameter: s,
    liftCoefficient: liftCoefficient(s),
    dragBridge: bridge,
    dragCoefficient: bridge * dragCompatibilityScale,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Observerte min/maks
 *
 * Motoren bokfører Reynolds og S ved HVERT derivatkall — alle fire RK4-stadier
 * per steg, ikke bare den aksepterte tilstanden. Bevist av `edge.club-speed-zero`
 * (se punkt 6 i filhodet): minimum der er halvstegets verdi, som bare finnes
 * inne i k2/k3.
 *
 * Akkumulatoren er en verdi, ikke et objekt med metoder: `observeAero`
 * returnerer en NY observasjon og muterer ingenting. Ingen skjult tilstand.
 * ───────────────────────────────────────────────────────────────────────── */

/** Nøytralt element. Ingen prøver tatt. */
export const emptyAeroObservation = Object.freeze({
  samples: 0,
  reynoldsMinimum: Infinity,
  reynoldsMaximum: -Infinity,
  spinParameterMinimum: Infinity,
  spinParameterMaximum: -Infinity,
});

/**
 * Bokfør én prøve. `null` — altså speed 0 — bokføres ikke og gir observasjonen
 * uendret tilbake.
 *
 * @param {typeof emptyAeroObservation} observation
 * @param {{reynolds: number, spinParameter: number} | null} sample
 * @returns {typeof emptyAeroObservation} ny observasjon
 */
export function observeAero(observation, sample) {
  if (sample === null || sample === undefined) return observation;
  const { reynolds } = sample;
  const s = sample.spinParameter;
  return {
    samples: observation.samples + 1,
    reynoldsMinimum:
      reynolds < observation.reynoldsMinimum
        ? reynolds
        : observation.reynoldsMinimum,
    reynoldsMaximum:
      reynolds > observation.reynoldsMaximum
        ? reynolds
        : observation.reynoldsMaximum,
    spinParameterMinimum:
      s < observation.spinParameterMinimum
        ? s
        : observation.spinParameterMinimum,
    spinParameterMaximum:
      s > observation.spinParameterMaximum
        ? s
        : observation.spinParameterMaximum,
  };
}

/**
 * De to observerte intervallene, på fixturens form `[minimum, maksimum]`.
 *
 * Uten prøver finnes ikke et intervall, og begge er `null`. Ingen baseline-case
 * treffer den grenen — alle 5028 har endelige intervaller, også `clubSpeed: 0`.
 * `_meta.units` erklærer likevel `extrapolated` som «boolean or null», så null-
 * grenen er motorens egen erklærte mulighet, ikke en oppfinnelse her.
 *
 * @param {typeof emptyAeroObservation} observation
 * @returns {{reynoldsRangeObserved: number[]|null, spinParameterRangeObserved: number[]|null}}
 */
export function observedAeroRanges(observation) {
  if (observation.samples === 0) {
    return { reynoldsRangeObserved: null, spinParameterRangeObserved: null };
  }
  return {
    reynoldsRangeObserved: Object.freeze([
      observation.reynoldsMinimum,
      observation.reynoldsMaximum,
    ]),
    spinParameterRangeObserved: Object.freeze([
      observation.spinParameterMinimum,
      observation.spinParameterMaximum,
    ]),
  };
}

/**
 * Ligger hele det observerte intervallet innenfor gyldighetsintervallet?
 * Inklusive endepunkter i begge ender.
 *
 * @param {readonly number[]|null} range [min, maks]
 * @param {readonly number[]} validity [min, maks]
 * @returns {boolean|null} null når intervallet ikke finnes
 */
export function withinValidity(range, validity) {
  if (range === null) return null;
  return range[0] >= validity[0] && range[1] <= validity[1];
}

/**
 * `extrapolated` — banen forlot koeffisientbroens deklarerte gyldighetsområde.
 *
 *   extrapolated = !(Re ⊆ [70000, 210000] og S ⊆ [0.08, 0.20])
 *
 * Verifisert mot alle 5028 caser: 0 avvik. Hverken hastighet, launch, carry,
 * clamps eller RK4-diagnostikk inngår.
 *
 * FUNN F2: dette er `true` i 4505 av 5028 caser (89.6 %) og i 87 % av det
 * realistiske båndet, fordi S = Rω/v stiger mot slutten av HVER bane. Feltet er
 * en modellgrense, ikke en advarsel. Ikke bygg UI på det.
 *
 * @param {readonly number[]|null} reynoldsRangeObserved
 * @param {readonly number[]|null} spinParameterRangeObserved
 * @returns {boolean|null}
 */
export function isExtrapolated(
  reynoldsRangeObserved,
  spinParameterRangeObserved,
) {
  const reynoldsOk = withinValidity(reynoldsRangeObserved, reynoldsValidity);
  const spinOk = withinValidity(
    spinParameterRangeObserved,
    spinParameterValidity,
  );
  if (reynoldsOk === null || spinOk === null) return null;
  return !(reynoldsOk && spinOk);
}

/**
 * `out.aerodynamicDiagnostics`, bygget av en ferdig observasjon.
 *
 * Feltrekkefølgen er fixturens egen og er del av kontrakten — testen
 * sammenligner nøkkelrekkefølge, ikke bare verdier.
 *
 * `coefficientSetId`, `validityKnown` og `reverseMagnusPolicy` er provenance
 * fra `constants.aeroModelIdentity`. De er data motoren faktisk emitterer, ikke
 * brukervendt tekst, og skal ikke rendres som kopi.
 *
 * @param {typeof emptyAeroObservation} observation
 * @returns {Readonly<object>}
 */
export function aerodynamicDiagnostics(observation) {
  const { reynoldsRangeObserved, spinParameterRangeObserved } =
    observedAeroRanges(observation);
  return Object.freeze({
    coefficientSetId: aeroModelIdentity.coefficientSetId,
    validityKnown: aeroModelIdentity.validityKnown,
    reynoldsValidity,
    spinParameterValidity,
    reynoldsRangeObserved,
    spinParameterRangeObserved,
    extrapolated: isExtrapolated(
      reynoldsRangeObserved,
      spinParameterRangeObserved,
    ),
    reverseMagnusPolicy: aeroModelIdentity.reverseMagnusPolicy,
  });
}
