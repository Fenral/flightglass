import XCTest

@testable import FlightglassEngine

/// Modul 1 — konstantene, verifisert bit for bit mot fixturen.
///
/// Portert fra `engine/test/_fixture.test.js`. Denne testen er fundamentet:
/// feiler den, har noen endret en konstant eller en rekkefølge — ikke fysikken.
///
/// Den er også porten sin **tallpresisjonsvakt**. Leseren må hente binary64 ut
/// av fixturen uten å miste en eneste bit; klarer den ikke det, er hver eneste
/// fysikktest under verdiløs. Se `JSONPrecisionTests` for hvorfor
/// `JSONSerialization` ikke kunne brukes.
final class ConstantsTests: XCTestCase {

  // ── Fixturen som presisjonsvakt ──────────────────────────────────────────

  func testFixtureCaseCountsMatchMeta() {
    let counts = Fixture.flightMeta()["counts"]?.object ?? [:]
    XCTAssertEqual(counts["returned"]?.int, 5028, "flight: returned")
    XCTAssertEqual(counts["threw"]?.int, 1, "flight: threw")
    XCTAssertEqual(Fixture.flight().count, 5028)
    XCTAssertEqual(Fixture.flightErrors().count, 1)

    let studioCounts = Fixture.studioMeta()["counts"]?.object ?? [:]
    XCTAssertEqual(studioCounts["total"]?.int, 2500, "studio: total")
    XCTAssertEqual(Fixture.studio().count, 2500)
    XCTAssertEqual(Fixture.studioErrors().count, 0)
  }

  func testFixtureContainsNoNonFiniteNumbers() {
    var checked = 0
    for c in Fixture.flight().prefix(200) {
      for (_, value) in c.out ?? [:] {
        guard let d = value.double else { continue }
        XCTAssertTrue(d.isFinite, "\(c.id): ikke-endelig tall")
        checked += 1
      }
    }
    XCTAssertGreaterThan(checked, 1000, "for få tall inspisert til å bety noe")
  }

  // ── Flight-konstanter mot `out` ──────────────────────────────────────────

  func testFlightConstantsAreBitIdenticalToFixture() {
    let cases = Fixture.flight()
    let sample = cases[0]

    let pairs: [(String, Double)] = [
      ("launchIntercept", Constants.launchIntercept),
      ("launchLoftW", Constants.launchLoftW),
      ("launchLoftQuadratic", Constants.launchLoftQuadratic),
      ("launchAttackW", Constants.launchAttackW),
      ("smashModelIntercept", Constants.smashModelIntercept),
      ("smashSpinLoftLinear", Constants.smashSpinLoftLinear),
      ("smashSpinLoftQuadratic", Constants.smashSpinLoftQuadratic),
      ("smashMinimum", Constants.smashMinimum),
      ("smashMaximum", Constants.smashMaximum),
      ("spinCalibrationLow", Constants.spinCalibrationLow),
      ("spinCalibrationRange", Constants.spinCalibrationRange),
      ("spinCalibrationMidpointDeg", Constants.spinCalibrationMidpointDeg),
      ("spinCalibrationWidthDeg", Constants.spinCalibrationWidthDeg),
      ("maxTotalSpinRpm", Constants.maxTotalSpinRpm),
      ("carryBallSpeedLinear", Constants.carryBallSpeedLinear),
      ("carryBallSpeedQuadratic", Constants.carryBallSpeedQuadratic),
      ("carryFullLaunchAtDeg", Constants.carryFullLaunchAtDeg),
      ("apexBasePerBallSpeed", Constants.apexBasePerBallSpeed),
      ("apexLaunchPerBallSpeedDeg", Constants.apexLaunchPerBallSpeedDeg),
      ("landingBase", Constants.landingBase),
      ("landingSpinLoftTau", Constants.landingSpinLoftTau),
      (
        "curveCarryProjectionMinimumDownrangeM",
        Constants.curveCarryProjectionMinimumDownrangeM
      ),
    ]

    var comparisons: [Comparison] = []
    for (field, ours) in pairs {
      guard let theirs = sample.outDouble(field) else {
        XCTFail("fixturen mangler feltet \(field)")
        continue
      }
      comparisons.append(
        Comparison(id: sample.id, field: field, expected: theirs, actual: ours))
    }

    assertField("constants/flight", comparisons, tolerance: .exact)

    // Konstantene skal være de samme i ALLE caser, ikke bare den første.
    for c in cases {
      XCTAssertEqual(
        c.outDouble("landingBase"), Constants.landingBase,
        "\(c.id): landingBase driver mellom caser")
    }
  }

  func testAeroModelConstantsAreBitIdenticalToFixture() {
    let sample = Fixture.flight()[0]
    guard let aero = sample.outNested("aeroModel") else {
      return XCTFail("fixturen mangler aeroModel")
    }

    XCTAssertEqual(aero["dragCompatibilityScale"]?.double, Constants.dragCompatibilityScale)
    XCTAssertEqual(
      aero["referenceAnchorDragScale"]?.double, Constants.referenceAnchorDragScale)
    XCTAssertEqual(aero["integrationStepSeconds"]?.double, Constants.rk4Step)
    XCTAssertEqual(aero["spinDecayPerSecond"]?.double, Constants.spinDecay)

    let identity = Constants.aeroModelIdentity
    XCTAssertEqual(aero["coefficientSetId"]?.string, identity.coefficientSetId)
    XCTAssertEqual(aero["baseCoefficientSetId"]?.string, identity.baseCoefficientSetId)
    XCTAssertEqual(aero["class"]?.string, identity.className)
    XCTAssertEqual(aero["exactNamedBall"]?.bool, identity.exactNamedBall)
    XCTAssertEqual(aero["disclosure"]?.string, identity.disclosure)
  }

  func testAeroDiagnosticsValidityRangesMatchFixture() {
    let sample = Fixture.flight()[0]
    guard let diag = sample.outNested("aerodynamicDiagnostics") else {
      return XCTFail("fixturen mangler aerodynamicDiagnostics")
    }

    func array(_ key: String) -> [Double] {
      diag[key]?.array?.compactMap { $0.double } ?? []
    }

    XCTAssertEqual(array("reynoldsValidity"), Constants.reynoldsValidity)
    XCTAssertEqual(array("spinParameterValidity"), Constants.spinParameterValidity)
    XCTAssertEqual(
      diag["reverseMagnusPolicy"]?.string,
      Constants.aeroModelIdentity.reverseMagnusPolicy)
    XCTAssertEqual(
      diag["validityKnown"]?.bool, Constants.aeroModelIdentity.validityKnown)
  }

  // ── Studio-konstanter mot `_meta.constants` ──────────────────────────────

  func testStudioConstantsAreBitIdenticalToFixture() {
    guard let k = Fixture.studioMeta()["constants"]?.object else {
      return XCTFail("studio-fixturen mangler _meta.constants")
    }

    XCTAssertEqual(k["radiusM"]?.double, Constants.studioRadius)
    XCTAssertEqual(k["ballRadiusM"]?.double, Constants.studioBallRadius)
    XCTAssertEqual(k["samples"]?.int, Constants.studioSamples)
    XCTAssertEqual(k["sweepDeg"]?.double, Constants.studioSweepDeg)
    XCTAssertEqual(k["sweepRad"]?.double, Constants.studioSweepRad)
    XCTAssertEqual(k["planeDefaultDeg"]?.double, Constants.studioPlaneDefaultDeg)
    XCTAssertEqual(k["lowPointAheadMinM"]?.double, Constants.lowPointAheadMinM)
    XCTAssertEqual(k["lowPointAheadMaxM"]?.double, Constants.lowPointAheadMaxM)
    XCTAssertEqual(k["lowPointIdealM"]?.double, Constants.lowPointIdealM)
    XCTAssertEqual(k["driverBallLiftM"]?.double, Constants.driverBallLiftM)

    let arcZ0 = k["arcZ0Cm"]?.object ?? [:]
    XCTAssertEqual(arcZ0["iron"]?.double, Constants.arcZ0Cm(.iron))
    XCTAssertEqual(arcZ0["driver"]?.double, Constants.arcZ0Cm(.driver))

    let sweet = k["sweetSpotAboveSoleM"]?.object ?? [:]
    XCTAssertEqual(sweet["iron"]?.double, Constants.sweetSpotAboveSoleM(.iron))
    XCTAssertEqual(sweet["driver"]?.double, Constants.sweetSpotAboveSoleM(.driver))
  }

  // ── De tre ULP-konvensjonene ─────────────────────────────────────────────

  func testStudioSweepRadUsesTheStudioGrouping() {
    // `(48 * π) / 180`, IKKE `48 * degToRad`. Én ULP skiller dem.
    let studioGrouping = (Constants.studioSweepDeg * Double.pi) / 180
    let flightGrouping = Constants.studioSweepDeg * Constants.degToRad

    XCTAssertEqual(
      Constants.studioSweepRad, studioGrouping,
      "studioSweepRad må være studio-grupperingen")
    XCTAssertEqual(
      Constants.studioSweepRad, Angles.studioDegToRad(Constants.studioSweepDeg))

    // Vakten: er de to grupperingene like på denne plattformen, beviser testen
    // over ingenting, og fellen kan snike seg inn ubemerket.
    XCTAssertNotEqual(
      studioGrouping, flightGrouping,
      """
      De to grad-til-radian-grupperingene gir samme tall for 48°. \
      Da er denne testen tannløs og ULP-fellen usynlig — undersøk før du \
      går videre.
      """)
  }

  func testCentimetreConversionDividesAndNeverMultiplies() {
    XCTAssertEqual(Constants.cmPerMetre, 100.0)

    var divergences = 0
    for step in -500...500 {
      let cm = Double(step) / 10
      let divided: Double = cm / Constants.cmPerMetre
      let multiplied: Double = cm * 0.01
      if divided != multiplied { divergences += 1 }
    }
    XCTAssertGreaterThan(
      divergences, 0,
      "divisjon og multiplikasjon med 0.01 er aldri ulike her — sjekk testen")
  }

  func testTheTwoConstantsLevelBallRadiiAreDistinctOnPurpose() {
    // Flight 0.021335 · studio-arven 0.0213. Den TREDJE radiusen (0.021336,
    // kontaktmodell v2) bor i `ContactModel` og pinnes av `ContactModelTests`
    // når den modulen porteres.
    XCTAssertEqual(Constants.ballRadius, 0.021335)
    XCTAssertEqual(Constants.studioBallRadius, 0.0213)
    XCTAssertNotEqual(
      Constants.ballRadius, Constants.studioBallRadius,
      "flight- og studio-radius er slått sammen — de er pinnet hver for seg")
  }

  func testLegacySweetSpotStillCancelsAgainstStudioBallRadius() {
    // F11: jernets `sweetSpotAboveSoleM` ER tallidentisk med
    // `studioBallRadius`, og de to kansellerer hverandre i arvemodellens
    // `faceCentreOffsetMm`. Det er en KJENT feil som er pinnet i den gamle
    // studiostien — ikke noe som skal ryddes bort her.
    XCTAssertEqual(
      Constants.sweetSpotAboveSoleM(.iron), Constants.studioBallRadius,
      "F11-kanselleringen i arvemodellen er borte — den skal være der")
  }
}
