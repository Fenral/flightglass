/**
 * §5.3 Launch Angle — mot golden-fixturen.
 *
 * Fixturen er fasit. Modulen kjøres over ALLE 5028 løste flight-caser og
 * sammenlignes mot `out.launchAngle` og `out.launchInterceptBlend`.
 *
 * TOLERANSE: oppgaven ba om 1e-9 relativt, med 1e-6 absolutt som reserve for
 * grader. Ingen av delene trengtes. Modellen er ren aritmetikk på tall som
 * allerede finnes i fixturen, uten trigonometri eller iterasjon, og
 * reproduserer alle 5028 caser BIT-EKSAKT. Testene under kjører derfor begge:
 * først 1e-9 relativt slik oppgaven ba om, så en hardere assert på at det
 * faktiske avviket er nøyaktig 0. Slakk ikke opp det siste — et avvik på
 * 1 ULP her betyr at noen har endret rekkefølgen i uttrykket.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, loadFlightErrors, report } from './_fixture.js';
import {
  interceptBlend,
  launchAngleDeg,
  solveLaunchAngle,
  launchModelCoefficients,
} from '../src/launchAngle.js';

/** Oppgavens toleranse. Brukes relativt: tol = RELATIVE × |expected|. */
const RELATIVE_TOLERANCE = 1e-9;

/** Reserven oppgaven tillot for grader. Ikke i bruk — dokumentert, ikke slettet. */
const ABSOLUTE_DEGREE_FALLBACK = 1e-6;

const relativeTol = (expected) => RELATIVE_TOLERANCE * Math.abs(expected);

/* ── Hovedsammenligning ─────────────────────────────────────────────────── */

test('launchAngle reproduserer alle 5028 flight-caser', () => {
  const cases = loadFlight();
  assert.equal(cases.length, 5028, 'alle løste caser er relevante for §5.3');

  const results = [];
  for (const c of cases) {
    const actual = solveLaunchAngle(c.in);
    results.push({
      id: c.id,
      field: 'launchAngle',
      expected: c.out.launchAngle,
      actual: actual.launchAngle,
      tol: relativeTol(c.out.launchAngle),
    });
  }

  const r = report('flight/launchAngle', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5028, r.summary);
  assert.equal(
    r.maxDeviation,
    0,
    `forventet bit-eksakt, ikke bare innenfor ${RELATIVE_TOLERANCE} relativt ` +
      `(reserve ${ABSOLUTE_DEGREE_FALLBACK} absolutt) — ${r.summary}`,
  );
});

test('launchInterceptBlend reproduserer alle 5028 flight-caser', () => {
  const results = [];
  for (const c of loadFlight()) {
    results.push({
      id: c.id,
      field: 'launchInterceptBlend',
      expected: c.out.launchInterceptBlend,
      actual: solveLaunchAngle(c.in).launchInterceptBlend,
      tol: relativeTol(c.out.launchInterceptBlend),
    });
  }

  const r = report('flight/launchInterceptBlend', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5028, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('koeffisientene er identiske med feltene fixturen eksponerer', () => {
  const results = [];
  for (const c of loadFlight()) {
    for (const [field, value] of Object.entries(launchModelCoefficients)) {
      results.push({ id: c.id, field, expected: c.out[field], actual: value });
    }
  }

  const r = report('flight/launchModelCoefficients', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5028 * 4, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

/* ── Uttrykket, uavhengig av constants.js ───────────────────────────────── */

test('modellen matcher spec §5.3 skrevet ut med literaler', () => {
  // Bevisst duplisert fra spec-en, ikke importert. Fanger opp at noen endrer
  // en konstant i constants.js uten å endre baseline bevisst og versjonert.
  const results = [];
  for (const c of loadFlight()) {
    const dl = c.in.dynamicLoft;
    const aa = c.in.attackAngle;
    const blend = Math.min(Math.max(dl / 10, 0), 1);
    const expected =
      10.391891433573875 * blend +
      -0.1693792957175766 * dl +
      0.012024703872880052 * (dl * dl) +
      0.25 * aa;

    results.push({
      id: c.id,
      field: 'launchAngle',
      expected,
      actual: launchAngleDeg(dl, aa),
    });
  }

  const r = report('spec/§5.3-literals', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('kvadratet er dl * dl — ikke Math.pow, ikke **', () => {
  // Ingen av de tre formene avviker på fixturens loft-verdier, men rekkefølgen
  // er låst av baseline. Testen dokumenterer valget og fanger opp at noen
  // bytter til en form som avviker på framtidige input.
  for (const c of loadFlight()) {
    const dl = c.in.dynamicLoft;
    assert.equal(dl * dl, Math.pow(dl, 2), `dl=${dl}`);
  }
});

/* ── Funksjonenes egen kontrakt ─────────────────────────────────────────── */

test('solveLaunchAngle returnerer nøyaktig de to feltene, intet mer', () => {
  const out = solveLaunchAngle({ dynamicLoft: 24, attackAngle: -3 });
  assert.deepEqual(Object.keys(out).sort(), [
    'launchAngle',
    'launchInterceptBlend',
  ]);
  assert.ok(Number.isFinite(out.launchAngle));
  assert.ok(Number.isFinite(out.launchInterceptBlend));
});

test('solveLaunchAngle er ren — samme input gir identisk output', () => {
  const input = { dynamicLoft: 12.5, attackAngle: 2 };
  const first = solveLaunchAngle(input);
  const second = solveLaunchAngle(input);
  assert.deepEqual(first, second);
  assert.notEqual(first, second, 'nytt objekt hver gang, ingen delt tilstand');
  assert.deepEqual(input, { dynamicLoft: 12.5, attackAngle: 2 }, 'input urørt');
});

test('interceptBlend fases inn under 10° og metter på 1 over', () => {
  assert.equal(interceptBlend(0), 0, '0° loft gir ingen intercept');
  assert.equal(interceptBlend(5), 0.5);
  assert.equal(interceptBlend(10), 1, 'full intercept nøyaktig ved 10°');
  assert.equal(interceptBlend(50), 1, 'mettet, ikke ekstrapolert');

  // Den nedre klampen binder aldri i baseline — DynamicLoft er ≥ 0 i alle
  // 5029 caser. Den finnes fordi spec-en har den.
  assert.equal(interceptBlend(-15), 0, 'negativ loft klampes til 0');

  const lofts = new Set(loadFlight().map((c) => c.in.dynamicLoft));
  assert.ok(Math.min(...lofts) >= 0, 'baseline har ingen negativ DynamicLoft');
  assert.ok(Math.max(...lofts) >= 10, 'baseline eksersererer den øvre klampen');
});

test('interceptet fases ut: 0° loft gir launch fra attack alene', () => {
  // Spec §5.3s begrunnelse for blenden, som en påstand om output.
  assert.equal(launchAngleDeg(0, 0), 0);
  assert.equal(launchAngleDeg(0, -15), -3.75);
  assert.equal(launchAngleDeg(0, 15), 3.75);
});

test('launchAngle får være negativ — ingen klamp her', () => {
  const negative = loadFlight().filter((c) => c.out.launchAngle < 0);
  assert.ok(negative.length > 0, 'fixturen har negative launch-vinkler');
  for (const c of negative) {
    assert.equal(solveLaunchAngle(c.in).launchAngle, c.out.launchAngle, c.id);
  }
});

/* ── Casen den ekte motoren kastet på ───────────────────────────────────── */

test('RK4-timeout-casen feiler ikke i §5.3', () => {
  // Fixturen har ingen `out` for denne, så det finnes ingen fasit å måle mot.
  // Poenget er negativt: launch-modellen er ikke der kallet gikk i stykker.
  const [timeout] = loadFlightErrors();
  assert.equal(timeout.id, 'edge.rk4-no-ground-within-30-seconds');

  const out = solveLaunchAngle(timeout.in);
  assert.ok(Number.isFinite(out.launchAngle), 'endelig launch');
  assert.equal(out.launchInterceptBlend, 1, 'DynamicLoft 50 metter blenden');
  assert.equal(timeout.out, undefined, 'fortsatt ingen fasit å sammenligne mot');
});
