import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SUPPORTED, STUDIO_METRICS, EXCLUDED_METRICS, metricSupport, auditDebt,
} from '../src/metricRegistry.js';
import { studioSolve, CLUB_GEOMETRY, LIE_PRESETS } from '../src/studioSolve.js';

const catalog = JSON.parse(
  readFileSync(new URL('../../motor/export/ask-catalog.json', import.meta.url)),
);

test('tre av fem gjeldsposter er lukket, to er ekte gjeld', () => {
  const audit = auditDebt(catalog._knownDebt);
  const closed = audit.filter((a) => a.closed).map((a) => a.questionId);
  const open = audit.filter((a) => !a.closed).map((a) => a.questionId);
  assert.deepEqual(closed.sort(), ['fat-contact', 'low-point', 'thin-contact']);
  assert.deepEqual(open.sort(), ['altitude-temperature', 'wind']);
  for (const a of audit.filter((x) => !x.closed)) {
    assert.match(a.reason, /spec/, 'aapen gjeld maa ha en grunn, ikke bare mangle');
  }
});

test('studioSolve produserer faktisk hvert felt de nye metrikkene peker paa', () => {
  const r = studioSolve({
    swingPlane: 60, swingDirection: 0, ballPositionCm: 0, arcHeightCm: 0,
    lieHeightMm: LIE_PRESETS.fairway, club: CLUB_GEOMETRY.midIron, dynamicLoftDeg: 31,
  });
  for (const [id, m] of Object.entries(STUDIO_METRICS)) {
    assert.ok(m.field in r, `${id} peker paa ${m.field}, som studioSolve ikke returnerer`);
    if (!m.nullable) {
      assert.notEqual(r[m.field], undefined, `${id} -> ${m.field} er undefined`);
    }
  }
});

test('utelukkede metrikker er utelukket med grunn, ikke glemt', () => {
  for (const [id, reason] of Object.entries(EXCLUDED_METRICS)) {
    assert.ok(!(id in SUPPORTED), `${id} er baade stoettet og utelukket`);
    const s = metricSupport(id);
    assert.equal(s.supported, false);
    assert.match(s.reason, /spec/);
  }
});

test('hver metrikk i katalogens spoersmaal har en kjent status', () => {
  const used = new Set();
  for (const q of catalog.questions) for (const m of q.metricIds ?? []) used.add(m);
  const unknown = [...used].filter((m) => metricSupport(m).reason === 'ukjent metrikk');
  assert.deepEqual(unknown, [], `metrikker uten status: ${unknown.join(', ')}`);
});

test('ingen metrikk mangler plan-tilhoerighet', () => {
  const OK = new Set(['direction', 'height', 'both', 'studio']);
  for (const [id, m] of Object.entries(SUPPORTED)) {
    assert.ok(OK.has(m.plane), `${id} mangler gyldig plane, har ${m.plane}`);
  }
});
