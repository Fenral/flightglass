/**
 * curveProjection mot flight-golden.json.
 *
 * Kjører modulen over alle 5028 løste flight-caser og sammenligner `curve`,
 * `curveFromLaunchLineM`, `curveCarryProjectionScale` og
 * `curveCarryProjectionDefined` mot fixturen.
 *
 * TOLERANSE — hva som faktisk trengs:
 *
 *   `curveCarryProjectionDefined`   0. Bit-eksakt på alle 5028.
 *   `curveCarryProjectionScale`     4935/5028 bit-eksakt, maks avvik
 *                                   8.88e-16 absolutt, 2.20e-16 relativt.
 *   `curveFromLaunchLineM`          4962/5028 bit-eksakt, maks avvik
 *                                   1.42e-14 absolutt, 2.75e-16 relativt.
 *   `curve`                         4964/5028 bit-eksakt, maks avvik
 *                                   2.84e-14 absolutt, 4.05e-16 relativt.
 *
 * 1e-9 relativt holder med fire tiårs margin, og trengs ikke slakkes til
 * 1e-6 absolutt for noe felt. Ingen case har fasit `0` og et beregnet tall
 * ulikt `0`, så en ren relativ toleranse er trygg her.
 *
 * De 66 casene som ikke er bit-eksakte er IKKE en feil i modulen. Fixturen
 * publiserer rå RK4-downrange bare som `curveFlightCarryYd`, altså
 * `D_raw / 0.9144`. Den konverteringen kaster bort informasjon, og
 * tilbakeregningen `curveFlightCarryYd * 0.9144` bommer med nøyaktig 1 ULP i
 * 93 av 4645 caser. Testen «±1 ULP på D_raw gjør alt bit-eksakt» beviser det:
 * gitt en ekte `D_raw` er modulen eksakt på alle 5028.
 *
 * Alle tellingene under er låst med `assert.equal`, ikke `assert.ok`. IEEE
 * 754 uten fused multiply-add er deterministisk, så tallene er stabile.
 * Endrer et av dem seg, har rekkefølgen i `src/curveProjection.js` endret
 * seg, og det er en fysikkendring i forkledning.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, report } from './_fixture.js';

import {
  carryProjection,
  curveIsSuppressed,
  curveProjection,
  metresToYards,
  projectedCurveFromLaunchLineM,
  yardsToMetres,
} from '../src/curveProjection.js';

/** Antall løste caser i baseline. */
const SOLVED_CASES = 5028;

/** Relativ toleranse fra oppgaven. */
const RELATIVE_TOLERANCE = 1e-9;

/** Grensen i ENGINE-GAPS §6, gren 2. Speiles av `out` i hver eneste case. */
const MINIMUM_DOWNRANGE_M = 1;

/* ── Fixture → modulinput ───────────────────────────────────────────────── */

/**
 * Bygger modulens input av `out`.
 *
 * `rawDownrangeM` rekonstrueres fra `curveFlightCarryYd`; det er den ene
 * lossy verdien, se filtoppen. `hasFlight` er ENGINE-GAPS §2 (`carry > 0`)
 * og eies av en annen modul — her leses den rett av fixturen.
 */
function inputOf(out) {
  return {
    rawCurveFromLaunchLineM: out.rawCurveFromLaunchLineM,
    rawDownrangeM: yardsToMetres(out.curveFlightCarryYd),
    targetCarryM: yardsToMetres(out.carry),
    hasFlight: out.carry > 0,
    faceToPath: out.faceToPath,
  };
}

/** Kjører modulen over hele fixturen én gang og gir [case, expected, actual]. */
function evaluated() {
  return loadFlight().map((c) => [c, c.out, curveProjection(inputOf(c.out))]);
}

/** Tallfeltene, med toleranse utledet per case. */
const NUMERIC_FIELDS = ['curve', 'curveFromLaunchLineM'];

function* comparisons(tolerance) {
  for (const [c, expected, actual] of evaluated()) {
    for (const field of NUMERIC_FIELDS) {
      yield {
        id: c.id,
        field,
        expected: expected[field],
        actual: actual[field],
        tol: tolerance(expected[field]),
      };
    }

    // Skalaen er `number | null`. `null` sammenlignes eksakt, tall med toleranse.
    const expectedScale = expected.curveCarryProjectionScale;
    const actualScale = actual.curveCarryProjectionScale;
    yield expectedScale === null || actualScale === null
      ? {
          id: c.id,
          field: 'curveCarryProjectionScale',
          expected: expectedScale,
          actual: actualScale,
          pass: expectedScale === actualScale,
        }
      : {
          id: c.id,
          field: 'curveCarryProjectionScale',
          expected: expectedScale,
          actual: actualScale,
          tol: tolerance(expectedScale),
        };

    yield {
      id: c.id,
      field: 'curveCarryProjectionDefined',
      expected: expected.curveCarryProjectionDefined,
      actual: actual.curveCarryProjectionDefined,
      pass:
        expected.curveCarryProjectionDefined ===
        actual.curveCarryProjectionDefined,
    };
  }
}

/* ── Fixturen ───────────────────────────────────────────────────────────── */

test('alle 5028 caser er innenfor 1e-9 relativt', () => {
  const result = report(
    'flight/curveProjection@1e-9rel',
    comparisons((expected) => RELATIVE_TOLERANCE * Math.abs(expected)),
  );

  assert.equal(result.total, SOLVED_CASES * 4, 'fire felt per case');
  assert.ok(
    result.ok,
    `${result.summary}\n${JSON.stringify(result.failures, null, 2)}`,
  );
});

test('avviket er 1 ULP eller mindre — de faktiske tallene, ikke oppgavens tak', () => {
  // Låser hvor nær vi faktisk er. Ryker en av disse har noe flyttet seg.
  const perField = new Map(
    ['curve', 'curveFromLaunchLineM', 'curveCarryProjectionScale'].map((f) => [
      f,
      { exact: 0, total: 0, maxAbs: 0, maxRel: 0 },
    ]),
  );
  let definedExact = 0;

  for (const [, expected, actual] of evaluated()) {
    for (const field of perField.keys()) {
      const stat = perField.get(field);
      stat.total += 1;
      const e = expected[field];
      const a = actual[field];
      if (e === a) {
        stat.exact += 1;
        continue;
      }
      assert.equal(typeof e, 'number', `${field}: ulik null-ness`);
      assert.equal(typeof a, 'number', `${field}: ulik null-ness`);
      const deviation = Math.abs(e - a);
      stat.maxAbs = Math.max(stat.maxAbs, deviation);
      // Ingen fasit-0 havner her; ville gitt Infinity og strøket testen.
      stat.maxRel = Math.max(stat.maxRel, deviation / Math.abs(e));
    }
    if (
      expected.curveCarryProjectionDefined ===
      actual.curveCarryProjectionDefined
    ) {
      definedExact += 1;
    }
  }

  assert.equal(definedExact, SOLVED_CASES, 'curveCarryProjectionDefined');

  assert.deepEqual(perField.get('curveCarryProjectionScale'), {
    total: SOLVED_CASES,
    exact: 4935,
    maxAbs: 8.881784197001252e-16,
    maxRel: 2.19796618026098e-16,
  });
  assert.deepEqual(perField.get('curveFromLaunchLineM'), {
    total: SOLVED_CASES,
    exact: 4962,
    maxAbs: 1.4210854715202004e-14,
    maxRel: 2.7500389601950714e-16,
  });
  assert.deepEqual(perField.get('curve'), {
    total: SOLVED_CASES,
    exact: 4964,
    maxAbs: 2.842170943040401e-14,
    maxRel: 4.046155770972895e-16,
  });
});

test('med en ekte D_raw er modulen bit-eksakt — avviket ligger i fixturen', () => {
  // `curveFlightCarryYd` er `D_raw / 0.9144`. Flere `D_raw` gir samme
  // yard-tall. For hver projiserte case finnes en `D_raw` innenfor ±1 ULP av
  // tilbakeregningen som BÅDE runder tilbake til det publiserte yard-tallet
  // OG gjør alle tre tallfeltene bit-eksakte. Da er formelen riktig og
  // inputen upresis — ikke omvendt.
  const view = new DataView(new ArrayBuffer(8));
  const nudge = (x, steps) => {
    // Bare gyldig for x > 0; her er `D_raw >= 1` per gren 2.
    view.setFloat64(0, x);
    view.setBigUint64(0, view.getBigUint64(0) + BigInt(steps));
    return view.getFloat64(0);
  };

  let projectedCases = 0;
  let resolved = 0;
  let roundTrips = 0;
  const offsets = new Map([
    [-1, 0],
    [0, 0],
    [1, 0],
  ]);

  for (const c of loadFlight()) {
    const out = c.out;
    const base = inputOf(out);
    if (base.targetCarryM <= 1e-12) continue;
    if (!(base.rawDownrangeM >= MINIMUM_DOWNRANGE_M)) continue;
    projectedCases += 1;

    for (const steps of [0, 1, -1]) {
      const rawDownrangeM = nudge(base.rawDownrangeM, steps);
      const actual = curveProjection({ ...base, rawDownrangeM });
      if (
        actual.curveCarryProjectionScale !== out.curveCarryProjectionScale ||
        actual.curveFromLaunchLineM !== out.curveFromLaunchLineM ||
        actual.curve !== out.curve
      ) {
        continue;
      }
      resolved += 1;
      offsets.set(steps, offsets.get(steps) + 1);
      if (metresToYards(rawDownrangeM) === out.curveFlightCarryYd) {
        roundTrips += 1;
      }
      break;
    }
  }

  assert.equal(projectedCases, 4645, 'caser som treffer gren 2');
  assert.equal(resolved, 4645, 'alle løses av en D_raw innen ±1 ULP');
  assert.equal(roundTrips, 4645, 'og hver av dem runder tilbake til fixturen');
  assert.deepEqual(
    [offsets.get(-1), offsets.get(0), offsets.get(1)],
    [53, 4552, 40],
    'ULP-fordeling: 4552 treffer rett på, 93 bommer med nøyaktig 1',
  );
});

/* ── Grenene ────────────────────────────────────────────────────────────── */

test('de tre grenene i §6 treffes med kjente antall', () => {
  let epsilonBranch = 0;
  let projectedBranch = 0;
  let undefinedBranch = 0;
  const undefinedIds = [];

  for (const [c, expected] of evaluated()) {
    const { targetCarryM, rawDownrangeM } = inputOf(c.out);
    if (targetCarryM <= 1e-12) {
      epsilonBranch += 1;
      assert.equal(expected.curveCarryProjectionScale, 1, c.id);
      assert.equal(expected.curveCarryProjectionDefined, true, c.id);
    } else if (rawDownrangeM >= MINIMUM_DOWNRANGE_M) {
      projectedBranch += 1;
      assert.equal(expected.curveCarryProjectionDefined, true, c.id);
    } else {
      undefinedBranch += 1;
      undefinedIds.push(c.id);
      assert.equal(expected.curveCarryProjectionScale, null, c.id);
      assert.equal(expected.curveCarryProjectionDefined, false, c.id);
    }
  }

  assert.equal(epsilonBranch, 382);
  assert.equal(projectedBranch, 4645);
  assert.equal(undefinedBranch, 1);
  assert.deepEqual(undefinedIds, ['edge.curve-sub-one-m-positive-carry']);
  assert.equal(epsilonBranch + projectedBranch + undefinedBranch, SOLVED_CASES);
});

test('gren 1 testes før gren 2, og den bærer 382 caser', () => {
  // Uten epsilon-grenen faller alle 382 carry-null-casene ned i gren 3, fordi
  // deres rå downrange er langt under 1 m (maks 0.00208 m). Da blir `defined`
  // false og `scale` null — feil i alle 382. Kurveverdien ville overlevd,
  // siden hasFlight-nullingen tar den uansett, men de to andre feltene ikke.
  let zeroCarry = 0;
  let maxDownrange = 0;
  let wouldFlip = 0;

  for (const [, expected] of evaluated()) {
    const { targetCarryM, rawDownrangeM } = inputOf(expected);
    if (targetCarryM > 1e-12) continue;
    zeroCarry += 1;
    maxDownrange = Math.max(maxDownrange, rawDownrangeM);

    const withoutBranchOne =
      rawDownrangeM >= MINIMUM_DOWNRANGE_M
        ? { defined: true, scale: targetCarryM / rawDownrangeM }
        : { defined: false, scale: null };
    if (
      withoutBranchOne.defined !== expected.curveCarryProjectionDefined ||
      withoutBranchOne.scale !== expected.curveCarryProjectionScale
    ) {
      wouldFlip += 1;
    }
  }

  assert.equal(zeroCarry, 382);
  assert.equal(maxDownrange, 0.0020769642245538245);
  assert.equal(wouldFlip, 382, 'epsilon-grenen er ikke død kode');
});

test('1 m-grensen står trygt unna alle caser', () => {
  // Nærmeste D_raw over grensen er 2.18 m, nærmeste under er 0.0023 m.
  // ±1 ULP i rekonstruksjonen kan ikke vippe gren 2 mot gren 3.
  let closestAbove = Infinity;
  let closestBelow = 0;

  for (const c of loadFlight()) {
    const { targetCarryM, rawDownrangeM } = inputOf(c.out);
    if (targetCarryM <= 1e-12) continue;
    if (rawDownrangeM >= MINIMUM_DOWNRANGE_M) {
      closestAbove = Math.min(closestAbove, rawDownrangeM);
    } else {
      closestBelow = Math.max(closestBelow, rawDownrangeM);
    }
  }

  assert.equal(closestAbove, 2.1754487955953423);
  assert.equal(closestBelow, 0.002274435994424965);
});

test('fixturen speiler grensen som out.curveCarryProjectionMinimumDownrangeM', () => {
  let matches = 0;
  for (const c of loadFlight()) {
    if (c.out.curveCarryProjectionMinimumDownrangeM === MINIMUM_DOWNRANGE_M) {
      matches += 1;
    }
  }
  assert.equal(matches, SOLVED_CASES);
});

test('aeroModel speiler skala og defined uten å avvike', () => {
  // Samme to tallene dukker opp to steder i `out`. Modulen produserer ett
  // sett; her kontrolleres at fixturen ikke skiller mellom dem.
  let mirrored = 0;
  for (const [, expected, actual] of evaluated()) {
    if (
      expected.aeroModel.carryProjectionDefined ===
        actual.curveCarryProjectionDefined &&
      expected.aeroModel.carryProjectionScale ===
        expected.curveCarryProjectionScale
    ) {
      mirrored += 1;
    }
  }
  assert.equal(mirrored, SOLVED_CASES);
});

/* ── Nullingen ──────────────────────────────────────────────────────────── */

test('begge leddene i nullingen er load-bearing — ingen kan fjernes', () => {
  let suppressed = 0;
  let noFlight = 0;
  let faceOnPath = 0;
  let both = 0;
  let breaksWithoutFaceToPath = 0;
  let breaksWithoutHasFlight = 0;
  let breaksWithoutEither = 0;
  let maxSuppressedByFaceToPathOnly = 0;
  let maxSuppressedByNoFlightOnly = 0;

  for (const [, expected] of evaluated()) {
    const input = inputOf(expected);
    // Fixturens egen skala, ikke den rekonstruerte. Spørsmålet her er om
    // leddene er dødt kode, ikke hvor presis D_raw-tilbakeregningen er — de
    // 93 ULP-bommene ville ellers blandet seg inn i tellingen.
    const projected = projectedCurveFromLaunchLineM(
      input.rawCurveFromLaunchLineM,
      expected.curveCarryProjectionScale,
    );

    const withoutFlight = !input.hasFlight;
    const onPath = input.faceToPath === 0;

    if (withoutFlight || onPath) suppressed += 1;
    if (withoutFlight) noFlight += 1;
    if (onPath) faceOnPath += 1;
    if (withoutFlight && onPath) both += 1;

    if (withoutFlight && !onPath) {
      maxSuppressedByNoFlightOnly = Math.max(
        maxSuppressedByNoFlightOnly,
        Math.abs(projected),
      );
    }
    if (onPath && !withoutFlight) {
      maxSuppressedByFaceToPathOnly = Math.max(
        maxSuppressedByFaceToPathOnly,
        Math.abs(projected),
      );
    }

    const fixture = expected.curveFromLaunchLineM;
    if ((withoutFlight ? 0 : projected) !== fixture) breaksWithoutFaceToPath += 1;
    if ((onPath ? 0 : projected) !== fixture) breaksWithoutHasFlight += 1;
    if (projected !== fixture) breaksWithoutEither += 1;
  }

  assert.equal(noFlight, 382, 'hasFlight = false');
  assert.equal(faceOnPath, 713, 'faceToPath = 0');
  assert.equal(both, 82);
  assert.equal(suppressed, 1013);

  assert.equal(breaksWithoutFaceToPath, 400, 'faceToPath-leddet er ikke dødt');
  assert.equal(breaksWithoutHasFlight, 300, 'hasFlight-leddet er ikke dødt');
  assert.equal(breaksWithoutEither, 738);

  // Størrelsesorden er svært ulik. faceToPath-leddet fjerner ren støy —
  // «redundant» i fysisk forstand, men ikke bit-eksakt. hasFlight-leddet
  // fjerner ekte tall.
  assert.equal(maxSuppressedByFaceToPathOnly, 2.024821424504528e-13);
  assert.equal(maxSuppressedByNoFlightOnly, 0.000003545381448267159);
});

test('curveFromLaunchLineM nulles på samme predikat som curve', () => {
  // ENGINE-GAPS §6 nevner bare `curve`. Fixturen nuller begge.
  let suppressedBoth = 0;
  for (const [c, expected] of evaluated()) {
    const input = inputOf(expected);
    if (!curveIsSuppressed(input.hasFlight, input.faceToPath)) continue;
    suppressedBoth += 1;
    assert.equal(expected.curveFromLaunchLineM, 0, `${c.id} metre`);
    assert.equal(expected.curve, 0, `${c.id} yard`);
  }
  assert.equal(suppressedBoth, 1013);
});

test('curveIsSuppressed er nøyaktig ELLER-en fra §6', () => {
  assert.equal(curveIsSuppressed(true, 2), false);
  assert.equal(curveIsSuppressed(true, 0), true);
  assert.equal(curveIsSuppressed(false, 2), true);
  assert.equal(curveIsSuppressed(false, 0), true);
  assert.equal(curveIsSuppressed(true, -0), true, '−0 er 0');
});

/* ── Enhetskonverteringen ───────────────────────────────────────────────── */

test('curve er metertallet delt på 0.9144, ikke ganget med den resiproke', () => {
  // `metres * (1 / 0.9144)` treffer bare 4608 av 5028. Denne testen finnes
  // for at ingen skal «forenkle» divisjonen bort.
  let divisionExact = 0;
  let reciprocalExact = 0;
  const reciprocal = 1 / 0.9144;

  for (const [, expected] of evaluated()) {
    if (expected.curveFromLaunchLineM / 0.9144 === expected.curve) {
      divisionExact += 1;
    }
    if (expected.curveFromLaunchLineM * reciprocal === expected.curve) {
      reciprocalExact += 1;
    }
  }

  assert.equal(divisionExact, SOLVED_CASES);
  assert.equal(reciprocalExact, 4608);
});

test('yard → meter ganger med 0.9144; den resiproke veien treffer dårligere', () => {
  let multiplyExact = 0;
  let divideExact = 0;
  const reciprocal = 1 / 0.9144;

  for (const c of loadFlight()) {
    const out = c.out;
    const targetCarryM = out.carry * 0.9144;
    if (targetCarryM <= 1e-12) continue;
    const downrangeM = out.curveFlightCarryYd * 0.9144;
    if (!(downrangeM >= MINIMUM_DOWNRANGE_M)) continue;

    if (targetCarryM / downrangeM === out.curveCarryProjectionScale) {
      multiplyExact += 1;
    }
    if (
      out.carry / reciprocal / (out.curveFlightCarryYd / reciprocal) ===
      out.curveCarryProjectionScale
    ) {
      divideExact += 1;
    }
  }

  assert.equal(multiplyExact, 4552);
  assert.equal(divideExact, 3893);
});

test('skalaen er en divisjon, ikke multiplikasjon med den resiproke', () => {
  let divisionExact = 0;
  let reciprocalExact = 0;

  for (const c of loadFlight()) {
    const { targetCarryM, rawDownrangeM } = inputOf(c.out);
    if (targetCarryM <= 1e-12) continue;
    if (!(rawDownrangeM >= MINIMUM_DOWNRANGE_M)) continue;

    if (targetCarryM / rawDownrangeM === c.out.curveCarryProjectionScale) {
      divisionExact += 1;
    }
    if (
      targetCarryM * (1 / rawDownrangeM) ===
      c.out.curveCarryProjectionScale
    ) {
      reciprocalExact += 1;
    }
  }

  assert.equal(divisionExact, 4552);
  assert.equal(reciprocalExact, 3452);
});

/* ── Formen på returverdien ─────────────────────────────────────────────── */

test('returobjektet inneholder kun de fire feltene', () => {
  const out = curveProjection({
    rawCurveFromLaunchLineM: 5.061854907889942,
    rawDownrangeM: yardsToMetres(177.88542436219228),
    targetCarryM: yardsToMetres(188.399763155694),
    hasFlight: true,
    faceToPath: 2,
  });

  assert.deepEqual(Object.keys(out).sort(), [
    'curve',
    'curveCarryProjectionDefined',
    'curveCarryProjectionScale',
    'curveFromLaunchLineM',
  ]);

  // Ordrett fra fixturen, edge.spec-9-golden / spec-9.d-plane-default.
  assert.equal(out.curveCarryProjectionDefined, true);
  assert.equal(out.curveCarryProjectionScale, 1.0591073654921468);
  assert.equal(out.curveFromLaunchLineM, 5.36104781599881);
  assert.equal(out.curve, 5.8629131846006235);
});

test('gren 3: udefinert projeksjon lar rå kurve stå', () => {
  // Ordrett fra fixturen, edge.curve-sub-one-m-positive-carry.
  const out = curveProjection({
    rawCurveFromLaunchLineM: 0.0000012133941066194264,
    rawDownrangeM: yardsToMetres(0.0024873534497210905),
    targetCarryM: yardsToMetres(8.140695841067622),
    hasFlight: true,
    faceToPath: 3,
  });

  assert.equal(out.curveCarryProjectionDefined, false);
  assert.equal(out.curveCarryProjectionScale, null);
  assert.equal(out.curveFromLaunchLineM, 0.0000012133941066194264);
  assert.equal(out.curve, 0.000001326983931123607);
});

test('gren 1: ingen carry gir definert projeksjon med skala 1', () => {
  // Ordrett fra fixturen, edge.spec-9-golden / spec-9.no-flight.
  const out = curveProjection({
    rawCurveFromLaunchLineM: 0,
    rawDownrangeM: yardsToMetres(0.001363291183582465),
    targetCarryM: yardsToMetres(0),
    hasFlight: false,
    faceToPath: 0,
  });

  assert.equal(out.curveCarryProjectionDefined, true);
  assert.equal(out.curveCarryProjectionScale, 1);
  assert.equal(out.curveFromLaunchLineM, 0);
  assert.equal(out.curve, 0);
});

test('delfunksjonene komponerer til det samlede kallet', () => {
  const input = {
    rawCurveFromLaunchLineM: -6.2454027232980405,
    rawDownrangeM: yardsToMetres(172.1830561726785),
    targetCarryM: yardsToMetres(181.41131517286283),
    hasFlight: true,
    faceToPath: -3,
  };

  const projection = carryProjection(input.rawDownrangeM, input.targetCarryM);
  const projected = projectedCurveFromLaunchLineM(
    input.rawCurveFromLaunchLineM,
    projection.scale,
  );
  const combined = curveProjection(input);

  assert.equal(combined.curveCarryProjectionDefined, projection.defined);
  assert.equal(combined.curveCarryProjectionScale, projection.scale);
  assert.equal(combined.curveFromLaunchLineM, projected);
  assert.equal(combined.curve, metresToYards(projected));

  // Ordrett fra fixturen, edge.spec-9-golden / spec-9.push-draw.
  assert.equal(combined.curveCarryProjectionScale, 1.0535956278469674);
  assert.equal(combined.curveFromLaunchLineM, -6.580129003410359);
  assert.equal(combined.curve, -7.196116582907217);
});

test('skala 1 er identitet på den rå kurven', () => {
  for (const raw of [0, -0, 1.5, -6.2454027232980405, 1e-16, -3.545e-6]) {
    assert.equal(
      Object.is(projectedCurveFromLaunchLineM(raw, 1), raw),
      true,
      `raw = ${raw}`,
    );
  }
});
