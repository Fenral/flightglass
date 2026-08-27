/**
 * curveProjection — carry-projeksjon av den rå RK4-kurven, og de fire
 * offentlige feltene som faller ut av den. ENGINE-GAPS §6.
 *
 * BASELINE. Reproduserer dagens motor, inkludert operasjonsrekkefølge og alt
 * som ser ut som en bug. Ingen forbedring, ingen opprydding. Fixturen er fasit.
 *
 * Modulen eier ingen fysikk. RK4-solven har allerede levert to metertall —
 * terminal lateral forskyvning fra launch-linja (`C_raw`) og terminal
 * downrange langs launch-linja (`D_raw`) — og carry-modellen har levert sin
 * empiriske carry. Alt denne filen gjør er å skalere `C_raw` med forholdet
 * mellom de to distansene, og deretter nulle feltet i to tilfeller.
 *
 * ── Grenene, ordrett fra ENGINE-GAPS §6 ──────────────────────────────────
 *
 *   1. `targetCarryM <= 1e-12`  → definert, skala `1`, projisert kurve `C_raw`
 *   2. ellers `D_raw >= 1`      → definert, skala `targetCarryM / D_raw`,
 *                                 projisert kurve `C_raw · skala`
 *   3. ellers                   → IKKE definert, skala `null`,
 *                                 kurvefeltet står som `C_raw`
 *
 * Rekkefølgen er load-bearing: gren 1 testes før gren 2. Alle 382 casene med
 * `carry = 0` treffer gren 1 selv om `D_raw` der er alt fra 0 til 3 m, og
 * ville fått en helt annen skala av gren 2. Gren 3 treffes av nøyaktig én
 * case i baseline (`edge.curve-sub-one-m-positive-carry`, `D_raw = 0.0023 m`).
 *
 * ── Nullingen etterpå ────────────────────────────────────────────────────
 *
 * `hasFlight = false` ELLER `faceToPath = 0` tvinger feltet til `0`.
 *
 * ENGINE-GAPS §6 nevner bare `curve`. Fixturen viser at `curveFromLaunchLineM`
 * nulles på nøyaktig samme predikat — 738 caser der `C_raw · skala ≠ 0` men
 * `curveFromLaunchLineM = 0`. Derfor nulles metertallet her, og `curve` er
 * gradskonverteringen av det allerede nullede tallet. 5028/5028 bit-eksakt.
 *
 * Begge leddene i ELLER-en er verifisert mot fixturen, og de er ikke like
 * viktige:
 *
 *   `hasFlight = false` (382 caser, 300 uten `faceToPath = 0`) undertrykker
 *   opptil 3.5e-6 m. Ekte tall, ikke støy. Uten leddet ryker 300 caser.
 *
 *   `faceToPath = 0` (713 caser, 631 med flukt) undertrykker maks 2.02e-13 m.
 *   Det er ren flyttallsstøy: står flaten på banen, har D-plane-aksen ingen
 *   horisontal komponent, og RK4 skulle gitt eksakt null. Leddet er altså
 *   redundant i størrelsesorden — men IKKE bit-eksakt: 400 av de 631 har
 *   `C_raw ≠ 0`, og uten leddet ryker de. Behold det.
 *
 * ── Enheter og rekkefølge som er verifisert bit-eksakt ───────────────────
 *
 *   yard → meter   `yards * 0.9144`. `yards / (1 / 0.9144)` gir 4138/4645 på
 *                  skalaen mot 4552/4645.
 *   meter → yard   `metres / 0.9144`. `metres * (1 / 0.9144)` gir 4608/5028
 *                  på `curve` mot 5028/5028.
 *   skala          `targetCarryM / D_raw`, ikke `targetCarryM * (1 / D_raw)`
 *                  (3452/4645).
 *
 * Ikke bytt noen av dem. De er 1 ULP fra hverandre, og fixturen skiller.
 *
 * ── Hva fixturen ikke kan avgjøre ────────────────────────────────────────
 *
 * `D_raw` publiseres bare som `curveFlightCarryYd`, altså `D_raw / 0.9144`.
 * Den konverteringen er ikke injektiv: flere `D_raw` gir samme yard-tall.
 * Regner en tilbake med `curveFlightCarryYd * 0.9144` treffer en riktig
 * `D_raw` i 4552 av 4645 caser og bommer med nøyaktig 1 ULP i de siste 93.
 *
 * Det er tap i fixturen, ikke i denne filen: for alle 4645 finnes en `D_raw`
 * innenfor ±1 ULP som både runder tilbake til det publiserte yard-tallet OG
 * gjør skala, `curveFromLaunchLineM` og `curve` bit-eksakte. Testen beviser
 * det. Gir kalleren en ekte `D_raw`, er modulen eksakt.
 *
 * Grensen på 1 m står trygt: nærmeste `D_raw` over er 2.18 m, nærmeste under
 * er 0.0023 m. ±1 ULP kan ikke vippe gren 2 mot gren 3.
 */

import {
  yardToMetre,
  curveCarryProjectionMinimumDownrangeM,
  curveCarryProjectionTargetCarryEpsilon,
} from './constants.js';

/* ── Enheter ────────────────────────────────────────────────────────────── */

/**
 * Yard → meter. Spec §6: UI-adapteren konverterer én gang med `0.9144`.
 * Multiplikasjon, ikke divisjon med den resiproke — se ULP-notatet øverst.
 *
 * @param {number} yards
 * @returns {number} meter
 */
export function yardsToMetres(yards) {
  return yards * yardToMetre;
}

/**
 * Meter → yard. Divisjon, ikke multiplikasjon med `1 / 0.9144`.
 *
 * @param {number} metres
 * @returns {number} yard
 */
export function metresToYards(metres) {
  return metres / yardToMetre;
}

/* ── Projeksjonen ───────────────────────────────────────────────────────── */

/**
 * De tre grenene i ENGINE-GAPS §6. Avgjør om projeksjonen er definert og hva
 * skalaen er. Ser ikke på kurven — den skaleres separat av
 * `projectedCurveFromLaunchLineM`.
 *
 * @param {number} rawDownrangeM `D_raw`, rå RK4 downrange langs launch-linja
 * @param {number} targetCarryM den empiriske carryen projeksjonen sikter mot
 * @returns {{defined: boolean, scale: number|null}}
 *   `scale` er `null` nøyaktig når `defined` er `false`.
 */
export function carryProjection(rawDownrangeM, targetCarryM) {
  // Gren 1 før gren 2. Ingen flukt ⇒ ingen projeksjon, uansett hva RK4 rakk.
  if (targetCarryM <= curveCarryProjectionTargetCarryEpsilon) {
    return { defined: true, scale: 1 };
  }
  if (rawDownrangeM >= curveCarryProjectionMinimumDownrangeM) {
    return { defined: true, scale: targetCarryM / rawDownrangeM };
  }
  return { defined: false, scale: null };
}

/**
 * Rå kurve skalert med projeksjonen. Er projeksjonen udefinert står `C_raw`
 * uendret — ENGINE-GAPS §6, gren 3.
 *
 * I gren 1 er skalaen `1`, og `C_raw * 1` er bit-identisk med `C_raw` for
 * alle endelige verdier. Multiplikasjonen er derfor uniform her selv om
 * spec-en ordlegger gren 1 som «returnerer `C_raw`».
 *
 * @param {number} rawCurveFromLaunchLineM `C_raw` i meter
 * @param {number|null} scale fra `carryProjection`
 * @returns {number} meter
 */
export function projectedCurveFromLaunchLineM(rawCurveFromLaunchLineM, scale) {
  if (scale === null) return rawCurveFromLaunchLineM;
  return rawCurveFromLaunchLineM * scale;
}

/* ── Nullingen ──────────────────────────────────────────────────────────── */

/**
 * Er kurvefeltet tvunget til `0`? ENGINE-GAPS §6: `hasFlight = false` ELLER
 * `faceToPath = 0`.
 *
 * `hasFlight` er ENGINE-GAPS §2 (`carry > 0`) og eies av en annen modul;
 * kalleren leverer den ferdig.
 *
 * @param {boolean} hasFlight
 * @param {number} faceToPath grader, `faceAngle − clubPath`
 * @returns {boolean}
 */
export function curveIsSuppressed(hasFlight, faceToPath) {
  return !hasFlight || faceToPath === 0;
}

/* ── Samlet ─────────────────────────────────────────────────────────────── */

/**
 * De fire offentlige feltene i ett kall.
 *
 * `curve` er ikke en selvstendig størrelse: den er `curveFromLaunchLineM`
 * konvertert til yard, etter nullingen. Er metertallet `0`, er `curve` `0`.
 *
 * @param {{rawCurveFromLaunchLineM: number, rawDownrangeM: number,
 *          targetCarryM: number, hasFlight: boolean, faceToPath: number}} input
 *   `rawCurveFromLaunchLineM` er feltnavnet i `out`; `rawDownrangeM` er
 *   `curveFlightCarryYd` i meter; `targetCarryM` er `carry` i meter.
 * @returns {{curve: number, curveFromLaunchLineM: number,
 *            curveCarryProjectionScale: number|null,
 *            curveCarryProjectionDefined: boolean}}
 *   `curve` i yard, `curveFromLaunchLineM` i meter.
 */
export function curveProjection({
  rawCurveFromLaunchLineM,
  rawDownrangeM,
  targetCarryM,
  hasFlight,
  faceToPath,
}) {
  const { defined, scale } = carryProjection(rawDownrangeM, targetCarryM);

  const projected = projectedCurveFromLaunchLineM(
    rawCurveFromLaunchLineM,
    scale,
  );

  const curveFromLaunchLineM = curveIsSuppressed(hasFlight, faceToPath)
    ? 0
    : projected;

  return {
    curve: metresToYards(curveFromLaunchLineM),
    curveFromLaunchLineM,
    curveCarryProjectionScale: scale,
    curveCarryProjectionDefined: defined,
  };
}
