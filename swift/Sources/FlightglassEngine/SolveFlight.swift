/// §11.1 — den offentlige `solveFlight`. Syr sammen §5.1–§5.8 og eier alle
/// 81 feltene i `out`.
///
/// BASELINE. Portert fra `engine/src/solveFlight.js`.
///
/// Kjeder verdt å merke seg (alle fra kilden, fixture-verifisert i JS):
/// - §5.4 mates med `sinSpinLoft3D = |v × n|` DIREKTE, ikke
///   `sin(spinLoft3DDeg·π/180)` — rundturen skiller i 3304 caser.
/// - §5.5 bruker den 3-DIMENSJONALE spin loften.
/// - GAPS §6 får `rawDownrangeM` fra RK4 direkte (`rawDownLaunchLineM`),
///   ikke via yard-feltet — yard-rundturen bommer 1 ULP i 93 caser.
/// - `spinLoft` og `spinLoft3DDeg` er samme tall — det offentlige feltet ER
///   3-D-vinkelen.
/// - `centeredStrike: true` / `gearEffectApplied: false` er konstante (D52).
public enum SolveFlight {

  public enum ContractError: Error, Equatable {
    case nonFiniteInput(field: String)
    case negativeClubSpeed(Double)
  }

  /// Alle 81 feltene i `flight-golden.json` sine `out`-objekter.
  ///
  /// Numeriske felt eksponeres også via `numericValue(_:)` slik at
  /// fixture- og differensialtester kan iterere feltnavn uten en oversettelse
  /// i midten.
  public struct Result: Sendable {
    // Input-ekko — uendret, uklampet.
    public let clubPath: Double
    public let faceAngle: Double
    public let attackAngle: Double
    public let dynamicLoft: Double
    public let clubSpeed: Double

    /// Kompatibilitetsetikett — provenance, ikke brukervendt kopi.
    public let club: String

    public let startDirection: Double
    public let spinLoft: Double
    public let spinLoft3DDeg: Double
    public let signedVerticalSpinLoftDeg: Double
    public let launchAngle: Double
    public let spinAxis: Double
    public let ballSpeed: Double

    public let carry: Double
    public let apex: Double
    public let landingAngle: Double
    public let offline: Double
    public let total: Double

    public let curve: Double
    public let curveFromLaunchLineM: Double
    public let rawCurveFromLaunchLineM: Double
    public let curveFlightCarryYd: Double
    public let curveFlightTimeSeconds: Double
    public let curveCarryProjectionDefined: Bool
    public let curveCarryProjectionScale: Double?
    public let curveCarryProjectionMinimumDownrangeM: Double

    public let backspin: Double
    public let signedBackspinRpm: Double
    public let totalSpinRpm: Double
    public let rightCurveSpinRpm: Double
    public let spinVectorRadPerSec: Vec3

    public let spinAxisUnit: Vec3
    public let clubVelocityUnit: Vec3
    public let faceNormalUnit: Vec3
    public let horizontalSpinLoftComponent: Double
    public let verticalSpinLoftComponent: Double

    public let centeredStrike: Bool
    public let gearEffectApplied: Bool

    public let aerodynamicDiagnostics: RK4Integrator.Diagnostics

    public let smash: Double
    public let smashEff: Double
    public let apexLaunchFactor: Double
    public let faceToPath: Double

    public let startFaceW: Double
    public let launchInterceptBlend: Double
    public let spinCalibration: Double
    public let spinRpmRaw: Double
    public let carryBallSpeedFit: Double
    public let carryLaunchEfficiency: Double
    public let apexBallSpeedTerm: Double
    public let apexLaunchTerm: Double
    public let rollFrac: Double
    public let roll: Double
    public let landingSpinTerm: Double
    public let landingLaunchTerm: Double
    public let landingApexTerm: Double
    public let landingDomainTerm: Double
    public let landingRaw: Double

    public let shape: String

    /// Numerisk oppslag på fixturens feltnavn. Konstantfeltene fixturen bærer
    /// per case (`launchLoftW` osv.) besvares fra `Constants` — de ER
    /// konstante, og testen mot fixturen pinner det.
    public func numericValue(_ field: String) -> Double? {
      switch field {
      case "clubPath": return clubPath
      case "faceAngle": return faceAngle
      case "attackAngle": return attackAngle
      case "dynamicLoft": return dynamicLoft
      case "clubSpeed": return clubSpeed
      case "startDirection": return startDirection
      case "spinLoft": return spinLoft
      case "spinLoft3DDeg": return spinLoft3DDeg
      case "signedVerticalSpinLoftDeg": return signedVerticalSpinLoftDeg
      case "launchAngle": return launchAngle
      case "spinAxis": return spinAxis
      case "ballSpeed": return ballSpeed
      case "carry": return carry
      case "apex": return apex
      case "landingAngle": return landingAngle
      case "offline": return offline
      case "total": return total
      case "curve": return curve
      case "curveFromLaunchLineM": return curveFromLaunchLineM
      case "rawCurveFromLaunchLineM": return rawCurveFromLaunchLineM
      case "curveFlightCarryYd": return curveFlightCarryYd
      case "curveFlightTimeSeconds": return curveFlightTimeSeconds
      case "curveCarryProjectionScale": return curveCarryProjectionScale
      case "curveCarryProjectionMinimumDownrangeM":
        return curveCarryProjectionMinimumDownrangeM
      case "backspin": return backspin
      case "signedBackspinRpm": return signedBackspinRpm
      case "totalSpinRpm": return totalSpinRpm
      case "rightCurveSpinRpm": return rightCurveSpinRpm
      case "horizontalSpinLoftComponent": return horizontalSpinLoftComponent
      case "verticalSpinLoftComponent": return verticalSpinLoftComponent
      case "smash": return smash
      case "smashEff": return smashEff
      case "apexLaunchFactor": return apexLaunchFactor
      case "faceToPath": return faceToPath
      case "startFaceW": return startFaceW
      case "launchLoftW": return Constants.launchLoftW
      case "launchLoftQuadratic": return Constants.launchLoftQuadratic
      case "launchAttackW": return Constants.launchAttackW
      case "launchIntercept": return Constants.launchIntercept
      case "launchInterceptBlend": return launchInterceptBlend
      case "smashModelIntercept": return Constants.smashModelIntercept
      case "smashSpinLoftLinear": return Constants.smashSpinLoftLinear
      case "smashSpinLoftQuadratic": return Constants.smashSpinLoftQuadratic
      case "smashMinimum": return Constants.smashMinimum
      case "smashMaximum": return Constants.smashMaximum
      case "spinCalibration": return spinCalibration
      case "spinCalibrationLow": return Constants.spinCalibrationLow
      case "spinCalibrationRange": return Constants.spinCalibrationRange
      case "spinCalibrationMidpointDeg": return Constants.spinCalibrationMidpointDeg
      case "spinCalibrationWidthDeg": return Constants.spinCalibrationWidthDeg
      case "spinRpmRaw": return spinRpmRaw
      case "maxTotalSpinRpm": return Constants.maxTotalSpinRpm
      case "carryBallSpeedLinear": return Constants.carryBallSpeedLinear
      case "carryBallSpeedQuadratic": return Constants.carryBallSpeedQuadratic
      case "carryBallSpeedFit": return carryBallSpeedFit
      case "carryFullLaunchAtDeg": return Constants.carryFullLaunchAtDeg
      case "carryLaunchEfficiency": return carryLaunchEfficiency
      case "apexBasePerBallSpeed": return Constants.apexBasePerBallSpeed
      case "apexLaunchPerBallSpeedDeg": return Constants.apexLaunchPerBallSpeedDeg
      case "apexBallSpeedTerm": return apexBallSpeedTerm
      case "apexLaunchTerm": return apexLaunchTerm
      case "rollFrac": return rollFrac
      case "roll": return roll
      case "landingBase": return Constants.landingBase
      case "landingSpinTerm": return landingSpinTerm
      case "landingLaunchTerm": return landingLaunchTerm
      case "landingApexTerm": return landingApexTerm
      case "landingDomainTerm": return landingDomainTerm
      case "landingSpinLoftTau": return Constants.landingSpinLoftTau
      case "landingRaw": return landingRaw
      default: return nil
      }
    }

    /// Vektorfeltene, på fixturens navn.
    public func vectorValue(_ field: String) -> Vec3? {
      switch field {
      case "spinVectorRadPerSec": return spinVectorRadPerSec
      case "spinAxisUnit": return spinAxisUnit
      case "clubVelocityUnit": return clubVelocityUnit
      case "faceNormalUnit": return faceNormalUnit
      default: return nil
      }
    }
  }

  /// Alle numeriske skalarfelt, for feltvis iterasjon i tester.
  public static let numericFieldNames: [String] = [
    "clubPath", "faceAngle", "attackAngle", "dynamicLoft", "clubSpeed",
    "startDirection", "spinLoft", "spinLoft3DDeg", "signedVerticalSpinLoftDeg",
    "launchAngle", "spinAxis", "ballSpeed",
    "carry", "apex", "landingAngle", "offline", "total",
    "curve", "curveFromLaunchLineM", "rawCurveFromLaunchLineM",
    "curveFlightCarryYd", "curveFlightTimeSeconds",
    "curveCarryProjectionScale", "curveCarryProjectionMinimumDownrangeM",
    "backspin", "signedBackspinRpm", "totalSpinRpm", "rightCurveSpinRpm",
    "horizontalSpinLoftComponent", "verticalSpinLoftComponent",
    "smash", "smashEff", "apexLaunchFactor", "faceToPath",
    "startFaceW", "launchLoftW", "launchLoftQuadratic", "launchAttackW",
    "launchIntercept", "launchInterceptBlend",
    "smashModelIntercept", "smashSpinLoftLinear", "smashSpinLoftQuadratic",
    "smashMinimum", "smashMaximum",
    "spinCalibration", "spinCalibrationLow", "spinCalibrationRange",
    "spinCalibrationMidpointDeg", "spinCalibrationWidthDeg", "spinRpmRaw",
    "maxTotalSpinRpm",
    "carryBallSpeedLinear", "carryBallSpeedQuadratic", "carryBallSpeedFit",
    "carryFullLaunchAtDeg", "carryLaunchEfficiency",
    "apexBasePerBallSpeed", "apexLaunchPerBallSpeedDeg",
    "apexBallSpeedTerm", "apexLaunchTerm",
    "rollFrac", "roll",
    "landingBase", "landingSpinTerm", "landingLaunchTerm", "landingApexTerm",
    "landingDomainTerm", "landingSpinLoftTau", "landingRaw",
  ]

  /// RK4-terminalfeltene — de eneste som dømmes mot 1e-9 relativt (D92);
  /// feltene AVLEDET av dem arver klassen. Alt annet er eksakt.
  public static let rk4ChainFields: Set<String> = [
    "rawCurveFromLaunchLineM", "curveFlightCarryYd", "curveFlightTimeSeconds",
    "curve", "curveFromLaunchLineM", "curveCarryProjectionScale",
    "offline",  // carry·sin(a) + curve — arver curve-avviket
  ]

  /// Toleranseklassen per felt, deklarert — ikke antatt.
  public static func declaredToleranceIsRK4(_ field: String) -> Bool {
    rk4ChainFields.contains(field)
  }

  /// Hele kjeden. Kaster `ContractError` på §3-brudd og
  /// `RK4Integrator.GroundNotReached` (ordrett melding) ved 30 s-timeout.
  public static func solveThrowing(
    clubSpeed: Double,
    faceAngle: Double,
    clubPath: Double,
    attackAngle: Double,
    dynamicLoft: Double
  ) throws -> Result {
    for (name, value) in [
      ("clubSpeed", clubSpeed), ("faceAngle", faceAngle), ("clubPath", clubPath),
      ("attackAngle", attackAngle), ("dynamicLoft", dynamicLoft),
    ] {
      guard value.isFinite else { throw ContractError.nonFiniteInput(field: name) }
    }
    // Spec §3: clubSpeed er den eneste med fortegnsbegrensning.
    guard clubSpeed >= 0 else { throw ContractError.negativeClubSpeed(clubSpeed) }

    // §5.2 — eksakt sentrert D-plane-geometri.
    let geometry = Geometry3D.solve(
      attackAngle: attackAngle, clubPath: clubPath,
      dynamicLoft: dynamicLoft, faceAngle: faceAngle)

    let faceToPath = faceAngle - clubPath

    // |v × n| — §5.4 bruker denne DIREKTE (bit-lik geometriens egen).
    let sinSpinLoft3D = Geometry3D.magnitude(
      Geometry3D.cross(geometry.clubVelocityUnit, geometry.faceNormalUnit))

    // §5.1 og §5.3.
    let start = StartDirection.solve(
      faceAngle: faceAngle, clubPath: clubPath, dynamicLoft: dynamicLoft)
    let launch = LaunchAngle.solve(dynamicLoft: dynamicLoft, attackAngle: attackAngle)

    // §5.4 — ballSpeed sendes bevisst IKKE inn (finnes først etter §5.5;
    // nullregelen dekkes av aksedelen, verifisert i alle 5028 caser).
    let spin = SpinMagnitude.solve(
      clubSpeed: clubSpeed, dynamicLoft: dynamicLoft, attackAngle: attackAngle,
      sinSpinLoft3D: sinSpinLoft3D)

    // §5.4 — projeksjon på launch-rammen.
    let backspin = BackspinProjection.solve(
      launchAngle: launch.launchAngle,
      startDirection: start.startDirection,
      spinAxisUnit: geometry.spinAxisUnit,
      totalSpinRpm: spin.totalSpinRpm)

    // §5.5 — 3-D spin loft, ikke vertikal.
    let smash = SmashBallSpeed.solve(clubSpeed: clubSpeed, spinLoft: geometry.spinLoft3DDeg)

    // §5.6.
    let longitudinal = LongitudinalLegacy.solve(
      ballSpeed: smash.ballSpeed,
      launchAngle: launch.launchAngle,
      dynamicLoft: dynamicLoft,
      attackAngle: attackAngle)

    // §5.7 — RK4. Krever VEKTOREN spinAxisUnit (FUNN F3).
    let curveFlight = try RK4Integrator.solveCurveFlight(
      ballSpeed: smash.ballSpeed,
      launchAngle: launch.launchAngle,
      startDirection: start.startDirection,
      spinAxisUnit: geometry.spinAxisUnit,
      totalSpinRpm: spin.totalSpinRpm)

    // GAPS §6 — rawDownrangeM fra RK4 DIREKTE, ikke yard-rundturen.
    let curve = CurveProjection.solve(
      rawCurveFromLaunchLineM: curveFlight.rawCurveFromLaunchLineM,
      rawDownrangeM: curveFlight.rawDownLaunchLineM,
      targetCarryM: longitudinal.carry * Constants.yardToMetre,
      hasFlight: OutcomeAdapter.hasFlight(carry: longitudinal.carry),
      faceToPath: faceToPath)

    // §5.8 — mangler cos-leddet med vilje.
    let offline = OfflineComposition.solve(
      carry: longitudinal.carry,
      startDirection: start.startDirection,
      curve: curve.curve)

    let shapeLabel = OutcomeAdapter.shape(
      startDirection: start.startDirection, faceToPath: faceToPath)

    return Result(
      clubPath: clubPath,
      faceAngle: faceAngle,
      attackAngle: attackAngle,
      dynamicLoft: dynamicLoft,
      clubSpeed: clubSpeed,
      club: Constants.aeroModelIdentity.club,
      startDirection: start.startDirection,
      spinLoft: geometry.spinLoft3DDeg,
      spinLoft3DDeg: geometry.spinLoft3DDeg,
      signedVerticalSpinLoftDeg: geometry.signedVerticalSpinLoftDeg,
      launchAngle: launch.launchAngle,
      spinAxis: geometry.spinAxis,
      ballSpeed: smash.ballSpeed,
      carry: longitudinal.carry,
      apex: longitudinal.apex,
      landingAngle: longitudinal.landingAngle,
      offline: offline,
      total: longitudinal.total,
      curve: curve.curve,
      curveFromLaunchLineM: curve.curveFromLaunchLineM,
      rawCurveFromLaunchLineM: curveFlight.rawCurveFromLaunchLineM,
      curveFlightCarryYd: curveFlight.curveFlightCarryYd,
      curveFlightTimeSeconds: curveFlight.curveFlightTimeSeconds,
      curveCarryProjectionDefined: curve.curveCarryProjectionDefined,
      curveCarryProjectionScale: curve.curveCarryProjectionScale,
      curveCarryProjectionMinimumDownrangeM:
        Constants.curveCarryProjectionMinimumDownrangeM,
      backspin: backspin.backspin,
      signedBackspinRpm: backspin.signedBackspinRpm,
      totalSpinRpm: spin.totalSpinRpm,
      rightCurveSpinRpm: backspin.rightCurveSpinRpm,
      spinVectorRadPerSec: backspin.spinVectorRadPerSec,
      spinAxisUnit: geometry.spinAxisUnit,
      clubVelocityUnit: geometry.clubVelocityUnit,
      faceNormalUnit: geometry.faceNormalUnit,
      horizontalSpinLoftComponent: geometry.horizontalSpinLoftComponent,
      verticalSpinLoftComponent: geometry.verticalSpinLoftComponent,
      centeredStrike: true,
      gearEffectApplied: false,
      aerodynamicDiagnostics: curveFlight.aerodynamicDiagnostics,
      smash: smash.smash,
      smashEff: smash.smashEff,
      apexLaunchFactor: longitudinal.apexLaunchFactor,
      faceToPath: faceToPath,
      startFaceW: start.startFaceW,
      launchInterceptBlend: launch.launchInterceptBlend,
      spinCalibration: spin.spinCalibration,
      spinRpmRaw: spin.spinRpmRaw,
      carryBallSpeedFit: longitudinal.carryBallSpeedFit,
      carryLaunchEfficiency: longitudinal.carryLaunchEfficiency,
      apexBallSpeedTerm: longitudinal.apexBallSpeedTerm,
      apexLaunchTerm: longitudinal.apexLaunchTerm,
      rollFrac: longitudinal.rollFrac,
      roll: longitudinal.roll,
      landingSpinTerm: longitudinal.landingSpinTerm,
      landingLaunchTerm: longitudinal.landingLaunchTerm,
      landingApexTerm: longitudinal.landingApexTerm,
      landingDomainTerm: longitudinal.landingDomainTerm,
      landingRaw: longitudinal.landingRaw,
      shape: shapeLabel)
  }
}
