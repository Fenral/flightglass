/**
 * §5.4 — Spinnstørrelse: `spinCalibration`, `spinRpmRaw`, `totalSpinRpm`.
 *
 * BASELINE. Denne filen reproduserer dagens motor eksakt. Ingenting her er
 * ryddet, forbedret eller modernisert. Ser en formel rar ut, er det fordi
 * motoren har den formelen.
 *
 * Modulen eier bare STØRRELSEN på spinnvektoren. Retningen (`spinAxisUnit`,
 * `spinAxis`, `signedBackspinRpm`, `rightCurveSpinRpm`) er §5.2 og hører
 * hjemme i D-plane-modulen.
 *
 * Kjeden, ordrett fra spec §5.4:
 *
 *   verticalSpinLoft = abs(DynamicLoft − AttackAngle)
 *
 *   spinCalibration  = 0.81 + 0.32 / (1 + exp(−(verticalSpinLoft − 31.98) / 2.14))
 *
 *   tangentialClubSpeedMps = ClubSpeed × 0.44704 × sin(SpinLoft3D)
 *
 *   denominator      = BallRadius × (1 + InertiaFactor × (1 + BallMass / ClubHeadMass))
 *
 *   spinRadPerSecond = spinCalibration × tangentialClubSpeedMps / denominator
 *
 *   totalSpinRpm     = clamp(spinRadPerSecond × 60 / (2π), 0, 9000)
 *
 * `spinRpmRaw` er verdien FØR clampen; `totalSpinRpm` er etter.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠ VIKTIG AVVIK MELLOM SPEC-TEKST OG MOTOR — VERIFISERT MOT FIXTUREN
 *
 * Spec §5.4 skriver `sin(SpinLoft3D × π/180)`, altså en vei innom grader.
 * Motoren gjør det IKKE. Den bruker kryssproduktets lengde direkte:
 *
 *     sinSpinLoft3D = Math.hypot(...cross(clubVelocityUnit, faceNormalUnit))
 *
 * Det er matematisk det samme (begge vektorene er enhetsvektorer, så
 * |v × n| = sin θ), men numerisk 1–2 ULP forskjellig, og fixturen er fasit:
 *
 *     |v × n| direkte ...................... 5028/5028 bit-eksakt
 *     sin(spinLoft3DDeg × π/180) ........... 3304/5028, maks avvik 7.3e-12 rpm
 *     sin(atan2(|v×n|, v·n)) ............... 3507/5028, maks avvik 7.3e-12 rpm
 *     sqrt(x²+y²+z²) i stedet for hypot .... 3506/5028, maks avvik 5.5e-12 rpm
 *
 * Derfor er `sinSpinLoft3D` den primære inngangen her. `spinLoft3DDeg` finnes
 * som fallback for kallere som bare har graden, men den er da eksplisitt ~2 ULP
 * unna baseline. Ikke bytt om på prioriteringen.
 *
 * Rekkefølgen på flyttalloperasjonene er også fixture-verifisert og skal ikke
 * omgrupperes:
 *   - `clubSpeed * mphToMps * sin`      — venstre-til-høyre, ikke `k * (mph * s)`
 *   - `(cal * tang) / denominator`      — ikke `cal * (tang / denominator)`
 *   - `radPerSec * radPerSecToRpm`      — én ferdig konstant, ikke `* 60 / (2π)`
 * Hver av de tre omgrupperingene taper mellom 1000 og 1400 bit-eksakte caser.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Ingen I/O, ingen tilstand, ingen presentasjonsdata.
 */

import {
  ballMass,
  ballRadius,
  clubHeadMass,
  degToRad,
  inertiaFactor,
  maxTotalSpinRpm,
  minTotalSpinRpm,
  mphToMps,
  radPerSecToRpm,
  spinCalibrationLow,
  spinCalibrationMidpointDeg,
  spinCalibrationRange,
  spinCalibrationWidthDeg,
} from './constants.js';

/* ── Avledet konstant ───────────────────────────────────────────────────── */

/**
 * Nevneren i «rolling at separation»-modellen, i meter. Spec §5.4:
 *
 *   denominator = BallRadius × (1 + InertiaFactor × (1 + BallMass / ClubHeadMass))
 *
 * Konstant over hele inputdomenet — ingen av leddene avhenger av leveringen.
 * Regnes ut én gang her fordi den ikke finnes i `constants.js`; alle
 * bestanddelene gjør det. Verdi i baseline: `0.0318288331`.
 */
export const spinDenominatorM =
  ballRadius * (1 + inertiaFactor * (1 + ballMass / clubHeadMass));

/* ── Byggesteiner ───────────────────────────────────────────────────────── */

/** `Math.min(Math.max(value, low), high)`. Lokal, ikke eksportert. */
function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

/**
 * Spec §5.4: `verticalSpinLoft = abs(DynamicLoft − AttackAngle)`.
 *
 * Merk at dette er ABSOLUTTVERDIEN. Den signerte varianten
 * (`signedVerticalSpinLoftDeg = DynamicLoft − AttackAngle`) er §5.2 sin, og
 * brukes av `inDomain`/`reason` i Outcome-adapteren — ikke her.
 *
 * Samme størrelse går inn i landingsvinkelen i §5.6; den eksporteres derfor
 * slik at ingen andre moduler trenger å skrive `Math.abs(...)` på nytt.
 *
 * @param {{dynamicLoft: number, attackAngle: number}} input grader
 * @returns {number} grader, alltid ikke-negativ
 */
export function verticalSpinLoftDeg({ dynamicLoft, attackAngle }) {
  return Math.abs(dynamicLoft - attackAngle);
}

/**
 * Spec §5.4, den loft-avhengige kalibreringskurven:
 *
 *   0.81 + 0.32 / (1 + exp(−(verticalSpinLoft − 31.98) / 2.14))
 *
 * En sigmoid som går fra 0.81 ved lav vertikal spin loft til 1.13 ved høy,
 * med vendepunkt på 31.98°. Fixturen eksponerer verdien som
 * `out.spinCalibration` og alle fire konstantene som egne felt.
 *
 * @param {number} verticalSpinLoft grader, ikke-negativ
 * @returns {number} dimensjonsløs kalibreringsfaktor
 */
export function spinCalibrationFor(verticalSpinLoft) {
  return (
    spinCalibrationLow +
    spinCalibrationRange /
      (1 +
        Math.exp(
          -(verticalSpinLoft - spinCalibrationMidpointDeg) /
            spinCalibrationWidthDeg,
        ))
  );
}

/**
 * Spec §5.4: `ClubSpeed × 0.44704 × sin(SpinLoft3D)`.
 *
 * Komponenten av køllehastigheten som ligger langs flaten, altså den som
 * ruller ballen. Rekkefølgen er venstre-til-høyre og skal ikke omgrupperes.
 *
 * @param {number} clubSpeed mph, ikke-negativ
 * @param {number} sinSpinLoft3D sinus til den sanne 3D spin loft, `|v × n|`
 * @returns {number} m/s
 */
export function tangentialClubSpeedMps(clubSpeed, sinSpinLoft3D) {
  return clubSpeed * mphToMps * sinSpinLoft3D;
}

/**
 * Fallback-konvertering grad → sinus for kallere som ikke har kryssproduktet.
 *
 * ⚠ Dette er IKKE baseline-veien. Se filhodet: den koster opptil 7.3e-12 rpm
 * i `spinRpmRaw` og gjør 1724 av 5028 caser bit-uleselige. Bruk
 * `sinSpinLoft3D` når du har den.
 *
 * @param {number} spinLoft3DDeg grader
 * @returns {number} sinus
 */
export function sinSpinLoft3DFromDegrees(spinLoft3DDeg) {
  return Math.sin(spinLoft3DDeg * degToRad);
}

/* ── Hovedkall ──────────────────────────────────────────────────────────── */

/**
 * Full §5.4-spinnstørrelse.
 *
 * `spinCalibration` og `spinRpmRaw` beregnes alltid — også når spinnet
 * nulles. Det stemmer med fixturen: `edge.club-speed-zero` har
 * `spinCalibration = 0.8175…` samtidig som `spinRpmRaw` og `totalSpinRpm`
 * er `0`.
 *
 * NULLREGELEN (spec §5.4): «Hvis 3D-aksen ikke er definert, eller Ball Speed
 * er null, settes total spin til null.» Den er implementert slik spec-en
 * beskriver den, men den er IKKE observerbar i fixturen:
 *   - aksen er udefinert nøyaktig når `|v × n| = 0` (29 caser), og da er
 *     `tangentialClubSpeedMps` allerede 0, så `spinRpmRaw` er 0 uansett;
 *   - `ballSpeed = 0` skjer bare ved `clubSpeed = 0` (1 case, smash er
 *     clampet til minst 1.15), og da er tangentialfarten også 0.
 * Med andre ord: `clamp(spinRpmRaw, 0, 9000)` alene reproduserer alle 5028
 * caser. Regelen er belte-og-seler. Den beholdes fordi spec-en har den.
 *
 * Nedre clamp (`0`) binder aldri i baseline: `|v × n| ≥ 0`, `clubSpeed ≥ 0`
 * og `spinCalibration > 0`, så `spinRpmRaw ≥ 0` alltid. Øvre clamp (`9000`)
 * binder i 929 av 5028 caser — 18.5 %. Se FUNN F5: det er en synlig
 * modellgrense, ikke et unntak.
 *
 * @param {object} input
 * @param {number} input.clubSpeed mph, ikke-negativ
 * @param {number} input.dynamicLoft grader
 * @param {number} input.attackAngle grader
 * @param {number} [input.sinSpinLoft3D] `Math.hypot(...cross(clubVelocityUnit,
 *   faceNormalUnit))` fra §5.2. Primær inngang — gir bit-eksakt baseline.
 * @param {number} [input.spinLoft3DDeg] fallback når `sinSpinLoft3D` mangler;
 *   konverteres med `sinSpinLoft3DFromDegrees` og er da ~2 ULP fra baseline.
 * @param {boolean} [input.spinAxisDefined] settes til `sinSpinLoft3D > 0` når
 *   den ikke oppgis.
 * @param {number} [input.ballSpeed] mph. Bare `=== 0` betyr noe.
 * @returns {{spinCalibration: number, spinRpmRaw: number, totalSpinRpm: number}}
 */
export function spinMagnitude(input) {
  const {
    clubSpeed,
    dynamicLoft,
    attackAngle,
    sinSpinLoft3D,
    spinLoft3DDeg,
    spinAxisDefined,
    ballSpeed,
  } = input;

  const sin =
    sinSpinLoft3D !== undefined
      ? sinSpinLoft3D
      : sinSpinLoft3DFromDegrees(spinLoft3DDeg);

  const spinCalibration = spinCalibrationFor(
    verticalSpinLoftDeg({ dynamicLoft, attackAngle }),
  );

  const spinRadPerSecond =
    (spinCalibration * tangentialClubSpeedMps(clubSpeed, sin)) /
    spinDenominatorM;

  const spinRpmRaw = spinRadPerSecond * radPerSecToRpm;

  const axisDefined = spinAxisDefined !== undefined ? spinAxisDefined : sin > 0;
  const spinIsZeroed = !axisDefined || ballSpeed === 0;

  const totalSpinRpm = spinIsZeroed
    ? 0
    : clamp(spinRpmRaw, minTotalSpinRpm, maxTotalSpinRpm);

  return { spinCalibration, spinRpmRaw, totalSpinRpm };
}
