import XCTest

@testable import FlightglassEngine

/// Modul 14 — studioSolve v2 mot hele studio-fixturen.
///
/// v2 er en BEVISST versjonert endring (D7). Testen sjekker derfor ikke at
/// tallene er like — de skal ikke være det. Den sjekker at endringen er den
/// besluttede, og bare den. Portert fra `engine/test/studioSolve.test.js`.
final class StudioSolveTests: XCTestCase {

  /// v1 sitt `clubMode` oversatt til v2 sine to akser — samme mapping som JS.
  private func run(_ c: FixtureCase) throws -> StudioSolve.Result {
    let isIron = c.inString("clubMode") == "iron"
    return try StudioSolve.solve(
      swingPlane: c.inDouble("swingPlane"),
      swingDirection: c.inDouble("swingDirection"),
      ballPositionCm: c.inDouble("ballPositionCm"),
      arcHeightCm: c.inDouble("arcHeightCm"),
      lieHeightMm: (isIron ? ContactModel.LiePreset.hardpan : .tee).heightMm,
      club: (isIron ? ContactModel.Club.midIron : .driver).geometry,
      dynamicLoftDeg: isIron ? 31 : 12.5)
  }

  func testAll2500CasesGiveFiniteNumbersInEveryNumericField() throws {
    var checked = 0
    for c in Fixture.studio() {
      let r = try run(c)
      let numbers: [(String, Double)] = [
        ("attackAngle", r.attackAngle), ("clubPath", r.clubPath),
        ("lowPointX", r.lowPointX), ("lowPointZ", r.lowPointZ),
        ("effectiveLowPointX", r.effectiveLowPointX),
        ("thetaAtImpact", r.thetaAtImpact), ("clubHeightM", r.clubHeightM),
        ("faceCentreOffsetMm", r.faceCentreOffsetMm),
        ("faceCentreOffsetRatio", r.faceCentreOffsetRatio),
        ("verticalFaceHeightMm", r.verticalFaceHeightMm),
        ("lowPointWorld.x", r.lowPointWorld.x), ("lowPointWorld.y", r.lowPointWorld.y),
        ("lowPointWorld.z", r.lowPointWorld.z),
        ("impactPoint.x", r.impactPoint.x), ("impactPoint.y", r.impactPoint.y),
        ("impactPoint.z", r.impactPoint.z),
      ]
      for (name, v) in numbers {
        XCTAssertTrue(v.isFinite, "\(c.id): \(name) er ikke endelig")
        checked += 1
      }
    }
    XCTAssertGreaterThan(checked, 20000, "for få felt kontrollert: \(checked)")
  }

  func testAttackAndPathAreUnchangedFromV1() throws {
    // Køllenøytral geometri: v2 skal reprodusere v1-fixturens attack og path.
    // JS-testen bruker < 1e-12 absolutt; porten er bit-eksakt i geometrien,
    // så samme bånd holder med god margin — men vi måler og rapporterer.
    var comparisons: [Comparison] = []
    for c in Fixture.studio() {
      let r = try run(c)
      if let a = c.outDouble("attackAngle") {
        comparisons.append(
          Comparison(id: c.id, field: "attackAngle", expected: a, actual: r.attackAngle))
      }
      if let p = c.outDouble("clubPath") {
        comparisons.append(
          Comparison(id: c.id, field: "clubPath", expected: p, actual: r.clubPath))
      }
    }
    assertField("studioSolve/attackPathV1Parity", comparisons, tolerance: .exact)
  }

  func testD3OffsetNeverExceedsHalfFaceWithoutOffFace() throws {
    for c in Fixture.studio() {
      let r = try run(c)
      let half = r.verticalFaceHeightMm / 2
      if abs(r.faceCentreOffsetMm) > half {
        XCTAssertFalse(r.onFace, c.id)
        XCTAssertEqual(
          r.facePosition, .offFace,
          "\(c.id): offset \(r.faceCentreOffsetMm) > halv flate \(half) men ikke OffFace")
      }
    }
  }

  func testBothClassificationAnswersAlwaysPresent_U1() throws {
    for c in Fixture.studio() {
      let r = try run(c)
      if r.hasTurfContact {
        XCTAssertNotNil(r.turfBand, "\(c.id): turf i spill men turfBand mangler")
        XCTAssertEqual(r.strikeLead, r.turfBand?.rawValue, c.id)
      } else {
        XCTAssertNil(r.turfBand, "\(c.id): ingen turf, men turfBand satt")
        XCTAssertEqual(r.strikeLead, r.facePosition.rawValue, c.id)
      }
    }
  }

  func testProvenanceTravelsWithEveryAnswer() throws {
    let r = try run(Fixture.studio()[0])
    XCTAssertGreaterThanOrEqual(r.lieHeightMm, 0)
    XCTAssertGreaterThan(r.sweetSpotHeightMm, 0)
    XCTAssertEqual(r.ballRadiusM, 0.021336)
  }

  func testF11GuardSweetSpotNeverEqualsBallRadius() {
    for club in [ContactModel.Club.midIron, .driver] {
      XCTAssertNotEqual(
        club.geometry.sweetSpotHeightMm, 21.336,
        "sweetspot er ballradiusen igjen — F11 har krøpet tilbake")
    }
  }

  func testContractThrowsOnBadInput() {
    XCTAssertThrowsError(
      try StudioSolve.solve(
        swingPlane: .nan, swingDirection: 0, ballPositionCm: 0, arcHeightCm: -5,
        lieHeightMm: 0, club: ContactModel.Club.midIron.geometry, dynamicLoftDeg: 31))
    XCTAssertThrowsError(
      try StudioSolve.solve(
        swingPlane: 55, swingDirection: 0, ballPositionCm: 0, arcHeightCm: -5,
        lieHeightMm: -1, club: ContactModel.Club.midIron.geometry, dynamicLoftDeg: 31))
  }

  func testLowPointZv2HasNoClubCorrection() {
    // v2: arcHeightCm / 100, ingen zClub. v1 ville gitt (−5 − 0.2)/100 for
    // jern; v2 gir −5/100 uansett kølle.
    XCTAssertEqual(StudioSolve.lowPointZv2(arcHeightCm: -5), -0.05)
  }
}
