/**
 * convert.js — D57-enhetspakkene og kravet fra oppdrag D:
 *   1. konvertering skjer nøyaktig ett sted (håndheves også av linten)
 *   2. motorens tall er urørt uansett enhetsvalg
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UNIT_SYSTEMS,
  assertUnitSystem,
  distanceForDisplay,
  speedForDisplay,
} from '../src/convert.js';
import { yardToMetre } from '../../engine/src/constants.js';

test('D57: nøyaktig to enhetspakker, meters og yards', () => {
  assert.deepEqual([...UNIT_SYSTEMS], ['meters', 'yards']);
  assert.ok(Object.isFrozen(UNIT_SYSTEMS));
  assertUnitSystem('meters');
  assertUnitSystem('yards');
});

test('ukjent enhetssystem kaster — ingen stille fallback', () => {
  for (const bad of ['metric', 'imperial', 'm', 'yd', '', null, undefined, 0]) {
    assert.throws(() => assertUnitSystem(bad), TypeError, String(bad));
    assert.throws(() => distanceForDisplay(100, bad), TypeError);
  }
});

test('yards-pakken: motorens tall passerer BIT-URØRT (Object.is)', () => {
  for (const yards of [0, 170.05993933223164, -16.26454982658155, 1e-9, 312.5]) {
    const { value, unit } = distanceForDisplay(yards, 'yards');
    assert.ok(Object.is(value, yards), `${yards} skal være identisk, fikk ${value}`);
    assert.equal(unit, 'yd');
  }
});

test('meters-pakken: nøyaktig yards × yardToMetre, konstanten fra motoren', () => {
  for (const yards of [0, 170.05993933223164, -17.3, 100.04, 250]) {
    const { value, unit } = distanceForDisplay(yards, 'meters');
    assert.ok(Object.is(value, yards * yardToMetre), `${yards} yd`);
    assert.equal(unit, 'm');
  }
  // Faktoren er motorens egen (spec §6); literalen bor KUN i engine/, derfor
  // sammenlignes den her via heltallsformen.
  assert.equal(yardToMetre * 10000, 9144);
});

test('konvertert verdi er URUNDET — avrunding er formatlagets jobb', () => {
  const { value } = distanceForDisplay(170.05993933223164, 'meters');
  // Full presisjon bevart; en avrundet verdi ville mistet desimalene under 0.1.
  assert.ok(Object.is(value, 170.05993933223164 * yardToMetre));
  assert.notEqual(value, Math.round(value * 10) / 10);
});

test('D57: fart er alltid mph — identitet i begge pakker', () => {
  for (const mph of [0, 85, 130.6, 123.19312284372836]) {
    const { value, unit } = speedForDisplay(mph);
    assert.ok(Object.is(value, mph));
    assert.equal(unit, 'mph');
  }
});

test('ikke-endelige tall kaster TypeError — ingen koersjon, som i motoren', () => {
  for (const bad of [NaN, Infinity, -Infinity, '85', null, undefined]) {
    assert.throws(() => distanceForDisplay(bad, 'meters'), TypeError);
    assert.throws(() => speedForDisplay(bad), TypeError);
  }
});
