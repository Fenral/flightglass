/**
 * §5.5 — Smash og Ball Speed.
 *
 * BASELINE. Reproduserer kilde-commit 410a365d47de5c7a1542edc71d0336cd5b7d1b56
 * eksakt. Ingen forbedring, ingen opprydding. Fixturen er fasit.
 *
 * Tre felt eies her:
 *
 *   smashEff  — modellverdien. Kvadratisk i SPIN LOFT 3D, klampet til
 *               [1.15, 1.52]. Uavhengig av clubSpeed; den er 1.4255…
 *               også når clubSpeed er 0.
 *   ballSpeed — clubSpeed × smashEff, i mph.
 *   smash     — ballSpeed / clubSpeed, altså smashEff etter en rundtur gjennom
 *               én multiplikasjon og én divisjon. Det er IKKE det samme tallet:
 *               i 372 av 5028 baseline-caser skiller `smash` og `smashEff` seg
 *               på siste bit. Behold rundturen.
 *
 * Spec §5.5:
 *
 *   smashEfficiency = clamp(
 *     1.544034400161688
 *     − 0.0033788247838473073 × SpinLoft
 *     − 0.00006496570484201677 × SpinLoft²,
 *     1.15,
 *     1.52
 *   )
 *   BallSpeed = ClubSpeed × smashEfficiency
 *
 * Alle numeriske konstanter kommer fra `constants.js`. Ingen tall hardkodes her.
 */

import {
  smashModelIntercept,
  smashSpinLoftLinear,
  smashSpinLoftQuadratic,
  smashMinimum,
  smashMaximum,
} from './constants.js';

/**
 * Lokal clamp. `src/math.js` er ikke lagt ennå, og denne modulen eier bare sin
 * egen fil — derfor står den her og ikke i en fellesmodul. Flyttes dit når
 * math-modulen finnes; rekkefølgen `min(max(v, lo), hi)` må da følge med.
 *
 * Rekkefølgen er verifisert irrelevant mot fixturen (begge retninger gir
 * 5028/5028 bit-eksakt), men holdes fast slik at en senere NaN- eller
 * −0-diskusjon ikke flytter baseline i stillhet.
 */
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Den ukalmpede smash-modellen. Eksponert fordi klampen fyrer ofte — 290 caser
 * treffer gulvet på 1.15 og 127 treffer taket på 1.52 i baseline — og fordi
 * en senere fase vil ville se råverdien uten å reimplementere polynomet.
 *
 * ⚠ ULP-FELLE, VERIFISERT MOT FIXTUREN. Kvadratleddet må grupperes som
 * `koeffisient × (SpinLoft × SpinLoft)`. Den venstreassosiative formen
 * `koeffisient × SpinLoft × SpinLoft`, altså `(k × S) × S`, avviker 1 ULP i
 * 78 av 5028 caser. `S ** 2` og `Math.pow(S, 2)` er begge bit-identiske med
 * den grupperte formen og er også trygge. Ikke «rydd» parentesen bort.
 *
 * @param {number} spinLoftDeg 3-D spin loft i grader, ikke-negativ.
 *   Dette er `spinLoft3DDeg`, IKKE `signedVerticalSpinLoftDeg`. De to skiller
 *   seg i 4392 av 5028 caser; bruker man den vertikale, blir 4122 caser feil.
 * @returns {number} smash-forhold før clamp
 */
export function smashEfficiencyRaw(spinLoftDeg) {
  const spinLoftSquared = spinLoftDeg * spinLoftDeg;
  return (
    smashModelIntercept +
    smashSpinLoftLinear * spinLoftDeg +
    smashSpinLoftQuadratic * spinLoftSquared
  );
}

/**
 * `smashEff` — modellert smash-faktor, klampet til [1.15, 1.52].
 *
 * @param {number} spinLoftDeg 3-D spin loft i grader
 * @returns {number} klampet smash-forhold
 */
export function smashEfficiency(spinLoftDeg) {
  return clamp(smashEfficiencyRaw(spinLoftDeg), smashMinimum, smashMaximum);
}

/**
 * `ballSpeed` — spec §5.5: `BallSpeed = ClubSpeed × smashEfficiency`.
 * Inn og ut i mph; ingen enhetskonvertering skjer i §5.5.
 *
 * @param {number} clubSpeedMph
 * @param {number} smashEff klampet smash-forhold fra {@link smashEfficiency}
 * @returns {number} ballhastighet i mph
 */
export function ballSpeedFrom(clubSpeedMph, smashEff) {
  return clubSpeedMph * smashEff;
}

/**
 * `smash` — det RAPPORTERTE forholdet, ikke modellverdien.
 *
 * Fixturens `_meta.units.smash`: «ratio; ballSpeed / clubSpeed, or 0 when
 * clubSpeed is 0». Vakten er nødvendig: uten den gir clubSpeed 0 en 0/0 = NaN,
 * og fixturen inneholder ikke ett eneste ikke-endelig tall.
 *
 * Divisjonen er ikke overflødig. `ballSpeed / clubSpeed` er en rundtur som
 * mister siste bit i 372 caser, og fixturen har den tapte biten. Ikke erstatt
 * kroppen med `smashEff`.
 *
 * @param {number} clubSpeedMph
 * @param {number} ballSpeedMph
 * @returns {number} rapportert smash-forhold
 */
export function smashFactor(clubSpeedMph, ballSpeedMph) {
  return clubSpeedMph === 0 ? 0 : ballSpeedMph / clubSpeedMph;
}

/**
 * Hele §5.5 i ett kall.
 *
 * @param {{clubSpeed: number, spinLoft: number}} input
 *   `clubSpeed` i mph. `spinLoft` er 3-D spin loft i grader (`spinLoft3DDeg`).
 * @returns {{smash: number, smashEff: number, ballSpeed: number}}
 */
export function solveSmashBallSpeed({ clubSpeed, spinLoft }) {
  const smashEff = smashEfficiency(spinLoft);
  const ballSpeed = ballSpeedFrom(clubSpeed, smashEff);
  const smash = smashFactor(clubSpeed, ballSpeed);

  return { smash, smashEff, ballSpeed };
}
