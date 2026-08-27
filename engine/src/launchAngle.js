/**
 * §5.3 — Launch Angle.
 *
 * BASELINE. Modulen reproduserer dagens motor. Fire ledd, ingen mer:
 *
 *   interceptBlend = clamp(DynamicLoft / 10, 0, 1)
 *
 *   LaunchAngle = launchIntercept        × interceptBlend
 *               + launchLoftW            × DynamicLoft
 *               + launchLoftQuadratic    × DynamicLoft²
 *               + launchAttackW          × AttackAngle
 *
 * Interceptet fases ut under 10° loft slik at 0° loft ikke gir et kunstig
 * positivt launch. Over 10° er blenden mettet på 1 og interceptet er konstant.
 *
 * Rene funksjoner. Ingen tilstand, ingen I/O, ingen presentasjonsdata.
 *
 * ⚠ FLYTTALLSREKKEFØLGE — ikke «rydd» uttrykket:
 *   - kvadratet er `dl * dl`, ikke `Math.pow(dl, 2)` og ikke `dl ** 2`;
 *   - de fire leddene summeres venstre-til-høyre i den rekkefølgen spec-en
 *     lister dem;
 *   - blenden er en divisjon `dl / 10`, ikke `dl * 0.1`.
 *   Verifisert bit-eksakt (maks avvik 0) mot alle 5028 løste flight-caser.
 *
 * MERK: `launchAngle` her er den uklampede modellverdien. Den kan være
 * negativ (f.eks. −3.75° ved DynamicLoft 0 og AttackAngle −15). Carry- og
 * apex-modellen i §5.6 gjør sin egen `max(0, LaunchAngle)`; det hører ikke
 * hjemme her.
 */

import {
  launchIntercept,
  launchLoftW,
  launchLoftQuadratic,
  launchAttackW,
  launchInterceptBlendFullAtDeg,
} from './constants.js';

/** clamp uten kortslutninger. NaN inn gir NaN ut, som i kildemotoren. */
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Utfasingsvekten for interceptet, `out.launchInterceptBlend`.
 *
 * Fixturen dekker DynamicLoft 0 … 50, så den øvre klampen (loft ≥ 10°) er
 * eksersert i 5028 caser mens den nedre aldri binder — 0/10 er allerede 0.
 * Den nedre klampen står likevel fordi spec-en har den; negativ DynamicLoft
 * er ikke representert i baseline.
 *
 * @param {number} dynamicLoftDeg Dynamic Loft i grader.
 * @returns {number} forhold i [0, 1].
 */
export function interceptBlend(dynamicLoftDeg) {
  return clamp(dynamicLoftDeg / launchInterceptBlendFullAtDeg, 0, 1);
}

/**
 * Launch Angle i grader, `out.launchAngle`.
 *
 * @param {number} dynamicLoftDeg Dynamic Loft i grader.
 * @param {number} attackAngleDeg Attack Angle i grader.
 * @returns {number} grader; kan være negativ.
 */
export function launchAngleDeg(dynamicLoftDeg, attackAngleDeg) {
  const blend = interceptBlend(dynamicLoftDeg);

  return (
    launchIntercept * blend +
    launchLoftW * dynamicLoftDeg +
    launchLoftQuadratic * (dynamicLoftDeg * dynamicLoftDeg) +
    launchAttackW * attackAngleDeg
  );
}

/**
 * Hele §5.3 som ett kall. Feltnavnene er fixturens egne.
 *
 * @param {{dynamicLoft: number, attackAngle: number}} input grader.
 * @returns {{launchAngle: number, launchInterceptBlend: number}}
 */
export function solveLaunchAngle({ dynamicLoft, attackAngle }) {
  return {
    launchAngle: launchAngleDeg(dynamicLoft, attackAngle),
    launchInterceptBlend: interceptBlend(dynamicLoft),
  };
}

/**
 * Koeffisientene §5.3 bruker, med fixturens feltnavn. `out` i
 * flight-golden.json bærer alle fire i hver eneste case, så en full
 * reproduksjon må kunne emittere dem. Frosset — dette er ikke en kilde til
 * skjult tilstand.
 *
 * @type {Readonly<{launchIntercept: number, launchLoftW: number,
 *                  launchLoftQuadratic: number, launchAttackW: number}>}
 */
export const launchModelCoefficients = Object.freeze({
  launchIntercept,
  launchLoftW,
  launchLoftQuadratic,
  launchAttackW,
});
