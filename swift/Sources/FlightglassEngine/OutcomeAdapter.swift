/// outcomeAdapter — ENGINE-GAPS §2–4 + `shape`.
///
/// BASELINE. Portert fra `engine/src/outcomeAdapter.js`. Adapterlaget over
/// `solveFlight`: `hasFlight`, `inDomain`, `reason` og `shape`. Ingen av dem
/// returneres av `solveFlight` selv.
///
/// Shape-tersklene er FITTET mot fixturen (README «Åpne punkter»), ikke
/// dokumentert i noen spec. Fixture-intervallene står ved hver konstant —
/// verdiene er JS-baselinens valg innenfor intervallet, arvet uendret.
public enum OutcomeAdapter {

  // ── Konstanter ───────────────────────────────────────────────────────────

  /// ENGINE-GAPS §4: den ene ikke-null `reason`-verdien. Maskinkode, ikke
  /// brukertekst.
  public static let spinLoftReason = "spin-loft"

  /// FITTET. `|startDirection|` under denne gir tomt startord.
  /// Fixture-intervall: `(1.4800000000000004, 1.5499999999999998]`.
  public static let shapeStartStraightMaxDeg = 1.5

  /// FITTET. `|faceToPath|` under denne gir tomt kurveord.
  /// Fixture-intervall: `(0, 1]`.
  public static let shapeCurveStraightMaxDeg = 1.0

  /// FITTET. `|faceToPath|` fra og med denne gir Hook/Slice i stedet for
  /// Draw/Fade. Fixture-intervall: `(6, 7.5]`.
  public static let shapeCurveMajorMinDeg = 7.0

  /// De 15 `shape`-verdiene i baseline.
  public static let shapeLabels: [String] = [
    "Straight",
    "Pull", "Push",
    "Draw", "Fade", "Hook", "Slice",
    "Pull Draw", "Pull Fade", "Pull Hook", "Pull Slice",
    "Push Draw", "Push Fade", "Push Hook", "Push Slice",
  ]

  // ── ENGINE-GAPS §2–4: de tre predikatfeltene ─────────────────────────────

  /// ENGINE-GAPS §2: `hasFlight = (carry > 0)`.
  ///
  /// Skrevet som `carry > 0`, ikke `!(carry <= 0)` — for NaN gir begge
  /// `false`, men den første er formen ENGINE-GAPS oppgir. Baseline har ingen
  /// negativ carry: 382 caser har eksakt 0, resten positive.
  @inlinable
  public static func hasFlight(carry: Double) -> Bool {
    carry > 0
  }

  /// ENGINE-GAPS §3: `inDomain = (signedVerticalSpinLoftDeg > 0)`.
  ///
  /// ⚠ `>`, ikke `>=`: eksakt 0 er UTENFOR domenet. Spec §9 sin
  /// «No flight»-golden case har `signedVerticalSpinLoftDeg = 0` og
  /// `inDomain = false`; fixturens `edge.in-domain-false.zero-vertical-*` er
  /// eksportert for nettopp denne grensen.
  ///
  /// Inngangen er den SIGNERTE `dynamicLoft − attackAngle` — ikke
  /// `spinLoft3DDeg`, som er ikke-negativ og aldri kunne gitt `false`.
  @inlinable
  public static func inDomain(signedVerticalSpinLoftDeg: Double) -> Bool {
    signedVerticalSpinLoftDeg > 0
  }

  /// ENGINE-GAPS §4: `nil` i domenet, `"spin-loft"` utenfor. Ingen tredje
  /// verdi. Uttrykt via `inDomain` slik at de to aldri kan komme i utakt.
  @inlinable
  public static func outcomeReason(signedVerticalSpinLoftDeg: Double) -> String? {
    inDomain(signedVerticalSpinLoftDeg: signedVerticalSpinLoftDeg)
      ? nil : spinLoftReason
  }

  // ── shape ────────────────────────────────────────────────────────────────

  /// Startordet. `""` betyr «ingen startetikett», ikke `"Straight"` —
  /// `"Straight"` er etiketten for at BEGGE ordene er tomme, satt i `shape`.
  public static func startLabel(_ startDirection: Double) -> String {
    if abs(startDirection) < shapeStartStraightMaxDeg { return "" }
    return startDirection > 0 ? "Push" : "Pull"
  }

  /// Kurveordet, fra den ekte `faceToPath` (= `faceAngle − clubPath`).
  ///
  /// Positivt gap → Fade/Slice (høyre); negativt → Draw/Hook (venstre).
  ///
  /// ⚠ Ren geometrisk gap-klassifisering: den ser ikke på om ballen faktisk
  /// fløy. 382 caser uten flukt får kurveord som «Pull Hook» likevel, med
  /// `curve = 0`. Det er baseline. Ikke maskér det.
  public static func curveLabel(_ faceToPath: Double) -> String {
    let gap = abs(faceToPath)
    if gap < shapeCurveStraightMaxDeg { return "" }
    if gap < shapeCurveMajorMinDeg { return faceToPath > 0 ? "Fade" : "Draw" }
    return faceToPath > 0 ? "Slice" : "Hook"
  }

  /// `shape` — én av de 15 verdiene i `shapeLabels`.
  public static func shape(startDirection: Double, faceToPath: Double) -> String {
    let start = startLabel(startDirection)
    let curve = curveLabel(faceToPath)
    if start.isEmpty { return curve.isEmpty ? "Straight" : curve }
    return curve.isEmpty ? start : "\(start) \(curve)"
  }

  // ── Adapteren samlet ─────────────────────────────────────────────────────

  public static func solve(
    carry: Double,
    signedVerticalSpinLoftDeg: Double,
    startDirection: Double,
    faceToPath: Double
  ) -> Result {
    Result(
      hasFlight: hasFlight(carry: carry),
      inDomain: inDomain(signedVerticalSpinLoftDeg: signedVerticalSpinLoftDeg),
      reason: outcomeReason(signedVerticalSpinLoftDeg: signedVerticalSpinLoftDeg),
      shape: shape(startDirection: startDirection, faceToPath: faceToPath)
    )
  }

  public struct Result: Equatable, Sendable {
    public let hasFlight: Bool
    public let inDomain: Bool
    public let reason: String?
    public let shape: String
  }
}
