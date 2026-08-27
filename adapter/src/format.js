/**
 * FORMATERING — D28 (desimaler) og D29 (fortegn/bokstav), normativ tabell i
 * `DESIGN.md` («Tallformatering» og «Fortegn og retning»).
 *
 * Laget er rent tekstlig: ingen konvertering her (den bor i `convert.js`),
 * ingen fysikk, ingen enhetvalg-logikk. Inn kommer et tall som ALLEREDE er i
 * visningsenheten; ut kommer strengen brukeren ser.
 *
 * Reglene, ordrett fra DESIGN.md:
 *   vinkler 1 desimal · avstander 1 · spinn heltall med tynt mellomrom ·
 *   smash 3 · fart 1.
 *   Avstander bærer bokstav (L/R/C), vinkler bærer fortegn. Aldri begge.
 *   Tusenskille er U+2009, aldri komma eller punktum.
 *
 * Minustegnet er U+2212 (typografisk minus), som i DESIGN.md sine egne
 * eksempler (`−16.3°`). ASCII-bindestrek forekommer ikke i noen visningsverdi.
 *
 * Fortegn og bokstav avgjøres av verdien ETTER avrunding: en spinAxis på
 * −0.04° runder til 0.0 og vises som `0.0°`, ikke `−0.0°` — et fortegn på en
 * verdi som viser null er en påstand avrundingen ikke lenger dekker. Samme
 * regel gir `0.0 m C` for en side på −0.03 m.
 *
 * Kontrakt som i motoren (spec §3): endelige tall inn, ellers kast.
 */

/** Typografisk minus, U+2212 — DESIGN.md sine eksempler bruker den. */
export const MINUS = '\u2212';

/** Tynt mellomrom, U+2009 — DESIGN.md: eneste lovlige tusenskille. */
export const THIN_SPACE = '\u2009';

function assertFinite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} må være et endelig tall, fikk ${String(value)}.`);
  }
}

/**
 * Magnitudestreng med fast antall desimaler. `toFixed` på absoluttverdien,
 * så fortegnshåndteringen er adskilt fra sifrene og `-0.0` aldri kan oppstå.
 */
function magnitude(value, decimals) {
  return Math.abs(value).toFixed(decimals);
}

/**
 * Vinkel, 1 desimal (D28).
 *
 * `signed: true`  → retningsbærende vinkel (D29): `−16.3°` · `+5.0°` · `0.0°`.
 * `signed: false` → vinkel uten retning: `14.5°`. Skulle verdien likevel være
 * negativ vises minus — formatering skjuler aldri data.
 *
 * @param {number} deg vinkel i grader
 * @param {{signed?: boolean}} [opts]
 * @returns {string}
 */
export function formatAngle(deg, { signed = false } = {}) {
  assertFinite(deg, 'deg');
  const mag = magnitude(deg, 1);
  if (Number(mag) === 0) return `0.0°`;
  const sign = deg < 0 ? MINUS : signed ? '+' : '';
  return `${sign}${mag}°`;
}

/**
 * Avstand uten retning — carry, total, apex. 1 desimal (D28), enhet etter
 * vanlig mellomrom: `173.5 m` · `189.8 yd`.
 *
 * @param {number} value avstand i VISNINGSENHETEN (konvertert først)
 * @param {'m'|'yd'} unit
 * @returns {string}
 */
export function formatDistance(value, unit) {
  assertFinite(value, 'value');
  const mag = magnitude(value, 1);
  const sign = Number(mag) !== 0 && value < 0 ? MINUS : '';
  return `${sign}${mag} ${unit}`;
}

/**
 * Sideveis avstand — curve, side. Bokstav, aldri fortegn (D29):
 * `16.3 m L` · `4.1 m R` · `0.0 m C`.
 *
 * Fortegnskonvensjon fra spec §4 (høyrehendt golfer): positiv = høyre.
 * Bokstaven avgjøres etter avrunding: runder verdien til 0.0 er den `C`.
 *
 * @param {number} value avstand i VISNINGSENHETEN, signert (+ = høyre)
 * @param {'m'|'yd'} unit
 * @returns {string}
 */
export function formatLateral(value, unit) {
  assertFinite(value, 'value');
  const mag = magnitude(value, 1);
  const letter = Number(mag) === 0 ? 'C' : value > 0 ? 'R' : 'L';
  return `${mag} ${unit} ${letter}`;
}

/**
 * Spinn — heltall med tynt mellomrom som tusenskille (D28): `3 173 rpm`
 * (mellomrommet er U+2009).
 *
 * @param {number} rpm
 * @returns {string}
 */
export function formatSpin(rpm) {
  assertFinite(rpm, 'rpm');
  const n = Math.round(Math.abs(rpm));
  const grouped = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
  const sign = n !== 0 && rpm < 0 ? MINUS : '';
  return `${sign}${grouped} rpm`;
}

/**
 * Smash factor — 3 desimaler, ingen enhet (D28): `1.451`.
 * Eneste metrikk der tredje desimal bærer mening.
 *
 * @param {number} ratio
 * @returns {string}
 */
export function formatSmash(ratio) {
  assertFinite(ratio, 'ratio');
  const mag = magnitude(ratio, 3);
  const sign = Number(mag) !== 0 && ratio < 0 ? MINUS : '';
  return `${sign}${mag}`;
}

/**
 * Fart — 1 desimal, alltid mph (D28, D57): `130.6 mph`.
 *
 * @param {number} mph
 * @returns {string}
 */
export function formatSpeed(mph) {
  assertFinite(mph, 'mph');
  const mag = magnitude(mph, 1);
  const sign = Number(mag) !== 0 && mph < 0 ? MINUS : '';
  return `${sign}${mag} mph`;
}
