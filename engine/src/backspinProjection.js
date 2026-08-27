/**
 * backspinProjection — projeksjon av D-plane-spinnvektoren på flukt-relative
 * akser.  ENGINE-GAPS §5 (og §1 for `spinVectorRadPerSec`).
 *
 * BASELINE. Reproduserer dagens motor, inkludert operasjonsrekkefølgen.
 * Ingen forbedring, ingen opprydding. Fixturen er fasit.
 *
 * Alle fire feltene er ren geometri på toppen av tre verdier som allerede er
 * beregnet et annet sted i motoren: `launchAngle`, `startDirection`,
 * `spinAxisUnit` og `totalSpinRpm`. Ingenting her beregner spinn — det
 * flytter bare den ferdige spinnvektoren over i et annet aksesett.
 *
 * Verdensakser: x = høyre, y = mål, z = opp.
 *
 * ── Rekkefølge som er verifisert bit-eksakt mot flight-golden.json ────────
 *
 *   grader → radianer   `deg * degToRad`, altså `deg * (Math.PI / 180)`.
 *                       Den motsatte grupperingen (`deg * Math.PI / 180`)
 *                       gir 4908/5028 på `signedBackspinRpm`.
 *   normalisering       `Math.hypot(x, y, z)`, så `inv = 1 / n` og `v * inv`.
 *                       `Math.sqrt(x*x + y*y + z*z)` gir 3961/5028;
 *                       `v / n` i stedet for `v * inv` gir også færre treff.
 *   prikkprodukt        `((x·x) + (y·y)) + (z·z)`, venstreassosiativt.
 *                       Høyreassosiativt gir 3853/5028 på
 *                       `rightCurveSpinRpm`.
 *   rad/s               `magnitude = totalSpinRpm * rpmToRadPerSec` ÉN gang,
 *                       deretter `spinAxisUnit[i] * magnitude`. Å gange
 *                       komponentvis (`u[i] * T * w`) gir 3320/5028.
 *
 * Ikke bytt noen av disse. De er 1–2 ULP fra hverandre, og fixturen skiller.
 *
 * ── Hva spec-en ikke dekker ───────────────────────────────────────────────
 *
 * ENGINE-GAPS §5 beskriver `b` og `signedBackspinRpm`, men ikke aksen for
 * `rightCurveSpinRpm`. Den er utledet fra fixturen og er
 *
 *     m = unit(l × b)
 *
 * — «ned» i det launch-relative koordinatsystemet, med `rightCurveSpinRpm =
 * dot(spinAxisUnit, m) · totalSpinRpm`. Spinn om `m` gir Magnus-kraft
 * `ω × v` mot +x, altså høyrekurve, som stemmer med feltnavnet og
 * fortegnskonvensjonen i `_meta.units`. Formen gir 5028/5028 bit-eksakt.
 * `m` har ingen kollineær-gren slik `b` har; i de 100 casene der
 * `|dot(u, m)| = 1` er den eksakt 1, så en gren ville uansett ikke endret
 * noe.
 */

import {
  degToRad,
  rpmToRadPerSec,
  signedBackspinCollinearEpsilon,
  backspinAxisFallback,
} from './constants.js';

/* ── Lokale konstanter ──────────────────────────────────────────────────── */

/**
 * Verdens opp-akse, `z` i ENGINE-GAPS §5 (`b = unit(l × z)`).
 * Finnes ikke i `constants.js` — lagt her fordi denne modulen ikke eier den
 * filen. Flyttes dit hvis en annen modul trenger den.
 */
const worldUp = Object.freeze([0, 0, 1]);

/**
 * Fallback for høyrekurve-aksen når `l × b` degenererer.
 * Uoppnåelig i baseline: `l` er en enhetsvektor per konstruksjon og `b ⟂ l`,
 * så `|l × b| = 1`. Finnes bare for at `unitOr` alltid skal ha et svar.
 */
const rightCurveAxisFallback = Object.freeze([0, 0, 0]);

/* ── Vektorhjelpere ─────────────────────────────────────────────────────── */

/** Kryssprodukt. */
function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Prikkprodukt, venstreassosiativt. Rekkefølgen er load-bearing. */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Enhetsvektor, eller `fallback` når lengden ikke er positiv endelig.
 * `Math.hypot` + multiplikasjon med den resiproke lengden — se ULP-notatet
 * øverst.
 */
function unitOr(v, fallback) {
  const norm = Math.hypot(v[0], v[1], v[2]);
  if (!(norm > 0)) return fallback;
  const inverse = 1 / norm;
  return [v[0] * inverse, v[1] * inverse, v[2] * inverse];
}

/* ── Akser ──────────────────────────────────────────────────────────────── */

/**
 * Enhetsvektoren `l` for launchretningen. ENGINE-GAPS §1: `v₀` er denne
 * ganget med ballfarten, så retningen er den samme uten farten.
 *
 * @param {number} launchAngleDeg grader over horisonten
 * @param {number} startDirectionDeg grader, positiv til høyre
 * @returns {[number, number, number]} enhetsvektor [x, y, z]
 */
export function launchDirectionUnit(launchAngleDeg, startDirectionDeg) {
  const elevation = launchAngleDeg * degToRad;
  const azimuth = startDirectionDeg * degToRad;
  return [
    Math.cos(elevation) * Math.sin(azimuth),
    Math.cos(elevation) * Math.cos(azimuth),
    Math.sin(elevation),
  ];
}

/**
 * Fluktrelativ backspin-akse. ENGINE-GAPS §5: `b = unit(l × z)`, fallback
 * `[1, 0, 0]` når krysset degenererer (`l` parallell med `z`, altså
 * launchAngle ±90°; forekommer ikke i baseline-fixturen).
 *
 * @param {readonly number[]} launchDirection `l`
 * @returns {readonly number[]} enhetsvektor `b`
 */
export function backspinAxis(launchDirection) {
  return unitOr(cross(launchDirection, worldUp), backspinAxisFallback);
}

/**
 * Fluktrelativ høyrekurve-akse `m = unit(l × b)`. Ikke dekket av
 * ENGINE-GAPS; utledet fra fixturen. Se notatet øverst.
 *
 * @param {readonly number[]} launchDirection `l`
 * @param {readonly number[]} backspinAxisUnit `b`
 * @returns {readonly number[]} enhetsvektor `m`
 */
export function rightCurveAxis(launchDirection, backspinAxisUnit) {
  return unitOr(cross(launchDirection, backspinAxisUnit), rightCurveAxisFallback);
}

/* ── Projeksjoner ───────────────────────────────────────────────────────── */

/**
 * Impact-spinnvektoren i rad/s. ENGINE-GAPS §1:
 * `ω₀ = uₛ · totalSpinRpm · (2π/60)`.
 *
 * @param {readonly number[]} spinAxisUnit `uₛ`
 * @param {number} totalSpinRpm
 * @returns {[number, number, number]} [x, y, z] rad/s
 */
export function spinVectorRadPerSec(spinAxisUnit, totalSpinRpm) {
  const magnitude = totalSpinRpm * rpmToRadPerSec;
  return [
    spinAxisUnit[0] * magnitude,
    spinAxisUnit[1] * magnitude,
    spinAxisUnit[2] * magnitude,
  ];
}

/**
 * Signert backspin i rpm. ENGINE-GAPS §5: `p = uₛ · b`; er
 * `|,|p| − 1,| < 1e-14` returneres `sign(p) · totalSpinRpm`, ellers
 * `p · totalSpinRpm`. Grenen bevarer et eksakt signert total når aksene er
 * numerisk kollineære — den slår inn på 692 av 5028 caser, og uten den
 * treffer bare 4533 bit-eksakt.
 *
 * Positiv betyr at D-plane-aksen peker med `launchDirection × up`.
 *
 * @param {readonly number[]} spinAxisUnit `uₛ`
 * @param {readonly number[]} backspinAxisUnit `b`
 * @param {number} totalSpinRpm
 * @returns {number} rpm
 */
export function signedBackspinRpm(spinAxisUnit, backspinAxisUnit, totalSpinRpm) {
  const projection = dot(spinAxisUnit, backspinAxisUnit);
  if (Math.abs(Math.abs(projection) - 1) < signedBackspinCollinearEpsilon) {
    return Math.sign(projection) * totalSpinRpm;
  }
  return projection * totalSpinRpm;
}

/**
 * Høyrekurve-spinn i rpm. Positiv = høyrekurve. Ingen kollineær-gren.
 *
 * @param {readonly number[]} spinAxisUnit `uₛ`
 * @param {readonly number[]} rightCurveAxisUnit `m`
 * @param {number} totalSpinRpm
 * @returns {number} rpm
 */
export function rightCurveSpinRpm(spinAxisUnit, rightCurveAxisUnit, totalSpinRpm) {
  return dot(spinAxisUnit, rightCurveAxisUnit) * totalSpinRpm;
}

/* ── Samlet ─────────────────────────────────────────────────────────────── */

/**
 * De fire offentlige feltene i ett kall.
 *
 * `backspin` er per spec absoluttverdien av `signedBackspinRpm`; de er ikke
 * uavhengige størrelser.
 *
 * @param {{launchAngle: number, startDirection: number,
 *          spinAxisUnit: readonly number[], totalSpinRpm: number}} input
 *   feltnavn som i `out` i flight-golden.json
 * @returns {{signedBackspinRpm: number, backspin: number,
 *            rightCurveSpinRpm: number,
 *            spinVectorRadPerSec: [number, number, number]}}
 */
export function backspinProjection({
  launchAngle,
  startDirection,
  spinAxisUnit,
  totalSpinRpm,
}) {
  const launchDirection = launchDirectionUnit(launchAngle, startDirection);
  const backspinAxisUnit = backspinAxis(launchDirection);
  const rightCurveAxisUnit = rightCurveAxis(launchDirection, backspinAxisUnit);

  const signed = signedBackspinRpm(spinAxisUnit, backspinAxisUnit, totalSpinRpm);

  return {
    signedBackspinRpm: signed,
    backspin: Math.abs(signed),
    rightCurveSpinRpm: rightCurveSpinRpm(
      spinAxisUnit,
      rightCurveAxisUnit,
      totalSpinRpm,
    ),
    spinVectorRadPerSec: spinVectorRadPerSec(spinAxisUnit, totalSpinRpm),
  };
}
