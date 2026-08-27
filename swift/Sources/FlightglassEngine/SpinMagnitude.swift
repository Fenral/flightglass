/// §5.4 — Spinnstørrelse: `spinCalibration`, `spinRpmRaw`, `totalSpinRpm`.
///
/// BASELINE. Portert fra `engine/src/spinMagnitude.js`.
///
/// Bruker `FDLibm.exp` (D86), ikke plattformens `exp`. Sigmoiden er den ene
/// transcendentale i denne modulen, og med fdlibm er den bit-eksakt mot V8 på
/// enhver plattform.
///
/// D75: kalibreringen mates med **vertikal** spin loft, ikke 3-D. D36 er låst,
/// men gjennomføres i begge motorer samtidig — ikke her, ikke nå.
public enum SpinMagnitude {

  /// Nevneren i «rolling at separation»-modellen, i meter. Spec §5.4:
  ///
  /// ```
  /// denominator = BallRadius × (1 + InertiaFactor × (1 + BallMass / ClubHeadMass))
  /// ```
  ///
  /// Konstant over hele inputdomenet. Verdi i baseline: `0.0318288331`.
  /// Regnes ut her, ikke i `Constants`, fordi JS gjør det samme — og fordi
  /// alle bestanddelene ligger der.
  public static let spinDenominatorM =
    Constants.ballRadius
    * (1 + Constants.inertiaFactor * (1 + Constants.ballMass / Constants.clubHeadMass))

  /// Spec §5.4: `verticalSpinLoft = abs(DynamicLoft − AttackAngle)`.
  ///
  /// ⚠ Dette er ABSOLUTTVERDIEN. Den signerte varianten er §5.2 sin
  /// (`Geometry3D.signedVerticalSpinLoftDeg`) og brukes av `inDomain`/`reason`
  /// i Outcome-adapteren — ikke her.
  public static func verticalSpinLoftDeg(
    dynamicLoft: Double,
    attackAngle: Double
  ) -> Double {
    abs(dynamicLoft - attackAngle)
  }

  /// Spec §5.4, den loft-avhengige kalibreringskurven:
  ///
  /// ```
  /// 0.81 + 0.32 / (1 + exp(−(verticalSpinLoft − 31.98) / 2.14))
  /// ```
  ///
  /// En sigmoid fra 0.81 ved lav vertikal spin loft til 1.13 ved høy, med
  /// vendepunkt på 31.98°.
  public static func spinCalibrationFor(_ verticalSpinLoft: Double) -> Double {
    Constants.spinCalibrationLow
      + Constants.spinCalibrationRange
        / (1
          + FDLibm.exp(
            -(verticalSpinLoft - Constants.spinCalibrationMidpointDeg)
              / Constants.spinCalibrationWidthDeg))
  }

  /// Spec §5.4: `ClubSpeed × 0.44704 × sin(SpinLoft3D)`.
  ///
  /// Komponenten av køllehastigheten som ligger langs flaten, altså den som
  /// ruller ballen. ⚠ Rekkefølgen er venstre-til-høyre og skal ikke omgrupperes.
  public static func tangentialClubSpeedMps(
    clubSpeed: Double,
    sinSpinLoft3D: Double
  ) -> Double {
    clubSpeed * Constants.mphToMps * sinSpinLoft3D
  }

  /// Fallback grad → sinus for kallere som ikke har kryssproduktet.
  ///
  /// ⚠ IKKE baseline-veien. Den koster opptil 7.3e-12 rpm i `spinRpmRaw` og
  /// gjør 1724 av 5028 caser bit-uleselige. Bruk `sinSpinLoft3D` når du har
  /// den — altså `|v × n|` fra §5.2, ikke vinkelen.
  ///
  /// ⚠ IKKE PORTERT ENDA. Den trenger `FDLibm.sin` (D86), som ikke er
  /// verifisert mot V8 på dette tidspunktet. Å midlertidig kalle plattformens
  /// `sin` ville lagt inn en stille ikke-bit-eksakt sti i en motor hvis hele
  /// poeng er at slike ikke finnes — derfor feiler den høyt i stedet.
  ///
  /// `solveFlight` bruker den ikke: den sender alltid `sinSpinLoft3D`.
  public static func sinSpinLoft3DFromDegrees(_ spinLoft3DDeg: Double) -> Double {
    preconditionFailure(
      """
      sinSpinLoft3DFromDegrees krever FDLibm.sin, som ikke er portert enda (D86).
      Send sinSpinLoft3D — altsa |v x n| fra §5.2 — i stedet. Det er uansett \
      den bit-eksakte veien.
      """)
  }

  /// Full §5.4-spinnstørrelse.
  ///
  /// `spinCalibration` og `spinRpmRaw` beregnes ALLTID — også når spinnet
  /// nulles. Det stemmer med fixturen: `edge.club-speed-zero` har
  /// `spinCalibration = 0.8175…` samtidig som `spinRpmRaw` og `totalSpinRpm`
  /// er `0`.
  ///
  /// NULLREGELEN (spec §5.4): «Hvis 3D-aksen ikke er definert, eller Ball Speed
  /// er null, settes total spin til null.» Implementert som spec-en beskriver
  /// den, men den er IKKE observerbar i fixturen — `clamp(spinRpmRaw, 0, 9000)`
  /// alene reproduserer alle 5028 caser. Regelen er belte-og-seler, og beholdes
  /// fordi spec-en har den.
  ///
  /// Nedre clamp binder aldri i baseline. Øvre clamp (9000) binder i 929 av
  /// 5028 caser — 18,5 %. FUNN F5: en synlig modellgrense, ikke et unntak.
  ///
  /// - Parameters:
  ///   - sinSpinLoft3D: `|v × n|` fra §5.2. Primær inngang — gir bit-eksakt
  ///     baseline. Er den `nil`, brukes `spinLoft3DDeg` via fallbacken.
  ///   - spinAxisDefined: settes til `sinSpinLoft3D > 0` når den ikke oppgis.
  ///   - ballSpeed: mph. Bare `== 0` betyr noe.
  public static func solve(
    clubSpeed: Double,
    dynamicLoft: Double,
    attackAngle: Double,
    sinSpinLoft3D: Double? = nil,
    spinLoft3DDeg: Double? = nil,
    spinAxisDefined: Bool? = nil,
    ballSpeed: Double? = nil
  ) -> Result {
    let sin: Double
    if let given = sinSpinLoft3D {
      sin = given
    } else if let deg = spinLoft3DDeg {
      sin = sinSpinLoft3DFromDegrees(deg)
    } else {
      // JS ville gitt NaN her (`sinSpinLoft3DFromDegrees(undefined)`).
      // Swift gjør bruddet eksplisitt i stedet for å la det renne videre.
      preconditionFailure(
        "spinMagnitude: enten sinSpinLoft3D eller spinLoft3DDeg må oppgis")
    }

    let spinCalibration = spinCalibrationFor(
      verticalSpinLoftDeg(dynamicLoft: dynamicLoft, attackAngle: attackAngle))

    let spinRadPerSecond =
      (spinCalibration * tangentialClubSpeedMps(clubSpeed: clubSpeed, sinSpinLoft3D: sin))
      / spinDenominatorM

    let spinRpmRaw = spinRadPerSecond * Constants.radPerSecToRpm

    let axisDefined = spinAxisDefined ?? (sin > 0)
    let spinIsZeroed = !axisDefined || ballSpeed == 0

    let totalSpinRpm =
      spinIsZeroed
      ? 0
      : JSMath.clamp(spinRpmRaw, Constants.minTotalSpinRpm, Constants.maxTotalSpinRpm)

    return Result(
      spinCalibration: spinCalibration,
      spinRpmRaw: spinRpmRaw,
      totalSpinRpm: totalSpinRpm)
  }

  public struct Result: Equatable, Sendable {
    public let spinCalibration: Double
    public let spinRpmRaw: Double
    public let totalSpinRpm: Double
  }
}
