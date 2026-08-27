/**
 * SA · UNITS — brukerens enhetsvalg, ett sted (D27, D57, D103).
 *
 * D27 sier at brukeren velger enhet og kan endre den senere. D57 sier at det
 * finnes nøyaktig TO pakker: `meters` og `yards` — og at fart alltid er mph i
 * begge. D103 gjør valget til en KJØRETIDSVERDI: onboardingens enhetssteg
 * setter den, og visningslaget leser den.
 *
 * Denne modulen er preferansen, ikke konverteringen. Selve yard→meter-regningen
 * bor i `adapter/src/convert.js` og skal aldri dupliseres her — fysikklinten
 * håndhever det. Modulen her svarer kun på «hvilken pakke gjelder nå», og sier
 * fra når svaret endrer seg.
 *
 * Gyldigheten valideres mot adapterens egen `assertUnitSystem`, slik at det
 * finnes ÉN definisjon av hva en lovlig pakke er. Blir D57 utvidet, arves
 * utvidelsen hit uten at noen må huske å oppdatere to lister.
 *
 * FALLBACK er `meters` — samme verdi som `impact-outcome.js` hadde hardkodet
 * før D103. Det er bevisst ikke et nytt valg: onboardingen er obligatorisk
 * (D56), så fallbacken gjelder kun for en flate som åpnes før spørsmålet er
 * stilt, og da er dagens oppførsel det eneste svaret som ikke endrer noe.
 */

import { UNIT_SYSTEMS, assertUnitSystem } from '../../adapter/src/convert.js';

/** Versjonert nøkkel: en senere pakkeendring skal ikke arve et ugyldig svar. */
export const UNITS_STORAGE_KEY = 'fg.units.v1';

/** D103-fallbacken. Se filhodet — dette er status quo, ikke en preferanse. */
const FALLBACK = 'meters';

const listeners = new Set();

/** localStorage kaster i private/blokkerte kontekster. Preferansen er da
 *  en økt-verdi i stedet for en lagret verdi — aldri en feilmelding. */
let inMemory = null;

function readStored() {
  try {
    return localStorage.getItem(UNITS_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Har brukeren faktisk svart? Onboardingens gate (D56: ett obligatorisk
 * spørsmål) trenger å skille «valgte meter» fra «har ikke valgt».
 *
 * @returns {boolean}
 */
export function hasChosenUnits() {
  const stored = inMemory ?? readStored();
  return UNIT_SYSTEMS.includes(stored);
}

/**
 * Gjeldende enhetspakke.
 *
 * @returns {'meters'|'yards'}
 */
export function getUnitSystem() {
  const stored = inMemory ?? readStored();
  return UNIT_SYSTEMS.includes(stored) ? stored : FALLBACK;
}

/**
 * Sett pakken og varsle lytterne. Kaster på ugyldig verdi — kontrakten er
 * adapterens (spec §3-mønsteret: ingen koersjon, ingen stille retting).
 *
 * @param {'meters'|'yards'} system
 * @throws {TypeError} via assertUnitSystem
 */
export function setUnitSystem(system) {
  assertUnitSystem(system);
  if (getUnitSystem() === system && hasChosenUnits()) return;
  inMemory = system;
  try {
    localStorage.setItem(UNITS_STORAGE_KEY, system);
  } catch {
    // Økt-verdien i `inMemory` bærer valget videre uten lagring.
  }
  for (const fn of listeners) fn(system);
}

/**
 * Abonner på endringer. Kalles ikke ved registrering — den som trenger
 * startverdien leser `getUnitSystem()` selv.
 *
 * @param {(system: 'meters'|'yards') => void} fn
 * @returns {() => void} avmelding
 */
export function onUnitChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
