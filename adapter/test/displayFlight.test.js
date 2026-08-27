/**
 * displayFlight.js — integrasjon mot den EKTE motoren. Beviser oppdragets
 * tre krav ende-til-ende:
 *   1. konvertering skjer i adapteren (og bare der)
 *   2. motorens tall er urørt uansett enhetsvalg
 *   3. avrunding (D28) skjer ETTER konvertering, ikke før
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { solveFlight } from '../../engine/src/solveFlight.js';
import { FLIGHT_METRICS } from '../../engine/src/metricRegistry.js';
import { yardToMetre } from '../../engine/src/constants.js';
import {
  FLIGHT_DISPLAY,
  INPUT_DISPLAY,
  displayFlight,
  displayValue,
} from '../src/displayFlight.js';

/** Nøytralt jern-aktig slag — samme størrelsesorden som spec §9 sine goldens. */
const SHOT = Object.freeze({
  clubSpeed: 85,
  faceAngle: 0,
  clubPath: 0,
  attackAngle: -4.3,
  dynamicLoft: 20.9,
});

/** Slag med retning i begge plan — tester fortegn og bokstaver. */
const SHAPED_SHOT = Object.freeze({
  clubSpeed: 100,
  faceAngle: -3,
  clubPath: 2,
  attackAngle: -2,
  dynamicLoft: 14,
});

const DISTANCE_KINDS = new Set(['distance', 'lateralDistance']);

test('dekker de 13 spec §6-utfallene pluss faceToPath, ikke mer', () => {
  const out = solveFlight(SHOT);
  const view = displayFlight(out, 'yards');
  const keys = Object.keys(view);
  assert.equal(keys.length, 14);
  const spec6Fields = [
    'startDirection', 'spinAxis', 'curve', 'offline', 'launchAngle', 'spinLoft',
    'backspin', 'landingAngle', 'smash', 'ballSpeed', 'carry', 'total', 'apex',
  ];
  const mappedFields = Object.values(FLIGHT_DISPLAY).map((s) => s.field);
  for (const f of spec6Fields) {
    assert.ok(mappedFields.includes(f), `spec §6-feltet ${f} mangler i adapteren`);
  }
  for (const key of keys) {
    const cell = view[key];
    assert.equal(typeof cell.text, 'string');
    assert.ok(Number.isFinite(cell.value));
    assert.equal(typeof cell.unit, 'string');
  }
});

test('motorens returobjekt er BIT-URØRT etter visning i begge pakker', () => {
  const out = solveFlight(SHAPED_SHOT);
  const before = JSON.stringify(out);
  const rawCarry = out.carry;
  displayFlight(out, 'yards');
  displayFlight(out, 'meters');
  assert.equal(JSON.stringify(out), before, 'adapteren muterte motorens objekt');
  assert.ok(Object.is(out.carry, rawCarry));
});

test('yards-pakken viser motorens tall uendret; meters er nøyaktig × yardToMetre', () => {
  const out = solveFlight(SHOT);
  const yd = displayFlight(out, 'yards');
  const m = displayFlight(out, 'meters');
  for (const [key, spec] of Object.entries(FLIGHT_DISPLAY)) {
    const raw = out[spec.field];
    if (DISTANCE_KINDS.has(spec.kind)) {
      assert.ok(Object.is(yd[key].value, raw), `${key}: yards-verdien er ikke motorens`);
      assert.ok(Object.is(m[key].value, raw * yardToMetre), `${key}: meters-verdien avviker`);
      assert.equal(yd[key].unit, 'yd');
      assert.equal(m[key].unit, 'm');
    } else {
      // D57: alt annet er enhetsuavhengig — identisk i begge pakker.
      assert.ok(Object.is(yd[key].value, raw), `${key} skal være urørt`);
      assert.equal(yd[key].text, m[key].text, `${key} skal være upåvirket av enhetsvalget`);
      assert.equal(yd[key].unit, m[key].unit);
    }
  }
});

test('avrunding skjer ETTER konvertering: 100.04 yd → 91.5 m, ikke 91.4 m', () => {
  // Avrund-først: 100.0 yd → 91.44 m → «91.4 m». Riktig rekkefølge:
  // 100.04 yd → 91.4766 m → «91.5 m». Én tekst per rekkefølge.
  assert.equal(displayValue('distance', 100.04, 'meters').text, '91.5 m');
  assert.equal(displayValue('distance', 100.04, 'yards').text, '100.0 yd');
});

test('formatvalg per kind stemmer med registerets interne enheter', () => {
  // metricRegistry er motorens egen deklarasjon av intern enhet per metrikk.
  // Adapterens kind-valg må være konsistent med den — ellers konverterer vi
  // feil størrelse.
  const expectedUnitByKind = {
    signedAngle: 'deg',
    plainAngle: 'deg',
    lateralDistance: 'yard',
    distance: 'yard',
    spin: 'rpm',
    smash: 'ratio',
    speed: 'mph',
  };
  const registryKey = (key) => (key === 'launchDirection' ? 'startDirection' : key);
  for (const [key, spec] of Object.entries(FLIGHT_DISPLAY)) {
    const reg = FLIGHT_METRICS[registryKey(key)];
    if (!reg) continue; // faceToPath står ikke i Ask-registeret
    assert.equal(reg.unit, expectedUnitByKind[spec.kind],
      `${key}: kind ${spec.kind} matcher ikke registerenheten ${reg.unit}`);
  }
  for (const [key, spec] of Object.entries(INPUT_DISPLAY)) {
    assert.equal(FLIGHT_METRICS[key].unit, expectedUnitByKind[spec.kind], key);
  }
});

test('D29 ende-til-ende: vinkler bærer fortegn, sideavstander bokstav — aldri begge', () => {
  const out = solveFlight(SHAPED_SHOT);
  for (const system of ['meters', 'yards']) {
    const view = displayFlight(out, system);
    for (const [key, spec] of Object.entries(FLIGHT_DISPLAY)) {
      const { text } = view[key];
      if (spec.kind === 'lateralDistance') {
        assert.ok(/ (L|R|C)$/.test(text), `${key}: «${text}» mangler L/R/C`);
        assert.ok(!text.includes('−') && !text.includes('+'),
          `${key}: «${text}» bærer fortegn i tillegg til bokstav`);
      } else {
        assert.ok(!/ (L|R|C)$/.test(text), `${key}: «${text}» bærer bokstav`);
      }
    }
  }
});

test('determinisme: samme out og samme pakke gir identiske tekster', () => {
  const out = solveFlight(SHOT);
  const a = displayFlight(out, 'meters');
  const b = displayFlight(out, 'meters');
  for (const key of Object.keys(a)) assert.equal(a[key].text, b[key].text);
});

test('visningsobjektet er frosset — adapteren har ingen skjult tilstand', () => {
  const view = displayFlight(solveFlight(SHOT), 'yards');
  assert.ok(Object.isFrozen(view));
  for (const cell of Object.values(view)) assert.ok(Object.isFrozen(cell));
});

test('ugyldig input kaster: ukjent pakke, ukjent kind, manglende felt', () => {
  const out = solveFlight(SHOT);
  assert.throws(() => displayFlight(out, 'metric'), TypeError);
  assert.throws(() => displayFlight(null, 'yards'), TypeError);
  assert.throws(() => displayValue('carry', 100, 'yards'), TypeError); // kind, ikke metrikknavn
  assert.throws(() => displayValue('distance', NaN, 'yards'), TypeError);
  const { carry, ...rest } = out;
  assert.throws(() => displayFlight(rest, 'yards'), TypeError,
    'manglende motorfelt skal kaste, ikke vises som tomt');
});
