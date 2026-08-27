import XCTest

@testable import FlightglassEngine

/// Modul 10 — outcomeAdapter, mot alle 5028 flight-caser.
///
/// `shape` er et felt i fixturens `out` og sammenlignes ordrett. `hasFlight`,
/// `inDomain` og `reason` returneres ikke av fixturen (ENGINE-GAPS §2–4 sier
/// eksplisitt at de er adapterens), men tre av fixturens egne felt er avledet
/// av `hasFlight` og pinner det indirekte.
final class OutcomeAdapterTests: XCTestCase {

  private func solve(_ c: FixtureCase) -> OutcomeAdapter.Result {
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
    return OutcomeAdapter.solve(
      carry: longitudinal.carry,
      signedVerticalSpinLoftDeg: g.signedVerticalSpinLoftDeg,
      startDirection: start.startDirection,
      faceToPath: c.inDouble("faceAngle") - c.inDouble("clubPath"))
  }

  func testShapeMatchesFixtureVerbatimInAll5028Cases() {
    var failures: [String] = []
    var seen = Set<String>()
    for c in Fixture.flight() {
      guard let expected = c.outString("shape") else {
        XCTFail("\(c.id): fixturen mangler shape")
        continue
      }
      let actual = solve(c).shape
      seen.insert(actual)
      if actual != expected && failures.count < 5 {
        failures.append("\(c.id): forventet '\(expected)', fikk '\(actual)'")
      }
      if actual != expected {}
    }
    let mismatches = Fixture.flight().filter { solve($0).shape != $0.outString("shape") }
    XCTAssertTrue(
      mismatches.isEmpty,
      "\(mismatches.count) shape-avvik:\n" + failures.joined(separator: "\n"))
    // Rapportlinje for leveranse 2 — strengfelt, så pass/fail-form.
    DeviationLog.shared.record(
      Report(
        "outcomeAdapter/shape",
        [
          Comparison(
            id: "alle", field: "ordrett", expected: 0,
            actual: Double(mismatches.count))
        ],
        tolerance: .exact))
  }

  func testAllFifteenShapeLabelsAppearInTheFixture() {
    var seen = Set<String>()
    for c in Fixture.flight() {
      if let s = c.outString("shape") { seen.insert(s) }
    }
    XCTAssertEqual(
      seen, Set(OutcomeAdapter.shapeLabels),
      "fixturens shape-verdier matcher ikke de 15 kjente")
  }

  func testHasFlightIsPinnedIndirectlyByThreeFixtureFields() {
    // hasFlight returneres ikke av fixturen, men landingAngle, rollFrac og
    // landingDomainTerm er alle avledet av den. 0 avvik i alle 5028.
    for c in Fixture.flight() {
      let flies = solve(c).hasFlight
      if flies {
        XCTAssertNotEqual(c.outDouble("landingAngle"), 0, c.id)
        XCTAssertEqual(c.outDouble("landingDomainTerm"), 0, c.id)
      } else {
        XCTAssertEqual(c.outDouble("landingAngle"), 0, c.id)
        XCTAssertEqual(c.outDouble("rollFrac"), 0, c.id)
        XCTAssertNotEqual(c.outDouble("landingDomainTerm"), 0, c.id)
      }
    }
  }

  func testInDomainBoundaryIsStrictlyGreaterThanZero() {
    // Eksakt 0 er UTENFOR domenet — fixturens zero-vertical-edge-caser finnes
    // for akkurat denne grensen.
    XCTAssertFalse(OutcomeAdapter.inDomain(signedVerticalSpinLoftDeg: 0))
    XCTAssertTrue(OutcomeAdapter.inDomain(signedVerticalSpinLoftDeg: .ulpOfOne))
    XCTAssertEqual(OutcomeAdapter.outcomeReason(signedVerticalSpinLoftDeg: 0), "spin-loft")
    XCTAssertNil(OutcomeAdapter.outcomeReason(signedVerticalSpinLoftDeg: 1))

    let zeroEdge = Fixture.flight().filter {
      $0.id.contains("in-domain-false.zero-vertical")
    }
    XCTAssertFalse(zeroEdge.isEmpty, "fixturens zero-vertical-edge-caser er borte")
    for c in zeroEdge {
      XCTAssertEqual(c.outDouble("signedVerticalSpinLoftDeg"), 0, c.id)
    }
  }

  func testShapeIgnoresWhetherTheBallActuallyFlew() {
    // 382 caser uten flukt får likevel kurveord. Baseline — ikke maskér.
    var noFlightWithCurveWord = 0
    for c in Fixture.flight() {
      guard let carry = c.outDouble("carry"), carry == 0,
        let shape = c.outString("shape")
      else { continue }
      if shape.contains("Hook") || shape.contains("Slice") || shape.contains("Draw")
        || shape.contains("Fade")
      {
        noFlightWithCurveWord += 1
      }
    }
    XCTAssertGreaterThan(
      noFlightWithCurveWord, 0,
      "ingen no-flight-caser med kurveord — vakten er tannløs")
  }

  func testThresholdsSitInsideTheirFittedIntervals() {
    // Tersklene er fittet; intervallene er fixturens. Verdiene skal ligge i
    // dem — og fixturen skal fortsatt utelukke verdiene utenfor.
    XCTAssertGreaterThan(OutcomeAdapter.shapeStartStraightMaxDeg, 1.4800000000000004)
    XCTAssertLessThanOrEqual(OutcomeAdapter.shapeStartStraightMaxDeg, 1.5499999999999998)
    XCTAssertGreaterThan(OutcomeAdapter.shapeCurveStraightMaxDeg, 0)
    XCTAssertLessThanOrEqual(OutcomeAdapter.shapeCurveStraightMaxDeg, 1)
    XCTAssertGreaterThan(OutcomeAdapter.shapeCurveMajorMinDeg, 6)
    XCTAssertLessThanOrEqual(OutcomeAdapter.shapeCurveMajorMinDeg, 7.5)
  }
}
