/**
 * KONVERTERING — det ENE stedet enheter byttes (D57, D58, spec §11 krav 5).
 *
 * Motoren regner i yards og mph og skal aldri røres av enhetsvalget (D27).
 * Denne modulen er hele konverteringslaget: finnes det en yard→meter-
 * multiplikasjon utenfor denne fila, er det en feil — og `tools/
 * lint-physics.mjs` feiler på den.
 *
 * D57 (2026-08-25): to enhetspakker.
 *   'meters'  → avstander i meter, fart i mph
 *   'yards'   → avstander i yards, fart i mph
 *
 * Fart er ALLTID mph i begge — golfens universelle enhet for kølle- og
 * ballfart. Enhetsuavhengig og upåvirket av valget: spinn (rpm), smash
 * (forholdstall), vinkler (grader) og Studios mm-verdier.
 *
 * Konverteringsfaktoren importeres fra motorens konstantregister framfor å
 * gjentas som literal her. Det er ikke pynt: linten forbyr yard→meter-
 * literalen utenfor engine/, så faktoren KAN ikke dupliseres uten at `npm test` feiler.
 *
 * Kontrakt som i motoren (spec §3): endelige tall inn, ellers kast.
 * Ingen parsing, ingen koersjon.
 */

import { yardToMetre } from '../../engine/src/constants.js';

/** De to enhetspakkene fra D57. Interne id-er, ikke brukervendt kopi. */
export const UNIT_SYSTEMS = Object.freeze(['meters', 'yards']);

/** @throws {TypeError} når `system` ikke er en av de to pakkene */
export function assertUnitSystem(system) {
  if (!UNIT_SYSTEMS.includes(system)) {
    throw new TypeError(
      `ukjent enhetssystem: ${String(system)}. Gyldige: ${UNIT_SYSTEMS.join(', ')} (D57).`,
    );
  }
}

function assertFinite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(
      `${name} må være et endelig tall, fikk ${String(value)}. ` +
        'Parsing og koersjon hører ikke hjemme i adapteren heller.',
    );
  }
}

/**
 * Avstand fra motor (yards) til visningsenhet. Verdien returneres URUNDET —
 * avrunding (D28) skjer i formatlaget, ETTER konvertering, aldri før.
 *
 * @param {number} yards motorens tall, urørt
 * @param {'meters'|'yards'} unitSystem
 * @returns {{value: number, unit: 'm'|'yd'}}
 */
export function distanceForDisplay(yards, unitSystem) {
  assertFinite(yards, 'yards');
  assertUnitSystem(unitSystem);
  if (unitSystem === 'yards') return { value: yards, unit: 'yd' };
  return { value: yards * yardToMetre, unit: 'm' };
}

/**
 * Fart. D57: alltid mph, uansett enhetspakke. Funksjonen finnes for at
 * kallstedene skal gå gjennom konverteringslaget også der svaret er
 * identitet — så regelen står ett sted, ikke implisitt i hvert kallsted.
 *
 * @param {number} mph motorens tall, urørt
 * @returns {{value: number, unit: 'mph'}}
 */
export function speedForDisplay(mph) {
  assertFinite(mph, 'mph');
  return { value: mph, unit: 'mph' };
}
