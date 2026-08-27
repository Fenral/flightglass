/**
 * Integrasjonstest — de to offentlige funksjonene mot HELE fixturen.
 *
 *   `solveFlight`   mot alle 5029 flight-caser (5028 med `out`, 1 med `error`)
 *   `deriveImpact`  mot alle 2500 studio-caser
 *
 * Fixturen er fasit. Avviker koden fra fixturen, er det koden som har feil.
 *
 * ── SAMMENLIGNINGSKONTRAKT ────────────────────────────────────────────────
 *
 * 1. NØKKELREKKEFØLGE teller. `solveFlight` må levere nøyaktig
 *    `_meta.returnedFields` i fixturens rekkefølge — ikke bare de samme
 *    verdiene. Det samme gjelder nestede objekter (`aeroModel`,
 *    `aerodynamicDiagnostics`, `clubBallContact`, `planeBasis`, …).
 *
 * 2. TOLERANSE ER 0 for 72 av de 81 flight-feltene og for alle studio-felt.
 *    Bit-eksakt betyr bit-eksakt.
 *
 *    De ni unntakene er alle nedstrøms RK4-integratoren, der akkumulert
 *    flyttallsstøy over ~hundre steg er uunngåelig. Der gjelder relativ
 *    toleranse 1e-9 med et absolutt gulv på 1e-12:
 *
 *      tol = max(1e-12, 1e-9 × |expected|)
 *
 *    Gulvet er nødvendig fordi noen rå RK4-verdier er ~1e-15 m, der en
 *    relativ toleranse ville krevd flere siffer enn en `double` har igjen.
 *    Målt utnyttelse av denne toleransen i baseline: maks 2.9 % (på
 *    `rawCurveFromLaunchLineM`); nest verst er 5.2e-5 %. Marginen er altså
 *    ikke i nærheten av å bli spist opp — toleransen er ikke en unnskyldning.
 *
 * 3. `-0` OG `0` REGNES SOM LIKE. Ikke som en oppmykning: `JSON.stringify(-0)`
 *    er `"0"`, så fixturen KAN ikke bære fortegnet på null. Den er taus, ikke
 *    uenig. `test/_fixture.js` sitt `close()` har samme regel eksplisitt
 *    dokumentert. Testen teller likevel opp hvor mange slike par som finnes,
 *    så artefakten er synlig (baseline: 500 i `planeBasis.u.y`).
 *
 * 4. RAPPORTERING ER PER FELT. Hvert felt får sin egen `test(...)`. Feiler ett
 *    felt, sier resultatet nøyaktig hvilket felt, hvilken case, hvilken
 *    lekkasjebane inne i et nestet objekt, forventet, faktisk og avvik.
 *
 * ── DEKNING ───────────────────────────────────────────────────────────────
 * `solveFlight` dekker alle 81 flight-felt. `deriveImpact` dekker 16 av
 * studios 20 for jern og 15 for driver; de fire/fem som mangler er
 * dokumentert i `src/deriveImpact.js` og pinnet som eksplisitte
 * utelatelsestester nederst. En utelatelse som stille blir til et felt igjen
 * skal feile her.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadFlight,
  loadFlightErrors,
  loadFlightMeta,
  loadStudio,
  loadStudioMeta,
  report,
} from './_fixture.js';

import { solveFlight } from '../src/solveFlight.js';
import { deriveImpact } from '../src/deriveImpact.js';

/* ─────────────────────────────────────────────────────────────────────────
 * Toleransekontrakten
 * ───────────────────────────────────────────────────────────────────────── */

/** Relativ toleranse for alt nedstrøms RK4. */
const RK4_RELATIVE = 1e-9;

/** Absolutt gulv, for verdier så små at relativ toleranse er meningsløs. */
const RK4_ABSOLUTE_FLOOR = 1e-12;

/**
 * Bladbaner som er nedstrøms RK4-integratoren. Alt annet er bit-eksakt.
 *
 * Listen er utledet av PROVENANS, ikke av hvilke felt som tilfeldigvis feilet:
 * dette er nøyaktig de feltene som leser terminalposisjonen, flytiden eller de
 * observerte aero-intervallene fra `integrateFlight`. `curve`, `offline` og
 * `curveCarryProjectionScale` arver støyen fordi de er avledet av dem.
 */
const rk4DerivedPaths = Object.freeze([
  'curve',
  'curveFromLaunchLineM',
  'rawCurveFromLaunchLineM',
  'curveFlightCarryYd',
  'curveFlightTimeSeconds',
  'curveCarryProjectionScale',
  'offline',
  'aerodynamicDiagnostics.reynoldsRangeObserved',
  'aerodynamicDiagnostics.spinParameterRangeObserved',
  'aeroModel.carryProjectionScale',
]);

/** Toppnivåfeltene som inneholder minst én RK4-avledet blad-verdi. */
const rk4DerivedFields = Object.freeze([
  'curve',
  'curveFromLaunchLineM',
  'rawCurveFromLaunchLineM',
  'curveFlightCarryYd',
  'curveFlightTimeSeconds',
  'curveCarryProjectionScale',
  'offline',
  'aerodynamicDiagnostics',
  'aeroModel',
]);

function isRk4Derived(path) {
  return rk4DerivedPaths.some((p) => path === p || path.startsWith(`${p}[`));
}

/**
 * Toleransen for én bladverdi.
 *
 * @param {string} path bladbanen, f.eks. `aeroModel.carryProjectionScale`
 * @param {unknown} expected fixturens verdi
 * @returns {number} absolutt toleranse
 */
function toleranceFor(path, expected) {
  if (typeof expected !== 'number' || !isRk4Derived(path)) return 0;
  return Math.max(RK4_ABSOLUTE_FLOOR, RK4_RELATIVE * Math.abs(expected));
}

/* ─────────────────────────────────────────────────────────────────────────
 * Sammenligning
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Én feltakkumulator. Holder tellere, verste avvik og de første avvikene.
 * Ingen 400 000 objekter i minnet — bare det som skal rapporteres.
 */
function newFieldStats(field) {
  return {
    field,
    cases: 0,
    casesFailed: 0,
    leaves: 0,
    leavesFailed: 0,
    bitExactLeaves: 0,
    signedZeroPairs: 0,
    maxDeviation: 0,
    maxUtilisation: 0,
    worst: null,
    failures: [],
  };
}

/** Registrerer én bladsammenligning i en feltakkumulator. */
function noteLeaf(stats, id, path, expected, actual) {
  stats.leaves += 1;

  const tol = toleranceFor(path, expected);
  let deviation;
  let pass;

  if (typeof expected === 'number' && typeof actual === 'number') {
    if (Number.isNaN(expected) || Number.isNaN(actual)) {
      deviation = Infinity;
      pass = false;
    } else if (expected === actual) {
      // Dekker også `-0 === 0`. Fixturen kan ikke bære fortegnet på null.
      deviation = 0;
      pass = true;
      stats.bitExactLeaves += 1;
      if (!Object.is(expected, actual)) stats.signedZeroPairs += 1;
    } else if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
      deviation = Infinity;
      pass = false;
    } else {
      deviation = Math.abs(actual - expected);
      pass = deviation <= tol;
    }
  } else {
    const same = expected === actual;
    deviation = same ? 0 : Infinity;
    pass = same;
    if (same) stats.bitExactLeaves += 1;
  }

  const utilisation = tol > 0 ? deviation / tol : deviation > 0 ? Infinity : 0;

  if (deviation > stats.maxDeviation || stats.worst === null) {
    stats.maxDeviation = deviation;
    stats.worst = { id, path, expected, actual, tol, deviation };
  }
  if (Number.isFinite(utilisation) && utilisation > stats.maxUtilisation) {
    stats.maxUtilisation = utilisation;
  }

  if (!pass) {
    stats.leavesFailed += 1;
    if (stats.failures.length < 5) {
      stats.failures.push({ id, path, expected, actual, tol, deviation });
    }
  }

  return pass;
}

/**
 * Går rekursivt gjennom en forventet verdi og sammenligner med den faktiske.
 * Nøkkelrekkefølge og arraylengde er del av kontrakten.
 *
 * @returns {boolean} true når HELE undertreet passerte
 */
function walk(stats, id, path, expected, actual) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      return noteLeaf(stats, id, path, `array(${expected.length})`,
        Array.isArray(actual) ? `array(${actual.length})` : String(actual));
    }
    let ok = true;
    for (let i = 0; i < expected.length; i += 1) {
      ok = walk(stats, id, `${path}[${i}]`, expected[i], actual[i]) && ok;
    }
    return ok;
  }

  if (expected !== null && typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) {
      return noteLeaf(stats, id, path, 'object', String(actual));
    }
    const expectedKeys = Object.keys(expected).join('|');
    const actualKeys = Object.keys(actual).join('|');
    if (expectedKeys !== actualKeys) {
      return noteLeaf(stats, id, `${path}<keys>`, expectedKeys, actualKeys);
    }
    let ok = true;
    for (const key of Object.keys(expected)) {
      ok = walk(stats, id, `${path}.${key}`, expected[key], actual[key]) && ok;
    }
    return ok;
  }

  return noteLeaf(stats, id, path, expected, actual);
}

/** Ett kort, lesbart sammendrag per felt. */
function fieldSummary(stats) {
  const head =
    `${stats.field}: ${stats.cases - stats.casesFailed}/${stats.cases} caser, ` +
    `${stats.leaves - stats.leavesFailed}/${stats.leaves} blader`;
  const exact = `, bit-eksakt ${stats.bitExactLeaves}/${stats.leaves}`;
  const dev = `, maxAvvik ${stats.maxDeviation}`;
  const util =
    stats.maxUtilisation > 0
      ? `, toleransebruk ${(stats.maxUtilisation * 100).toPrecision(3)} %`
      : '';
  const zero =
    stats.signedZeroPairs > 0 ? `, ±0-par ${stats.signedZeroPairs}` : '';
  const worst = stats.worst ? ` (verst ${stats.worst.id} @ ${stats.worst.path})` : '';
  const fails =
    stats.failures.length > 0
      ? `\n    ${stats.failures
          .map(
            (f) =>
              `${f.id} @ ${f.path}: expected ${JSON.stringify(f.expected)}, ` +
              `actual ${JSON.stringify(f.actual)}, avvik ${f.deviation}, tol ${f.tol}`,
          )
          .join('\n    ')}`
      : '';

  return `${head}${exact}${dev}${util}${zero}${worst}${fails}`;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Kjøring — én gang per fixtur, delt av alle feltene
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Kjører en solver over hele en fixtur og samler statistikk per felt.
 *
 * @param {ReadonlyArray<object>} cases
 * @param {(input: object) => object} solve
 * @param {(caseOut: object) => string[]} fieldsOf hvilke felt som sammenlignes
 * @returns {{stats: Map<string, object>, thrown: Array<object>,
 *            results: Array<{id: string, actual: object}>}}
 */
function runAll(cases, solve, fieldsOf) {
  const stats = new Map();
  const thrown = [];
  const keyOrder = [];

  for (const c of cases) {
    let actual;
    try {
      actual = solve(c.in);
    } catch (error) {
      thrown.push({ id: c.id, error });
      continue;
    }

    keyOrder.push({ id: c.id, keys: Object.keys(actual) });

    for (const field of fieldsOf(c.out)) {
      let s = stats.get(field);
      if (s === undefined) {
        s = newFieldStats(field);
        stats.set(field, s);
      }
      s.cases += 1;
      const ok = walk(s, c.id, field, c.out[field], actual[field]);
      if (!ok) s.casesFailed += 1;
    }
  }

  return { stats, thrown, keyOrder };
}

/* ═════════════════════════════════════════════════════════════════════════
 * FLIGHT
 * ═════════════════════════════════════════════════════════════════════════ */

describe('solveFlight mot hele flight-golden.json', () => {
  const flightCases = loadFlight();
  const flightMeta = loadFlightMeta();
  const flightFields = flightMeta.returnedFields;

  const run = runAll(flightCases, (input) => solveFlight(input), () => flightFields);

  test('alle 5028 løste caser løses uten å kaste', () => {
    // `_meta.counts.total` er 5029 og teller RK4-timeouten som `loadFlight()`
    // filtrerer bort. Den har `error`, ikke `out`, og testes for seg.
    assert.equal(flightCases.length, 5028);
    assert.equal(flightCases.length + loadFlightErrors().length, flightMeta.counts.total);
    assert.deepEqual(
      run.thrown.map((t) => `${t.id}: ${t.error.message}`),
      [],
      'solveFlight kastet på caser fixturen har `out` for',
    );
  });

  test('returnerer nøyaktig _meta.returnedFields, i fixturens rekkefølge', () => {
    const expected = flightFields.join('|');
    const wrong = run.keyOrder.filter((k) => k.keys.join('|') !== expected);
    assert.equal(
      wrong.length,
      0,
      wrong.length === 0
        ? ''
        : `${wrong.length} caser med feil nøkkelrekkefølge, f.eks. ${wrong[0].id}: ` +
          `${wrong[0].keys.join('|')}`,
    );
    assert.equal(flightFields.length, 81);
  });

  describe('per felt', () => {
    for (const field of flightFields) {
      test(field, (t) => {
        const stats = run.stats.get(field);
        assert.ok(stats, `feltet ${field} ble aldri sammenlignet`);
        t.diagnostic(fieldSummary(stats));
        assert.equal(stats.leavesFailed, 0, fieldSummary(stats));
      });
    }
  });

  test('samlet: 81/81 felt', (t) => {
    // Én oppføring per FELT: `expected` er «null feilende blader».
    const entries = flightFields.map((field) => {
      const s = run.stats.get(field);
      return { id: s.worst?.id ?? null, field, expected: 0, actual: s.leavesFailed };
    });
    const r = report('flight/fields', entries, { maxFailures: 81 });
    t.diagnostic(r.summary);
    assert.ok(r.ok, `${r.summary}\n${r.failures.map((f) => f.field).join(', ')}`);
  });

  test('72 felt er bit-eksakte; de 9 RK4-avledede holder 1e-9 relativt', (t) => {
    const notExact = [];
    for (const field of flightFields) {
      const s = run.stats.get(field);
      if (s.bitExactLeaves !== s.leaves) notExact.push(field);
    }
    t.diagnostic(`ikke bit-eksakte felt (${notExact.length}): ${notExact.join(', ')}`);

    // Hvert felt som ikke er bit-eksakt MÅ være et av de ni RK4-avledede.
    const unexpected = notExact.filter((f) => !rk4DerivedFields.includes(f));
    assert.deepEqual(
      unexpected,
      [],
      'felt som ikke er nedstrøms RK4 har mistet bit-eksaktheten',
    );

    // Og toleransen skal ikke være i nærheten av å bli spist opp.
    const worstUtilisation = Math.max(
      ...flightFields.map((f) => run.stats.get(f).maxUtilisation),
    );
    t.diagnostic(`maks toleransebruk: ${(worstUtilisation * 100).toPrecision(4)} %`);
    assert.ok(
      worstUtilisation < 1,
      `toleransen er brukt opp: ${worstUtilisation}`,
    );
  });

  test('ingen ikke-endelige tall i noe returobjekt', () => {
    const bad = [];
    for (const c of flightCases) {
      const out = solveFlight(c.in);
      const scan = (path, value) => {
        if (typeof value === 'number') {
          if (!Number.isFinite(value)) bad.push(`${c.id} @ ${path} = ${value}`);
          return;
        }
        if (Array.isArray(value)) {
          value.forEach((v, i) => scan(`${path}[${i}]`, v));
          return;
        }
        if (value !== null && typeof value === 'object') {
          for (const k of Object.keys(value)) scan(`${path}.${k}`, value[k]);
        }
      };
      for (const f of flightFields) scan(f, out[f]);
      if (bad.length > 5) break;
    }
    assert.deepEqual(bad, []);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * FLIGHT — kastende case og inputkontrakt (spec §3)
 * ───────────────────────────────────────────────────────────────────────── */

describe('solveFlight — kastende case og inputkontrakt', () => {
  test('RK4-timeouten kaster med fixturens ordrette melding', () => {
    const errors = loadFlightErrors();
    assert.equal(errors.length, 1);

    for (const c of errors) {
      assert.throws(
        () => solveFlight(c.in),
        (error) => {
          assert.equal(error.name, c.error.name, c.id);
          assert.equal(error.message, c.error.message, c.id);
          return true;
        },
        `${c.id} skulle kastet`,
      );
    }
  });

  test('ikke-endelige tall kaster TypeError (ingen koersjon)', () => {
    const base = { clubSpeed: 90, faceAngle: 1, clubPath: 0, attackAngle: -2, dynamicLoft: 24 };
    for (const field of ['clubSpeed', 'faceAngle', 'clubPath', 'attackAngle', 'dynamicLoft']) {
      for (const value of [NaN, Infinity, -Infinity, undefined, null, '90', '', {}, []]) {
        assert.throws(
          () => solveFlight({ ...base, [field]: value }),
          TypeError,
          `${field} = ${String(value)} skulle kastet TypeError`,
        );
      }
    }
    assert.throws(() => solveFlight(null), TypeError);
    assert.throws(() => solveFlight(undefined), TypeError);
  });

  test('negativ clubSpeed kaster RangeError; 0 er lovlig', () => {
    const base = { clubSpeed: 90, faceAngle: 1, clubPath: 0, attackAngle: -2, dynamicLoft: 24 };
    assert.throws(() => solveFlight({ ...base, clubSpeed: -1 }), RangeError);
    assert.throws(() => solveFlight({ ...base, clubSpeed: -1e-300 }), RangeError);
    assert.doesNotThrow(() => solveFlight({ ...base, clubSpeed: 0 }));
  });

  test('de fem inputene klampes ikke (declaredInputBounds er UI-grenser)', () => {
    const wild = { clubSpeed: 400, faceAngle: 80, clubPath: -70, attackAngle: 40, dynamicLoft: 75 };
    const out = solveFlight(wild);
    assert.equal(out.clubSpeed, 400);
    assert.equal(out.faceAngle, 80);
    assert.equal(out.clubPath, -70);
    assert.equal(out.attackAngle, 40);
    assert.equal(out.dynamicLoft, 75);
  });

  test('determinisme: samme input gir bit-identisk output', () => {
    const shot = { clubSpeed: 104, faceAngle: -1.5, clubPath: 2.5, attackAngle: -3, dynamicLoft: 17 };
    assert.equal(JSON.stringify(solveFlight(shot)), JSON.stringify(solveFlight(shot)));
  });
});

/* ═════════════════════════════════════════════════════════════════════════
 * STUDIO
 * ═════════════════════════════════════════════════════════════════════════ */

/**
 * Feltene `deriveImpact` produserer, i fixturens rekkefølge.
 * `strikeBand` finnes kun for jern — se `src/deriveImpact.js`.
 */
const studioProducedFields = Object.freeze([
  'attackAngle',
  'clubPath',
  'lowPointX',
  'lowPointZ',
  'effectiveLowPointX',
  'lowPointWorld',
  'planeBasis',
  'thetaAtImpact',
  'impactPoint',
  'contactHeight',
  'groundCrossingTheta0',
  'groundEntry',
  'groundExit',
  'strikeBand',
  'faceCentreOffsetMm',
  'clubBallContact',
]);

/** Fixturefelt ingen modul eier ennå. Utelatelsen er pinnet, ikke stilltiende. */
const studioOmittedFields = Object.freeze([
  'shaftPivot',
  'tangentAtImpact',
  'planePolygon',
  'strikeQuality',
]);

/** Presentasjonsnøkler som ALDRI skal inn i et returobjekt (FUNN F6). */
const presentationKeys = Object.freeze(['color', 'textColor', 'tip', 'pct', 'barPos']);

describe('deriveImpact mot hele studio-golden.json', () => {
  const studioCases = loadStudio();
  const studioMeta = loadStudioMeta();

  // `strikeBand` holdes utenfor hovedkjøringen: den finnes ikke for driver, og
  // en akkumulator full av avvik ingen ser på ville vært verre enn ingen.
  const alwaysProduced = studioProducedFields.filter((f) => f !== 'strikeBand');

  const run = runAll(studioCases, (input) => deriveImpact(input), () => alwaysProduced);

  // `strikeBand` sammenlignes bare for jern.
  const ironRun = runAll(
    studioCases.filter((c) => c.in.clubMode === 'iron'),
    (input) => deriveImpact(input),
    () => ['strikeBand'],
  );

  test('alle 2500 caser løses uten å kaste', () => {
    assert.equal(studioCases.length, studioMeta.counts.total);
    assert.equal(studioCases.length, 2500);
    assert.deepEqual(
      run.thrown.map((t) => `${t.id}: ${t.error.message}`),
      [],
    );
  });

  test('nøkkelrekkefølgen følger fixturens, uten hull', () => {
    const ironExpected = studioProducedFields.join('|');
    const driverExpected = studioProducedFields
      .filter((f) => f !== 'strikeBand')
      .join('|');

    for (const c of studioCases) {
      const keys = Object.keys(deriveImpact(c.in)).join('|');
      assert.equal(
        keys,
        c.in.clubMode === 'iron' ? ironExpected : driverExpected,
        `${c.id} (${c.in.clubMode})`,
      );
    }
  });

  describe('per felt', () => {
    for (const field of studioProducedFields) {
      if (field === 'strikeBand') continue;
      test(field, (t) => {
        const stats = run.stats.get(field);
        assert.ok(stats, `feltet ${field} ble aldri sammenlignet`);
        t.diagnostic(fieldSummary(stats));
        assert.equal(stats.leavesFailed, 0, fieldSummary(stats));
      });
    }

    test('strikeBand (kun jern; driver er ikke portert — FUNN F1/F7)', (t) => {
      const stats = ironRun.stats.get('strikeBand');
      assert.equal(stats.cases, 1250);
      t.diagnostic(fieldSummary(stats));
      assert.equal(stats.leavesFailed, 0, fieldSummary(stats));
    });
  });

  test('samlet: 16/16 produserte felt (15 for driver)', (t) => {
    const entries = studioProducedFields.map((field) => {
      const s = field === 'strikeBand' ? ironRun.stats.get(field) : run.stats.get(field);
      return { id: s.worst?.id ?? null, field, expected: 0, actual: s.leavesFailed };
    });
    const r = report('studio/fields', entries, { maxFailures: 20 });
    t.diagnostic(r.summary);
    assert.ok(r.ok, `${r.summary}\n${r.failures.map((f) => f.field).join(', ')}`);
  });

  test('alt studio er bit-eksakt (toleranse 0)', (t) => {
    let signedZeroPairs = 0;
    for (const field of studioProducedFields) {
      const s = field === 'strikeBand' ? ironRun.stats.get(field) : run.stats.get(field);
      signedZeroPairs += s.signedZeroPairs;
      assert.equal(s.maxDeviation, 0, `${field}: maxAvvik ${s.maxDeviation}`);
    }
    t.diagnostic(
      `±0-par (fixturens JSON kan ikke bære fortegnet på null): ${signedZeroPairs}`,
    );
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * STUDIO — utelatelser og inputkontrakt
 * ───────────────────────────────────────────────────────────────────────── */

describe('deriveImpact — utelatelser og inputkontrakt', () => {
  const studioCases = loadStudio();
  const sample = studioCases.filter((_, i) => i % 97 === 0);

  test('de fire udekkede fixturefeltene er BEVISST utelatt', () => {
    const out = deriveImpact({
      swingPlane: 55,
      swingDirection: 0,
      ballPositionCm: 0,
      arcHeightCm: 0,
      clubMode: 'iron',
    });
    for (const field of studioOmittedFields) {
      assert.equal(
        Object.hasOwn(out, field),
        false,
        `${field} skal ikke returneres — ingen modul eier den (se src/deriveImpact.js)`,
      );
    }
    // …og fixturen har dem, så dette ER et hull, ikke en misforståelse.
    for (const field of studioOmittedFields) {
      assert.equal(Object.hasOwn(studioCases[0].out, field), true);
    }
  });

  test('strikeBand finnes for jern og mangler for driver', () => {
    for (const c of sample) {
      const out = deriveImpact(c.in);
      assert.equal(
        Object.hasOwn(out, 'strikeBand'),
        c.in.clubMode === 'iron',
        `${c.id} (${c.in.clubMode})`,
      );
    }
  });

  test('ingen farge, UI-streng eller presentasjonsdata lekker ut (FUNN F6)', () => {
    const found = [];
    const scan = (path, value) => {
      if (value === null || typeof value !== 'object') return;
      for (const key of Object.keys(value)) {
        if (presentationKeys.includes(key)) found.push(`${path}.${key}`);
        scan(`${path}.${key}`, value[key]);
      }
    };
    for (const c of sample) scan(c.id, deriveImpact(c.in));
    assert.deepEqual(found, []);

    // Fixturen HAR dem, i strikeQuality. Bekreftelse på at de er luket bevisst.
    for (const key of presentationKeys) {
      assert.equal(Object.hasOwn(studioCases[0].out.strikeQuality, key), true);
    }
  });

  test('ikke-endelige tall og ukjent clubMode kaster TypeError', () => {
    const base = {
      swingPlane: 55,
      swingDirection: 0,
      ballPositionCm: 0,
      arcHeightCm: 0,
      clubMode: 'iron',
    };
    for (const field of ['swingPlane', 'swingDirection', 'ballPositionCm', 'arcHeightCm']) {
      for (const value of [NaN, Infinity, -Infinity, undefined, null, '0', {}]) {
        assert.throws(
          () => deriveImpact({ ...base, [field]: value }),
          TypeError,
          `${field} = ${String(value)}`,
        );
      }
    }
    for (const clubMode of [undefined, null, 'Iron', 'wedge', 7]) {
      assert.throws(() => deriveImpact({ ...base, clubMode }), TypeError);
    }
    assert.throws(() => deriveImpact(null), TypeError);
  });

  test('determinisme: samme input gir bit-identisk output', () => {
    const swing = {
      swingPlane: 61,
      swingDirection: -1,
      ballPositionCm: 3,
      arcHeightCm: -1,
      clubMode: 'driver',
    };
    assert.equal(
      JSON.stringify(deriveImpact(swing)),
      JSON.stringify(deriveImpact(swing)),
    );
  });
});
