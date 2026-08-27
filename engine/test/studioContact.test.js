/**
 * studioContact mot studio-golden.json.
 *
 * Kjører modulen over alle 2500 løste studio-caser og sammenligner de seks
 * feltene den eier — `contactHeight`, `groundCrossingTheta0`, `groundEntry`,
 * `groundExit`, `faceCentreOffsetMm` og `clubBallContact` — mot fixturen.
 *
 * TOLERANSE — hva som faktisk trengs: 0. Alle elleve tallfeltene reproduseres
 * bit-eksakt på alle 2500 caser, inkludert `groundCrossingTheta0` i radianer og
 * `faceCentreOffsetMm` i millimeter. Oppgaven ba om 1e-9 relativt; det kjøres
 * som kontrakt-toleranse i den første testen, men den andre testen låser det
 * som faktisk stemmer: eksakt likhet. 1e-6 absolutt var ikke nødvendig noe sted
 * og brukes ikke.
 *
 * Ikke slakk noen av disse. Ryker eksakt-testen har operasjonsrekkefølgen i
 * `src/studioContact.js` endret seg, og det er en fysikkendring i forkledning.
 *
 * MERK om ±0: `JSON.stringify(-0)` er `"0"`, så fixturen kan ikke bære
 * fortegnet på null. `close()` i `_fixture.js` sammenligner med `===`, og
 * `-0 === 0` er true. Det er riktig her: kilden serialiserte gjennom samme tap.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadStudio, loadStudioMeta, report } from './_fixture.js';

import {
  arcPoint,
  clubBallContact,
  contactHeight,
  effectiveLowPointX,
  faceCentreOffsetMm,
  groundCrossings,
  groundCrossingTheta0,
  lowPointShiftPerDegree,
  lowPointWorld,
  lowPointX,
  lowPointZ,
  planeBasis,
  planeYawRad,
  solveStudioContact,
  swingPlaneRad,
  thetaAtImpact,
} from '../src/studioContact.js';

/** Alle 2500 caser er relevante — modulen har ingen input den ikke dekker. */
const CASE_COUNT = 2500;

/** Relativ toleranse fra oppgaven. Absolutt tall, utledet per case. */
const RELATIVE_TOLERANCE = 1e-9;

/** Skalarfelt i `out` som modulen eier direkte. */
const SCALAR_FIELDS = ['contactHeight', 'faceCentreOffsetMm'];

/** Feltene i `clubBallContact`. */
const CONTACT_FIELDS = ['clubZ', 'offset', 'offsetRatio', 'theta'];

/** Nullbare punktfelt, sammenlignet komponentvis. */
const POINT_FIELDS = ['groundEntry', 'groundExit'];

const AXES = ['x', 'y', 'z'];

/** Kjører modulen over hele fixturen én gang og gir [case, expected, actual]. */
function evaluated() {
  return loadStudio().map((c) => [c, c.out, solveStudioContact(c.in)]);
}

/**
 * Én sammenligningsoppføring per tallfelt per case, med gitt toleransefunksjon.
 * Nullbare felt gir i tillegg én `{pass}`-oppføring for selve null-formen, slik
 * at «alt er null» ikke kan snike seg gjennom som elleve grønne tall.
 */
function* comparisons(tolerance) {
  for (const [c, expected, actual] of evaluated()) {
    for (const field of SCALAR_FIELDS) {
      yield {
        id: c.id,
        field,
        expected: expected[field],
        actual: actual[field],
        tol: tolerance(expected[field]),
      };
    }

    for (const field of CONTACT_FIELDS) {
      yield {
        id: c.id,
        field: `clubBallContact.${field}`,
        expected: expected.clubBallContact[field],
        actual: actual.clubBallContact[field],
        tol: tolerance(expected.clubBallContact[field]),
      };
    }

    // `groundCrossingTheta0` er tall eller null. Formen sjekkes først.
    const thetaIsNull = expected.groundCrossingTheta0 === null;
    yield {
      id: c.id,
      field: 'groundCrossingTheta0.isNull',
      expected: thetaIsNull,
      actual: actual.groundCrossingTheta0 === null,
      pass: thetaIsNull === (actual.groundCrossingTheta0 === null),
    };
    if (!thetaIsNull) {
      yield {
        id: c.id,
        field: 'groundCrossingTheta0',
        expected: expected.groundCrossingTheta0,
        actual: actual.groundCrossingTheta0,
        tol: tolerance(expected.groundCrossingTheta0),
      };
    }

    for (const field of POINT_FIELDS) {
      const pointIsNull = expected[field] === null;
      yield {
        id: c.id,
        field: `${field}.isNull`,
        expected: pointIsNull,
        actual: actual[field] === null,
        pass: pointIsNull === (actual[field] === null),
      };
      if (pointIsNull) continue;
      for (const axis of AXES) {
        yield {
          id: c.id,
          field: `${field}.${axis}`,
          expected: expected[field][axis],
          actual: actual[field][axis],
          tol: tolerance(expected[field][axis]),
        };
      }
    }
  }
}

/* ── Fixturen ───────────────────────────────────────────────────────────── */

test('alle 2500 caser er innenfor 1e-9 relativt', () => {
  const result = report('studio/studioContact@1e-9rel', comparisons(
    (expected) => RELATIVE_TOLERANCE * Math.abs(expected),
  ));

  // 2 skalarer + 4 kontaktfelt + 3 null-former = 9 per case, pluss
  // 1 theta + 6 punktkomponenter på de 1125 casene som faktisk krysser bakken.
  assert.equal(result.total, CASE_COUNT * 9 + 1125 * 7, 'antall sammenligninger');
  assert.ok(result.ok, `${result.summary}\n${JSON.stringify(result.failures, null, 2)}`);
});

test('alle 2500 caser er bit-eksakte — dette er den bindende testen', () => {
  const result = report('studio/studioContact@exact', comparisons(() => 0));

  assert.equal(result.failed, 0, `${result.summary}\n${JSON.stringify(result.failures, null, 2)}`);
  assert.equal(result.maxDeviation, 0, result.summary);
});

test('fixturen dekkes helt: 2500 caser, 1250 iron og 1250 driver', () => {
  const cases = loadStudio();
  const counts = loadStudioMeta().counts;

  assert.equal(cases.length, CASE_COUNT);
  assert.equal(counts.total, CASE_COUNT);
  assert.equal(cases.filter((c) => c.in.clubMode === 'iron').length, counts.ironValidatedTrue);
  assert.equal(cases.filter((c) => c.in.clubMode === 'driver').length, counts.driverValidatedFalse);
});

/* ── Grenene fixturen faktisk krever ────────────────────────────────────── */

test('null-grenen i groundCrossingTheta0 slår inn, og treffer nøyaktig zLP >= 0', () => {
  // ENGINE-GAPS §8: `c >= 1 || c <= -1` → begge kryssingene er null.
  // Med φ i 30–80° er `R sin φ > 0`, så `c >= 1` ⇔ `zLP >= 0`.
  let nulls = 0;
  let crossings = 0;

  for (const [c, expected, actual] of evaluated()) {
    const zLowPoint = lowPointZ(c.in.arcHeightCm, c.in.clubMode);
    const isNull = expected.groundCrossingTheta0 === null;

    assert.equal(isNull, zLowPoint >= 0, `${c.id}: zLP ${zLowPoint}`);
    assert.equal(actual.groundCrossingTheta0 === null, isNull, c.id);
    assert.equal(actual.groundEntry === null, isNull, c.id);
    assert.equal(actual.groundExit === null, isNull, c.id);

    if (isNull) nulls += 1;
    else crossings += 1;
  }

  assert.equal(nulls, 1375, 'caser uten bakkekryssing');
  assert.equal(crossings, 1125, 'caser med bakkekryssing');
});

test('groundEntry/Exit har IKKE z tvunget til 0 — resten er rå flyttall', () => {
  // Punkt A i modulhodet. Nuller man z, ryker alle 1125 kryssende caser.
  let nonZeroZ = 0;
  let largestZ = 0;

  for (const [c, expected] of evaluated()) {
    if (expected.groundEntry === null) continue;
    for (const point of [expected.groundEntry, expected.groundExit]) {
      if (point.z !== 0) {
        nonZeroZ += 1;
        largestZ = Math.max(largestZ, Math.abs(point.z));
      }
    }
    assert.ok(Number.isFinite(expected.groundEntry.z), c.id);
  }

  assert.ok(nonZeroZ > 0, 'fixturen har kryssinger med z ≠ 0');
  assert.ok(largestZ < 1e-15, `resten er flyttallsstøy, ikke geometri: ${largestZ}`);
});

test('Entry ligger bak Exit langs buen: P(−θ_g) og P(+θ_g), ikke omvendt', () => {
  let checked = 0;
  for (const [c, , actual] of evaluated()) {
    if (actual.groundCrossingTheta0 === null) continue;

    const theta0 = actual.groundCrossingTheta0;
    assert.ok(theta0 > 0, `${c.id}: θ_g skal være positiv`);

    const yaw = planeYawRad(c.in.swingDirection);
    const plane = swingPlaneRad(c.in.swingPlane);
    const zLowPoint = lowPointZ(c.in.arcHeightCm, c.in.clubMode);
    const xEffective = effectiveLowPointX(
      lowPointX(c.in.ballPositionCm),
      c.in.swingDirection,
      plane,
    );
    const theta = thetaAtImpact(xEffective);
    const basis = planeBasis(yaw, plane);
    const lowPoint = lowPointWorld(xEffective, zLowPoint, theta, yaw, plane);

    assert.deepEqual(actual.groundEntry, arcPoint(lowPoint, basis, -theta0), c.id);
    assert.deepEqual(actual.groundExit, arcPoint(lowPoint, basis, theta0), c.id);
    checked += 1;
  }
  assert.equal(checked, 1125);
});

test('P(θ_treff) lander på ballen: (0, 0, contactHeight)', () => {
  // Buen er konstruert slik at treffpunktet er ballens origo. Fixturens
  // `impactPoint` sier det samme; her verifiseres at `lowPointWorld` og
  // `arcPoint` faktisk komponerer til den identiteten.
  let checked = 0;
  for (const [c, expected] of evaluated()) {
    const plane = swingPlaneRad(c.in.swingPlane);
    const yaw = planeYawRad(c.in.swingDirection);
    const xEffective = effectiveLowPointX(
      lowPointX(c.in.ballPositionCm),
      c.in.swingDirection,
      plane,
    );
    const theta = thetaAtImpact(xEffective);
    const zLowPoint = lowPointZ(c.in.arcHeightCm, c.in.clubMode);
    const point = arcPoint(
      lowPointWorld(xEffective, zLowPoint, theta, yaw, plane),
      planeBasis(yaw, plane),
      theta,
    );

    assert.ok(Math.abs(point.x) < 1e-15, `${c.id}: x ${point.x}`);
    assert.ok(Math.abs(point.y) < 1e-15, `${c.id}: y ${point.y}`);
    assert.ok(Math.abs(point.z - expected.contactHeight) < 1e-15, c.id);
    checked += 1;
  }
  assert.equal(checked, CASE_COUNT);
});

test('faceCentreOffsetMm bruker lift og sweet per kølle — begge leddene trengs', () => {
  // ENGINE-GAPS §9. Bytter man driverens verdier mot jernets, ryker halve
  // fixturen. Teller det her så ingen «forenkler» kartet til én verdi.
  let ironCases = 0;
  let driverCases = 0;
  let driverWouldDiffer = 0;
  let ironSimplificationWouldDiffer = 0;

  for (const [c, expected, actual] of evaluated()) {
    assert.equal(actual.faceCentreOffsetMm, expected.faceCentreOffsetMm, c.id);

    if (c.in.clubMode === 'iron') {
      ironCases += 1;
      // Jern har lift 0 og sweet = ballradius, så uttrykket ER algebraisk
      // −clubZ i mm — men IKKE i flyttall. Parentesene fra ENGINE-GAPS §9 er
      // load-bearing; forkortingen ryker i 376 av 1250 caser.
      assert.ok(
        Math.abs(actual.faceCentreOffsetMm - -actual.contactHeight * 1000) < 1e-13,
        `${c.id}: forkortingen skal være algebraisk lik`,
      );
      if (-actual.contactHeight * 1000 !== expected.faceCentreOffsetMm) {
        ironSimplificationWouldDiffer += 1;
      }
    } else {
      driverCases += 1;
      if (faceCentreOffsetMm(actual.contactHeight, 'iron') !== expected.faceCentreOffsetMm) {
        driverWouldDiffer += 1;
      }
    }
  }

  assert.equal(ironCases, 1250);
  assert.equal(driverCases, 1250);
  assert.equal(driverWouldDiffer, 1250, 'alle driverne krever driverens lift/sweet');
  assert.equal(
    ironSimplificationWouldDiffer,
    376,
    'jern-forkortingen −clubZ · 1000 er algebraisk riktig og bit-feil',
  );
});

test('driverstand-in går til −121 mm på en flate som er ~60 mm høy — behold det', () => {
  // FUNN F7. Testen er en påminnelse, ikke en advarsel: verdien skal ikke
  // klampes eller «rimeligjøres» i motoren.
  const drivers = loadStudio()
    .filter((c) => c.in.clubMode === 'driver')
    .map((c) => solveStudioContact(c.in).faceCentreOffsetMm);

  assert.equal(Math.min(...drivers), -121.15379342744514);
  assert.ok(Math.max(...drivers) > 0, 'stand-in spenner over hele fortegnet');
});

test('clubBallContact bruker Studios ballradius 0.0213, uten løftkorreksjon', () => {
  // Punkt B i modulhodet. Driveren får `driverBallLiftM` i faceCentreOffsetMm,
  // men IKKE her. Det ser inkonsistent ut; det er dagens motor.
  const BALL_RADIUS = loadStudioMeta().constants.ballRadiusM;
  assert.equal(BALL_RADIUS, 0.0213);

  let checked = 0;
  for (const [c, expected, actual] of evaluated()) {
    assert.equal(actual.clubBallContact.offset, actual.contactHeight - BALL_RADIUS, c.id);
    assert.equal(
      actual.clubBallContact.offsetRatio,
      actual.clubBallContact.offset / BALL_RADIUS,
      c.id,
    );
    assert.equal(actual.clubBallContact.clubZ, expected.contactHeight, c.id);
    checked += 1;
  }
  assert.equal(checked, CASE_COUNT);
});

/* ── Formen på returverdien ─────────────────────────────────────────────── */

test('returobjektet inneholder kun de seks feltene modulen eier', () => {
  const out = solveStudioContact({
    swingPlane: 30,
    swingDirection: -12,
    ballPositionCm: -20,
    arcHeightCm: -5,
    clubMode: 'iron',
  });

  assert.deepEqual(Object.keys(out).sort(), [
    'clubBallContact',
    'contactHeight',
    'faceCentreOffsetMm',
    'groundCrossingTheta0',
    'groundEntry',
    'groundExit',
  ]);
  assert.deepEqual(Object.keys(out.clubBallContact).sort(), [
    'clubZ',
    'offset',
    'offsetRatio',
    'theta',
  ]);

  // Ordrett fra fixturen, grid.full-width.1.
  assert.equal(out.contactHeight, 0.007900290360005287);
  assert.equal(out.groundCrossingTheta0, 0.4194002428218526);
  assert.deepEqual(out.groundEntry, {
    x: 0.03610263282078979,
    y: -0.0063155548924296034,
    z: -1.3877787807814457e-17,
  });
  assert.deepEqual(out.groundExit, {
    x: 0.9920566469425263,
    y: 0.1968787434639425,
    z: -1.3877787807814457e-17,
  });
  assert.equal(out.faceCentreOffsetMm, -7.900290360005287);
  assert.deepEqual(out.clubBallContact, {
    clubZ: 0.007900290360005287,
    offset: -0.013399709639994713,
    offsetRatio: -0.6290943492955264,
    theta: -0.45064541227536237,
  });
});

test('ingen farger, UI-strenger eller presentasjonsdata i returobjektet', () => {
  // FUNN F6: fixturens `strikeQuality` bærer Tailwind-palett og engelske
  // tips-strenger. Ingenting av det skal inn i en returverdi.
  const banned = ['color', 'textColor', 'tip', 'pct', 'barPos', 'band', 'strikeBand'];

  for (const [, , actual] of evaluated().slice(0, 50)) {
    const seen = JSON.stringify(actual);
    for (const key of banned) {
      assert.ok(!seen.includes(`"${key}"`), `returobjektet lekker ${key}`);
    }
    assert.ok(!/#[0-9A-Fa-f]{6}/.test(seen), 'returobjektet lekker en fargekode');
  }
});

test('modulen er ren: samme input gir bit-identisk output, input mutseres ikke', () => {
  const input = {
    swingPlane: 61,
    swingDirection: 1,
    ballPositionCm: -1,
    arcHeightCm: -3,
    clubMode: 'driver',
  };
  const frozen = JSON.stringify(input);

  const first = solveStudioContact(input);
  const second = solveStudioContact(input);

  assert.equal(JSON.stringify(input), frozen, 'input er urørt');
  assert.deepEqual(first, second);
  assert.notEqual(first, second, 'nytt objekt hver gang, ingen delt tilstand');
});

/* ── Delfunksjonene ─────────────────────────────────────────────────────── */

test('delfunksjonene komponerer til det samlede kallet', () => {
  for (const c of loadStudio().slice(0, 200)) {
    const plane = swingPlaneRad(c.in.swingPlane);
    const yaw = planeYawRad(c.in.swingDirection);
    const xEffective = effectiveLowPointX(
      lowPointX(c.in.ballPositionCm),
      c.in.swingDirection,
      plane,
    );
    const theta = thetaAtImpact(xEffective);
    const zLowPoint = lowPointZ(c.in.arcHeightCm, c.in.clubMode);
    const clubZ = contactHeight(zLowPoint, theta, plane);
    const theta0 = groundCrossingTheta0(zLowPoint, plane);
    const crossings = groundCrossings(
      lowPointWorld(xEffective, zLowPoint, theta, yaw, plane),
      planeBasis(yaw, plane),
      theta0,
    );

    assert.deepEqual(solveStudioContact(c.in), {
      contactHeight: clubZ,
      groundCrossingTheta0: theta0,
      groundEntry: crossings.groundEntry,
      groundExit: crossings.groundExit,
      faceCentreOffsetMm: faceCentreOffsetMm(clubZ, c.in.clubMode),
      clubBallContact: clubBallContact(clubZ, theta),
    }, c.id);
  }
});

test('gradkonverteringen er Studio-formen (deg * PI) / 180, ikke deg * degToRad', () => {
  // ULP-fellen i README. Én verdi der de to grupperingene faktisk skiller lag.
  assert.equal(swingPlaneRad(30), (30 * Math.PI) / 180);
  assert.equal(planeYawRad(-12), (12 * Math.PI) / 180);

  const cases = loadStudio();
  let planeDiffers = 0;
  let yawDiffers = 0;
  for (const c of cases) {
    if (swingPlaneRad(c.in.swingPlane) !== c.in.swingPlane * (Math.PI / 180)) {
      planeDiffers += 1;
    }
    if (planeYawRad(c.in.swingDirection) !== -c.in.swingDirection * (Math.PI / 180)) {
      yawDiffers += 1;
    }
  }
  assert.ok(planeDiffers > 0, 'φ: de to grupperingene er ikke samme tall');
  assert.ok(yawDiffers > 0, 'ψ: de to grupperingene er ikke samme tall');

  // Unntaket: `perDegree` bruker den MOTSATTE grupperingen, `* degToRad`.
  const plane = swingPlaneRad(30);
  assert.equal(lowPointShiftPerDegree(plane), 1.2 * Math.cos(plane) * (Math.PI / 180));
});

test('cm → meter er divisjon med 100, ikke multiplikasjon med 0.01', () => {
  // 250 av 2500 caser skiller de to — nøyaktig de med ballPositionCm = −10,
  // der (10.5 + 10) / 100 = 0.205 og (10.5 + 10) · 0.01 = 0.20500000000000002.
  assert.equal(lowPointX(2.5), (10.5 - 2.5) / 100);
  assert.equal(lowPointX(-10), 0.205);
  assert.notEqual(lowPointX(-10), (10.5 - -10) * 0.01);

  let differs = 0;
  for (const c of loadStudio()) {
    if (lowPointX(c.in.ballPositionCm) !== (10.5 - c.in.ballPositionCm) * 0.01) {
      differs += 1;
    }
  }
  assert.equal(differs, 250, 'nøyaktig de casene README nevner');
});

test('arcZ0Cm: iron −0.2 cm, driver +1.8 cm', () => {
  assert.equal(lowPointZ(0, 'iron'), -0.2 / 100);
  assert.equal(lowPointZ(0, 'driver'), 1.8 / 100);
  assert.equal(lowPointZ(-5, 'iron'), (-5 + -0.2) / 100);
  assert.equal(lowPointZ(-5, 'driver'), (-5 + 1.8) / 100);
});

test('thetaAtImpact klampes på ±0.999, ikke ±1', () => {
  // Clampen er aldri aktiv i fixturen (|xEff| / R når 0.44 på det høyeste),
  // men spec §8.3 og kilden har den. Testes direkte.
  assert.equal(thetaAtImpact(-1.2), Math.asin(0.999));
  assert.equal(thetaAtImpact(1.2), Math.asin(-0.999));

  // xEff = 0 gir −0, ikke +0: fortegnsvendingen `-0 / R` overlever asin.
  // Fixturen kan ikke bære det (`JSON.stringify(-0)` er `"0"`), men koden gjør,
  // og `Object.is` skiller dem. Ingen grunn til å normalisere det bort.
  // (`assert.equal` er strict og skiller ±0 selv; `===` gjør ikke det, og det
  // er `===` `close()` i _fixture.js bruker.)
  assert.ok(Object.is(thetaAtImpact(0), -0), 'θ(0) er −0');
  assert.ok(thetaAtImpact(0) === 0, '−0 === 0, så fixturen ser ingen forskjell');

  let maxRatio = 0;
  for (const c of loadStudio()) {
    const plane = swingPlaneRad(c.in.swingPlane);
    const xEffective = effectiveLowPointX(
      lowPointX(c.in.ballPositionCm),
      c.in.swingDirection,
      plane,
    );
    maxRatio = Math.max(maxRatio, Math.abs(xEffective) / 1.2);
  }
  assert.ok(maxRatio < 0.999, `clampen er udekket av fixturen: ${maxRatio}`);
});

test('planeBasis er ortonormal', () => {
  for (const [planeDeg, yawDeg] of [[30, -12], [55, 0], [80, 12], [61, 1]]) {
    const { u, m } = planeBasis(planeYawRad(yawDeg), swingPlaneRad(planeDeg));

    assert.ok(Math.abs(Math.hypot(u.x, u.y, u.z) - 1) < 1e-15, '|u| = 1');
    assert.ok(Math.abs(Math.hypot(m.x, m.y, m.z) - 1) < 1e-15, '|m| = 1');
    assert.ok(Math.abs(u.x * m.x + u.y * m.y + u.z * m.z) < 1e-15, 'u ⟂ m');
    assert.equal(u.z, 0, 'u er horisontal');
  }
});
