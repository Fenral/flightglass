import XCTest

@testable import FlightglassAdapter
@testable import FlightglassEngine

/// Adapter modul 1 — Format, portert fra `adapter/test/format.test.js`.
/// DESIGN.md-eksemplene testes ordrett; endres et eksempel der, skal denne
/// feile — det er meningen.
final class FormatTests: XCTestCase {

  let MINUS = Format.minus
  let THIN = Format.thinSpace

  func testTypographicCharacters() {
    XCTAssertEqual(MINUS.unicodeScalars.first?.value, 0x2212)
    XCTAssertEqual(THIN.unicodeScalars.first?.value, 0x2009)
  }

  func testDesignMdExamplesVerbatim() throws {
    // «Tallformatering»-tabellen
    XCTAssertEqual(try Format.angle(16.3), "16.3°")
    XCTAssertEqual(try Format.distance(173.5, unit: "m"), "173.5 m")
    XCTAssertEqual(try Format.spin(3173), "3\(THIN)173 rpm")
    XCTAssertEqual(try Format.speed(130.6), "130.6 mph")
    XCTAssertEqual(try Format.smash(1.451), "1.451")
    XCTAssertEqual(try Format.angle(-6.0, signed: true), "\(MINUS)6.0°")
    // «Fortegn og retning»-tabellen
    XCTAssertEqual(try Format.lateral(-16.3, unit: "m"), "16.3 m L")
    XCTAssertEqual(try Format.lateral(4.1, unit: "m"), "4.1 m R")
    XCTAssertEqual(try Format.lateral(0, unit: "m"), "0.0 m C")
    XCTAssertEqual(try Format.angle(-16.3, signed: true), "\(MINUS)16.3°")
    XCTAssertEqual(try Format.angle(5.0, signed: true), "+5.0°")
    XCTAssertEqual(try Format.angle(14.5), "14.5°")
  }

  func testEngineRawValueFromDesignMdProse() throws {
    XCTAssertEqual(
      try Format.angle(-16.26454982658155, signed: true), "\(MINUS)16.3°")
  }

  func testSignDecidedAfterRounding_neverMinusZero() throws {
    XCTAssertEqual(try Format.angle(-0.04, signed: true), "0.0°")
    XCTAssertEqual(try Format.angle(-0.04), "0.0°")
    XCTAssertEqual(try Format.angle(0, signed: true), "0.0°")
    XCTAssertEqual(try Format.distance(-0.04, unit: "m"), "0.0 m")
    XCTAssertEqual(try Format.smash(-0.0001), "0.000")
    // ...men −0.06 runder til 0.1 og bærer fortegn/bokstav
    XCTAssertEqual(try Format.angle(-0.06, signed: true), "\(MINUS)0.1°")
  }

  func testLetterDecidedAfterRounding() throws {
    XCTAssertEqual(try Format.lateral(-0.03, unit: "m"), "0.0 m C")
    XCTAssertEqual(try Format.lateral(-0.06, unit: "m"), "0.1 m L")
    XCTAssertEqual(try Format.lateral(0.06, unit: "yd"), "0.1 yd R")
  }

  func testD29_noValueCarriesBothSignAndLetter() throws {
    for v in [-312.4, -16.3, -0.04, 0, 0.9, 4.1, 88.25] {
      for unit in ["m", "yd"] {
        let text = try Format.lateral(v, unit: unit)
        XCTAssertFalse(text.contains(MINUS), "«\(text)» bærer fortegn")
        XCTAssertFalse(text.contains("+"), "«\(text)» bærer fortegn")
        XCTAssertFalse(text.contains("-"), "«\(text)» bærer bindestrek")
        XCTAssertTrue(
          text.hasSuffix(" L") || text.hasSuffix(" R") || text.hasSuffix(" C"),
          "«\(text)» mangler bokstav")
      }
      let angle = try Format.angle(v, signed: true)
      XCTAssertFalse(
        angle.hasSuffix(" L") || angle.hasSuffix(" R") || angle.hasSuffix(" C"),
        "«\(angle)» bærer bokstav")
    }
  }

  func testAsciiHyphenNeverAppears() throws {
    let texts = [
      try Format.angle(-16.3, signed: true),
      try Format.distance(-5.2, unit: "m"),
      try Format.spin(-500),
      try Format.smash(-1.2),
      try Format.speed(-3),
    ]
    for text in texts {
      XCTAssertFalse(text.contains("-"), "«\(text)» inneholder ASCII-bindestrek")
      XCTAssertTrue(text.contains(MINUS), "«\(text)» mangler U+2212")
    }
  }

  func testSpinGroupingInAllMagnitudes() throws {
    XCTAssertEqual(try Format.spin(0), "0 rpm")
    XCTAssertEqual(try Format.spin(842), "842 rpm")
    XCTAssertEqual(try Format.spin(3994.46694041815), "3\(THIN)994 rpm")
    XCTAssertEqual(try Format.spin(11764), "11\(THIN)764 rpm")
    XCTAssertEqual(try Format.spin(1_234_567), "1\(THIN)234\(THIN)567 rpm")
    XCTAssertFalse(try Format.spin(12345).contains(","))
    XCTAssertFalse(try Format.spin(12345).contains("."))
  }

  func testDecimalsPerMetric() throws {
    XCTAssertEqual(try Format.angle(12.25304, signed: true), "+12.3°")
    XCTAssertEqual(try Format.distance(164.94123, unit: "m"), "164.9 m")
    XCTAssertEqual(try Format.smash(1.4507777), "1.451")
    XCTAssertEqual(try Format.speed(123.19312284372836), "123.2 mph")
  }

  func testNonFiniteThrowsEverywhere() {
    for bad in [Double.nan, .infinity, -.infinity] {
      XCTAssertThrowsError(try Format.angle(bad))
      XCTAssertThrowsError(try Format.distance(bad, unit: "m"))
      XCTAssertThrowsError(try Format.lateral(bad, unit: "m"))
      XCTAssertThrowsError(try Format.spin(bad))
      XCTAssertThrowsError(try Format.smash(bad))
      XCTAssertThrowsError(try Format.speed(bad))
    }
  }

  // ── toFixed-semantikken — Swift-portens egne vakter ──────────────────────

  func testToFixedIsHalfUpOnExactExpansionNotPrintfHalfEven() {
    // Målt i Node 24.14.1. printf("%.1f", 0.25) gir "0.2" — toFixed "0.3".
    XCTAssertEqual(JSNumber.toFixedAbs(0.25, 1), "0.3")
    // 1.005 er egentlig 1.00499999…, så toFixed gir "1.00" — IKKE "1.01".
    XCTAssertEqual(JSNumber.toFixedAbs(1.005, 2), "1.00")
    XCTAssertEqual(JSNumber.toFixedAbs(2.675, 2), "2.67")
    XCTAssertEqual(JSNumber.toFixedAbs(1.4375, 3), "1.438")
  }

  func testToFixedMatchesNodeOnMeasuredHalfwayLookingValues() {
    // Alle målt i Node 24.14.1 — ikke resonnert fram. Utfallet avhenger av
    // hvilken side av desimal-midtpunktet doublen faktisk ligger på:
    XCTAssertEqual(JSNumber.toFixedAbs(0.95, 1), "0.9")  // 0.9499999999999999556… under
    XCTAssertEqual(JSNumber.toFixedAbs(0.05, 1), "0.1")  // 0.05000000000000000277… over
    XCTAssertEqual(JSNumber.toFixedAbs(0.15, 1), "0.1")  // under
    XCTAssertEqual(JSNumber.toFixedAbs(0.35, 1), "0.3")  // under
    XCTAssertEqual(JSNumber.toFixedAbs(0.45, 1), "0.5")  // over
  }

  func testToFixedCarryPropagation() {
    XCTAssertEqual(JSNumber.toFixedAbs(9.96, 1), "10.0")
    XCTAssertEqual(JSNumber.toFixedAbs(99.95001, 1), "100.0")
    XCTAssertEqual(JSNumber.toFixedAbs(0.999, 2), "1.00")
  }
}
