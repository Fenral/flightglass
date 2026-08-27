/**
 * §5.2 — Eksakt sentrert D-plane-geometri.
 *
 * BASELINE. Denne modulen reproduserer dagens motor (kilde-commit
 * 410a365d47de5c7a1542edc71d0336cd5b7d1b56) bit-eksakt mot
 * `motor/export/flight-golden.json`: 5028 av 5028 caser, maks avvik 0 pa alle
 * atte felt. Ingenting her er ryddet, forbedret eller modernisert.
 *
 * Verdensakser (spec §4, hoyrehendt):
 *   x = golferens hoyre, y = mallinjen, z = opp
 *
 * Kjernen (spec §5.2), med A = attack, P = path, L = dynamic loft, F = face:
 *   v          = (cos A · sin P, cos A · cos P, sin A)
 *   n          = (cos L · sin F, cos L · cos F, sin L)
 *   SpinLoft3D = atan2(|v × n|, v · n) × 180/π
 *   axis       = normalize(v × n)
 *   SpinAxis   = −atan2(axis.z, hypot(axis.x, axis.y)) × 180/π
 *
 * `signedVerticalSpinLoftDeg = L − A` holdes separat fordi den prinsipale
 * 3D-vinkelen alltid er ikke-negativ.
 *
 * ── ULP-KRITISKE DETALJER (verifisert mot fixturen, ikke gjettet) ──────────
 *
 *  1. Grader → radianer er `deg * degToRad` (se constants.js). Den motsatte
 *     grupperingen `(deg * Math.PI) / 180` gir bare 4189/5028 pa `faceNormalUnit`.
 *
 *  2. `v` og `n` normaliseres IKKE. De er enhetsvektorer per konstruksjon, og
 *     et normaliseringssteg ville flyttet dem 1 ULP. Ra bygging gir 5028/5028.
 *
 *  3. Normalisering av kryssproduktet er `x * (1 / Math.hypot(x, y, z))`
 *     — multiplikasjon med den invertere, ikke divisjon, og `Math.hypot` med
 *     tre argumenter, ikke `Math.sqrt(x² + y² + z²)`:
 *
 *        hypot3 + multiplisere med invers   4999/4999  ← dette
 *        hypot3 + dividere                  2464/4999
 *        sqrt(sum) + multiplisere           3373/4999
 *        sqrt(sum) + dividere               1652/4999
 *
 *  4. `spinLoft3DDeg` er `Math.atan2(|v × n|, v · n) * radToDeg`. Grupperingen
 *     `* radToDeg` (ikke `* 180 / Math.PI`, ikke `/ Math.PI * 180`) gir 4648
 *     mot 3436 og 3498. |v × n| er `Math.hypot` med tre argumenter (4648 mot
 *     3450 for `Math.sqrt`).
 *
 * ── TO GRENER FIXTUREN KREVER OG SPEC-EN IKKE NEVNER ──────────────────────
 *
 *  A. `spinAxis` er eksakt 0 i alle 713 caser med `faceToPath === 0`, mens den
 *     rene vektorformelen gir opptil 3.6e-14 grader der. Ingen annen utgang har
 *     den avrundingen: samme case har `spinAxisUnit[2] = 1.07e-16` og
 *     `rightCurveSpinRpm = -8.7e-14` uavkortet i fixturen. Nullingen treffer
 *     altsa den offentlige skalaren alene — samme monster som ENGINE-GAPS §6
 *     dokumenterer for `curve` («forced to 0 when hasFlight = false or
 *     faceToPath = 0») i samme fil. Se `spinAxisDeg` for hva som ikke kan
 *     avgjores fra fixturen.
 *
 *  B. `spinLoft3DDeg` er eksakt `signedVerticalSpinLoftDeg` i alle 607 caser
 *     med `faceToPath === 0` OG positiv vertikal spin loft — men ikke i de 77
 *     med negativ, der fixturen folger den rene formelen. Dette KAN ikke vaere
 *     en ren funksjon av geometrien: speilparet (face 0, path 0, loft 0,
 *     attack ∓7.5) gir identisk |v × n| = 0.13052619222005157 og identisk
 *     v · n = 0.9914448613738104, men fixturen returnerer 7.5 for attack −7.5
 *     og 7.499999999999999 for attack +7.5. Motoren forgrener seg pa fortegnet.
 *     Verken `Math.max(raw, signed)` (4857/5028) eller `Math.abs(signed)`
 *     (4791/5028) treffer; bare grenen under gir 5028/5028.
 *
 * Ingen av de to grenene endrer noen verdi med mer enn 3.6e-14 grader. De er
 * med fordi baseline er baseline.
 */

import { degToRad, radToDeg } from './constants.js';

/**
 * Aksen `normalize` faller tilbake pa nar kryssproduktet degenererer, altsa
 * nar `v === n` (face = path og dynamic loft = attack). 29 caser i fixturen,
 * alle med `spinAxisUnit = [1, 0, 0]`.
 *
 * ⚠ Ligger her, ikke i constants.js, fordi den ikke er dokumentert i spec §5.2.
 * ENGINE-GAPS §5 dokumenterer samme fallback for backspin-aksen
 * (`constants.backspinAxisFallback`); at de to er like er observert, ikke gitt.
 */
const degenerateSpinAxisUnit = [1, 0, 0];

/* ── Vektorprimitiver ────────────────────────────────────────────────────── */

/**
 * Kryssprodukt `a × b`.
 * @param {readonly number[]} a
 * @param {readonly number[]} b
 * @returns {number[]} ny [x, y, z]
 */
export function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Skalarprodukt `a · b`. Summert venstre mot hoyre.
 * @param {readonly number[]} a
 * @param {readonly number[]} b
 * @returns {number}
 */
export function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Lengden av en vektor. `Math.hypot` med tre argumenter — se punkt 3 i
 * filhodet; `Math.sqrt(x² + y² + z²)` er ikke det samme tallet.
 * @param {readonly number[]} v
 * @returns {number}
 */
export function magnitude(v) {
  return Math.hypot(v[0], v[1], v[2]);
}

/**
 * Normaliserer en vektor ved a multiplisere med den inverse lengden.
 * Degenerert vektor (lengde 0) gir `degenerateSpinAxisUnit`.
 * @param {readonly number[]} v
 * @returns {number[]} ny [x, y, z]
 */
export function normalize(v) {
  const length = magnitude(v);
  if (!(length > 0)) return [...degenerateSpinAxisUnit];
  const inverse = 1 / length;
  return [v[0] * inverse, v[1] * inverse, v[2] * inverse];
}

/* ── §5.2 byggeklosser ───────────────────────────────────────────────────── */

/**
 * Normert kollehastighetsvektor `v = (cos A · sin P, cos A · cos P, sin A)`.
 * Enhetsvektor per konstruksjon; normaliseres bevisst ikke.
 *
 * @param {number} attackAngleDeg A
 * @param {number} clubPathDeg    P
 * @returns {number[]} [x, y, z]
 */
export function clubVelocityUnit(attackAngleDeg, clubPathDeg) {
  const a = attackAngleDeg * degToRad;
  const p = clubPathDeg * degToRad;
  return [Math.cos(a) * Math.sin(p), Math.cos(a) * Math.cos(p), Math.sin(a)];
}

/**
 * Face-normal `n = (cos L · sin F, cos L · cos F, sin L)`.
 * Enhetsvektor per konstruksjon; normaliseres bevisst ikke.
 *
 * @param {number} dynamicLoftDeg L
 * @param {number} faceAngleDeg   F
 * @returns {number[]} [x, y, z]
 */
export function faceNormalUnit(dynamicLoftDeg, faceAngleDeg) {
  const l = dynamicLoftDeg * degToRad;
  const f = faceAngleDeg * degToRad;
  return [Math.cos(l) * Math.sin(f), Math.cos(l) * Math.cos(f), Math.sin(l)];
}

/**
 * Sentrert D-plane-akse `uₛ = normalize(v × n)`.
 *
 * ENGINE-GAPS §1: RK4 initialiserer `ω₀ = uₛ · totalSpinRpm · (2π/60)` fra
 * DENNE vektoren. Skalaren `spinAxis` kan ikke rekonstruere den (FUNN F3), sa
 * vektoren ma eksponeres.
 *
 * @param {readonly number[]} velocityUnit v
 * @param {readonly number[]} normalUnit   n
 * @returns {number[]} [x, y, z]
 */
export function spinAxisUnit(velocityUnit, normalUnit) {
  return normalize(cross(velocityUnit, normalUnit));
}

/**
 * `signedVerticalSpinLoft = DynamicLoft − AttackAngle` (spec §5.2).
 * Holdes separat fra den prinsipale 3D-vinkelen, som alltid er ikke-negativ.
 * ENGINE-GAPS §3: Outcome-adapteren bygger `inDomain` pa fortegnet her.
 *
 * @param {number} dynamicLoftDeg
 * @param {number} attackAngleDeg
 * @returns {number}
 */
export function signedVerticalSpinLoftDeg(dynamicLoftDeg, attackAngleDeg) {
  return dynamicLoftDeg - attackAngleDeg;
}

/**
 * Prinsipal 3D spin loft i grader: `atan2(|v × n|, v · n) × 180/π`.
 *
 * Gren B (se filhodet): er `faceToPath` eksakt 0 og den vertikale spin loften
 * positiv, returnerer motoren `signedVerticalSpinLoftDeg` ordrett i stedet for
 * atan2-verdien. Er den negativ, gjor den det ikke. Fixturen krever begge deler.
 *
 * @param {readonly number[]} velocityUnit v
 * @param {readonly number[]} normalUnit   n
 * @param {number} faceToPathDeg           faceAngle − clubPath
 * @param {number} verticalSpinLoftDeg     dynamicLoft − attackAngle, signert
 * @returns {number} ikke-negativ vinkel i grader
 */
export function spinLoft3DDeg(
  velocityUnit,
  normalUnit,
  faceToPathDeg,
  verticalSpinLoftDeg,
) {
  if (faceToPathDeg === 0 && verticalSpinLoftDeg > 0) {
    return verticalSpinLoftDeg;
  }
  const axis = cross(velocityUnit, normalUnit);
  return Math.atan2(magnitude(axis), dot(velocityUnit, normalUnit)) * radToDeg;
}

/**
 * Offentlig `spinAxis`: den signerte tilt-vinkelen i grader,
 * `−atan2(axis.z, hypot(axis.x, axis.y)) × 180/π`. Positiv = hoyrekurve
 * for hoyrehendt konvensjon (spec §4).
 *
 * Gren A (se filhodet): er `faceToPath` eksakt 0, er verdien eksakt 0 i alle
 * 713 slike caser i fixturen.
 *
 * ⚠ FIXTUREN KAN IKKE SKILLE to implementasjoner: «tving til 0 nar
 * faceToPath === 0» og «tving til 0 nar |ra verdi| < ~1e-9». Alle 713 caser har
 * bade `faceToPath === 0` og |ra verdi| ≤ 3.6e-14, og minste verdi ulik null i
 * hele fixturen er 1.012°. Gapet er 13 tierpotenser bredt og tomt. Valget her
 * er faceToPath fordi ENGINE-GAPS §6 dokumenterer nettopp den betingelsen for
 * `curve` i samme kildefil, og fordi det ikke innforer en oppdiktet epsilon.
 * Innenfor de deklarerte inputgrensene (loft 0–50°, attack ±15°) er
 * `cos A · cos L ≥ 0.62`, sa en ra tilt naer null krever face ≈ path uansett:
 * de to variantene kan bare skilles av en faceToPath i storrelsesorden 1e-12.
 *
 * @param {readonly number[]} axisUnit uₛ
 * @param {number} faceToPathDeg       faceAngle − clubPath
 * @returns {number} grader
 */
export function spinAxisDeg(axisUnit, faceToPathDeg) {
  if (faceToPathDeg === 0) return 0;
  return -Math.atan2(axisUnit[2], Math.hypot(axisUnit[0], axisUnit[1])) * radToDeg;
}

/**
 * Horisontal spin loft-komponent (dimensjonslos): `cos L · sin(F − P)`.
 *
 * Dette er face-normalens komponent langs den horisontale tangenten til
 * kollehastigheten, `n · (cos P, −sin P, 0)`. Den lukkede formen er bit-eksakt
 * (5028/5028); a bygge tangentbasisen numerisk og prikke gir 2316/5028.
 * Vinkeldifferansen ma vaere `faceRad − pathRad`, ikke `(F − P) × degToRad`
 * (4424/5028).
 *
 * @param {number} dynamicLoftDeg L
 * @param {number} faceAngleDeg   F
 * @param {number} clubPathDeg    P
 * @returns {number}
 */
export function horizontalSpinLoftComponent(
  dynamicLoftDeg,
  faceAngleDeg,
  clubPathDeg,
) {
  const l = dynamicLoftDeg * degToRad;
  const f = faceAngleDeg * degToRad;
  const p = clubPathDeg * degToRad;
  return Math.cos(l) * Math.sin(f - p);
}

/**
 * Vertikal spin loft-komponent (dimensjonslos):
 * `cos A · sin L − sin A · cos L · cos(F − P)`.
 *
 * Face-normalens komponent langs den vertikale tangenten,
 * `n · (z − sin A · v) / cos A`. Rekkefolgen teller: venstre-mot-hoyre
 * `(sin A · cos L) · cos(F − P)` gir 5028/5028, mens
 * `sin A · (cos L · cos(F − P))` gir 4740/5028.
 *
 * @param {number} attackAngleDeg A
 * @param {number} dynamicLoftDeg L
 * @param {number} faceAngleDeg   F
 * @param {number} clubPathDeg    P
 * @returns {number}
 */
export function verticalSpinLoftComponent(
  attackAngleDeg,
  dynamicLoftDeg,
  faceAngleDeg,
  clubPathDeg,
) {
  const a = attackAngleDeg * degToRad;
  const l = dynamicLoftDeg * degToRad;
  const f = faceAngleDeg * degToRad;
  const p = clubPathDeg * degToRad;
  return Math.cos(a) * Math.sin(l) - Math.sin(a) * Math.cos(l) * Math.cos(f - p);
}

/* ── Samlet solve ────────────────────────────────────────────────────────── */

/**
 * Hele §5.2 i ett kall. Ren funksjon: samme input gir alltid samme output,
 * ingen delt tilstand, ingen I/O, ingen presentasjonsdata.
 *
 * Feltnavnene er fixturens egne (`flight-golden.json` → `cases[].out`), slik at
 * en sammenligning ikke trenger en oversettelse i midten. `clubSpeed` og andre
 * nokler i input ignoreres — geometrien avhenger ikke av fart.
 *
 * @param {{attackAngle: number, clubPath: number, dynamicLoft: number, faceAngle: number}} input
 *   grader; A, P, L, F.
 * @returns {{
 *   clubVelocityUnit: number[],
 *   faceNormalUnit: number[],
 *   spinAxisUnit: number[],
 *   spinLoft3DDeg: number,
 *   signedVerticalSpinLoftDeg: number,
 *   spinAxis: number,
 *   horizontalSpinLoftComponent: number,
 *   verticalSpinLoftComponent: number
 * }}
 */
export function solveGeometry3D({
  attackAngle,
  clubPath,
  dynamicLoft,
  faceAngle,
}) {
  const velocityUnit = clubVelocityUnit(attackAngle, clubPath);
  const normalUnit = faceNormalUnit(dynamicLoft, faceAngle);
  const axisUnit = spinAxisUnit(velocityUnit, normalUnit);

  // Fixturen eksponerer den samme differansen som `out.faceToPath`.
  const faceToPathDeg = faceAngle - clubPath;
  const verticalDeg = signedVerticalSpinLoftDeg(dynamicLoft, attackAngle);

  return {
    clubVelocityUnit: velocityUnit,
    faceNormalUnit: normalUnit,
    spinAxisUnit: axisUnit,
    spinLoft3DDeg: spinLoft3DDeg(
      velocityUnit,
      normalUnit,
      faceToPathDeg,
      verticalDeg,
    ),
    signedVerticalSpinLoftDeg: verticalDeg,
    spinAxis: spinAxisDeg(axisUnit, faceToPathDeg),
    horizontalSpinLoftComponent: horizontalSpinLoftComponent(
      dynamicLoft,
      faceAngle,
      clubPath,
    ),
    verticalSpinLoftComponent: verticalSpinLoftComponent(
      attackAngle,
      dynamicLoft,
      faceAngle,
      clubPath,
    ),
  };
}
