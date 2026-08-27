/// Flightglass engine — numeriske konstanter.
///
/// BASELINE. Portert ordrett fra `engine/src/constants.js`, som igjen er hentet
/// ordrett fra spec §5/§8, `ENGINE-GAPS.md` og de to golden-fixturene.
///
/// Ingen verdi her er avrundet, «ryddet» eller forbedret. Ser et tall feil ut,
/// er det fordi dagens motor har det tallet. Endring av en verdi her endrer
/// baseline og skal ikke skje uten en eksplisitt, versjonert fysikkendring
/// gjennomført i BEGGE motorer (D75).
///
/// Navngivingen følger JS-modulen binding for binding, slik at en diff mot
/// `constants.js` er mekanisk lesbar.
public enum Constants {

  // ───────────────────────────────────────────────────────────────────────
  // Enheter og konvertering  (spec §5.5, §5.7, §6, §8.1)
  // ───────────────────────────────────────────────────────────────────────

  /// mph → m/s. Spec §5.4: `ClubSpeed × 0.44704`.
  public static let mphToMps = 0.44704

  /// yard → meter. Spec §6: UI-adapteren konverterer én gang med 0.9144.
  public static let yardToMetre = 0.9144

  /// Centimeter per meter. Spec §8.1: `LowPointX = (10.5 − BallPositionCm) / 100`.
  ///
  /// ⚠ DIVIDER med denne. Ikke multipliser med 0.01 — det er 1 ULP unna og gir
  /// feil `lowPointX` i 250 av 2500 studio-caser. Derfor er konstanten 100 og
  /// ikke 0.01: den gale operasjonen skal være tungvint å skrive.
  public static let cmPerMetre = 100.0

  /// Grader → radianer, flight-konvensjonen.
  ///
  /// ⚠ ULP-FELLE. De to motorene bruker ULIK rekkefølge, og forskjellen er
  /// 1–2 ULP — nok til å bryte bit-eksakte tester. Bruk aldri denne rått;
  /// bruk `Angles.flightDegToRad` / `Angles.studioDegToRad`, som er navngitt
  /// etter motoren de tilhører.
  public static let degToRad = Double.pi / 180

  /// Radianer → grader.
  public static let radToDeg = 180 / Double.pi

  /// rpm → rad/s. ENGINE-GAPS §1: `ω₀ = uₛ · totalSpinRpm · (2π/60)`.
  public static let rpmToRadPerSec = (2 * Double.pi) / 60

  /// rad/s → rpm. Spec §5.4: `spinRadPerSecond × 60 / (2π)`.
  public static let radPerSecToRpm = 60 / (2 * Double.pi)

  // ───────────────────────────────────────────────────────────────────────
  // Ball, kølle og miljø  (spec §5.4, §5.7)
  // ───────────────────────────────────────────────────────────────────────

  /// Golfballens masse i kg. Spec §5.4 og §5.7.
  public static let ballMass = 0.04593

  /// Golfballens radius i meter, flight-motoren. Spec §5.4 og §5.7.
  ///
  /// MERK: Studio bruker en ANNEN ballradius (`studioBallRadius` = 0.0213), og
  /// kontaktmodellen en TREDJE (`ContactModel.ballRadiusM` = 0.021336). Alle
  /// tre er pinnet hver for seg. Ikke harmoniser dem.
  public static let ballRadius = 0.021335

  /// Standard lufttetthet i kg/m³. Spec §5.7.
  public static let airDensity = 1.225

  /// Kinematisk viskositet i m²/s, brukt til Reynolds. Spec §5.7.
  public static let kinematicViscosity = 1.46e-5

  /// Tyngdeakselerasjon i m/s². Spec §5.7.
  public static let gravity = 9.80665

  /// Vind i m/s. Spec §5.7: null vind. `airVelocity = velocity − wind`.
  public static let wind = Vec3(0, 0, 0)

  /// Antatt køllehodemasse i kg. Spec §5.4.
  public static let clubHeadMass = 0.2

  /// Ballens treghetsfaktor (dimensjonsløs). Spec §5.4.
  public static let inertiaFactor = 0.4

  // ───────────────────────────────────────────────────────────────────────
  // RK4-integrasjon  (spec §5.7, ENGINE-GAPS §1)
  // ───────────────────────────────────────────────────────────────────────

  /// Spinntap per sekund: `d|ω|/dt = −0.04 · |ω|`. Spec §5.7.
  /// Fixture: `out.aeroModel.spinDecayPerSecond`.
  public static let spinDecay = 0.04

  /// Fast RK4-steg i sekunder. Spec §5.7.
  /// Fixture: `out.aeroModel.integrationStepSeconds`.
  public static let rk4Step = 0.01

  /// Maksimal flukttid i sekunder. Nås ikke bakken innen dette, skal solveren
  /// feile med ordrett `"Flight did not reach the ground within maxTimeSeconds"`.
  public static let maxFlightTime = 30.0

  /// Startshøyde z₀ i meter. ENGINE-GAPS §1: state initialiseres til
  /// `[0, 0, 1e-6, v₀, |ω₀|]` — ikke z = 0.
  public static let rk4InitialHeight = 1e-6

  // ───────────────────────────────────────────────────────────────────────
  // §5.1 Startretning
  //   faceWeight = clamp(0.90 − 0.005 × DynamicLoft, 0.60, 0.88)
  //   StartDirection = faceWeight × FaceAngle + (1 − faceWeight) × ClubPath
  // ───────────────────────────────────────────────────────────────────────

  public static let startFaceWIntercept = 0.9
  public static let startFaceWLoftSlope = 0.005
  public static let startFaceWMinimum = 0.6
  public static let startFaceWMaximum = 0.88

  // ───────────────────────────────────────────────────────────────────────
  // §5.3 Launch Angle (modellert fit)
  // ───────────────────────────────────────────────────────────────────────

  public static let launchIntercept = 10.391891433573875
  public static let launchLoftW = -0.1693792957175766
  public static let launchLoftQuadratic = 0.012024703872880052
  public static let launchAttackW = 0.25

  /// Loft-graden der intercept-blend når 1. Fixture: `out.launchInterceptBlend`.
  public static let launchInterceptBlendFullAtDeg = 10.0

  // ───────────────────────────────────────────────────────────────────────
  // §5.5 Smash og Ball Speed
  //   SpinLoft her er den 3-dimensjonale `spinLoft3DDeg`, ikke den signerte
  //   vertikale. Verifisert mot fixturen (README-felle 9).
  // ───────────────────────────────────────────────────────────────────────

  public static let smashModelIntercept = 1.544034400161688
  public static let smashSpinLoftLinear = -0.0033788247838473073
  public static let smashSpinLoftQuadratic = -0.00006496570484201677
  public static let smashMinimum = 1.15
  public static let smashMaximum = 1.52

  // ───────────────────────────────────────────────────────────────────────
  // §5.4 Spin og spinnakse
  //   spinCalibration mates med VERTIKAL spin loft, ikke 3-D (D75: D36 er
  //   låst, men gjennomføres i begge motorer samtidig — ikke her, ikke nå).
  // ───────────────────────────────────────────────────────────────────────

  public static let spinCalibrationLow = 0.81
  public static let spinCalibrationRange = 0.32
  public static let spinCalibrationMidpointDeg = 31.98
  public static let spinCalibrationWidthDeg = 2.14

  /// Nedre clamp på total spin. Spec §5.4: ingen kunstig minimumsverdi.
  public static let minTotalSpinRpm = 0.0

  /// Sanity ceiling. FUNN F5: slår inn på 12 % av realistiske slag.
  /// Det er en synlig modellgrense, ikke et unntak. Behold verdien.
  public static let maxTotalSpinRpm = 9000.0

  /// ENGINE-GAPS §5: er `abs(abs(p) − 1) < 1e-14` returneres
  /// `sign(p) × totalSpinRpm` eksakt, ellers `p × totalSpinRpm`.
  public static let signedBackspinCollinearEpsilon = 1e-14

  /// ENGINE-GAPS §5: fallback for backspin-aksen `b = unit(l × z)` når
  /// krysset degenererer.
  public static let backspinAxisFallback = Vec3(1, 0, 0)

  // ───────────────────────────────────────────────────────────────────────
  // §5.6 Carry, Apex, Landing Angle og Total
  // ───────────────────────────────────────────────────────────────────────

  public static let carryBallSpeedLinear = 0.9205937574433162
  public static let carryBallSpeedQuadratic = 0.004072298666112809

  /// Launch-graden der launchEfficiency når 1. Fixture: `out.carryFullLaunchAtDeg`.
  public static let carryFullLaunchAtDeg = 10.0

  public static let apexBasePerBallSpeed = 0.1300557732
  public static let apexLaunchPerBallSpeedDeg = 0.0079993922

  public static let landingBase = 52.8

  /// Amplituden i `52.8 − 41.5 × exp(−vsl/10.9)`. Fixture eksponerer bare det
  /// avledede leddet som `out.landingSpinTerm` (= −41.5 × exp(…)).
  public static let landingSpinAmplitude = 41.5

  public static let landingSpinLoftTau = 10.9
  public static let landingMinimum = 32.0
  public static let landingMaximum = 60.0

  /// Fixture eksponerer den avledede verdien som `out.rollFrac`.
  public static let rollFracIntercept = 0.04
  public static let rollFracLandingReferenceDeg = 45.0
  public static let rollFracLandingSlope = 0.0015
  public static let rollFracMinimum = 0.012
  public static let rollFracMaximum = 0.055

  // ───────────────────────────────────────────────────────────────────────
  // §5.7 Aerodynamisk koeffisientbro
  // ───────────────────────────────────────────────────────────────────────

  public static let liftCoefficientFactor = 0.4072
  public static let liftCoefficientExponent = 0.4

  public static let dragBridgeBase = 0.2016141765
  public static let dragBridgeReynoldsAmplitude = 0.0463816544
  public static let dragBridgeReynoldsMidpoint = 85000.0
  public static let dragBridgeReynoldsWidth = 9000.0
  public static let dragBridgeSpinAmplitude = 0.06
  public static let dragBridgeSpinHalf = 0.15

  /// Fast 7-jern-kompatibilitetskalibrering for curve-solven. Spec §5.7 sier
  /// eksplisitt at dette IKKE er en fysisk ballegenskap.
  public static let dragCompatibilityScale = 1.275116456035

  /// Fixture: `out.aeroModel.referenceAnchorDragScale`. Samme tall som
  /// `dragCompatibilityScale` i baseline; holdes som eget felt fordi fixturen
  /// emitterer begge.
  public static let referenceAnchorDragScale = 1.275116456035

  /// Koeffisientbroens deklarerte gyldighetsområde, `[min, maks]`.
  /// FUNN F2: 87 % av realistiske slag faller utenfor. `extrapolated: true` er
  /// normaltilstanden — ikke bygg en UI-advarsel på den.
  public static let reynoldsValidity: [Double] = [70000, 210000]

  /// Fixture: `out.aerodynamicDiagnostics.spinParameterValidity`.
  public static let spinParameterValidity: [Double] = [0.08, 0.2]

  // ───────────────────────────────────────────────────────────────────────
  // ENGINE-GAPS §6 — carry-projeksjon av RK4-kurve
  // ───────────────────────────────────────────────────────────────────────

  /// Rå downrange må være minst dette (meter) før projeksjonen defineres.
  public static let curveCarryProjectionMinimumDownrangeM = 1.0

  /// Er target carry ≤ dette, er projeksjonen definert med skala 1.
  public static let curveCarryProjectionTargetCarryEpsilon = 1e-12

  // ───────────────────────────────────────────────────────────────────────
  // §8 Impact Studio
  // (verdensakser: +X = target, +Y = bort fra Face On, +Z = opp)
  // ───────────────────────────────────────────────────────────────────────

  /// Buens radius i meter. Spec §8.1.
  public static let studioRadius = 1.2

  /// Ballradius i meter brukt av Studio. Spec §8.5.
  /// MERK: dette er IKKE `ballRadius` (0.021335). Behold avviket.
  public static let studioBallRadius = 0.0213

  /// Spec §8.1: `LowPointX = (10.5 − BallPositionCm) / 100`.
  public static let studioBallPositionOffsetCm = 10.5

  /// Spec §8.3: `asin(clamp(−EffectiveLowPointX / Radius, −0.999, 0.999))`.
  public static let studioThetaSinClamp = 0.999

  /// Fixture: `_meta.constants.planeDefaultDeg`. Default swing plane.
  public static let studioPlaneDefaultDeg = 55.0

  /// Fixture: `_meta.constants.samples`. Antall samplepunkter langs buen.
  public static let studioSamples = 96

  /// Fixture: `_meta.constants.sweepDeg` / `sweepRad`. Buens synlige sveip.
  ///
  /// ⚠ `studioSweepRad` er `(48 * π) / 180`, IKKE `48 * degToRad` — de to
  /// skiller seg med 1 ULP. Bruk literalen her, ikke en ny utregning.
  public static let studioSweepDeg = 48.0
  public static let studioSweepRad = 0.8377580409572781

  /// Spec §8.1: klubbrelativ z-offset i cm.
  /// Iron `LowPointZ = (ArcHeightCm − 0.2) / 100`
  /// Driver `LowPointZ = (ArcHeightCm + 1.8) / 100`
  public static func arcZ0Cm(_ mode: ClubMode) -> Double {
    switch mode {
    case .iron: return -0.2
    case .driver: return 1.8
    }
  }

  /// ENGINE-GAPS §9: sweet spot over sålen, meter.
  ///
  /// MERK: jernets 0.0213 er tallidentisk med `studioBallRadius`, men er en
  /// HELT annen størrelse. F11-vakten i JS-testene finnes for å hindre at noen
  /// slår dem sammen. Den vakten er portert med.
  public static func sweetSpotAboveSoleM(_ mode: ClubMode) -> Double {
    switch mode {
    case .iron: return 0.0213
    case .driver: return 0.033
    }
  }

  /// ENGINE-GAPS §9: ballens løft over bakken for driver, meter (iron = 0).
  public static let driverBallLiftM = 0.03

  /// Spec §8.5: low point 20–150 mm foran ballen er Pure-vinduet,
  /// 105 mm er modellens ideelle midtpunkt.
  public static let lowPointAheadMinM = 0.02
  public static let lowPointAheadMaxM = 0.15
  public static let lowPointIdealM = 0.105

  /// Spec §8.5: Duff er kølle mer enn 25 mm under bakken ved ballen.
  public static let duffDepthM = 0.025

  // ───────────────────────────────────────────────────────────────────────
  // Provenance — ikke fysikk, ikke presentasjon.
  //
  // Faktiske felt i `flight-golden.json` sine `out`-objekter. En reproduksjon
  // må emittere dem ordrett for å matche fixturen. De er IKKE UI-tekst.
  // ───────────────────────────────────────────────────────────────────────

  public static let aeroModelIdentity = AeroModelIdentity()
}

/// Køllemodus. Studio bunter ikke lenger lie og køllegeometri (D17b), men
/// `arcZ0Cm` og `sweetSpotAboveSoleM` er fortsatt per modus.
public enum ClubMode: String, Sendable, CaseIterable {
  case iron
  case driver
}

/// Provenance-strengene `out.aeroModel` faktisk inneholder.
public struct AeroModelIdentity: Equatable, Sendable {
  public let coefficientSetId =
    "tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1"
  public let baseCoefficientSetId = "tour-class-v1-era-bridge-v1"
  public let className = "historical Pro-V1-class isotropic bridge"
  public let exactNamedBall = false
  public let validityKnown = true
  public let reverseMagnusPolicy =
    "not modeled; positive-lift bridge is extrapolated below Reynolds 70000"
  public let disclosure =
    "Historical Pro-V1-class isotropic bridge; not exact current named-ball physics because proprietary modern coefficients are unavailable. Legacy-carry compatibility constraint for the curve flight only; not a ball property or named-ball calibration. Terminal RK4 lateral displacement is projected by its downrange ratio onto the retained Flightglass carry; this is a disclosed compatibility transform, not a measured ball coefficient."
  public let club = "7iron"

  public init() {}
}
