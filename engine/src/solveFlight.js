/**
 * `solveFlight` — den offentlige Ball Flight-solveren (spec §3, §11.1).
 *
 * BASELINE. Denne filen inneholder INGEN fysikk. Den er ren sammensetning:
 * hver formel bor i sin modul, og rekkefølgen under er beregningskjeden i
 * spec §5. Ser noe feil ut, ligger feilen (bevisst reprodusert) i modulen —
 * ikke her. Ingen forbedring, ingen opprydding, ingen modernisering.
 *
 * Kjeden, i denne rekkefølgen:
 *
 *   §5.2  geometry3d          → clubVelocityUnit, faceNormalUnit, spinAxisUnit,
 *                               spinLoft3DDeg, signedVerticalSpinLoftDeg,
 *                               spinAxis, horisontal/vertikal komponent
 *   §5.1  startDirection      → startDirection, startFaceW
 *   §5.3  launchAngle         → launchAngle, launchInterceptBlend
 *   §5.4  spinMagnitude       → spinCalibration, spinRpmRaw, totalSpinRpm
 *   §5.4  backspinProjection  → spinVectorRadPerSec, signedBackspinRpm,
 *                               backspin, rightCurveSpinRpm
 *   §5.5  smashBallSpeed      → smashEff, smash, ballSpeed
 *   §5.6  longitudinalLegacy  → carry, apex, landingAngle, roll, total, …
 *   §5.7  rk4Integrator       → curveFlightTimeSeconds, curveFlightCarryYd,
 *                               rawCurveFromLaunchLineM, aerodynamicDiagnostics
 *   GAPS6 curveProjection     → curveCarryProjection*, curveFromLaunchLineM, curve
 *   §5.8  offlineComposition  → offline
 *   —     outcomeAdapter      → shape
 *
 * Returobjektet har nøyaktig de 81 feltene `flight-golden.json` sine
 * `out`-objekter har, i fixturens egen nøkkelrekkefølge
 * (`_meta.returnedFields`). Ingen felt mer, ingen færre.
 *
 * `hasFlight`, `inDomain`, `reason` og `rk4Diagnostics` er IKKE med. Fixturens
 * `_meta.requestedFieldsAbsentFromSolveFlight` sier eksplisitt at dagens motor
 * ikke returnerer dem; de tilhører adapterlaget (`src/outcomeAdapter.js`).
 *
 * ── INPUTKONTRAKT (spec §3) ────────────────────────────────────────────────
 * «Gjenoppbyggingen strammer inn den offentlige solver-kontrakten:
 *  `solveFlight` skal bare motta endelige tall, mens eventuell parsing for
 *  bakoverkompatibilitet skal skje i et separat adapterlag.»
 *
 * Derfor: ingen koersjon, ingen defaults, ingen parsing. Ikke-endelige verdier
 * kaster `TypeError`; negativ `clubSpeed` kaster `RangeError`. Dette er den
 * ENESTE valideringen i motoren — og den er en kontraktsgrense, ikke fysikk.
 * De fem inputene klampes ALDRI: `_meta.declaredInputBounds` er UI- og
 * Guide-grenser (`inputBoundaryBehavior`), ikke motorgrenser.
 *
 * Ukjente nøkler i `shot` ignoreres, slik at en kaller kan sende hele sin
 * shot state uendret.
 */

import {
  apexBasePerBallSpeed,
  apexLaunchPerBallSpeedDeg,
  aeroModelIdentity,
  carryBallSpeedLinear,
  carryBallSpeedQuadratic,
  carryFullLaunchAtDeg,
  curveCarryProjectionMinimumDownrangeM,
  dragCompatibilityScale,
  landingBase,
  landingSpinLoftTau,
  launchAttackW,
  launchIntercept,
  launchLoftQuadratic,
  launchLoftW,
  maxTotalSpinRpm,
  referenceAnchorDragScale,
  rk4Step,
  smashMaximum,
  smashMinimum,
  smashModelIntercept,
  smashSpinLoftLinear,
  smashSpinLoftQuadratic,
  spinCalibrationLow,
  spinCalibrationMidpointDeg,
  spinCalibrationRange,
  spinCalibrationWidthDeg,
  spinDecay,
  yardToMetre,
} from './constants.js';

import { cross, magnitude, solveGeometry3D } from './geometry3d.js';
import { solveStartDirection } from './startDirection.js';
import { solveLaunchAngle } from './launchAngle.js';
import { spinMagnitude } from './spinMagnitude.js';
import { backspinProjection } from './backspinProjection.js';
import { solveSmashBallSpeed } from './smashBallSpeed.js';
import { solveLongitudinalLegacy } from './longitudinalLegacy.js';
import { solveCurveFlight } from './rk4Integrator.js';
import { curveProjection } from './curveProjection.js';
import { solveOfflineComposition } from './offlineComposition.js';
import { hasFlight as carryHasFlight, shape } from './outcomeAdapter.js';

/* ─────────────────────────────────────────────────────────────────────────
 * Inputkontrakt
 * ───────────────────────────────────────────────────────────────────────── */

/** Rekkefølgen feltene sjekkes i. Deterministisk feilmelding. */
const requiredInputs = Object.freeze([
  'clubSpeed',
  'faceAngle',
  'clubPath',
  'attackAngle',
  'dynamicLoft',
]);

/**
 * Spec §3-kontrakten. Kaster, koerker aldri.
 *
 * @param {object} shot
 * @throws {TypeError} når et av de fem feltene ikke er et endelig `number`
 * @throws {RangeError} når `clubSpeed` er negativ
 */
function assertFiniteShot(shot) {
  if (shot === null || typeof shot !== 'object') {
    throw new TypeError('solveFlight krever et objekt med de fem inputfeltene.');
  }

  for (const field of requiredInputs) {
    const value = shot[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(
        `solveFlight: ${field} må være et endelig tall, fikk ${String(value)}. ` +
          'Parsing og koersjon hører hjemme i et adapterlag (spec §3).',
      );
    }
  }

  // Spec §3: clubSpeed er ikke-negativ. Den er den eneste av de fem med
  // fortegnsbegrensning; de fire vinklene er signerte og har ingen.
  if (shot.clubSpeed < 0) {
    throw new RangeError(
      `solveFlight: clubSpeed må være ikke-negativ, fikk ${shot.clubSpeed}.`,
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Solveren
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Hele Ball Flight-kjeden i ett deterministisk, rent kall.
 *
 * @param {{clubSpeed: number, faceAngle: number, clubPath: number,
 *          attackAngle: number, dynamicLoft: number}} shot
 *   `clubSpeed` i mph og ikke-negativ; de fire andre i grader. Alle fem må
 *   være endelige tall.
 * @returns {object} de 81 feltene i `flight-golden.json` sine `out`-objekter,
 *   i fixturens nøkkelrekkefølge.
 * @throws {TypeError|RangeError} brudd på inputkontrakten (spec §3)
 * @throws {Error} `"Flight did not reach the ground within maxTimeSeconds"`
 *   når RK4 ikke når bakken innen 30 s. Baseline-oppførsel, ikke en
 *   defensiv sjekk — fixturens `edge.rk4-no-ground-within-30-seconds`.
 */
export function solveFlight(shot) {
  assertFiniteShot(shot);

  const { clubSpeed, faceAngle, clubPath, attackAngle, dynamicLoft } = shot;

  /* §5.2 — eksakt sentrert D-plane-geometri. */
  const geometry = solveGeometry3D({
    attackAngle,
    clubPath,
    dynamicLoft,
    faceAngle,
  });

  // Fixturen eksponerer den samme differansen som `out.faceToPath`.
  const faceToPath = faceAngle - clubPath;

  // |v × n|. §5.4 bruker denne DIREKTE, ikke `sin(spinLoft3DDeg × π/180)`
  // (spinMagnitude-modulen: 3304/5028 skiller, opptil 7.3e-12 rpm). Samme
  // `cross`/`magnitude` som `spinAxisUnit` bygges av, så tallet er bit-likt
  // det geometry3d selv regnet med.
  const sinSpinLoft3D = magnitude(
    cross(geometry.clubVelocityUnit, geometry.faceNormalUnit),
  );

  /* §5.1 — startretning. */
  const start = solveStartDirection({ faceAngle, clubPath, dynamicLoft });

  /* §5.3 — launch angle. */
  const launch = solveLaunchAngle({ dynamicLoft, attackAngle });

  /* §5.4 — spinnstørrelse.
   *
   * `ballSpeed` sendes bevisst IKKE inn her: den finnes først etter §5.5, og
   * kjeden i spec §5 setter §5.4 før §5.5. Spec-ens nullregel har to ledd —
   * «aksen udefinert» ELLER «ballSpeed = 0» — og modulen dekker det første
   * selv via `spinAxisDefined = sinSpinLoft3D > 0`. Det andre leddet er ikke
   * observerbart: `ballSpeed = clubSpeed × smashEff` med `smashEff ≥ 1.15`,
   * så `ballSpeed = 0` ⟺ `clubSpeed = 0`, og da er tangentialfarten — og
   * dermed `spinRpmRaw` — allerede 0. Alle 5028 caser er bit-eksakte uten. */
  const spin = spinMagnitude({
    clubSpeed,
    dynamicLoft,
    attackAngle,
    sinSpinLoft3D,
  });

  /* §5.4 — projeksjon av spinnvektoren på launch-rammen. */
  const backspin = backspinProjection({
    launchAngle: launch.launchAngle,
    startDirection: start.startDirection,
    spinAxisUnit: geometry.spinAxisUnit,
    totalSpinRpm: spin.totalSpinRpm,
  });

  /* §5.5 — smash og ball speed. Bruker den 3-DIMENSJONALE spin loften
   * (`spinLoft3DDeg`), ikke den signerte vertikale. */
  const smash = solveSmashBallSpeed({
    clubSpeed,
    spinLoft: geometry.spinLoft3DDeg,
  });

  /* §5.6 — carry, apex, landing angle, roll, total (den empiriske modellen). */
  const longitudinal = solveLongitudinalLegacy({
    ballSpeed: smash.ballSpeed,
    launchAngle: launch.launchAngle,
    dynamicLoft,
    attackAngle,
  });

  /* §5.7 — RK4-kurveflukten. Trenger `spinAxisUnit`-VEKTOREN; den offentlige
   * skalaren `spinAxis` kan ikke rekonstruere den (ENGINE-GAPS §1, FUNN F3). */
  const curveFlight = solveCurveFlight(
    {
      ballSpeed: smash.ballSpeed,
      launchAngle: launch.launchAngle,
      startDirection: start.startDirection,
      spinAxisUnit: geometry.spinAxisUnit,
      totalSpinRpm: spin.totalSpinRpm,
    },
  );

  /* ENGINE-GAPS §6 — carry-projeksjonen og nullingen av `curve`.
   *
   * `rawDownrangeM` tas fra RK4 direkte (`rawDownLaunchLineM`), ikke via
   * yard-feltet `curveFlightCarryYd`: en rundtur gjennom yard bommer 1 ULP i
   * 93 caser. `hasFlight` er GAPS §2 (`carry > 0`) — predikatet importeres
   * fra adapterlaget, ikke skrevet av her. */
  const curve = curveProjection({
    rawCurveFromLaunchLineM: curveFlight.rawCurveFromLaunchLineM,
    rawDownrangeM: curveFlight.rawDownLaunchLineM,
    targetCarryM: longitudinal.carry * yardToMetre,
    hasFlight: carryHasFlight(longitudinal.carry),
    faceToPath,
  });

  /* §5.8 — sluttposisjon. Mangler `cos(startDirection)`-leddet. Det er
   * feilen §5.8 dokumenterer; ikke legg det til. */
  const offline = solveOfflineComposition({
    carry: longitudinal.carry,
    startDirection: start.startDirection,
    curve: curve.curve,
  });

  /* Formetiketten. Adapterlaget eier den; `solveFlight` emitterer bare
   * `shape` av de fire feltene `solveOutcome` regner ut. */
  const shapeLabel = shape(start.startDirection, faceToPath);

  /* ── Sammenstilling ──────────────────────────────────────────────────────
   * Nøkkelrekkefølgen er `_meta.returnedFields` ordrett. Den er del av
   * kontrakten: integrasjonstesten sammenligner rekkefølge, ikke bare verdier.
   */
  return {
    // Input-ekko (spec §5, «shot state»). Uendret, uklampet.
    clubPath,
    faceAngle,
    attackAngle,
    dynamicLoft,
    clubSpeed,

    // Kompatibilitetsetikett. `_meta.units`: «string compatibility label;
    // does not select physics». Provenance, ikke brukervendt kopi.
    club: aeroModelIdentity.club,

    startDirection: start.startDirection,

    // `spinLoft` og `spinLoft3DDeg` er samme tall i alle 5028 caser — det
    // offentlige feltet ER den 3-D vinkelen, ikke den vertikale.
    spinLoft: geometry.spinLoft3DDeg,
    spinLoft3DDeg: geometry.spinLoft3DDeg,
    signedVerticalSpinLoftDeg: geometry.signedVerticalSpinLoftDeg,

    launchAngle: launch.launchAngle,
    spinAxis: geometry.spinAxis,
    ballSpeed: smash.ballSpeed,

    carry: longitudinal.carry,
    apex: longitudinal.apex,
    landingAngle: longitudinal.landingAngle,
    offline: offline.offline,
    total: longitudinal.total,

    curve: curve.curve,
    curveFromLaunchLineM: curve.curveFromLaunchLineM,
    rawCurveFromLaunchLineM: curveFlight.rawCurveFromLaunchLineM,
    curveFlightCarryYd: curveFlight.curveFlightCarryYd,
    curveFlightTimeSeconds: curveFlight.curveFlightTimeSeconds,
    curveCarryProjectionDefined: curve.curveCarryProjectionDefined,
    curveCarryProjectionScale: curve.curveCarryProjectionScale,
    curveCarryProjectionMinimumDownrangeM,

    backspin: backspin.backspin,
    signedBackspinRpm: backspin.signedBackspinRpm,
    totalSpinRpm: spin.totalSpinRpm,
    rightCurveSpinRpm: backspin.rightCurveSpinRpm,
    spinVectorRadPerSec: backspin.spinVectorRadPerSec,

    spinAxisUnit: geometry.spinAxisUnit,
    clubVelocityUnit: geometry.clubVelocityUnit,
    faceNormalUnit: geometry.faceNormalUnit,
    horizontalSpinLoftComponent: geometry.horizontalSpinLoftComponent,
    verticalSpinLoftComponent: geometry.verticalSpinLoftComponent,

    // Sentrert treff er den eneste modellerte tilstanden: spec §5.2 heter
    // «Eksakt SENTRERT D-plane-geometri», og gear effect er ikke modellert
    // (spec §10). Begge er konstante i alle 5028 caser.
    centeredStrike: true,
    gearEffectApplied: false,

    aerodynamicDiagnostics: curveFlight.aerodynamicDiagnostics,

    aeroModel: {
      coefficientSetId: aeroModelIdentity.coefficientSetId,
      baseCoefficientSetId: aeroModelIdentity.baseCoefficientSetId,
      class: aeroModelIdentity.class,
      exactNamedBall: aeroModelIdentity.exactNamedBall,
      dragCompatibilityScale,
      referenceAnchorDragScale,
      carryProjectionScale: curve.curveCarryProjectionScale,
      carryProjectionDefined: curve.curveCarryProjectionDefined,
      integrationStepSeconds: rk4Step,
      spinDecayPerSecond: spinDecay,
      disclosure: aeroModelIdentity.disclosure,
    },

    smash: smash.smash,
    smashEff: smash.smashEff,
    apexLaunchFactor: longitudinal.apexLaunchFactor,
    faceToPath,

    // Modellkoeffisientene. Fixturen bærer dem i hver eneste case, så en full
    // reproduksjon må emittere dem. De kommer fra `constants.js`.
    startFaceW: start.startFaceW,
    launchLoftW,
    launchLoftQuadratic,
    launchAttackW,
    launchIntercept,
    launchInterceptBlend: launch.launchInterceptBlend,

    smashModelIntercept,
    smashSpinLoftLinear,
    smashSpinLoftQuadratic,
    smashMinimum,
    smashMaximum,

    spinCalibration: spin.spinCalibration,
    spinCalibrationLow,
    spinCalibrationRange,
    spinCalibrationMidpointDeg,
    spinCalibrationWidthDeg,
    spinRpmRaw: spin.spinRpmRaw,
    maxTotalSpinRpm,

    carryBallSpeedLinear,
    carryBallSpeedQuadratic,
    carryBallSpeedFit: longitudinal.carryBallSpeedFit,
    carryFullLaunchAtDeg,
    carryLaunchEfficiency: longitudinal.carryLaunchEfficiency,

    apexBasePerBallSpeed,
    apexLaunchPerBallSpeedDeg,
    apexBallSpeedTerm: longitudinal.apexBallSpeedTerm,
    apexLaunchTerm: longitudinal.apexLaunchTerm,

    rollFrac: longitudinal.rollFrac,
    roll: longitudinal.roll,

    landingBase,
    landingSpinTerm: longitudinal.landingSpinTerm,
    landingLaunchTerm: longitudinal.landingLaunchTerm,
    landingApexTerm: longitudinal.landingApexTerm,
    landingDomainTerm: longitudinal.landingDomainTerm,
    landingSpinLoftTau,
    landingRaw: longitudinal.landingRaw,

    shape: shapeLabel,
  };
}

export default solveFlight;
