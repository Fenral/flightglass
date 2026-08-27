/**
 * §5.1 Startretning — `startDirection` og `startFaceW`.
 *
 * BASELINE. Reproduserer dagens motor eksakt. Ingen forbedring, ingen
 * opprydding. `motor/export/flight-golden.json` er fasit.
 *
 * Spec 01-PHYSICS-AND-MECHANICS-ENGINE.md §5.1, ordrett:
 *
 *   faceWeight = clamp(0.90 − 0.005 × DynamicLoft, 0.60, 0.88)
 *
 *   StartDirection =
 *     faceWeight × FaceAngle
 *     + (1 − faceWeight) × ClubPath
 *
 * Fixturen eksponerer vekten som `out.startFaceW` og resultatet som
 * `out.startDirection`. Begge er bit-eksakte mot denne implementasjonen i
 * 5028/5028 caser (avvik 0, ikke bare innenfor toleranse). Se
 * `test/startDirection.test.js`.
 *
 * Konstantene ligger i `src/constants.js` som `startFaceWIntercept`,
 * `startFaceWLoftSlope`, `startFaceWMinimum`, `startFaceWMaximum`.
 *
 * Ingen trigonometri her, så ULP-fellen for grader → radianer (se
 * engine/README.md) gjelder ikke denne modulen. Alle tre vinklene inn og
 * vinkelen ut er i grader hele veien.
 *
 * Ingen I/O. Ingen skjult tilstand. Ingen presentasjonsdata.
 */

import {
  startFaceWIntercept,
  startFaceWLoftSlope,
  startFaceWMinimum,
  startFaceWMaximum,
} from './constants.js';

/**
 * Lokal clamp. `src/math.js` er planlagt i README-ens modultabell, men finnes
 * ikke ennå, og denne modulen eier ikke den filen. Flyttes hit → dit når
 * math.js kommer; da skal denne fjernes, ikke dupliseres.
 *
 * Rekkefølgen `min(max(v, lo), hi)` er valgt bevisst: for endelige tall er den
 * identisk med `max(lo, min(v, hi))`, så baseline er ikke følsom for valget.
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
 * Face-vekten fra §5.1. Faller lineært med Dynamic Loft og klampes til
 * `[0.60, 0.88]`.
 *
 * BASELINE-DETALJ, ikke «fiks» den: taket på `0.88` gjør at interceptet `0.90`
 * aldri kan nås. Under `DynamicLoft = 4°` er vekten konstant `0.88`. Fixturen
 * viser dette direkte — `dynamicLoft: 0` gir `startFaceW: 0.88`, ikke `0.90`.
 *
 * Gulvet på `0.60` krever `DynamicLoft > 60°`, altså utenfor `declaredInputBounds`
 * (`dynamicLoft: [0, 50]`). Ingen av de 5028 casene i fixturen treffer det.
 * Grenen er derfor spec-belagt, men ikke fixture-belagt. Den beholdes uendret.
 * På nøyaktig `60°` gir `0.90 − 0.005 × 60` verdien `0.6000000000000001`, én ULP
 * over gulvet, så clampen biter først over `60°`. Flyttallsdetalj, ikke en bug.
 *
 * @param {number} dynamicLoft levert loft ved treff, i grader
 * @returns {number} face-vekt i `[0.60, 0.88]` — fixturens `startFaceW`
 */
export function startFaceWeight(dynamicLoft) {
  return clamp(
    startFaceWIntercept - startFaceWLoftSlope * dynamicLoft,
    startFaceWMinimum,
    startFaceWMaximum,
  );
}

/**
 * Blandingen fra §5.1, med vekten som eksplisitt input.
 *
 * Skrevet som `w × face + (1 − w) × path`, ikke den algebraisk like
 * `face + (1 − w) × (path − face)`. De to gir ulike siste-bit i flyttall, og
 * bare den første er bit-eksakt mot fixturen.
 *
 * Fortegn (spec §4, høyrehendt golfer): `+` = høyre for begge input og output.
 *
 * @param {number} faceAngle grader, `+` åpen/høyre
 * @param {number} clubPath grader, `+` in-to-out/høyre
 * @param {number} faceWeight fra {@link startFaceWeight}
 * @returns {number} startretning i grader, `+` = ballen starter høyre
 */
export function blendStartDirection(faceAngle, clubPath, faceWeight) {
  return faceWeight * faceAngle + (1 - faceWeight) * clubPath;
}

/**
 * §5.1 samlet. Ren funksjon.
 *
 * `clubSpeed` og `attackAngle` inngår ikke i §5.1 og ignoreres bevisst — de
 * kan sendes med slik at kalleren kan videresende hele shot state uendret.
 *
 * Ingen validering av input: spec §3 legger parsing og coercion i et separat
 * adapterlag, og en kastende sjekk her ville vært ny oppførsel, ikke baseline.
 *
 * @param {{faceAngle: number, clubPath: number, dynamicLoft: number}} shot
 * @returns {{startDirection: number, startFaceW: number}}
 */
export function solveStartDirection({ faceAngle, clubPath, dynamicLoft }) {
  const startFaceW = startFaceWeight(dynamicLoft);

  return {
    startDirection: blendStartDirection(faceAngle, clubPath, startFaceW),
    startFaceW,
  };
}
