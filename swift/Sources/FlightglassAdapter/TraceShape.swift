import FlightglassEngine

/// TRACESHAPE — banens tegneform mellom motorens endepunkter (D61).
///
/// Portert fra `adapter/src/traceShape.js`.
///
/// `solveFlight` returnerer 81 felt, og ingen av dem er banens form: RK4
/// integrerer kurven og kaster punktene. Formen er derfor en TEGNEANTAGELSE
/// over motorens tall — projeksjon/interpolasjon, ikke fysikk. Eksakte
/// avlesninger kommer alltid fra motoroutput, aldri fra kurvepunktene.
///
/// Den bor i adapteren av samme grunn som konverteringen: det skal finnes ÉN
/// form (D61). Trigonometri er tillatt her (D62 kategori 2) og forbudt i UI.
///
/// Alt er yards inn og yards ut. Konvertering skjer i `Convert` ETTERPÅ.
public enum TraceShape {

  public enum ContractError: Error, Equatable {
    case nonFiniteField(String)
    case badSampleCount(Int)
  }

  /// Feltordbok fra `solveFlight` sitt returobjekt — samme kontrakt som
  /// `DisplayFlight`.
  public typealias EngineOut = [String: Double]

  private static func field(_ out: EngineOut, _ name: String) throws -> Double {
    guard let v = out[name], v.isFinite else {
      throw ContractError.nonFiniteField(name)
    }
    return v
  }

  private static func assertSamples(_ n: Int) throws {
    guard n >= 1 else { throw ContractError.badSampleCount(n) }
  }

  /// Enhetsvektor for en motorvinkel (D63) — strålene i rendererne, senere
  /// hele D-plane. Projeksjon av motortall (kategori 2): leveres av
  /// adapteren, aldri regnet i UI.
  ///
  /// Returnerer `[sin, cos]`. SAMME par bærer ulike roller per plan:
  /// - topp-view (DIRECTION): `[sin, cos]` = `[lateral, downrange]`
  /// - høyde-view (HEIGHT): `[cos, sin]` = `[downrange, opp]` (indeks 1, 0)
  ///
  /// JS bruker `deg * Math.PI / 180` — venstreassosiativt er det
  /// `(deg * π) / 180`, altså studio-grupperingen.
  public static func directionRay(_ deg: Double) throws -> (sin: Double, cos: Double) {
    guard deg.isFinite else { throw ContractError.nonFiniteField("deg") }
    let a = Angles.studioDegToRad(deg)
    return (FDLibm.sin(a), FDLibm.cos(a))
  }

  // ── Delte interne hjelpere — ÉN kilde for grenvalg og kurveparametre ─────
  // `topPoints`, `heightPoints` og `traceSamples` er tre projeksjoner av de
  // samme uttrykkene (D79-invariant 3).

  struct LateralParams {
    let C: Double
    let offline: Double
    let sinA: Double
    let cosA: Double
    let dEnd: Double
  }

  static func lateralParams(_ out: EngineOut) throws -> LateralParams {
    let startDirection = try field(out, "startDirection")
    let C = try field(out, "carry")
    let offline = try field(out, "offline")
    let a = Angles.studioDegToRad(startDirection)  // deg * π / 180, som JS
    let sinA = FDLibm.sin(a)
    let cosA = FDLibm.cos(a)
    return LateralParams(
      C: C, offline: offline, sinA: sinA, cosA: cosA, dEnd: offline - C * sinA)
  }

  struct HeightBranch {
    let degenerate: Bool
    let C: Double
    let apex: Double
    let p1: (Double, Double)
    let p2: (Double, Double)
  }

  /// Grenvalget og kontrollpunktene for høydeprofilen — samme predikat og
  /// samme uttrykk som JS, delt av begge konsumentene.
  static func heightBranch(_ out: EngineOut) throws -> HeightBranch {
    let C = try field(out, "carry")
    let apex = try field(out, "apex")
    let launchAngle = try field(out, "launchAngle")
    let landingAngle = try field(out, "landingAngle")
    let tanL = FDLibm.tan(Angles.studioDegToRad(launchAngle))
    let tanA = FDLibm.tan(Angles.studioDegToRad(landingAngle))
    if !(C > 0) || !(apex > 0) || tanL <= 0.005 || tanA <= 0.005 {
      return HeightBranch(degenerate: true, C: C, apex: apex, p1: (0, 0), p2: (0, 0))
    }
    let xT = C * tanA / (tanL + tanA)
    let yT = xT * tanL
    let s = apex / (0.75 * yT)  // z(0.5) = 0.75·s·yT = apex, eksakt
    return HeightBranch(
      degenerate: false, C: C, apex: apex,
      p1: (s * xT, s * yT),
      p2: (C - s * (C - xT), s * yT))
  }

  // ── De tre offentlige formene ────────────────────────────────────────────

  /// Retningsplanet (DIRECTION): banen sett ovenfra, i yards.
  /// Rett linje langs `startDirection` + kvadratisk lateralavvik som ender
  /// EKSAKT i `out.offline`. Returnerer `[lateralYd, downrangeYd]`.
  public static func topPoints(_ out: EngineOut, n: Int = 64) throws -> [(Double, Double)] {
    try assertSamples(n)
    let p = try lateralParams(out)
    var pts: [(Double, Double)] = []
    pts.reserveCapacity(n + 1)
    for i in 0...n {
      let frac = Double(i) / Double(n)
      let u = frac * p.C
      pts.append((u * p.sinA + p.dEnd * frac * frac, u * p.cosA))
    }
    return pts
  }

  /// Høydeplanet (HEIGHT): banen sett fra siden, i yards.
  /// Kubisk Bézier som treffer launch-tangent, apex (t = 0.5) og
  /// landing-tangent eksakt; degenererer til parabelen `4·apex·t·(1−t)`,
  /// klampet mot bakken. Returnerer `[downrangeYd, heightYd]`.
  public static func heightPoints(_ out: EngineOut, n: Int = 64) throws -> [(Double, Double)] {
    try assertSamples(n)
    let hb = try heightBranch(out)
    var pts: [(Double, Double)] = []
    pts.reserveCapacity(n + 1)
    if hb.degenerate {
      for i in 0...n {
        let t = Double(i) / Double(n)
        pts.append((t * hb.C, JSMath.max(0, 4 * hb.apex * t * (1 - t))))
      }
      return pts
    }
    for i in 0...n {
      let t = Double(i) / Double(n)
      let w1 = 3 * (1 - t) * (1 - t) * t
      let w2 = 3 * (1 - t) * t * t
      let w3 = t * t * t
      pts.append((
        w1 * hb.p1.0 + w2 * hb.p2.0 + w3 * hb.C,
        w1 * hb.p1.1 + w2 * hb.p2.1
      ))
    }
    return pts
  }

  /// Ett punkt på banepolylinjen i 3D. Alt i yards.
  public struct Sample: Equatable, Sendable {
    public let lat: Double  // sideveis, + = høyre (spec §4)
    public let d: Double  // banekoordinat langs bakkesporet, 0 → carry
    public let h: Double  // høyde over bakken
  }

  /// BANEPOLYLINJEN I 3D — D79, vei B.
  ///
  /// D79-invariant 2: endepunktene er BIT-LIKE motorens felt fordi de
  /// TILORDNES, aldri regnes — første punkt er `{0, 0, 0}`, siste
  /// `{offline, carry, 0}`. (Vei B ble valgt fordi normaliserte brøker målt
  /// over fixturen bommet med 1 ULP i 410 av 4646 caser etter
  /// denormalisering — divisjon kan ikke love bit-likhet; tilordning kan.)
  ///
  /// Invariant 3: de indre punktene bruker NØYAKTIG samme uttrykk som
  /// `topPoints`/`heightPoints`, via de delte hjelperne.
  public static func traceSamples(_ out: EngineOut, n: Int = 64) throws -> [Sample] {
    try assertSamples(n)
    let lp = try lateralParams(out)
    let hb = try heightBranch(out)

    var pts = [Sample](repeating: Sample(lat: 0, d: 0, h: 0), count: n + 1)
    // Invariant 2: tilordning, ikke utregning.
    pts[0] = Sample(lat: 0, d: 0, h: 0)
    pts[n] = Sample(lat: lp.offline, d: lp.C, h: 0)

    for i in 1..<n {
      let t = Double(i) / Double(n)
      let u: Double
      let h: Double
      if hb.degenerate {
        u = t * hb.C
        h = JSMath.max(0, 4 * hb.apex * t * (1 - t))
      } else {
        let w1 = 3 * (1 - t) * (1 - t) * t
        let w2 = 3 * (1 - t) * t * t
        let w3 = t * t * t
        u = w1 * hb.p1.0 + w2 * hb.p2.0 + w3 * hb.C
        h = w1 * hb.p1.1 + w2 * hb.p2.1
      }
      // Brøken er u/C i bezier-grenen (C > 0 garantert der) og t i den
      // degenererte (dekker C = 0).
      let f = hb.degenerate ? t : u / hb.C
      pts[i] = Sample(lat: u * lp.sinA + lp.dEnd * f * f, d: u, h: h)
    }
    return pts
  }
}
