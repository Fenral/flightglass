import XCTest

@testable import FlightglassAdapter
@testable import FlightglassEngine

/// Adapter modul 2 — Convert, portert fra `adapter/test/convert.test.js`.
final class ConvertTests: XCTestCase {

  func testYardsPassThroughUntouched() throws {
    let r = try Convert.distanceForDisplay(yards: 189.8, unitSystem: .yards)
    XCTAssertEqual(r.value, 189.8)
    XCTAssertEqual(r.unit, "yd")
  }

  func testMetersUseTheEngineConstantExactly() throws {
    let r = try Convert.distanceForDisplay(yards: 100, unitSystem: .meters)
    XCTAssertEqual(r.value, 100 * Constants.yardToMetre)
    XCTAssertEqual(r.value, 91.44)
    XCTAssertEqual(r.unit, "m")
  }

  func testConversionIsUnrounded() throws {
    // D28: avrunding skjer i formatlaget, ETTER konvertering.
    let r = try Convert.distanceForDisplay(yards: 173.456789, unitSystem: .meters)
    XCTAssertEqual(r.value, 173.456789 * Constants.yardToMetre, "verdi er rundet")
  }

  func testSpeedIsAlwaysMph() throws {
    let r = try Convert.speedForDisplay(mph: 130.6)
    XCTAssertEqual(r.value, 130.6)
    XCTAssertEqual(r.unit, "mph")
  }

  func testNonFiniteThrows() {
    for bad in [Double.nan, .infinity, -.infinity] {
      XCTAssertThrowsError(
        try Convert.distanceForDisplay(yards: bad, unitSystem: .meters))
      XCTAssertThrowsError(try Convert.speedForDisplay(mph: bad))
    }
  }

  func testExactlyTwoUnitSystems() {
    // D57: `meters` og `yards`, ingen tredje.
    XCTAssertEqual(Convert.UnitSystem.allCases.count, 2)
    XCTAssertEqual(
      Set(Convert.UnitSystem.allCases.map(\.rawValue)), ["meters", "yards"])
  }

  func testNegativeValuesConvertWithSignIntact() throws {
    // Sideveis avstander er signerte; konverteringen skal ikke røre fortegnet.
    let r = try Convert.distanceForDisplay(yards: -17.78, unitSystem: .meters)
    XCTAssertEqual(r.value, -17.78 * Constants.yardToMetre)
    XCTAssertLessThan(r.value, 0)
  }
}
