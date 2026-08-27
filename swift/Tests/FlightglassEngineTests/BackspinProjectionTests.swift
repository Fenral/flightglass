import XCTest

@testable import FlightglassEngine

/// Modul 6 — backspinProjection, mot alle 5028 flight-caser.
///
/// Kjeden inn er nå heleid av porten: `launchAngle` og `startDirection` fra
/// modul 3–4 (bit-eksakte), `spinAxisUnit` fra modul 2 (bit-eksakt),
/// `totalSpinRpm` fra modul 5 (bit-eksakt). Med fdlibm sin/cos i
/// `launchDirectionUnit` er forventningen bit-eksakt hele veien.
final class BackspinProjectionTests: XCTestCase {

  /// Bygger input fra portens EGNE moduler, ikke fra fixturens `out` — slik
  /// JS-motoren gjør det. Å lese `out.launchAngle` ville skjult en drift i
  /// oppstrøms moduler.
  private func solve(_ c: FixtureCase) -> BackspinProjection.Result {
    let geometry = Geometry3D.solve(
      attackAngle: c.inDouble("attackAngle"),
      clubPath: c.inDouble("clubPath"),
      dynamicLoft: c.inDouble("dynamicLoft"),
      faceAngle: c.inDouble("faceAngle"))
    let launch = LaunchAngle.solve(
      dynamicLoft: c.inDouble("dynamicLoft"), attackAngle: c.inDouble("attackAngle"))
    let start = StartDirection.solve(
      faceAngle: c.inDouble("faceAngle"),
      clubPath: c.inDouble("clubPath"),
      dynamicLoft: c.inDouble("dynamicLoft"))
    let sinLoft = Geometry3D.magnitude(
      Geometry3D.cross(geometry.clubVelocityUnit, geometry.faceNormalUnit))
    let spin = SpinMagnitude.solve(
      clubSpeed: c.inDouble("clubSpeed"),
      dynamicLoft: c.inDouble("dynamicLoft"),
      attackAngle: c.inDouble("attackAngle"),
      sinSpinLoft3D: sinLoft,
      ballSpeed: c.outDouble("ballSpeed"))

    return BackspinProjection.solve(
      launchAngle: launch.launchAngle,
      startDirection: start.startDirection,
      spinAxisUnit: geometry.spinAxisUnit,
      totalSpinRpm: spin.totalSpinRpm)
  }

  func testSignedBackspinRpmIsBitExact() {
    assertField(
      "backspinProjection/signedBackspinRpm",
      compareScalarField("signedBackspinRpm", Fixture.flight()) {
        self.solve($0).signedBackspinRpm
      },
      tolerance: .exact)
  }

  func testBackspinIsBitExact() {
    assertField(
      "backspinProjection/backspin",
      compareScalarField("backspin", Fixture.flight()) { self.solve($0).backspin },
      tolerance: .exact)
  }

  func testRightCurveSpinRpmIsBitExact() {
    assertField(
      "backspinProjection/rightCurveSpinRpm",
      compareScalarField("rightCurveSpinRpm", Fixture.flight()) {
        self.solve($0).rightCurveSpinRpm
      },
      tolerance: .exact)
  }

  func testSpinVectorRadPerSecIsBitExact() {
    var comparisons: [Comparison] = []
    for c in Fixture.flight() {
      guard let expected = c.outVec3("spinVectorRadPerSec") else {
        XCTFail("\(c.id): fixturen mangler spinVectorRadPerSec")
        continue
      }
      let actual = solve(c).spinVectorRadPerSec
      for (axis, e, a) in [
        ("x", expected.x, actual.x), ("y", expected.y, actual.y),
        ("z", expected.z, actual.z),
      ] {
        comparisons.append(
          Comparison(
            id: c.id, field: "spinVectorRadPerSec.\(axis)", expected: e, actual: a))
      }
    }
    assertField(
      "backspinProjection/spinVectorRadPerSec", comparisons, tolerance: .exact)
  }

  // ── Pinnede detaljer ─────────────────────────────────────────────────────

  func testCollinearBranchFiresIn692Cases() {
    // ENGINE-GAPS §5-grenen bevarer eksakt signert total ved numerisk
    // kollineære akser. 692 av 5028 caser i baseline.
    var fired = 0
    for c in Fixture.flight() {
      let geometry = Geometry3D.solve(
        attackAngle: c.inDouble("attackAngle"),
        clubPath: c.inDouble("clubPath"),
        dynamicLoft: c.inDouble("dynamicLoft"),
        faceAngle: c.inDouble("faceAngle"))
      let launch = LaunchAngle.solve(
        dynamicLoft: c.inDouble("dynamicLoft"), attackAngle: c.inDouble("attackAngle"))
      let start = StartDirection.solve(
        faceAngle: c.inDouble("faceAngle"),
        clubPath: c.inDouble("clubPath"),
        dynamicLoft: c.inDouble("dynamicLoft"))
      let l = BackspinProjection.launchDirectionUnit(
        launchAngleDeg: launch.launchAngle, startDirectionDeg: start.startDirection)
      let b = BackspinProjection.backspinAxis(l)
      let p = Geometry3D.dot(geometry.spinAxisUnit, b)
      if abs(abs(p) - 1) < Constants.signedBackspinCollinearEpsilon { fired += 1 }
    }
    XCTAssertEqual(fired, 692, "antall kollineære caser har endret seg")
  }

  func testBackspinIsAbsoluteValueOfSigned() {
    for c in Fixture.flight().prefix(500) {
      let r = solve(c)
      XCTAssertEqual(r.backspin, abs(r.signedBackspinRpm), c.id)
    }
    // Og det finnes negative signerte i fixturen, ellers er skillet tomt.
    let negatives = Fixture.flight().filter {
      ($0.outDouble("signedBackspinRpm") ?? 0) < 0
    }
    XCTAssertFalse(negatives.isEmpty, "ingen negative signedBackspinRpm i fixturen")
  }

  func testBackspinAxisFallbackIsUnreachableInBaseline() {
    // `b`-fallbacken krever launchAngle ±90°. Vakten dokumenterer at ingen
    // baseline-case når den — grenen finnes for spec-en, ikke for fixturen.
    for c in Fixture.flight() {
      let launch = LaunchAngle.solve(
        dynamicLoft: c.inDouble("dynamicLoft"), attackAngle: c.inDouble("attackAngle"))
      XCTAssertLessThan(abs(launch.launchAngle), 90, c.id)
    }
  }

  func testPureFunction() {
    let u = Vec3(0.9, 0.1, 0.05)
    let a = BackspinProjection.solve(
      launchAngle: 15, startDirection: 2, spinAxisUnit: u, totalSpinRpm: 3000)
    let b = BackspinProjection.solve(
      launchAngle: 15, startDirection: 2, spinAxisUnit: u, totalSpinRpm: 3000)
    XCTAssertEqual(a, b)
  }
}
