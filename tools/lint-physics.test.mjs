/**
 * Selvtest for fysikklinten. Mønstrene i fixturene under er BYGD OPP med
 * konkatenering slik at denne fila selv er ren — linten skanner den.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { RULES, scanRepo, scanText } from './lint-physics.mjs';

const M = 'Math.'; // settes sammen i fixturene så fila ikke trigger seg selv

test('kat 2: fanger trigonometri i app/, men tillater den i adapter/', () => {
  for (const fn of ['sin', 'cos', 'atan2', 'asin', 'acos', 'tan']) {
    const line = `const y = ${M}${fn}(x);`;
    assert.equal(scanText(line, 'app/ball-flight/bf.js').length, 1,
      `${M}${fn} slapp gjennom i app/`);
    assert.equal(scanText(line, 'ui/scene.js').length, 1);
    assert.equal(scanText(line, 'adapter/src/traceShape.js').length, 0,
      `${M}${fn} skal være lovlig i adapter/src/ (projeksjon er adapterens jobb)`);
    assert.equal(scanText(line, 'adapter/test/traceShape.test.js').length, 0);
  }
});

test('kat 3: Math.hypot er skjermgeometri og alltid tillatt — også i app/', () => {
  // Eierpresisering 2026-08-25: px-avstand mellom to allerede konverterte
  // punkter er ikke fysikk. Konkret eksempel: landingsmerke-gapet i bf.js.
  const line = `const gap = ${M}hypot(liveEnd[0] - pinEnd[0], liveEnd[1] - pinEnd[1]);`;
  assert.equal(scanText(line, 'app/ball-flight/bf.js').length, 0);
  assert.equal(scanText(line, 'ui/scene.js').length, 0);
  assert.equal(scanText(line, 'adapter/src/traceShape.js').length, 0);
});

test('kat 1: konstantene er forbudt OGSÅ i adapter/ — rekalkulering har intet fristed', () => {
  const line = `const m = yd * 0.914${''}4;`;
  assert.equal(scanText(line, 'adapter/src/traceShape.js').length, 1);
  assert.equal(scanText(line, 'adapter/src/convert.js').length, 1,
    'selv konverteringsstedet skal importere konstanten, aldri skrive literalen');
});

test('fanger fysikk-konstantene', () => {
  const fixtures = [
    `const mps = mph * 0.4470${''}4;`,
    `const m = yd * 0.914${''}4;`,
    `const k = 1.27511645603${''}5;`,
    `const r = 0.02133${''}5;`,
    `const r = 0.02133${''}6;`,
    `const r = 0.021${''}3;`,
  ];
  for (const line of fixtures) {
    assert.equal(scanText(line, 'ui/scene.js').length, 1, `slapp gjennom: ${line}`);
  }
});

test('ballradius-regelen tar ikke vilkårlige desimaltall', () => {
  assert.equal(scanText('const pad = 0.02;', 'ui/scene.js').length, 0);
  assert.equal(scanText('const x = 0.0214;', 'ui/scene.js').length, 0);
  assert.equal(scanText('const x = 0.02131;', 'ui/scene.js').length, 0);
});

test('konverteringsidentifikatoren er lovlig KUN i adapter/src/convert.js', () => {
  const line = `import { yardTo${''}Metre } from '../../engine/src/constants.js';`;
  assert.equal(scanText(line, 'adapter/src/convert.js').length, 0);
  assert.equal(scanText(line, 'ui/readout.js').length, 1);
  assert.equal(scanText(line, 'adapter/src/format.js').length, 1);
});

test('ren UI-kode passerer', () => {
  const clean = [
    "const el = document.querySelector('.readout');",
    'const width = Math.max(0, Math.min(100, pct));',
    'const t = Math.abs(delta) / duration;',
    'const r = Math.round(rpm);',
    'el.textContent = view.carry.text;',
  ].join('\n');
  assert.equal(scanText(clean, 'ui/scene.js').length, 0);
});

test('treff rapporterer linjenummer og regelnavn', () => {
  const text = `const a = 1;\nconst b = ${M}sin(x);\n`;
  const [hit] = scanText(text, 'ui/scene.js');
  assert.equal(hit.line, 2);
  assert.match(hit.rule, /trigonometri/);
});

test('reglene er frosne og har navn + regex', () => {
  assert.ok(Object.isFrozen(RULES));
  for (const rule of RULES) {
    assert.equal(typeof rule.name, 'string');
    assert.ok(rule.re instanceof RegExp);
  }
});

test('INTEGRASJON: dagens repo er rent — 0 funn', () => {
  const { scanned, violations } = scanRepo();
  assert.ok(scanned > 0, 'linten fant ingen filer å skanne — virkeområdet er feil');
  assert.deepEqual(violations, [], JSON.stringify(violations, null, 2));
});
