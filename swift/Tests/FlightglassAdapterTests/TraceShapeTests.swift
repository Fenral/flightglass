import XCTest

@testable import FlightglassAdapter
@testable import FlightglassEngine

/// Adapter modul 5 — TraceShape (D61/D63/D79), portert fra
/// `adapter/test/traceShape.test.js`. Referanseoutputene er JS-motorens
/// (samme literaler som `DisplayFlightTests`); D79-testen over SAMTLIGE
/// fixture-caser ligger i `FlightglassEngineTests/TraceShapeFixtureTests`.
final class TraceShapeTests: XCTestCase {

  /// `solveFlight({100, -3, 2, -2, 14})` — SHOT i JS-testen.
  static let shot: TraceShape.EngineOut = DisplayFlightTests.shapedOut

  /// `solveFlight({85, 0, 0, -4.3, 20.9})` — NEUTRAL.
  static let neutral: TraceShape.EngineOut = DisplayFlightTests.shotOut

  /// `solveFlight({90, 0, 0, 0, 0})` — degenerert, hasFlight = false.
  static let degenerate: TraceShape.EngineOut = [
    "startDirection": 0, "carry": 0, "offline": 0,
    "apex": 0, "launchAngle": 0, "landingAngle": 0,
  ]

  private func close(
    _ a: Double, _ b: Double, _ tol: Double, _ msg: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    let scale = Swift.max(1, abs(a), abs(b))
    XCTAssertLessThanOrEqual(abs(a - b) / scale, tol, "\(msg): \(a) vs \(b)", file: file, line: line)
  }

  func testSampleCounts() throws {
    XCTAssertEqual(try TraceShape.topPoints(Self.shot).count, 65)
    XCTAssertEqual(try TraceShape.heightPoints(Self.shot).count, 65)
    XCTAssertEqual(try TraceShape.topPoints(Self.shot, n: 8).count, 9)
    XCTAssertEqual(try TraceShape.heightPoints(Self.shot, n: 1).count, 2)
  }

  func testTopPointsStartAtOriginEndAtOffline() throws {
    let pts = try TraceShape.topPoints(Self.shot)
    XCTAssertEqual(pts[0].0, 0)
    XCTAssertEqual(pts[0].1, 0)
    let last = pts[pts.count - 1]
    close(last.0, Self.shot["offline"]!, 1e-12, "lateral slutt = offline")
    let a = Angles.studioDegToRad(Self.shot["startDirection"]!)
    close(last.1, Self.shot["carry"]! * FDLibm.cos(a), 1e-12, "downrange slutt")
  }

  func testHeightPointsHitGroundAndApex() throws {
    let pts = try TraceShape.heightPoints(Self.shot)
    XCTAssertEqual(pts[0].0, 0)
    XCTAssertEqual(pts[0].1, 0)
    let last = pts[pts.count - 1]
    XCTAssertEqual(last.0, Self.shot["carry"]!, "downrange slutt er carry, bit-eksakt")
    XCTAssertEqual(last.1, 0)
    close(pts[32].1, Self.shot["apex"]!, 1e-9, "apex i t=0.5")
  }

  func testHeightTangentsHitLaunchAndLanding() throws {
    let pts = try TraceShape.heightPoints(Self.shot, n: 4000)
    let slopeStart = (pts[1].1 - pts[0].1) / (pts[1].0 - pts[0].0)
    let slopeEnd = (pts[4000].1 - pts[3999].1) / (pts[4000].0 - pts[3999].0)
    close(
      slopeStart, FDLibm.tan(Angles.studioDegToRad(Self.shot["launchAngle"]!)),
      1e-2, "launch-tangent")
    close(
      slopeEnd, -FDLibm.tan(Angles.studioDegToRad(Self.shot["landingAngle"]!)),
      1e-2, "landing-tangent")
  }

  func testDegenerateShotIsFlatFiniteAndAboveGround() throws {
    for pts in [
      try TraceShape.topPoints(Self.degenerate),
      try TraceShape.heightPoints(Self.degenerate),
    ] {
      for (x, y) in pts {
        XCTAssertTrue(x.isFinite && y.isFinite)
      }
    }
    for (_, y) in try TraceShape.heightPoints(Self.degenerate) {
      XCTAssertGreaterThanOrEqual(y, 0, "aldri under bakken")
    }
  }

  func testNonFiniteFieldsAndBadNThrow() {
    var broken = Self.shot
    broken["carry"] = .nan
    XCTAssertThrowsError(try TraceShape.topPoints(broken))
    var missing = Self.shot
    missing.removeValue(forKey: "offline")
    XCTAssertThrowsError(try TraceShape.topPoints(missing))
    var infApex = Self.shot
    infApex["apex"] = .infinity
    XCTAssertThrowsError(try TraceShape.heightPoints(infApex))
    XCTAssertThrowsError(try TraceShape.topPoints(Self.shot, n: 0))
  }

  func testDirectionRay() throws {
    // Kardinalene eksakt der IEEE tillater det.
    let zero = try TraceShape.directionRay(0)
    XCTAssertEqual(zero.sin, 0)
    XCTAssertEqual(zero.cos, 1)
    XCTAssertEqual(try TraceShape.directionRay(90).sin, 1)
    XCTAssertLessThan(abs(try TraceShape.directionRay(90).cos), 1e-15)
    XCTAssertEqual(try TraceShape.directionRay(-90).sin, -1)

    for deg in [-45.0, -15, -5.18, -0.3, 0.7, 12.25, 51, 89] {
      let r = try TraceShape.directionRay(deg)
      close(JSMath.hypot(r.sin, r.cos), 1, 1e-15, "enhetslengde \(deg)°")
      XCTAssertEqual(r.sin > 0, deg > 0, "sin-fortegn \(deg)°")
      XCTAssertGreaterThan(r.cos, 0, "cos positiv i (−90, 90): \(deg)°")
    }

    // Samme radianuttrykk som resten av traceShape: (deg × π) / 180.
    XCTAssertEqual(
      try TraceShape.directionRay(33).sin,
      FDLibm.sin(Angles.studioDegToRad(33)))

    XCTAssertThrowsError(try TraceShape.directionRay(.nan))
    XCTAssertThrowsError(try TraceShape.directionRay(.infinity))
  }

  // ── traceSamples — D79 ───────────────────────────────────────────────────

  func testTraceSamplesCountsAndFiniteness() throws {
    let pts = try TraceShape.traceSamples(Self.shot)
    XCTAssertEqual(pts.count, 65)
    for p in pts {
      XCTAssertTrue(p.lat.isFinite && p.d.isFinite && p.h.isFinite)
    }
    XCTAssertEqual(try TraceShape.traceSamples(Self.shot, n: 1).count, 2)
  }

  func testTraceSamplesAnchorsInheritedFromHeightProfile() throws {
    let pts = try TraceShape.traceSamples(Self.shot)
    close(pts[32].h, Self.shot["apex"]!, 1e-9, "apex i t=0.5")
    let fine = try TraceShape.traceSamples(Self.shot, n: 4000)
    let slopeStart = (fine[1].h - fine[0].h) / (fine[1].d - fine[0].d)
    let slopeEnd = (fine[4000].h - fine[3999].h) / (fine[4000].d - fine[3999].d)
    close(
      slopeStart, FDLibm.tan(Angles.studioDegToRad(Self.shot["launchAngle"]!)),
      1e-2, "launch-tangent")
    close(
      slopeEnd, -FDLibm.tan(Angles.studioDegToRad(Self.shot["landingAngle"]!)),
      1e-2, "landing-tangent")
  }

  func testTraceSamplesInnerPointsBitIdenticalToHeightPoints() throws {
    // D79-invariant 3: delte uttrykk — ikke to implementasjoner.
    for out in [Self.shot, Self.neutral, Self.degenerate] {
      let s = try TraceShape.traceSamples(out, n: 64)
      let hp = try TraceShape.heightPoints(out, n: 64)
      for i in 1..<64 {
        XCTAssertEqual(s[i].d, hp[i].0, "d avviker i punkt \(i)")
        XCTAssertEqual(s[i].h, hp[i].1, "h avviker i punkt \(i)")
      }
    }
  }
}
