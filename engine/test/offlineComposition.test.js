/**
 * §5.8 Sluttposisjon — verifikasjon mot golden-fixturen.
 *
 * Kjører `src/offlineComposition.js` over ALLE 5028 flight-caser som har `out`
 * og sammenligner `offline` felt for felt.
 *
 * TOLERANSE — hva som faktisk trengs:
 * Oppgaven ba om 1e-9 relativt, med 1e-6 absolutt som fallback for grader.
 * Ingen av dem trengs. Modulen er BIT-EKSAKT mot fixturen i alle 5028 caser:
 * maks absolutt avvik er nøyaktig `0`. Derfor kjører vi begge:
 *
 *   1. det oppgaven ba om — 1e-9 relativt, som `|forventet| × 1e-9`;
 *   2. en strengere lås på toleranse `0`.
 *
 * Lås nr. 2 er den som er verdt å beholde. Slår den ut mens nr. 1 fortsatt er
 * grønn, har noen endret grupperingen `(deg * Math.PI) / 180` → `deg * degToRad`
 * eller tilsvarende — altså rekkefølgen på flyttalloperasjonene, ikke fysikken.
 * Se ULP-avsnittet i modulen.
 *
 * Studio-fixturen har ikke `offline` (Studio beregner aldri ballflukt,
 * spec §11.3), så bare `loadFlight()` er relevant.
 *
 * Testene her leser `c.out.carry`, `c.out.startDirection` og `c.out.curve` som
 * input. Det er bevisst: §5.8 er komposisjonssteget NEDSTRØMS for alle tre.
 * Å regne dem ut på nytt her ville testet §5.1, §5.6 og §5.7 om igjen, og
 * blandet inn feilkilder som ikke hører hjemme i denne modulen.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, loadFlightErrors, report } from './_fixture.js';

import {
  solveOfflineComposition,
  startDirectionRad,
  startLineSide,
  composeOffline,
  degreesPerHalfTurn,
} from '../src/offlineComposition.js';

import { degToRad, yardToMetre } from '../src/constants.js';

/* ── Toleranse ──────────────────────────────────────────────────────────── */

/** Det oppgaven ba om. `report` tar absolutt toleranse, så vi skalerer selv. */
const RELATIVE_TOLERANCE = 1e-9;

/** `|forventet| × 1e-9`. Ved forventet `0` blir dette `0` — og det passerer. */
function relativeTolerance(expected) {
  return Math.abs(expected) * RELATIVE_TOLERANCE;
}

/** Feiler høyt: hele summary pluss de første avvikende casene. */
function assertReport(result) {
  assert.ok(
    result.ok,
    `${result.summary}\n${JSON.stringify(result.failures, null, 2)}`,
  );
}

/** §5.8-input hentet ut av en case. Modulen tar ferdige oppstrømsverdier. */
function inputOf(c) {
  return {
    carry: c.out.carry,
    startDirection: c.out.startDirection,
    curve: c.out.curve,
  };
}

/* ── Hele fixturen ──────────────────────────────────────────────────────── */

test('offline matcher fixturen i alle 5028 caser (1e-9 relativt)', () => {
  const cases = loadFlight();
  assert.equal(cases.length, 5028, 'alle caser med out er med');

  const result = report(
    'flight/offline',
    cases.map((c) => ({
      id: c.id,
      field: 'offline',
      expected: c.out.offline,
      actual: solveOfflineComposition(inputOf(c)).offline,
      tol: relativeTolerance(c.out.offline),
    })),
  );

  assertReport(result);
  assert.equal(result.total, cases.length, 'ingen case hoppet over');
});

test('offline er bit-eksakt — toleranse 0, avvik 0', () => {
  const cases = loadFlight();

  const result = report(
    'flight/§5.8 bit-eksakt',
    cases.map((c) => ({
      id: c.id,
      field: 'offline',
      expected: c.out.offline,
      actual: solveOfflineComposition(inputOf(c)).offline,
    })),
  );

  assertReport(result);
  assert.equal(result.total, cases.length);
  assert.equal(
    result.maxDeviation,
    0,
    'maks absolutt avvik skal være nøyaktig 0, ikke bare lite',
  );
});

/* ── FEILEN SOM SKAL REPRODUSERES (spec §5.8, README-felle 6) ───────────── */

test('cos-leddet mangler — den geometrisk riktige formen bryter fixturen', () => {
  // `Curve` er vinkelrett på LAUNCH-linjen, `Offline` vinkelrett på MÅLLINJEN.
  // Den konsistente komposisjonen ville rotert curve-leddet med
  // cos(StartDirection). Motoren gjør ikke det. Denne testen finnes for at
  // ingen skal «rydde» formelen senere uten å se hva det koster.
  const cases = loadFlight();

  let breaks = 0;
  let breaksOutsideRelativeTolerance = 0;
  let maxAbsoluteYards = 0;
  let worst = null;

  for (const c of cases) {
    const { carry, startDirection, curve } = inputOf(c);
    const radians = (startDirection * Math.PI) / 180;
    const withCos = carry * Math.sin(radians) + curve * Math.cos(radians);

    if (withCos !== c.out.offline) breaks += 1;

    const deviation = Math.abs(withCos - c.out.offline);
    if (deviation > relativeTolerance(c.out.offline)) {
      breaksOutsideRelativeTolerance += 1;
    }
    if (deviation > maxAbsoluteYards) {
      maxAbsoluteYards = deviation;
      worst = c;
    }
  }

  // Nøyaktig de casene der curve ≠ 0. Ved curve = 0 er cos-leddet dødt.
  const curveNonZero = cases.filter((c) => c.out.curve !== 0).length;
  assert.equal(curveNonZero, 4015, 'caser med curve ≠ 0');
  assert.equal(breaks, 4015, 'cos-varianten bryter i alle av dem');
  assert.equal(
    breaksOutsideRelativeTolerance,
    4015,
    'og ikke bare bit-eksakt — også utenfor 1e-9 relativt',
  );

  // Størrelsen: ~3.8 meter på det verste. Ikke en avrundingsdetalj.
  assert.ok(
    Math.abs(maxAbsoluteYards - 4.144990242345727) < 1e-12,
    `maks cos-avvik i yards: ${maxAbsoluteYards}`,
  );
  assert.equal(worst.group, 'grid.full-width', 'verste case er ekstremvinkel');
  assert.equal(Math.abs(worst.out.startDirection) > 12, true);
});

test('feilen er liten i sliderområdet og stor i full-width — spec §5.8', () => {
  // Spec §5.8: «Feilen er liten i det normale sliderområdet.» Fixturen har
  // begge båndene, så påstanden er målbar.
  const worstByGroup = new Map();

  for (const c of loadFlight()) {
    const { carry, startDirection, curve } = inputOf(c);
    const radians = (startDirection * Math.PI) / 180;
    const withCos = carry * Math.sin(radians) + curve * Math.cos(radians);
    const deviation = Math.abs(withCos - c.out.offline);

    worstByGroup.set(
      c.group,
      Math.max(worstByGroup.get(c.group) ?? 0, deviation),
    );
  }

  const realistic = worstByGroup.get('grid.realistic-band');
  const fullWidth = worstByGroup.get('grid.full-width');

  assert.ok(realistic < 0.04, `realistic-band under 0.04 yd, fikk ${realistic}`);
  assert.ok(fullWidth > 4, `full-width over 4 yd, fikk ${fullWidth}`);

  // I meter, som spec §6-adapteren ville vist dem.
  assert.ok(realistic * yardToMetre < 0.04, 'under 4 cm i sliderområdet');
  assert.ok(fullWidth * yardToMetre > 3.7, 'over 3.7 m i ytterkant');
});

/* ── ULP-fellen: grader → radianer ──────────────────────────────────────── */

test('§5.8 bruker (deg × π)/180, IKKE deg × degToRad', () => {
  // README og constants.js dokumenterer at flight-motoren grupperer som
  // `deg * degToRad`. Det gjelder flightglass-3d-spin-model.js. §5.8 ligger i
  // impact-flight.js og grupperer motsatt. Fixturen skiller dem, og den
  // skiller entydig: 499 caser peker én vei, null peker den andre.
  const cases = loadFlight();

  let mineExact = 0;
  let degToRadExact = 0;
  let onlyDegToRad = 0;
  let degToRadMaxDeviation = 0;

  for (const c of cases) {
    const { carry, startDirection, curve } = inputOf(c);
    const expected = c.out.offline;

    const mine = solveOfflineComposition(inputOf(c)).offline;
    const viaDegToRad = carry * Math.sin(startDirection * degToRad) + curve;

    if (mine === expected) mineExact += 1;
    if (viaDegToRad === expected) degToRadExact += 1;
    if (viaDegToRad === expected && mine !== expected) onlyDegToRad += 1;

    degToRadMaxDeviation = Math.max(
      degToRadMaxDeviation,
      Math.abs(viaDegToRad - expected),
    );
  }

  assert.equal(mineExact, 5028, 'gruppering (deg × π)/180: alle caser');
  assert.equal(degToRadExact, 4529, 'gruppering deg × degToRad: 4529 av 5028');
  assert.equal(onlyDegToRad, 0, 'ingen case peker motsatt vei');
  assert.equal(5028 - degToRadExact, 499, '499 caser skiller de to');

  // Avviket er 1 ULP på verdier rundt 130 yd — usynlig i UI, dødelig for en
  // bit-eksakt baseline.
  assert.ok(
    degToRadMaxDeviation > 0 && degToRadMaxDeviation < 1e-13,
    `degToRad-avvik: ${degToRadMaxDeviation}`,
  );

  // Selve konstanten er ikke feil — den er bare feil gruppert for §5.8.
  assert.equal(degToRad, Math.PI / 180);
  assert.equal(degreesPerHalfTurn, 180);

  // 67 av de 227 distinkte startretningene i fixturen skiller grupperingene.
  // De fleste gjør det ikke — derfor 4529 «tilfeldige» treff for degToRad.
  const distinct = [...new Set(cases.map((c) => c.out.startDirection))];
  const differing = distinct.filter(
    (deg) => deg * degToRad !== (deg * Math.PI) / 180,
  );
  assert.equal(distinct.length, 227, 'distinkte startretninger i fixturen');
  assert.equal(differing.length, 67, 'og 67 av dem skiller grupperingene');
  assert.notEqual(-14.1 * degToRad, (-14.1 * Math.PI) / 180, '1 ULP');
  assert.equal(15 * degToRad, (15 * Math.PI) / 180, 'men ikke på 15° — flaks');
});

/* ── Spec §9 golden cases ───────────────────────────────────────────────── */

test('spec §9: Side i meter stemmer for de fire golden-casene', () => {
  const byId = new Map(loadFlight().map((c) => [c.id, c]));

  // Spec §9-tabellen oppgir Side i METER med 4 desimaler. Fixturen er fasit
  // for full presisjon i yards; tabellverdien er kryssjekken mot dokumentet.
  // §6: adapteren konverterer én gang med 0.9144.
  const sideMetresFromSpec = [
    ['spec-9.neutral-iron', 0], // «Straight», ingen Side oppgitt
    ['spec-9.d-plane-default', 10.051],
    ['spec-9.push-draw', 1.1183],
    ['spec-9.no-flight', 0], // carry, curve og alt annet er 0
  ];

  for (const [id, specSideM] of sideMetresFromSpec) {
    const c = byId.get(id);
    assert.ok(c, `fixturen har ${id}`);

    const mine = solveOfflineComposition(inputOf(c)).offline;
    assert.equal(mine, c.out.offline, `${id} mot fixtur`);
    assert.ok(
      Math.abs(mine * yardToMetre - specSideM) < 5e-4,
      `${id} mot spec §9-tabellen: ${mine * yardToMetre} m vs ${specSideM} m`,
    );
  }
});

/* ── Egenskaper, alle fixture-belagte ───────────────────────────────────── */

test('StartDirection = 0 gir offline = curve — 206 caser', () => {
  const straightStart = loadFlight().filter((c) => c.out.startDirection === 0);
  assert.equal(straightStart.length, 206);

  for (const c of straightStart) {
    assert.equal(c.out.offline, c.out.curve, `fixtur ${c.id}`);
    assert.equal(solveOfflineComposition(inputOf(c)).offline, c.out.curve, c.id);
  }
});

test('Curve = 0 gir rent push/pull-sideavvik — spec §5.8', () => {
  // «Dermed kan et rent push/pull ha sideavvik selv når Curve = 0.»
  const noCurve = loadFlight().filter((c) => c.out.curve === 0);
  assert.equal(noCurve.length, 1013);

  let withSideOffset = 0;
  for (const c of noCurve) {
    const mine = solveOfflineComposition(inputOf(c)).offline;
    assert.equal(mine, c.out.offline, c.id);

    // `===`, ikke `assert.equal`: startlinjeleddet kan være -0 (carry = 0 og
    // negativ startretning), og `-0 + 0` er `+0`. JSON kan bare bære `+0`, så
    // fixturen har `+0`. Baseline-detalj, ikke et avvik.
    const side = startLineSide(c.out.carry, c.out.startDirection);
    assert.ok(mine === side, `${c.id}: offline er rent startlinjeledd`);

    if (mine !== 0) withSideOffset += 1;
  }

  assert.ok(
    withSideOffset > 0,
    'fixturen har caser med Curve = 0 og Side ≠ 0 — spec-påstanden holder',
  );
});

test('carry = 0 gir offline = 0 uten noen hasFlight-guard — 382 caser', () => {
  // Modulen har ingen `hasFlight`-gren. Den trengs ikke: uten flukt er både
  // carry og curve allerede 0 oppstrøms. Fixturen bekrefter det.
  const noFlight = loadFlight().filter((c) => c.out.carry === 0);
  assert.equal(noFlight.length, 382);

  for (const c of noFlight) {
    assert.equal(c.out.curve, 0, `fixtur ${c.id}: curve er også 0`);
    assert.equal(c.out.offline, 0, `fixtur ${c.id}`);
    assert.equal(solveOfflineComposition(inputOf(c)).offline, 0, c.id);
  }

  // Og fortegnet på null overlever: 0 × sin(negativ vinkel) er -0, men
  // -0 + 0 er +0, som er det JSON kan representere.
  assert.equal(
    Object.is(solveOfflineComposition({ carry: 0, startDirection: -15, curve: 0 }).offline, 0),
    true,
    'ikke -0',
  );
});

test('offline er affint i curve med stigningstall 1, ikke cos(StartDirection)', () => {
  // Det er nettopp DETTE som er feilen §5.8 dokumenterer: med cos-leddet ville
  // stigningstallet vært cos(StartDirection). Ved 15° er det 0.96593 — 3.4 %
  // unna 1, altså langt utenfor enhver flyttallsforklaring.
  const cases = loadFlight();

  let maxSlopeError = 0;
  let maxCosGap = 0;

  for (const c of cases) {
    const base = inputOf(c);

    // Eksakt: curve inngår rent additivt, så curve = 0 gir startlinjeleddet
    // tilbake bit for bit. `===` fordi leddet kan være -0 (se testen over).
    const side = startLineSide(base.carry, base.startDirection);
    const atZero = solveOfflineComposition({ ...base, curve: 0 }).offline;
    assert.ok(atZero === side, `${c.id}: curve = 0 gir rent startlinjeledd`);

    // Stigningstall. Endelig differanse, så 1-2 ULP relativt til |offline| —
    // derfor toleranse her, ikke likhet.
    const slope =
      solveOfflineComposition({ ...base, curve: base.curve + 1 }).offline -
      solveOfflineComposition(base).offline;
    maxSlopeError = Math.max(maxSlopeError, Math.abs(slope - 1));

    maxCosGap = Math.max(
      maxCosGap,
      1 - Math.cos((base.startDirection * Math.PI) / 180),
    );
  }

  assert.ok(maxSlopeError < 1e-13, `stigningstall 1, avvik ${maxSlopeError}`);
  assert.ok(
    maxCosGap > 0.034,
    `cos-varianten ville gitt stigningstall ned til ${1 - maxCosGap}`,
  );
  assert.ok(
    maxCosGap > 1e10 * maxSlopeError,
    'cos-gapet er ikke en flyttallsdetalj — det er en fysikkforskjell',
  );
});

test('fortegnskontrakt: speiling av face og path speiler offline', () => {
  // Spec §4 og linje 93: + = høyre, offline > 0 = ballen ender høyre for
  // mållinjen. Fixturen er symmetrisk om (face, path) = (0, 0).
  const byKey = new Map();
  const keyOf = (i) =>
    `${i.clubSpeed}|${i.faceAngle}|${i.clubPath}|${i.attackAngle}|${i.dynamicLoft}`;

  for (const c of loadFlight()) byKey.set(keyOf(c.in), c);

  let checked = 0;
  for (const c of loadFlight()) {
    const mirrored = byKey.get(
      keyOf({ ...c.in, faceAngle: -c.in.faceAngle, clubPath: -c.in.clubPath }),
    );
    if (mirrored === undefined) continue;

    assert.equal(
      mirrored.out.offline,
      -c.out.offline || 0,
      `speiling av ${c.id}`,
    );
    assert.equal(
      solveOfflineComposition(inputOf(mirrored)).offline,
      -solveOfflineComposition(inputOf(c)).offline || 0,
      `modulen speiler ${c.id}`,
    );
    checked += 1;
  }

  assert.equal(checked, 5017, 'fixturen har 5017 speilbare par');
});

/* ── Delfunksjonene ─────────────────────────────────────────────────────── */

test('startDirectionRad, startLineSide og composeOffline utgjør helheten', () => {
  for (const c of loadFlight()) {
    const { carry, startDirection, curve } = inputOf(c);

    const radians = startDirectionRad(startDirection);
    assert.equal(radians, (startDirection * Math.PI) / 180, `${c.id} radianer`);

    const side = startLineSide(carry, startDirection);
    assert.equal(side, carry * Math.sin(radians), `${c.id} startlinjeledd`);

    assert.equal(composeOffline(side, curve), c.out.offline, `${c.id} sum`);
  }
});

test('composeOffline legger curve til urørt — ingen skjult skalering', () => {
  assert.equal(composeOffline(0, 0), 0);
  assert.equal(composeOffline(3, 4), 7);
  assert.equal(composeOffline(-3, 4), 1);
  assert.equal(composeOffline(1e-300, 1e300), 1e300);
  assert.equal(startDirectionRad(0), 0);
  assert.equal(startDirectionRad(180), Math.PI);
  assert.equal(startLineSide(100, 0), 0, 'sin(0) = 0 eksakt');
});

/* ── Feilcasen ──────────────────────────────────────────────────────────── */

test('RK4-timeout-casen har ingen out, så §5.8 har ingen fasit der', () => {
  // `clubSpeed: 18000` kaster inne i RK4, altså FØR carry og curve finnes.
  // Fixturen har derfor verken carry, curve eller offline for den. Vi hevder
  // ingen verdi — bare at modulen er ren aritmetikk og ikke kaster på
  // endelige tall.
  const errors = loadFlightErrors();
  assert.equal(errors.length, 1);
  assert.equal(errors[0].out, undefined, 'ingen out å sammenligne mot');

  const mine = solveOfflineComposition({
    carry: 1000,
    startDirection: 15,
    curve: -20,
  });
  assert.ok(Number.isFinite(mine.offline), 'endelig offline');
});

/* ── Returobjektet ──────────────────────────────────────────────────────── */

test('returobjektet har nøyaktig ett felt og ingen presentasjonsdata', () => {
  const keys = Object.keys(
    solveOfflineComposition({ carry: 180, startDirection: 1.56, curve: 5.86 }),
  );
  assert.deepEqual(keys, ['offline']);
});

test('felter utover de tre ignoreres — hele flight state kan sendes inn', () => {
  const c = loadFlight().find((x) => x.id === 'spec-9.d-plane-default');
  assert.ok(c);

  // Hele `out` inn, inkludert de 78 andre feltene: samme svar.
  assert.deepEqual(solveOfflineComposition(c.out), { offline: c.out.offline });
  assert.deepEqual(solveOfflineComposition(inputOf(c)), {
    offline: c.out.offline,
  });
});
