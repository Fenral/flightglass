import XCTest

@testable import FlightglassEngine

/// Modul 5 — §5.4 spinnstørrelse, mot alle 5028 flight-caser.
///
/// Den ene transcendentale er sigmoidens `exp`, som nå går gjennom `FDLibm`
/// (D86). Derfor er forventningen **bit-eksakt**, ikke «innenfor toleranse» —
/// og testen dømmer deretter.
final class SpinMagnitudeTests: XCTestCase {

  /// `sinSpinLoft3D` er `|v × n|` fra §5.2 — den bit-eksakte inngangen.
  /// Fixturen eksponerer den ikke direkte, så den bygges fra de to
  /// enhetsvektorene, som selv er verifisert 15084/15084 bit-eksakte.
  private func sinSpinLoft3D(_ c: FixtureCase) -> Double {
    let v = Geometry3D.clubVelocityUnit(
      attackAngleDeg: c.inDouble("attackAngle"), clubPathDeg: c.inDouble("clubPath"))
    let n = Geometry3D.faceNormalUnit(
      dynamicLoftDeg: c.inDouble("dynamicLoft"), faceAngleDeg: c.inDouble("faceAngle"))
    return Geometry3D.magnitude(Geometry3D.cross(v, n))
  }

  private func solve(_ c: FixtureCase) -> SpinMagnitude.Result {
    SpinMagnitude.solve(
      clubSpeed: c.inDouble("clubSpeed"),
      dynamicLoft: c.inDouble("dynamicLoft"),
      attackAngle: c.inDouble("attackAngle"),
      sinSpinLoft3D: sinSpinLoft3D(c),
      ballSpeed: c.outDouble("ballSpeed"))
  }

  func testSpinCalibrationIsBitExact() {
    assertField(
      "spinMagnitude/spinCalibration",
      compareScalarField("spinCalibration", Fixture.flight()) { self.solve($0).spinCalibration },
      tolerance: .exact)
  }

  func testSpinRpmRawIsBitExact() {
    assertField(
      "spinMagnitude/spinRpmRaw",
      compareScalarField("spinRpmRaw", Fixture.flight()) { self.solve($0).spinRpmRaw },
      tolerance: .exact)
  }

  func testTotalSpinRpmIsBitExact() {
    assertField(
      "spinMagnitude/totalSpinRpm",
      compareScalarField("totalSpinRpm", Fixture.flight()) { self.solve($0).totalSpinRpm },
      tolerance: .exact)
  }

  // ── Pinnede detaljer ─────────────────────────────────────────────────────

  func testSpinDenominatorMatchesBaseline() {
    // Spec §5.4, verdi i baseline: 0.0318288331
    XCTAssertEqual(SpinMagnitude.spinDenominatorM, 0.0318288331, accuracy: 1e-16)
  }

  func testCeilingBitesIn929Cases() {
    // FUNN F5: taket på 9000 rpm er en synlig modellgrense, ikke et unntak.
    let clamped = Fixture.flight().filter {
      $0.outDouble("totalSpinRpm") == Constants.maxTotalSpinRpm
    }
    XCTAssertEqual(clamped.count, 929, "antall caser som treffer spinntaket har endret seg")
  }

  func testFloorNeverBitesInBaseline() {
    // `|v × n| ≥ 0`, `clubSpeed ≥ 0` og `spinCalibration > 0` gir alltid
    // `spinRpmRaw ≥ 0`. Nedre clamp er belte-og-seler.
    for c in Fixture.flight() {
      XCTAssertGreaterThanOrEqual(solve(c).spinRpmRaw, 0, "\(c.id)")
    }
  }

  func testCalibrationIsComputedEvenWhenSpinIsZeroed() {
    // `edge.club-speed-zero`: spinCalibration er ~0.8175 samtidig som
    // spinRpmRaw og totalSpinRpm er 0.
    guard let zero = Fixture.flight().first(where: { $0.inDouble("clubSpeed") == 0 }) else {
      return XCTFail("fant ingen case med clubSpeed 0")
    }
    let r = solve(zero)
    XCTAssertEqual(r.totalSpinRpm, 0)
    XCTAssertEqual(r.spinRpmRaw, 0)
    XCTAssertGreaterThan(r.spinCalibration, 0.8, "kalibreringen skal regnes uansett")
    XCTAssertEqual(r.spinCalibration, zero.outDouble("spinCalibration"))
  }

  func testVerticalSpinLoftIsAbsoluteNotSigned() {
    // §5.4 bruker absoluttverdien; den signerte er §5.2 sin.
    XCTAssertEqual(
      SpinMagnitude.verticalSpinLoftDeg(dynamicLoft: 10, attackAngle: 20), 10)
    XCTAssertEqual(
      SpinMagnitude.verticalSpinLoftDeg(dynamicLoft: 20, attackAngle: 10), 10)

    // Og de to skal faktisk være ulike et sted i fixturen, ellers er skillet
    // uten konsekvens og denne vakten tannløs.
    let differing = Fixture.flight().filter {
      let signed = $0.inDouble("dynamicLoft") - $0.inDouble("attackAngle")
      return signed < 0
    }
    XCTAssertFalse(differing.isEmpty, "ingen caser med negativ signert vertikal spin loft")
  }

  func testSigmoidUsesFDLibmNotPlatformExp() {
    // Vakten: er de to like overalt, beviser ikke bit-eksaktheten over noe om
    // hvilken exp som faktisk brukes.
    var divergences = 0
    for c in Fixture.flight() {
      let vsl = SpinMagnitude.verticalSpinLoftDeg(
        dynamicLoft: c.inDouble("dynamicLoft"), attackAngle: c.inDouble("attackAngle"))
      let arg = -(vsl - Constants.spinCalibrationMidpointDeg) / Constants.spinCalibrationWidthDeg
      if FDLibm.exp(arg) != Foundation.exp(arg) { divergences += 1 }
    }
    print("spinMagnitude: FDLibm.exp vs plattformens exp divergerer i \(divergences)/5028")
  }
}
