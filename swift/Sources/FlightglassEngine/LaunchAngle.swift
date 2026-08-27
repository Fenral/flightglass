/// §5.3 — Launch Angle.
///
/// BASELINE. Portert fra `engine/src/launchAngle.js`. Fire ledd, ikke flere:
///
/// ```
/// interceptBlend = clamp(DynamicLoft / 10, 0, 1)
/// LaunchAngle    = launchIntercept     × interceptBlend
///                + launchLoftW         × DynamicLoft
///                + launchLoftQuadratic × DynamicLoft²
///                + launchAttackW       × AttackAngle
/// ```
///
/// Interceptet fases ut under 10° loft slik at 0° loft ikke gir et kunstig
/// positivt launch. Over 10° er blenden mettet på 1 og interceptet konstant.
///
/// ⚠ FLYTTALLSREKKEFØLGE — ikke «rydd» uttrykket:
///   - kvadratet er `dl * dl`, ikke `pow(dl, 2)`;
///   - de fire leddene summeres venstre-til-høyre i den rekkefølgen spec-en
///     lister dem;
///   - blenden er en divisjon `dl / 10`, ikke `dl * 0.1`.
///
/// Verifisert bit-eksakt (maks avvik 0) mot alle 5028 løste flight-caser i
/// JS-baselinen. Ren algebra — ingen libm, altså plattformuavhengig.
///
/// MERK: `launchAngle` her er den UKLAMPEDE modellverdien. Den kan være
/// negativ (f.eks. −3.75° ved DynamicLoft 0 og AttackAngle −15). Carry- og
/// apex-modellen i §5.6 gjør sin egen `max(0, LaunchAngle)`; det hører ikke
/// hjemme her.
public enum LaunchAngle {

  /// Utfasingsvekten for interceptet, `out.launchInterceptBlend`.
  ///
  /// Fixturen dekker DynamicLoft 0 … 50, så den øvre klampen (loft ≥ 10°) er
  /// eksersert i 5028 caser mens den nedre aldri binder — `0/10` er allerede 0.
  /// Den nedre klampen står likevel fordi spec-en har den; negativ DynamicLoft
  /// er ikke representert i baseline.
  public static func interceptBlend(dynamicLoftDeg: Double) -> Double {
    JSMath.clamp(dynamicLoftDeg / Constants.launchInterceptBlendFullAtDeg, 0, 1)
  }

  /// Launch Angle i grader, `out.launchAngle`. Kan være negativ.
  public static func launchAngleDeg(
    dynamicLoftDeg: Double,
    attackAngleDeg: Double
  ) -> Double {
    let blend = interceptBlend(dynamicLoftDeg: dynamicLoftDeg)

    return Constants.launchIntercept * blend
      + Constants.launchLoftW * dynamicLoftDeg
      + Constants.launchLoftQuadratic * (dynamicLoftDeg * dynamicLoftDeg)
      + Constants.launchAttackW * attackAngleDeg
  }

  /// Hele §5.3 som ett kall. Feltnavnene er fixturens egne.
  public static func solve(dynamicLoft: Double, attackAngle: Double) -> Result {
    Result(
      launchAngle: launchAngleDeg(
        dynamicLoftDeg: dynamicLoft, attackAngleDeg: attackAngle),
      launchInterceptBlend: interceptBlend(dynamicLoftDeg: dynamicLoft)
    )
  }

  public struct Result: Equatable, Sendable {
    public let launchAngle: Double
    public let launchInterceptBlend: Double
  }

  /// Koeffisientene §5.3 bruker, med fixturens feltnavn. `out` bærer alle fire
  /// i hver eneste case, så en full reproduksjon må kunne emittere dem.
  public struct Coefficients: Equatable, Sendable {
    public let launchIntercept = Constants.launchIntercept
    public let launchLoftW = Constants.launchLoftW
    public let launchLoftQuadratic = Constants.launchLoftQuadratic
    public let launchAttackW = Constants.launchAttackW
    public init() {}
  }

  public static let modelCoefficients = Coefficients()
}
