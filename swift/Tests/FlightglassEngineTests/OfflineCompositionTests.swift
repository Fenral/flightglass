import XCTest

@testable import FlightglassEngine

/// Modul 9 — §5.8 offline-komposisjon, mot alle 5028 flight-caser.
///
/// `curve` leses fra fixturens `out` — samme mønster som JS-motorens egen
/// test: modulen er et rent komposisjonssteg nedstrøms for §5.6/§5.1/§5.7,
/// og RK4-kjeden som produserer `curve` porteres i modul 10–11. `carry` og
/// `startDirection` bygges likevel av portens egne moduler, som er bit-eksakte.
final class OfflineCompositionTests: XCTestCase {

  private func solve(_ c: FixtureCase) -> Double {
    let g = Geometry3D.solve(
      attackAngle: c.inDouble("attackAngle"),
      clubPath: c.inDouble("clubPath"),
      dynamicLoft: c.inDouble("dynamicLoft"),
      faceAngle: c.inDouble("faceAngle"))
    let smash = SmashBallSpeed.solve(
      clubSpeed: c.inDouble("clubSpeed"), spinLoft: g.spinLoft3DDeg)
    let launch = LaunchAngle.solve(
      dynamicLoft: c.inDouble("dynamicLoft"), attackAngle: c.inDouble("attackAngle"))
    let start = StartDirection.solve(
      faceAngle: c.inDouble("faceAngle"),
      clubPath: c.inDouble("clubPath"),
      dynamicLoft: c.inDouble("dynamicLoft"))
    let longitudinal = LongitudinalLegacy.solve(
      ballSpeed: smash.ballSpeed,
      launchAngle: launch.launchAngle,
      dynamicLoft: c.inDouble("dynamicLoft"),
      attackAngle: c.inDouble("attackAngle"))
    // `curve` fra fixturen til RK4-kjeden er portert (modul 10–11).
    let curve = c.outDouble("curve") ?? 0
    return OfflineComposition.solve(
      carry: longitudinal.carry,
      startDirection: start.startDirection,
      curve: curve)
  }

  func testOfflineIsBitExact() {
    assertField(
      "offlineComposition/offline",
      compareScalarField("offline", Fixture.flight()) { self.solve($0) },
      tolerance: .exact)
  }

  // ── Pinnede detaljer ─────────────────────────────────────────────────────

  func testTheMissingCosTermMustStayMissing() {
    // README-felle 6. Med cos-leddet bryter nøyaktig de 4015 casene som har
    // curve != 0 — også mot 1e-9 relativt.
    var broken = 0
    var curveNonZero = 0
    for c in Fixture.flight() {
      guard let expected = c.outDouble("offline"),
        let curve = c.outDouble("curve"),
        let carry = c.outDouble("carry"),
        let startDirection = c.outDouble("startDirection")
      else { continue }
      if curve != 0 { curveNonZero += 1 }

      let side = OfflineComposition.startLineSide(
        carry: carry, startDirectionDeg: startDirection)
      let withCos =
        side + curve * FDLibm.cos(OfflineComposition.startDirectionRad(startDirection))
      if withCos != expected { broken += 1 }
    }
    XCTAssertEqual(broken, curveNonZero, "cos-leddet bryter ikke lenger nøyaktig curve≠0-settet")
    XCTAssertEqual(curveNonZero, 4015, "antall caser med curve != 0 har endret seg")
  }

  func testGroupingIsTheStudioFormNotFlightDegToRad() {
    // (deg × π) / 180 mot deg × degToRad — 499 caser skiller i JS-baselinen.
    // Vakten: formene må divergere et sted, ellers beviser bit-eksaktheten
    // over ingenting om grupperingsvalget.
    var divergences = 0
    for c in Fixture.flight() {
      guard let startDirection = c.outDouble("startDirection") else { continue }
      let studioForm = (startDirection * Double.pi) / 180
      let flightForm = startDirection * Constants.degToRad
      if studioForm != flightForm { divergences += 1 }
    }
    XCTAssertGreaterThan(divergences, 0, "grupperingsvakten er tannløs")
  }

  func testZeroStartDirectionMakesOfflineEqualCurve() {
    var matched = 0
    for c in Fixture.flight() {
      guard let startDirection = c.outDouble("startDirection"),
        startDirection == 0,
        let curve = c.outDouble("curve"),
        let offline = c.outDouble("offline")
      else { continue }
      matched += 1
      XCTAssertEqual(offline, curve, c.id)
    }
    XCTAssertEqual(matched, 206, "antall caser med startDirection == 0 har endret seg")
  }

  func testNoFlightGivesZeroWithoutAGuard() {
    // Ingen hasFlight-guard: 0 × sin(x) + 0 er 0 av seg selv.
    var noFlight = 0
    for c in Fixture.flight() {
      guard let carry = c.outDouble("carry"), carry == 0 else { continue }
      noFlight += 1
      XCTAssertEqual(c.outDouble("offline"), 0, c.id)
      XCTAssertEqual(solve(c), 0, c.id)
    }
    XCTAssertEqual(noFlight, 382)
  }
}
