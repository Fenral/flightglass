import XCTest

@testable import FlightglassEngine

/// Modul 12 — studioContact (ENGINE-GAPS §7–9), mot alle 2500 studio-caser.
///
/// Forventning: bit-eksakt på alle tallfelt. `null`-feltene
/// (`groundCrossingTheta0`, `groundEntry`, `groundExit`) sammenlignes på
/// null-skap OG verdi.
final class StudioContactTests: XCTestCase {

  private func solve(_ c: FixtureCase) -> StudioContact.Result {
    guard let mode = c.inString("clubMode").flatMap(ClubMode.init(rawValue:)) else {
      fatalError("\(c.id): ukjent clubMode")
    }
    return StudioContact.solve(
      swingPlane: c.inDouble("swingPlane"),
      swingDirection: c.inDouble("swingDirection"),
      ballPositionCm: c.inDouble("ballPositionCm"),
      arcHeightCm: c.inDouble("arcHeightCm"),
      clubMode: mode)
  }

  private func outPoint(_ c: FixtureCase, _ key: String) -> StudioContact.Point? {
    guard let obj = c.outNested(key),
      let x = obj["x"]?.double, let y = obj["y"]?.double, let z = obj["z"]?.double
    else { return nil }
    return StudioContact.Point(x: x, y: y, z: z)
  }

  func testScalarFieldsAreBitExact() {
    let cases = Fixture.studio()
    var perField: [String: [Comparison]] = [:]

    for c in cases {
      let r = solve(c)
      var fields: [(String, Double)] = [
        ("contactHeight", r.contactHeight),
        ("faceCentreOffsetMm", r.faceCentreOffsetMm),
      ]
      if let contact = c.outNested("clubBallContact") {
        fields.append(("clubBallContact.clubZ", r.clubBallContact.clubZ))
        fields.append(("clubBallContact.offset", r.clubBallContact.offset))
        fields.append(("clubBallContact.offsetRatio", r.clubBallContact.offsetRatio))
        fields.append(("clubBallContact.theta", r.clubBallContact.theta))
        for (name, actual) in fields.suffix(4) {
          let key = String(name.dropFirst("clubBallContact.".count))
          guard let expected = contact[key]?.double else {
            XCTFail("\(c.id): fixturen mangler clubBallContact.\(key)")
            continue
          }
          perField[name, default: []].append(
            Comparison(id: c.id, field: name, expected: expected, actual: actual))
        }
      }
      for (name, actual) in fields.prefix(2) {
        guard let expected = c.outDouble(name) else {
          XCTFail("\(c.id): fixturen mangler \(name)")
          continue
        }
        perField[name, default: []].append(
          Comparison(id: c.id, field: name, expected: expected, actual: actual))
      }
    }

    for (field, comparisons) in perField.sorted(by: { $0.key < $1.key }) {
      assertField("studioContact/\(field)", comparisons, tolerance: .exact)
    }
  }

  func testGroundCrossingsMatchIncludingNullness() {
    var nullCount = 0
    var thetaComparisons: [Comparison] = []
    var pointComparisons: [Comparison] = []

    for c in Fixture.studio() {
      let r = solve(c)
      let fixtureTheta = c.outDouble("groundCrossingTheta0")

      if fixtureTheta == nil {
        nullCount += 1
        XCTAssertNil(r.groundCrossingTheta0, "\(c.id): porten ga theta der fixturen har null")
        XCTAssertNil(r.groundEntry, c.id)
        XCTAssertNil(r.groundExit, c.id)
        // Fixturen skal også ha null entry/exit her.
        XCTAssertTrue(c.out?["groundEntry"]?.isNull ?? false, c.id)
        XCTAssertTrue(c.out?["groundExit"]?.isNull ?? false, c.id)
        continue
      }

      guard let expected = fixtureTheta, let actual = r.groundCrossingTheta0 else {
        XCTFail("\(c.id): null-skap er usymmetrisk")
        continue
      }
      thetaComparisons.append(
        Comparison(id: c.id, field: "groundCrossingTheta0", expected: expected, actual: actual))

      for (key, actualPoint) in [("groundEntry", r.groundEntry), ("groundExit", r.groundExit)] {
        guard let expectedPoint = outPoint(c, key), let a = actualPoint else {
          XCTFail("\(c.id): \(key) mangler på en side")
          continue
        }
        for (axis, e, av) in [
          ("x", expectedPoint.x, a.x), ("y", expectedPoint.y, a.y), ("z", expectedPoint.z, a.z),
        ] {
          pointComparisons.append(
            Comparison(id: c.id, field: "\(key).\(axis)", expected: e, actual: av))
        }
      }
    }

    XCTAssertEqual(nullCount, 1375, "antall null-kryssinger har endret seg")
    assertField("studioContact/groundCrossingTheta0", thetaComparisons, tolerance: .exact)
    assertField("studioContact/groundEntryExit", pointComparisons, tolerance: .exact)
  }

  func testSharedGeometryHelpersMatchFixtureWorldFields() {
    // planeBasis og lowPointWorld eies av studio-geometry i `out`, men
    // hjelperne bor her (GAPS §8 trenger dem). Verifiser dem direkte.
    var comparisons: [Comparison] = []
    for c in Fixture.studio() {
      let planeRadians = StudioContact.swingPlaneRad(c.inDouble("swingPlane"))
      let yawRadians = StudioContact.planeYawRad(c.inDouble("swingDirection"))
      let basis = StudioContact.planeBasis(
        planeYawRadians: yawRadians, swingPlaneRadians: planeRadians)

      guard let pb = c.outNested("planeBasis"),
        let u = pb["u"]?.object, let m = pb["m"]?.object
      else {
        XCTFail("\(c.id): fixturen mangler planeBasis")
        continue
      }
      let pairs: [(String, Double?, Double)] = [
        ("u.x", u["x"]?.double, basis.u.x), ("u.y", u["y"]?.double, basis.u.y),
        ("u.z", u["z"]?.double, basis.u.z), ("m.x", m["x"]?.double, basis.m.x),
        ("m.y", m["y"]?.double, basis.m.y), ("m.z", m["z"]?.double, basis.m.z),
      ]
      for (name, expected, actual) in pairs {
        guard let e = expected else { continue }
        comparisons.append(
          Comparison(id: c.id, field: "planeBasis.\(name)", expected: e, actual: actual))
      }

      let xEff = StudioContact.effectiveLowPointX(
        lowPointXMetres: StudioContact.lowPointX(ballPositionCm: c.inDouble("ballPositionCm")),
        swingDirectionDeg: c.inDouble("swingDirection"),
        swingPlaneRadians: planeRadians)
      let theta = StudioContact.thetaAtImpact(effectiveLowPointXMetres: xEff)
      guard let mode = c.inString("clubMode").flatMap(ClubMode.init(rawValue:)) else { continue }
      let lp = StudioContact.lowPointWorld(
        effectiveLowPointXMetres: xEff,
        lowPointZMetres: StudioContact.lowPointZ(
          arcHeightCm: c.inDouble("arcHeightCm"), clubMode: mode),
        thetaRadians: theta,
        planeYawRadians: yawRadians,
        swingPlaneRadians: planeRadians)
      if let expected = outPoint(c, "lowPointWorld") {
        comparisons.append(
          Comparison(id: c.id, field: "lowPointWorld.x", expected: expected.x, actual: lp.x))
        comparisons.append(
          Comparison(id: c.id, field: "lowPointWorld.y", expected: expected.y, actual: lp.y))
        comparisons.append(
          Comparison(id: c.id, field: "lowPointWorld.z", expected: expected.z, actual: lp.z))
      }
    }
    assertField("studioContact/worldGeometry", comparisons, tolerance: .exact)
  }

  // ── Pinnede detaljer ─────────────────────────────────────────────────────

  func testGroundCrossingZIsRawFloatResidueNotZero() {
    // Punkt A: z er den rå flyttallsresten, ikke 0. Nulles den, ryker 1125
    // caser. Vakten: det må finnes caser der z faktisk er ulik 0.
    var nonZeroZ = 0
    for c in Fixture.studio() {
      guard let entry = outPoint(c, "groundEntry") else { continue }
      if entry.z != 0 { nonZeroZ += 1 }
    }
    XCTAssertGreaterThan(nonZeroZ, 0, "alle entry.z er 0 — punkt A-vakten er tannløs")
  }

  func testNaNGuardInGroundCrossingTheta0() {
    // BASELINE-FUNN [12]: sin φ = 0 og zLP = 0 gir c = NaN; vakten skal gi
    // nil, ikke NaN. Utenfor fixturen — testes direkte.
    XCTAssertNil(
      StudioContact.groundCrossingTheta0(lowPointZMetres: 0, swingPlaneRadians: 0),
      "NaN-vakten mangler — acos(NaN) ville havnet i et offentlig felt")
    // Og en vanlig positiv zLP med sin φ = 0: c = +inf → nil.
    XCTAssertNil(
      StudioContact.groundCrossingTheta0(lowPointZMetres: 0.05, swingPlaneRadians: 0))
  }

  func testDriverGetsNoLiftCorrectionInClubBallContact() {
    // Punkt B: offset bruker 0.0213 uten driverløft. Hvis noen «retter» det,
    // vil offset for driver flytte seg med 30 mm og denne ryker.
    for c in Fixture.studio().prefix(200) {
      let r = solve(c)
      XCTAssertEqual(
        r.clubBallContact.offset, r.contactHeight - Constants.studioBallRadius, c.id)
    }
  }

  func testOffsetRatioIsTheDivisionForm() {
    // Punkt 6: `(clubZ − r) / r`, ikke `clubZ/r − 1`. Vakten: formene må
    // divergere et sted i fixturens domene.
    var divergences = 0
    for c in Fixture.studio() {
      let clubZ = solve(c).contactHeight
      let divisionForm: Double = (clubZ - Constants.studioBallRadius) / Constants.studioBallRadius
      let subtractForm: Double = clubZ / Constants.studioBallRadius - 1
      if divisionForm != subtractForm { divergences += 1 }
    }
    XCTAssertGreaterThan(divergences, 0, "offsetRatio-vakten er tannløs")
  }

  func testFaceCentreOffsetReachesTheKnownAbsurdDriverValue() {
    // FUNN F7: −121 mm på en ~60 mm flate. Selvmotsigelsen er pinnet — den
    // skal være der til D74 sin v2-modell overtar den flaten.
    var minOffset = 0.0
    for c in Fixture.studio() where c.inString("clubMode") == "driver" {
      let v = solve(c).faceCentreOffsetMm
      if v < minOffset { minOffset = v }
    }
    XCTAssertLessThan(minOffset, -100, "driver-absurditeten er borte — har noen «fikset» F7?")
  }
}
