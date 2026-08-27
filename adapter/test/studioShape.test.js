/**
 * studioShape.js — D61/D62 for Studio. Testene binder tegnepunktene til
 * motorens egen `arcPoint`: hvert samplet punkt SKAL være motorens punkt,
 * bare projisert. Finnes det en egen kurveform her, feiler dette.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { studioSolve, CLUB_GEOMETRY, LIE_PRESETS } from '../../engine/src/studioSolve.js';
import { arcPoint } from '../../engine/src/studioContact.js';
import {
  faceOnPoint,
  dtlPoint,
  faceOnArcPoints,
  dtlArcPoints,
  faceOnClubShaft,
  dtlPlaneSegment,
  arcWorldPoint,
  arcWorldPoints,
  tangentWorld,
  planePoint,
  pinholeCamera,
  projectPoint,
} from '../src/studioShape.js';

/** Det dokumenterte jern-eksemplet (spec 03) på fairway-lie. */
function solvedIron(overrides = {}) {
  return studioSolve({
    swingPlane: 60,
    swingDirection: 0,
    ballPositionCm: 0,
    arcHeightCm: 0,
    lieHeightMm: LIE_PRESETS.hardpan,
    club: CLUB_GEOMETRY.midIron,
    dynamicLoftDeg: 31,
    ...overrides,
  });
}

function close(a, b, tol, msg) {
  assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
}

test('n segmenter gir n + 1 punkter; midtpunktet er low point eksakt', () => {
  const s = solvedIron();
  const pts = faceOnArcPoints(s, 96);
  assert.equal(pts.length, 97);
  // t = 0 ved indeks n/2: arcPoint(LP, basis, 0) === LP, bit-eksakt.
  assert.deepEqual(pts[48], [s.lowPointWorld.x, s.lowPointWorld.z]);
  assert.equal(dtlArcPoints(s, 8).length, 9);
});

test('hvert punkt er motorens arcPoint, kun projisert — ingen egen form', () => {
  const s = solvedIron({ swingDirection: 4, ballPositionCm: -6, arcHeightCm: -2 });
  const n = 12;
  const span = 0.6;
  const pts = faceOnArcPoints(s, n, span);
  for (let i = 0; i <= n; i += 1) {
    const t = -span + (2 * span * i) / n;
    const p = arcPoint(s.lowPointWorld, s.planeBasis, t);
    assert.deepEqual(pts[i], [p.x, p.z]);
  }
});

test('projeksjonene: Face On er (x, z), DTL er (−y, z)', () => {
  const p = { x: 1.5, y: -0.25, z: 0.75 };
  assert.deepEqual(faceOnPoint(p), [1.5, 0.75]);
  assert.deepEqual(dtlPoint(p), [0.25, 0.75]);
});

test('bakkekryssingene projiserer til z ≈ 0 (flyttallsresten, aldri nullet)', () => {
  const s = solvedIron({ arcHeightCm: -2 });
  assert.notEqual(s.groundEntry, null);
  const [, ez] = faceOnPoint(s.groundEntry);
  const [, xz] = faceOnPoint(s.groundExit);
  close(ez, 0, 1e-12, 'entry.z');
  close(xz, 0, 1e-12, 'exit.z');
});

test('treffpunktet ligger på den samplede buen', () => {
  const s = solvedIron({ ballPositionCm: 8 });
  const onArc = arcPoint(s.lowPointWorld, s.planeBasis, s.thetaAtImpact);
  assert.deepEqual(faceOnPoint(onArc), [s.impactPoint.x, s.impactPoint.z]);
});

test('ghost-skaftet: sålen er buepunktet, skaftet har bestilt lengde', () => {
  const s = solvedIron();
  const { sole, grip } = faceOnClubShaft(s, s.thetaAtImpact, 0.45);
  const p = arcPoint(s.lowPointWorld, s.planeBasis, s.thetaAtImpact);
  assert.deepEqual(sole, [p.x, p.z]);
  close(Math.hypot(grip[0] - sole[0], grip[1] - sole[1]), 0.45, 1e-12, 'skaftlengde');
  // Skaftet peker innover mot buens senter — altså oppover fra sålen.
  assert.ok(grip[1] > sole[1], 'skaftet peker opp');
});

test('DTL-glasset: stigning = tan(swing plane) når swing direction er 0', () => {
  const s = solvedIron();
  const [[r0, z0], [r1, z1]] = dtlPlaneSegment(s, 0.8);
  const slope = Math.abs((z1 - z0) / (r1 - r0));
  close(slope, Math.tan((60 * Math.PI) / 180), 1e-9, 'planstigning');
});

test('arcWorldPoint/arcWorldPoints er motorens arcPoint, urørt', () => {
  const s = solvedIron({ swingDirection: 3, arcHeightCm: -1.5 });
  assert.deepEqual(arcWorldPoint(s, 0.2), arcPoint(s.lowPointWorld, s.planeBasis, 0.2));
  const pts = arcWorldPoints(s, 10, 0.5);
  assert.equal(pts.length, 11);
  // t = 0 gir LP eksakt; === skiller ikke -0 fra 0 (samme mønster som traceShape-testen).
  assert.ok(pts[5].x === s.lowPointWorld.x && pts[5].y === s.lowPointWorld.y
    && pts[5].z === s.lowPointWorld.z);
});

test('tangentWorld: horisontal i low point, følger planet ellers', () => {
  const s = solvedIron();
  const t0 = tangentWorld(s, 0);
  close(t0.z, 0, 1e-12, 'tangent.z ved theta 0');
  // Ved theta > 0 peker tangenten oppover langs planet.
  assert.ok(tangentWorld(s, 0.3).z > 0);
});

test('planePoint: a langs u, b langs m, fra low point', () => {
  const s = solvedIron();
  const origin = planePoint(s, 0, 0);
  // === skiller ikke -0 fra 0 — LP.y kan være -0 fra motorens sinYaw.
  assert.ok(origin.x === s.lowPointWorld.x && origin.y === s.lowPointWorld.y
    && origin.z === s.lowPointWorld.z);
  const p = planePoint(s, 0.5, 0.25);
  const { u, m } = s.planeBasis;
  close(p.x, s.lowPointWorld.x + 0.5 * u.x + 0.25 * m.x, 1e-12, 'planePoint.x');
  close(p.z, s.lowPointWorld.z + 0.5 * u.z + 0.25 * m.z, 1e-12, 'planePoint.z');
});

test('pinhole: punkt på siktelinjen lander i skjermsentrum, bak kamera → null', () => {
  const cam = pinholeCamera(
    { pos: { x: -2, y: 0, z: 1 }, look: { x: 2, y: 0, z: 1 }, fovDeg: 40 },
    800, 400,
  );
  const centre = projectPoint({ x: 1, y: 0, z: 1 }, cam);
  close(centre.x, 400, 1e-9, 'senter x');
  close(centre.y, 200, 1e-9, 'senter y');
  assert.ok(centre.d > 0);
  assert.equal(projectPoint({ x: -5, y: 0, z: 1 }, cam), null);
});

test('kontrakt: ødelagt solved kastes, ikke tegnes', () => {
  const s = solvedIron();
  assert.throws(() => faceOnArcPoints({ ...s, lowPointWorld: null }), TypeError);
  assert.throws(() => faceOnArcPoints({ ...s, planeBasis: undefined }), TypeError);
  assert.throws(() => faceOnArcPoints(s, 1), TypeError);
  assert.throws(() => faceOnArcPoints(s, 96, NaN), TypeError);
  assert.throws(() => faceOnClubShaft(s, NaN), TypeError);
});
