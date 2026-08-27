/**
 * outcomeAdapter — verifikasjon mot golden-fixturen.
 *
 * Kjører `src/outcomeAdapter.js` over ALLE 5028 flight-caser som har `out`.
 *
 * ── TOLERANSE: HVA SOM FAKTISK TRENGS ────────────────────────────────────
 *
 * Oppgaven ba om 1e-9 relativt, med 1e-6 absolutt som fallback for grader og
 * rpm. Ingen av dem trengs, og ingen av dem er meningsfulle her: alle fire
 * feltene modulen produserer er IKKE-NUMERISKE.
 *
 *   hasFlight  boolean
 *   inDomain   boolean
 *   reason     null | "spin-loft"
 *   shape      string, én av 15
 *
 * Sammenligningen er derfor eksakt identitet. `_fixture.js` sin `report`
 * behandler ikke-tall som avvik `0` ved likhet og `Infinity` ellers, så
 * `tol: 0` er både det strengeste og det eneste fornuftige valget.
 * Maks absolutt avvik over hele fixturen er `0`. Testen under låser det.
 *
 * ── HVA FIXTUREN FAKTISK INNEHOLDER ──────────────────────────────────────
 *
 * Bare `shape` ligger i `out`. `hasFlight`, `inDomain` og `reason` står i
 * `_meta.requestedFieldsAbsentFromSolveFlight` — de returneres ikke av
 * `solveFlight` og finnes ingen steder i fixturens `out`-objekter
 * (ENGINE-GAPS §2–4, FUNN F4).
 *
 * De tre er derfor ikke verifiserbare ved direkte felt-sammenligning. De
 * verifiseres i stedet mot fixturens EGNE avledede felt og mot fixturens egen
 * dokumentasjon av regelen:
 *
 *   hasFlight  ⟺ `landingAngle !== 0` ⟺ `rollFrac !== 0` ⟺ `roll !== 0`
 *              ⟺ `landingDomainTerm === 0`
 *              — fire uavhengige felt, 0 avvik hver over 5028 caser
 *              (spec §5.6: `LandingAngle = hasFlight ? clamp(…, 32, 60) : 0`,
 *               `rollFraction = Carry > 0 ? … : 0`).
 *
 *   inDomain   ⟺ `_meta.edgeCaseSelection.adapterInDomainRule`, som ordrett
 *              er "signedVerticalSpinLoftDeg > 0; this rule is not returned by
 *              solveFlight", pluss de tre eksporterte
 *              `edge.in-domain-false.*`-casene og spec §9 «No flight».
 *
 *   reason     eksakt komplement til `inDomain`, ENGINE-GAPS §4.
 *
 * ── SHAPE-TERSKLENE ──────────────────────────────────────────────────────
 *
 * Ikke dokumentert i noen spec-fil. Testen regner intervallene ut av fixturen
 * på nytt hver kjøring og feiler hvis en terskel i modulen havner utenfor.
 * Den påstår IKKE at 1.5 / 1 / 7 er de ekte tallene — bare at de er
 * fixture-forenlige, og hvor mye slark som faktisk finnes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadFlight,
  loadFlightErrors,
  loadFlightMeta,
  loadStudio,
  report,
} from './_fixture.js';

import {
  solveOutcome,
  hasFlight,
  inDomain,
  outcomeReason,
  shape,
  startLabel,
  curveLabel,
  spinLoftReason,
  shapeLabels,
  shapeStartStraightMaxDeg,
  shapeCurveStraightMaxDeg,
  shapeCurveMajorMinDeg,
} from '../src/outcomeAdapter.js';

/* ── Hjelpere ───────────────────────────────────────────────────────────── */

const CASE_COUNT = 5028;

/** Feiler høyt: hele summary pluss de første avvikende casene. */
function assertReport(result) {
  assert.ok(
    result.ok,
    `${result.summary}\n${JSON.stringify(result.failures, null, 2)}`,
  );
}

/** Startordet og kurveordet slik de ligger i fixturens `shape`-streng. */
function splitShape(label) {
  if (label === 'Straight') return { start: '', curve: '' };
  const words = label.split(' ');
  if (words.length === 2) return { start: words[0], curve: words[1] };
  if (words[0] === 'Pull' || words[0] === 'Push') {
    return { start: words[0], curve: '' };
  }
  return { start: '', curve: words[0] };
}

/* ── shape: hele fixturen ───────────────────────────────────────────────── */

test('shape matcher fixturen i alle 5028 caser — eksakt, toleranse 0', () => {
  const cases = loadFlight();
  assert.equal(cases.length, CASE_COUNT, 'alle caser med out er med');

  const result = report(
    'flight/shape',
    cases.map((c) => ({
      id: c.id,
      field: 'shape',
      expected: c.out.shape,
      actual: solveOutcome(c.out).shape,
      tol: 0,
    })),
  );

  assertReport(result);
  assert.equal(result.total, cases.length, 'ingen case hoppet over');
  assert.equal(
    result.maxDeviation,
    0,
    'maks absolutt avvik skal være nøyaktig 0',
  );
});

test('den løsere toleransen oppgaven tilbød trengs ikke — 0 holder', () => {
  // 1e-9 relativt og 1e-6 absolutt er begge irrelevante for strenger og
  // booleans. Denne testen dokumenterer at ingen slark er i bruk: samme
  // resultat med tol 0 som med hvilken som helst positiv toleranse.
  const cases = loadFlight();

  const strict = report(
    'flight/shape@0',
    cases.map((c) => ({
      expected: c.out.shape,
      actual: shape(c.out.startDirection, c.out.faceToPath),
      tol: 0,
    })),
  );
  const loose = report(
    'flight/shape@1e-6',
    cases.map((c) => ({
      expected: c.out.shape,
      actual: shape(c.out.startDirection, c.out.faceToPath),
      tol: 1e-6,
    })),
  );

  assert.equal(strict.passed, CASE_COUNT);
  assert.equal(loose.passed, strict.passed, 'toleranse endrer ingenting');
  assert.equal(strict.maxDeviation, 0);
});

test('shape bruker bare de 15 etikettene, og bruker alle 15', () => {
  const fromFixture = new Set(loadFlight().map((c) => c.out.shape));
  const fromModule = new Set(
    loadFlight().map((c) => shape(c.out.startDirection, c.out.faceToPath)),
  );

  assert.deepEqual(
    [...fromFixture].sort(),
    [...shapeLabels].sort(),
    'fixturens etikettsett er nøyaktig shapeLabels',
  );
  assert.deepEqual([...fromModule].sort(), [...fromFixture].sort());
  assert.equal(shapeLabels.length, 15);
});

/* ── shape: dekomposisjonen ─────────────────────────────────────────────── */

test('startord og kurveord er rene funksjoner av startDirection og faceToPath', () => {
  // Grunnlaget for at dekomposisjonen i det hele tatt er lovlig: ingen verdi
  // av startDirection gir to ulike startord, og ingen verdi av faceToPath gir
  // to ulike kurveord. Verifisert over hele fixturen.
  const startByValue = new Map();
  const curveByValue = new Map();

  for (const c of loadFlight()) {
    const { start, curve } = splitShape(c.out.shape);

    const seenStart = startByValue.get(c.out.startDirection);
    if (seenStart === undefined) startByValue.set(c.out.startDirection, start);
    else assert.equal(seenStart, start, `tvetydig startord ved ${c.id}`);

    const seenCurve = curveByValue.get(c.out.faceToPath);
    if (seenCurve === undefined) curveByValue.set(c.out.faceToPath, curve);
    else assert.equal(seenCurve, curve, `tvetydig kurveord ved ${c.id}`);
  }

  assert.ok(startByValue.size > 200, 'fixturen har mange startretninger');
  assert.ok(curveByValue.size > 20, 'fixturen har mange face-to-path-verdier');

  for (const [value, word] of startByValue) {
    assert.equal(startLabel(value), word, `startLabel(${value})`);
  }
  for (const [value, word] of curveByValue) {
    assert.equal(curveLabel(value), word, `curveLabel(${value})`);
  }
});

test('shape er startord + kurveord, med Straight når begge er tomme', () => {
  for (const c of loadFlight()) {
    const { start, curve } = splitShape(c.out.shape);
    assert.equal(startLabel(c.out.startDirection), start, `${c.id} start`);
    assert.equal(curveLabel(c.out.faceToPath), curve, `${c.id} kurve`);
  }

  assert.equal(shape(0, 0), 'Straight');
  assert.equal(shape(-5, 0), 'Pull');
  assert.equal(shape(5, 0), 'Push');
  assert.equal(shape(0, -10), 'Hook');
  assert.equal(shape(0, 10), 'Slice');
  assert.equal(shape(-5, -3), 'Pull Draw');
  assert.equal(shape(5, 3), 'Push Fade');
});

test('fortegnet på kurveordet følger faceToPath, ikke spinnaksen', () => {
  // VERIFY.md: «shape labels use true face-to-path, not a recovered fitted
  // spin-axis gain». Fixturen er entydig: positivt gap → Fade/Slice.
  let checked = 0;
  for (const c of loadFlight()) {
    const { curve } = splitShape(c.out.shape);
    if (curve === '') {
      assert.equal(c.out.faceToPath, 0, `tomt kurveord krever gap 0: ${c.id}`);
      continue;
    }
    const right = curve === 'Fade' || curve === 'Slice';
    assert.equal(right, c.out.faceToPath > 0, `kurvefortegn ${c.id}`);
    checked += 1;
  }
  assert.equal(checked, CASE_COUNT - 713, '713 caser har faceToPath = 0');
});

test('fortegnet på startordet følger startDirection', () => {
  for (const c of loadFlight()) {
    const { start } = splitShape(c.out.shape);
    if (start === '') continue;
    assert.equal(start === 'Push', c.out.startDirection > 0, `${c.id}`);
  }
});

/* ── shape: terskler som fixturen bare låser til intervaller ────────────── */

test('de tre fittede tersklene ligger inne i fixturens intervaller', () => {
  let startStraightMax = -Infinity; // største |startDirection| uten startord
  let startSideMin = Infinity; //     minste |startDirection| med startord
  let curveStraightMax = -Infinity; // største |faceToPath| uten kurveord
  let curveMinorMin = Infinity; //     minste |faceToPath| med Draw/Fade
  let curveMinorMax = -Infinity; //    største |faceToPath| med Draw/Fade
  let curveMajorMin = Infinity; //     minste |faceToPath| med Hook/Slice

  for (const c of loadFlight()) {
    const { start, curve } = splitShape(c.out.shape);
    const startMagnitude = Math.abs(c.out.startDirection);
    const gap = Math.abs(c.out.faceToPath);

    if (start === '') startStraightMax = Math.max(startStraightMax, startMagnitude);
    else startSideMin = Math.min(startSideMin, startMagnitude);

    if (curve === '') curveStraightMax = Math.max(curveStraightMax, gap);
    else if (curve === 'Draw' || curve === 'Fade') {
      curveMinorMin = Math.min(curveMinorMin, gap);
      curveMinorMax = Math.max(curveMinorMax, gap);
    } else curveMajorMin = Math.min(curveMajorMin, gap);
  }

  // Det fixturen faktisk viser. Endres disse, har fixturen endret seg.
  assert.equal(startStraightMax, 1.4800000000000004);
  assert.equal(startSideMin, 1.5499999999999998);
  assert.equal(curveStraightMax, 0);
  assert.equal(curveMinorMin, 1);
  assert.equal(curveMinorMax, 6);
  assert.equal(curveMajorMin, 7.5);

  // Modulens terskler må ligge i hullet, ellers brytes en case.
  assert.ok(
    shapeStartStraightMaxDeg > startStraightMax &&
      shapeStartStraightMaxDeg <= startSideMin,
    `startterskel ${shapeStartStraightMaxDeg} utenfor (${startStraightMax}, ${startSideMin}]`,
  );
  assert.ok(
    shapeCurveStraightMaxDeg > curveStraightMax &&
      shapeCurveStraightMaxDeg <= curveMinorMin,
    `kurveterskel ${shapeCurveStraightMaxDeg} utenfor (${curveStraightMax}, ${curveMinorMin}]`,
  );
  assert.ok(
    shapeCurveMajorMinDeg > curveMinorMax &&
      shapeCurveMajorMinDeg <= curveMajorMin,
    `hook/slice-terskel ${shapeCurveMajorMinDeg} utenfor (${curveMinorMax}, ${curveMajorMin}]`,
  );

  // Slarken er reell: fixturen kan ikke skille disse fra de valgte verdiene.
  // Dokumentert som en åpen post, ikke skjult.
  assert.ok(startSideMin - startStraightMax > 0.06, 'hull i startretning');
  assert.ok(curveMajorMin - curveMinorMax > 1.4, 'hull i hook/slice-grensen');
});

/* ── hasFlight (ENGINE-GAPS §2) ─────────────────────────────────────────── */

test('fixturen returnerer ikke hasFlight, inDomain eller reason', () => {
  const meta = loadFlightMeta();
  assert.deepEqual(meta.requestedFieldsAbsentFromSolveFlight, [
    'hasFlight',
    'inDomain',
    'reason',
    'rk4Diagnostics',
  ]);
  assert.ok(meta.returnedFields.includes('shape'), 'shape ER et solveFlight-felt');

  for (const c of loadFlight()) {
    for (const field of ['hasFlight', 'inDomain', 'reason']) {
      assert.ok(
        !Object.prototype.hasOwnProperty.call(c.out, field),
        `${c.id} skal ikke ha ${field}`,
      );
    }
  }
});

test('hasFlight = carry > 0, pinnet av fire avledede felt i fixturen', () => {
  // Spec §5.6: `LandingAngle = hasFlight ? clamp(landingModel, 32, 60) : 0` og
  // `rollFraction = Carry > 0 ? … : 0`. Clampen har gulv 32, så landingAngle
  // kan ikke bli 0 med flukt. `landingDomainTerm` er 0 nøyaktig med flukt.
  const cases = loadFlight();

  const results = [];
  for (const c of cases) {
    const mine = solveOutcome(c.out).hasFlight;
    results.push({ id: c.id, field: 'landingAngle', pass: (c.out.landingAngle !== 0) === mine });
    results.push({ id: c.id, field: 'rollFrac', pass: (c.out.rollFrac !== 0) === mine });
    results.push({ id: c.id, field: 'roll', pass: (c.out.roll !== 0) === mine });
    results.push({
      id: c.id,
      field: 'landingDomainTerm',
      pass: (c.out.landingDomainTerm === 0) === mine,
    });
  }

  const result = report('flight/hasFlight (proxy)', results);
  assertReport(result);
  assert.equal(result.total, 4 * CASE_COUNT);

  // Fordelingen i baseline. Endres den, er det fixturen som har endret seg.
  assert.equal(cases.filter((c) => !hasFlight(c.out.carry)).length, 382);
  assert.equal(Math.min(...cases.map((c) => c.out.carry)), 0, 'ingen negativ carry');
});

test('hasFlight er `carry > 0` — nøyaktig 0 er ikke flukt', () => {
  assert.equal(hasFlight(0), false);
  assert.equal(hasFlight(-0), false);
  assert.equal(hasFlight(Number.MIN_VALUE), true);
  assert.equal(hasFlight(-1), false);
  assert.equal(hasFlight(180.38286474188666), true);

  const zeroCarry = loadFlight().filter((c) => c.out.carry === 0);
  assert.equal(zeroCarry.length, 382);
  for (const c of zeroCarry) {
    assert.equal(solveOutcome(c.out).hasFlight, false, c.id);
  }
});

/* ── inDomain og reason (ENGINE-GAPS §3–4) ──────────────────────────────── */

test('inDomain følger fixturens egen dokumenterte regel', () => {
  const meta = loadFlightMeta();
  assert.equal(
    meta.edgeCaseSelection.adapterInDomainRule,
    'signedVerticalSpinLoftDeg > 0; this rule is not returned by solveFlight',
  );

  const result = report(
    'flight/inDomain',
    loadFlight().map((c) => ({
      id: c.id,
      field: 'inDomain',
      expected: c.out.signedVerticalSpinLoftDeg > 0,
      actual: solveOutcome(c.out).inDomain,
      tol: 0,
    })),
  );

  assertReport(result);
  assert.equal(result.total, CASE_COUNT);
  assert.equal(result.maxDeviation, 0);
});

test('de tre eksporterte in-domain-false-casene er false, med og uten flukt', () => {
  const group = loadFlight().filter(
    (c) => c.group === 'edge.adapter-in-domain-false',
  );
  assert.equal(group.length, 3, 'fixturen eksporterte nøyaktig tre');

  const byId = new Map(group.map((c) => [c.id, c]));
  const expected = [
    ['edge.in-domain-false.negative-vertical-spin-loft-with-flight', true],
    ['edge.in-domain-false.zero-vertical-spin-loft-with-flight', true],
    ['edge.in-domain-false.zero-vertical-spin-loft-without-flight', false],
  ];

  for (const [id, flight] of expected) {
    const c = byId.get(id);
    assert.ok(c, `fixturen har ${id}`);

    const mine = solveOutcome(c.out);
    assert.equal(mine.inDomain, false, `${id} inDomain`);
    assert.equal(mine.reason, spinLoftReason, `${id} reason`);
    assert.equal(mine.hasFlight, flight, `${id} hasFlight`);
  }
});

test('grensen er streng: signedVerticalSpinLoftDeg = 0 er UTENFOR domenet', () => {
  // Spec §9 «No flight» (90 / 0 / 0 / 0 / 0) er dokumentert med
  // `inDomain = false`, og har nøyaktig 0 vertikal spin loft.
  const byId = new Map(loadFlight().map((c) => [c.id, c]));
  const noFlight = byId.get('spec-9.no-flight');
  assert.ok(noFlight);
  assert.equal(noFlight.out.signedVerticalSpinLoftDeg, 0);
  assert.equal(solveOutcome(noFlight.out).inDomain, false, 'spec §9');

  const zero = loadFlight().filter(
    (c) => c.out.signedVerticalSpinLoftDeg === 0,
  );
  assert.equal(zero.length, 129, 'fixturen har 129 caser på grensen');
  for (const c of zero) assert.equal(solveOutcome(c.out).inDomain, false, c.id);

  assert.equal(inDomain(0), false);
  assert.equal(inDomain(-0), false);
  assert.equal(inDomain(Number.MIN_VALUE), true);
  assert.equal(inDomain(-7.5), false);
});

test('inDomain ser bare på signert vertikal spin loft — ikke 3-D-vinkelen', () => {
  // FUNN F4 / ENGINE-GAPS §3: hastighet, Reynolds, spin parameter, launch,
  // carry, clamps og RK4-diagnostikk inngår ikke. `spinLoft`/`spinLoft3DDeg`
  // er ikke-negative og kunne aldri gitt false.
  const cases = loadFlight();
  assert.ok(cases.every((c) => c.out.spinLoft3DDeg >= 0));

  const disagreeing = cases.filter(
    (c) => c.out.spinLoft3DDeg > 0 !== c.out.signedVerticalSpinLoftDeg > 0,
  );
  assert.ok(disagreeing.length > 0, 'de to predikatene er ikke samme predikat');
  for (const c of disagreeing) {
    assert.equal(
      solveOutcome(c.out).inDomain,
      c.out.signedVerticalSpinLoftDeg > 0,
      `${c.id} følger den signerte, ikke 3-D`,
    );
  }

  // Og feltet er `dynamicLoft − attackAngle`, eksakt, i alle caser.
  for (const c of cases) {
    assert.equal(
      c.out.signedVerticalSpinLoftDeg,
      c.in.dynamicLoft - c.in.attackAngle,
      c.id,
    );
  }
});

test('reason har nøyaktig to verdier og er komplementet til inDomain', () => {
  const seen = new Set();
  for (const c of loadFlight()) {
    const mine = solveOutcome(c.out);
    seen.add(mine.reason);
    assert.equal(mine.reason === null, mine.inDomain, c.id);
  }
  assert.deepEqual([...seen].sort(), ['spin-loft', null].sort());
  assert.equal(spinLoftReason, 'spin-loft');

  assert.equal(outcomeReason(28), null);
  assert.equal(outcomeReason(0), 'spin-loft');
  assert.equal(outcomeReason(-7.5), 'spin-loft');
});

test('hasFlight og inDomain er uavhengige — alle fire kombinasjoner finnes', () => {
  const quadrants = new Map();
  for (const c of loadFlight()) {
    const mine = solveOutcome(c.out);
    const key = `${mine.hasFlight}|${mine.inDomain}`;
    quadrants.set(key, (quadrants.get(key) ?? 0) + 1);
  }

  assert.deepEqual(
    [...quadrants.entries()].sort(),
    [
      ['false|false', 128],
      ['false|true', 254],
      ['true|false', 379],
      ['true|true', 4267],
    ],
  );
});

/* ── Spec §9 golden cases ───────────────────────────────────────────────── */

test('spec §9: de dokumenterte etikettene og domeneutfallene stemmer', () => {
  const byId = new Map(loadFlight().map((c) => [c.id, c]));

  // Spec §9-tabellen navngir shape for to av de fire casene.
  const fromSpec = [
    ['spec-9.neutral-iron', 'Straight', true],
    ['spec-9.push-draw', 'Push Draw', true],
    ['spec-9.no-flight', null, false], // shape ikke oppgitt; inDomain = false
    ['spec-9.d-plane-default', null, true],
  ];

  for (const [id, specShape, specInDomain] of fromSpec) {
    const c = byId.get(id);
    assert.ok(c, `fixturen har ${id}`);

    const mine = solveOutcome(c.out);
    assert.equal(mine.shape, c.out.shape, `${id} mot fixtur`);
    if (specShape !== null) {
      assert.equal(mine.shape, specShape, `${id} mot spec §9-tabellen`);
    }
    assert.equal(mine.inDomain, specInDomain, `${id} inDomain`);
  }

  // «No flight»: launch, carry, curve, apex, landing og spin er 0.
  const noFlight = byId.get('spec-9.no-flight');
  assert.equal(solveOutcome(noFlight.out).hasFlight, false);
  assert.equal(solveOutcome(noFlight.out).reason, spinLoftReason);
});

/* ── Kontrakten på returobjektet ────────────────────────────────────────── */

test('returobjektet har nøyaktig de fire feltene og ingen presentasjonsdata', () => {
  const out = solveOutcome({
    carry: 180,
    signedVerticalSpinLoftDeg: 28,
    startDirection: 0,
    faceToPath: 0,
  });

  assert.deepEqual(Object.keys(out).sort(), [
    'hasFlight',
    'inDomain',
    'reason',
    'shape',
  ]);
  assert.deepEqual(out, {
    hasFlight: true,
    inDomain: true,
    reason: null,
    shape: 'Straight',
  });

  // Ingen farge, tips, pct eller barPos — FUNN F6 gjelder også her.
  for (const c of loadFlight().slice(0, 50)) {
    const keys = Object.keys(solveOutcome(c.out));
    assert.equal(keys.length, 4, c.id);
    for (const banned of ['color', 'textColor', 'tip', 'pct', 'barPos', 'label']) {
      assert.ok(!keys.includes(banned), `${c.id} lekker ${banned}`);
    }
  }
});

test('ekstra felt i input ignoreres, og adapteren er ren', () => {
  const base = {
    carry: 0,
    signedVerticalSpinLoftDeg: -3,
    startDirection: -2,
    faceToPath: -8,
  };

  assert.deepEqual(solveOutcome({ ...base, clubSpeed: 30, apex: 1 }), {
    hasFlight: false,
    inDomain: false,
    reason: 'spin-loft',
    shape: 'Pull Hook',
  });

  // Samme input to ganger gir samme svar, og input muteres ikke.
  const frozen = Object.freeze({ ...base });
  assert.deepEqual(solveOutcome(frozen), solveOutcome(frozen));
  assert.deepEqual(frozen, base);
});

/* ── Caser fixturen ikke gir fasit for ──────────────────────────────────── */

test('RK4-timeout-casen har ingen out — adapteren har ingen fasit der', () => {
  // `clubSpeed: 18000` kastet i RK4. Uten `out` finnes verken carry, shape
  // eller signert spin loft. Vi hevder ingen verdi; vi hevder bare at casen
  // fortsatt er den ene kjente, slik at ingen senere «fikser» den inn.
  const errors = loadFlightErrors();
  assert.equal(errors.length, 1);
  assert.equal(errors[0].id, 'edge.rk4-no-ground-within-30-seconds');
  assert.equal(errors[0].group, 'edge.rk4-timeout-outside-declared-input-range');
  assert.equal(
    errors[0].error.message,
    'Flight did not reach the ground within maxTimeSeconds',
  );
});

test('studio-fixturen har ingen av disse feltene — adapteren er flight-only', () => {
  // Spec §11.3: Studio beregner aldri spinn, carry eller ballflukt.
  const studio = loadStudio();
  assert.equal(studio.length, 2500);

  for (const field of ['shape', 'carry', 'signedVerticalSpinLoftDeg', 'startDirection']) {
    assert.ok(
      !Object.prototype.hasOwnProperty.call(studio[0].out, field),
      `studio skal ikke ha ${field}`,
    );
  }
});
