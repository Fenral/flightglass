/**
 * §5.7 + ENGINE-GAPS §1 — RK4-integrasjonen mot golden-fixturen.
 *
 * Fixturen er fasit. Modulen kjøres over ALLE 5028 løste flight-caser, pluss
 * den ene casen der den ekte motoren kastet.
 *
 * ── TOLERANSE: hva som faktisk trengtes ────────────────────────────────
 *
 * Oppgaven ba om 1e-9 relativt, med 1e-6 absolutt som reserve. Fasit etter
 * å ha kjørt alle 5028 caser:
 *
 *   felt                      bit-eksakt   maks |avvik|   maks relativt
 *   ───────────────────────── ──────────── ────────────── ──────────────
 *   reynoldsRangeObserved[1]  5028/5028    0              0
 *   curveFlightCarryYd        4179/5028    1.99e-13       9.22e-16
 *   curveFlightTimeSeconds    4085/5028    3.55e-15       4.09e-16
 *   rawCurveFromLaunchLineM   3463/5028    5.68e-14       (se under)
 *   reynoldsRangeObserved[0]  4433/5028    4.37e-11       7.11e-16
 *   spinParameterObserved[0]  4215/5028    1.11e-16       2.58e-15
 *   spinParameterObserved[1]  3616/5028    8.88e-16       6.59e-16
 *   extrapolated              5028/5028    —              eksakt boolsk
 *
 * 1e-9 relativt er altså seks–sju størrelsesordener slakkere enn nødvendig.
 * Den relative formen har ETT hull: 275 caser har `rawCurveFromLaunchLineM`
 * nøyaktig 0, og da er `1e-9 × |forventet|` også 0. I 273 av dem treffer
 * modulen 0 bit-eksakt. I 2 av dem — `grid.full-width.2525` og `.3125`,
 * begge `spinAxis = 0` med `startDirection = ∓15°` — blir resultatet
 * ±7.1e-15 m. Sju femtometer. Kilden får eksakt 0 fordi `x·cos(a)` og
 * `y·sin(a)` der tilfeldigvis lander på samme double; hos oss skiller de
 * seg med 1 ULP. Testene bruker derfor
 *
 *   toleranse = max(1e-9 × |forventet|, 1e-12 absolutt)
 *
 * der det absolutte gulvet KUN binder når forventet er 0.
 *
 * I tillegg til oppgavens toleranse asserteres et mye strammere tak
 * (`TIGHT_RELATIVE`, `TIGHT_ABSOLUTE`) som regresjonsvakt. Slakk det ikke
 * opp for å få en endring til å passere — et avvik der betyr at noen har
 * endret en rekkefølge i `rk4Integrator.js`, og rekkefølgene ER baseline.
 *
 * ── Ytelse ─────────────────────────────────────────────────────────────
 *
 * 5028 baner × ~500 steg × 4 derivatkall ≈ 10 millioner evalueringer, ca.
 * 1,5 s totalt. Resultatene regnes ut ÉN gang og deles mellom testene under.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, loadFlightErrors, report } from './_fixture.js';
import {
  launchVelocity,
  impactSpin,
  spinDirection,
  initialState,
  aeroSample,
  derivative,
  rk4Advance,
  liftCoefficient,
  dragBridge,
  dragCoefficient,
  isExtrapolated,
  aerodynamicDiagnostics,
  projectOntoLaunchLine,
  integrateFlight,
  solveCurveFlight,
  groundNotReachedMessage,
} from '../src/rk4Integrator.js';

/* ── Toleranser ─────────────────────────────────────────────────────────── */

/** Oppgavens toleranse. */
const RELATIVE_TOLERANCE = 1e-9;

/** Gulv som kun binder når forventet verdi er nøyaktig 0. Se filnotatet. */
const ABSOLUTE_FLOOR = 1e-12;

/** Reserven oppgaven tillot for grader og rpm. Ikke i bruk — dokumentert. */
const ABSOLUTE_DEGREE_FALLBACK = 1e-6;

/** Regresjonsvakt: ~40–100× over det som faktisk måles i dag. */
const TIGHT_RELATIVE = 1e-13;

/** Absolutt tak per felt, brukt der forventet verdi kan være 0. */
const TIGHT_ABSOLUTE = {
  curveFlightTimeSeconds: 1e-13,
  curveFlightCarryYd: 1e-11,
  rawCurveFromLaunchLineM: 1e-12,
  reynolds: 1e-9,
  spinParameter: 1e-14,
};

const tol = (expected) =>
  Math.max(RELATIVE_TOLERANCE * Math.abs(expected), ABSOLUTE_FLOOR);

/* ── Én kjøring, delt av alle testene ───────────────────────────────────── */

/** Fixturens `out` bærer nøyaktig de fem inputene ENGINE-GAPS §1 krever. */
function rk4InputFrom(out) {
  return {
    ballSpeed: out.ballSpeed,
    launchAngle: out.launchAngle,
    startDirection: out.startDirection,
    spinAxisUnit: out.spinAxisUnit,
    totalSpinRpm: out.totalSpinRpm,
  };
}

let solvedMemo = null;

/** `[{ case, actual }]` for alle 5028 løste caser. Regnes ut én gang. */
function solvedAll() {
  if (solvedMemo === null) {
    solvedMemo = loadFlight().map((c) => ({
      case: c,
      actual: solveCurveFlight(rk4InputFrom(c.out)),
    }));
  }
  return solvedMemo;
}

/* ── Hovedsammenligning: de tre skalarfeltene ───────────────────────────── */

const SCALAR_FIELDS = [
  'curveFlightTimeSeconds',
  'curveFlightCarryYd',
  'rawCurveFromLaunchLineM',
];

test('RK4 reproduserer curveFlightTimeSeconds i alle 5028 caser', () => {
  const results = solvedAll().map(({ case: c, actual }) => ({
    id: c.id,
    field: 'curveFlightTimeSeconds',
    expected: c.out.curveFlightTimeSeconds,
    actual: actual.curveFlightTimeSeconds,
    tol: tol(c.out.curveFlightTimeSeconds),
  }));

  const r = report('flight/curveFlightTimeSeconds', results);
  assert.equal(r.total, 5028, r.summary);
  assert.ok(r.ok, r.summary + ' :: ' + JSON.stringify(r.failures));
});

test('RK4 reproduserer curveFlightCarryYd i alle 5028 caser', () => {
  const results = solvedAll().map(({ case: c, actual }) => ({
    id: c.id,
    field: 'curveFlightCarryYd',
    expected: c.out.curveFlightCarryYd,
    actual: actual.curveFlightCarryYd,
    tol: tol(c.out.curveFlightCarryYd),
  }));

  const r = report('flight/curveFlightCarryYd', results);
  assert.equal(r.total, 5028, r.summary);
  assert.ok(r.ok, r.summary + ' :: ' + JSON.stringify(r.failures));
});

test('RK4 reproduserer rawCurveFromLaunchLineM i alle 5028 caser', () => {
  const results = solvedAll().map(({ case: c, actual }) => ({
    id: c.id,
    field: 'rawCurveFromLaunchLineM',
    expected: c.out.rawCurveFromLaunchLineM,
    actual: actual.rawCurveFromLaunchLineM,
    tol: tol(c.out.rawCurveFromLaunchLineM),
  }));

  const r = report('flight/rawCurveFromLaunchLineM', results);
  assert.equal(r.total, 5028, r.summary);
  assert.ok(r.ok, r.summary + ' :: ' + JSON.stringify(r.failures));
});

/**
 * Under denne verdien er en forventet verdi ren avrundingsstøy, og et
 * relativt avvik er meningsløst. Fixturen har 438 caser med
 * `rawCurveFromLaunchLineM` mellom 0 og 1.42e-13 m — der er «2 ganger for
 * stor» en forskjell på ett femtometer, ikke en fysikkfeil. Se testen
 * «faceToPath = 0».
 */
const RELATIVE_MEANINGFUL_ABOVE = 1e-6;

test('avviket ligger langt under oppgavens 1e-9 — regresjonsvakt', () => {
  // Målt i dag: 3.55e-15 / 1.99e-13 / 5.68e-14 absolutt.
  // Slakk ikke disse opp. Et brudd her = endret flyttallsrekkefølge.
  const worstAbsolute = { ...Object.fromEntries(SCALAR_FIELDS.map((f) => [f, 0])) };
  const worstRelative = { ...worstAbsolute };
  const where = {};

  for (const { case: c, actual } of solvedAll()) {
    for (const field of SCALAR_FIELDS) {
      const expected = c.out[field];
      const deviation = Math.abs(actual[field] - expected);
      if (deviation > worstAbsolute[field]) {
        worstAbsolute[field] = deviation;
        where[field] = c.id;
      }
      if (Math.abs(expected) > RELATIVE_MEANINGFUL_ABOVE) {
        worstRelative[field] = Math.max(
          worstRelative[field],
          deviation / Math.abs(expected),
        );
      }
    }
  }

  for (const field of SCALAR_FIELDS) {
    assert.ok(
      worstRelative[field] <= TIGHT_RELATIVE,
      `${field}: relativt avvik ${worstRelative[field]} > ${TIGHT_RELATIVE} ` +
        `(oppgavens grense var ${RELATIVE_TOLERANCE}, reserve ` +
        `${ABSOLUTE_DEGREE_FALLBACK} absolutt) ved ${where[field]}`,
    );
    assert.ok(
      worstAbsolute[field] <= TIGHT_ABSOLUTE[field],
      `${field}: absolutt avvik ${worstAbsolute[field]} > ` +
        `${TIGHT_ABSOLUTE[field]} ved ${where[field]}`,
    );
  }
});

/* ── aerodynamicDiagnostics ─────────────────────────────────────────────── */

test('reynoldsRangeObserved reproduseres i alle 5028 caser', () => {
  const results = [];
  for (const { case: c, actual } of solvedAll()) {
    const expected = c.out.aerodynamicDiagnostics.reynoldsRangeObserved;
    const got = actual.aerodynamicDiagnostics.reynoldsRangeObserved;
    results.push({
      id: c.id,
      field: 'reynoldsRangeObserved[0]',
      expected: expected[0],
      actual: got[0],
      tol: tol(expected[0]),
    });
    results.push({
      id: c.id,
      field: 'reynoldsRangeObserved[1]',
      expected: expected[1],
      actual: got[1],
      tol: tol(expected[1]),
    });
  }

  const r = report('flight/reynoldsRangeObserved', results);
  assert.equal(r.total, 5028 * 2, r.summary);
  assert.ok(r.ok, r.summary + ' :: ' + JSON.stringify(r.failures));
  assert.ok(r.maxDeviation <= TIGHT_ABSOLUTE.reynolds, r.summary);
});

test('maksimalt Reynolds er bit-eksakt i alle 5028 caser', () => {
  // Maksimum treffes i starttilstanden (t = 0, k₁) i praktisk talt alle
  // baner: ballen bremser ned gjennom flukten. Den er derfor et rent uttrykk
  // for `speed₀ · 2R / ν` uten akkumulert integrasjonsstøy — og eneste felt
  // i denne modulen som er bit-eksakt overalt. Blir den unøyaktig, er det
  // startbetingelsene i ENGINE-GAPS §1 som er endret, ikke integratoren.
  const results = solvedAll().map(({ case: c, actual }) => ({
    id: c.id,
    field: 'reynoldsRangeObserved[1]',
    expected: c.out.aerodynamicDiagnostics.reynoldsRangeObserved[1],
    actual: actual.aerodynamicDiagnostics.reynoldsRangeObserved[1],
  }));

  const r = report('flight/reynoldsMaxObserved-bitexact', results);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('spinParameterRangeObserved reproduseres i alle 5028 caser', () => {
  const results = [];
  for (const { case: c, actual } of solvedAll()) {
    const expected = c.out.aerodynamicDiagnostics.spinParameterRangeObserved;
    const got = actual.aerodynamicDiagnostics.spinParameterRangeObserved;
    results.push({
      id: c.id,
      field: 'spinParameterRangeObserved[0]',
      expected: expected[0],
      actual: got[0],
      tol: tol(expected[0]),
    });
    results.push({
      id: c.id,
      field: 'spinParameterRangeObserved[1]',
      expected: expected[1],
      actual: got[1],
      tol: tol(expected[1]),
    });
  }

  const r = report('flight/spinParameterRangeObserved', results);
  assert.equal(r.total, 5028 * 2, r.summary);
  assert.ok(r.ok, r.summary + ' :: ' + JSON.stringify(r.failures));
  assert.ok(r.maxDeviation <= TIGHT_ABSOLUTE.spinParameter, r.summary);
});

test('extrapolated er eksakt riktig boolsk verdi i alle 5028 caser', () => {
  const results = solvedAll().map(({ case: c, actual }) => ({
    id: c.id,
    field: 'extrapolated',
    expected: c.out.aerodynamicDiagnostics.extrapolated,
    actual: actual.aerodynamicDiagnostics.extrapolated,
    pass:
      actual.aerodynamicDiagnostics.extrapolated ===
      c.out.aerodynamicDiagnostics.extrapolated,
  }));

  const r = report('flight/extrapolated', results);
  assert.ok(r.ok, r.summary + ' :: ' + JSON.stringify(r.failures));

  // FUNN F2: dette er NORMALtilstanden, ikke unntaket. Testen låser fordelingen
  // slik at ingen senere «rydder» predikatet til noe som nesten aldri fyrer.
  const extrapolated = solvedAll().filter(
    (x) => x.actual.aerodynamicDiagnostics.extrapolated,
  ).length;
  const share = extrapolated / 5028;
  assert.ok(share > 0.85, `extrapolated i ${(share * 100).toFixed(1)} % av casene`);
});

test('extrapolated-predikatet er de fire grensesammenligningene, intet mer', () => {
  // Utledet uavhengig av modulen, fra fixturens EGNE observerte områder.
  // Fanger opp at noen legger til et ledd (fart, launch, carry, clamp) som
  // ENGINE-GAPS ikke har.
  const results = loadFlight().map((c) => {
    const d = c.out.aerodynamicDiagnostics;
    const expected =
      d.reynoldsRangeObserved[0] < d.reynoldsValidity[0] ||
      d.reynoldsRangeObserved[1] > d.reynoldsValidity[1] ||
      d.spinParameterRangeObserved[0] < d.spinParameterValidity[0] ||
      d.spinParameterRangeObserved[1] > d.spinParameterValidity[1];
    const actual = isExtrapolated(
      d.reynoldsRangeObserved,
      d.spinParameterRangeObserved,
    );
    return { id: c.id, field: 'extrapolated', expected, actual, pass: actual === expected };
  });

  const r = report('spec/extrapolated-predicate', results);
  assert.ok(r.ok, r.summary + ' :: ' + JSON.stringify(r.failures));
});

test('diagnostikkens konstante felt er ordrett fixturens', () => {
  const results = [];
  for (const { case: c, actual } of solvedAll()) {
    const expected = c.out.aerodynamicDiagnostics;
    const got = actual.aerodynamicDiagnostics;
    for (const field of ['coefficientSetId', 'validityKnown', 'reverseMagnusPolicy']) {
      results.push({
        id: c.id,
        field,
        expected: expected[field],
        actual: got[field],
        pass: got[field] === expected[field],
      });
    }
    results.push({
      id: c.id,
      field: 'reynoldsValidity',
      expected: JSON.stringify(expected.reynoldsValidity),
      actual: JSON.stringify(got.reynoldsValidity),
      pass:
        JSON.stringify(got.reynoldsValidity) ===
        JSON.stringify(expected.reynoldsValidity),
    });
    results.push({
      id: c.id,
      field: 'spinParameterValidity',
      expected: JSON.stringify(expected.spinParameterValidity),
      actual: JSON.stringify(got.spinParameterValidity),
      pass:
        JSON.stringify(got.spinParameterValidity) ===
        JSON.stringify(expected.spinParameterValidity),
    });
  }

  const r = report('flight/aerodynamicDiagnostics-constants', results);
  assert.equal(r.total, 5028 * 5, r.summary);
  assert.ok(r.ok, r.summary + ' :: ' + JSON.stringify(r.failures));
});

test('aerodynamicDiagnostics har nøyaktig fixturens åtte felt', () => {
  const [{ case: first, actual }] = solvedAll();
  assert.deepEqual(
    Object.keys(actual.aerodynamicDiagnostics),
    Object.keys(first.out.aerodynamicDiagnostics),
    'samme felt i samme rekkefølge som baseline',
  );

  // FUNN F6: ingen farger, ingen UI-strenger, ingen `tip`/`pct`/`barPos`.
  const serialized = JSON.stringify(actual.aerodynamicDiagnostics);
  assert.ok(!/#[0-9A-Fa-f]{6}/.test(serialized), 'ingen hex-farger i returobjektet');
  for (const forbidden of ['color', 'textColor', 'tip', 'pct', 'barPos', 'label']) {
    assert.ok(
      !Object.hasOwn(actual.aerodynamicDiagnostics, forbidden),
      `presentasjonsfeltet ${forbidden} skal ikke finnes`,
    );
  }
});

/* ── Nullkurve: FUNN «ikke et funn — kontrollert og frikjent» ───────────── */

test('rå kurve er null der fixturen sier null', () => {
  // 275 caser har `rawCurveFromLaunchLineM === 0` eksakt. 273 treffer 0
  // bit-eksakt hos oss. De to unntakene er `grid.full-width.2525` og
  // `.3125` — `spinAxis = 0`, `startDirection = ∓15°` — der `x·cos(a)` og
  // `y·sin(a)` skiller seg med 1 ULP og gir ±7.1e-15 m. Sju femtometer.
  // Dette er IKKE en maske som skal legges inn i integratoren; ENGINE-GAPS §6
  // tvinger uansett `curve` til 0 der `faceToPath === 0`, og den linjen eier
  // `curve.js` som en ASSERTION (README, felle 5).
  const zeroCases = solvedAll().filter(
    (x) => x.case.out.rawCurveFromLaunchLineM === 0,
  );
  assert.equal(zeroCases.length, 275, 'fixturen har 275 caser med rå kurve = 0');

  let exact = 0;
  let worst = 0;
  for (const { actual } of zeroCases) {
    if (actual.rawCurveFromLaunchLineM === 0) exact += 1;
    worst = Math.max(worst, Math.abs(actual.rawCurveFromLaunchLineM));
  }

  assert.equal(exact, 273, 'bit-eksakt null i 273 av 275');
  assert.ok(worst <= 1e-14, `verste ikke-null er ${worst} m`);
});

test('faceToPath = 0: FUNNs «rå kurve er også 0» stemmer ikke bokstavelig', () => {
  // FUNN, avsnittet «Ikke et funn — kontrollert og frikjent», sier:
  //   «Testet: 713 caser har faceToPath = 0. I ALLE er rå RK4-kurve også 0.»
  //
  // Det er ikke sant i fixturen. Bare 275 av de 713 har
  // `rawCurveFromLaunchLineM` nøyaktig 0. De øvrige 438 har en verdi mellom
  // 0 og 1.42e-13 m — avrundingsstøy fra selve integrasjonen, ikke kurve.
  // Konklusjonen i FUNN holder likevel: `curve` er 0 i alle 713, og
  // ENGINE-GAPS §6 tvinger den til 0 uansett. Ingenting maskeres.
  //
  // Testen låser det som FAKTISK står i fixturen, ikke det FUNN påstår.
  const flat = solvedAll().filter((x) => x.case.out.faceToPath === 0);
  assert.equal(flat.length, 713, 'FUNN teller 713 caser med faceToPath = 0');

  let fixtureExactZero = 0;
  let fixtureWorst = 0;
  let ourWorst = 0;

  for (const { case: c, actual } of flat) {
    assert.equal(c.out.spinAxis, 0, `${c.id}: fixturens spinAxis`);
    assert.equal(c.out.curve, 0, `${c.id}: fixturens curve tvinges til 0`);

    if (c.out.rawCurveFromLaunchLineM === 0) fixtureExactZero += 1;
    fixtureWorst = Math.max(fixtureWorst, Math.abs(c.out.rawCurveFromLaunchLineM));
    ourWorst = Math.max(ourWorst, Math.abs(actual.rawCurveFromLaunchLineM));
  }

  assert.equal(fixtureExactZero, 275, 'fixturen har 275 eksakte nuller, ikke 713');
  assert.ok(fixtureWorst <= 1e-12, `fixturens verste rå kurve er ${fixtureWorst} m`);
  assert.ok(ourWorst <= 1e-12, `vår verste rå kurve er ${ourWorst} m`);
});

/* ── Casen den ekte motoren kastet på ───────────────────────────────────── */

test('RK4 kaster ordrett riktig melding når bakken ikke nås på 30 s', () => {
  const [timeout] = loadFlightErrors();
  assert.equal(timeout.id, 'edge.rk4-no-ground-within-30-seconds');
  assert.equal(timeout.error.name, 'Error');
  assert.equal(timeout.error.message, groundNotReachedMessage);
  assert.equal(timeout.out, undefined, 'fixturen har ingen fasit for denne');

  // Fixturen bærer bare de fem RÅ inputene for feilcasen, ikke `out`. De
  // avledede RK4-inputene må derfor komme fra de andre modulene. Vi
  // reproduserer betingelsen direkte i stedet: en ballfart som er absurd nok
  // til at det faste 0.01 s-steget ikke kan integreres stabilt.
  assert.equal(timeout.in.clubSpeed, 18000, 'utenfor deklarert inputområde');

  assert.throws(
    () =>
      solveCurveFlight({
        ballSpeed: 18000 * 1.52,
        launchAngle: 32.734686329895176,
        startDirection: 1.56,
        spinAxisUnit: [0.9, 0.1, 0.42426406871192845],
        totalSpinRpm: 9000,
      }),
    (error) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, groundNotReachedMessage);
      return true;
    },
  );
});

test('maks flukttid i baseline er langt under 30 s-taket', () => {
  // Taket er ikke en aktiv grense i noe reelt slag. Fixturens lengste bane er
  // ~11 s. Det er verdt å vite: `maxFlightTime` beskytter mot divergens, ikke
  // mot lange baner.
  const longest = Math.max(
    ...loadFlight().map((c) => c.out.curveFlightTimeSeconds),
  );
  assert.ok(longest < 12, `lengste bane er ${longest} s`);
  assert.ok(longest > 10, `lengste bane er ${longest} s`);
});

/* ── ENGINE-GAPS §1: startbetingelsene ──────────────────────────────────── */

test('v₀ følger ENGINE-GAPS §1 skrevet ut med literaler', () => {
  // ⚠ ULP-FELLEN, README «grader → radianer»: flight-motoren konverterer som
  // `deg * (Math.PI / 180)`. Skriver du `(deg * Math.PI) / 180` her — Studios
  // konvensjon — feiler 2618 av 15084 komponenter med opptil 1.4e-14. Det er
  // testen som har feil da, ikke modulen.
  const results = [];
  for (const c of loadFlight()) {
    const V = c.out.ballSpeed * 0.44704;
    const e = c.out.launchAngle * (Math.PI / 180);
    const a = c.out.startDirection * (Math.PI / 180);
    const expected = [
      V * Math.cos(e) * Math.sin(a),
      V * Math.cos(e) * Math.cos(a),
      V * Math.sin(e),
    ];
    const actual = launchVelocity(rk4InputFrom(c.out));
    for (let i = 0; i < 3; i += 1) {
      results.push({ id: c.id, field: `v0[${i}]`, expected: expected[i], actual: actual[i] });
    }
  }

  const r = report('gaps/§1-v0', results);
  assert.equal(r.total, 5028 * 3, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('ω₀ er spinAxisUnit skalert med totalSpinRpm · 2π/60', () => {
  // Fixturen bærer den ferdige vektoren som `spinVectorRadPerSec`. Den er
  // fasit, og den er bit-eksakt reproduserbar.
  const results = [];
  for (const c of loadFlight()) {
    const actual = impactSpin(rk4InputFrom(c.out));
    for (let i = 0; i < 3; i += 1) {
      results.push({
        id: c.id,
        field: `spinVectorRadPerSec[${i}]`,
        expected: c.out.spinVectorRadPerSec[i],
        actual: actual[i],
      });
    }
  }

  const r = report('gaps/§1-omega0', results);
  assert.equal(r.total, 5028 * 3, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('starttilstanden er [0, 0, 1e-6, v₀, |ω₀|] — ikke z = 0', () => {
  const input = {
    ballSpeed: 125.864477425604,
    launchAngle: 12.253017767130947,
    startDirection: 0,
    spinAxisUnit: [1, 0, 0],
    totalSpinRpm: 4834.536848226549,
  };
  const velocity = launchVelocity(input);
  const omega = impactSpin(input);
  const state = initialState(velocity, Math.hypot(omega[0], omega[1], omega[2]));

  assert.equal(state.length, 7, 'sju tilstandsvariabler, ikke ni');
  assert.equal(state[0], 0);
  assert.equal(state[1], 0);
  assert.equal(state[2], 1e-6, 'z₀ = 1e-6, felle 7 i README');
  assert.notEqual(state[2], 0);
  assert.deepEqual(state.slice(3, 6), velocity);
  assert.equal(state[6], Math.hypot(omega[0], omega[1], omega[2]));
});

test('z₀ = 1e-6 er det som gir edge.dynamic-loft-zero sin flukttid', () => {
  // Beviset for at starthøyden ikke er 0: med z₀ = 0 ville `next.z <= 0` slå
  // til på steg 1 med interpolasjonsbrøk 0 og gi flukttid nøyaktig 0.
  // Fixturen sier 2.0414…e-5 s, som er `0.01 × 1e-6 / (1e-6 − z₁)`.
  const flat = loadFlight().find((c) => c.id === 'spec-9.no-flight');
  assert.ok(flat, 'spec §9 «No flight» finnes i fixturen');
  assert.equal(flat.out.launchAngle, 0, 'flatt slag');
  assert.ok(
    flat.out.curveFlightTimeSeconds > 0 && flat.out.curveFlightTimeSeconds < 1e-4,
    `flukttid ${flat.out.curveFlightTimeSeconds}`,
  );

  const actual = solveCurveFlight(rk4InputFrom(flat.out));
  assert.ok(
    Math.abs(actual.curveFlightTimeSeconds - flat.out.curveFlightTimeSeconds) <=
      tol(flat.out.curveFlightTimeSeconds),
    `${actual.curveFlightTimeSeconds} vs ${flat.out.curveFlightTimeSeconds}`,
  );
});

test('spinnretningen er unit(ω₀) og holdes fast; bare magnituden forfaller', () => {
  const input = {
    ballSpeed: 130,
    launchAngle: 14,
    startDirection: 1.5,
    spinAxisUnit: [0.996066569800816, 0.0046373876183462065, -0.08848662701964236],
    totalSpinRpm: 3526.207052838138,
  };
  const flight = integrateFlight(input);
  const omega0 = impactSpin(input);

  assert.deepEqual(flight.spinDirection, spinDirection(omega0));
  assert.ok(
    Math.abs(Math.hypot(...flight.spinDirection) - 1) < 1e-15,
    'enhetsvektor',
  );

  // Derivatet rører aldri retningen: bare state[6] har et ledd.
  const state = initialState(launchVelocity(input), Math.hypot(...omega0));
  const d = derivative(state, flight.spinDirection);
  assert.equal(d[6], -0.04 * state[6], 'd|ω|/dt = −0.04·|ω|');

  // …og magnituden er strengt avtagende gjennom flukten.
  assert.ok(flight.finalSpinRadPerSec < Math.hypot(...omega0));
  assert.ok(flight.finalSpinRadPerSec > 0);
});

test('null spinn gir retning [0, 0, 0], ikke NaN', () => {
  assert.deepEqual(spinDirection([0, 0, 0]), [0, 0, 0]);
  const zeroSpin = solveCurveFlight({
    ballSpeed: 136.8,
    launchAngle: 0,
    startDirection: 0,
    spinAxisUnit: [1, 0, 0],
    totalSpinRpm: 0,
  });
  assert.ok(Number.isFinite(zeroSpin.curveFlightTimeSeconds));
  assert.ok(Number.isFinite(zeroSpin.curveFlightCarryYd));
});

test('ballSpeed 0: ingen aero-observasjon i k₁, men k₂…k₄ observeres', () => {
  // Felle 4. `edge.club-speed-zero` beviser at null-fart-grenen IKKE
  // registrerer (0, 0): det observerte Reynolds-minimum er 143.30…, verdien
  // fra k₃-trinnet etter at tyngdekraften har gitt ballen fart.
  const zeroCase = loadFlight().find((c) => c.id === 'edge.club-speed-zero');
  assert.ok(zeroCase, 'edge.club-speed-zero finnes');
  assert.equal(zeroCase.out.ballSpeed, 0);

  const observed = zeroCase.out.aerodynamicDiagnostics.reynoldsRangeObserved;
  assert.ok(observed[0] > 100, `minimum er ${observed[0]}, ikke 0`);

  const actual = solveCurveFlight(rk4InputFrom(zeroCase.out));
  const got = actual.aerodynamicDiagnostics.reynoldsRangeObserved;
  assert.equal(got[0], observed[0], 'bit-eksakt minimum');
  assert.equal(got[1], observed[1], 'bit-eksakt maksimum');

  // Selve grenen, isolert.
  const still = aeroSample([0, 0, 1e-6, 0, 0, 0, 500], [1, 0, 0]);
  assert.equal(still.observed, false, 'ingen observasjon ved speed = 0');
  assert.deepEqual(still.acceleration, [0, 0, -9.80665], 'ren tyngdekraft');
});

/* ── Spec §5.7: koeffisientbroen, ledd for ledd ─────────────────────────── */

test('Cl, CdBridge og Cd matcher spec §5.7 skrevet ut med literaler', () => {
  const samples = [
    [70000, 0.08],
    [85000, 0.15],
    [120000, 0.2],
    [164444.49842620228, 0.191967000229151],
    [45377.895922578755, 0.4],
    [210000, 0.02],
  ];

  for (const [re, s] of samples) {
    const expectedCl = 0.4072 * Math.pow(Math.max(0, s), 0.4);
    const expectedBridge =
      0.2016141765 +
      0.0463816544 / (1 + Math.exp((re - 85000) / 9000)) +
      (0.06 * s) / (0.15 + s);

    assert.equal(liftCoefficient(s), expectedCl, `Cl ved S=${s}`);
    assert.equal(dragBridge(re, s), expectedBridge, `CdBridge ved Re=${re}`);
    assert.equal(
      dragCoefficient(re, s),
      expectedBridge * 1.275116456035,
      `Cd ved Re=${re}, S=${s}`,
    );
  }
});

test('dragCompatibilityScale er påført Cd — ikke CdBridge', () => {
  // Spec §5.7: faktoren 1.275116456035 er en 7-jern-kompatibilitets-
  // kalibrering, ikke en ballegenskap. Den ganges på HELE broen én gang.
  const re = 100000;
  const s = 0.18;
  assert.equal(dragCoefficient(re, s) / dragBridge(re, s), 1.275116456035);
});

test('Cl klamper spinParameter mot null nedenfra', () => {
  assert.equal(liftCoefficient(0), 0);
  assert.equal(liftCoefficient(-1), 0, 'max(0, S) i spec §5.7');
});

/* ── Interne invarianter ────────────────────────────────────────────────── */

test('den allokeringsfrie løkken er bit-identisk med derivative/rk4Advance', () => {
  // `integrateFlight` har en privat kopi av `aeroSample` som skriver inn i
  // forhåndsallokerte buffere. Den kopien er en ytelsesdetalj og MÅ regne
  // nøyaktig det samme. Testen kjører hele banen på nytt med de eksporterte
  // funksjonene og krever bit-likhet.
  const sample = loadFlight().filter((_, index) => index % 120 === 0);
  assert.ok(sample.length >= 40, `${sample.length} caser i stikkprøven`);

  for (const c of sample) {
    const input = rk4InputFrom(c.out);
    const reference = solveCurveFlight(input);

    const omega0 = impactSpin(input);
    const direction = spinDirection(omega0);
    let state = initialState(
      launchVelocity(input),
      Math.hypot(omega0[0], omega0[1], omega0[2]),
    );
    let time = 0;
    let position = null;
    let terminalTime = null;

    while (time < 30) {
      const next = rk4Advance(state, direction);
      if (next[2] <= 0) {
        const fraction = state[2] / (state[2] - next[2]);
        position = [
          state[0] + fraction * (next[0] - state[0]),
          state[1] + fraction * (next[1] - state[1]),
          state[2] + fraction * (next[2] - state[2]),
        ];
        terminalTime = time + fraction * 0.01;
        break;
      }
      state = next;
      time += 0.01;
    }

    assert.ok(position !== null, `${c.id} nådde bakken`);
    assert.deepEqual(position, reference.terminalPositionM, `${c.id}: posisjon`);
    assert.equal(terminalTime, reference.curveFlightTimeSeconds, `${c.id}: tid`);

    const projected = projectOntoLaunchLine(position, input.startDirection);
    assert.equal(
      projected.curveFromLaunchLineM,
      reference.rawCurveFromLaunchLineM,
      `${c.id}: kurve`,
    );
  }
});

test('derivative returnerer hastighet, akselerasjon og spinnforfall', () => {
  const state = [1, 2, 3, 40, 50, 6, 500];
  const d = derivative(state, [1, 0, 0]);
  assert.equal(d.length, 7);
  assert.equal(d[0], 40, 'dx/dt = vx');
  assert.equal(d[1], 50, 'dy/dt = vy');
  assert.equal(d[2], 6, 'dz/dt = vz');
  assert.equal(d[6], -0.04 * 500);

  const sample = aeroSample(state, [1, 0, 0]);
  assert.deepEqual(d.slice(3, 6), sample.acceleration);
});

test('sluttposisjonen ligger på bakken', () => {
  for (const { case: c, actual } of solvedAll().filter((_, i) => i % 400 === 0)) {
    const [, , z] = actual.terminalPositionM;
    assert.ok(Math.abs(z) < 1e-12, `${c.id}: z = ${z}`);
  }
});

test('projectOntoLaunchLine dekomponerer langs og på tvers', () => {
  // Ren geometri, uavhengig av fixturen.
  const straight = projectOntoLaunchLine([0, 100, 0], 0);
  assert.equal(straight.downLaunchLineM, 100);
  assert.equal(straight.curveFromLaunchLineM, 0);

  const right = projectOntoLaunchLine([10, 0, 0], 0);
  assert.equal(right.downLaunchLineM, 0);
  assert.equal(right.curveFromLaunchLineM, 10);

  const rotated = projectOntoLaunchLine([100, 0, 0], 90);
  assert.ok(Math.abs(rotated.downLaunchLineM - 100) < 1e-13);
  assert.ok(Math.abs(rotated.curveFromLaunchLineM) < 1e-13);

  // Høyden inngår aldri.
  const lifted = projectOntoLaunchLine([3, 4, 999], 12.5);
  const flat = projectOntoLaunchLine([3, 4, 0], 12.5);
  assert.deepEqual(lifted, flat);
});

/* ── Kontrakt: renhet og returobjekt ────────────────────────────────────── */

test('solveCurveFlight returnerer nøyaktig de seks feltene', () => {
  const out = solveCurveFlight({
    ballSpeed: 129.94984164625276,
    launchAngle: 14.003017767130947,
    startDirection: 1.56,
    spinAxisUnit: [0.996066569800816, 0.0046373876183462065, -0.08848662701964236],
    totalSpinRpm: 3526.207052838138,
  });

  assert.deepEqual(Object.keys(out).sort(), [
    'aerodynamicDiagnostics',
    'curveFlightCarryYd',
    'curveFlightTimeSeconds',
    'rawCurveFromLaunchLineM',
    'rawDownLaunchLineM',
    'terminalPositionM',
  ]);
  assert.ok(Number.isFinite(out.curveFlightCarryYd));
  assert.ok(Number.isFinite(out.curveFlightTimeSeconds));
  assert.ok(Number.isFinite(out.rawCurveFromLaunchLineM));
  assert.ok(Number.isFinite(out.rawDownLaunchLineM));
});

test('rawDownLaunchLineM er yard-feltet ganget med 0.9144', () => {
  // ENGINE-GAPS §6 trenger rå downrange i METER for `D_raw ≥ 1`-testen.
  // Fixturen bærer bare yard-varianten, så modulen må eksponere begge.
  for (const { case: c, actual } of solvedAll().filter((_, i) => i % 500 === 0)) {
    assert.equal(
      actual.curveFlightCarryYd,
      actual.rawDownLaunchLineM / 0.9144,
      c.id,
    );
  }
});

test('solveCurveFlight er ren — samme input gir identisk output', () => {
  const input = Object.freeze({
    ballSpeed: 126.39246750676323,
    launchAngle: 12.503017767130947,
    startDirection: 2.66,
    spinAxisUnit: Object.freeze([0.9911921096163304, -0.08121498577258922, 0.10460558264397843]),
    totalSpinRpm: 4619.511665274681,
  });

  const first = solveCurveFlight(input);
  const second = solveCurveFlight(input);

  assert.deepEqual(first, second);
  assert.notEqual(first, second, 'nytt objekt hver gang, ingen delt tilstand');
  assert.notEqual(
    first.aerodynamicDiagnostics.reynoldsValidity,
    second.aerodynamicDiagnostics.reynoldsValidity,
    'ferske arrays, ikke delte frosne konstanter',
  );
  assert.equal(input.ballSpeed, 126.39246750676323, 'input urørt');
});

test('returobjektet inneholder ingen presentasjonsdata', () => {
  const out = solveCurveFlight({
    ballSpeed: 130,
    launchAngle: 14,
    startDirection: 0,
    spinAxisUnit: [1, 0, 0],
    totalSpinRpm: 3500,
  });
  const serialized = JSON.stringify(out);
  assert.ok(!/#[0-9A-Fa-f]{6}/.test(serialized), 'ingen hex-farger');
  assert.ok(!/rgb\(/.test(serialized), 'ingen rgb()');

  // Nøyaktig to strengVERDIER i hele treet, begge provenance fra
  // `constants.aeroModelIdentity` og begge ordrett i baseline-`out`.
  // Ingen `tip`, ingen `disclosure`, ingen bandnavn, ingen brukervendt kopi.
  const strings = [];
  const walk = (value) => {
    if (typeof value === 'string') strings.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value !== null && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  };
  walk(out);

  assert.deepEqual(
    strings.sort(),
    [
      'not modeled; positive-lift bridge is extrapolated below Reynolds 70000',
      'tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1',
    ],
    `fant ${strings.length} strengverdier`,
  );
});

/* ── Spec §9: de fire golden casene ─────────────────────────────────────── */

test('spec §9 golden cases reproduseres', () => {
  const golden = loadFlight().filter((c) => c.group === 'edge.spec-9-golden');
  assert.equal(golden.length, 4);

  const results = [];
  for (const c of golden) {
    const actual = solveCurveFlight(rk4InputFrom(c.out));
    for (const field of SCALAR_FIELDS) {
      results.push({
        id: c.id,
        field,
        expected: c.out[field],
        actual: actual[field],
        tol: tol(c.out[field]),
      });
    }
  }

  const r = report('spec/§9-golden', results);
  assert.equal(r.total, 12, r.summary);
  assert.ok(r.ok, r.summary + ' :: ' + JSON.stringify(r.failures));
});

/* ── Diagnostikk-byggeren isolert ───────────────────────────────────────── */

test('aerodynamicDiagnostics bygger objektet fra to observerte områder', () => {
  const inside = aerodynamicDiagnostics([80000, 150000], [0.1, 0.19]);
  assert.equal(inside.extrapolated, false, 'helt innenfor broen');

  assert.equal(aerodynamicDiagnostics([60000, 150000], [0.1, 0.19]).extrapolated, true);
  assert.equal(aerodynamicDiagnostics([80000, 250000], [0.1, 0.19]).extrapolated, true);
  assert.equal(aerodynamicDiagnostics([80000, 150000], [0.05, 0.19]).extrapolated, true);
  assert.equal(aerodynamicDiagnostics([80000, 150000], [0.1, 0.3]).extrapolated, true);

  assert.deepEqual(inside.reynoldsValidity, [70000, 210000]);
  assert.deepEqual(inside.spinParameterValidity, [0.08, 0.2]);
  assert.deepEqual(inside.reynoldsRangeObserved, [80000, 150000]);
  assert.deepEqual(inside.spinParameterRangeObserved, [0.1, 0.19]);
});
