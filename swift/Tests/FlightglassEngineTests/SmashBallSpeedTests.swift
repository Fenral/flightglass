import XCTest

@testable import FlightglassEngine

/// Modul 7 — §5.5 smash og ball speed, mot alle 5028 flight-caser.
///
/// Ren algebra: `.exact` hele veien. Spin loft-inngangen bygges av portens
/// egen `Geometry3D` (bit-eksakt), ikke lest fra fixturens `out`.
final class SmashBallSpeedTests: XCTestCase {

  private func spinLoft3D(_ c: FixtureCase) -> Double {
    let g = Geometry3D.solve(
      attackAngle: c.inDouble("attackAngle"),
      clubPath: c.inDouble("clubPath"),
      dynamicLoft: c.inDouble("dynamicLoft"),
      faceAngle: c.inDouble("faceAngle"))
    return g.spinLoft3DDeg
  }

  private func solve(_ c: FixtureCase) -> SmashBallSpeed.Result {
    SmashBallSpeed.solve(clubSpeed: c.inDouble("clubSpeed"), spinLoft: spinLoft3D(c))
  }

  func testSmashEffIsBitExact() {
    assertField(
      "smashBallSpeed/smashEff",
      compareScalarField("smashEff", Fixture.flight()) { self.solve($0).smashEff },
      tolerance: .exact)
  }

  func testBallSpeedIsBitExact() {
    assertField(
      "smashBallSpeed/ballSpeed",
      compareScalarField("ballSpeed", Fixture.flight()) { self.solve($0).ballSpeed },
      tolerance: .exact)
  }

  func testSmashIsBitExact() {
    assertField(
      "smashBallSpeed/smash",
      compareScalarField("smash", Fixture.flight()) { self.solve($0).smash },
      tolerance: .exact)
  }

  // ── Pinnede detaljer ─────────────────────────────────────────────────────

  func testSmashDiffersFromSmashEffIn372Cases() {
    // Rundturen ballSpeed/clubSpeed mister siste bit i 372 caser. Det er
    // grunnen til at `smash` ikke bare ER `smashEff`.
    var differing = 0
    for c in Fixture.flight() {
      let r = solve(c)
      if r.smash != r.smashEff { differing += 1 }
    }
    XCTAssertEqual(differing, 372, "antall rundtur-avvik har endret seg")
  }

  func testClampFiresAtBothEnds() {
    // 290 caser på gulvet 1.15, 127 på taket 1.52.
    var atFloor = 0
    var atCeiling = 0
    for c in Fixture.flight() {
      let r = solve(c)
      if r.smashEff == Constants.smashMinimum { atFloor += 1 }
      if r.smashEff == Constants.smashMaximum { atCeiling += 1 }
    }
    XCTAssertEqual(atFloor, 290, "gulvtreff har endret seg")
    XCTAssertEqual(atCeiling, 127, "taktreff har endret seg")
  }

  func testUsesSpinLoft3DNotSignedVertical() {
    // README-felle 9: smash bruker 3-D spin loft. Med den signerte vertikale
    // ville 4122 caser vært feil — vakten sjekker at de to faktisk skiller
    // seg i fixturen.
    var differing = 0
    for c in Fixture.flight() {
      let g = Geometry3D.solve(
        attackAngle: c.inDouble("attackAngle"),
        clubPath: c.inDouble("clubPath"),
        dynamicLoft: c.inDouble("dynamicLoft"),
        faceAngle: c.inDouble("faceAngle"))
      if g.spinLoft3DDeg != g.signedVerticalSpinLoftDeg { differing += 1 }
    }
    XCTAssertEqual(differing, 4392, "3-D og vertikal skiller seg i annet antall caser")
  }

  func testZeroClubSpeedGivesZeroSmashButModelledSmashEff() {
    let r = SmashBallSpeed.solve(clubSpeed: 0, spinLoft: 24)
    XCTAssertEqual(r.smash, 0, "0/0-vakten skal gi 0, ikke NaN")
    XCTAssertEqual(r.ballSpeed, 0)
    XCTAssertGreaterThan(r.smashEff, 1.4, "smashEff er modellverdi, uavhengig av fart")
  }

  func testQuadraticGroupingGuard() {
    // `k × (S × S)` mot `(k × S) × S` — 1 ULP fra hverandre i 78 caser i JS.
    // Vakten: de to formene må faktisk divergere et sted, ellers beviser
    // testene over ingenting om grupperingen.
    var divergences = 0
    for c in Fixture.flight() {
      let s = spinLoft3D(c)
      let grouped: Double = Constants.smashSpinLoftQuadratic * (s * s)
      let leftAssoc: Double = (Constants.smashSpinLoftQuadratic * s) * s
      if grouped != leftAssoc { divergences += 1 }
    }
    XCTAssertGreaterThan(divergences, 0, "grupperingsvakten er tannløs")
  }
}
