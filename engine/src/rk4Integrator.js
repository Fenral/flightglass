/**
 * §5.7 + ENGINE-GAPS §1 — den deterministiske RK4-integrasjonen som eier
 * den laterale bøyen.
 *
 * BASELINE. Modulen reproduserer dagens motor. Den forbedrer ingenting.
 *
 * ── Hva den gjør ────────────────────────────────────────────────────────
 *
 * Verdensakser: `x = golferens høyre`, `y = mållinjen`, `z = opp` (spec §4).
 *
 * Starttilstanden står KUN i ENGINE-GAPS §1, ikke i spec §5.7:
 *
 *   V   = ballSpeed × 0.44704          (mph → m/s)
 *   e   = launchAngle × π/180
 *   a   = startDirection × π/180
 *   v₀  = [V·cos(e)·sin(a), V·cos(e)·cos(a), V·sin(e)]     m/s
 *   ω₀  = spinAxisUnit · totalSpinRpm · (2π/60)            rad/s
 *
 *   state = [x, y, z, vx, vy, vz, |ω|]  initialisert til [0, 0, 1e-6, v₀, |ω₀|]
 *
 * Spinnretningen holdes FAST på `unit(ω₀)` gjennom hele flukten; bare
 * magnituden forfaller (`d|ω|/dt = −0.04·|ω|`). Det er derfor tilstanden er
 * 7-dimensjonal og ikke 9-dimensjonal.
 *
 * Ved hvert derivatkall (spec §5.7, ordrett):
 *
 *   airVelocity   = velocity − wind            (wind = 0)
 *   speed         = |airVelocity|
 *   spinParameter = R·|ω ⟂ airVelocity| / speed
 *   Reynolds      = speed·2R / ν
 *   Cl            = 0.4072 · max(0, S)^0.4
 *   CdBridge      = 0.2016141765
 *                 + 0.0463816544/(1 + exp((Re − 85000)/9000))
 *                 + 0.06·S/(0.15 + S)
 *   Cd            = CdBridge · 1.275116456035
 *   q             = 0.5·ρ·πR²·speed²
 *   drag          = −q·Cd·unit(airVelocity)
 *   lift          =  q·Cl·unit(ω × airVelocity)
 *   acceleration  = (drag + lift)/m + gravity
 *
 * Fast steg 0.01 s, maks 30 s. Første bakkekryssing interpoleres LINEÆRT
 * mellom siste positive og første ikke-positive høyde. Nås ikke bakken innen
 * 30 s kastes `Error("Flight did not reach the ground within maxTimeSeconds")`
 * — ordrett den meldingen `edge.rk4-no-ground-within-30-seconds` bærer.
 *
 * ── Feller — ikke «fiks» disse ──────────────────────────────────────────
 *
 * 1. `z₀ = 1e-6`, ikke 0. Uten den ville `next.z <= 0` slå til på steg 1 for
 *    et flatt slag og gi flukttid 0. Med den får `edge.dynamic-loft-zero`
 *    flukttid 2.04e-5 s, som er det fixturen sier.
 * 2. Den offentlige skalaren `spinAxis` (grader) kan IKKE rekonstruere aksen.
 *    Denne modulen krever vektoren `spinAxisUnit`. (ENGINE-GAPS §1, FUNN F3.)
 * 3. `extrapolated: true` er NORMALtilstanden — 87 % av realistiske slag
 *    (FUNN F2). Diagnostikken er provenance, ikke en advarsel.
 * 4. Ved `speed === 0` gjøres INGEN aero-observasjon. Det er derfor
 *    `edge.club-speed-zero` (ballSpeed 0) rapporterer
 *    `reynoldsRangeObserved[0] = 143.30449892537908` — verdien fra RK4s
 *    k₃-trinn — og ikke 0 fra starttilstanden. Legger du til en `obs(0, 0)`
 *    i null-grenen, brytes den casen.
 * 5. Observasjonene skjer i ALLE FIRE RK4-trinnene (k₁…k₄), også i det siste
 *    steget som bommer under bakken. `edge.dynamic-loft-zero` beviser det:
 *    banen varer 2.04e-5 s, men det observerte Reynolds-området strekker seg
 *    til tilstanden ved t = 0.01 s.
 *
 * ── Flyttallsrekkefølge — verifisert mot fixturen ───────────────────────
 *
 * Rekkefølgene under er ikke smak. De er valgt fordi de reproduserer flest
 * caser BIT-EKSAKT (se test/rk4Integrator.test.js for tallene):
 *
 *   speed        = Math.hypot(ax, ay, az)          — ikke sqrt(Σx²)
 *   |ω × v|      = Math.sqrt(cx² + cy² + cz²)      — ikke hypot
 *   |ω ⟂ v|      = Math.hypot(…)                   — ikke sqrt
 *   unit(v)      = v · (1/speed)                   — MULTIPLIKASJON
 *   unit(ω × v)  = (ω × v) / |ω × v|               — DIVISJON
 *   S            = (R · |ω ⟂ v|) / speed
 *   Re           = (speed · 2 · R) / ν
 *   q            = 0.5 · ρ · A · (speed · speed),  A = π·R·R utenfor løkken
 *   a            = (drag + lift) · (1/m) − g       — MULTIPLIKASJON med 1/m
 *   RK4-steget   = s + (h · (k₁ + 2k₂ + 2k₃ + k₄)) / 6
 *   ω-retningen  = unit(ω₀), normalisert med hypot — IKKE `spinAxisUnit` rått
 *
 * Den siste er kontraintuitiv: `spinAxisUnit` ER allerede en enhetsvektor,
 * men baseline normaliserer ω₀ på nytt, og de to skiller seg med 1 ULP.
 * Å bruke `spinAxisUnit` direkte gir 287/343 bit-eksakte felt mot 313/343.
 *
 * ── Overlapp med `aeroCoefficients.js` — for integrasjonsrunden ───────────
 *
 * `src/aeroCoefficients.js` eier den samme koeffisientbroen (§5.7) og kom til
 * parallelt med denne modulen. Overlappende symboler: `liftCoefficient`,
 * `dragBridge`, `dragCoefficient`, `isExtrapolated`, `aerodynamicDiagnostics`,
 * pluss Reynolds/spin-parameter inne i `aeroSample`.
 *
 * De to er verifisert BIT-IDENTISKE på `speed`, `reynolds`, `spinParameter`,
 * `liftCoefficient` og `dragCoefficient` (208 stikkprøvestater, null avvik) —
 * to uavhengige utledninger av samme rekkefølge. Denne modulen holdes
 * likevel selvstendig, med `constants.js` som eneste avhengighet:
 *
 *   1. `aeroStep` allokerer fire arrays per kall. Den varme løkken her kaller
 *      derivatet ~10 millioner ganger over fixturen; allokering der koster
 *      mer enn duplikatet.
 *   2. `aerodynamicDiagnostics` har ulik signatur i de to (observasjonsobjekt
 *      vs. to intervaller).
 *
 * Skal duplikatet bort, er det en bevisst integrasjonsbeslutning: la denne
 * importere fra `aeroCoefficients.js`, og la testen som verifiserer
 * bit-likheten flytte med. Ikke slå dem sammen halvveis.
 *
 * Rene funksjoner. Ingen tilstand utenfor et kall, ingen I/O.
 */

import {
  mphToMps,
  yardToMetre,
  degToRad,
  rpmToRadPerSec,
  ballMass,
  ballRadius,
  airDensity,
  kinematicViscosity,
  gravity,
  wind,
  spinDecay,
  rk4Step,
  maxFlightTime,
  rk4InitialHeight,
  liftCoefficientFactor,
  liftCoefficientExponent,
  dragBridgeBase,
  dragBridgeReynoldsAmplitude,
  dragBridgeReynoldsMidpoint,
  dragBridgeReynoldsWidth,
  dragBridgeSpinAmplitude,
  dragBridgeSpinHalf,
  dragCompatibilityScale,
  reynoldsValidity,
  spinParameterValidity,
  aeroModelIdentity,
} from './constants.js';

/**
 * Ballens tverrsnittsareal, πR². IKKE i `constants.js` — den er utledet av
 * `ballRadius` og hører ikke hjemme som egen baseline-konstant.
 *
 * Grupperingen er load-bearing: `0.5 · ρ · A · (speed · speed)` med A regnet
 * ut ÉN gang her treffer fixturen bedre enn den utskrevne
 * `0.5 · ρ · π · R · R · speed · speed`. Ikke inline den.
 */
const ballCrossSectionArea = Math.PI * ballRadius * ballRadius;

/**
 * Tyngdeakselerasjonen som vektor. Spec §5.7 skriver
 * `acceleration = (dragForce + liftForce) / BallMass + gravity`, altså en
 * vektoraddisjon — ikke et `− gravity` på z alene. Resultatet er identisk
 * bit for bit (negasjon er eksakt), men formen er kildens.
 */
const gravityAcceleration = Object.freeze([0, 0, -gravity]);

/** Feilmeldingen `edge.rk4-no-ground-within-30-seconds` bærer, ordrett. */
export const groundNotReachedMessage =
  'Flight did not reach the ground within maxTimeSeconds';

/* ─────────────────────────────────────────────────────────────────────────
 * Startbetingelser — ENGINE-GAPS §1
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Ballens hastighetsvektor ved separasjon, m/s.
 *
 * `v₀ = [V·cos(e)·sin(a), V·cos(e)·cos(a), V·sin(e)]`
 *
 * Merk at `cos(e)` IKKE faktoriseres ut: uttrykkene er venstre-assosiative
 * `((V * cos e) * sin a)`, som i kilden.
 *
 * @param {{ballSpeed: number, launchAngle: number, startDirection: number}} input
 *   `ballSpeed` i mph, de to vinklene i grader.
 * @returns {[number, number, number]} m/s i verdensakser.
 */
export function launchVelocity({ ballSpeed, launchAngle, startDirection }) {
  const speedMps = ballSpeed * mphToMps;
  const elevation = launchAngle * degToRad;
  const azimuth = startDirection * degToRad;

  const horizontal = Math.cos(elevation);

  return [
    speedMps * horizontal * Math.sin(azimuth),
    speedMps * horizontal * Math.cos(azimuth),
    speedMps * Math.sin(elevation),
  ];
}

/**
 * Spinnvektoren ved treff, rad/s. `ω₀ = uₛ · totalSpinRpm · (2π/60)`.
 *
 * Skalaren regnes ut FØR komponentene skaleres — `u[i] * (rpm * konv)`, ikke
 * `u[i] * rpm * konv`. Forskjellen er 1 ULP og synlig i fixturen.
 *
 * @param {{spinAxisUnit: ReadonlyArray<number>, totalSpinRpm: number}} input
 * @returns {[number, number, number]} rad/s.
 */
export function impactSpin({ spinAxisUnit, totalSpinRpm }) {
  const magnitude = totalSpinRpm * rpmToRadPerSec;

  return [
    spinAxisUnit[0] * magnitude,
    spinAxisUnit[1] * magnitude,
    spinAxisUnit[2] * magnitude,
  ];
}

/**
 * Den faste spinnretningen, `unit(ω₀)`.
 *
 * ENGINE-GAPS §1 sier «Its spin direction is held at unit(ω₀)». Den
 * normaliseres på nytt selv om `spinAxisUnit` allerede har lengde 1 — se
 * modulnotatet om hvorfor det er load-bearing.
 *
 * Degenerert ω₀ (null spinn) gir `[0, 0, 0]`, ikke NaN.
 *
 * @param {ReadonlyArray<number>} omega rad/s.
 * @returns {[number, number, number]} enhetsvektor, eller `[0, 0, 0]`.
 */
export function spinDirection(omega) {
  const magnitude = Math.hypot(omega[0], omega[1], omega[2]);
  if (!(magnitude > 0)) return [0, 0, 0];
  return [omega[0] / magnitude, omega[1] / magnitude, omega[2] / magnitude];
}

/**
 * RK4-tilstanden `[x, y, z, vx, vy, vz, |ω|]` ved t = 0.
 *
 * Høyden er `rk4InitialHeight` = 1e-6 m, ikke 0. Se felle 1 i modulnotatet.
 *
 * @param {ReadonlyArray<number>} velocity m/s.
 * @param {number} spinMagnitude rad/s.
 * @returns {number[]} sju tall.
 */
export function initialState(velocity, spinMagnitude) {
  return [
    0,
    0,
    rk4InitialHeight,
    velocity[0],
    velocity[1],
    velocity[2],
    spinMagnitude,
  ];
}

/* ─────────────────────────────────────────────────────────────────────────
 * Aerodynamikk — spec §5.7
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Løftkoeffisienten. `Cl = 0.4072 · max(0, S)^0.4`.
 *
 * `max(0, S)` er spec-ens, ikke min: `S` er ikke-negativ ved konstruksjon
 * (R·|ω⟂|/speed med tre ikke-negative faktorer). Klampen står fordi kilden
 * har den.
 *
 * @param {number} spinParameter dimensjonsløs.
 * @returns {number}
 */
export function liftCoefficient(spinParameter) {
  return (
    liftCoefficientFactor *
    Math.pow(Math.max(0, spinParameter), liftCoefficientExponent)
  );
}

/**
 * Koeffisientbroen før 7-jern-kalibreringen.
 *
 * @param {number} reynolds
 * @param {number} spinParameter
 * @returns {number}
 */
export function dragBridge(reynolds, spinParameter) {
  return (
    dragBridgeBase +
    dragBridgeReynoldsAmplitude /
      (1 + Math.exp((reynolds - dragBridgeReynoldsMidpoint) / dragBridgeReynoldsWidth)) +
    (dragBridgeSpinAmplitude * spinParameter) /
      (dragBridgeSpinHalf + spinParameter)
  );
}

/**
 * Dragkoeffisienten. `Cd = CdBridge · 1.275116456035`.
 *
 * Faktoren er en fast 7-jern-KOMPATIBILITETSKALIBRERING for curve-solven
 * (spec §5.7), ikke en fysisk egenskap ved golfballen.
 *
 * @param {number} reynolds
 * @param {number} spinParameter
 * @returns {number}
 */
export function dragCoefficient(reynolds, spinParameter) {
  return dragBridge(reynolds, spinParameter) * dragCompatibilityScale;
}

/**
 * Ett aerodynamisk oppslag for én RK4-tilstand.
 *
 * Ren funksjon — allokerer et nytt objekt hver gang. Den varme løkken inne i
 * `integrateFlight` bruker en privat, allokeringsfri variant av nøyaktig
 * samme aritmetikk; denne finnes for at hvert ledd skal kunne testes alene.
 *
 * @param {ReadonlyArray<number>} state `[x, y, z, vx, vy, vz, |ω|]`.
 * @param {ReadonlyArray<number>} spinDirectionUnit fast enhetsvektor.
 * @returns {{speed: number, reynolds: number, spinParameter: number,
 *            liftCoefficient: number, dragCoefficient: number,
 *            acceleration: [number, number, number], observed: boolean}}
 *   `observed = false` når `speed === 0`; da er Re og S ikke definert (0) og
 *   akselerasjonen er ren tyngdekraft. Se felle 4.
 */
export function aeroSample(state, spinDirectionUnit) {
  const airX = state[3] - wind[0];
  const airY = state[4] - wind[1];
  const airZ = state[5] - wind[2];
  const speed = Math.hypot(airX, airY, airZ);

  const spinMagnitude = state[6];
  const omegaX = spinDirectionUnit[0] * spinMagnitude;
  const omegaY = spinDirectionUnit[1] * spinMagnitude;
  const omegaZ = spinDirectionUnit[2] * spinMagnitude;

  if (!(speed > 0)) {
    return {
      speed,
      reynolds: 0,
      spinParameter: 0,
      liftCoefficient: 0,
      dragCoefficient: 0,
      acceleration: [
        gravityAcceleration[0],
        gravityAcceleration[1],
        gravityAcceleration[2],
      ],
      observed: false,
    };
  }

  const inverseSpeed = 1 / speed;
  const unitX = airX * inverseSpeed;
  const unitY = airY * inverseSpeed;
  const unitZ = airZ * inverseSpeed;

  // ω projisert bort fra strømningsretningen: ω − (ω·û)û.
  const alongFlow = omegaX * unitX + omegaY * unitY + omegaZ * unitZ;
  const perpendicular = Math.hypot(
    omegaX - alongFlow * unitX,
    omegaY - alongFlow * unitY,
    omegaZ - alongFlow * unitZ,
  );

  const spinParameter = (ballRadius * perpendicular) / speed;
  const reynolds = (speed * 2 * ballRadius) / kinematicViscosity;

  const cl = liftCoefficient(spinParameter);
  const cd = dragCoefficient(reynolds, spinParameter);

  const dynamicPressureArea =
    0.5 * airDensity * ballCrossSectionArea * (speed * speed);

  const dragMagnitude = -(dynamicPressureArea * cd);
  const dragX = dragMagnitude * unitX;
  const dragY = dragMagnitude * unitY;
  const dragZ = dragMagnitude * unitZ;

  // ω × airVelocity
  const crossX = omegaY * airZ - omegaZ * airY;
  const crossY = omegaZ * airX - omegaX * airZ;
  const crossZ = omegaX * airY - omegaY * airX;
  const crossLength = Math.sqrt(
    crossX * crossX + crossY * crossY + crossZ * crossZ,
  );

  let liftX = 0;
  let liftY = 0;
  let liftZ = 0;
  if (crossLength > 0) {
    const liftMagnitude = dynamicPressureArea * cl;
    liftX = liftMagnitude * (crossX / crossLength);
    liftY = liftMagnitude * (crossY / crossLength);
    liftZ = liftMagnitude * (crossZ / crossLength);
  }

  const inverseMass = 1 / ballMass;

  return {
    speed,
    reynolds,
    spinParameter,
    liftCoefficient: cl,
    dragCoefficient: cd,
    acceleration: [
      (dragX + liftX) * inverseMass + gravityAcceleration[0],
      (dragY + liftY) * inverseMass + gravityAcceleration[1],
      (dragZ + liftZ) * inverseMass + gravityAcceleration[2],
    ],
    observed: true,
  };
}

/**
 * Derivatet av RK4-tilstanden.
 *
 * `[vx, vy, vz, ax, ay, az, −0.04·|ω|]`
 *
 * @param {ReadonlyArray<number>} state
 * @param {ReadonlyArray<number>} spinDirectionUnit
 * @returns {number[]} sju tall.
 */
export function derivative(state, spinDirectionUnit) {
  const { acceleration } = aeroSample(state, spinDirectionUnit);

  return [
    state[3],
    state[4],
    state[5],
    acceleration[0],
    acceleration[1],
    acceleration[2],
    -spinDecay * state[6],
  ];
}

/* ─────────────────────────────────────────────────────────────────────────
 * Integrasjonen
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Skriver derivatet inn i `out` uten å allokere, og registrerer (Re, S) i
 * `observedRange` når farten er positiv.
 *
 * Aritmetikken er BIT-IDENTISK med `aeroSample` + `derivative`. Endrer du
 * den ene, endre den andre — `test/rk4Integrator.test.js` sammenligner dem
 * eksakt over hele fixturen.
 *
 * @param {ReadonlyArray<number>} state
 * @param {ReadonlyArray<number>} dir spinnretning, enhetsvektor
 * @param {number[]} out sju tall, skrives over
 * @param {{reMin: number, reMax: number, sMin: number, sMax: number}|null} observedRange
 */
function writeDerivative(state, dir, out, observedRange) {
  const airX = state[3] - wind[0];
  const airY = state[4] - wind[1];
  const airZ = state[5] - wind[2];
  const speed = Math.hypot(airX, airY, airZ);

  const spinMagnitude = state[6];
  const omegaX = dir[0] * spinMagnitude;
  const omegaY = dir[1] * spinMagnitude;
  const omegaZ = dir[2] * spinMagnitude;

  out[0] = state[3];
  out[1] = state[4];
  out[2] = state[5];
  out[6] = -spinDecay * spinMagnitude;

  if (!(speed > 0)) {
    // Ingen observasjon her. Se felle 4 i modulnotatet.
    out[3] = gravityAcceleration[0];
    out[4] = gravityAcceleration[1];
    out[5] = gravityAcceleration[2];
    return;
  }

  const inverseSpeed = 1 / speed;
  const unitX = airX * inverseSpeed;
  const unitY = airY * inverseSpeed;
  const unitZ = airZ * inverseSpeed;

  const alongFlow = omegaX * unitX + omegaY * unitY + omegaZ * unitZ;
  const perpendicular = Math.hypot(
    omegaX - alongFlow * unitX,
    omegaY - alongFlow * unitY,
    omegaZ - alongFlow * unitZ,
  );

  const spinParameter = (ballRadius * perpendicular) / speed;
  const reynolds = (speed * 2 * ballRadius) / kinematicViscosity;

  if (observedRange !== null) {
    if (reynolds < observedRange.reMin) observedRange.reMin = reynolds;
    if (reynolds > observedRange.reMax) observedRange.reMax = reynolds;
    if (spinParameter < observedRange.sMin) observedRange.sMin = spinParameter;
    if (spinParameter > observedRange.sMax) observedRange.sMax = spinParameter;
  }

  const cl =
    liftCoefficientFactor *
    Math.pow(Math.max(0, spinParameter), liftCoefficientExponent);
  const cd =
    (dragBridgeBase +
      dragBridgeReynoldsAmplitude /
        (1 +
          Math.exp((reynolds - dragBridgeReynoldsMidpoint) / dragBridgeReynoldsWidth)) +
      (dragBridgeSpinAmplitude * spinParameter) /
        (dragBridgeSpinHalf + spinParameter)) *
    dragCompatibilityScale;

  const dynamicPressureArea =
    0.5 * airDensity * ballCrossSectionArea * (speed * speed);

  const dragMagnitude = -(dynamicPressureArea * cd);
  const dragX = dragMagnitude * unitX;
  const dragY = dragMagnitude * unitY;
  const dragZ = dragMagnitude * unitZ;

  const crossX = omegaY * airZ - omegaZ * airY;
  const crossY = omegaZ * airX - omegaX * airZ;
  const crossZ = omegaX * airY - omegaY * airX;
  const crossLength = Math.sqrt(
    crossX * crossX + crossY * crossY + crossZ * crossZ,
  );

  let liftX = 0;
  let liftY = 0;
  let liftZ = 0;
  if (crossLength > 0) {
    const liftMagnitude = dynamicPressureArea * cl;
    liftX = liftMagnitude * (crossX / crossLength);
    liftY = liftMagnitude * (crossY / crossLength);
    liftZ = liftMagnitude * (crossZ / crossLength);
  }

  const inverseMass = 1 / ballMass;
  out[3] = (dragX + liftX) * inverseMass + gravityAcceleration[0];
  out[4] = (dragY + liftY) * inverseMass + gravityAcceleration[1];
  out[5] = (dragZ + liftZ) * inverseMass + gravityAcceleration[2];
}

/**
 * Ett klassisk RK4-steg. Eksportert for at steget skal kunne testes alene.
 *
 * `s' = s + (h · (k₁ + 2k₂ + 2k₃ + k₄)) / 6`
 *
 * Grupperingen er load-bearing: `(h · Σ) / 6` treffer fixturen, `(h/6) · Σ`
 * gjør det ikke. Se modulnotatet.
 *
 * @param {ReadonlyArray<number>} state
 * @param {ReadonlyArray<number>} spinDirectionUnit
 * @param {number} [h=rk4Step] steglengde i sekunder.
 * @returns {number[]} ny tilstand.
 */
export function rk4Advance(state, spinDirectionUnit, h = rk4Step) {
  const k1 = derivative(state, spinDirectionUnit);
  const k2 = derivative(addScaled(state, k1, h / 2), spinDirectionUnit);
  const k3 = derivative(addScaled(state, k2, h / 2), spinDirectionUnit);
  const k4 = derivative(addScaled(state, k3, h), spinDirectionUnit);

  const next = new Array(7);
  for (let i = 0; i < 7; i += 1) {
    next[i] = state[i] + (h * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6;
  }
  return next;
}

/** `a + factor · k`, komponentvis. */
function addScaled(a, k, factor) {
  const out = new Array(7);
  for (let i = 0; i < 7; i += 1) out[i] = a[i] + factor * k[i];
  return out;
}

/** Samme, men skriver inn i `out`. */
function writeAddScaled(a, k, factor, out) {
  for (let i = 0; i < 7; i += 1) out[i] = a[i] + factor * k[i];
}

/* ─────────────────────────────────────────────────────────────────────────
 * Diagnostikk
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * `true` når banen forlot koeffisientbroens deklarerte gyldighetsområde.
 *
 * Predikatet er verifisert mot alle 5028 løste caser: null avvik.
 * FUNN F2: dette er sant for 87 % av realistiske slag. Det er provenance,
 * ikke en advarsel — ikke bygg UI på det.
 *
 * @param {ReadonlyArray<number>} reynoldsRange `[min, maks]`
 * @param {ReadonlyArray<number>} spinParameterRange `[min, maks]`
 * @returns {boolean}
 */
export function isExtrapolated(reynoldsRange, spinParameterRange) {
  return (
    reynoldsRange[0] < reynoldsValidity[0] ||
    reynoldsRange[1] > reynoldsValidity[1] ||
    spinParameterRange[0] < spinParameterValidity[0] ||
    spinParameterRange[1] > spinParameterValidity[1]
  );
}

/**
 * `out.aerodynamicDiagnostics`, med fixturens feltnavn og rekkefølge.
 *
 * `coefficientSetId` og `reverseMagnusPolicy` er PROVENANCE-strenger som
 * baseline faktisk emitterer (constants.js `aeroModelIdentity`). De er ikke
 * brukervendt kopi og skal ikke rendres som det.
 *
 * @param {ReadonlyArray<number>} reynoldsRange
 * @param {ReadonlyArray<number>} spinParameterRange
 * @returns {{coefficientSetId: string, validityKnown: boolean,
 *            reynoldsValidity: number[], spinParameterValidity: number[],
 *            reynoldsRangeObserved: number[], spinParameterRangeObserved: number[],
 *            extrapolated: boolean, reverseMagnusPolicy: string}}
 */
export function aerodynamicDiagnostics(reynoldsRange, spinParameterRange) {
  return {
    coefficientSetId: aeroModelIdentity.coefficientSetId,
    validityKnown: aeroModelIdentity.validityKnown,
    reynoldsValidity: [reynoldsValidity[0], reynoldsValidity[1]],
    spinParameterValidity: [spinParameterValidity[0], spinParameterValidity[1]],
    reynoldsRangeObserved: [reynoldsRange[0], reynoldsRange[1]],
    spinParameterRangeObserved: [spinParameterRange[0], spinParameterRange[1]],
    extrapolated: isExtrapolated(reynoldsRange, spinParameterRange),
    reverseMagnusPolicy: aeroModelIdentity.reverseMagnusPolicy,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Projeksjon på launch-linjen
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Sluttposisjonen dekomponert langs og på tvers av launch-linjen.
 *
 * Launch-linjen er den horisontale retningen `[sin a, cos a, 0]`; høyre-
 * normalen er `[cos a, −sin a, 0]`. Høyden inngår ikke.
 *
 * @param {ReadonlyArray<number>} position `[x, y, z]` i meter.
 * @param {number} startDirection grader, positiv høyre.
 * @returns {{downLaunchLineM: number, curveFromLaunchLineM: number}}
 *   `curveFromLaunchLineM` er RÅ — ingen carry-projeksjon (den eier
 *   `curve.js`, ENGINE-GAPS §6).
 */
export function projectOntoLaunchLine(position, startDirection) {
  const azimuth = startDirection * degToRad;
  const sin = Math.sin(azimuth);
  const cos = Math.cos(azimuth);

  return {
    downLaunchLineM: position[0] * sin + position[1] * cos,
    curveFromLaunchLineM: position[0] * cos - position[1] * sin,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Hovedkallet
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Integrerer én bane til første bakkekryssing.
 *
 * @param {{ballSpeed: number, launchAngle: number, startDirection: number,
 *          spinAxisUnit: ReadonlyArray<number>, totalSpinRpm: number}} input
 *   `ballSpeed` i mph, vinkler i grader, `totalSpinRpm` i rpm.
 *   `spinAxisUnit` er PÅKREVD — den offentlige skalaren `spinAxis` kan ikke
 *   erstatte den (ENGINE-GAPS §1, FUNN F3).
 * @param {{stepSeconds?: number, maxTimeSeconds?: number}} [options]
 *   Kun for konvergensstudier. Baseline er 0.01 s og 30 s; alt annet er
 *   per definisjon ikke baseline.
 * @returns {{position: [number, number, number], timeSeconds: number,
 *            steps: number, spinDirection: number[], initialSpinRadPerSec: number[],
 *            initialVelocityMps: number[], finalSpinRadPerSec: number,
 *            reynoldsRangeObserved: [number, number],
 *            spinParameterRangeObserved: [number, number]}}
 * @throws {Error} `groundNotReachedMessage` når bakken ikke nås innen
 *   `maxTimeSeconds`. Dette er baseline-oppførsel, ikke en defensiv sjekk.
 */
export function integrateFlight(input, options = {}) {
  const h = options.stepSeconds ?? rk4Step;
  const maxTimeSeconds = options.maxTimeSeconds ?? maxFlightTime;

  const velocity = launchVelocity(input);
  const omega0 = impactSpin(input);
  const direction = spinDirection(omega0);
  const spinMagnitude = Math.hypot(omega0[0], omega0[1], omega0[2]);

  let state = initialState(velocity, spinMagnitude);

  const observedRange = {
    reMin: Infinity,
    reMax: -Infinity,
    sMin: Infinity,
    sMax: -Infinity,
  };

  const k1 = new Array(7);
  const k2 = new Array(7);
  const k3 = new Array(7);
  const k4 = new Array(7);
  const stage = new Array(7);
  let next = new Array(7);

  let time = 0;
  let steps = 0;

  while (time < maxTimeSeconds) {
    writeDerivative(state, direction, k1, observedRange);
    writeAddScaled(state, k1, h / 2, stage);
    writeDerivative(stage, direction, k2, observedRange);
    writeAddScaled(state, k2, h / 2, stage);
    writeDerivative(stage, direction, k3, observedRange);
    writeAddScaled(state, k3, h, stage);
    writeDerivative(stage, direction, k4, observedRange);

    for (let i = 0; i < 7; i += 1) {
      next[i] = state[i] + (h * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6;
    }
    steps += 1;

    if (next[2] <= 0) {
      // Lineær interpolasjon mellom siste positive og første ikke-positive høyde.
      const fraction = state[2] / (state[2] - next[2]);

      return {
        position: [
          state[0] + fraction * (next[0] - state[0]),
          state[1] + fraction * (next[1] - state[1]),
          state[2] + fraction * (next[2] - state[2]),
        ],
        timeSeconds: time + fraction * h,
        steps,
        spinDirection: direction,
        initialVelocityMps: velocity,
        initialSpinRadPerSec: omega0,
        finalSpinRadPerSec: state[6] + fraction * (next[6] - state[6]),
        reynoldsRangeObserved: [observedRange.reMin, observedRange.reMax],
        spinParameterRangeObserved: [observedRange.sMin, observedRange.sMax],
      };
    }

    const used = state;
    state = next;
    next = used;
    time += h;
  }

  throw new Error(groundNotReachedMessage);
}

/**
 * Hele §5.7 som ett kall, med fixturens feltnavn.
 *
 * @param {{ballSpeed: number, launchAngle: number, startDirection: number,
 *          spinAxisUnit: ReadonlyArray<number>, totalSpinRpm: number}} input
 * @param {{stepSeconds?: number, maxTimeSeconds?: number}} [options]
 * @returns {{terminalPositionM: [number, number, number],
 *            curveFlightTimeSeconds: number,
 *            rawDownLaunchLineM: number,
 *            curveFlightCarryYd: number,
 *            rawCurveFromLaunchLineM: number,
 *            aerodynamicDiagnostics: object}}
 *   `rawDownLaunchLineM` er ikke et fixturefelt, men ENGINE-GAPS §6 trenger
 *   den rå downrange-metervedien for carry-projeksjonen (`D_raw ≥ 1`).
 *   Fixturen bærer bare yard-varianten.
 * @throws {Error} `groundNotReachedMessage`.
 */
export function solveCurveFlight(input, options = {}) {
  const flight = integrateFlight(input, options);
  const projected = projectOntoLaunchLine(flight.position, input.startDirection);

  return {
    terminalPositionM: flight.position,
    curveFlightTimeSeconds: flight.timeSeconds,
    rawDownLaunchLineM: projected.downLaunchLineM,
    curveFlightCarryYd: projected.downLaunchLineM / yardToMetre,
    rawCurveFromLaunchLineM: projected.curveFromLaunchLineM,
    aerodynamicDiagnostics: aerodynamicDiagnostics(
      flight.reynoldsRangeObserved,
      flight.spinParameterRangeObserved,
    ),
  };
}
