/**
 * traceShape.js — D61. Testene ER formens kontrakt: endepunkter, apex og
 * tangenter treffer motorens tall eksakt. Flytter noen en koeffisient,
 * feiler dette — og da tegner Ball Flight og D-plane ikke lenger samme slag.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { solveFlight } from '../../engine/src/solveFlight.js';
import {
  topPoints, heightPoints, directionRay, traceSamples,
} from '../src/traceShape.js';

const SHOT = Object.freeze({
  clubSpeed: 100, faceAngle: -3, clubPath: 2, attackAngle: -2, dynamicLoft: 14,
});
const NEUTRAL = Object.freeze({
  clubSpeed: 85, faceAngle: 0, clubPath: 0, attackAngle: -4.3, dynamicLoft: 20.9,
});

/** Relativ nærhet — for uttrykk som er matematisk, ikke bit-, eksakte. */
function close(a, b, tol, msg) {
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  assert.ok(Math.abs(a - b) / scale <= tol, `${msg}: ${a} vs ${b}`);
}

test('n segmenter gir n + 1 punkter; standard er 64', () => {
  const out = solveFlight(SHOT);
  assert.equal(topPoints(out).length, 65);
  assert.equal(heightPoints(out).length, 65);
  assert.equal(topPoints(out, 8).length, 9);
  assert.equal(heightPoints(out, 1).length, 2);
});

test('topPoints: starter i origo, ender i motorens offline', () => {
  const out = solveFlight(SHOT);
  const pts = topPoints(out);
  // Origo kan være [-0, 0] (u·sin(a) med negativ vinkel) — det er A sin
  // originale oppførsel og likegyldig for SVG. === skiller ikke -0 fra 0.
  assert.ok(pts[0][0] === 0 && pts[0][1] === 0);
  const [lateralEnd, downrangeEnd] = pts[pts.length - 1];
  close(lateralEnd, out.offline, 1e-12, 'lateral slutt = offline');
  const a = out.startDirection * Math.PI / 180;
  close(downrangeEnd, out.carry * Math.cos(a), 1e-12, 'downrange slutt');
});

test('topPoints: første segment følger startDirection (avviket er kvadratisk)', () => {
  const out = solveFlight(SHOT);
  const pts = topPoints(out, 1000);
  const chord = Math.atan2(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) * 180 / Math.PI;
  close(chord, out.startDirection, 1e-2, 'startretning');
});

test('heightPoints: starter og lander på bakken, apex treffes i t = 0.5', () => {
  const out = solveFlight(SHOT);
  const pts = heightPoints(out);
  assert.deepEqual(pts[0], [0, 0]);
  const [xEnd, yEnd] = pts[pts.length - 1];
  assert.ok(Object.is(xEnd, out.carry), 'downrange slutt er carry, bit-eksakt');
  assert.equal(yEnd, 0);
  const mid = pts[32]; // t = 0.5 med n = 64
  close(mid[1], out.apex, 1e-9, 'apex i t=0.5');
});

test('heightPoints: tangentene treffer launch og landing angle', () => {
  const out = solveFlight(SHOT);
  const pts = heightPoints(out, 4000);
  const slopeStart = (pts[1][1] - pts[0][1]) / (pts[1][0] - pts[0][0]);
  const slopeEnd = (pts[4000][1] - pts[3999][1]) / (pts[4000][0] - pts[3999][0]);
  close(slopeStart, Math.tan(out.launchAngle * Math.PI / 180), 1e-2, 'launch-tangent');
  close(slopeEnd, -Math.tan(out.landingAngle * Math.PI / 180), 1e-2, 'landing-tangent');
});

test('degenerert slag (hasFlight = false): flat form, aldri NaN, aldri under bakken', () => {
  // signedVerticalSpinLoft <= 0 → carry 0 i baseline.
  const out = solveFlight({ clubSpeed: 90, faceAngle: 0, clubPath: 0, attackAngle: 0, dynamicLoft: 0 });
  for (const pts of [topPoints(out), heightPoints(out)]) {
    for (const [x, y] of pts) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
    }
  }
  for (const [, y] of heightPoints(out)) assert.ok(y >= 0, 'aldri under bakken');
});

test('yards inn, yards ut — ingen konvertering i formen', () => {
  // Samme out skal gi samme punkter uansett hva brukeren har valgt av
  // enheter: funksjonene vet ikke engang hva en enhetspakke er.
  const out = solveFlight(NEUTRAL);
  assert.deepEqual(topPoints(out), topPoints(out));
  assert.equal(topPoints.length, 1, 'ingen enhetsparameter'); // (out, n=64)
  assert.equal(heightPoints.length, 1, 'ingen enhetsparameter');
});

test('ren funksjon: out er bit-urørt, samme input gir identiske punkter', () => {
  const out = solveFlight(NEUTRAL);
  const before = JSON.stringify(out);
  const a = heightPoints(out);
  const b = heightPoints(out);
  topPoints(out);
  assert.equal(JSON.stringify(out), before);
  assert.deepEqual(a, b);
});

test('ikke-endelige felt og ugyldig n kaster TypeError', () => {
  const out = solveFlight(NEUTRAL);
  assert.throws(() => topPoints({ ...out, carry: NaN }), TypeError);
  assert.throws(() => topPoints({ ...out, offline: undefined }), TypeError);
  assert.throws(() => heightPoints({ ...out, apex: Infinity }), TypeError);
  assert.throws(() => heightPoints({ ...out, launchAngle: '12' }), TypeError);
  assert.throws(() => topPoints(out, 0), TypeError);
  assert.throws(() => heightPoints(out, 2.5), TypeError);
});

test('directionRay: enhetsvektor [sin, cos], riktige fortegn, frossen', () => {
  // Kardinalene eksakt der IEEE tillater det
  assert.deepEqual([...directionRay(0)], [0, 1]);
  assert.equal(directionRay(90)[1] < 1e-15, true, 'cos(90°) ~ 0');
  assert.equal(directionRay(90)[0], 1);
  assert.equal(directionRay(-90)[0], -1);
  // Enhetslengde og fortegn over spennet av motorvinkler
  for (const deg of [-45, -15, -5.18, -0.3, 0.7, 12.25, 51, 89]) {
    const [s, c] = directionRay(deg);
    close(Math.hypot(s, c), 1, 1e-15, `enhetslengde ${deg}°`);
    assert.equal(s > 0, deg > 0, `sin-fortegn ${deg}°`);
    assert.ok(c > 0, `cos positiv i (−90, 90): ${deg}°`);
  }
  // Frossen — rendereren kan ikke mutere en delt vektor
  assert.ok(Object.isFrozen(directionRay(5)));
  // Samme radianuttrykk som resten av traceShape: deg * Math.PI / 180
  assert.ok(Object.is(directionRay(33)[0], Math.sin(33 * Math.PI / 180)));
});

test('directionRay: ikke-endelig vinkel kaster TypeError', () => {
  for (const bad of [NaN, Infinity, -Infinity, '12', null, undefined]) {
    assert.throws(() => directionRay(bad), TypeError);
  }
});

/* ── traceSamples — D79 ─────────────────────────────────────────────────── */

test('D79 inv. 2+4: endepunktene er BIT-LIKE motorens felt — SAMTLIGE fixture-caser', () => {
  const doc = JSON.parse(readFileSync(
    new URL('../../motor/export/flight-golden.json', import.meta.url), 'utf8',
  ));
  let checked = 0;
  for (const c of doc.cases) {
    if (!c.out) continue; // RK4-timeout-casen har error, ikke out
    const pts = traceSamples(c.out, 8);
    const first = pts[0], last = pts[8];
    assert.ok(Object.is(first.lat, 0) && Object.is(first.d, 0) && Object.is(first.h, 0), c.id);
    assert.ok(Object.is(last.lat, c.out.offline), `${c.id}: lat[n] != offline`);
    assert.ok(Object.is(last.d, c.out.carry), `${c.id}: d[n] != carry`);
    assert.ok(Object.is(last.h, 0), `${c.id}: h[n] != 0`);
    checked += 1;
  }
  assert.ok(checked >= 5028, `kun ${checked} caser sjekket`);
});

test('traceSamples: n + 1 frosne punkter i yards, hele lista frossen', () => {
  const out = solveFlight(SHOT);
  const pts = traceSamples(out);
  assert.equal(pts.length, 65);
  assert.ok(Object.isFrozen(pts));
  for (const p of pts) {
    assert.ok(Object.isFrozen(p));
    assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.d) && Number.isFinite(p.h));
  }
  assert.equal(traceSamples(out, 1).length, 2); // kun de tilordnede endepunktene
});

test('traceSamples: apex-, launch- og landing-ankrene arves fra høydeprofilen', () => {
  const out = solveFlight(SHOT);
  const pts = traceSamples(out);
  close(pts[32].h, out.apex, 1e-9, 'apex i t=0.5');
  const fine = traceSamples(out, 4000);
  const slopeStart = (fine[1].h - fine[0].h) / (fine[1].d - fine[0].d);
  const slopeEnd = (fine[4000].h - fine[3999].h) / (fine[4000].d - fine[3999].d);
  close(slopeStart, Math.tan(out.launchAngle * Math.PI / 180), 1e-2, 'launch-tangent');
  close(slopeEnd, -Math.tan(out.landingAngle * Math.PI / 180), 1e-2, 'landing-tangent');
});

test('traceSamples: indre punkter er BIT-IDENTISKE med heightPoints (delte uttrykk)', () => {
  for (const shot of [SHOT, NEUTRAL,
    { clubSpeed: 90, faceAngle: 0, clubPath: 0, attackAngle: 0, dynamicLoft: 0 }]) {
    const out = solveFlight(shot);
    const s = traceSamples(out, 64);
    const hp = heightPoints(out, 64);
    for (let i = 1; i < 64; i += 1) {
      assert.ok(Object.is(s[i].d, hp[i][0]), `d avviker fra høydeprofilen i i=${i}`);
      assert.ok(Object.is(s[i].h, hp[i][1]), `h avviker fra høydeprofilen i i=${i}`);
    }
  }
});

test('traceSamples: degenerert gren gir samme lateral som topPoints (samme kurve)', () => {
  // hasFlight=false → C=0 → begge parameteriserer med t; verdiene skal være bit-like.
  const out = solveFlight({ clubSpeed: 90, faceAngle: 3, clubPath: -1, attackAngle: 0, dynamicLoft: 0 });
  const s = traceSamples(out, 64);
  const tp = topPoints(out, 64);
  for (let i = 1; i < 64; i += 1) {
    assert.ok(Object.is(s[i].lat, tp[i][0]), `lat avviker i i=${i}`);
  }
});

test('traceSamples: ingen snap ved side ≈ 0 — pushens bue overlever', () => {
  // Nettopp feilen som felte brøkkontrakten: startDirection ≠ 0 med
  // offline ≈ 0 har en reell sidebue som en offline-normalisering ville
  // kollapset til en strek. Yards-formen bevarer den. Finn et slag der
  // face og path motvirker hverandre så siden ender nær null:
  let best = null;
  for (let face = -6; face <= 6; face += 0.05) {
    const out = solveFlight({
      clubSpeed: 90, faceAngle: face, clubPath: 6, attackAngle: -3, dynamicLoft: 20,
    });
    if (!(out.carry > 0)) continue;
    if (best === null || Math.abs(out.offline) < Math.abs(best.offline)) best = out;
  }
  assert.ok(best !== null && Math.abs(best.offline) < 1, 'fant ikke et side≈0-slag');
  assert.ok(Math.abs(best.startDirection) > 1, 'slaget må starte skjevt for å ha bue');
  const bow = Math.max(...traceSamples(best, 64).map((p) => Math.abs(p.lat)));
  assert.ok(bow > Math.abs(best.offline) + 0.5,
    `buen (${bow.toFixed(2)} yd) skal overleve når offline er ${best.offline.toFixed(3)} yd`);
});

test('traceSamples: ren funksjon, out urørt, deterministisk, kaster på ugyldig', () => {
  const out = solveFlight(NEUTRAL);
  const before = JSON.stringify(out);
  const a = traceSamples(out);
  const b = traceSamples(out);
  assert.equal(JSON.stringify(out), before);
  assert.deepEqual(a, b);
  assert.throws(() => traceSamples({ ...out, offline: NaN }), TypeError);
  assert.throws(() => traceSamples({ ...out, apex: undefined }), TypeError);
  assert.throws(() => traceSamples(out, 0), TypeError);
  assert.throws(() => traceSamples(out, 1.5), TypeError);
});

test('hele formen er endelig over et grovt inputgitter', () => {
  for (const clubSpeed of [45, 85, 120]) {
    for (const faceAngle of [-10, 0, 10]) {
      for (const dynamicLoft of [8, 20, 40]) {
        const out = solveFlight({ clubSpeed, faceAngle, clubPath: 0, attackAngle: -3, dynamicLoft });
        for (const pts of [topPoints(out, 16), heightPoints(out, 16)]) {
          for (const [x, y] of pts) {
            assert.ok(Number.isFinite(x) && Number.isFinite(y),
              `${clubSpeed}/${faceAngle}/${dynamicLoft}`);
          }
        }
      }
    }
  }
});
