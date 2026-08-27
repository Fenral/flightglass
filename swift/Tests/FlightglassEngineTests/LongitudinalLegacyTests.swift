import XCTest

@testable import FlightglassEngine

/// Modul 8 — §5.6 longitudinalLegacy, mot alle 5028 flight-caser.
///
/// Inngangene bygges av portens egne moduler: `ballSpeed` fra modul 7,
/// `launchAngle` fra modul 4 — begge bit-eksakte. `exp` går gjennom `FDLibm`.
/// Forventningen er bit-eksakt på alle 16 felt.
final class LongitudinalLegacyTests: XCTestCase {

  private func solve(_ c: FixtureCase) -> LongitudinalLegacy.Result {
    let g = Geometry3D.solve(
      attackAngle: c.inDouble("attackAngle"),
      clubPath: c.inDouble("clubPath"),
      dynamicLoft: c.inDouble("dynamicLoft"),
      faceAngle: c.inDouble("faceAngle"))
    let smash = SmashBallSpeed.solve(
      clubSpeed: c.inDouble("clubSpeed"), spinLoft: g.spinLoft3DDeg)
    let launch = LaunchAngle.solve(
      dynamicLoft: c.inDouble("dynamicLoft"), attackAngle: c.inDouble("attackAngle"))
    return LongitudinalLegacy.solve(
      ballSpeed: smash.ballSpeed,
      launchAngle: launch.launchAngle,
      dynamicLoft: c.inDouble("dynamicLoft"),
      attackAngle: c.inDouble("attackAngle"))
  }

  func testAllSixteenFieldsAreBitExact() {
    let cases = Fixture.flight()
    var perField: [String: [Comparison]] = [:]

    for c in cases {
      let r = solve(c)
      let fields: [(String, Double)] = [
        ("carry", r.carry),
        ("apex", r.apex),
        ("total", r.total),
        ("landingAngle", r.landingAngle),
        ("rollFrac", r.rollFrac),
        ("roll", r.roll),
        ("carryLaunchEfficiency", r.carryLaunchEfficiency),
        ("carryBallSpeedFit", r.carryBallSpeedFit),
        ("apexBallSpeedTerm", r.apexBallSpeedTerm),
        ("apexLaunchTerm", r.apexLaunchTerm),
        ("apexLaunchFactor", r.apexLaunchFactor),
        ("landingSpinTerm", r.landingSpinTerm),
        ("landingLaunchTerm", r.landingLaunchTerm),
        ("landingApexTerm", r.landingApexTerm),
        ("landingDomainTerm", r.landingDomainTerm),
        ("landingRaw", r.landingRaw),
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
      assertField("longitudinalLegacy/\(field)", comparisons, tolerance: .exact)
    }
  }

  // ── Pinnede detaljer ─────────────────────────────────────────────────────

  func testTotalIsAdditionNotDistribution() {
    // Spec-teksten sier `carry × (1 + rollFrac)`; motoren gjør `carry + roll`.
    // De avviker 1 ULP i 1443 caser — vakten sjekker at formene faktisk
    // divergerer, ellers beviser bit-eksaktheten over ingenting om valget.
    var divergences = 0
    for c in Fixture.flight() {
      let r = solve(c)
      let addition: Double = r.carry + r.roll
      let distributed: Double = r.carry * (1 + r.rollFrac)
      if addition != distributed { divergences += 1 }
    }
    XCTAssertEqual(divergences, 1443, "antall form-avvik har endret seg")
  }

  func testRollIsNotTotalMinusCarry() {
    var divergences = 0
    for c in Fixture.flight() {
      let r = solve(c)
      if r.roll != r.total - r.carry { divergences += 1 }
    }
    XCTAssertEqual(divergences, 4492, "antall roll-rekonstruksjonsavvik har endret seg")
  }

  func testDeadTermsAreExactlyZeroEverywhere() {
    for c in Fixture.flight() {
      XCTAssertEqual(c.outDouble("landingLaunchTerm"), 0, c.id)
      XCTAssertEqual(c.outDouble("landingApexTerm"), 0, c.id)
    }
  }

  func testNoFlightCasesDecomposeToExactZero() {
    // 382 caser uten flukt: domenetermen skal gjøre landingRaw eksakt 0,
    // og landingAngle 0 uten å gå gjennom klampen.
    var noFlight = 0
    for c in Fixture.flight() {
      let r = solve(c)
      if r.carry > 0 { continue }
      noFlight += 1
      XCTAssertEqual(r.landingRaw, 0, "\(c.id): dekomponeringen går ikke opp")
      XCTAssertEqual(r.landingAngle, 0, c.id)
      XCTAssertEqual(r.rollFrac, 0, c.id)
    }
    XCTAssertEqual(noFlight, 382, "antall no-flight-caser har endret seg")
  }

  func testClampCounts() {
    var efficiencySaturated = 0
    var landingAtFloor = 0
    var rollAtCeiling = 0
    for c in Fixture.flight() {
      let r = solve(c)
      if r.carryLaunchEfficiency == 1 { efficiencySaturated += 1 }
      if r.carry > 0 && r.landingAngle == Constants.landingMinimum
        && r.landingRaw < Constants.landingMinimum
      {
        landingAtFloor += 1
      }
      if r.rollFrac == Constants.rollFracMaximum { rollAtCeiling += 1 }
    }
    XCTAssertEqual(efficiencySaturated, 3715, "efficiency-metning har endret seg")
    XCTAssertEqual(landingAtFloor, 455, "landingsgulvet har endret seg")
    XCTAssertEqual(rollAtCeiling, 531, "roll-taket har endret seg")
  }

  func testLandingCeilingNeverFires() {
    // Asymptoten er 52.8°; taket på 60° kan ikke nås. Dokumentert grense.
    for c in Fixture.flight() {
      XCTAssertLessThan(solve(c).landingRaw, Constants.landingMaximum, c.id)
    }
  }
}
