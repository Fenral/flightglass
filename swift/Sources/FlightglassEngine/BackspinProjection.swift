/// backspinProjection — projeksjon av D-plane-spinnvektoren på flukt-relative
/// akser. ENGINE-GAPS §5 (og §1 for `spinVectorRadPerSec`).
///
/// BASELINE. Portert fra `engine/src/backspinProjection.js`, inkludert
/// operasjonsrekkefølgen. Fixturen er fasit.
///
/// Ingenting her beregner spinn — det flytter bare den ferdige spinnvektoren
/// over i et annet aksesett. Verdensakser: x = høyre, y = mål, z = opp.
///
/// ── Rekkefølge som er verifisert bit-eksakt i JS-baselinen ────────────────
///
/// - grader → radianer: `Angles.flightDegToRad`. Motsatt gruppering gir
///   4908/5028 på `signedBackspinRpm`.
/// - normalisering: `JSMath.hypot`, så `inv = 1 / n` og `v * inv`.
///   `sqrt(x²+y²+z²)` gir 3961/5028.
/// - prikkprodukt: `((x·x) + (y·y)) + (z·z)`, venstreassosiativt.
///   Høyreassosiativt gir 3853/5028 på `rightCurveSpinRpm`.
/// - rad/s: `magnitude = totalSpinRpm * rpmToRadPerSec` ÉN gang, deretter
///   `spinAxisUnit[i] * magnitude`. Komponentvis `u[i] * T * w` gir 3320/5028.
///
/// Ikke bytt noen av disse. De er 1–2 ULP fra hverandre, og fixturen skiller.
public enum BackspinProjection {

  /// Verdens opp-akse, `z` i ENGINE-GAPS §5 (`b = unit(l × z)`).
  @usableFromInline static let worldUp = Vec3(0, 0, 1)

  /// Fallback for høyrekurve-aksen når `l × b` degenererer.
  /// Uoppnåelig i baseline: `l` er enhetsvektor og `b ⟂ l`, så `|l × b| = 1`.
  @usableFromInline static let rightCurveAxisFallback = Vec3(0, 0, 0)

  /// Enhetsvektor, eller `fallback` når lengden ikke er positiv endelig.
  @inlinable
  static func unitOr(_ v: Vec3, _ fallback: Vec3) -> Vec3 {
    let norm = JSMath.hypot(v.x, v.y, v.z)
    if !(norm > 0) { return fallback }
    let inverse = 1 / norm
    return Vec3(v.x * inverse, v.y * inverse, v.z * inverse)
  }

  // ── Akser ────────────────────────────────────────────────────────────────

  /// Enhetsvektoren `l` for launchretningen. ENGINE-GAPS §1.
  public static func launchDirectionUnit(
    launchAngleDeg: Double,
    startDirectionDeg: Double
  ) -> Vec3 {
    let elevation = Angles.flightDegToRad(launchAngleDeg)
    let azimuth = Angles.flightDegToRad(startDirectionDeg)
    return Vec3(
      FDLibm.cos(elevation) * FDLibm.sin(azimuth),
      FDLibm.cos(elevation) * FDLibm.cos(azimuth),
      FDLibm.sin(elevation)
    )
  }

  /// Fluktrelativ backspin-akse. ENGINE-GAPS §5: `b = unit(l × z)`, fallback
  /// `[1, 0, 0]` når krysset degenererer (launchAngle ±90°; forekommer ikke
  /// i baseline-fixturen).
  public static func backspinAxis(_ launchDirection: Vec3) -> Vec3 {
    unitOr(
      Geometry3D.cross(launchDirection, worldUp), Constants.backspinAxisFallback)
  }

  /// Fluktrelativ høyrekurve-akse `m = unit(l × b)`. Ikke dekket av
  /// ENGINE-GAPS; utledet fra fixturen i JS-baselinen (5028/5028 bit-eksakt).
  /// «Ned» i det launch-relative systemet: spinn om `m` gir Magnus-kraft mot
  /// +x, altså høyrekurve.
  public static func rightCurveAxis(
    _ launchDirection: Vec3, _ backspinAxisUnit: Vec3
  ) -> Vec3 {
    unitOr(Geometry3D.cross(launchDirection, backspinAxisUnit), rightCurveAxisFallback)
  }

  // ── Projeksjoner ─────────────────────────────────────────────────────────

  /// Impact-spinnvektoren i rad/s. ENGINE-GAPS §1:
  /// `ω₀ = uₛ · totalSpinRpm · (2π/60)`.
  ///
  /// ⚠ `magnitude` regnes ÉN gang og ganges inn per komponent — se filhodet.
  public static func spinVectorRadPerSec(
    spinAxisUnit: Vec3, totalSpinRpm: Double
  ) -> Vec3 {
    let magnitude = totalSpinRpm * Constants.rpmToRadPerSec
    return Vec3(
      spinAxisUnit.x * magnitude,
      spinAxisUnit.y * magnitude,
      spinAxisUnit.z * magnitude
    )
  }

  /// Signert backspin i rpm. ENGINE-GAPS §5: `p = uₛ · b`; er
  /// `||p| − 1| < 1e-14` returneres `sign(p) · totalSpinRpm`, ellers
  /// `p · totalSpinRpm`.
  ///
  /// Grenen bevarer et eksakt signert total når aksene er numerisk
  /// kollineære — den slår inn på 692 av 5028 caser i baseline, og uten den
  /// treffer bare 4533 bit-eksakt.
  public static func signedBackspinRpm(
    spinAxisUnit: Vec3, backspinAxisUnit: Vec3, totalSpinRpm: Double
  ) -> Double {
    let projection = Geometry3D.dot(spinAxisUnit, backspinAxisUnit)
    if abs(abs(projection) - 1) < Constants.signedBackspinCollinearEpsilon {
      return JSMath.sign(projection) * totalSpinRpm
    }
    return projection * totalSpinRpm
  }

  /// Høyrekurve-spinn i rpm. Positiv = høyrekurve. Ingen kollineær-gren:
  /// i de 100 casene der `|dot(u, m)| = 1` er prikken eksakt 1, så en gren
  /// ville uansett ikke endret noe.
  public static func rightCurveSpinRpm(
    spinAxisUnit: Vec3, rightCurveAxisUnit: Vec3, totalSpinRpm: Double
  ) -> Double {
    Geometry3D.dot(spinAxisUnit, rightCurveAxisUnit) * totalSpinRpm
  }

  // ── Samlet ───────────────────────────────────────────────────────────────

  /// De fire offentlige feltene i ett kall.
  ///
  /// `backspin` er per spec absoluttverdien av `signedBackspinRpm`; de er
  /// ikke uavhengige størrelser.
  public static func solve(
    launchAngle: Double,
    startDirection: Double,
    spinAxisUnit: Vec3,
    totalSpinRpm: Double
  ) -> Result {
    let launchDirection = launchDirectionUnit(
      launchAngleDeg: launchAngle, startDirectionDeg: startDirection)
    let backspinAxisUnit = backspinAxis(launchDirection)
    let rightCurveAxisUnit = rightCurveAxis(launchDirection, backspinAxisUnit)

    let signed = signedBackspinRpm(
      spinAxisUnit: spinAxisUnit,
      backspinAxisUnit: backspinAxisUnit,
      totalSpinRpm: totalSpinRpm)

    return Result(
      signedBackspinRpm: signed,
      backspin: abs(signed),
      rightCurveSpinRpm: rightCurveSpinRpm(
        spinAxisUnit: spinAxisUnit,
        rightCurveAxisUnit: rightCurveAxisUnit,
        totalSpinRpm: totalSpinRpm),
      spinVectorRadPerSec: spinVectorRadPerSec(
        spinAxisUnit: spinAxisUnit, totalSpinRpm: totalSpinRpm)
    )
  }

  public struct Result: Equatable, Sendable {
    public let signedBackspinRpm: Double
    public let backspin: Double
    public let rightCurveSpinRpm: Double
    public let spinVectorRadPerSec: Vec3
  }
}
