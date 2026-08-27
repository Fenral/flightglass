/**
 * Differensialtest: rk4Integrator.js ≡ aero-reference.js
 *
 * BASELINE-FUNN [19] påpekte at to kopier av §5.7 eksisterte uten at noen test
 * tvang dem til å være enige. Filhodet i rk4Integrator.js påsto bit-likhet over
 * 208 stikkprøver, men påstanden var ikke håndhevet. Nå er den det.
 *
 * Divergerer de, er det en bug i én av dem — ikke en toleransesak.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import * as prod from '../src/rk4Integrator.js';
import * as ref from '../src/aero-reference.js';

/* Reynolds- og spinparameterområdene fixturen faktisk besøker (FUNN F2):
   Re 69 649 … 178 732, S 0 … 0.386. Rutenettet dekker dem med margin. */
const REYNOLDS = [];
for (let re = 40_000; re <= 220_000; re += 2_500) REYNOLDS.push(re);
const SPIN_PARAMS = [];
for (let s = 0; s <= 0.45; s += 0.005) SPIN_PARAMS.push(Number(s.toFixed(3)));

test('liftCoefficient er bit-identisk i begge implementasjoner', () => {
  for (const s of SPIN_PARAMS) {
    assert.ok(
      Object.is(prod.liftCoefficient(s), ref.liftCoefficient(s)),
      `Cl divergerer ved S=${s}: prod=${prod.liftCoefficient(s)} ref=${ref.liftCoefficient(s)}`,
    );
  }
});

test('dragBridge er bit-identisk over hele Reynolds × S-rutenettet', () => {
  let checked = 0;
  for (const re of REYNOLDS) {
    for (const s of SPIN_PARAMS) {
      const a = prod.dragBridge(re, s);
      const b = ref.dragBridge(re, s);
      assert.ok(Object.is(a, b), `CdBridge divergerer ved Re=${re} S=${s}: ${a} vs ${b}`);
      checked += 1;
    }
  }
  assert.ok(checked > 6000, `for få kombinasjoner testet: ${checked}`);
});

test('dragCoefficient er bit-identisk over hele rutenettet', () => {
  for (const re of REYNOLDS) {
    for (const s of SPIN_PARAMS) {
      const a = prod.dragCoefficient(re, s);
      const b = ref.dragCoefficient(re, s);
      assert.ok(Object.is(a, b), `Cd divergerer ved Re=${re} S=${s}: ${a} vs ${b}`);
    }
  }
});

test('isExtrapolated er enig for alle intervallkombinasjoner den deler', () => {
  const RANGES = [
    [69_649, 178_732], [80_000, 200_000], [50_000, 60_000],
    [220_000, 240_000], [70_000, 210_000], [100_000, 100_000],
  ];
  const SP = [[0, 0], [0.08, 0.2], [0.19, 0.39], [0.05, 0.07], [0.1, 0.15], [0.3, 0.5]];
  for (const re of RANGES) {
    for (const sp of SP) {
      const a = prod.isExtrapolated(re, sp);
      const b = ref.isExtrapolated(re, sp, [70_000, 210_000], [0.08, 0.2]);
      assert.equal(a, b, `extrapolated divergerer for Re=${re} S=${sp}: ${a} vs ${b}`);
    }
  }
});

test('de to modulene er separate filer — ingen re-eksport som skjuler divergens', () => {
  assert.notEqual(prod.liftCoefficient, ref.liftCoefficient,
    'samme funksjonsreferanse: differensialtesten ville vært verdiløs');
  assert.notEqual(prod.dragCoefficient, ref.dragCoefficient,
    'samme funksjonsreferanse: differensialtesten ville vært verdiløs');
});
