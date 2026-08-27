/**
 * §8.1–8.4 Impact Studio-geometri — verifikasjon mot golden-fixturen.
 *
 * Kjører `src/studioGeometry.js` over ALLE 2500 studio-caser og sammenligner
 * de seks feltene modulen eier, felt for felt:
 *
 *   lowPointX, lowPointZ, effectiveLowPointX, thetaAtImpact,
 *   attackAngle, clubPath
 *
 * ── TOLERANSE: hva som faktisk trengs ────────────────────────────────────
 *
 * Oppgaven ba om 1e-9 relativt, med 1e-6 absolutt som fallback for grader.
 * INGEN AV DEM TRENGS. Modulen er BIT-EKSAKT mot fixturen i alle 2500 caser
 * for alle seks feltene: maks absolutt avvik er nøyaktig `0` over 15 000
 * sammenligninger. Derfor kjører vi tre lag:
 *
 *   1. det oppgaven ba om — 1e-9 relativt, som `|forventet| × 1e-9`;
 *   2. fallbacken oppgaven tilbød — 1e-6 absolutt på gradfeltene, med en
 *      eksplisitt påstand om at den er unødvendig;
 *   3. en lås på toleranse `0`.
 *
 * Lås nr. 3 er den som er verdt å beholde. Slår den ut mens nr. 1 fortsatt er
 * grønn, har noen endret rekkefølgen på flyttalloperasjonene — ikke fysikken.
 *
 * ── ULP-låsene ───────────────────────────────────────────────────────────
 *
 * Fire grupperinger ser algebraisk like ut, men er det ikke i flyttall.
 * Testene under viser at hvert alternativ MISTER caser. De påstår «færre enn
 * 2500», ikke et eksakt tall: `Math.cos`/`asin`/`atan2` er implementasjons-
 * definert i ECMAScript, så et eksakt bomtall ville vært en påstand om V8, ikke
 * om motoren. Observert tall står i feilmeldingen.
 *
 * Flight-fixturen har ingen av disse feltene (Studio og Ball Flight er to
 * separate motorer, spec §1), så bare `loadStudio()` er relevant.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadStudio,
  loadStudioErrors,
  loadStudioMeta,
  report,
} from './_fixture.js';

import {
  solveStudioGeometry,
  swingPlaneRadians,
  ballLowPointX,
  clubLowPointZ,
  lowPointShiftPerDegree,
  shiftLowPointX,
  impactTheta,
  arcDeliveryComponents,
  attackAngleFromComponents,
  clubPathFromComponents,
} from '../src/studioGeometry.js';

import {
  studioRadius,
  studioBallPositionOffsetCm,
  cmPerMetre,
  arcZ0Cm,
  studioThetaSinClamp,
  degToRad,
  radToDeg,
} from '../src/constants.js';

/* ── Felles ─────────────────────────────────────────────────────────────── */

/** De seks feltene denne modulen eier. Rekkefølgen er spec §8.1 → §8.4. */
const FIELDS = [
  'lowPointX',
  'lowPointZ',
  'effectiveLowPointX',
  'thetaAtImpact',
  'attackAngle',
  'clubPath',
];

/** Gradfeltene — de oppgaven tilbød 1e-6 absolutt fallback for. */
const DEGREE_FIELDS = ['attackAngle', 'clubPath'];

const RELATIVE_TOLERANCE = 1e-9;
const DEGREE_ABSOLUTE_FALLBACK = 1e-6;

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

/** Antall caser der `compute(case)` er bit-identisk med fixturens `field`. */
function bitExactCount(cases, field, compute) {
  let n = 0;
  for (const c of cases) if (compute(c) === c.out[field]) n += 1;
  return n;
}

/* ── Hele fixturen, felt for felt ───────────────────────────────────────── */

test('fixturen har 2500 studio-caser og ingen feilcase', () => {
  const cases = loadStudio();
  const meta = loadStudioMeta();

  assert.equal(cases.length, 2500);
  assert.equal(cases.length, meta.counts.total);
  assert.equal(loadStudioErrors().length, 0, 'ingen studio-case kaster');

  // Alle seks feltene finnes faktisk i fixturens returnedFields.
  for (const field of FIELDS) {
    assert.ok(
      meta.returnedFields.includes(field),
      `${field} er et felt motoren returnerer`,
    );
  }
});

for (const field of FIELDS) {
  test(`${field} matcher fixturen i alle 2500 caser (1e-9 relativt)`, () => {
    const cases = loadStudio();

    const result = report(
      `studio/${field}`,
      cases.map((c) => ({
        id: c.id,
        field,
        expected: c.out[field],
        actual: solveStudioGeometry(c.in)[field],
        tol: relativeTolerance(c.out[field]),
      })),
    );

    assertReport(result);
    assert.equal(result.total, cases.length, 'ingen case hoppet over');
  });
}

test('gradfeltene tåler også 1e-6 absolutt — men trenger det ikke', () => {
  const cases = loadStudio();

  const results = [];
  for (const c of cases) {
    const mine = solveStudioGeometry(c.in);
    for (const field of DEGREE_FIELDS) {
      results.push({
        id: c.id,
        field,
        expected: c.out[field],
        actual: mine[field],
        tol: DEGREE_ABSOLUTE_FALLBACK,
      });
    }
  }

  const result = report('studio/grader (1e-6 absolutt)', results);
  assertReport(result);

  // Poenget: fallbacken oppgaven tilbød er slakk vi ikke bruker.
  assert.equal(
    result.maxDeviation,
    0,
    'den absolutte fallbacken er unødvendig — avviket er 0, ikke bare < 1e-6',
  );
});

test('alle seks feltene er bit-eksakte — toleranse 0, avvik 0', () => {
  const cases = loadStudio();

  const results = [];
  for (const c of cases) {
    const mine = solveStudioGeometry(c.in);
    for (const field of FIELDS) {
      results.push({
        id: c.id,
        field,
        expected: c.out[field],
        actual: mine[field],
      });
    }
  }

  const result = report('studio/§8.1–8.4 bit-eksakt', results);

  assertReport(result);
  assert.equal(result.total, FIELDS.length * cases.length);
  assert.equal(result.total, 15000);
  assert.equal(
    result.maxDeviation,
    0,
    'maks absolutt avvik skal være nøyaktig 0, ikke bare lite',
  );
});

/* ── ULP-låsene ─────────────────────────────────────────────────────────── */

test('phi må være (deg * PI) / 180 — `deg * degToRad` mister caser', () => {
  const cases = loadStudio();

  // Alternativet: flight-motorens gruppering, brukt overalt i Studio.
  const missed = bitExactCount(cases, 'thetaAtImpact', (c) => {
    const phi = c.in.swingPlane * degToRad;
    const perDegree = studioRadius * Math.cos(phi) * degToRad;
    const eff = ballLowPointX(c.in.ballPositionCm) - c.in.swingDirection * perDegree;
    return impactTheta(eff);
  });

  assert.ok(
    missed < cases.length,
    `\`deg * degToRad\` skulle ikke reprodusere thetaAtImpact, men ga ${missed}/${cases.length}`,
  );

  // Og modulens egen konvensjon treffer alt.
  assert.equal(
    bitExactCount(cases, 'thetaAtImpact', (c) => solveStudioGeometry(c.in).thetaAtImpact),
    cases.length,
  );

  // De to konvensjonene gir faktisk ulike tall for planvinkler fixturen
  // bruker — ikke for alle (30, 55, 60, 61, 63 er like), men nok til å bite.
  const planes = [...new Set(cases.map((c) => c.in.swingPlane))];
  const differing = planes.filter((p) => swingPlaneRadians(p) !== p * degToRad);
  assert.ok(
    differing.length > 0,
    `minst én planvinkel må skille de to grupperingene, av ${planes}`,
  );
  assert.equal(swingPlaneRadians(55), 55 * degToRad, 'og noen er like — derav fellen');
});

test('perDegree må avslutte med * degToRad — `* Math.PI / 180` mister caser', () => {
  const cases = loadStudio();

  const missed = bitExactCount(cases, 'effectiveLowPointX', (c) => {
    const phi = swingPlaneRadians(c.in.swingPlane);
    const perDegree = (studioRadius * Math.cos(phi) * Math.PI) / 180;
    return shiftLowPointX(
      ballLowPointX(c.in.ballPositionCm),
      c.in.swingDirection,
      perDegree,
    );
  });

  assert.ok(
    missed < cases.length,
    `\`* Math.PI / 180\` i perDegree skulle ikke reprodusere effectiveLowPointX, men ga ${missed}/${cases.length}`,
  );

  assert.equal(
    bitExactCount(cases, 'effectiveLowPointX', (c) => solveStudioGeometry(c.in).effectiveLowPointX),
    cases.length,
  );
});

test('radianer → grader må være (rad * 180) / PI — `radToDeg` mister caser', () => {
  const cases = loadStudio();

  for (const field of DEGREE_FIELDS) {
    const missed = bitExactCount(cases, field, (c) => {
      const theta = impactTheta(
        shiftLowPointX(
          ballLowPointX(c.in.ballPositionCm),
          c.in.swingDirection,
          lowPointShiftPerDegree(c.in.swingPlane),
        ),
      );
      const k = arcDeliveryComponents(theta, c.in.swingPlane);
      const hypotenuse = Math.hypot(k.horizontalParallel, k.horizontalPerpendicular);

      return field === 'attackAngle'
        ? Math.atan2(k.vertical, hypotenuse) * radToDeg
        : c.in.swingDirection +
            Math.atan2(k.horizontalPerpendicular, k.horizontalParallel) * radToDeg;
    });

    assert.ok(
      missed < cases.length,
      `\`radToDeg\` skulle ikke reprodusere ${field}, men ga ${missed}/${cases.length}`,
    );
  }

  // Konstanten finnes i constants.js og er riktig for flight — men ikke her.
  assert.equal(radToDeg, 180 / Math.PI);
});

test('attackAngle krever Math.hypot — `sqrt(a² + b²)` mister caser', () => {
  const cases = loadStudio();

  const missed = bitExactCount(cases, 'attackAngle', (c) => {
    const theta = solveStudioGeometry(c.in).thetaAtImpact;
    const k = arcDeliveryComponents(theta, c.in.swingPlane);
    const manual = Math.sqrt(
      k.horizontalParallel * k.horizontalParallel +
        k.horizontalPerpendicular * k.horizontalPerpendicular,
    );
    return (Math.atan2(k.vertical, manual) * 180) / Math.PI;
  });

  assert.ok(
    missed < cases.length,
    `\`sqrt(a² + b²)\` skulle ikke reprodusere attackAngle, men ga ${missed}/${cases.length}`,
  );
});

test('cm → meter må dividere med 100 — `* 0.01` mister caser', () => {
  const cases = loadStudio();

  const missed = bitExactCount(
    cases,
    'lowPointX',
    (c) => (studioBallPositionOffsetCm - c.in.ballPositionCm) * 0.01,
  );

  assert.ok(
    missed < cases.length,
    `\`* 0.01\` skulle ikke reprodusere lowPointX, men ga ${missed}/${cases.length}`,
  );
  assert.equal(cmPerMetre, 100, 'konstanten er en divisor, ikke en faktor');
});

/* ── Kølle rører kun lowPointZ (nøkkelfaktumet) ─────────────────────────── */

test('iron og driver er bit-identiske i alt utenom lowPointZ', () => {
  const cases = loadStudio();
  const swingKey = (c) =>
    [
      c.in.swingPlane,
      c.in.swingDirection,
      c.in.ballPositionCm,
      c.in.arcHeightCm,
    ].join('|');

  const irons = new Map();
  const drivers = new Map();
  for (const c of cases) {
    (c.in.clubMode === 'iron' ? irons : drivers).set(swingKey(c), c);
  }
  assert.equal(irons.size, 1250);
  assert.equal(drivers.size, 1250);

  const shared = FIELDS.filter((f) => f !== 'lowPointZ');
  let pairs = 0;

  for (const [key, iron] of irons) {
    const driver = drivers.get(key);
    assert.ok(driver, `driver-motpart for ${key}`);
    pairs += 1;

    const mineIron = solveStudioGeometry(iron.in);
    const mineDriver = solveStudioGeometry(driver.in);

    for (const field of shared) {
      // Fixturen sier det …
      assert.equal(
        iron.out[field],
        driver.out[field],
        `fixtur: ${field} skal være lik for ${key}`,
      );
      // … og modulen gjør det samme.
      assert.equal(mineIron[field], mineDriver[field], `modul: ${field} for ${key}`);
    }

    assert.notEqual(
      iron.out.lowPointZ,
      driver.out.lowPointZ,
      `lowPointZ skal skille seg for ${key}`,
    );
    assert.notEqual(mineIron.lowPointZ, mineDriver.lowPointZ, `modul: lowPointZ ${key}`);
  }

  assert.equal(pairs, 1250);
});

test('clubMode inngår kun i clubLowPointZ', () => {
  // Strukturelt: de fem andre delfunksjonene tar ikke clubMode i det hele tatt.
  assert.equal(ballLowPointX.length, 1);
  assert.equal(lowPointShiftPerDegree.length, 1);
  assert.equal(impactTheta.length, 1);
  assert.equal(clubLowPointZ.length, 2);

  // arcZ0Cm har nøyaktig de to modusene fixturen bruker, med spec §8.1s verdier.
  assert.deepEqual(Object.keys(arcZ0Cm).sort(), ['driver', 'iron']);
  assert.deepEqual(loadStudioMeta().constants.arcZ0Cm, { iron: -0.2, driver: 1.8 });

  const modes = new Set(loadStudio().map((c) => c.in.clubMode));
  assert.deepEqual([...modes].sort(), ['driver', 'iron']);
});

/* ── Spec §8.1 UI-mapping ───────────────────────────────────────────────── */

test('spec §8.1: lowPointX og lowPointZ følger UI-mappingen ordrett', () => {
  for (const c of loadStudio()) {
    assert.equal(
      c.out.lowPointX,
      (10.5 - c.in.ballPositionCm) / 100,
      `${c.id} lowPointX mot spec §8.1`,
    );

    const specZ =
      c.in.clubMode === 'driver'
        ? (c.in.arcHeightCm + 1.8) / 100
        : (c.in.arcHeightCm - 0.2) / 100;
    assert.equal(c.out.lowPointZ, specZ, `${c.id} lowPointZ mot spec §8.1`);
  }

  assert.equal(studioBallPositionOffsetCm, 10.5);
  assert.equal(studioRadius, loadStudioMeta().constants.radiusM);
});

/* ── Clampen i §8.3: spec-belagt, ikke fixture-belagt ───────────────────── */

test('asin-clampen biter aldri i baseline — men grenen finnes', () => {
  const cases = loadStudio();

  let worst = 0;
  for (const c of cases) {
    const eff = solveStudioGeometry(c.in).effectiveLowPointX;
    worst = Math.max(worst, Math.abs(-eff / studioRadius));
  }

  assert.ok(
    worst < studioThetaSinClamp,
    `største |−eff/R| i baseline er ${worst}, under clampen ${studioThetaSinClamp}`,
  );

  // Grenen er spec §8.3 og reproduseres uendret, selv om ingen case treffer den.
  const saturated = Math.asin(studioThetaSinClamp);
  assert.equal(impactTheta(-studioRadius), saturated, 'positiv metning');
  assert.equal(impactTheta(studioRadius), -saturated, 'negativ metning');
  assert.equal(impactTheta(-1e9), saturated, 'langt utenfor buen metter også');
  assert.equal(impactTheta(1e9), -saturated);

  // Uten clamp ville asin gitt NaN utenfor [−1, 1]. Clampen er det som holder
  // theta endelig — ikke en kosmetisk grense.
  assert.ok(Number.isNaN(Math.asin(-1e9 / studioRadius)));
  assert.ok(Number.isFinite(impactTheta(-1e9)));
});

/* ── Fortegn og geometriske egenskaper, alle fixture-belagte ────────────── */

test('treff nøyaktig i low point gir null attack og club path', () => {
  // Ballposisjon lik offseten gir lowPointX = 0. Med swingDirection = 0 er
  // effectiveLowPointX = 0, altså treff nøyaktig i low point. Ingen slik case
  // finnes i fixturen (ballPositionCm er −20…20, aldri 10.5), så dette er en
  // egenskap ved modulen, ikke en fixture-påstand.
  const flat = solveStudioGeometry({
    swingPlane: 55,
    swingDirection: 0,
    ballPositionCm: studioBallPositionOffsetCm,
    arcHeightCm: 0,
    clubMode: 'iron',
  });

  for (const field of ['lowPointX', 'effectiveLowPointX', 'thetaAtImpact', 'attackAngle', 'clubPath']) {
    assert.ok(flat[field] === 0, `${field} skal være null, fikk ${flat[field]}`);
  }

  // FLYTTALLSDETALJ, ikke en bug å fikse: §8.3 negerer effectiveLowPointX før
  // divisjonen, så `−(+0)` gir `−0`. Fortegnet forplanter seg videre til
  // attackAngle, mens clubPath lander på `+0` fordi `swingDirection + (−0)`
  // er `+0`. Numerisk er alle fire null; bitmønsteret er ikke det samme.
  assert.ok(Object.is(flat.effectiveLowPointX, 0), 'effectiveLowPointX er +0');
  assert.ok(Object.is(flat.thetaAtImpact, -0), 'thetaAtImpact er −0');
  assert.ok(Object.is(flat.attackAngle, -0), 'attackAngle er −0');
  assert.ok(Object.is(flat.clubPath, 0), 'clubPath er +0');
});

test('fortegn: negativ theta gir nedadgående attack, positiv gir oppadgående', () => {
  // Fixture-belagt: theta og attackAngle har samme fortegn i alle 2500 caser
  // (swing plane er alltid i (0°, 90°), så sin(phi) > 0).
  for (const c of loadStudio()) {
    assert.ok(c.in.swingPlane > 0 && c.in.swingPlane < 90, `${c.id} plan i (0, 90)`);
    assert.equal(
      Math.sign(c.out.attackAngle),
      Math.sign(c.out.thetaAtImpact),
      `${c.id}: attack og theta skal ha samme fortegn`,
    );
  }
});

test('ballen lenger frem senker lowPointX og løfter thetaAtImpact', () => {
  // Fixture-belagt monotoni innen samme (plan, retning, buehøyde):
  // lowPointX faller strengt i ballPositionCm — og fordi §8.3 negerer
  // effectiveLowPointX før asin, STIGER thetaAtImpact strengt. Fortegnsbyttet
  // er selve poenget: ball lenger frem = treff senere på buen.
  const groups = new Map();
  for (const c of loadStudio()) {
    if (c.in.clubMode !== 'iron') continue;
    const key = `${c.in.swingPlane}|${c.in.swingDirection}|${c.in.arcHeightCm}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(c);
    else groups.set(key, [c]);
  }

  let compared = 0;
  for (const bucket of groups.values()) {
    const sorted = [...bucket].sort((a, b) => a.in.ballPositionCm - b.in.ballPositionCm);
    for (let i = 1; i < sorted.length; i += 1) {
      assert.ok(
        sorted[i].out.lowPointX < sorted[i - 1].out.lowPointX,
        `lowPointX faller: ${sorted[i].id}`,
      );
      assert.ok(
        sorted[i].out.thetaAtImpact > sorted[i - 1].out.thetaAtImpact,
        `thetaAtImpact stiger: ${sorted[i].id}`,
      );
      // Og modulen gjør det samme, ikke bare fixturen.
      assert.ok(
        solveStudioGeometry(sorted[i].in).thetaAtImpact >
          solveStudioGeometry(sorted[i - 1].in).thetaAtImpact,
        `modul: thetaAtImpact stiger ved ${sorted[i].id}`,
      );
      compared += 1;
    }
  }
  assert.ok(compared > 0, 'fixturen har grupper å sammenligne');
});

test('spec §8.2: flatere plane gir større forskyvning per grad', () => {
  const planes = [...new Set(loadStudio().map((c) => c.in.swingPlane))].sort(
    (a, b) => a - b,
  );
  assert.ok(planes.length >= 2);

  for (let i = 1; i < planes.length; i += 1) {
    assert.ok(
      lowPointShiftPerDegree(planes[i]) < lowPointShiftPerDegree(planes[i - 1]),
      `perDegree faller fra ${planes[i - 1]}° til ${planes[i]}°`,
    );
  }

  // 90° plane: cos(phi) ≈ 0, altså ingen horisontal forskyvning per grad.
  assert.ok(Math.abs(lowPointShiftPerDegree(90)) < 1e-17);
});

/* ── Delfunksjonene komponerer til solveStudioGeometry ──────────────────── */

test('delfunksjonene utgjør solveStudioGeometry, case for case', () => {
  for (const c of loadStudio()) {
    const lowPointX = ballLowPointX(c.in.ballPositionCm);
    const lowPointZ = clubLowPointZ(c.in.arcHeightCm, c.in.clubMode);
    const perDegree = lowPointShiftPerDegree(c.in.swingPlane);
    const effectiveLowPointX = shiftLowPointX(lowPointX, c.in.swingDirection, perDegree);
    const thetaAtImpact = impactTheta(effectiveLowPointX);
    const components = arcDeliveryComponents(thetaAtImpact, c.in.swingPlane);

    const assembled = {
      lowPointX,
      lowPointZ,
      effectiveLowPointX,
      thetaAtImpact,
      attackAngle: attackAngleFromComponents(components),
      clubPath: clubPathFromComponents(components, c.in.swingDirection),
    };

    assert.deepEqual(assembled, solveStudioGeometry(c.in), c.id);
    for (const field of FIELDS) {
      assert.equal(assembled[field], c.out[field], `${c.id}.${field}`);
    }
  }
});

test('arcDeliveryComponents er spec §8.4 ordrett', () => {
  for (const c of loadStudio()) {
    const theta = c.out.thetaAtImpact;
    const phi = swingPlaneRadians(c.in.swingPlane);
    const k = arcDeliveryComponents(theta, c.in.swingPlane);

    assert.equal(k.horizontalParallel, Math.cos(theta), `${c.id} hPar`);
    assert.equal(
      k.horizontalPerpendicular,
      -Math.sin(theta) * Math.cos(phi),
      `${c.id} hPerp`,
    );
    assert.equal(k.vertical, Math.sin(theta) * Math.sin(phi), `${c.id} vertical`);
  }
});

/* ── Renhet og kontrakt ─────────────────────────────────────────────────── */

test('returobjektet har nøyaktig de seks feltene og ingen presentasjonsdata', () => {
  const out = solveStudioGeometry({
    swingPlane: 55,
    swingDirection: 0,
    ballPositionCm: 0,
    arcHeightCm: 0,
    clubMode: 'iron',
  });

  assert.deepEqual(Object.keys(out).sort(), [...FIELDS].sort());

  // FUNN F6: fixturen smugler designsystemet ut gjennom motorgrensen.
  // Ingen av de feltene skal finnes her, verken direkte eller nøstet.
  const serialized = JSON.stringify(out);
  for (const forbidden of ['color', 'textColor', 'tip', 'pct', 'barPos', 'band', '#']) {
    assert.ok(!serialized.includes(forbidden), `ingen ${forbidden} i returobjektet`);
  }
  for (const value of Object.values(out)) {
    assert.equal(typeof value, 'number', 'bare tall ut');
  }

  // Fixturen HAR feltene — beviset på at utelatelsen er bevisst, ikke tilfeldig.
  const sample = loadStudio()[0];
  assert.equal(typeof sample.out.strikeQuality.color, 'string');
  assert.ok(sample.out.strikeQuality.color.startsWith('#'));
});

test('ren funksjon: ingen skjult tilstand, ingen mutasjon av input', () => {
  const input = {
    swingPlane: 61,
    swingDirection: -3,
    ballPositionCm: 1,
    arcHeightCm: -1,
    clubMode: 'driver',
  };
  const frozen = Object.freeze({ ...input });

  const first = solveStudioGeometry(frozen);
  const second = solveStudioGeometry(frozen);

  assert.deepEqual(first, second, 'samme input → samme output');
  assert.deepEqual(frozen, input, 'input er urørt');

  // Og rekkefølgen på kall spiller ingen rolle: kjør fixturen baklengs.
  const cases = loadStudio();
  for (let i = cases.length - 1; i >= 0; i -= 1) {
    const c = cases[i];
    for (const field of FIELDS) {
      assert.equal(solveStudioGeometry(c.in)[field], c.out[field], `${c.id}.${field}`);
    }
  }
});

test('alle 2500 caser gir endelige tall i alle seks feltene', () => {
  for (const c of loadStudio()) {
    const mine = solveStudioGeometry(c.in);
    for (const field of FIELDS) {
      assert.ok(Number.isFinite(mine[field]), `${c.id}.${field} er endelig`);
      assert.ok(Number.isFinite(c.out[field]), `fixtur ${c.id}.${field} er endelig`);
    }
  }
});
