import XCTest

@testable import FlightglassEngine

/// Modul 4 — §5.3 Launch Angle, mot alle 5028 flight-caser.
///
/// Ren algebra: fire ledd, én divisjon, én clamp. Ingen libm. Toleransen er
/// `.exact` og skal holde på iOS like godt som på Windows.
final class LaunchAngleTests: XCTestCase {

  func testLaunchAngleMatchesFixtureBitExactly() {
    assertField(
      "launchAngle/launchAngle",
      compareScalarField("launchAngle", Fixture.flight()) {
        LaunchAngle.launchAngleDeg(
          dynamicLoftDeg: $0.inDouble("dynamicLoft"),
          attackAngleDeg: $0.inDouble("attackAngle"))
      },
      tolerance: .exact)
  }

  func testInterceptBlendMatchesFixtureBitExactly() {
    assertField(
      "launchAngle/launchInterceptBlend",
      compareScalarField("launchInterceptBlend", Fixture.flight()) {
        LaunchAngle.interceptBlend(dynamicLoftDeg: $0.inDouble("dynamicLoft"))
      },
      tolerance: .exact)
  }

  // ── Flyttallsrekkefølgen som ikke må «ryddes» ────────────────────────────

  func testSquareIsMultiplicationNotPow() {
    // `dl * dl` mot `pow(dl, 2)`. De to er ikke garantert samme tall.
    var divergences = 0
    for c in Fixture.flight() {
      let dl: Double = c.inDouble("dynamicLoft")
      let multiplied: Double = dl * dl
      let powed: Double = pow(dl, 2)
      if multiplied != powed { divergences += 1 }
    }
    // På denne libm-en er de like for alle 5028. Testen dokumenterer det
    // heller enn å påstå det motsatte — men den fanger opp om det endrer seg,
    // og da er `dl * dl` fortsatt det riktige valget.
    print("launchAngle: dl*dl vs pow(dl,2) divergerer i \(divergences)/5028 caser")
  }

  func testBlendIsDivisionNotMultiplicationByATenth() {
    // `dl / 10` mot `dl * 0.1`. Disse er ULIKE for mange verdier.
    var divergences = 0
    for step in 0...500 {
      let dl = Double(step) / 10
      let divided: Double = dl / 10
      let multiplied: Double = dl * 0.1
      if divided != multiplied { divergences += 1 }
    }
    XCTAssertGreaterThan(
      divergences, 0,
      "divisjon og multiplikasjon med 0.1 er aldri ulike her — vakten er tannløs")
  }

  func testLaunchAngleIsUnclampedAndMayBeNegative() {
    // Modellverdien er UKLAMPET. Carry- og apex-modellen gjør sin egen
    // `max(0, launchAngle)`; det hører ikke hjemme i §5.3.
    let value = LaunchAngle.launchAngleDeg(dynamicLoftDeg: 0, attackAngleDeg: -15)
    XCTAssertEqual(value, -3.75)
    XCTAssertLessThan(value, 0)

    let negatives = Fixture.flight().filter { ($0.outDouble("launchAngle") ?? 0) < 0 }
    XCTAssertFalse(
      negatives.isEmpty,
      "fixturen har ingen negative launchAngle — da er denne vakten tannløs")
  }

  func testLowerClampOfBlendIsNeverExercisedByTheFixture() {
    // `0/10` er allerede 0, så den nedre klampen binder aldri. Grenen står
    // fordi spec-en har den; negativ DynamicLoft finnes ikke i baseline.
    let anyNegativeLoft = Fixture.flight().contains { $0.inDouble("dynamicLoft") < 0 }
    XCTAssertFalse(anyNegativeLoft, "fixturen har negativ loft — antagelsen holder ikke")
    XCTAssertEqual(LaunchAngle.interceptBlend(dynamicLoftDeg: -5), 0)
  }

  func testUpperClampSaturatesAtTenDegrees() {
    XCTAssertEqual(LaunchAngle.interceptBlend(dynamicLoftDeg: 10), 1)
    XCTAssertEqual(LaunchAngle.interceptBlend(dynamicLoftDeg: 50), 1)
    XCTAssertEqual(LaunchAngle.interceptBlend(dynamicLoftDeg: 5), 0.5)
  }

  func testCoefficientsAreEmittedAsTheFixtureHasThem() {
    let sample = Fixture.flight()[0]
    let k = LaunchAngle.modelCoefficients
    XCTAssertEqual(sample.outDouble("launchIntercept"), k.launchIntercept)
    XCTAssertEqual(sample.outDouble("launchLoftW"), k.launchLoftW)
    XCTAssertEqual(sample.outDouble("launchLoftQuadratic"), k.launchLoftQuadratic)
    XCTAssertEqual(sample.outDouble("launchAttackW"), k.launchAttackW)
  }
}
