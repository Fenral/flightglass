/**
 * §5.7 Aerodynamiske koeffisienter — mot golden-fixturen.
 *
 * ── Hvordan denne testen kan måle noe i det hele tatt ───────────────────────
 * Fixturen inneholder ikke Cd, Cl, Reynolds eller S per steg. Den inneholder to
 * aggregater per case:
 *
 *   out.aerodynamicDiagnostics.reynoldsRangeObserved      [min, maks]
 *   out.aerodynamicDiagnostics.spinParameterRangeObserved [min, maks]
 *
 * — altså ekstremverdiene over hele RK4-banen. De er likevel en HARD test på
 * koeffisientene, fordi Cd og Cl former banen: endres de, endres farten, og
 * endres farten, flytter begge intervallene seg. Målt sensitivitet (test
 * «tannsjekk» lenger nede): 1 ppm feil i Cd gir opptil 7.8e-6 relativt avvik i
 * intervallene — 9 størrelsesordener over støygulvet på 2.6e-15. Toleransen på
 * 1e-9 fanger altså en Cd-feil ned mot ~1e-10 relativt i de mest følsomme
 * banene, og ~1.3e-8 i de minst følsomme.
 *
 * To av testene måler modulen uten RK4 i det hele tatt:
 *
 *   - Reynolds ved t=0 er ALLTID nøyaktig `reynoldsRangeObserved[1]`. Ballen
 *     bremser fra start, så startfarten er maksfarten. 5027/5027 bit-eksakt.
 *     Det er en direkte, akkumuleringsfri fasit på `reynoldsNumber`.
 *   - S ved t=0 må ligge inne i det observerte intervallet, og er et eksakt
 *     endepunkt i 4022 av 5027 caser.
 *
 * ── RK4-harnesset ──────────────────────────────────────────────────────────
 * `integrateRK4` lenger nede i filen er TESTSTILLAS, ikke en modul. Den finnes
 * bare for å drive `aeroStep` over ekte baner. Startbetingelsene tas fra
 * fixturens egne `out`-felt (ballSpeed, launchAngle, startDirection,
 * spinAxisUnit, totalSpinRpm) — ikke fra en reimplementasjon av §5.1–5.4 — slik
 * at det som faktisk måles er koeffisientbroen og ingenting annet. Når
 * integratormodulen er ferdig, skal den erstatte stillaset her, ikke omvendt.
 *
 * Kraftleddene i stillaset (dynamisk trykk, løftretning, RK4-summen,
 * ω₀-renormaliseringen) er integratorens flyttallsvalg, ikke koeffisientenes.
 * De er satt til de formene som reproduserer flest caser: 3112 av 5028 er
 * bit-eksakte hele veien, 4072 har bit-eksakt flukttid.
 *
 * ── Toleranse ──────────────────────────────────────────────────────────────
 * Oppgaven ba om 1e-9 relativt. Det holdt, med stor margin: største faktiske
 * relative avvik over alle 5028 caser er 2.58e-15, altså ~12 ULP akkumulert
 * over opptil 1100 steg × 4 derivatkall. Reserven på 1e-6 absolutt for grader
 * og rpm trengtes ikke — ingen av feltene her er grader eller rpm.
 *
 * Merk at ABSOLUTT toleranse er feil verktøy her: Reynolds er ~1e5, S er ~1e-1.
 * Samme relative presisjon gir 4.4e-11 absolutt på Reynolds og 4e-16 på S.
 * Derfor er hver eneste sammenligning relativ.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadFlight, loadFlightErrors, report } from './_fixture.js';
import {
  airDensity,
  ballMass,
  ballRadius,
  gravity,
  kinematicViscosity,
  maxFlightTime,
  rk4InitialHeight,
  rk4Step,
  spinDecay,
  mphToMps,
  degToRad,
  rpmToRadPerSec,
  reynoldsValidity,
  spinParameterValidity,
  dragCompatibilityScale,
  aeroModelIdentity,
  wind,
} from '../src/constants.js';
import {
  aerodynamicDiagnostics,
  aeroStep,
  dragBridge,
  dragCoefficient,
  emptyAeroObservation,
  isExtrapolated,
  liftCoefficient,
  observeAero,
  observedAeroRanges,
  perpendicularSpin,
  reynoldsNumber,
  spinParameter,
  withinValidity,
} from '../src/aero-reference.js';

/** Oppgavens toleranse. Brukes relativt: tol = RELATIVE × |expected|. */
const RELATIVE_TOLERANCE = 1e-9;

/** Reserven oppgaven tillot for grader/rpm. Ikke i bruk — ingen slike felt her. */
const ABSOLUTE_DEGREE_FALLBACK = 1e-6;

const relativeTol = (expected) => RELATIVE_TOLERANCE * Math.abs(expected);

/* ═════════════════════════════════════════════════════════════════════════
 * RK4-teststillas. Ikke en modul. Se filhodet.
 * ═════════════════════════════════════════════════════════════════════════ */

/** π·r², hentet ut av løkken slik integratoren gjør det. */
const ballCrossSectionArea = Math.PI * ballRadius * ballRadius;

/** Tyngdeakselerasjonen som vektor. */
const gravityAcceleration = [0, 0, -gravity];

/**
 * `ω₀` og dens enhetsretning. ENGINE-GAPS §1: retningen holdes fast på
 * `unit(ω₀)` — og den normaliseres på nytt, selv om `spinAxisUnit` allerede har
 * lengde 1. De to skiller seg med 1 ULP, og renormaliseringen er den som
 * reproduserer flest caser.
 */
function spinAxis(out) {
  const magnitudeRadPerSec = out.totalSpinRpm * rpmToRadPerSec;
  const u = out.spinAxisUnit;
  const omega = [
    u[0] * magnitudeRadPerSec,
    u[1] * magnitudeRadPerSec,
    u[2] * magnitudeRadPerSec,
  ];
  const magnitude = Math.hypot(omega[0], omega[1], omega[2]);
  if (!(magnitude > 0)) return { magnitude: 0, direction: [0, 0, 0] };
  return {
    magnitude,
    direction: [
      omega[0] / magnitude,
      omega[1] / magnitude,
      omega[2] / magnitude,
    ],
  };
}

/**
 * Startbetingelsene fra ENGINE-GAPS §1, bygget av fixturens egne out-felt.
 * Spinnretningen holdes fast; bare størrelsen forfaller.
 */
function initialState(out) {
  const speed = out.ballSpeed * mphToMps;
  const elevation = out.launchAngle * degToRad;
  const azimuth = out.startDirection * degToRad;
  const spin = spinAxis(out);
  return {
    state: [
      0,
      0,
      rk4InitialHeight,
      speed * Math.cos(elevation) * Math.sin(azimuth),
      speed * Math.cos(elevation) * Math.cos(azimuth),
      speed * Math.sin(elevation),
      spin.magnitude,
    ],
    spinDirection: spin.direction,
  };
}

/**
 * Derivatet. Kaller `aeroStep` og observerer prøven — HVERT kall, alle fire
 * RK4-stadier. Kraftleddene her tilhører integratormodulen, ikke denne testen
 * og ikke `aeroCoefficients`; de står her fordi banen ikke finnes uten dem.
 *
 * `dragScale` er ALLTID 1 i de ekte sammenligningene. Den finnes bare for
 * tannsjekken, som må kunne forgifte Cd med en kjent faktor og se om
 * aggregatene reagerer.
 */
function derivative(state, spinDirection, observed, dragScale) {
  const [, , , vx, vy, vz, spinMagnitude] = state;
  const spin = [
    spinDirection[0] * spinMagnitude,
    spinDirection[1] * spinMagnitude,
    spinDirection[2] * spinMagnitude,
  ];
  const sample = aeroStep([vx, vy, vz], spin, wind);

  let ax = 0;
  let ay = 0;
  let az = -gravity;

  if (sample !== null) {
    observed.value = observeAero(observed.value, sample);

    const dynamicPressureArea =
      0.5 * airDensity * ballCrossSectionArea * (sample.speed * sample.speed);

    const dragMagnitude = -(
      dynamicPressureArea *
      (sample.dragCoefficient * dragScale)
    );
    const dragX = dragMagnitude * sample.unitAirVelocity[0];
    const dragY = dragMagnitude * sample.unitAirVelocity[1];
    const dragZ = dragMagnitude * sample.unitAirVelocity[2];

    // unit(ω × airVelocity) — det fulle krysset, ikke ω⊥ × v. Merk at DENNE
    // normen er `Math.sqrt(Σx²)` og ikke `Math.hypot`, motsatt av de to normene
    // inne i `aeroCoefficients`. Blandingen finnes i dagens motor.
    const crossX = spin[1] * vz - spin[2] * vy;
    const crossY = spin[2] * vx - spin[0] * vz;
    const crossZ = spin[0] * vy - spin[1] * vx;
    const crossLength = Math.sqrt(
      crossX * crossX + crossY * crossY + crossZ * crossZ,
    );

    let liftX = 0;
    let liftY = 0;
    let liftZ = 0;
    if (crossLength > 0) {
      const liftMagnitude = dynamicPressureArea * sample.liftCoefficient;
      liftX = liftMagnitude * (crossX / crossLength);
      liftY = liftMagnitude * (crossY / crossLength);
      liftZ = liftMagnitude * (crossZ / crossLength);
    }

    const inverseMass = 1 / ballMass;
    ax = (dragX + liftX) * inverseMass + gravityAcceleration[0];
    ay = (dragY + liftY) * inverseMass + gravityAcceleration[1];
    az = (dragZ + liftZ) * inverseMass + gravityAcceleration[2];
  }

  return [vx, vy, vz, ax, ay, az, -spinDecay * spinMagnitude];
}

/** Fast steg, stopper ved første kryssing av bakken. */
function integrateRK4(out, dragScale = 1) {
  const { state: start, spinDirection } = initialState(out);
  const observed = { value: emptyAeroObservation };
  const half = rk4Step / 2;

  let state = start;
  let t = 0;

  while (t < maxFlightTime) {
    const k1 = derivative(state, spinDirection, observed, dragScale);
    const s2 = new Array(7);
    for (let i = 0; i < 7; i += 1) s2[i] = state[i] + k1[i] * half;
    const k2 = derivative(s2, spinDirection, observed, dragScale);
    const s3 = new Array(7);
    for (let i = 0; i < 7; i += 1) s3[i] = state[i] + k2[i] * half;
    const k3 = derivative(s3, spinDirection, observed, dragScale);
    const s4 = new Array(7);
    for (let i = 0; i < 7; i += 1) s4[i] = state[i] + k3[i] * rk4Step;
    const k4 = derivative(s4, spinDirection, observed, dragScale);

    const next = new Array(7);
    for (let i = 0; i < 7; i += 1) {
      next[i] =
        state[i] + (rk4Step * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6;
    }

    const previous = state;
    state = next;
    t += rk4Step;

    if (state[2] < 0) {
      const fraction = previous[2] / (previous[2] - state[2]);
      return {
        groundTimeSeconds: t - rk4Step + fraction * rk4Step,
        observation: observed.value,
      };
    }
  }
  return { groundTimeSeconds: null, observation: observed.value };
}

/**
 * Kjør hele fixturen én gang og gjenbruk. Ren beregning, ikke delt tilstand:
 * samme input gir samme output, cachen er bare for kjøretid (~2 s per pass).
 */
let flownCache = null;
function flights() {
  if (flownCache === null) {
    flownCache = loadFlight().map((c) => ({ c, flown: integrateRK4(c.out) }));
  }
  return flownCache;
}

/** Aero-prøven ved t=0, uten integrasjon. */
function initialSample(out) {
  const { state, spinDirection } = initialState(out);
  const spin = [
    spinDirection[0] * state[6],
    spinDirection[1] * state[6],
    spinDirection[2] * state[6],
  ];
  return aeroStep([state[3], state[4], state[5]], spin, wind);
}

/* ═════════════════════════════════════════════════════════════════════════
 * 1 — Direkte fasit uten RK4
 * ═════════════════════════════════════════════════════════════════════════ */

test('Reynolds ved t=0 er bit-eksakt lik observert maksimum, alle 5027', () => {
  // Ballen bremser monotont fra start, så startfarten ER maksfarten. Dette er
  // den ene aerodynamiske størrelsen fixturen gir oss uten akkumulert RK4-støy.
  const cases = loadFlight();
  assert.equal(cases.length, 5028);

  const results = [];
  let zeroSpeed = 0;

  for (const c of cases) {
    const sample = initialSample(c.out);
    if (sample === null) {
      zeroSpeed += 1;
      continue;
    }
    results.push({
      id: c.id,
      field: 'reynoldsRangeObserved[1]',
      expected: c.out.aerodynamicDiagnostics.reynoldsRangeObserved[1],
      actual: sample.reynolds,
      tol: relativeTol(c.out.aerodynamicDiagnostics.reynoldsRangeObserved[1]),
    });
  }

  assert.equal(zeroSpeed, 1, 'kun edge.club-speed-zero har null startfart');

  const r = report('flight/reynoldsNumber@t0', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5027, r.summary);
  assert.equal(
    r.maxDeviation,
    0,
    `forventet bit-eksakt, ikke bare innenfor ${RELATIVE_TOLERANCE} relativt ` +
      `(ubrukt reserve ${ABSOLUTE_DEGREE_FALLBACK} absolutt) — ${r.summary}`,
  );
});

test('spin parameter ved t=0 ligger i det observerte intervallet, alle 5027', () => {
  let exactEndpoint = 0;
  const results = [];

  for (const c of loadFlight()) {
    const sample = initialSample(c.out);
    if (sample === null) continue;

    const [minimum, maximum] =
      c.out.aerodynamicDiagnostics.spinParameterRangeObserved;
    const s = sample.spinParameter;
    if (s === minimum || s === maximum) exactEndpoint += 1;

    // Avstand ut av intervallet. 0 når prøven ligger inni.
    const outside = Math.max(0, minimum - s, s - maximum);
    results.push({
      id: c.id,
      field: 'spinParameter@t0',
      expected: 0,
      actual: outside,
      tol: RELATIVE_TOLERANCE * Math.max(Math.abs(minimum), Math.abs(maximum)),
    });
  }

  const r = report('flight/spinParameter@t0', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5027, r.summary);

  // t=0 er ikke et ekstrempunkt for S i alle caser, så 5027 er uoppnåelig.
  // 4022 er baseline, med resiprok normering; divisjon gir 3994. Det er DEN
  // forskjellen denne vakten låser.
  //
  // (Tallet ville vært 4026 hvis stillaset brukte `spinAxisUnit` rått i stedet
  // for å renormalisere ω₀ slik ENGINE-GAPS §1 sier. Renormaliseringen er
  // integratorens valg, ikke koeffisientenes, og den vinner klart over hele
  // baner: 3112 mot 2874 bit-eksakte caser. Fire caser her er billig betalt.)
  assert.ok(
    exactEndpoint >= 4022,
    `bit-eksakt endepunkt i ${exactEndpoint} caser, forventet minst 4022 — ` +
      'sjekk normering (v × 1/speed) og gruppering ((r × perp) / speed)',
  );
});

/* ═════════════════════════════════════════════════════════════════════════
 * 2 — Hele banen: observerte intervaller mot fixturen
 * ═════════════════════════════════════════════════════════════════════════ */

test('observerte Reynolds- og S-intervaller reproduseres for alle 5028 caser', () => {
  const results = [];
  let bitExactCases = 0;
  let noGround = 0;

  for (const { c, flown } of flights()) {
    if (flown.groundTimeSeconds === null) noGround += 1;

    const ranges = observedAeroRanges(flown.observation);
    const expected = c.out.aerodynamicDiagnostics;

    const pairs = [
      ['reynoldsRangeObserved[0]', expected.reynoldsRangeObserved[0], ranges.reynoldsRangeObserved[0]],
      ['reynoldsRangeObserved[1]', expected.reynoldsRangeObserved[1], ranges.reynoldsRangeObserved[1]],
      ['spinParameterRangeObserved[0]', expected.spinParameterRangeObserved[0], ranges.spinParameterRangeObserved[0]],
      ['spinParameterRangeObserved[1]', expected.spinParameterRangeObserved[1], ranges.spinParameterRangeObserved[1]],
    ];

    let allExact = true;
    for (const [field, want, got] of pairs) {
      if (want !== got) allExact = false;
      results.push({ id: c.id, field, expected: want, actual: got, tol: relativeTol(want) });
    }
    if (allExact) bitExactCases += 1;
  }

  assert.equal(noGround, 0, 'alle løste caser når bakken innen 30 s');

  const r = report('flight/aerodynamicDiagnostics.ranges', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5028 * 4, r.summary);

  // Baseline-regresjonsvakt. 3112 av 5028 caser er bit-eksakte hele veien;
  // resten avviker med akkumulert ULP-støy fra RK4-stillaset, ikke fra
  // koeffisientene. Faller tallet, se på uttrykksrekkefølge før toleranse.
  assert.ok(
    bitExactCases >= 3112,
    `${bitExactCases} caser bit-eksakte, forventet minst 3112 — ${r.summary}`,
  );
});

test('største relative avvik ligger under 1e-12, ikke bare under 1e-9', () => {
  // Oppgaven ba om 1e-9. Det faktiske gulvet er 2.58e-15. Denne testen låser
  // margin: går den fra 1e-15 til 1e-10 er noe ekte galt, selv om 1e-9 består.
  let worstRelative = 0;
  let worstId = null;
  let worstField = null;

  for (const { c, flown } of flights()) {
    const ranges = observedAeroRanges(flown.observation);
    const expected = c.out.aerodynamicDiagnostics;
    const pairs = [
      ['reMin', expected.reynoldsRangeObserved[0], ranges.reynoldsRangeObserved[0]],
      ['reMax', expected.reynoldsRangeObserved[1], ranges.reynoldsRangeObserved[1]],
      ['sMin', expected.spinParameterRangeObserved[0], ranges.spinParameterRangeObserved[0]],
      ['sMax', expected.spinParameterRangeObserved[1], ranges.spinParameterRangeObserved[1]],
    ];
    for (const [field, want, got] of pairs) {
      const rel = want === 0 ? Math.abs(got) : Math.abs((got - want) / want);
      if (rel > worstRelative) {
        worstRelative = rel;
        worstId = c.id;
        worstField = field;
      }
    }
  }

  assert.ok(
    worstRelative < 1e-12,
    `største relative avvik ${worstRelative} ved ${worstId}.${worstField}`,
  );
});

/* ═════════════════════════════════════════════════════════════════════════
 * 3 — Tannsjekk: har testen over i det hele tatt evne til å feile?
 * ═════════════════════════════════════════════════════════════════════════ */

test('1 ppm feil i Cd flytter intervallene langt utenfor toleransen', () => {
  // Uten denne testen er testen over verdiløs: den kunne bestått fordi
  // koeffisientene knapt påvirker banen. De gjør de. Samme harness, samme
  // startbetingelser, eneste forskjell er at Cd forgiftes med 1 ppm.

  // Et lite, men bredt utvalg — testen skal bevise sensitivitet, ikke gjenta
  // hele fixturen med feil koeffisient.
  //
  // Utvalget krever ekte flukt. 383 av 5028 caser når bakken innenfor ett
  // eneste RK4-steg (`curveFlightTimeSeconds < 0.01`) fordi launch er negativ
  // og starthøyden er 1e-6 m. Der rekker ingen koeffisient å påvirke noe som
  // helst, og aggregatene er per definisjon nesten ufølsomme. Det er en ekte
  // egenskap ved baseline, ikke en svakhet ved testen — men det er ikke der
  // sensitivitet skal måles.
  const cases = loadFlight()
    .filter((c) => c.out.curveFlightTimeSeconds >= 1)
    .filter((_, i) => i % 157 === 0);
  assert.ok(cases.length >= 20, 'utvalget må være bredt nok til å bety noe');

  let detected = 0;
  let smallestSignal = Infinity;

  for (const c of cases) {
    const ranges = observedAeroRanges(
      integrateRK4(c.out, 1.000001).observation,
    );
    const expected = c.out.aerodynamicDiagnostics;
    const relatives = [
      Math.abs(
        (ranges.reynoldsRangeObserved[0] - expected.reynoldsRangeObserved[0]) /
          expected.reynoldsRangeObserved[0],
      ),
      Math.abs(
        (ranges.spinParameterRangeObserved[1] -
          expected.spinParameterRangeObserved[1]) /
          expected.spinParameterRangeObserved[1],
      ),
    ].filter(Number.isFinite);
    const signal = Math.max(...relatives);
    if (signal > RELATIVE_TOLERANCE) detected += 1;
    if (signal < smallestSignal) smallestSignal = signal;
  }

  assert.equal(
    detected,
    cases.length,
    `1 ppm Cd-feil oppdaget i ${detected} av ${cases.length} caser; ` +
      `svakeste signal ${smallestSignal}`,
  );
  // Målt: sterkeste signal 7.8e-6, svakeste 7.5e-8 — altså 75× toleransen i
  // det verste tilfellet. Snudd: hovedtesten fanger en Cd-feil ned mot ~1.3e-8
  // relativt selv i den minst følsomme banen, og ned mot ~1.3e-10 i den mest
  // følsomme. Støygulvet er 2.58e-15. Marginen er reell.
  assert.ok(
    smallestSignal > 10 * RELATIVE_TOLERANCE,
    `svakeste signal ${smallestSignal} gir for liten margin over toleransen`,
  );
});

test('degenererte caser er ufølsomme — 383 baner varer under ett steg', () => {
  // Motstykket til tannsjekken over, som en påstand og ikke en antakelse.
  // Disse casene bidrar ikke til bevisbyrden for koeffisientene; de er med i
  // hovedsammenligningen fordi fixturen har dem, ikke fordi de måler noe.
  const cases = loadFlight();
  const subStep = cases.filter((c) => c.out.curveFlightTimeSeconds < rk4Step);
  assert.equal(subStep.length, 383);

  // Årsaken er ikke «negativ launch» — det er starthøyden. Motoren starter
  // ballen 1e-6 m over bakken, så den overlever ett steg bare hvis den
  // vertikale startfarten overstiger g·Δt/2 = 0.049 m/s. Predikatet plukker ut
  // nøyaktig de samme 383 casene, inkludert edge.curve-sub-one-m-positive-carry
  // (launch +0.0121°, 152 mph, bakken etter 3.4e-5 s) og edge.club-speed-zero
  // (launch +13.25°, men 0 mph).
  const threshold = (gravity * rk4Step) / 2;
  const verticalLaunchSpeed = (out) =>
    out.ballSpeed * mphToMps * Math.sin(out.launchAngle * degToRad);

  assert.equal(
    cases.filter((c) => verticalLaunchSpeed(c.out) < threshold).length,
    subStep.length,
    'starthøyden, ikke fortegnet på launch, avgjør hvem som faller ut',
  );
  for (const c of subStep) {
    assert.ok(verticalLaunchSpeed(c.out) < threshold, c.id);
  }
  assert.equal(
    cases.filter((c) => c.out.curveFlightTimeSeconds >= 1).length,
    4203,
  );
});

/* ═════════════════════════════════════════════════════════════════════════
 * 4 — Diagnostikkobjektet
 * ═════════════════════════════════════════════════════════════════════════ */

/** Observasjon som gjengir nøyaktig fixturens egne intervaller. */
function observationFrom(diagnostics) {
  const [reMin, reMax] = diagnostics.reynoldsRangeObserved;
  const [sMin, sMax] = diagnostics.spinParameterRangeObserved;
  return observeAero(
    observeAero(emptyAeroObservation, {
      reynolds: reMin,
      spinParameter: sMin,
    }),
    { reynolds: reMax, spinParameter: sMax },
  );
}

test('extrapolated-predikatet reproduseres for alle 5028 caser', () => {
  // Predikatet mates med fixturens EGNE intervaller, så dette måler predikatet
  // alene, uten RK4-støy: extrapolated = !(Re ⊆ gyldig og S ⊆ gyldig).
  const results = [];
  const distribution = { true: 0, false: 0 };

  for (const c of loadFlight()) {
    const d = c.out.aerodynamicDiagnostics;
    distribution[String(d.extrapolated)] += 1;
    results.push({
      id: c.id,
      field: 'extrapolated',
      expected: d.extrapolated,
      actual: isExtrapolated(
        d.reynoldsRangeObserved,
        d.spinParameterRangeObserved,
      ),
    });
  }

  const r = report('flight/extrapolated', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5028, r.summary);

  // FUNN F2: sant i 89.6 %. Det er normaltilstanden, ikke et unntak.
  assert.deepEqual(distribution, { true: 4505, false: 523 });
});

test('extrapolated fra egen RK4-bane matcher fixturen for alle 5028 caser', () => {
  // Samme predikat, men nå matet av intervallene DENNE modulen produserte.
  const results = [];
  for (const { c, flown } of flights()) {
    results.push({
      id: c.id,
      field: 'extrapolated',
      expected: c.out.aerodynamicDiagnostics.extrapolated,
      actual: aerodynamicDiagnostics(flown.observation).extrapolated,
    });
  }

  const r = report('flight/extrapolated@rk4', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5028, r.summary);
});

test('aerodynamicDiagnostics har fixturens felt, verdier og rekkefølge', () => {
  const expectedKeys = [
    'coefficientSetId',
    'validityKnown',
    'reynoldsValidity',
    'spinParameterValidity',
    'reynoldsRangeObserved',
    'spinParameterRangeObserved',
    'extrapolated',
    'reverseMagnusPolicy',
  ];

  for (const c of loadFlight()) {
    const expected = c.out.aerodynamicDiagnostics;
    const actual = aerodynamicDiagnostics(observationFrom(expected));

    assert.deepEqual(Object.keys(expected), expectedKeys, c.id);
    assert.deepEqual(Object.keys(actual), expectedKeys, c.id);
    assert.deepEqual(
      JSON.parse(JSON.stringify(actual)),
      expected,
      `${c.id} — diagnostikkobjektet avviker`,
    );
  }
});

test('gyldighetsområdene er fixturens, ikke omskrevne', () => {
  assert.deepEqual([...reynoldsValidity], [70000, 210000]);
  assert.deepEqual([...spinParameterValidity], [0.08, 0.2]);

  for (const c of loadFlight()) {
    const d = c.out.aerodynamicDiagnostics;
    assert.deepEqual(d.reynoldsValidity, [...reynoldsValidity], c.id);
    assert.deepEqual(d.spinParameterValidity, [...spinParameterValidity], c.id);
    assert.equal(d.coefficientSetId, aeroModelIdentity.coefficientSetId, c.id);
    assert.equal(d.validityKnown, aeroModelIdentity.validityKnown, c.id);
    assert.equal(
      d.reverseMagnusPolicy,
      aeroModelIdentity.reverseMagnusPolicy,
      c.id,
    );
  }
});

test('dragCompatibilityScale er fixturens 1.275116456035', () => {
  assert.equal(dragCompatibilityScale, 1.275116456035);
  for (const c of loadFlight()) {
    assert.equal(c.out.aeroModel.dragCompatibilityScale, dragCompatibilityScale, c.id);
    assert.equal(c.out.aeroModel.referenceAnchorDragScale, dragCompatibilityScale, c.id);
  }
});

/* ═════════════════════════════════════════════════════════════════════════
 * 5 — Uttrykkene, uavhengig av constants.js
 * ═════════════════════════════════════════════════════════════════════════ */

test('Cl, CdBridge, Cd, Re og S matcher spec §5.7 skrevet ut med literaler', () => {
  // Bevisst duplisert fra spec-teksten, ikke importert. Fanger opp at noen
  // endrer en konstant i constants.js uten en bevisst, versjonert
  // fysikkendring. Punktene hentes fra fixturens egne observerte intervaller,
  // så området som dekkes er det ekte.
  const results = [];

  for (const c of loadFlight()) {
    const d = c.out.aerodynamicDiagnostics;
    for (const re of d.reynoldsRangeObserved) {
      for (const s of d.spinParameterRangeObserved) {
        const bridge =
          0.2016141765 +
          0.0463816544 / (1 + Math.exp((re - 85000) / 9000)) +
          (0.06 * s) / (0.15 + s);

        results.push(
          { id: c.id, field: 'Cl', expected: 0.4072 * Math.max(0, s) ** 0.4, actual: liftCoefficient(s) },
          { id: c.id, field: 'CdBridge', expected: bridge, actual: dragBridge(re, s) },
          { id: c.id, field: 'Cd', expected: bridge * 1.275116456035, actual: dragCoefficient(re, s) },
        );
      }
    }
  }

  const r = report('spec/§5.7-literals', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5028 * 4 * 3, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('Reynolds og S matcher spec §5.7 skrevet ut med literaler', () => {
  const results = [];
  for (const c of loadFlight()) {
    const sample = initialSample(c.out);
    if (sample === null) continue;
    results.push(
      {
        id: c.id,
        field: 'Reynolds',
        expected: (sample.speed * 2 * 0.021335) / 1.46e-5,
        actual: reynoldsNumber(sample.speed),
      },
      {
        id: c.id,
        field: 'spinParameter',
        expected: (0.021335 * sample.spinPerpendicularMagnitude) / sample.speed,
        actual: spinParameter(sample.spinPerpendicularMagnitude, sample.speed),
      },
    );
  }

  const r = report('spec/§5.7-re-s-literals', results);
  assert.ok(r.ok, r.summary);
  assert.equal(r.total, 5027 * 2, r.summary);
  assert.equal(r.maxDeviation, 0, r.summary);
});

test('aeroStep og skalarfunksjonene gir bit-identiske tall', () => {
  // `aeroStep` gjenbruker CdBridge i stedet for å kalle `dragCoefficient` på
  // nytt. Snarveien skal være aritmetisk identisk, ikke bare nær.
  for (const c of loadFlight()) {
    const s = initialSample(c.out);
    if (s === null) continue;
    assert.equal(s.reynolds, reynoldsNumber(s.speed), c.id);
    assert.equal(
      s.spinParameter,
      spinParameter(s.spinPerpendicularMagnitude, s.speed),
      c.id,
    );
    assert.equal(s.dragBridge, dragBridge(s.reynolds, s.spinParameter), c.id);
    assert.equal(
      s.dragCoefficient,
      dragCoefficient(s.reynolds, s.spinParameter),
      c.id,
    );
    assert.equal(s.liftCoefficient, liftCoefficient(s.spinParameter), c.id);
    assert.equal(
      s.spinPerpendicularMagnitude,
      Math.hypot(...s.spinPerpendicular),
      c.id,
    );
  }
});

test('ballRadius og kinematicViscosity er spec §5.7 sine tall', () => {
  assert.equal(ballRadius, 0.021335);
  assert.equal(kinematicViscosity, 1.46e-5);
  assert.equal(airDensity, 1.225);
  assert.equal(gravity, 9.80665);
  assert.equal(ballMass, 0.04593);
  assert.equal(spinDecay, 0.04);
  assert.equal(rk4Step, 0.01);
  assert.equal(maxFlightTime, 30);
  assert.deepEqual([...wind], [0, 0, 0]);
});

test('normering er resiprok multiplikasjon, ikke divisjon', () => {
  // Målt valg, se filhodet i src/aeroCoefficients.js punkt 5. Testen finner et
  // konkret tilfelle der de to formene faktisk gir ulike bits, og låser hvilken.
  let witnessed = false;
  for (const c of loadFlight()) {
    const sample = initialSample(c.out);
    if (sample === null) continue;
    const inverse = 1 / sample.speed;
    for (let i = 0; i < 3; i += 1) {
      const byMultiply = sample.airVelocity[i] * inverse;
      const byDivide = sample.airVelocity[i] / sample.speed;
      assert.equal(sample.unitAirVelocity[i], byMultiply, c.id);
      if (byMultiply !== byDivide) witnessed = true;
    }
  }
  assert.ok(
    witnessed,
    'fant ingen case der formene skiller seg — testen ville vært tom',
  );
});

/* ═════════════════════════════════════════════════════════════════════════
 * 6 — Funksjonenes egen kontrakt
 * ═════════════════════════════════════════════════════════════════════════ */

test('aeroStep returnerer nøyaktig de ti feltene, intet mer', () => {
  const sample = aeroStep([50, 60, 20], [0, 100, 200]);
  assert.deepEqual(Object.keys(sample).sort(), [
    'airVelocity',
    'dragBridge',
    'dragCoefficient',
    'liftCoefficient',
    'reynolds',
    'spinParameter',
    'spinPerpendicular',
    'spinPerpendicularMagnitude',
    'speed',
    'unitAirVelocity',
  ].sort());
  for (const value of Object.values(sample)) {
    const numbers = Array.isArray(value) ? value : [value];
    for (const n of numbers) assert.ok(Number.isFinite(n));
  }
});

test('aeroStep er ren — samme input gir identisk output, input urørt', () => {
  const velocity = [40, 55, 15];
  const spin = [10, 20, 300];
  const first = aeroStep(velocity, spin);
  const second = aeroStep(velocity, spin);
  assert.deepEqual(first, second);
  assert.notEqual(first, second, 'nytt objekt hver gang, ingen delt tilstand');
  assert.deepEqual(velocity, [40, 55, 15], 'hastighet urørt');
  assert.deepEqual(spin, [10, 20, 300], 'spinn urørt');
});

test('aeroStep returnerer null ved null lufthastighet', () => {
  assert.equal(aeroStep([0, 0, 0], [0, 0, 100]), null);
  assert.equal(aeroStep([3, 4, 0], [0, 0, 100], [3, 4, 0]), null, 'vind = fart');

  // Baseline-beviset: edge.club-speed-zero har ballSpeed 0, men fixturen
  // bokfører likevel Reynolds fra halvsteget — altså ble k1 aldri observert.
  const zero = loadFlight().find((c) => c.in.clubSpeed === 0);
  assert.ok(zero, 'fixturen har en clubSpeed-0-case');
  assert.equal(zero.out.ballSpeed, 0);
  assert.equal(initialSample(zero.out), null);
  assert.deepEqual(zero.out.aerodynamicDiagnostics.reynoldsRangeObserved, [
    143.30449892537908, 286.608997852011,
  ]);
});

test('observeAero muterer ingenting og hopper over null', () => {
  const first = observeAero(emptyAeroObservation, {
    reynolds: 100000,
    spinParameter: 0.1,
  });
  assert.equal(emptyAeroObservation.samples, 0, 'nøytralelementet er urørt');
  assert.equal(first.samples, 1);

  const second = observeAero(first, { reynolds: 90000, spinParameter: 0.3 });
  assert.equal(first.samples, 1, 'forrige observasjon er urørt');
  assert.deepEqual(observedAeroRanges(second), {
    reynoldsRangeObserved: [90000, 100000],
    spinParameterRangeObserved: [0.1, 0.3],
  });

  assert.equal(observeAero(second, null), second, 'null gir samme verdi');
  assert.equal(observeAero(second, undefined), second);
});

test('uten prøver finnes ingen intervaller, og extrapolated er null', () => {
  // Ingen baseline-case treffer denne grenen — alle 5028 har endelige
  // intervaller. Fixturens `_meta.units` erklærer likevel extrapolated som
  // «boolean or null», så null-grenen er motorens egen erklærte mulighet.
  const ranges = observedAeroRanges(emptyAeroObservation);
  assert.equal(ranges.reynoldsRangeObserved, null);
  assert.equal(ranges.spinParameterRangeObserved, null);

  const d = aerodynamicDiagnostics(emptyAeroObservation);
  assert.equal(d.extrapolated, null);
  assert.equal(d.coefficientSetId, aeroModelIdentity.coefficientSetId);

  assert.equal(withinValidity(null, reynoldsValidity), null);
  assert.equal(isExtrapolated(null, [0.1, 0.15]), null);

  const finite = loadFlight().filter(
    (c) => c.out.aerodynamicDiagnostics.reynoldsRangeObserved !== null,
  );
  assert.equal(finite.length, 5028, 'ingen baseline-case mangler intervaller');
});

test('gyldighet er inklusiv i begge ender', () => {
  assert.equal(withinValidity([70000, 210000], reynoldsValidity), true);
  assert.equal(withinValidity([69999.9, 210000], reynoldsValidity), false);
  assert.equal(withinValidity([70000, 210000.1], reynoldsValidity), false);
  assert.equal(isExtrapolated([70000, 210000], [0.08, 0.2]), false);
  assert.equal(isExtrapolated([70000, 210000], [0.08, 0.2000001]), true);
});

test('Cl klamper negativ S til null og modellerer ikke revers-Magnus', () => {
  assert.equal(liftCoefficient(0), 0);
  assert.equal(liftCoefficient(-1), 0);
  assert.equal(liftCoefficient(-1e-300), 0);
  assert.ok(liftCoefficient(0.2) > liftCoefficient(0.1), 'monoton i S');
  assert.match(aeroModelIdentity.reverseMagnusPolicy, /not modeled/);
});

test('perpendicularSpin fjerner komponenten langs strømmen', () => {
  const unit = [0, 1, 0];
  assert.deepEqual(perpendicularSpin([0, 500, 0], unit), [0, 0, 0]);
  assert.deepEqual(perpendicularSpin([7, 500, -3], unit), [7, 0, -3]);
});

test('ingen returverdi inneholder presentasjonsdata', () => {
  // FUNN F6: motoren smugler i dag et designsystem ut gjennom motorgrensen.
  // Ikke her.
  const forbidden = ['color', 'textColor', 'tip', 'pct', 'barPos', 'label', 'band'];
  const sample = aeroStep([40, 55, 15], [10, 20, 300]);
  const diagnostics = aerodynamicDiagnostics(
    observeAero(emptyAeroObservation, sample),
  );
  for (const key of forbidden) {
    assert.equal(key in sample, false, `aeroStep lekker ${key}`);
    assert.equal(key in diagnostics, false, `diagnostics lekker ${key}`);
  }
  for (const value of Object.values(sample)) {
    assert.notEqual(typeof value, 'string', 'aeroStep returnerer bare tall');
  }
});

/* ═════════════════════════════════════════════════════════════════════════
 * 7 — Casen den ekte motoren kastet på
 * ═════════════════════════════════════════════════════════════════════════ */

test('RK4-timeout-casen har endelige koeffisienter ved t=0', () => {
  // Fixturen har ingen `out` for denne, så det finnes ingen fasit å måle mot.
  // Poenget er negativt: koeffisientbroen er ikke der kallet gikk i stykker.
  const [timeout] = loadFlightErrors();
  assert.equal(timeout.id, 'edge.rk4-no-ground-within-30-seconds');
  assert.equal(timeout.in.clubSpeed, 18000);
  assert.equal(timeout.out, undefined, 'fortsatt ingen fasit å sammenligne mot');

  const sample = aeroStep([1000, 4000, 3000], [0, 0, 900]);
  assert.ok(Number.isFinite(sample.reynolds));
  assert.ok(Number.isFinite(sample.spinParameter));
  assert.ok(Number.isFinite(sample.dragCoefficient));
  assert.ok(Number.isFinite(sample.liftCoefficient));
});
