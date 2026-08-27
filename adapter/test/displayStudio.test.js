/**
 * displayStudio.js — D65/D66/D67 pluss eierens akseord (before/after ·
 * above/below · high/low, 2026-08-25). Testene er ordkontrakten: bytter noen
 * et ord eller en desimal, feiler dette.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatLongitudinalCm,
  formatLongitudinalMetres,
  formatHeightCm,
  formatFaceOffsetMm,
  formatLieMm,
} from '../src/displayStudio.js';

test('langsgående akse: before/after, 1 desimal, ord aldri fortegn', () => {
  assert.equal(formatLongitudinalCm(10.5), '10.5 cm after');
  assert.equal(formatLongitudinalCm(-1.5), '1.5 cm before');
  assert.equal(formatLongitudinalCm(3.04), '3.0 cm after');
  assert.equal(formatLongitudinalCm(-20), '20.0 cm before');
});

test('langsgående akse: null etter avrunding vises uten ord', () => {
  assert.equal(formatLongitudinalCm(0), '0.0 cm');
  assert.equal(formatLongitudinalCm(-0.04), '0.0 cm');
  assert.equal(formatLongitudinalCm(0.04), '0.0 cm');
});

test('meter-varianten konverterer i adapteren, aldri i UI', () => {
  assert.equal(formatLongitudinalMetres(0.105), '10.5 cm after');
  assert.equal(formatLongitudinalMetres(-0.015), '1.5 cm before');
  assert.equal(formatLongitudinalMetres(0), '0.0 cm');
});

test('vertikal akse mot bakkeplanet: above/below', () => {
  assert.equal(formatHeightCm(2), '2.0 cm above');
  assert.equal(formatHeightCm(-5), '5.0 cm below');
  assert.equal(formatHeightCm(-0.04), '0.0 cm');
});

test('treffpunkt på flaten: high/low, matcher båndnavnene', () => {
  assert.equal(formatFaceOffsetMm(16.63), '16.6 mm high');
  assert.equal(formatFaceOffsetMm(-16.63), '16.6 mm low');
  assert.equal(formatFaceOffsetMm(-1.05), '1.1 mm low');
  assert.equal(formatFaceOffsetMm(0.04), '0.0 mm');
});

test('lie-preseter er definisjoner: heltall, ingen desimal', () => {
  assert.equal(formatLieMm(0), '0 mm');
  assert.equal(formatLieMm(8), '8 mm');
  assert.equal(formatLieMm(42), '42 mm');
});

test('kontrakt: ikke-endelige tall kastes', () => {
  for (const fn of [formatLongitudinalCm, formatLongitudinalMetres, formatHeightCm, formatFaceOffsetMm, formatLieMm]) {
    assert.throws(() => fn(NaN), TypeError);
    assert.throws(() => fn(Infinity), TypeError);
    assert.throws(() => fn('3'), TypeError);
  }
});

test('ingen ASCII-bindestrek eller nakent minus i noen visningsverdi', () => {
  const samples = [
    formatLongitudinalCm(-12.3),
    formatHeightCm(-4.2),
    formatFaceOffsetMm(-9.9),
  ];
  for (const s of samples) {
    assert.ok(!s.includes('-'), `fant bindestrek i "${s}"`);
    assert.ok(!s.includes('−'), `fant minus i "${s}"`);
  }
});
