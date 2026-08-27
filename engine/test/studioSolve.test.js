/**
 * Integrasjonstest for studioSolve v2 mot hele studio-fixturen.
 *
 * v2 er en BEVISST versjonert endring (D7). Testen sjekker derfor ikke at
 * tallene er like — de skal ikke være det. Den sjekker at endringen er den
 * vi har besluttet, og bare den.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { studioSolve, CLUB_GEOMETRY, LIE_PRESETS } from '../src/studioSolve.js';

const cases = JSON.parse(
  readFileSync(new URL('../../motor/export/studio-golden.json', import.meta.url)),
).cases.filter((r) => r.out);

/** v1 sitt clubMode oversatt til v2 sine to akser. */
const AS_V2 = {
  iron: { lie: LIE_PRESETS.hardpan, club: CLUB_GEOMETRY.midIron, loft: 31 },
  driver: { lie: LIE_PRESETS.tee, club: CLUB_GEOMETRY.driver, loft: 12.5 },
};

function run(r) {
  const cfg = AS_V2[r.in.clubMode];
  return studioSolve({
    swingPlane: r.in.swingPlane,
    swingDirection: r.in.swingDirection,
    ballPositionCm: r.in.ballPositionCm,
    arcHeightCm: r.in.arcHeightCm,
    lieHeightMm: cfg.lie,
    club: cfg.club,
    dynamicLoftDeg: cfg.loft,
  });
}

test('alle 2500 caser gir endelige tall i hvert numeriske felt', () => {
  let checked = 0;
  for (const r of cases) {
    const v2 = run(r);
    for (const [k, val] of Object.entries(v2)) {
      if (typeof val === 'number') {
        assert.ok(Number.isFinite(val), `${k} er ikke endelig for ${JSON.stringify(r.in)}`);
        checked += 1;
      }
    }
  }
  assert.ok(checked > 20000, `for faa felt kontrollert: ${checked}`);
});

test('attack og path er UENDRET fra v1 — koellenoeytral geometri', () => {
  let maxA = 0;
  let maxP = 0;
  for (const r of cases) {
    const v2 = run(r);
    maxA = Math.max(maxA, Math.abs(v2.attackAngle - r.out.attackAngle));
    maxP = Math.max(maxP, Math.abs(v2.clubPath - r.out.clubPath));
  }
  assert.ok(maxA < 1e-12, `attack flyttet seg ${maxA} — den skal ikke det`);
  assert.ok(maxP < 1e-12, `path flyttet seg ${maxP} — den skal ikke det`);
});

test('D3: offset overskrider aldri halve slagflaten uten OffFace', () => {
  for (const r of cases) {
    const v2 = run(r);
    const half = v2.verticalFaceHeightMm / 2;
    if (Math.abs(v2.faceCentreOffsetMm) > half) {
      assert.equal(v2.onFace, false);
      assert.equal(v2.facePosition, 'OffFace',
        `offset ${v2.faceCentreOffsetMm.toFixed(1)} > halv flate ${half.toFixed(1)} men ikke OffFace`);
    }
  }
});

test('begge klassifiseringssvar staar alltid — U1', () => {
  for (const r of cases) {
    const v2 = run(r);
    assert.ok(typeof v2.facePosition === 'string', 'flateposisjon mangler');
    if (v2.hasTurfContact) {
      assert.ok(typeof v2.turfBand === 'string', 'turf i spill men turfBand mangler');
    } else {
      assert.equal(v2.turfBand, null, 'ingen turf, men turfBand satt');
    }
    assert.equal(v2.strikeLead, v2.hasTurfContact ? v2.turfBand : v2.facePosition);
  }
});

test('proveniens foelger med hvert svar — ingen skjult antagelse', () => {
  const r = run(cases[0]);
  assert.equal(typeof r.lieHeightMm, 'number');
  assert.equal(typeof r.sweetSpotHeightMm, 'number');
  assert.ok(['measured', 'interpolated', 'assumed'].includes(r.clubGeometryConfidence));
  assert.equal(r.ballRadiusM, 0.021336);
});

test('F11-vakt: sweetspot er aldri tallidentisk med ballradius', () => {
  for (const cfg of Object.values(AS_V2)) {
    assert.notEqual(cfg.club.sweetSpotHeightMm, 21.336,
      'sweetspot er ballradiusen igjen — F11 har kroepet tilbake');
  }
});

test('ingen presentasjonsdata i returobjektet', () => {
  const json = JSON.stringify(run(cases[0]));
  assert.ok(!/#[0-9A-Fa-f]{6}/.test(json), 'hex-farge i motoroutput');
  for (const k of ['color', 'textColor', 'tip', 'pct', 'barPos', 'strikeQuality']) {
    assert.ok(!json.includes(`"${k}"`), `presentasjonsfeltet ${k} er tilbake`);
  }
});

test('ren funksjon: samme input gir identisk output, input uroert', () => {
  const input = {
    swingPlane: 55, swingDirection: -3, ballPositionCm: 2, arcHeightCm: 1,
    lieHeightMm: LIE_PRESETS.fairway, club: CLUB_GEOMETRY.midIron, dynamicLoftDeg: 31,
  };
  const snapshot = JSON.stringify(input);
  const a = JSON.stringify(studioSolve(input));
  const b = JSON.stringify(studioSolve(input));
  assert.equal(a, b);
  assert.equal(JSON.stringify(input), snapshot, 'input ble mutert');
});
