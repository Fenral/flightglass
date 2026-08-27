/**
 * VISNINGSADAPTER FOR IMPACT STUDIO — D65/D66/D67 pluss eierens presisering
 * av akseordene (2026-08-25, strøm B):
 *
 *   Langsgående akse (ball position, low point, entry/exit):
 *     `before` / `after` — bransjebegrepet fra launch monitor-litteraturen
 *     (TrackMan rapporterer low point som B/A). Positiv retning er målsiden,
 *     samme fortegnskonvensjon som motoren (`+x = target`).
 *   Vertikal akse mot bakkeplanet (arc height): `above` / `below`.
 *   Vertikal akse på slagflaten (treffpunkt): `high` / `low` — matcher
 *     Low/Centre/High-båndene fra `strikeBand.js`.
 *
 * Prinsippet er D29/D67: avstander bærer ord, aldri nakent fortegn.
 * L/R/C er lateralaksen; dette er samme grammatikk på de tre andre aksene.
 *
 * Desimaler (D67): mm 1 · cm 1. Unntak: lie-presetene vises som heltall —
 * de er definerte konstanter, ikke målinger, og `8.0 mm` ville påstått en
 * målepresisjon som ikke finnes (eierens valg 2026-08-25).
 *
 * Ordet avgjøres av verdien ETTER avrunding, som i `format.js`: en verdi som
 * runder til 0.0 vises uten retningsord — `0.0 cm`, aldri `0.0 cm after`.
 *
 * Studios mm/cm-verdier er enhetsuavhengige (D57) — ingen unitSystem her.
 * Rent tekstlag: ingen fysikk, ingen geometri. Endelige tall inn, ellers kast.
 */

function assertFinite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} må være et endelig tall, fikk ${String(value)}.`);
  }
}

/** Magnitude med fast desimaltall — fortegn håndteres som ord, aldri som tegn. */
function magnitude(value, decimals) {
  return Math.abs(value).toFixed(decimals);
}

/**
 * Langsgående avstand i centimeter — ball position, low point, entry/exit.
 * `10.5 cm after` · `3.0 cm before` · `0.0 cm`.
 *
 * @param {number} cm signert; positiv = målsiden (motorens +x)
 * @returns {string}
 */
export function formatLongitudinalCm(cm) {
  assertFinite(cm, 'cm');
  const mag = magnitude(cm, 1);
  if (Number(mag) === 0) return '0.0 cm';
  return `${mag} cm ${cm > 0 ? 'after' : 'before'}`;
}

/**
 * Samme akse, meter inn — motorens `effectiveLowPointX`, `groundEntry.x`
 * osv. er meter. Konverteringen (× 100) bor her i adapterlaget, aldri i UI.
 *
 * @param {number} metres signert; positiv = målsiden
 * @returns {string}
 */
export function formatLongitudinalMetres(metres) {
  assertFinite(metres, 'metres');
  return formatLongitudinalCm(metres * 100);
}

/**
 * Vertikal avstand mot bakkeplanet i centimeter — arc height.
 * `2.0 cm above` · `2.0 cm below` · `0.0 cm`.
 *
 * @param {number} cm signert; positiv = over bakkeplanet
 * @returns {string}
 */
export function formatHeightCm(cm) {
  assertFinite(cm, 'cm');
  const mag = magnitude(cm, 1);
  if (Number(mag) === 0) return '0.0 cm';
  return `${mag} cm ${cm > 0 ? 'above' : 'below'}`;
}

/**
 * Treffpunktets avvik fra sweetspoten i millimeter (D24, absoluttmålet).
 * `16.6 mm low` · `2.1 mm high` · `0.0 mm`. Matcher Low/Centre/High-båndene.
 *
 * @param {number} mm signert; positiv = over sweetspoten
 * @returns {string}
 */
export function formatFaceOffsetMm(mm) {
  assertFinite(mm, 'mm');
  const mag = magnitude(mm, 1);
  if (Number(mag) === 0) return '0.0 mm';
  return `${mag} mm ${mm > 0 ? 'high' : 'low'}`;
}

/**
 * Lie-preset i millimeter — heltall fordi presetene er definisjoner
 * (`LIE_PRESETS`), ikke målinger. `8 mm` · `30 mm` · `0 mm`.
 *
 * @param {number} mm ikke-negativ presetverdi
 * @returns {string}
 */
export function formatLieMm(mm) {
  assertFinite(mm, 'mm');
  return `${Math.round(mm)} mm`;
}
