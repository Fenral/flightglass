import XCTest

@testable import FlightglassEngine

/// Modul 11 — §8.1–8.4 studiogeometri, mot alle 2500 studio-caser.
///
/// D74: studio-fixturen ER v1-semantikk, og geometrifeltene er delt mellom v1
/// og v2 — de verifiseres direkte mot den. Forventningen er bit-eksakt: alle
/// transcendentale går gjennom FDLibm.
final class StudioGeometryTests: XCTestCase {

  private func solve(_ c: FixtureCase) -> StudioGeometry.Result {
    guard let mode = c.inString("clubMode").flatMap(ClubMode.init(rawValue:)) else {
      fatalError("\(c.id): ukjent clubMode")
    }
    return StudioGeometry.solve(
      swingPlane: c.inDouble("swingPlane"),
      swingDirection: c.inDouble("swingDirection"),
      ballPositionCm: c.inDouble("ballPositionCm"),
      arcHeightCm: c.inDouble("arcHeightCm"),
      clubMode: mode)
  }

  func testAllSixFieldsAreBitExact() {
    let cases = Fixture.studio()
    XCTAssertEqual(cases.count, 2500)

    var perField: [String: [Comparison]] = [:]
    for c in cases {
      let r = solve(c)
      let fields: [(String, Double)] = [
        ("lowPointX", r.lowPointX),
        ("lowPointZ", r.lowPointZ),
        ("effectiveLowPointX", r.effectiveLowPointX),
        ("thetaAtImpact", r.thetaAtImpact),
        ("attackAngle", r.attackAngle),
        ("clubPath", r.clubPath),
      ]
      for (field, actual) in fields {
        guard let expected = c.outDouble(field) else {
          XCTFail("\(c.id): fixturen mangler \(field)")
          continue
        }
        perField[field, default: []].append(
          Comparison(id: c.id, field: field, expected: expected, actual: actual))
      }
    }

    for (field, comparisons) in perField.sorted(by: { $0.key < $1.key }) {
      assertField("studioGeometry/\(field)", comparisons, tolerance: .exact)
    }
  }

  // ── Pinnede detaljer ─────────────────────────────────────────────────────

  func testClubModeOnlyTouchesLowPointZ() {
    // Verifisert strukturell egenskap: iron og driver gir bit-identiske
    // verdier på alt unntatt lowPointZ, for samme øvrige input.
    for c in Fixture.studio().prefix(400) {
      let iron = StudioGeometry.solve(
        swingPlane: c.inDouble("swingPlane"),
        swingDirection: c.inDouble("swingDirection"),
        ballPositionCm: c.inDouble("ballPositionCm"),
        arcHeightCm: c.inDouble("arcHeightCm"),
        clubMode: .iron)
      let driver = StudioGeometry.solve(
        swingPlane: c.inDouble("swingPlane"),
        swingDirection: c.inDouble("swingDirection"),
        ballPositionCm: c.inDouble("ballPositionCm"),
        arcHeightCm: c.inDouble("arcHeightCm"),
        clubMode: .driver)
      XCTAssertEqual(iron.lowPointX, driver.lowPointX, c.id)
      XCTAssertEqual(iron.effectiveLowPointX, driver.effectiveLowPointX, c.id)
      XCTAssertEqual(iron.thetaAtImpact, driver.thetaAtImpact, c.id)
      XCTAssertEqual(iron.attackAngle, driver.attackAngle, c.id)
      XCTAssertEqual(iron.clubPath, driver.clubPath, c.id)
      XCTAssertNotEqual(iron.lowPointZ, driver.lowPointZ, c.id)
    }
  }

  func testThetaClampNeverBitesInBaseline() {
    // Spec-belagt, ikke fixture-belagt: største |−eff/R| er 0.4355.
    var maxRatio = 0.0
    for c in Fixture.studio() {
      let r = solve(c)
      let ratio = abs(-r.effectiveLowPointX / Constants.studioRadius)
      if ratio > maxRatio { maxRatio = ratio }
    }
    XCTAssertLessThan(maxRatio, Constants.studioThetaSinClamp)
    XCTAssertEqual(maxRatio, 0.4355, accuracy: 0.001, "domenet har flyttet seg")
  }

  func testTheThreeGroupingConventionsActuallyDiverge() {
    // Vakter: hver av de tre konvensjonene må skille seg fra alternativet
    // et sted i fixturens domene, ellers beviser bit-eksaktheten ingenting.
    var phiDiverges = 0
    var perDegreeDiverges = 0
    var radToDegDiverges = 0
    for c in Fixture.studio() {
      let plane = c.inDouble("swingPlane")
      if Angles.studioDegToRad(plane) != plane * Constants.degToRad { phiDiverges += 1 }

      let base = Constants.studioRadius * FDLibm.cos(Angles.studioDegToRad(plane))
      let flightScale: Double = Angles.studioPerDegreeScale(base)
      let inlineScale: Double = (base * Double.pi) / 180
      if flightScale != inlineScale { perDegreeDiverges += 1 }

      let theta = solve(c).thetaAtImpact
      if Angles.studioRadToDeg(theta) != Angles.radToDeg(theta) { radToDegDiverges += 1 }
    }
    XCTAssertGreaterThan(phiDiverges, 0, "phi-konvensjonen er tannløs")
    XCTAssertGreaterThan(perDegreeDiverges, 0, "perDegree-konvensjonen er tannløs")
    XCTAssertGreaterThan(radToDegDiverges, 0, "radToDeg-konvensjonen er tannløs")
  }

  func testDivisionByHundredNotMultiplicationByHundredth() {
    var divergences = 0
    for c in Fixture.studio() {
      let cm = Constants.studioBallPositionOffsetCm - c.inDouble("ballPositionCm")
      let divided: Double = cm / Constants.cmPerMetre
      let multiplied: Double = cm * 0.01
      if divided != multiplied { divergences += 1 }
    }
    XCTAssertGreaterThan(divergences, 0, "cm-vakten er tannløs")
  }

  func testSignConventions() {
    // Ballen lenger frem (større ballPositionCm) => lavere lowPointX.
    let back = StudioGeometry.ballLowPointX(ballPositionCm: -10)
    let forward = StudioGeometry.ballLowPointX(ballPositionCm: 10)
    XCTAssertGreaterThan(back, forward)

    // Treff i low point => null attack og path == swingDirection.
    let atLowPoint = StudioGeometry.solve(
      swingPlane: 55, swingDirection: 3, ballPositionCm: 10.5, arcHeightCm: 0,
      clubMode: .iron)
    XCTAssertEqual(atLowPoint.effectiveLowPointX, -3 * StudioGeometry.lowPointShiftPerDegree(swingPlaneDeg: 55))
  }
}
