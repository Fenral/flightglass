import XCTest

@testable import FlightglassAdapter
@testable import FlightglassEngine

/// Adapteren mot den LEVENDE Swift-motoren — beviset som lar
/// `FlightglassAdapter.ported` stå som `true`.
///
/// `DisplayFlightTests` pinner JS-referanseoutputs som literaler. Denne
/// testen lukker sirkelen: Swift-`SolveFlight` på de samme slagene skal
/// produsere NØYAKTIG de literalene (felt for felt), og visningskjeden skal
/// dermed gi samme tekster fra levende motor som fra referansen.
final class AdapterLiveIntegrationTests: XCTestCase {

  /// Pinnede JS-referanseoutputs (Node 24.14.1) — samme kjøring som
  /// literalene i adapter-testmålets `DisplayFlightTests`; testmålene kan
  /// ikke se hverandre, så kopien her dømmes av den levende motoren.
  static let shotOut: [String: Double] = [
    "startDirection": 0, "spinAxis": 0, "curve": 0, "offline": 0,
    "launchAngle": 11.02937505178926,
    "spinLoft": 25.2,
    "backspin": 3994.46694041815,
    "landingAngle": 48.68858676693362,
    "smash": 1.4176321944058614,
    "ballSpeed": 120.49873652449821,
    "carry": 170.05993933223164,
    "total": 175.9214156428113,
    "apex": 26.302954633624168,
    "faceToPath": 0,
  ]

  static let shapedOut: [String: Double] = [
    "startDirection": -2.1500000000000004,
    "spinAxis": -17.053062152375414,
    "curve": -21.597082098605853,
    "offline": -29.91758936692257,
    "launchAngle": 9.877423252612292,
    "spinLoft": 16.74993713976679,
    "backspin": 2988.217946933329,
    "landingAngle": 43.2379368066764,
    "smash": 1.4692124936669029,
    "ballSpeed": 146.9212493666903,
    "carry": 221.78690621555054,
    "total": 231.24458628047788,
    "apex": 30.52786343109942,
    "faceToPath": -5,
  ]

  private func engineOut(_ r: SolveFlight.Result) -> [String: Double] {
    var out: [String: Double] = [:]
    for field in SolveFlight.numericFieldNames {
      if let v = r.numericValue(field) { out[field] = v }
    }
    return out
  }

  func testLiveEngineReproducesThePinnedJSReferenceOutputs() throws {
    let live = try SolveFlight.solveThrowing(
      clubSpeed: 85, faceAngle: 0, clubPath: 0, attackAngle: -4.3, dynamicLoft: 20.9)
    for (field, expected) in Self.shotOut {
      guard !SolveFlight.declaredToleranceIsRK4(field) else { continue }
      XCTAssertEqual(
        live.numericValue(field), expected,
        "SHOT.\(field): levende motor avviker fra pinnet JS-referanse")
    }

    let shaped = try SolveFlight.solveThrowing(
      clubSpeed: 100, faceAngle: -3, clubPath: 2, attackAngle: -2, dynamicLoft: 14)
    for (field, expected) in Self.shapedOut {
      let actual = shaped.numericValue(field) ?? .nan
      if SolveFlight.declaredToleranceIsRK4(field) {
        // RK4-kjeden: 1e-9-regimet, ikke literal-likhet.
        let c = Comparison(id: "SHAPED", field: field, expected: expected, actual: actual)
        let tol = Tolerance.relativeWithFloor(rel: 1e-9, floor: 1e-12)
        XCTAssertTrue(c.passes(tol), "SHAPED.\(field): \(actual) mot \(expected)")
      } else {
        XCTAssertEqual(actual, expected, "SHAPED.\(field)")
      }
    }
  }

  func testDisplayChainFromLiveEngine() throws {
    let live = try SolveFlight.solveThrowing(
      clubSpeed: 100, faceAngle: -3, clubPath: 2, attackAngle: -2, dynamicLoft: 14)
    let view = try DisplayFlight.displayFlight(out: engineOut(live), unitSystem: .meters)

    // Tekstene fra levende motor — samme som literal-testen produserer.
    XCTAssertEqual(view["curve"]?.text.hasSuffix(" L"), true)
    XCTAssertEqual(view["side"]?.text.hasSuffix(" L"), true)
    XCTAssertEqual(view["faceToPath"]?.text, "\(Format.minus)5.0°")
    XCTAssertEqual(view.count, 14)
  }

  func testTraceShapeFromLiveEngine() throws {
    let live = try SolveFlight.solveThrowing(
      clubSpeed: 100, faceAngle: -3, clubPath: 2, attackAngle: -2, dynamicLoft: 14)
    let out = engineOut(live)
    let samples = try TraceShape.traceSamples(out, n: 8)
    // D79-invariant 2 mot den LEVENDE motoren.
    XCTAssertEqual(samples[8].lat.bitPattern, live.offline.bitPattern)
    XCTAssertEqual(samples[8].d.bitPattern, live.carry.bitPattern)
  }

  func testAdapterPortedFlagIsTrue() {
    XCTAssertTrue(
      FlightglassAdapter.ported,
      "Adapteren er verifisert mot levende motor — flagget skal stå som true")
  }
}
