import FlightglassEngine

/// STUDIOSHAPE — Studios buegeometri som tegnepunkter (D61/D62-snittet).
///
/// Portert fra `adapter/src/studioShape.js`.
///
/// `studioSolve` returnerer buens definisjon, men ingen polylinje: motoren
/// eier kurven som matematikk, ikke som punkter. Samplingen og projeksjonen
/// er kategori 2 og bor her, aldri i UI.
///
/// Ingen egen kurveform finnes her: hvert punkt kommer fra motorens egen
/// `StudioContact.arcPoint` (GAPS §8 `P(t)`) — importert, ikke
/// reimplementert. Modulen velger bare HVILKE t-verdier som samples og
/// HVILKET plan de projiseres på.
///
/// Verdensakser (spec §8): `+x` = target, `+y` = bort fra Face On, `+z` = opp.
/// - Face On: skjermplanet er `(x, z)`.
/// - DTL: kamera bak ballen langs `+x`; skjerm-høyre = `−y`, slik at positiv
///   club path leser som høyre — samme konvensjon som L/R/C.
///
/// Meter inn, meter ut. Px-skalering er kategori 3 og skjer i rendereren.
public enum StudioShape {

  public enum ContractError: Error, Equatable {
    case nonFinite(String)
    case badSampleCount(Int)
  }

  public typealias Point = StudioContact.Point
  public typealias Basis = StudioContact.Basis

  /// Det studioShape trenger fra `StudioSolve.Result` — lar også tester
  /// bygge input direkte.
  public struct Solved: Equatable, Sendable {
    public let lowPointWorld: Point
    public let planeBasis: Basis

    public init(lowPointWorld: Point, planeBasis: Basis) {
      self.lowPointWorld = lowPointWorld
      self.planeBasis = planeBasis
    }

    public init(_ result: StudioSolve.Result) {
      self.lowPointWorld = result.lowPointWorld
      self.planeBasis = result.planeBasis
    }
  }

  private static func assertFinite(_ v: Double, _ name: String) throws {
    guard v.isFinite else { throw ContractError.nonFinite(name) }
  }

  private static func assertSamples(_ n: Int) throws {
    guard n >= 2 else { throw ContractError.badSampleCount(n) }
  }

  // ── Projeksjoner ─────────────────────────────────────────────────────────

  /// Face On: `(x, z)`.
  public static func faceOnPoint(_ p: Point) -> (Double, Double) {
    (p.x, p.z)
  }

  /// DTL: `(−y, z)`. Skjerm-høyre = golferens høyre.
  public static func dtlPoint(_ p: Point) -> (Double, Double) {
    (-p.y, p.z)
  }

  private static func sampleArc(
    _ solved: Solved, n: Int, spanRad: Double,
    project: (Point) -> (Double, Double)
  ) throws -> [(Double, Double)] {
    try assertSamples(n)
    try assertFinite(spanRad, "spanRad")
    var pts: [(Double, Double)] = []
    pts.reserveCapacity(n + 1)
    for i in 0...n {
      let t = -spanRad + (2 * spanRad * Double(i)) / Double(n)
      pts.append(
        project(
          StudioContact.arcPoint(
            lowPointWorldMetres: solved.lowPointWorld,
            basis: solved.planeBasis,
            thetaRadians: t)))
    }
    return pts
  }

  /// Buen samplet symmetrisk om low point, projisert til Face On.
  /// Spennet 0.6 rad dekker hele inputdomenet (maks |θ| ~0.45).
  public static func faceOnArcPoints(
    _ solved: Solved, n: Int = 96, spanRad: Double = 0.6
  ) throws -> [(Double, Double)] {
    try sampleArc(solved, n: n, spanRad: spanRad, project: faceOnPoint)
  }

  /// Samme bue til DTL. Større spenn (1.0 rad): DTL er der planhelningen
  /// skal LESES — buen må rekke opp langs glasset.
  public static func dtlArcPoints(
    _ solved: Solved, n: Int = 96, spanRad: Double = 1.0
  ) throws -> [(Double, Double)] {
    try sampleArc(solved, n: n, spanRad: spanRad, project: dtlPoint)
  }

  /// Ghost club-skaftet i Face On: strek fra buepunktet ved `thetaRad`
  /// innover mot buens senter (`LP + R·m`, GAPS §8).
  public static func faceOnClubShaft(
    _ solved: Solved, thetaRad: Double, shaftLenM: Double = 0.45
  ) throws -> (sole: (Double, Double), grip: (Double, Double)) {
    try assertFinite(thetaRad, "thetaRad")
    try assertFinite(shaftLenM, "shaftLenM")
    let p = StudioContact.arcPoint(
      lowPointWorldMetres: solved.lowPointWorld,
      basis: solved.planeBasis,
      thetaRadians: thetaRad)
    let lp = solved.lowPointWorld
    let m = solved.planeBasis.m
    let centre = Point(
      x: lp.x + Constants.studioRadius * m.x,
      y: lp.y + Constants.studioRadius * m.y,
      z: lp.z + Constants.studioRadius * m.z)
    let (px, pz) = faceOnPoint(p)
    let (cx, cz) = faceOnPoint(centre)
    let dx = cx - px
    let dz = cz - pz
    let len = JSMath.hypot(dx, dz)
    if len == 0 {
      return ((px, pz), (px, pz + shaftLenM))
    }
    return ((px, pz), (px + (dx / len) * shaftLenM, pz + (dz / len) * shaftLenM))
  }

  // ── D76-ommalingen: verdenspunkter, tangenter, plan, pinhole ─────────────

  /// Ett buepunkt i verdenskoordinater — motorens `arcPoint` med kontraktsjekk.
  public static func arcWorldPoint(_ solved: Solved, thetaRad: Double) throws -> Point {
    try assertFinite(thetaRad, "thetaRad")
    return StudioContact.arcPoint(
      lowPointWorldMetres: solved.lowPointWorld,
      basis: solved.planeBasis,
      thetaRadians: thetaRad)
  }

  /// Buen samplet symmetrisk om low point, i verdenskoordinater.
  public static func arcWorldPoints(
    _ solved: Solved, n: Int = 96, spanRad: Double = 0.6
  ) throws -> [Point] {
    try assertSamples(n)
    try assertFinite(spanRad, "spanRad")
    var pts: [Point] = []
    pts.reserveCapacity(n + 1)
    for i in 0...n {
      let t = -spanRad + (2 * spanRad * Double(i)) / Double(n)
      pts.append(
        StudioContact.arcPoint(
          lowPointWorldMetres: solved.lowPointWorld,
          basis: solved.planeBasis,
          thetaRadians: t))
    }
    return pts
  }

  /// Buens tangentretning ved theta: `d/dθ P(θ) = R cos θ · u + R sin θ · m`.
  /// Retningsvektor (ikke normalisert) — rendereren skalerer selv.
  public static func tangentWorld(_ solved: Solved, thetaRad: Double) throws -> Point {
    try assertFinite(thetaRad, "thetaRad")
    let u = solved.planeBasis.u
    let m = solved.planeBasis.m
    let along = Constants.studioRadius * FDLibm.cos(thetaRad)
    let inward = Constants.studioRadius * FDLibm.sin(thetaRad)
    return Point(
      x: along * u.x + inward * m.x,
      y: along * u.y + inward * m.y,
      z: along * u.z + inward * m.z)
  }

  /// Punkt i svingplanet: `LP + a·u + b·m`. Glassflaten i begge visninger er
  /// quads av disse — planets form eies her, ikke i rendereren.
  public static func planePoint(
    _ solved: Solved, alongM: Double, upM: Double
  ) throws -> Point {
    try assertFinite(alongM, "alongM")
    try assertFinite(upM, "upM")
    let lp = solved.lowPointWorld
    let u = solved.planeBasis.u
    let m = solved.planeBasis.m
    return Point(
      x: lp.x + alongM * u.x + upM * m.x,
      y: lp.y + alongM * u.y + upM * m.y,
      z: lp.z + alongM * u.z + upM * m.z)
  }

  // ── Pinhole-kamera for DTL ───────────────────────────────────────────────

  public struct CameraSpec: Sendable {
    public let pos: Point
    public let look: Point
    public let fovDeg: Double
    public let xStretch: Double
    public let screenX: Double

    public init(
      pos: Point, look: Point, fovDeg: Double,
      xStretch: Double = 1, screenX: Double = 0
    ) {
      self.pos = pos
      self.look = look
      self.fovDeg = fovDeg
      self.xStretch = xStretch
      self.screenX = screenX
    }
  }

  public struct Camera: Sendable {
    public let pos: Point
    public let fwd: Point
    public let right: Point
    public let upVec: Point
    public let focal: Double
    public let w: Double
    public let h: Double
    public let xStretch: Double
    public let screenX: Double
  }

  /// Pinhole-kamera for DTL-perspektivet. Z-opp-verden.
  public static func pinholeCamera(_ spec: CameraSpec, w: Double, h: Double) throws -> Camera {
    try assertFinite(spec.fovDeg, "fovDeg")
    try assertFinite(w, "w")
    try assertFinite(h, "h")

    func sub(_ a: Point, _ b: Point) -> Point {
      Point(x: a.x - b.x, y: a.y - b.y, z: a.z - b.z)
    }
    func cross(_ a: Point, _ b: Point) -> Point {
      Point(
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x)
    }
    func norm(_ v: Point) -> Point {
      // JS: `Math.hypot(...) || 1` — nullvektor normaliseres til seg selv.
      var len = JSMath.hypot(v.x, v.y, v.z)
      if len == 0 { len = 1 }
      return Point(x: v.x / len, y: v.y / len, z: v.z / len)
    }

    let fwd = norm(sub(spec.look, spec.pos))
    let right = norm(cross(fwd, Point(x: 0, y: 0, z: 1)))
    let upVec = norm(cross(right, fwd))
    // JS: `(h / 2) / Math.tan(((fovDeg * PI) / 180) / 2)` — studio-gruppering.
    let focal = (h / 2) / FDLibm.tan(Angles.studioDegToRad(spec.fovDeg) / 2)

    return Camera(
      pos: spec.pos, fwd: fwd, right: right, upVec: upVec,
      focal: focal, w: w, h: h,
      xStretch: spec.xStretch, screenX: spec.screenX)
  }

  public struct Projected: Equatable, Sendable {
    public let x: Double
    public let y: Double
    public let d: Double  // kameradybde (taper)
  }

  /// Projiser et verdenspunkt gjennom kamerabasisen.
  /// `nil` når punktet ligger bak kameraet (`zC <= 0.01`).
  public static func projectPoint(_ p: Point, camera: Camera) -> Projected? {
    let rel = Point(x: p.x - camera.pos.x, y: p.y - camera.pos.y, z: p.z - camera.pos.z)
    func dot(_ a: Point, _ c: Point) -> Double {
      a.x * c.x + a.y * c.y + a.z * c.z
    }
    let xC = dot(rel, camera.right)
    let yC = dot(rel, camera.upVec)
    let zC = dot(rel, camera.fwd)
    if zC <= 0.01 { return nil }
    // Delt opp i lokale ledd — typesjekkeren ga opp det samlede uttrykket.
    let halfW: Double = camera.w / 2
    let halfH: Double = camera.h / 2
    let screenX: Double = halfW + camera.screenX + (xC / zC) * camera.focal * camera.xStretch
    let screenY: Double = halfH - (yC / zC) * camera.focal
    return Projected(x: screenX, y: screenY, d: zC)
  }
}
