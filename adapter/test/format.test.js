/**
 * format.js — D28-desimalene og D29-fortegnsreglene, testet mot DESIGN.md
 * sine egne eksempler ordrett. Endres et eksempel i DESIGN.md, skal denne
 * fila feile — det er meningen.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MINUS,
  THIN_SPACE,
  formatAngle,
  formatDistance,
  formatLateral,
  formatSmash,
  formatSpeed,
  formatSpin,
} from '../src/format.js';

test('tegnene er de typografiske: U+2212 minus, U+2009 tusenskille', () => {
  assert.equal(MINUS.codePointAt(0), 0x2212);
  assert.equal(THIN_SPACE.codePointAt(0), 0x2009);
});

test('DESIGN.md-eksemplene, ordrett', () => {
  // «Tallformatering»-tabellen
  assert.equal(formatAngle(16.3), '16.3°');
  assert.equal(formatDistance(173.5, 'm'), '173.5 m');
  assert.equal(formatSpin(3173), `3${THIN_SPACE}173 rpm`);
  assert.equal(formatSpeed(130.6), '130.6 mph');
  assert.equal(formatSmash(1.451), '1.451');
  assert.equal(formatAngle(-6.0, { signed: true }), `${MINUS}6.0°`);
  // «Fortegn og retning»-tabellen
  assert.equal(formatLateral(-16.3, 'm'), '16.3 m L');
  assert.equal(formatLateral(4.1, 'm'), '4.1 m R');
  assert.equal(formatLateral(0, 'm'), '0.0 m C');
  assert.equal(formatAngle(-16.3, { signed: true }), `${MINUS}16.3°`);
  assert.equal(formatAngle(5.0, { signed: true }), '+5.0°');
  assert.equal(formatAngle(14.5), '14.5°');
});

test('motorens råverdi fra DESIGN.md-prosaen: spinAxis −16.26454982658155 → −16.3°', () => {
  assert.equal(formatAngle(-16.26454982658155, { signed: true }), `${MINUS}16.3°`);
});

test('fortegn avgjøres ETTER avrunding: aldri −0.0', () => {
  assert.equal(formatAngle(-0.04, { signed: true }), '0.0°');
  assert.equal(formatAngle(-0.04), '0.0°');
  assert.equal(formatAngle(0, { signed: true }), '0.0°');
  assert.equal(formatDistance(-0.04, 'm'), '0.0 m');
  assert.equal(formatSmash(-0.0001), '0.000');
  // ...men −0.05 runder til 0.1 og bærer fortegn/bokstav
  assert.equal(formatAngle(-0.06, { signed: true }), `${MINUS}0.1°`);
});

test('bokstav avgjøres ETTER avrunding: −0.03 m er C, ikke L', () => {
  assert.equal(formatLateral(-0.03, 'm'), '0.0 m C');
  assert.equal(formatLateral(-0.06, 'm'), '0.1 m L');
  assert.equal(formatLateral(0.06, 'yd'), '0.1 yd R');
});

test('D29: ingen verdi bærer både fortegn og bokstav', () => {
  for (const v of [-312.4, -16.3, -0.04, 0, 0.9, 4.1, 88.25]) {
    for (const unit of ['m', 'yd']) {
      const text = formatLateral(v, unit);
      assert.ok(!text.includes(MINUS) && !text.includes('+') && !text.includes('-'),
        `«${text}» bærer fortegn i tillegg til bokstav`);
      assert.ok(/ (L|R|C)$/.test(text), `«${text}» mangler bokstav`);
    }
    const angle = formatAngle(v, { signed: true });
    assert.ok(!/ (L|R|C)$/.test(angle), `«${angle}» bærer bokstav i tillegg til fortegn`);
  }
});

test('ASCII-bindestrek forekommer aldri i visningsverdier', () => {
  const texts = [
    formatAngle(-16.3, { signed: true }),
    formatDistance(-5.2, 'm'),
    formatSpin(-500),
    formatSmash(-1.2),
    formatSpeed(-3),
  ];
  for (const text of texts) {
    assert.ok(!text.includes('-'), `«${text}» inneholder ASCII-bindestrek`);
    assert.ok(text.includes(MINUS), `«${text}» mangler U+2212`);
  }
});

test('spinn: heltall, U+2009-gruppering i alle størrelsesordener', () => {
  assert.equal(formatSpin(0), '0 rpm');
  assert.equal(formatSpin(842), '842 rpm');
  assert.equal(formatSpin(3994.46694041815), `3${THIN_SPACE}994 rpm`);
  assert.equal(formatSpin(11764), `11${THIN_SPACE}764 rpm`);
  assert.equal(formatSpin(1234567), `1${THIN_SPACE}234${THIN_SPACE}567 rpm`);
  // aldri komma eller punktum som tusenskille
  assert.ok(!formatSpin(12345).includes(','));
  assert.ok(!formatSpin(12345).includes('.'));
});

test('desimaler per metrikk: vinkel 1 · avstand 1 · smash 3 · fart 1', () => {
  assert.equal(formatAngle(12.25304, { signed: true }), '+12.3°');
  assert.equal(formatDistance(164.94123, 'm'), '164.9 m');
  assert.equal(formatSmash(1.4507777), '1.451');
  assert.equal(formatSpeed(123.19312284372836), '123.2 mph');
});

test('ikke-endelige tall kaster TypeError i alle formatterne', () => {
  const fns = [
    (v) => formatAngle(v),
    (v) => formatDistance(v, 'm'),
    (v) => formatLateral(v, 'm'),
    (v) => formatSpin(v),
    (v) => formatSmash(v),
    (v) => formatSpeed(v),
  ];
  for (const fn of fns) {
    for (const bad of [NaN, Infinity, -Infinity, '5', null, undefined]) {
      assert.throws(() => fn(bad), TypeError);
    }
  }
});
