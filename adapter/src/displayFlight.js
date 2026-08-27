/**
 * VISNINGSADAPTEREN — binder spec §6-mappingen (UI-verdi → motorfelt) til
 * konverteringslaget (`convert.js`, D57) og formatlaget (`format.js`, D28/D29).
 *
 * Rekkefølgen er kontrakten: motor (yards/mph, urørt) → konverter → avrund.
 * Aldri omvendt. `100.04 yd` skal bli `91.5 m` (konverter så avrund), ikke
 * `91.4 m` (avrund så konverter).
 *
 * Adapteren REGNER INGENTING. Den leser ferdige felt fra `solveFlight` sitt
 * returobjekt og oversetter dem til visning. Finnes ikke tallet i `out`, kan
 * ikke adapteren vise det — det er §11 krav 1 sett fra visningssiden.
 *
 * Formatvalg per metrikk følger DESIGN.md «Fortegn og retning» (D29):
 *   fortegnsbærende vinkler   — startDirection, spinAxis, faceToPath og
 *                               inputekkoene faceAngle, clubPath, attackAngle:
 *                               retningen ER fortegnet («spin axis minus 16»)
 *   vinkler uten retning      — launchAngle, spinLoft, landingAngle,
 *                               dynamicLoft: magnituder uten retningsfortegn
 *   bokstavbærende avstander  — curve, side (L/R/C)
 *   avstander                 — carry, total, apex
 *   spinn/smash/fart          — egne D28-rader
 */

import {
  assertUnitSystem,
  distanceForDisplay,
  speedForDisplay,
} from './convert.js';
import {
  formatAngle,
  formatDistance,
  formatLateral,
  formatSmash,
  formatSpeed,
  formatSpin,
} from './format.js';

/**
 * Spec §6-tabellen, ordrett: UI-verdi → motorfelt. Merk `side` → `offline`.
 * `faceToPath` er ikke en §6-rad, men har egen rad i D28-tabellen og eies av
 * DIRECTION-linsen (D42) — motorfeltet finnes i `out` på alle 5028 caser.
 */
export const FLIGHT_DISPLAY = Object.freeze({
  launchDirection: Object.freeze({ field: 'startDirection', kind: 'signedAngle' }),
  spinAxis: Object.freeze({ field: 'spinAxis', kind: 'signedAngle' }),
  curve: Object.freeze({ field: 'curve', kind: 'lateralDistance' }),
  side: Object.freeze({ field: 'offline', kind: 'lateralDistance' }),
  launchAngle: Object.freeze({ field: 'launchAngle', kind: 'plainAngle' }),
  spinLoft: Object.freeze({ field: 'spinLoft', kind: 'plainAngle' }),
  backspin: Object.freeze({ field: 'backspin', kind: 'spin' }),
  landingAngle: Object.freeze({ field: 'landingAngle', kind: 'plainAngle' }),
  smash: Object.freeze({ field: 'smash', kind: 'smash' }),
  ballSpeed: Object.freeze({ field: 'ballSpeed', kind: 'speed' }),
  carry: Object.freeze({ field: 'carry', kind: 'distance' }),
  total: Object.freeze({ field: 'total', kind: 'distance' }),
  apex: Object.freeze({ field: 'apex', kind: 'distance' }),
  faceToPath: Object.freeze({ field: 'faceToPath', kind: 'signedAngle' }),
});

/** Inputekkoene — sliderne viser samme formatregler som avlesningene. */
export const INPUT_DISPLAY = Object.freeze({
  clubSpeed: Object.freeze({ field: 'clubSpeed', kind: 'speed' }),
  faceAngle: Object.freeze({ field: 'faceAngle', kind: 'signedAngle' }),
  clubPath: Object.freeze({ field: 'clubPath', kind: 'signedAngle' }),
  attackAngle: Object.freeze({ field: 'attackAngle', kind: 'signedAngle' }),
  dynamicLoft: Object.freeze({ field: 'dynamicLoft', kind: 'plainAngle' }),
});

/**
 * Én verdi fra motortall til visning.
 *
 * @param {string} kind en av kindene i tabellene over
 * @param {number} raw motorens tall, i motorens enhet
 * @param {'meters'|'yards'} unitSystem
 * @returns {{text: string, value: number, unit: string}}
 *   `value` er den KONVERTERTE, urundede verdien; `text` den avrundede
 *   strengen brukeren ser; `unit` visningsenheten.
 */
export function displayValue(kind, raw, unitSystem) {
  assertUnitSystem(unitSystem);
  switch (kind) {
    case 'signedAngle':
      return { text: formatAngle(raw, { signed: true }), value: raw, unit: 'deg' };
    case 'plainAngle':
      return { text: formatAngle(raw), value: raw, unit: 'deg' };
    case 'lateralDistance': {
      const { value, unit } = distanceForDisplay(raw, unitSystem);
      return { text: formatLateral(value, unit), value, unit };
    }
    case 'distance': {
      const { value, unit } = distanceForDisplay(raw, unitSystem);
      return { text: formatDistance(value, unit), value, unit };
    }
    case 'spin':
      return { text: formatSpin(raw), value: raw, unit: 'rpm' };
    case 'smash':
      return { text: formatSmash(raw), value: raw, unit: 'ratio' };
    case 'speed': {
      const { value, unit } = speedForDisplay(raw);
      return { text: formatSpeed(value), value, unit };
    }
    default:
      throw new TypeError(`ukjent visningskind: ${String(kind)}`);
  }
}

/**
 * Hele flight-avlesningen: de 13 §6-utfallene pluss faceToPath, som
 * visningsobjekter. Leser kun fra `out`; muterer aldri; regner aldri.
 *
 * @param {object} out returobjektet fra `solveFlight`
 * @param {'meters'|'yards'} unitSystem
 * @returns {Readonly<Record<string, {text: string, value: number, unit: string}>>}
 */
export function displayFlight(out, unitSystem) {
  assertUnitSystem(unitSystem);
  if (out === null || typeof out !== 'object') {
    throw new TypeError('displayFlight krever solveFlight sitt returobjekt.');
  }
  const view = {};
  for (const [key, spec] of Object.entries(FLIGHT_DISPLAY)) {
    view[key] = Object.freeze(displayValue(spec.kind, out[spec.field], unitSystem));
  }
  return Object.freeze(view);
}
