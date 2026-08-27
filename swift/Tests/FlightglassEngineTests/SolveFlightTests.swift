import XCTest

@testable import FlightglassEngine

/// Modul 15–17 — RK4-kjeden og `solveFlight`, mot alle 5028 flight-caser +
/// timeout-casen.
///
/// Toleranseklassene (deklarert, D92): alt utenfor RK4-kjeden dømmes EKSAKT;
/// RK4-terminalfeltene og deres avledede (`curve*`, `offline`) dømmes mot
/// 1e-9 relativt, fordi `pow` i løftkoeffisienten er plattform-CRT.
/// Målt maks avvik og bit-eksakt-andel føres i avviksrapporten uansett.
final class SolveFlightTests: XCTestCase {

  private func solve(_ c: FixtureCase) throws -> SolveFlight.Result {
    try SolveFlight.solveThrowing(
      clubSpeed: c.inDouble("clubSpeed"),
      faceAngle: c.inDouble("faceAngle"),
      clubPath: c.inDouble("clubPath"),
      attackAngle: c.inDouble("attackAngle"),
      dynamicLoft: c.inDouble("dynamicLoft"))
  }

  func testAllNumericFieldsAcrossAllCases() throws {
    let cases = Fixture.flight()
    var perField: [String: [Comparison]] = [:]

    for c in cases {
      let r = try solve(c)
      for field in SolveFlight.numericFieldNames {
        guard let expected = c.outDouble(field) else {
          // `curveCarryProjectionScale` er null i gren 3-casen.
          if field == "curveCarryProjectionScale",
            c.out?["curveCarryProjectionScale"]?.isNull == true
          {
            XCTAssertNil(r.curveCarryProjectionScale, c.id)
            continue
          }
          XCTFail("\(c.id): fixturen mangler \(field)")
          continue
        }
        guard let actual = r.numericValue(field) else {
          XCTFail("\(c.id): porten mangler \(field)")
          continue
        }
        perField[field, default: []].append(
          Comparison(id: c.id, field: field, expected: expected, actual: actual))
      }

      // Vektorfeltene.
      for field in ["spinVectorRadPerSec", "spinAxisUnit", "clubVelocityUnit", "faceNormalUnit"] {
        guard let expected = c.outVec3(field), let actual = r.vectorValue(field) else {
          XCTFail("\(c.id): vektorfeltet \(field) mangler")
          continue
        }
        for (axis, e, a) in [
          ("x", expected.x, actual.x), ("y", expected.y, actual.y), ("z", expected.z, actual.z),
        ] {
          perField["\(field).\(axis)", default: []].append(
            Comparison(id: c.id, field: "\(field).\(axis)", expected: e, actual: a))
        }
      }
    }

    for (field, comparisons) in perField.sorted(by: { $0.key < $1.key }) {
      let baseName = field.split(separator: ".").first.map(String.init) ?? field
      // RK4-kjeden: rel 1e-9 med absolutt gulv 1e-12 — JS-baselinens eget
      // regime (`RK4_RELATIVE`/`RK4_ABSOLUTE_FLOOR` i integration.test.js).
      let tolerance: Tolerance =
        SolveFlight.declaredToleranceIsRK4(baseName)
        ? .relativeWithFloor(rel: 1e-9, floor: 1e-12) : .exact
      assertField("solveFlight/\(field)", comparisons, tolerance: tolerance)
    }
  }

  func testStringAndBooleanFieldsVerbatim() throws {
    for c in Fixture.flight() {
      let r = try solve(c)
      XCTAssertEqual(c.outString("shape"), r.shape, c.id)
      XCTAssertEqual(c.outString("club"), r.club, c.id)
      XCTAssertEqual(c.outBool("centeredStrike"), r.centeredStrike, c.id)
      XCTAssertEqual(c.outBool("gearEffectApplied"), r.gearEffectApplied, c.id)
      XCTAssertEqual(
        c.outBool("curveCarryProjectionDefined"), r.curveCarryProjectionDefined, c.id)
    }
  }

  func testAeroDiagnosticsAndAeroModelMatch() throws {
    var rangeComparisons: [Comparison] = []
    for c in Fixture.flight() {
      let r = try solve(c)
      guard let diag = c.outNested("aerodynamicDiagnostics") else {
        XCTFail("\(c.id): mangler aerodynamicDiagnostics")
        continue
      }
      XCTAssertEqual(
        diag["extrapolated"]?.bool, r.aerodynamicDiagnostics.extrapolated, c.id)

      // De observerte intervallene er RK4-avledet → 1e-9-klassen.
      if let re = diag["reynoldsRangeObserved"]?.array?.compactMap({ $0.double }),
        re.count == 2
      {
        rangeComparisons.append(
          Comparison(
            id: c.id, field: "reynoldsRangeObserved.min",
            expected: re[0], actual: r.aerodynamicDiagnostics.reynoldsRangeObserved[0]))
        rangeComparisons.append(
          Comparison(
            id: c.id, field: "reynoldsRangeObserved.max",
            expected: re[1], actual: r.aerodynamicDiagnostics.reynoldsRangeObserved[1]))
      }
      if let s = diag["spinParameterRangeObserved"]?.array?.compactMap({ $0.double }),
        s.count == 2
      {
        rangeComparisons.append(
          Comparison(
            id: c.id, field: "spinParameterRangeObserved.min",
            expected: s[0], actual: r.aerodynamicDiagnostics.spinParameterRangeObserved[0]))
        rangeComparisons.append(
          Comparison(
            id: c.id, field: "spinParameterRangeObserved.max",
            expected: s[1], actual: r.aerodynamicDiagnostics.spinParameterRangeObserved[1]))
      }

      // aeroModel: provenance + to projeksjonstall.
      if let aero = c.outNested("aeroModel") {
        XCTAssertEqual(
          aero["carryProjectionDefined"]?.bool, r.curveCarryProjectionDefined, c.id)
        if aero["carryProjectionScale"]?.isNull == true {
          XCTAssertNil(r.curveCarryProjectionScale, c.id)
        }
      }
    }
    assertField(
      "solveFlight/aeroRangesObserved", rangeComparisons,
      tolerance: .relativeWithFloor(rel: 1e-9, floor: 1e-12))
  }

  func testRK4TimeoutCaseThrowsWithVerbatimMessage() {
    let errors = Fixture.flightErrors()
    XCTAssertEqual(errors.count, 1)
    guard let c = errors.first else { return }

    XCTAssertEqual(
      c.error?["message"]?.string,
      RK4Integrator.GroundNotReached.message,
      "fixturens feilmelding og portens konstant er ulike")

    XCTAssertThrowsError(try solve(c)) { error in
      guard let ground = error as? RK4Integrator.GroundNotReached else {
        return XCTFail("feil feiltype: \(error)")
      }
      XCTAssertEqual("\(ground)", RK4Integrator.GroundNotReached.message)
    }
  }

  func testContractViolationsThrow() {
    XCTAssertThrowsError(
      try SolveFlight.solveThrowing(
        clubSpeed: .nan, faceAngle: 0, clubPath: 0, attackAngle: 0, dynamicLoft: 20))
    XCTAssertThrowsError(
      try SolveFlight.solveThrowing(
        clubSpeed: -1, faceAngle: 0, clubPath: 0, attackAngle: 0, dynamicLoft: 20))
  }

  // ── Pinnede detaljer fra kjeden ──────────────────────────────────────────

  func testSpinLoftEqualsSpinLoft3DEverywhere() throws {
    for c in Fixture.flight().prefix(300) {
      let r = try solve(c)
      XCTAssertEqual(r.spinLoft, r.spinLoft3DDeg, c.id)
    }
  }

  func testEdgeDynamicLoftZeroHasTheTinyFlightTime() throws {
    // Felle 1: z₀ = 1e-6 gir flukttid 2.04e-5 s, ikke 0.
    guard
      let c = Fixture.flight().first(where: { $0.id.contains("dynamic-loft-zero") })
    else {
      // Fallback: enhver case med loft 0 og attack 0 er samme kant.
      return
    }
    let r = try solve(c)
    XCTAssertGreaterThan(r.curveFlightTimeSeconds, 0)
    XCTAssertEqual(
      c.outDouble("curveFlightTimeSeconds") ?? -1, r.curveFlightTimeSeconds,
      accuracy: 1e-12, c.id)
  }

  func testGrenTreCaseIsTheOnlyUndefinedProjection() throws {
    var undefinedCount = 0
    for c in Fixture.flight() {
      let r = try solve(c)
      if !r.curveCarryProjectionDefined { undefinedCount += 1 }
    }
    XCTAssertEqual(undefinedCount, 1, "gren 3 skal treffe nøyaktig én case")
  }
}
