/**
 * §5.6 — longitudinalLegacy mot flight-golden.json.
 *
 * Fixturen er fasit. Avviker modulen, er det modulen som har feil.
 *
 * Modulen isoleres: `ballSpeed` (§5.5) og `launchAngle` (§5.3) mates inn FRA
 * fixturens `out`, ikke regnes ut på nytt. `dynamicLoft` og `attackAngle` er
 * rå motorinput og tas fra `in`. En feil her peker derfor garantert på §5.6 og
 * ikke på smash- eller launch-modulen.
 *
 * TOLERANSE: 0. Alle 16 §5.6-feltene reproduseres bit-eksakt i alle 5028
 * caser. Oppgaven ba om 1e-9 relativt og åpnet for 1e-6 absolutt på grader og
 * rpm dersom 1e-9 var urealistisk stramt. Det var det ikke: maks relativt
 * avvik er eksakt 0 over 16 × 5028 = 80 448 sammenligninger. Den løsere porten
 * står som egen test lenger nede, slik at rapporten kan vise begge tallene.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, report } from './_fixture.js';
import {
  launchEfficiency,
  carryBallSpeedFit,
  carryFrom,
  apexBallSpeedTerm,
  apexLaunchTerm,
  apexLaunchFactor,
  apexFrom,
  verticalSpinLoft,
  landingSpinTerm,
  landingDomainTerm,
  landingRaw,
  landingAngleFrom,
  landingDeadTerms,
  rollFraction,
  rollFrom,
  totalFrom,
  solveLongitudinalLegacy,
} from '../src/longitudinalLegacy.js';
import {
  carryBallSpeedLinear,
  carryBallSpeedQuadratic,
  carryFullLaunchAtDeg,
  apexBasePerBallSpeed,
  apexLaunchPerBallSpeedDeg,
  landingBase,
  landingSpinAmplitude,
  landingSpinLoftTau,
  landingMinimum,
  landingMaximum,
  rollFracIntercept,
  rollFracLandingReferenceDeg,
  rollFracLandingSlope,
  rollFracMinimum,
  rollFracMaximum,
} from '../src/constants.js';

const CASE_COUNT = 5028;

/** Alle 16 feltene §5.6 eier i `out`. */
const FIELDS = Object.freeze([
  'carry',
  'apex',
  'total',
  'landingAngle',
  'rollFrac',
  'roll',
  'carryLaunchEfficiency',
  'carryBallSpeedFit',
  'apexBallSpeedTerm',
  'apexLaunchTerm',
  'apexLaunchFactor',
  'landingSpinTerm',
  'landingLaunchTerm',
  'landingApexTerm',
  'landingDomainTerm',
  'landingRaw',
]);

/** Modulens input for én case, hentet fra fixturen selv. */
function inputsFor(c) {
  return {
    ballSpeed: c.out.ballSpeed,
    launchAngle: c.out.launchAngle,
    dynamicLoft: c.in.dynamicLoft,
    attackAngle: c.in.attackAngle,
  };
}

/** Modulen kjørt over hver case. */
function solveAll() {
  return loadFlight().map((c) => ({
    id: c.id,
    group: c.group,
    in: c.in,
    out: c.out,
    got: solveLongitudinalLegacy(inputsFor(c)),
  }));
}

/* ── Bit-eksakthet, alle 5028 caser, alle 16 felt ───────────────────────── */

for (const field of FIELDS) {
  test(`${field} er bit-eksakt i alle caser`, () => {
    const results = solveAll().map(({ id, out, got }) => ({
      id,
      field,
      expected: out[field],
      actual: got[field],
    }));

    const r = report(`flight/${field}`, results);
    assert.equal(r.total, CASE_COUNT, r.summary);
    assert.ok(r.ok, r.summary);
    assert.equal(r.maxDeviation, 0, r.summary);
  });
}

/* ── Den etterspurte relative porten ────────────────────────────────────── */

test('alle 16 feltene ligger innenfor 1e-9 relativt', () => {
  const RELATIVE_TOLERANCE = 1e-9;
  let maxRelative = 0;

  const results = [];
  for (const { id, out, got } of solveAll()) {
    for (const field of FIELDS) {
      const expected = out[field];
      const actual = got[field];
      // Relativt mot |expected|, med absolutt fallback når expected er 0
      // (382 caser uten flukt har 0 i de fleste av disse feltene).
      const scale = Math.abs(expected) > 0 ? Math.abs(expected) : 1;
      const relative = Math.abs(actual - expected) / scale;
      if (relative > maxRelative) maxRelative = relative;
      results.push({
        id,
        field,
        expected,
        actual,
        pass: relative <= RELATIVE_TOLERANCE,
      });
    }
  }

  const r = report('flight/longitudinal-relative-1e-9', results);
  assert.equal(r.total, CASE_COUNT * FIELDS.length, r.summary);
  assert.ok(r.ok, r.summary);
  assert.equal(maxRelative, 0, `maks relativt avvik ${maxRelative}`);
});

test('grader og yard trenger ikke den løsere 1e-6-porten', () => {
  // Oppgaven åpnet for 1e-6 absolutt på vinkler. Ingen av dem trenger den:
  // maks absolutt avvik er 0 på landingAngle og landingRaw også.
  let maxAbsolute = 0;
  for (const { out, got } of solveAll()) {
    for (const field of FIELDS) {
      const d = Math.abs(got[field] - out[field]);
      if (d > maxAbsolute) maxAbsolute = d;
    }
  }
  assert.equal(maxAbsolute, 0, `maks absolutt avvik ${maxAbsolute}`);
});

test('ingen ikke-endelige tall slipper ut', () => {
  // Fixturen inneholder ikke ett eneste. Det skal ikke modulen heller.
  for (const { id, got } of solveAll()) {
    for (const field of FIELDS) {
      assert.ok(Number.isFinite(got[field]), `${field} i ${id}: ${got[field]}`);
    }
  }
});

/* ── Feller som skal forbli reprodusert ─────────────────────────────────── */

test('carryBallSpeedFit: kvadratleddet må grupperes som k × (B × B)', () => {
  // ULP-felle, samme form som i §5.5. Den venstreassosiative varianten ser
  // identisk ut og er det ikke.
  const leftAssociative = (b) =>
    carryBallSpeedLinear * b + carryBallSpeedQuadratic * b * b;

  let broken = 0;
  for (const c of loadFlight()) {
    if (!Object.is(leftAssociative(c.out.ballSpeed), c.out.carryBallSpeedFit)) {
      broken += 1;
    }
  }
  assert.equal(broken, 728, 'caser den venstreassosiative formen ville brutt');

  // …og modulens egen form bryter ingen. `B ** 2` er også bit-identisk.
  assert.equal(
    loadFlight().filter(
      (c) => !Object.is(carryBallSpeedFit(c.out.ballSpeed), c.out.carryBallSpeedFit),
    ).length,
    0,
  );
  for (const c of loadFlight()) {
    const withExponent =
      carryBallSpeedLinear * c.out.ballSpeed +
      carryBallSpeedQuadratic * c.out.ballSpeed ** 2;
    assert.ok(Object.is(withExponent, c.out.carryBallSpeedFit), c.id);
  }
});

test('apex-leddene må multipliseres venstre mot høyre', () => {
  let baseBroken = 0;
  let launchBroken = 0;

  for (const c of loadFlight()) {
    const e = c.out.carryLaunchEfficiency;
    const b = c.out.ballSpeed;
    const l = Math.max(0, c.out.launchAngle);

    // k × (B × e) i stedet for (k × B) × e
    if (!Object.is(apexBasePerBallSpeed * (b * e), c.out.apexBallSpeedTerm)) {
      baseBroken += 1;
    }
    // k × B × (L × e) i stedet for ((k × B) × L) × e
    if (
      !Object.is(apexLaunchPerBallSpeedDeg * b * (l * e), c.out.apexLaunchTerm)
    ) {
      launchBroken += 1;
    }
  }

  assert.equal(baseBroken, 360, 'caser omgruppert apexBallSpeedTerm ville brutt');
  assert.equal(launchBroken, 299, 'caser omgruppert apexLaunchTerm ville brutt');
});

test('apexLaunchFactor er en målt ratio, ikke en lukket form', () => {
  const closedForm = (l) =>
    1 + (apexLaunchPerBallSpeedDeg / apexBasePerBallSpeed) * Math.max(0, l);
  const halfClosed = (o) =>
    o.apexBallSpeedTerm === 0
      ? 1
      : 1 + o.apexLaunchTerm / o.apexBallSpeedTerm;

  let closedBroken = 0;
  let halfBroken = 0;
  for (const c of loadFlight()) {
    if (!Object.is(closedForm(c.out.launchAngle), c.out.apexLaunchFactor)) {
      closedBroken += 1;
    }
    if (!Object.is(halfClosed(c.out), c.out.apexLaunchFactor)) {
      halfBroken += 1;
    }
  }
  assert.equal(closedBroken, 1747, 'caser den lukkede formen ville brutt');
  assert.equal(halfBroken, 1551, 'caser 1 + launch/base ville brutt');

  // Beviset fixturen selv gir: en lukket form av launch alene kan ikke
  // produsere flere distinkte faktorer enn det finnes launch-vinkler.
  const launches = new Set(loadFlight().map((c) => c.out.launchAngle));
  const factors = new Set(loadFlight().map((c) => c.out.apexLaunchFactor));
  assert.equal(launches.size, 59, 'distinkte launch-vinkler');
  assert.equal(factors.size, 132, 'distinkte apexLaunchFactor');
  assert.ok(factors.size > launches.size);
});

test('apex er summen, ikke basisleddet ganget med faktoren', () => {
  let broken = 0;
  for (const c of loadFlight()) {
    if (
      !Object.is(c.out.apexBallSpeedTerm * c.out.apexLaunchFactor, c.out.apex)
    ) {
      broken += 1;
    }
  }
  assert.equal(broken, 479, 'caser rundturen base × faktor ville brutt');
});

test('total er carry + roll, IKKE carry × (1 + rollFrac)', () => {
  // Spec §5.6 skriver `Total = Carry × (1 + rollFraction)`. Motoren gjør det
  // ikke. Dette er et dokumentert avvik mellom spec-tekst og motor.
  let distributedBroken = 0;
  for (const c of loadFlight()) {
    if (!Object.is(c.out.carry * (1 + c.out.rollFrac), c.out.total)) {
      distributedBroken += 1;
    }
  }
  assert.equal(distributedBroken, 1443, 'caser spec-formen ville brutt');

  // Følgen: subtraksjon gjenskaper ikke roll.
  let subtractionBroken = 0;
  for (const c of loadFlight()) {
    if (!Object.is(c.out.total - c.out.carry, c.out.roll)) {
      subtractionBroken += 1;
    }
  }
  assert.equal(subtractionBroken, 4492, 'caser total − carry ≠ roll');
});

test('landingRaw er UKLAMPET og skiller seg fra landingAngle', () => {
  let differ = 0;
  for (const c of loadFlight()) {
    if (!Object.is(c.out.landingRaw, c.out.landingAngle)) differ += 1;
  }
  assert.equal(differ, 455, 'caser der klampen løfter vinkelen');

  // …og det er nøyaktig de casene der den rå modellen ligger under gulvet.
  let belowFloor = 0;
  for (const c of loadFlight()) {
    if (c.out.carry > 0 && c.out.landingRaw < landingMinimum) belowFloor += 1;
  }
  assert.equal(belowFloor, 455);
});

test('landingDomainTerm nuller ut det UKLAMPEDE leddet', () => {
  // Bruker man −clamp(model, 32, 60) i stedet, brytes 254 caser.
  const clampedVariant = (o) =>
    o.carry > 0
      ? 0
      : -Math.min(
          Math.max(landingBase + o.landingSpinTerm, landingMinimum),
          landingMaximum,
        );

  let broken = 0;
  for (const c of loadFlight()) {
    if (!Object.is(clampedVariant(c.out), c.out.landingDomainTerm)) broken += 1;
  }
  assert.equal(broken, 254, 'caser den klampede varianten ville brutt');
});

test('landingsklampen er USYNLIG for rollFrac i baseline', () => {
  // Modulen mater den KLAMPEDE `landingAngle` inn i rollFrac, slik motoren
  // gjør. Baseline kan ikke skille de to valgene: fixturen har 0 caser der
  // `landingRaw` ville gitt en annen `rollFrac`.
  const fromRaw = (o) =>
    o.carry > 0
      ? Math.min(
          Math.max(
            rollFracIntercept -
              (o.landingRaw - rollFracLandingReferenceDeg) *
                rollFracLandingSlope,
            rollFracMinimum,
          ),
          rollFracMaximum,
        )
      : 0;

  let broken = 0;
  for (const c of loadFlight()) {
    if (!Object.is(fromRaw(c.out), c.out.rollFrac)) broken += 1;
  }
  assert.equal(broken, 0, 'landingRaw-varianten er ikke observerbar i baseline');

  // Grunnen, og hvorfor det ikke er en tilfeldighet man kan lene seg på:
  // roll-taket 0.055 metter under 35° landingsvinkel, og landingsgulvet
  // ligger på 32°. Alle 455 klampede caser ligger dermed på feil side av
  // METNINGEN uansett om man leser rå eller klampet vinkel.
  const saturationDeg =
    rollFracLandingReferenceDeg -
    (rollFracMaximum - rollFracIntercept) / rollFracLandingSlope;
  assert.equal(saturationDeg, 35, 'landingsvinkel der roll-taket metter');
  assert.ok(landingMinimum < saturationDeg, 'gulvet ligger under metningen');

  const clamped = loadFlight().filter(
    (c) => c.out.carry > 0 && c.out.landingRaw < landingMinimum,
  );
  assert.equal(clamped.length, 455);
  for (const c of clamped) {
    assert.equal(c.out.rollFrac, rollFracMaximum, c.id);
  }

  // ⚠ Løftes landingsgulvet over 35° i en senere fase, blir valget plutselig
  // observerbart. Denne testen er varselet: da må den skrives om bevisst, og
  // det klampede valget beholdes — det er motorens.
  const observable = loadFlight().filter(
    (c) => c.out.carry > 0 && c.out.landingAngle >= 32 && c.out.landingAngle < 35,
  );
  assert.equal(observable.length, 531, 'caser i metningssonen');
});

test('§5.6 bruker VERTIKAL spin loft, ikke spinLoft3DDeg', () => {
  // Negativ kontroll, samme felle som i §5.5 speilvendt. Der er det den
  // 3-dimensjonale som gjelder; her er det den vertikale.
  let differentLoft = 0;
  let mismatched = 0;

  for (const c of loadFlight()) {
    if (!Object.is(c.out.spinLoft3DDeg, c.out.signedVerticalSpinLoftDeg)) {
      differentLoft += 1;
    }
    if (!Object.is(landingSpinTerm(c.out.spinLoft3DDeg), c.out.landingSpinTerm)) {
      mismatched += 1;
    }
  }

  assert.equal(differentLoft, 4392, 'caser der 3-D og vertikal spin loft er ulike');
  assert.equal(mismatched, 4370, 'caser den 3-dimensjonale ville brutt');

  // abs(signedVerticalSpinLoftDeg) er derimot identisk med modulens egen.
  for (const c of loadFlight()) {
    assert.ok(
      Object.is(
        verticalSpinLoft(c.in.dynamicLoft, c.in.attackAngle),
        Math.abs(c.out.signedVerticalSpinLoftDeg),
      ),
      c.id,
    );
  }
});

/* ── Klamper og modellgrenser ───────────────────────────────────────────── */

test('launch-effektiviteten metter i 3715 av 5028 caser', () => {
  // FUNN-nivå. Over 10° launch skiller modellen ikke lenger mellom to slag.
  let saturated = 0;
  let zero = 0;
  for (const c of loadFlight()) {
    if (Math.max(0, c.out.launchAngle) / carryFullLaunchAtDeg > 1) {
      saturated += 1;
      assert.equal(c.out.carryLaunchEfficiency, 1, `metning i ${c.id}`);
    }
    if (c.out.carryLaunchEfficiency === 0) {
      zero += 1;
      assert.equal(c.out.carry, 0, `null carry i ${c.id}`);
    }
  }
  assert.equal(saturated, 3715, 'caser over 10° launch');
  assert.equal(zero, 381, 'caser med launch ≤ 0°');
});

test('landingsklampen: gulvet fyrer 455 ganger, taket aldri', () => {
  let low = 0;
  let high = 0;
  for (const c of loadFlight()) {
    if (c.out.carry <= 0) continue;
    const raw = landingBase + c.out.landingSpinTerm;
    if (raw < landingMinimum) {
      low += 1;
      assert.equal(c.out.landingAngle, landingMinimum, `gulv i ${c.id}`);
    }
    if (raw > landingMaximum) high += 1;
  }
  assert.equal(low, 455, 'caser klampet til 32°');
  // Modellen har asymptote 52.8° og kan aldri nå 60°. Taket er dødt, men
  // beholdes fordi motoren har det.
  assert.equal(high, 0, 'taket på 60° fyrer ikke i baseline');
});

test('rollFrac-klampen: taket fyrer 531 ganger, gulvet aldri', () => {
  let low = 0;
  let high = 0;
  for (const c of loadFlight()) {
    if (c.out.carry <= 0) continue;
    const raw =
      rollFracIntercept -
      (c.out.landingAngle - rollFracLandingReferenceDeg) * rollFracLandingSlope;
    if (raw < rollFracMinimum) low += 1;
    if (raw > rollFracMaximum) {
      high += 1;
      assert.equal(c.out.rollFrac, rollFracMaximum, `tak i ${c.id}`);
    }
  }
  assert.equal(high, 531, 'caser klampet til 0.055');
  // Ville krevd landingsvinkel over 63.7°. Modellen kommer aldri dit.
  assert.equal(low, 0, 'gulvet på 0.012 fyrer ikke i baseline');
});

test('landingsvinkelen er blind for apex og carry', () => {
  // De to leddene som skulle koblet dem inn er hardkodet 0. Det betyr at to
  // slag med samme vertikale spin loft får identisk landingsvinkel uansett
  // hvor høyt eller langt de går. Kjent modellgrense, ikke en bug å fikse her.
  for (const c of loadFlight()) {
    assert.equal(c.out.landingLaunchTerm, 0, c.id);
    assert.equal(c.out.landingApexTerm, 0, c.id);
  }
  assert.deepEqual(landingDeadTerms, {
    landingLaunchTerm: 0,
    landingApexTerm: 0,
  });

  const byLoft = new Map();
  for (const c of loadFlight()) {
    if (c.out.carry <= 0) continue;
    const key = verticalSpinLoft(c.in.dynamicLoft, c.in.attackAngle);
    const seen = byLoft.get(key);
    if (seen === undefined) {
      byLoft.set(key, c.out.landingAngle);
    } else {
      assert.ok(Object.is(seen, c.out.landingAngle), `spin loft ${key}`);
    }
  }
  assert.ok(byLoft.size > 0);
});

/* ── Degenererte caser ──────────────────────────────────────────────────── */

test('382 caser uten flukt gir null overalt — men spinnleddet står', () => {
  const noFlight = loadFlight().filter((c) => c.out.carry === 0);
  assert.equal(noFlight.length, 382, 'caser med carry 0');

  for (const c of noFlight) {
    const got = solveLongitudinalLegacy(inputsFor(c));
    for (const field of [
      'carry',
      'apex',
      'total',
      'landingAngle',
      'rollFrac',
      'roll',
      'apexBallSpeedTerm',
      'apexLaunchTerm',
      'landingRaw',
    ]) {
      assert.equal(got[field], 0, `${field} i ${c.id}`);
    }
    assert.equal(got.apexLaunchFactor, 1, `apexLaunchFactor i ${c.id}`);
    assert.ok(got.landingSpinTerm < 0, `landingSpinTerm i ${c.id}`);
    assert.ok(got.landingDomainTerm !== 0, `landingDomainTerm i ${c.id}`);
  }
});

test('ballSpeed 0 med positiv launch gir 0/0-vakten', () => {
  // `edge.club-speed-zero`: launch er 13.25°, altså effektivitet 1, men
  // ballhastigheten er 0. Nevneren i apexLaunchFactor blir 0 og telleren 0.
  // Vakten står på nevneren, ikke på effektiviteten.
  const zero = loadFlight().filter((c) => c.out.ballSpeed === 0);
  assert.equal(zero.length, 1, 'baseline har én ball-speed-zero-case');

  const c = zero[0];
  assert.equal(c.id, 'edge.club-speed-zero');

  const got = solveLongitudinalLegacy(inputsFor(c));
  assert.equal(got.carryLaunchEfficiency, 1, 'effektiviteten er full');
  assert.equal(got.apexBallSpeedTerm, 0, 'nevneren er 0');
  assert.equal(got.apexLaunchFactor, 1, 'vakten mot 0/0 = NaN');
  assert.ok(Number.isFinite(got.apexLaunchFactor));
  assert.equal(got.carry, 0);
  assert.equal(got.total, 0);
});

test('alle 382 nevner-null-casene har faktor eksakt 1', () => {
  const denominatorZero = loadFlight().filter(
    (c) => c.out.apexBallSpeedTerm === 0,
  );
  assert.equal(denominatorZero.length, 382);
  for (const c of denominatorZero) {
    assert.equal(c.out.apexLaunchFactor, 1, c.id);
  }
});

/* ── Modulgrensen ───────────────────────────────────────────────────────── */

test('delfunksjonene komponerer til solveLongitudinalLegacy', () => {
  for (const c of loadFlight()) {
    const { ballSpeed, launchAngle, dynamicLoft, attackAngle } = inputsFor(c);

    const efficiency = launchEfficiency(launchAngle);
    const fit = carryBallSpeedFit(ballSpeed);
    const carry = carryFrom(fit, efficiency);
    const baseTerm = apexBallSpeedTerm(ballSpeed, efficiency);
    const launchTerm = apexLaunchTerm(ballSpeed, launchAngle, efficiency);
    const apex = apexFrom(baseTerm, launchTerm);
    const hasFlight = carry > 0;
    const spinTerm = landingSpinTerm(verticalSpinLoft(dynamicLoft, attackAngle));
    const domainTerm = landingDomainTerm(hasFlight, spinTerm);
    const raw = landingRaw(
      spinTerm,
      landingDeadTerms.landingLaunchTerm,
      landingDeadTerms.landingApexTerm,
      domainTerm,
    );
    const landingAngle = landingAngleFrom(hasFlight, raw);
    const rollFrac = rollFraction(carry, landingAngle);
    const roll = rollFrom(carry, rollFrac);

    const whole = solveLongitudinalLegacy(inputsFor(c));

    assert.ok(Object.is(whole.carryLaunchEfficiency, efficiency), c.id);
    assert.ok(Object.is(whole.carryBallSpeedFit, fit), c.id);
    assert.ok(Object.is(whole.carry, carry), c.id);
    assert.ok(Object.is(whole.apexBallSpeedTerm, baseTerm), c.id);
    assert.ok(Object.is(whole.apexLaunchTerm, launchTerm), c.id);
    assert.ok(Object.is(whole.apex, apex), c.id);
    assert.ok(Object.is(whole.apexLaunchFactor, apexLaunchFactor(apex, baseTerm)), c.id);
    assert.ok(Object.is(whole.landingSpinTerm, spinTerm), c.id);
    assert.ok(Object.is(whole.landingDomainTerm, domainTerm), c.id);
    assert.ok(Object.is(whole.landingRaw, raw), c.id);
    assert.ok(Object.is(whole.landingAngle, landingAngle), c.id);
    assert.ok(Object.is(whole.rollFrac, rollFrac), c.id);
    assert.ok(Object.is(whole.roll, roll), c.id);
    assert.ok(Object.is(whole.total, totalFrom(carry, roll)), c.id);
  }
});

test('returobjektet har nøyaktig de 16 feltene og ingen presentasjonsdata', () => {
  const got = solveLongitudinalLegacy({
    ballSpeed: 120,
    launchAngle: 17,
    dynamicLoft: 28,
    attackAngle: -4,
  });
  assert.deepEqual(Object.keys(got).sort(), [...FIELDS].sort());
  for (const v of Object.values(got)) assert.equal(typeof v, 'number');
});

test('modulen er ren — samme input gir samme output, ingen deling av tilstand', () => {
  const input = {
    ballSpeed: 133.7,
    launchAngle: 12.25,
    dynamicLoft: 24,
    attackAngle: -3,
  };
  const a = solveLongitudinalLegacy(input);
  const b = solveLongitudinalLegacy({ ...input });
  assert.deepEqual(a, b);
  assert.notEqual(a, b, 'to kall skal ikke dele objekt');
  assert.deepEqual(input, {
    ballSpeed: 133.7,
    launchAngle: 12.25,
    dynamicLoft: 24,
    attackAngle: -3,
  });
});

test('konstantene er de fixturen oppgir', () => {
  const c = loadFlight()[0].out;
  assert.equal(carryBallSpeedLinear, c.carryBallSpeedLinear);
  assert.equal(carryBallSpeedQuadratic, c.carryBallSpeedQuadratic);
  assert.equal(carryFullLaunchAtDeg, c.carryFullLaunchAtDeg);
  assert.equal(apexBasePerBallSpeed, c.apexBasePerBallSpeed);
  assert.equal(apexLaunchPerBallSpeedDeg, c.apexLaunchPerBallSpeedDeg);
  assert.equal(landingBase, c.landingBase);
  assert.equal(landingSpinLoftTau, c.landingSpinLoftTau);

  // Fixturen eksponerer ikke amplituden direkte, bare det avledede leddet.
  // Den utledes av en case med kjent vertikal spin loft.
  assert.equal(
    landingSpinAmplitude,
    -c.landingSpinTerm /
      Math.exp(-Math.abs(c.dynamicLoft - c.attackAngle) / landingSpinLoftTau),
  );

  // De fem øvrige klampegrensene er spec-tall §5.6; fixturen har dem bare
  // implisitt gjennom klampene, som testene over verifiserer.
  assert.equal(landingMinimum, 32);
  assert.equal(landingMaximum, 60);
  assert.equal(rollFracIntercept, 0.04);
  assert.equal(rollFracLandingReferenceDeg, 45);
  assert.equal(rollFracLandingSlope, 0.0015);
  assert.equal(rollFracMinimum, 0.012);
  assert.equal(rollFracMaximum, 0.055);
});

test('inputvalget er dokumentert: in og out er enige om loft og angrep', () => {
  // Testen mater dynamicLoft og attackAngle fra `in`. Hadde `out` avveket,
  // ville isolasjonen vært en illusjon.
  for (const c of loadFlight()) {
    assert.ok(Object.is(c.in.dynamicLoft, c.out.dynamicLoft), c.id);
    assert.ok(Object.is(c.in.attackAngle, c.out.attackAngle), c.id);
  }
});
