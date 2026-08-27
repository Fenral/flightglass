/**
 * Selvtest av fundamentet. Ingen fysikk.
 *
 * Verifiserer at fixture-loaderen og konstantene stemmer med golden-filene,
 * slik at en feilende fysikktest senere garantert peker på fysikken og ikke
 * på riggen. Fungerer også som mal for de andre agentenes testfiler.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadFlight,
  loadStudio,
  loadFlightErrors,
  loadStudioErrors,
  loadFlightMeta,
  loadStudioMeta,
  close,
  report,
} from './_fixture.js';

import * as constants from '../src/constants.js';

/* ── Lasting ────────────────────────────────────────────────────────────── */

test('loadFlight gir alle caser med out, og bare dem', () => {
  const cases = loadFlight();
  const meta = loadFlightMeta();

  assert.equal(cases.length, meta.counts.returned, 'antall caser med out');
  assert.equal(cases.length, 5028);
  assert.equal(loadFlightErrors().length, meta.counts.threw);
  assert.equal(cases.length + loadFlightErrors().length, meta.counts.total);

  for (const c of cases) {
    assert.ok(typeof c.id === 'string' && c.id.length > 0, 'id');
    assert.ok(typeof c.group === 'string' && c.group.length > 0, 'group');
    assert.ok(c.in && typeof c.in === 'object', 'in');
    assert.ok(c.out && typeof c.out === 'object', 'out');
  }
});

test('loadStudio gir alle 2500 caser med out og validated-flagg', () => {
  const cases = loadStudio();
  const meta = loadStudioMeta();

  assert.equal(cases.length, meta.counts.total);
  assert.equal(cases.length, 2500);
  assert.equal(loadStudioErrors().length, 0);

  const iron = cases.filter((c) => c.in.clubMode === 'iron');
  const driver = cases.filter((c) => c.in.clubMode === 'driver');
  assert.equal(iron.length, meta.counts.ironValidatedTrue);
  assert.equal(driver.length, meta.counts.driverValidatedFalse);
  assert.ok(iron.every((c) => c.validated === true), 'iron er validert');
  assert.ok(driver.every((c) => c.validated === false), 'driver er ikke validert');
});

test('den ene feilcasen er RK4-timeouten, ordrett', () => {
  const errors = loadFlightErrors();
  assert.equal(errors.length, 1);
  assert.equal(errors[0].id, 'edge.rk4-no-ground-within-30-seconds');
  assert.equal(errors[0].error.name, 'Error');
  assert.equal(
    errors[0].error.message,
    'Flight did not reach the ground within maxTimeSeconds',
  );
  assert.equal(errors[0].out, undefined);
});

test('caser caches og deles — samme referanse, frosset', () => {
  assert.equal(loadFlight(), loadFlight(), 'flight cachet');
  assert.equal(loadStudio(), loadStudio(), 'studio cachet');
  assert.ok(Object.isFrozen(loadFlight()), 'flight frosset');
  assert.ok(Object.isFrozen(loadStudio()), 'studio frosset');
});

test('fixturen inneholder ingen ikke-endelige tall', () => {
  let checked = 0;
  const walk = (v) => {
    if (typeof v === 'number') {
      checked += 1;
      assert.ok(Number.isFinite(v), `ikke-endelig tall: ${v}`);
    } else if (Array.isArray(v)) {
      for (const x of v) walk(x);
    } else if (v && typeof v === 'object') {
      for (const x of Object.values(v)) walk(x);
    }
  };
  for (const c of loadFlight()) walk(c.out);
  for (const c of loadStudio()) walk(c.out);
  assert.ok(checked > 400000, `forventet mange tall, fikk ${checked}`);
});

/* ── close() ────────────────────────────────────────────────────────────── */

test('close bruker absolutt toleranse og avviser NaN', () => {
  assert.equal(close(1, 1), true, 'eksakt likhet uten toleranse');
  assert.equal(close(0, -0), true, 'null og minus null');
  assert.equal(close(1, 1.0000001, 1e-6), true, 'innenfor toleranse');
  assert.equal(close(1, 1.1, 1e-6), false, 'utenfor toleranse');
  assert.equal(close(1, 1.5, 0.5), true, 'toleransen er inklusiv');
  assert.equal(close(Infinity, Infinity), true, 'identisk uendelig');
  assert.equal(close(NaN, NaN, 1), false, 'NaN er aldri nær noe');
  assert.equal(close(1, Infinity, 1e9), false, 'endelig mot uendelig');
  assert.equal(close('1', 1, 1), false, 'ikke-tall passerer aldri');
  assert.equal(close(undefined, undefined, 1), false, 'undefined passerer aldri');
});

/* ── report() ───────────────────────────────────────────────────────────── */

test('report teller pass/fail og finner maks avvik', () => {
  const green = report('demo/green', [
    { id: 'a', field: 'carry', expected: 1, actual: 1 },
    { id: 'b', field: 'carry', expected: 2, actual: 2.0000004, tol: 1e-6 },
  ]);
  assert.equal(green.ok, true);
  assert.equal(green.total, 2);
  assert.equal(green.passed, 2);
  assert.equal(green.failed, 0);
  assert.equal(green.failures.length, 0);
  assert.ok(green.maxDeviation < 1e-6);
  assert.equal(green.worst.id, 'b');

  const red = report('demo/red', [
    { id: 'a', field: 'carry', expected: 1, actual: 1 },
    { id: 'b', field: 'carry', expected: 2, actual: 5, tol: 1e-6 },
    { id: 'c', field: 'shape', expected: 'Draw', actual: 'Fade' },
  ]);
  assert.equal(red.ok, false);
  assert.equal(red.passed, 1);
  assert.equal(red.failed, 2);
  assert.equal(red.failures.length, 2);
  assert.equal(red.maxDeviation, Infinity, 'ulike strenger gir uendelig avvik');
  assert.match(red.summary, /2 FAIL/);

  const empty = report('demo/empty', []);
  assert.equal(empty.ok, true);
  assert.equal(empty.total, 0);
  assert.equal(empty.worst, null);
  assert.equal(empty.maxDeviation, 0);

  const capped = report(
    'demo/capped',
    Array.from({ length: 50 }, (_, i) => ({ id: `x${i}`, expected: 0, actual: 1 })),
    { maxFailures: 3 },
  );
  assert.equal(capped.failed, 50);
  assert.equal(capped.failures.length, 3);

  const forced = report('demo/forced', [{ expected: 1, actual: 99, pass: true }]);
  assert.equal(forced.ok, true, 'eksplisitt pass overstyrer utledningen');
});

/* ── constants.js mot fixturen ──────────────────────────────────────────── */

test('konstantene er identiske med feltene fixturen eksponerer', () => {
  const flightFields = {
    launchIntercept: constants.launchIntercept,
    launchLoftW: constants.launchLoftW,
    launchLoftQuadratic: constants.launchLoftQuadratic,
    launchAttackW: constants.launchAttackW,
    smashModelIntercept: constants.smashModelIntercept,
    smashSpinLoftLinear: constants.smashSpinLoftLinear,
    smashSpinLoftQuadratic: constants.smashSpinLoftQuadratic,
    smashMinimum: constants.smashMinimum,
    smashMaximum: constants.smashMaximum,
    spinCalibrationLow: constants.spinCalibrationLow,
    spinCalibrationRange: constants.spinCalibrationRange,
    spinCalibrationMidpointDeg: constants.spinCalibrationMidpointDeg,
    spinCalibrationWidthDeg: constants.spinCalibrationWidthDeg,
    maxTotalSpinRpm: constants.maxTotalSpinRpm,
    carryBallSpeedLinear: constants.carryBallSpeedLinear,
    carryBallSpeedQuadratic: constants.carryBallSpeedQuadratic,
    carryFullLaunchAtDeg: constants.carryFullLaunchAtDeg,
    apexBasePerBallSpeed: constants.apexBasePerBallSpeed,
    apexLaunchPerBallSpeedDeg: constants.apexLaunchPerBallSpeedDeg,
    landingBase: constants.landingBase,
    landingSpinLoftTau: constants.landingSpinLoftTau,
    curveCarryProjectionMinimumDownrangeM:
      constants.curveCarryProjectionMinimumDownrangeM,
  };

  const results = [];
  for (const c of loadFlight()) {
    for (const [field, value] of Object.entries(flightFields)) {
      results.push({ id: c.id, field, expected: c.out[field], actual: value });
    }
    results.push({
      id: c.id,
      field: 'aeroModel.dragCompatibilityScale',
      expected: c.out.aeroModel.dragCompatibilityScale,
      actual: constants.dragCompatibilityScale,
    });
    results.push({
      id: c.id,
      field: 'aeroModel.spinDecayPerSecond',
      expected: c.out.aeroModel.spinDecayPerSecond,
      actual: constants.spinDecay,
    });
    results.push({
      id: c.id,
      field: 'aeroModel.integrationStepSeconds',
      expected: c.out.aeroModel.integrationStepSeconds,
      actual: constants.rk4Step,
    });
  }

  const r = report('constants/flight', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('studio-konstantene er identiske med studio-golden _meta.constants', () => {
  const meta = loadStudioMeta().constants;
  assert.equal(constants.studioRadius, meta.radiusM);
  assert.equal(constants.studioBallRadius, meta.ballRadiusM);
  assert.equal(constants.studioSamples, meta.samples);
  assert.equal(constants.studioSweepDeg, meta.sweepDeg);
  assert.equal(constants.studioSweepRad, meta.sweepRad);
  assert.equal(constants.studioPlaneDefaultDeg, meta.planeDefaultDeg);
  assert.equal(constants.lowPointAheadMinM, meta.lowPointAheadMinM);
  assert.equal(constants.lowPointAheadMaxM, meta.lowPointAheadMaxM);
  assert.equal(constants.lowPointIdealM, meta.lowPointIdealM);
  assert.equal(constants.driverBallLiftM, meta.driverBallLiftM);
  assert.deepEqual({ ...constants.arcZ0Cm }, meta.arcZ0Cm);
  assert.deepEqual({ ...constants.sweetSpotAboveSoleM }, meta.sweetSpotAboveSoleM);
});

test('aero-gyldighetsområdene matcher diagnostikken i hver eneste case', () => {
  for (const c of loadFlight()) {
    assert.deepEqual(
      c.out.aerodynamicDiagnostics.reynoldsValidity,
      [...constants.reynoldsValidity],
    );
    assert.deepEqual(
      c.out.aerodynamicDiagnostics.spinParameterValidity,
      [...constants.spinParameterValidity],
    );
  }
});

test('aeroModelIdentity matcher provenance-feltene ordrett', () => {
  const id = constants.aeroModelIdentity;
  for (const c of loadFlight()) {
    assert.equal(c.out.aeroModel.coefficientSetId, id.coefficientSetId);
    assert.equal(c.out.aeroModel.baseCoefficientSetId, id.baseCoefficientSetId);
    assert.equal(c.out.aeroModel.class, id.class);
    assert.equal(c.out.aeroModel.exactNamedBall, id.exactNamedBall);
    assert.equal(c.out.aeroModel.disclosure, id.disclosure);
    assert.equal(c.out.aerodynamicDiagnostics.validityKnown, id.validityKnown);
    assert.equal(
      c.out.aerodynamicDiagnostics.reverseMagnusPolicy,
      id.reverseMagnusPolicy,
    );
    assert.equal(c.out.club, id.club);
  }
});

/* ── Konstanter som spec-en bare oppgir indirekte ───────────────────────── */

test('utledede konstanter reproduserer fixturen bit-eksakt', () => {
  const results = [];
  for (const c of loadFlight()) {
    const o = c.out;
    const verticalSpinLoft = Math.abs(o.dynamicLoft - o.attackAngle);

    // landingSpinAmplitude = 41.5, spec §5.6: 52.8 − 41.5 × exp(−vsl/10.9)
    results.push({
      id: c.id,
      field: 'landingSpinTerm',
      expected: o.landingSpinTerm,
      actual:
        -constants.landingSpinAmplitude *
        Math.exp(-verticalSpinLoft / constants.landingSpinLoftTau),
    });

    // spinCalibration, spec §5.4
    results.push({
      id: c.id,
      field: 'spinCalibration',
      expected: o.spinCalibration,
      actual:
        constants.spinCalibrationLow +
        constants.spinCalibrationRange /
          (1 +
            Math.exp(
              -(verticalSpinLoft - constants.spinCalibrationMidpointDeg) /
                constants.spinCalibrationWidthDeg,
            )),
    });

    // rollFrac, spec §5.6
    results.push({
      id: c.id,
      field: 'rollFrac',
      expected: o.rollFrac,
      actual:
        o.carry > 0
          ? Math.min(
              constants.rollFracMaximum,
              Math.max(
                constants.rollFracMinimum,
                constants.rollFracIntercept -
                  (o.landingAngle - constants.rollFracLandingReferenceDeg) *
                    constants.rollFracLandingSlope,
              ),
            )
          : 0,
    });
  }

  const r = report('constants/derived', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

/* ── ULP-konvensjonen for grader → radianer ─────────────────────────────── */

test('flight konverterer grader med deg * degToRad', () => {
  const results = [];
  for (const c of loadFlight()) {
    const L = c.in.dynamicLoft * constants.degToRad;
    const F = c.in.faceAngle * constants.degToRad;
    const n = [Math.cos(L) * Math.sin(F), Math.cos(L) * Math.cos(F), Math.sin(L)];
    for (let i = 0; i < 3; i += 1) {
      results.push({
        id: c.id,
        field: `faceNormalUnit[${i}]`,
        expected: c.out.faceNormalUnit[i],
        actual: n[i],
      });
    }
  }
  const r = report('ulp/flight-degToRad', results);
  assert.ok(r.ok, r.summary);
});

test('studio konverterer grader med (deg * Math.PI) / 180, ikke deg * degToRad', () => {
  const results = [];
  for (const c of loadStudio()) {
    // Bevisst inline rekkefølge. deg * degToRad gir 1 ULP feil på 57°, 59°, ±3°, ±6°, ±12°.
    const phi = (c.in.swingPlane * Math.PI) / 180;
    // Divisjon, ikke * 0.01. Multiplikasjon gir 1 ULP feil i 250 caser.
    const lowPointX =
      (constants.studioBallPositionOffsetCm - c.in.ballPositionCm) /
      constants.cmPerMetre;
    // Den avsluttende gradskalaen i perDegree er derimot gruppert: * degToRad.
    const perDegree =
      constants.studioRadius * Math.cos(phi) * constants.degToRad;
    const effectiveLowPointX = lowPointX - c.in.swingDirection * perDegree;
    const theta = Math.asin(
      Math.min(
        constants.studioThetaSinClamp,
        Math.max(-constants.studioThetaSinClamp, -effectiveLowPointX / constants.studioRadius),
      ),
    );
    const lowPointZ =
      (c.in.arcHeightCm + constants.arcZ0Cm[c.in.clubMode]) / constants.cmPerMetre;
    const contactHeight =
      lowPointZ + constants.studioRadius * (1 - Math.cos(theta)) * Math.sin(phi);

    results.push(
      { id: c.id, field: 'lowPointX', expected: c.out.lowPointX, actual: lowPointX },
      { id: c.id, field: 'lowPointZ', expected: c.out.lowPointZ, actual: lowPointZ },
      { id: c.id, field: 'effectiveLowPointX', expected: c.out.effectiveLowPointX, actual: effectiveLowPointX },
      { id: c.id, field: 'thetaAtImpact', expected: c.out.thetaAtImpact, actual: theta },
      { id: c.id, field: 'planeBasis.m.z', expected: c.out.planeBasis.m.z, actual: Math.sin(phi) },
      { id: c.id, field: 'contactHeight', expected: c.out.contactHeight, actual: contactHeight },
    );
  }
  const r = report('ulp/studio-inline-rad', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});
