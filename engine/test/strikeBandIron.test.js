/**
 * strikeBandIron mot studio-golden.json — spec §8.5, jern.
 *
 * Fixturen er fasit. Avviker modulen, er det modulen som har feil.
 *
 * OMFANG: alle 1250 caser med `clubMode: "iron"`. De 1250 driver-casene er
 * bevisst utelatt — de kjører et annet, udokumentert klassifiseringssystem
 * (`Low`/`High`, FUNN F1) som hører til en senere fase. Testen sjekker at
 * modulen KASTER på driver i stedet for å gjette.
 *
 * TOLERANSE — hva som faktisk trengs:
 *   Oppgaven ba om 1e-9 relativt, med 1e-6 absolutt som fallback for grader og
 *   rpm. Ingen av delene trengs.
 *     - `strikeBand` er en streng. Sammenligningen er eksakt likhet:
 *       1250/1250, null feilklassifiseringer. Toleranse er ikke et begrep her.
 *     - De numeriske mellomregningene klassifisereren hviler på
 *       (`effectiveLowPointX`, `contactHeight`, `offset`, `offsetRatio`,
 *       `lowPointX`, `lowPointZ`, `thetaAtImpact`) er bit-eksakte: maks avvik
 *       0 i alle 1250 caser.
 *   Derfor testes begge nivåene: det bestilte kravet (1e-9 relativt) som
 *   kontrakt, og avvik nøyaktig 0 som den faktiske baselinen. Faller det andre
 *   mens det første står, er en formel omgruppert — se ULP-notatene i
 *   `src/strikeBandIron.js`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadStudio, loadStudioMeta, close, report } from './_fixture.js';
import {
  ironStrikeBands,
  ironStrikeGeometry,
  solveStrikeBandIron,
  strikeBandIron,
  whiffOffsetRatio,
} from '../src/strikeBandIron.js';

/** Alle jern-caser. Fixturens `validated` er true for nøyaktig disse. */
function ironCases() {
  return loadStudio().filter((c) => c.in.clubMode === 'iron');
}

/** Alle driver-caser — brukes bare til å bevise at modulen holder seg unna. */
function driverCases() {
  return loadStudio().filter((c) => c.in.clubMode === 'driver');
}

/**
 * Geometrifelt modulen regner ut, og hvor de står i fixturens `out`.
 * `offset` og `offsetRatio` ligger under `clubBallContact`.
 */
const GEOMETRY_FIELDS = [
  ['lowPointX', (out) => out.lowPointX],
  ['lowPointZ', (out) => out.lowPointZ],
  ['effectiveLowPointX', (out) => out.effectiveLowPointX],
  ['thetaAtImpact', (out) => out.thetaAtImpact],
  ['contactHeight', (out) => out.contactHeight],
  ['offset', (out) => out.clubBallContact.offset],
  ['offsetRatio', (out) => out.clubBallContact.offsetRatio],
];

/**
 * Relativ toleranse omgjort til absolutt for én sammenligning.
 * `|actual − expected| <= rel × max(1, |expected|)`. Gulvet på 1 hindrer at
 * felt som er eksakt 0 i fixturen får toleranse 0 gjennom bakdøren.
 */
function absoluteTolerance(expected, relative) {
  return relative * Math.max(1, Math.abs(expected));
}

/** Én sammenligningsoppføring per geometrifelt per case. */
function* geometryComparisons(cases, relative) {
  for (const c of cases) {
    const got = ironStrikeGeometry(c.in);
    for (const [field, pick] of GEOMETRY_FIELDS) {
      const expected = pick(c.out);
      yield {
        id: c.id,
        field,
        expected,
        actual: got[field],
        tol: absoluteTolerance(expected, relative),
      };
    }
  }
}

/* ── Dekning ────────────────────────────────────────────────────────────── */

test('alle 1250 jern-caser er relevante og kjores', () => {
  const meta = loadStudioMeta();
  const iron = ironCases();

  assert.equal(loadStudio().length, meta.counts.total);
  assert.equal(iron.length, meta.counts.ironValidatedTrue);
  assert.equal(iron.length, 1250);
  assert.equal(driverCases().length, 1250);

  // Begge rutenettene er representert; ingen gruppe er filtrert bort.
  const groups = new Set(iron.map((c) => c.group));
  assert.deepEqual([...groups].sort(), ['grid.fine-band', 'grid.full-width']);

  for (const c of iron) {
    assert.equal(c.validated, true, `${c.id}: validated`);
    for (const key of [
      'swingPlane',
      'swingDirection',
      'ballPositionCm',
      'arcHeightCm',
    ]) {
      assert.equal(typeof c.in[key], 'number', `${c.id}: in.${key}`);
    }
    assert.equal(typeof c.out.strikeBand, 'string', `${c.id}: out.strikeBand`);
  }
});

/* ── Kontrakten: klassifiseringen ───────────────────────────────────────── */

test('strikeBand matcher fixturen i alle 1250 jern-caser', () => {
  const iron = ironCases();
  const summary = report(
    'strikeBandIron/band',
    iron.map((c) => ({
      id: c.id,
      field: 'strikeBand',
      expected: c.out.strikeBand,
      actual: solveStrikeBandIron(c.in).strikeBand,
    })),
  );

  assert.equal(summary.total, 1250);
  assert.ok(
    summary.ok,
    `${summary.summary}\n${JSON.stringify(summary.failures, null, 2)}`,
  );
  assert.equal(summary.passed, 1250);
});

test('samme band gjelder ogsa strikeQuality.band — jern er 0 % uenig (FUNN F7)', () => {
  const iron = ironCases();
  const disagreeing = iron.filter(
    (c) => c.out.strikeBand !== c.out.strikeQuality.band,
  );
  assert.equal(disagreeing.length, 0, 'fixturen selv er uenig med seg selv');

  for (const c of iron) {
    assert.equal(
      solveStrikeBandIron(c.in).strikeBand,
      c.out.strikeQuality.band,
      c.id,
    );
  }
});

test('fordelingen per band stemmer med FUNN.md', () => {
  const counts = {};
  for (const c of ironCases()) {
    counts[c.out.strikeBand] = (counts[c.out.strikeBand] ?? 0) + 1;
  }
  assert.deepEqual(counts, {
    Whiff: 320,
    Fat: 302,
    Duff: 249,
    Pure: 240,
    Thin: 139,
  });

  // Modulen produserer nøyaktig de fem, aldri et driver-band.
  const produced = new Set(
    ironCases().map((c) => solveStrikeBandIron(c.in).strikeBand),
  );
  assert.deepEqual(
    [...produced].sort(),
    ['Duff', 'Fat', 'Pure', 'Thin', 'Whiff'],
  );
});

/* ── Mellomregningene: 1e-9 relativt, og bit-eksakt ─────────────────────── */

test('geometrien klassifisereren hviler pa matcher innenfor 1e-9 relativt', () => {
  const iron = ironCases();
  const summary = report(
    'strikeBandIron/geometri-1e-9-relativ',
    geometryComparisons(iron, 1e-9),
  );

  assert.equal(summary.total, iron.length * GEOMETRY_FIELDS.length);
  assert.ok(
    summary.ok,
    `${summary.summary}\n${JSON.stringify(summary.failures, null, 2)}`,
  );
});

test('geometrien er bit-eksakt — maks avvik 0', () => {
  const iron = ironCases();
  const summary = report(
    'strikeBandIron/geometri-bit-eksakt',
    geometryComparisons(iron, 0),
  );

  assert.ok(
    summary.ok,
    `${summary.summary}\n${JSON.stringify(summary.failures, null, 2)}`,
  );
  assert.equal(summary.maxDeviation, 0, summary.summary);
  assert.equal(summary.failed, 0);
});

test('hver enkelt case matcher pa band og alle geometrifelt samtidig', () => {
  const iron = ironCases();
  let passed = 0;
  const failures = [];

  for (const c of iron) {
    const got = ironStrikeGeometry(c.in);
    const bad = [];

    for (const [field, pick] of GEOMETRY_FIELDS) {
      if (!close(got[field], pick(c.out))) bad.push(field);
    }
    if (solveStrikeBandIron(c.in).strikeBand !== c.out.strikeBand) {
      bad.push('strikeBand');
    }

    if (bad.length === 0) passed += 1;
    else if (failures.length < 10) failures.push({ id: c.id, in: c.in, bad });
  }

  assert.equal(
    passed,
    iron.length,
    `${passed}/${iron.length} caser eksakte\n${JSON.stringify(failures, null, 2)}`,
  );
});

/* ── Tersklene: hva fixturen faktisk pinner ─────────────────────────────── */

/** Min/maks av `pick` over casene i ett band. */
function span(band, pick) {
  const values = ironCases()
    .filter((c) => c.out.strikeBand === band)
    .map(pick);
  return [Math.min(...values), Math.max(...values)];
}

test('Duff-terskelen: fixturen brakketerer 25 mm under bakken', () => {
  const [, duffTop] = span('Duff', (c) => c.out.contactHeight);
  const [fatFloor] = span('Fat', (c) => c.out.contactHeight);

  assert.equal(duffTop, -0.02507000825130299);
  assert.equal(fatFloor, -0.024970169073658954);
  assert.ok(duffTop < -0.025 && -0.025 < fatFloor, 'terskelen ligger i gapet');

  // Ingen case ligger eksakt pa terskelen, sa `<` vs `<=` er ikke avgjort.
  assert.equal(
    ironCases().filter((c) => c.out.contactHeight === -0.025).length,
    0,
  );
});

test('Whiff-terskelen: fixturen brakketerer offsetRatio 0.4', () => {
  const [, thinTop] = span('Thin', (c) => c.out.clubBallContact.offsetRatio);
  const [whiffFloor] = span('Whiff', (c) => c.out.clubBallContact.offsetRatio);

  assert.equal(thinTop, 0.39681452923688304);
  assert.equal(whiffFloor, 0.4031094374492235);
  assert.ok(
    thinTop < whiffOffsetRatio && whiffOffsetRatio <= whiffFloor,
    `${whiffOffsetRatio} ligger ikke i gapet (${thinTop}, ${whiffFloor}]`,
  );
});

test('Pure-vinduet: fixturen brakketerer 20–150 mm foran ballen', () => {
  const pure = ironCases().filter((c) => c.out.strikeBand === 'Pure');
  const [pureLow, pureHigh] = span('Pure', (c) => c.out.effectiveLowPointX);

  assert.equal(pureLow, 0.04077932017477113);
  assert.equal(pureHigh, 0.14922067982522888);
  assert.ok(pureHigh < 0.15);

  // Alle Pure-caser er ogsa under/ved ballens sentrum.
  assert.ok(pure.every((c) => c.out.clubBallContact.offsetRatio <= 0));

  // Naermeste Thin over vinduet — overkanten er pinnet.
  const thinAbove = ironCases()
    .filter(
      (c) =>
        c.out.strikeBand === 'Thin' &&
        c.out.clubBallContact.offsetRatio <= 0 &&
        c.out.effectiveLowPointX > 0.15,
    )
    .map((c) => c.out.effectiveLowPointX);
  assert.equal(Math.min(...thinAbove), 0.1530894183907477);
});

test('AMBIGUITET 1: fixturen kan ikke skille Fat-grensen 0 fra 0.02', () => {
  const iron = ironCases();

  // Fat med kontakt over bakken: alle har low point BAK ballen.
  const fatAboveGround = iron.filter(
    (c) => c.out.strikeBand === 'Fat' && c.out.contactHeight >= 0,
  );
  assert.equal(fatAboveGround.length, 22);
  assert.ok(fatAboveGround.every((c) => c.out.effectiveLowPointX < 0));
  assert.equal(
    Math.max(...fatAboveGround.map((c) => c.out.effectiveLowPointX)),
    -0.07317872642929266,
  );

  // Det tomme gapet: ingen case har low point i [0, 0.02) samtidig med
  // kontakt i [0, ballradius]. Derfor er `< 0` og `< 0.02` ikke til a skille.
  const inGap = iron.filter(
    (c) =>
      c.out.effectiveLowPointX >= 0 &&
      c.out.effectiveLowPointX < 0.02 &&
      c.out.contactHeight >= 0 &&
      c.out.clubBallContact.offsetRatio <= 0,
  );
  assert.equal(inGap.length, 0);

  // De to lesningene gir samme svar pa hele fixturen, ulikt svar utenfor den.
  const alternative = (contactHeight, effectiveLowPointX) => {
    const offsetRatio = (contactHeight - 0.0213) / 0.0213;
    if (contactHeight < -0.025) return 'Duff';
    if (contactHeight < 0) return 'Fat';
    if (offsetRatio <= 0) {
      if (effectiveLowPointX < 0.02) return 'Fat';
      if (effectiveLowPointX <= 0.15) return 'Pure';
      return 'Thin';
    }
    return offsetRatio > 0.4 ? 'Whiff' : 'Thin';
  };
  for (const c of iron) {
    assert.equal(
      alternative(c.out.contactHeight, c.out.effectiveLowPointX),
      c.out.strikeBand,
      `${c.id}: den alternative lesningen er ogsa forenlig med fixturen`,
    );
  }
  // Et punkt utenfor rutenettet der de skiller lag. Dokumentert, ikke fikset.
  assert.equal(strikeBandIron(0.01, 0.01), 'Thin');
  assert.equal(alternative(0.01, 0.01), 'Fat');
});

test('grenene i klassifisereren treffes alle av fixturen', () => {
  const iron = ironCases();
  const hit = (predicate) => iron.filter(predicate).length;

  // Duff, Fat-under-bakken, Fat-bak-ballen, Pure, Thin-grunn, Thin-bladed, Whiff.
  assert.equal(hit((c) => c.out.contactHeight < -0.025), 249);
  assert.equal(
    hit((c) => c.out.contactHeight >= -0.025 && c.out.contactHeight < 0),
    280,
  );
  assert.equal(
    hit((c) => c.out.contactHeight >= 0 && c.out.effectiveLowPointX < 0 && c.out.clubBallContact.offsetRatio <= 0),
    22,
  );
  assert.equal(hit((c) => c.out.strikeBand === 'Pure'), 240);
  assert.equal(
    hit((c) => c.out.strikeBand === 'Thin' && c.out.clubBallContact.offsetRatio <= 0),
    51,
  );
  assert.equal(
    hit((c) => c.out.strikeBand === 'Thin' && c.out.clubBallContact.offsetRatio > 0),
    88,
  );
  assert.equal(hit((c) => c.out.clubBallContact.offsetRatio > 0.4), 320);
});

/* ── Omfangsvakten: driver hores ikke til her ───────────────────────────── */

test('driver kaster i stedet for a gjette et jern-band', () => {
  const driver = driverCases();
  assert.equal(driver.length, 1250);

  for (const c of driver.slice(0, 25)) {
    assert.throws(() => solveStrikeBandIron(c.in), RangeError, c.id);
  }

  // Driver emitterer to band jern aldri gjor. De finnes ikke i denne modulen.
  const driverOnly = new Set(driver.map((c) => c.out.strikeBand));
  assert.ok(driverOnly.has('Low') && driverOnly.has('High'), 'FUNN F1');
  assert.ok(
    !Object.values(ironStrikeBands).includes('Low') &&
      !Object.values(ironStrikeBands).includes('High'),
    'udokumenterte driver-band har lekket inn i jern-modulen',
  );

  // clubMode kan utelates helt; da antas jern, som i fixturens jern-caser.
  const anyIron = ironCases()[0];
  const { clubMode, ...withoutMode } = anyIron.in;
  assert.equal(clubMode, 'iron');
  assert.equal(
    solveStrikeBandIron(withoutMode).strikeBand,
    anyIron.out.strikeBand,
  );
});

/* ── Endelighet ─────────────────────────────────────────────────────────── */

test('ingen ikke-endelige tall i geometrien, og alltid et gyldig band', () => {
  const bands = new Set(Object.values(ironStrikeBands));

  for (const c of ironCases()) {
    const got = ironStrikeGeometry(c.in);
    for (const [field] of GEOMETRY_FIELDS) {
      assert.ok(Number.isFinite(got[field]), `${c.id}: ${field} = ${got[field]}`);
    }
    assert.ok(bands.has(solveStrikeBandIron(c.in).strikeBand), c.id);
  }

  // Klampen i §8.3 holder theta endelig selv langt utenfor rutenettet.
  for (const ballPositionCm of [-1000, 1000]) {
    const got = ironStrikeGeometry({
      swingPlane: 55,
      swingDirection: 0,
      ballPositionCm,
      arcHeightCm: 0,
    });
    assert.ok(Number.isFinite(got.thetaAtImpact));
    assert.ok(Number.isFinite(got.contactHeight));
  }
});

/* ── Renhet ─────────────────────────────────────────────────────────────── */

test('modulen er ren og gir ingen presentasjonsdata', () => {
  const input = {
    swingPlane: 55,
    swingDirection: 0,
    ballPositionCm: 0,
    arcHeightCm: 0,
    clubMode: 'iron',
  };

  const first = solveStrikeBandIron(input);
  const second = solveStrikeBandIron({ ...input, camera: 'dtl', foo: 1 });
  assert.deepEqual(first, second, 'ukjente nokler pavirker ikke geometrien');
  assert.deepEqual(Object.keys(first), ['strikeBand']);

  // Ingen farger, tips, pct eller barPos — strikeQuality er presentasjon (FUNN F6).
  const geometry = ironStrikeGeometry(input);
  for (const key of Object.keys(geometry)) {
    assert.equal(typeof geometry[key], 'number', `${key} er ikke et tall`);
  }
  for (const forbidden of ['color', 'textColor', 'tip', 'pct', 'barPos']) {
    assert.ok(!(forbidden in geometry), forbidden);
    assert.ok(!(forbidden in first), forbidden);
  }

  // Fixturen HAR dem; modulen skal ikke arve dem.
  assert.ok('color' in ironCases()[0].out.strikeQuality);

  // Bandnavnene er frosne.
  assert.throws(() => {
    'use strict';
    ironStrikeBands.duff = 'x';
  }, TypeError);

  // Klassifisereren er en ren funksjon av to tall.
  assert.equal(strikeBandIron(0.005, 0.105), 'Pure');
  assert.equal(strikeBandIron(0.005, 0.105), 'Pure');
});
