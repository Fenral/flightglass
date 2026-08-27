/// §5.2 — Eksakt sentrert D-plane-geometri.
///
/// BASELINE. Portert fra `engine/src/geometry3d.js`, som reproduserer dagens
/// motor bit-eksakt mot `flight-golden.json`: 5028 av 5028 caser, maks avvik 0
/// på alle åtte felt. Ingenting her er ryddet, forbedret eller modernisert.
///
/// Verdensakser (spec §4, høyrehendt):
///   `x` = golferens høyre, `y` = mållinjen, `z` = opp
///
/// Kjernen (spec §5.2), med A = attack, P = path, L = dynamic loft, F = face:
/// ```
/// v          = (cos A · sin P, cos A · cos P, sin A)
/// n          = (cos L · sin F, cos L · cos F, sin L)
/// SpinLoft3D = atan2(|v × n|, v · n) × 180/π
/// axis       = normalize(v × n)
/// SpinAxis   = −atan2(axis.z, hypot(axis.x, axis.y)) × 180/π
/// ```
///
/// ── ULP-KRITISKE DETALJER (verifisert mot fixturen, ikke gjettet) ──────────
///
/// 1. Grader → radianer er `deg * degToRad`, altså `Angles.flightDegToRad`.
///    Den motsatte grupperingen gir bare 4189/5028 på `faceNormalUnit`.
///
/// 2. `v` og `n` normaliseres IKKE. De er enhetsvektorer per konstruksjon, og
///    et normaliseringssteg ville flyttet dem 1 ULP. Rå bygging gir 5028/5028.
///
/// 3. Normalisering av kryssproduktet er `x * (1 / hypot(x, y, z))` —
///    multiplikasjon med den inverse, ikke divisjon, og `JSMath.hypot` med tre
///    argumenter, ikke `sqrt(x² + y² + z²)`. Se tabellen i `JSMath`.
///
/// 4. `spinLoft3DDeg` er `atan2(|v × n|, v · n) * radToDeg`. Grupperingen
///    `* radToDeg` (ikke `* 180 / π`, ikke `/ π * 180`) gir 4648 mot 3436/3498.
public enum Geometry3D {

  /// Aksen `normalize` faller tilbake på når kryssproduktet degenererer, altså
  /// når `v == n` (face = path og dynamic loft = attack). 29 caser i fixturen,
  /// alle med `spinAxisUnit = [1, 0, 0]`.
  ///
  /// ⚠ Ligger her, ikke i `Constants`, fordi den ikke er dokumentert i spec
  /// §5.2. ENGINE-GAPS §5 dokumenterer samme fallback for backspin-aksen
  /// (`Constants.backspinAxisFallback`); at de to er like er observert, ikke gitt.
  public static let degenerateSpinAxisUnit = Vec3(1, 0, 0)

  // ── Vektorprimitiver ─────────────────────────────────────────────────────

  /// Kryssprodukt `a × b`.
  @inlinable
  public static func cross(_ a: Vec3, _ b: Vec3) -> Vec3 {
    Vec3(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    )
  }

  /// Skalarprodukt `a · b`. Summert venstre mot høyre.
  @inlinable
  public static func dot(_ a: Vec3, _ b: Vec3) -> Double {
    a.x * b.x + a.y * b.y + a.z * b.z
  }

  /// Lengden av en vektor. `JSMath.hypot` med tre argumenter — se punkt 3
  /// over; `sqrt(x² + y² + z²)` er ikke det samme tallet.
  @inlinable
  public static func magnitude(_ v: Vec3) -> Double {
    JSMath.hypot(v.x, v.y, v.z)
  }

  /// Normaliserer ved å multiplisere med den inverse lengden.
  /// Degenerert vektor (lengde 0) gir `degenerateSpinAxisUnit`.
  @inlinable
  public static func normalize(_ v: Vec3) -> Vec3 {
    let length = magnitude(v)
    // JS: `if (!(length > 0))` — fanger bade 0 og NaN. `length <= 0` ville
    // sluppet NaN gjennom.
    if !(length > 0) { return degenerateSpinAxisUnit }
    let inverse = 1 / length
    return Vec3(v.x * inverse, v.y * inverse, v.z * inverse)
  }

  // ── §5.2 byggeklosser ────────────────────────────────────────────────────

  /// Normert køllehastighetsvektor `v = (cos A · sin P, cos A · cos P, sin A)`.
  /// Enhetsvektor per konstruksjon; normaliseres bevisst ikke.
  public static func clubVelocityUnit(
    attackAngleDeg: Double,
    clubPathDeg: Double
  ) -> Vec3 {
    let a = Angles.flightDegToRad(attackAngleDeg)
    let p = Angles.flightDegToRad(clubPathDeg)
    return Vec3(
      FDLibm.cos(a) * FDLibm.sin(p),
      FDLibm.cos(a) * FDLibm.cos(p),
      FDLibm.sin(a)
    )
  }

  /// Face-normal `n = (cos L · sin F, cos L · cos F, sin L)`.
  /// Enhetsvektor per konstruksjon; normaliseres bevisst ikke.
  public static func faceNormalUnit(
    dynamicLoftDeg: Double,
    faceAngleDeg: Double
  ) -> Vec3 {
    let l = Angles.flightDegToRad(dynamicLoftDeg)
    let f = Angles.flightDegToRad(faceAngleDeg)
    return Vec3(
      FDLibm.cos(l) * FDLibm.sin(f),
      FDLibm.cos(l) * FDLibm.cos(f),
      FDLibm.sin(l)
    )
  }

  /// Sentrert D-plane-akse `uₛ = normalize(v × n)`.
  ///
  /// ENGINE-GAPS §1: RK4 initialiserer `ω₀ = uₛ · totalSpinRpm · (2π/60)` fra
  /// DENNE vektoren. Skalaren `spinAxis` kan ikke rekonstruere den (FUNN F3),
  /// så vektoren må eksponeres.
  @inlinable
  public static func spinAxisUnit(_ velocityUnit: Vec3, _ normalUnit: Vec3) -> Vec3 {
    normalize(cross(velocityUnit, normalUnit))
  }

  /// `signedVerticalSpinLoft = DynamicLoft − AttackAngle` (spec §5.2).
  /// Holdes separat fra den prinsipale 3D-vinkelen, som alltid er ikke-negativ.
  /// ENGINE-GAPS §3: Outcome-adapteren bygger `inDomain` på fortegnet her.
  @inlinable
  public static func signedVerticalSpinLoftDeg(
    dynamicLoftDeg: Double,
    attackAngleDeg: Double
  ) -> Double {
    dynamicLoftDeg - attackAngleDeg
  }

  /// Prinsipal 3D spin loft i grader: `atan2(|v × n|, v · n) × 180/π`.
  ///
  /// **Gren B.** Er `faceToPath` eksakt 0 og den vertikale spin loften positiv,
  /// returnerer motoren `signedVerticalSpinLoftDeg` ordrett i stedet for
  /// atan2-verdien. Er den negativ, gjør den det ikke. Fixturen krever begge.
  ///
  /// Dette KAN ikke være en ren funksjon av geometrien: speilparet
  /// (face 0, path 0, loft 0, attack ∓7.5) gir identisk `|v × n|` og identisk
  /// `v · n`, men fixturen returnerer `7.5` for attack −7.5 og
  /// `7.499999999999999` for attack +7.5. Motoren forgrener seg på fortegnet.
  /// Verken `max(raw, signed)` (4857/5028) eller `abs(signed)` (4791/5028)
  /// treffer; bare grenen under gir 5028/5028.
  public static func spinLoft3DDeg(
    velocityUnit: Vec3,
    normalUnit: Vec3,
    faceToPathDeg: Double,
    verticalSpinLoftDeg: Double
  ) -> Double {
    if faceToPathDeg == 0 && verticalSpinLoftDeg > 0 {
      return verticalSpinLoftDeg
    }
    let axis = cross(velocityUnit, normalUnit)
    return FDLibm.atan2(magnitude(axis), dot(velocityUnit, normalUnit))
      * Constants.radToDeg
  }

  /// Offentlig `spinAxis`: den signerte tilt-vinkelen i grader,
  /// `−atan2(axis.z, hypot(axis.x, axis.y)) × 180/π`.
  /// Positiv = høyrekurve for høyrehendt konvensjon (spec §4).
  ///
  /// **Gren A.** Er `faceToPath` eksakt 0, er verdien eksakt 0 i alle 713 slike
  /// caser i fixturen.
  ///
  /// ⚠ FIXTUREN KAN IKKE SKILLE to implementasjoner: «tving til 0 når
  /// `faceToPath == 0`» og «tving til 0 når |rå verdi| < ~1e-9». Alle 713 caser
  /// har både `faceToPath == 0` og |rå verdi| ≤ 3.6e-14, og minste verdi ulik
  /// null i hele fixturen er 1.012°. Gapet er 13 tierpotenser bredt og tomt.
  /// Valget er `faceToPath` fordi ENGINE-GAPS §6 dokumenterer nettopp den
  /// betingelsen for `curve` i samme kildefil, og fordi det ikke innfører en
  /// oppdiktet epsilon. Valget er arvet fra JS-baselinen, ikke tatt på nytt her.
  public static func spinAxisDeg(_ axisUnit: Vec3, faceToPathDeg: Double) -> Double {
    if faceToPathDeg == 0 { return 0 }
    return -FDLibm.atan2(axisUnit.z, JSMath.hypot(axisUnit.x, axisUnit.y))
      * Constants.radToDeg
  }

  /// Horisontal spin loft-komponent (dimensjonsløs): `cos L · sin(F − P)`.
  ///
  /// Face-normalens komponent langs den horisontale tangenten til
  /// køllehastigheten. Den lukkede formen er bit-eksakt (5028/5028); å bygge
  /// tangentbasisen numerisk og prikke gir 2316/5028. Vinkeldifferansen må
  /// være `faceRad − pathRad`, ikke `(F − P) × degToRad` (4424/5028).
  public static func horizontalSpinLoftComponent(
    dynamicLoftDeg: Double,
    faceAngleDeg: Double,
    clubPathDeg: Double
  ) -> Double {
    let l = Angles.flightDegToRad(dynamicLoftDeg)
    let f = Angles.flightDegToRad(faceAngleDeg)
    let p = Angles.flightDegToRad(clubPathDeg)
    return FDLibm.cos(l) * FDLibm.sin(f - p)
  }

  /// Vertikal spin loft-komponent (dimensjonsløs):
  /// `cos A · sin L − sin A · cos L · cos(F − P)`.
  ///
  /// ⚠ Rekkefølgen teller: venstre-mot-høyre `(sin A · cos L) · cos(F − P)`
  /// gir 5028/5028, mens `sin A · (cos L · cos(F − P))` gir 4740/5028.
  /// Swift evaluerer `a * b * c` venstre-assosiativt, som er det vi vil ha —
  /// men parentesene står her likevel, slik at ingen «rydder» dem inn feil vei.
  public static func verticalSpinLoftComponent(
    attackAngleDeg: Double,
    dynamicLoftDeg: Double,
    faceAngleDeg: Double,
    clubPathDeg: Double
  ) -> Double {
    let a = Angles.flightDegToRad(attackAngleDeg)
    let l = Angles.flightDegToRad(dynamicLoftDeg)
    let f = Angles.flightDegToRad(faceAngleDeg)
    let p = Angles.flightDegToRad(clubPathDeg)
    return FDLibm.cos(a) * FDLibm.sin(l)
      - ((FDLibm.sin(a) * FDLibm.cos(l)) * FDLibm.cos(f - p))
  }

  // ── Samlet solve ─────────────────────────────────────────────────────────

  /// Hele §5.2 i ett kall. Ren funksjon: samme input gir alltid samme output,
  /// ingen delt tilstand, ingen I/O, ingen presentasjonsdata.
  ///
  /// Feltnavnene er fixturens egne, slik at en sammenligning ikke trenger en
  /// oversettelse i midten. `clubSpeed` ignoreres — geometrien avhenger ikke
  /// av fart.
  public static func solve(
    attackAngle: Double,
    clubPath: Double,
    dynamicLoft: Double,
    faceAngle: Double
  ) -> Result {
    let velocityUnit = clubVelocityUnit(
      attackAngleDeg: attackAngle, clubPathDeg: clubPath)
    let normalUnit = faceNormalUnit(
      dynamicLoftDeg: dynamicLoft, faceAngleDeg: faceAngle)
    let axisUnit = spinAxisUnit(velocityUnit, normalUnit)

    // Fixturen eksponerer den samme differansen som `out.faceToPath`.
    let faceToPathDeg = faceAngle - clubPath
    let verticalDeg = signedVerticalSpinLoftDeg(
      dynamicLoftDeg: dynamicLoft, attackAngleDeg: attackAngle)

    return Result(
      clubVelocityUnit: velocityUnit,
      faceNormalUnit: normalUnit,
      spinAxisUnit: axisUnit,
      spinLoft3DDeg: spinLoft3DDeg(
        velocityUnit: velocityUnit,
        normalUnit: normalUnit,
        faceToPathDeg: faceToPathDeg,
        verticalSpinLoftDeg: verticalDeg
      ),
      signedVerticalSpinLoftDeg: verticalDeg,
      spinAxis: spinAxisDeg(axisUnit, faceToPathDeg: faceToPathDeg),
      horizontalSpinLoftComponent: horizontalSpinLoftComponent(
        dynamicLoftDeg: dynamicLoft,
        faceAngleDeg: faceAngle,
        clubPathDeg: clubPath
      ),
      verticalSpinLoftComponent: verticalSpinLoftComponent(
        attackAngleDeg: attackAngle,
        dynamicLoftDeg: dynamicLoft,
        faceAngleDeg: faceAngle,
        clubPathDeg: clubPath
      )
    )
  }

  /// De åtte feltene §5.2 eier. Navnene er fixturens.
  public struct Result: Equatable, Sendable {
    public let clubVelocityUnit: Vec3
    public let faceNormalUnit: Vec3
    public let spinAxisUnit: Vec3
    public let spinLoft3DDeg: Double
    public let signedVerticalSpinLoftDeg: Double
    public let spinAxis: Double
    public let horizontalSpinLoftComponent: Double
    public let verticalSpinLoftComponent: Double
  }
}
