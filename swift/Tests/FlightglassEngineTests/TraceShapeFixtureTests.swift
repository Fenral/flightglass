import XCTest

@testable import FlightglassAdapter
@testable import FlightglassEngine

/// D79-invariant 2 + 4 over SAMTLIGE fixture-caser — ligger i engine-testmålet
/// fordi fixturelasteren bor her.
final class TraceShapeFixtureTests: XCTestCase {

  /// Feltene traceShape leser, som ordbok fra en fixture-case.
  private func engineOut(_ c: FixtureCase) -> TraceShape.EngineOut? {
    var out: TraceShape.EngineOut = [:]
    for f in ["startDirection", "carry", "offline", "apex", "launchAngle", "landingAngle"] {
      guard let v = c.outDouble(f) else { return nil }
      out[f] = v
    }
    return out
  }

  func testD79EndpointsAreBitIdenticalToEngineFieldsInAllCases() throws {
    var checked = 0
    for c in Fixture.flight() {
      guard let out = engineOut(c) else {
        XCTFail("\(c.id): mangler traceShape-felt")
        continue
      }
      let pts = try TraceShape.traceSamples(out, n: 8)
      let first = pts[0]
      let last = pts[8]
      // Object.is-semantikk: bitPattern-likhet (skiller -0 fra 0).
      XCTAssertEqual(first.lat.bitPattern, (0.0).bitPattern, c.id)
      XCTAssertEqual(first.d.bitPattern, (0.0).bitPattern, c.id)
      XCTAssertEqual(first.h.bitPattern, (0.0).bitPattern, c.id)
      XCTAssertEqual(
        last.lat.bitPattern, out["offline"]!.bitPattern, "\(c.id): lat[n] != offline")
      XCTAssertEqual(
        last.d.bitPattern, out["carry"]!.bitPattern, "\(c.id): d[n] != carry")
      XCTAssertEqual(last.h.bitPattern, (0.0).bitPattern, "\(c.id): h[n] != 0")
      checked += 1
    }
    XCTAssertGreaterThanOrEqual(checked, 5028, "kun \(checked) caser sjekket")
  }

  func testAllInnerPointsAreFiniteAcrossTheFixture() throws {
    // Formen skal aldri produsere NaN, uansett hvor rart slaget er.
    for c in Fixture.flight() {
      guard let out = engineOut(c) else { continue }
      for p in try TraceShape.traceSamples(out, n: 16) {
        XCTAssertTrue(
          p.lat.isFinite && p.d.isFinite && p.h.isFinite,
          "\(c.id): ikke-endelig punkt")
      }
    }
  }
}
