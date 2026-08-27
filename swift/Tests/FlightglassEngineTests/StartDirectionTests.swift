import XCTest

@testable import FlightglassEngine

/// Modul 3 — §5.1 startretning, mot alle 5028 flight-caser.
///
/// Ren algebra: ingen `sin`, ingen `cos`, ingen libm. Toleransen er derfor
/// `.exact`, og den skal holde på iOS like godt som på Windows. Et avvik her
/// er en feil i porten, ikke en plattformforskjell.
final class StartDirectionTests: XCTestCase {

  func testStartFaceWMatchesFixtureBitExactly() {
    let cases = Fixture.flight()
    assertField(
      "startDirection/startFaceW",
      compareScalarField("startFaceW", cases) {
        StartDirection.startFaceWeight(dynamicLoft: $0.inDouble("dynamicLoft"))
      },
      tolerance: .exact)
  }

  func testStartDirectionMatchesFixtureBitExactly() {
    let cases = Fixture.flight()
    assertField(
      "startDirection/startDirection",
      compareScalarField("startDirection", cases) {
        StartDirection.solve(
          faceAngle: $0.inDouble("faceAngle"),
          clubPath: $0.inDouble("clubPath"),
          dynamicLoft: $0.inDouble("dynamicLoft")
        ).startDirection
      },
      tolerance: .exact)
  }

  // ── Baseline-detaljer som ser ut som bugs ────────────────────────────────

  func testInterceptOf090IsNeverReachedBecauseOfThe088Ceiling() {
    // Taket på 0.88 gjør at interceptet 0.90 aldri kan nås. Under 4° loft er
    // vekten konstant 0.88. Fixturen viser det direkte.
    XCTAssertEqual(StartDirection.startFaceWeight(dynamicLoft: 0), 0.88)
    XCTAssertEqual(StartDirection.startFaceWeight(dynamicLoft: 4), 0.88)
    XCTAssertNotEqual(StartDirection.startFaceWeight(dynamicLoft: 0), 0.90)

    let zeroLoft = Fixture.flight().filter { $0.inDouble("dynamicLoft") == 0 }
    XCTAssertFalse(zeroLoft.isEmpty, "fixturen har ingen caser med loft 0")
    for c in zeroLoft {
      XCTAssertEqual(c.outDouble("startFaceW"), 0.88, "\(c.id)")
    }
  }

  func testFloorOf060BitesOnlyAboveSixtyDegrees() {
    // På nøyaktig 60° gir `0.90 − 0.005 × 60` verdien 0.6000000000000001,
    // én ULP over gulvet. Clampen biter først OVER 60°. Flyttallsdetalj,
    // ikke en bug — og den skal overleve porten.
    let atSixty = Constants.startFaceWIntercept - Constants.startFaceWLoftSlope * 60
    XCTAssertEqual(atSixty, 0.6000000000000001)
    XCTAssertGreaterThan(atSixty, Constants.startFaceWMinimum)
    XCTAssertEqual(StartDirection.startFaceWeight(dynamicLoft: 60), atSixty)
    XCTAssertEqual(
      StartDirection.startFaceWeight(dynamicLoft: 61), Constants.startFaceWMinimum)
  }

  func testFloorIsNeverExercisedByTheFixture() {
    // Gulvet krever loft > 60°, utenfor declaredInputBounds [0, 50].
    // Grenen er spec-belagt, men ikke fixture-belagt.
    let atFloor = Fixture.flight().filter {
      $0.outDouble("startFaceW") == Constants.startFaceWMinimum
    }
    XCTAssertTrue(
      atFloor.isEmpty,
      "\(atFloor.count) caser treffer gulvet — det skulle ingen gjøre")
  }

  func testBlendFormIsTheOneThatIsBitExact() {
    // `w × face + (1 − w) × path` mot den algebraisk like
    // `face + (1 − w) × (path − face)`. Bare den første treffer fixturen.
    var divergences = 0
    for c in Fixture.flight() {
      let w = StartDirection.startFaceWeight(dynamicLoft: c.inDouble("dynamicLoft"))
      let face = c.inDouble("faceAngle")
      let path = c.inDouble("clubPath")

      let used = w * face + (1 - w) * path
      let algebraicallyEqual = face + (1 - w) * (path - face)
      if used != algebraicallyEqual { divergences += 1 }
    }
    XCTAssertGreaterThan(
      divergences, 0,
      """
      De to formene gir samme tall i alle 5028 caser. Da er denne vakten \
      tannløs, og noen kan «rydde» uttrykket uten at en test sier fra.
      """)
  }

  func testPureFunction() {
    let a = StartDirection.solve(faceAngle: 2, clubPath: 3, dynamicLoft: 24)
    let b = StartDirection.solve(faceAngle: 2, clubPath: 3, dynamicLoft: 24)
    XCTAssertEqual(a, b)
  }
}
