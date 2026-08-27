/// §5.7 + ENGINE-GAPS §1 — den deterministiske RK4-integrasjonen som eier
/// den laterale bøyen.
///
/// BASELINE. Portert fra `engine/src/rk4Integrator.js`. Forbedrer ingenting.
///
/// Verdensakser: `x = høyre`, `y = mållinjen`, `z = opp` (spec §4).
/// Tilstanden er `[x, y, z, vx, vy, vz, |ω|]` — 7-dimensjonal fordi
/// spinnretningen holdes FAST på `unit(ω₀)`; bare magnituden forfaller
/// (`d|ω|/dt = −0.04·|ω|`).
///
/// ── Feller — ikke «fiks» disse ────────────────────────────────────────────
/// 1. `z₀ = 1e-6`, ikke 0 — ellers får flate slag flukttid 0.
///    `edge.dynamic-loft-zero` skal ha flukttid 2.04e-5 s.
/// 2. Modulen krever VEKTOREN `spinAxisUnit`; skalaren `spinAxis` kan ikke
///    rekonstruere den (FUNN F3).
/// 3. `extrapolated: true` er normaltilstanden — 87 % (FUNN F2).
/// 4. Ved `speed == 0` gjøres INGEN aero-observasjon — `edge.club-speed-zero`
///    sitt `reynoldsRangeObserved[0] = 143.30…` kommer fra k₃-trinnet.
/// 5. Observasjonene skjer i ALLE FIRE RK4-trinnene, også i steget som
///    bommer under bakken.
///
/// ── Flyttallsrekkefølge — verifisert mot fixturen i JS ────────────────────
/// - `speed` = hypot(3-arg) — IKKE `sqrt(Σx²)`
/// - `|ω × v|` = `sqrt(cx² + cy² + cz²)` — IKKE hypot
/// - `|ω ⟂ v|` = hypot — IKKE sqrt
/// - `unit(v)` = `v · (1/speed)` — MULTIPLIKASJON
/// - `unit(ω × v)` = `(ω × v) / |ω × v|` — DIVISJON
/// - `a` = `(drag + lift) · (1/m) + g` — multiplikasjon med 1/m
/// - RK4-steget = `s + (h · (k₁ + 2k₂ + 2k₃ + k₄)) / 6` — IKKE `(h/6) · Σ`
/// - ω-retningen = `unit(ω₀)` NORMALISERT PÅ NYTT med hypot — ikke
///   `spinAxisUnit` rått; de skiller 1 ULP (287/343 mot 313/343 i JS-fitten)
///
/// D92: `pow` i løftkoeffisienten er plattform-CRT bak ES-wrapperen —
/// terminalfeltene dømmes mot 1e-9 relativt, aldri eksakt.
public enum RK4Integrator {

  /// Kastes når bakken ikke nås innen `maxTimeSeconds`. Baseline-oppførsel,
  /// ikke en defensiv sjekk.
  public struct GroundNotReached: Error, CustomStringConvertible {
    /// Ordrett meldingen `edge.rk4-no-ground-within-30-seconds` bærer.
    public static let message = "Flight did not reach the ground within maxTimeSeconds"
    public var description: String { Self.message }
  }

  /// Ballens tverrsnittsareal, πR². Utledet — ikke en baseline-konstant.
  /// ⚠ Grupperingen er load-bearing: `0.5·ρ·A·(speed·speed)` med A regnet ut
  /// ÉN gang. Ikke inline den.
  @usableFromInline static let ballCrossSectionArea =
    Double.pi * Constants.ballRadius * Constants.ballRadius

  /// Tyngden som vektor — spec §5.7 skriver en vektoraddisjon.
  @usableFromInline static let gravityAcceleration = Vec3(0, 0, -Constants.gravity)

  // ── Startbetingelser — ENGINE-GAPS §1 ────────────────────────────────────

  /// `v₀ = [V·cos(e)·sin(a), V·cos(e)·cos(a), V·sin(e)]` m/s.
  /// ⚠ `cos(e)` faktoriseres via `horizontal`-variabelen som i kilden;
  /// uttrykkene er venstreassosiative `((V · cos e) · sin a)`.
  public static func launchVelocity(
    ballSpeed: Double, launchAngle: Double, startDirection: Double
  ) -> Vec3 {
    let speedMps = ballSpeed * Constants.mphToMps
    let elevation = Angles.flightDegToRad(launchAngle)
    let azimuth = Angles.flightDegToRad(startDirection)
    let horizontal = FDLibm.cos(elevation)
    return Vec3(
      speedMps * horizontal * FDLibm.sin(azimuth),
      speedMps * horizontal * FDLibm.cos(azimuth),
      speedMps * FDLibm.sin(elevation)
    )
  }

  /// `ω₀ = uₛ · totalSpinRpm · (2π/60)` rad/s.
  /// ⚠ Skalaren regnes ut FØR komponentene skaleres — 1 ULP synlig.
  public static func impactSpin(spinAxisUnit: Vec3, totalSpinRpm: Double) -> Vec3 {
    let magnitude = totalSpinRpm * Constants.rpmToRadPerSec
    return Vec3(
      spinAxisUnit.x * magnitude,
      spinAxisUnit.y * magnitude,
      spinAxisUnit.z * magnitude
    )
  }

  /// Den faste spinnretningen `unit(ω₀)` — normalisert PÅ NYTT selv om
  /// `spinAxisUnit` allerede har lengde 1 (load-bearing, se filhodet).
  /// Degenerert ω₀ gir `[0, 0, 0]`, ikke NaN. ⚠ DIVISJON her, ikke invers.
  public static func spinDirection(_ omega: Vec3) -> Vec3 {
    let magnitude = JSMath.hypot(omega.x, omega.y, omega.z)
    if !(magnitude > 0) { return Vec3(0, 0, 0) }
    return Vec3(omega.x / magnitude, omega.y / magnitude, omega.z / magnitude)
  }

  // ── Aerodynamikk — spec §5.7 ─────────────────────────────────────────────

  /// `Cl = 0.4072 · max(0, S)^0.4`. Klampen er spec-ens.
  /// D92: `pow` er plattform-CRT bak ES-wrapperen.
  public static func liftCoefficient(spinParameter: Double) -> Double {
    Constants.liftCoefficientFactor
      * FDLibm.pow(JSMath.max(0, spinParameter), Constants.liftCoefficientExponent)
  }

  /// Koeffisientbroen før 7-jern-kalibreringen.
  public static func dragBridge(reynolds: Double, spinParameter: Double) -> Double {
    Constants.dragBridgeBase
      + Constants.dragBridgeReynoldsAmplitude
        / (1
          + FDLibm.exp(
            (reynolds - Constants.dragBridgeReynoldsMidpoint)
              / Constants.dragBridgeReynoldsWidth))
      + (Constants.dragBridgeSpinAmplitude * spinParameter)
        / (Constants.dragBridgeSpinHalf + spinParameter)
  }

  /// `Cd = CdBridge · 1.275116456035` — kompatibilitetskalibrering, ikke
  /// ballfysikk.
  public static func dragCoefficient(reynolds: Double, spinParameter: Double) -> Double {
    dragBridge(reynolds: reynolds, spinParameter: spinParameter)
      * Constants.dragCompatibilityScale
  }

  /// Observert (Re, S)-intervall under integrasjonen.
  @usableFromInline struct ObservedRange {
    var reMin = Double.infinity
    var reMax = -Double.infinity
    var sMin = Double.infinity
    var sMax = -Double.infinity
  }

  /// Derivatet av tilstanden, skrevet inn i `out`. Registrerer (Re, S) når
  /// farten er positiv og `observe` er satt.
  ///
  /// ⚠ Aritmetikken følger `writeDerivative` i JS linje for linje — hver
  /// gruppering i filhodet håndheves her.
  @usableFromInline
  static func writeDerivative(
    _ state: [Double], _ dir: Vec3, into out: inout [Double],
    observing range: inout ObservedRange, observe: Bool
  ) {
    let airX = state[3] - Constants.wind.x
    let airY = state[4] - Constants.wind.y
    let airZ = state[5] - Constants.wind.z
    let speed = JSMath.hypot(airX, airY, airZ)

    let spinMagnitude = state[6]
    let omegaX = dir.x * spinMagnitude
    let omegaY = dir.y * spinMagnitude
    let omegaZ = dir.z * spinMagnitude

    out[0] = state[3]
    out[1] = state[4]
    out[2] = state[5]
    out[6] = -Constants.spinDecay * spinMagnitude

    if !(speed > 0) {
      // Ingen observasjon her — felle 4.
      out[3] = gravityAcceleration.x
      out[4] = gravityAcceleration.y
      out[5] = gravityAcceleration.z
      return
    }

    let inverseSpeed = 1 / speed
    let unitX = airX * inverseSpeed
    let unitY = airY * inverseSpeed
    let unitZ = airZ * inverseSpeed

    // ω projisert bort fra strømningsretningen: ω − (ω·û)û.
    let alongFlow = omegaX * unitX + omegaY * unitY + omegaZ * unitZ
    let perpendicular = JSMath.hypot(
      omegaX - alongFlow * unitX,
      omegaY - alongFlow * unitY,
      omegaZ - alongFlow * unitZ
    )

    let spinParameter = (Constants.ballRadius * perpendicular) / speed
    let reynolds = (speed * 2 * Constants.ballRadius) / Constants.kinematicViscosity

    if observe {
      if reynolds < range.reMin { range.reMin = reynolds }
      if reynolds > range.reMax { range.reMax = reynolds }
      if spinParameter < range.sMin { range.sMin = spinParameter }
      if spinParameter > range.sMax { range.sMax = spinParameter }
    }

    let cl =
      Constants.liftCoefficientFactor
      * FDLibm.pow(JSMath.max(0, spinParameter), Constants.liftCoefficientExponent)
    let cd =
      (Constants.dragBridgeBase
        + Constants.dragBridgeReynoldsAmplitude
          / (1
            + FDLibm.exp(
              (reynolds - Constants.dragBridgeReynoldsMidpoint)
                / Constants.dragBridgeReynoldsWidth))
        + (Constants.dragBridgeSpinAmplitude * spinParameter)
          / (Constants.dragBridgeSpinHalf + spinParameter))
      * Constants.dragCompatibilityScale

    let dynamicPressureArea =
      0.5 * Constants.airDensity * ballCrossSectionArea * (speed * speed)

    let dragMagnitude = -(dynamicPressureArea * cd)
    let dragX = dragMagnitude * unitX
    let dragY = dragMagnitude * unitY
    let dragZ = dragMagnitude * unitZ

    // ω × airVelocity — lengden er SQRT AV KVADRATSUM, ikke hypot.
    let crossX = omegaY * airZ - omegaZ * airY
    let crossY = omegaZ * airX - omegaX * airZ
    let crossZ = omegaX * airY - omegaY * airX
    let crossLength = (crossX * crossX + crossY * crossY + crossZ * crossZ).squareRoot()

    var liftX = 0.0
    var liftY = 0.0
    var liftZ = 0.0
    if crossLength > 0 {
      let liftMagnitude = dynamicPressureArea * cl
      // ⚠ DIVISJON per komponent — ikke multiplikasjon med invers.
      liftX = liftMagnitude * (crossX / crossLength)
      liftY = liftMagnitude * (crossY / crossLength)
      liftZ = liftMagnitude * (crossZ / crossLength)
    }

    let inverseMass = 1 / Constants.ballMass
    out[3] = (dragX + liftX) * inverseMass + gravityAcceleration.x
    out[4] = (dragY + liftY) * inverseMass + gravityAcceleration.y
    out[5] = (dragZ + liftZ) * inverseMass + gravityAcceleration.z
  }

  /// Ett aerodynamisk oppslag for én tilstand — testbar enkeltbit.
  /// `observed == false` når `speed == 0`; da er Re og S 0 og akselerasjonen
  /// ren tyngdekraft (felle 4).
  public static func aeroSample(
    state: [Double], spinDirectionUnit: Vec3
  ) -> AeroSample {
    let airX = state[3] - Constants.wind.x
    let airY = state[4] - Constants.wind.y
    let airZ = state[5] - Constants.wind.z
    let speed = JSMath.hypot(airX, airY, airZ)

    if !(speed > 0) {
      return AeroSample(
        speed: speed, reynolds: 0, spinParameter: 0,
        liftCoefficient: 0, dragCoefficient: 0,
        acceleration: gravityAcceleration, observed: false)
    }

    var out = [Double](repeating: 0, count: 7)
    var range = ObservedRange()
    writeDerivative(state, spinDirectionUnit, into: &out, observing: &range, observe: true)

    let spinMagnitude = state[6]
    let omegaX = spinDirectionUnit.x * spinMagnitude
    let omegaY = spinDirectionUnit.y * spinMagnitude
    let omegaZ = spinDirectionUnit.z * spinMagnitude
    let inverseSpeed = 1 / speed
    let unitX = airX * inverseSpeed
    let unitY = airY * inverseSpeed
    let unitZ = airZ * inverseSpeed
    let alongFlow = omegaX * unitX + omegaY * unitY + omegaZ * unitZ
    let perpendicular = JSMath.hypot(
      omegaX - alongFlow * unitX,
      omegaY - alongFlow * unitY,
      omegaZ - alongFlow * unitZ)
    let spinParameter = (Constants.ballRadius * perpendicular) / speed
    let reynolds = (speed * 2 * Constants.ballRadius) / Constants.kinematicViscosity

    return AeroSample(
      speed: speed,
      reynolds: reynolds,
      spinParameter: spinParameter,
      liftCoefficient: liftCoefficient(spinParameter: spinParameter),
      dragCoefficient: dragCoefficient(reynolds: reynolds, spinParameter: spinParameter),
      acceleration: Vec3(out[3], out[4], out[5]),
      observed: true)
  }

  public struct AeroSample: Equatable, Sendable {
    public let speed: Double
    public let reynolds: Double
    public let spinParameter: Double
    public let liftCoefficient: Double
    public let dragCoefficient: Double
    public let acceleration: Vec3
    public let observed: Bool
  }

  // ── Diagnostikk ──────────────────────────────────────────────────────────

  /// `true` når banen forlot koeffisientbroens gyldighetsområde.
  /// FUNN F2: sant for 87 % av realistiske slag — provenance, ikke advarsel.
  public static func isExtrapolated(
    reynoldsRange: (Double, Double), spinParameterRange: (Double, Double)
  ) -> Bool {
    reynoldsRange.0 < Constants.reynoldsValidity[0]
      || reynoldsRange.1 > Constants.reynoldsValidity[1]
      || spinParameterRange.0 < Constants.spinParameterValidity[0]
      || spinParameterRange.1 > Constants.spinParameterValidity[1]
  }

  /// `out.aerodynamicDiagnostics`, med fixturens feltnavn.
  public struct Diagnostics: Equatable, Sendable {
    public let coefficientSetId: String
    public let validityKnown: Bool
    public let reynoldsValidity: [Double]
    public let spinParameterValidity: [Double]
    public let reynoldsRangeObserved: [Double]
    public let spinParameterRangeObserved: [Double]
    public let extrapolated: Bool
    public let reverseMagnusPolicy: String
  }

  public static func aerodynamicDiagnostics(
    reynoldsRange: (Double, Double), spinParameterRange: (Double, Double)
  ) -> Diagnostics {
    Diagnostics(
      coefficientSetId: Constants.aeroModelIdentity.coefficientSetId,
      validityKnown: Constants.aeroModelIdentity.validityKnown,
      reynoldsValidity: Constants.reynoldsValidity,
      spinParameterValidity: Constants.spinParameterValidity,
      reynoldsRangeObserved: [reynoldsRange.0, reynoldsRange.1],
      spinParameterRangeObserved: [spinParameterRange.0, spinParameterRange.1],
      extrapolated: isExtrapolated(
        reynoldsRange: reynoldsRange, spinParameterRange: spinParameterRange),
      reverseMagnusPolicy: Constants.aeroModelIdentity.reverseMagnusPolicy)
  }

  // ── Projeksjon på launch-linjen ──────────────────────────────────────────

  /// Sluttposisjonen langs og på tvers av den horisontale launch-linjen
  /// `[sin a, cos a, 0]`; høyre-normalen er `[cos a, −sin a, 0]`.
  /// `curveFromLaunchLineM` er RÅ — carry-projeksjonen eies av `curve`-modulen.
  public static func projectOntoLaunchLine(
    position: Vec3, startDirection: Double
  ) -> (downLaunchLineM: Double, curveFromLaunchLineM: Double) {
    let azimuth = Angles.flightDegToRad(startDirection)
    let sin = FDLibm.sin(azimuth)
    let cos = FDLibm.cos(azimuth)
    return (
      position.x * sin + position.y * cos,
      position.x * cos - position.y * sin
    )
  }

  // ── Hovedkallet ──────────────────────────────────────────────────────────

  public struct FlightResult: Sendable {
    public let position: Vec3
    public let timeSeconds: Double
    public let steps: Int
    public let spinDirection: Vec3
    public let initialVelocityMps: Vec3
    public let initialSpinRadPerSec: Vec3
    public let finalSpinRadPerSec: Double
    public let reynoldsRangeObserved: (Double, Double)
    public let spinParameterRangeObserved: (Double, Double)
  }

  /// Integrerer én bane til første bakkekryssing (lineært interpolert).
  /// Kaster `GroundNotReached` etter `maxTimeSeconds` — baseline-oppførsel.
  public static func integrateFlight(
    ballSpeed: Double,
    launchAngle: Double,
    startDirection: Double,
    spinAxisUnit: Vec3,
    totalSpinRpm: Double,
    stepSeconds: Double = Constants.rk4Step,
    maxTimeSeconds: Double = Constants.maxFlightTime
  ) throws -> FlightResult {
    let h = stepSeconds

    let velocity = launchVelocity(
      ballSpeed: ballSpeed, launchAngle: launchAngle, startDirection: startDirection)
    let omega0 = impactSpin(spinAxisUnit: spinAxisUnit, totalSpinRpm: totalSpinRpm)
    let direction = spinDirection(omega0)
    let spinMagnitude = JSMath.hypot(omega0.x, omega0.y, omega0.z)

    var state: [Double] = [
      0, 0, Constants.rk4InitialHeight,
      velocity.x, velocity.y, velocity.z,
      spinMagnitude,
    ]

    var range = ObservedRange()
    var k1 = [Double](repeating: 0, count: 7)
    var k2 = [Double](repeating: 0, count: 7)
    var k3 = [Double](repeating: 0, count: 7)
    var k4 = [Double](repeating: 0, count: 7)
    var stage = [Double](repeating: 0, count: 7)
    var next = [Double](repeating: 0, count: 7)

    var time = 0.0
    var steps = 0

    while time < maxTimeSeconds {
      writeDerivative(state, direction, into: &k1, observing: &range, observe: true)
      for i in 0..<7 { stage[i] = state[i] + (h / 2) * k1[i] }
      writeDerivative(stage, direction, into: &k2, observing: &range, observe: true)
      for i in 0..<7 { stage[i] = state[i] + (h / 2) * k2[i] }
      writeDerivative(stage, direction, into: &k3, observing: &range, observe: true)
      for i in 0..<7 { stage[i] = state[i] + h * k3[i] }
      writeDerivative(stage, direction, into: &k4, observing: &range, observe: true)

      // ⚠ `(h · Σ) / 6`, ikke `(h/6) · Σ` — grupperingen er load-bearing.
      for i in 0..<7 {
        next[i] = state[i] + (h * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6
      }
      steps += 1

      if next[2] <= 0 {
        // Lineær interpolasjon mellom siste positive og første ikke-positive.
        let fraction = state[2] / (state[2] - next[2])
        return FlightResult(
          position: Vec3(
            state[0] + fraction * (next[0] - state[0]),
            state[1] + fraction * (next[1] - state[1]),
            state[2] + fraction * (next[2] - state[2])
          ),
          timeSeconds: time + fraction * h,
          steps: steps,
          spinDirection: direction,
          initialVelocityMps: velocity,
          initialSpinRadPerSec: omega0,
          finalSpinRadPerSec: state[6] + fraction * (next[6] - state[6]),
          reynoldsRangeObserved: (range.reMin, range.reMax),
          spinParameterRangeObserved: (range.sMin, range.sMax))
      }

      swap(&state, &next)
      time += h
    }

    throw GroundNotReached()
  }

  public struct CurveFlight: Sendable {
    public let terminalPositionM: Vec3
    public let curveFlightTimeSeconds: Double
    /// Rå downrange i meter — ikke et fixturefelt, men ENGINE-GAPS §6
    /// trenger den for `D_raw ≥ 1`-porten.
    public let rawDownLaunchLineM: Double
    public let curveFlightCarryYd: Double
    public let rawCurveFromLaunchLineM: Double
    public let aerodynamicDiagnostics: Diagnostics
  }

  /// Hele §5.7 som ett kall, med fixturens feltnavn.
  public static func solveCurveFlight(
    ballSpeed: Double,
    launchAngle: Double,
    startDirection: Double,
    spinAxisUnit: Vec3,
    totalSpinRpm: Double
  ) throws -> CurveFlight {
    let flight = try integrateFlight(
      ballSpeed: ballSpeed,
      launchAngle: launchAngle,
      startDirection: startDirection,
      spinAxisUnit: spinAxisUnit,
      totalSpinRpm: totalSpinRpm)
    let projected = projectOntoLaunchLine(
      position: flight.position, startDirection: startDirection)

    return CurveFlight(
      terminalPositionM: flight.position,
      curveFlightTimeSeconds: flight.timeSeconds,
      rawDownLaunchLineM: projected.downLaunchLineM,
      curveFlightCarryYd: projected.downLaunchLineM / Constants.yardToMetre,
      rawCurveFromLaunchLineM: projected.curveFromLaunchLineM,
      aerodynamicDiagnostics: aerodynamicDiagnostics(
        reynoldsRange: flight.reynoldsRangeObserved,
        spinParameterRange: flight.spinParameterRangeObserved))
  }
}
