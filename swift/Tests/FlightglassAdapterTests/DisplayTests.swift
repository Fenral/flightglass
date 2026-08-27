import XCTest

@testable import FlightglassAdapter
@testable import FlightglassEngine

/// Adapter modul 3–4 — DisplayFlight og DisplayStudio.
///
/// JS-testene kjører mot den ekte motoren. Swift-`SolveFlight` venter på Å2
/// (pow), så referanseoutputene er generert fra JS-motoren (D71) og pinnet
/// som literaler under — samme integrasjonsbevis, referansen som kilde.
/// Når `SolveFlight` finnes, byttes literalene til et levende kall.
final class DisplayFlightTests: XCTestCase {

  /// `solveFlight({85, 0, 0, -4.3, 20.9})` fra JS-motoren, Node 24.14.1.
  static let shotOut: [String: Double] = [
    "startDirection": 0,
    "spinAxis": 0,
    "curve": 0,
    "offline": 0,
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

  /// `solveFlight({100, -3, 2, -2, 14})` — retning i begge plan.
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

  func testCoversThe13Spec6OutcomesPlusFaceToPath() throws {
    let view = try DisplayFlight.displayFlight(out: Self.shotOut, unitSystem: .yards)
    XCTAssertEqual(view.count, 14)
    let spec6Fields = [
      "startDirection", "spinAxis", "curve", "offline", "launchAngle", "spinLoft",
      "backspin", "landingAngle", "smash", "ballSpeed", "carry", "total", "apex",
    ]
    let mappedFields = DisplayFlight.flightDisplay.values.map(\.field)
    for f in spec6Fields {
      XCTAssertTrue(mappedFields.contains(f), "spec §6-feltet \(f) mangler")
    }
    for (_, cell) in view {
      XCTAssertFalse(cell.text.isEmpty)
      XCTAssertTrue(cell.value.isFinite)
      XCTAssertFalse(cell.unit.isEmpty)
    }
  }

  func testYardsPassThroughAndMetersAreExactlyTimesYardToMetre() throws {
    let yd = try DisplayFlight.displayFlight(out: Self.shotOut, unitSystem: .yards)
    let m = try DisplayFlight.displayFlight(out: Self.shotOut, unitSystem: .meters)
    let distanceKinds: Set<DisplayFlight.Kind> = [.distance, .lateralDistance]

    for (key, spec) in DisplayFlight.flightDisplay {
      let raw = Self.shotOut[spec.field]!
      if distanceKinds.contains(spec.kind) {
        XCTAssertEqual(yd[key]?.value, raw, "\(key): yards-verdien er ikke motorens")
        XCTAssertEqual(
          m[key]?.value, raw * Constants.yardToMetre, "\(key): meters avviker")
        XCTAssertEqual(yd[key]?.unit, "yd")
        XCTAssertEqual(m[key]?.unit, "m")
      } else {
        // D57: alt annet er enhetsuavhengig — identisk i begge pakker.
        XCTAssertEqual(yd[key]?.value, raw, "\(key) skal være urørt")
        XCTAssertEqual(yd[key]?.text, m[key]?.text, "\(key) påvirket av enhetsvalg")
        XCTAssertEqual(yd[key]?.unit, m[key]?.unit)
      }
    }
  }

  func testRoundingHappensAfterConversion() throws {
    // Avrund-først: 100.0 yd → 91.44 → «91.4 m». Riktig: 100.04 yd →
    // 91.4766 m → «91.5 m».
    let m = try DisplayFlight.displayValue(kind: .distance, raw: 100.04, unitSystem: .meters)
    XCTAssertEqual(m.text, "91.5 m")
    let yd = try DisplayFlight.displayValue(kind: .distance, raw: 100.04, unitSystem: .yards)
    XCTAssertEqual(yd.text, "100.0 yd")
  }

  func testD29EndToEnd_anglesCarrySignLateralsCarryLetter() throws {
    for system in [Convert.UnitSystem.meters, .yards] {
      let view = try DisplayFlight.displayFlight(out: Self.shapedOut, unitSystem: system)
      for (key, spec) in DisplayFlight.flightDisplay {
        guard let text = view[key]?.text else { continue }
        let hasLetter = text.hasSuffix(" L") || text.hasSuffix(" R") || text.hasSuffix(" C")
        if spec.kind == .lateralDistance {
          XCTAssertTrue(hasLetter, "\(key): «\(text)» mangler L/R/C")
          XCTAssertFalse(
            text.contains(Format.minus) || text.contains("+"),
            "\(key): «\(text)» bærer fortegn i tillegg til bokstav")
        } else {
          XCTAssertFalse(hasLetter, "\(key): «\(text)» bærer bokstav")
        }
      }
    }
  }

  func testShapedShotShowsLeftEverywhereLateral() throws {
    let view = try DisplayFlight.displayFlight(out: Self.shapedOut, unitSystem: .meters)
    XCTAssertEqual(view["curve"]?.text.hasSuffix(" L"), true)
    XCTAssertEqual(view["side"]?.text.hasSuffix(" L"), true)
    XCTAssertEqual(view["spinAxis"]?.text.first, Character(Format.minus))
    XCTAssertEqual(view["faceToPath"]?.text, "\(Format.minus)5.0°")
  }

  func testDeterminism() throws {
    let a = try DisplayFlight.displayFlight(out: Self.shotOut, unitSystem: .meters)
    let b = try DisplayFlight.displayFlight(out: Self.shotOut, unitSystem: .meters)
    XCTAssertEqual(a, b)
  }

  func testMissingEngineFieldThrows() {
    var incomplete = Self.shotOut
    incomplete.removeValue(forKey: "carry")
    XCTAssertThrowsError(
      try DisplayFlight.displayFlight(out: incomplete, unitSystem: .yards),
      "manglende motorfelt skal kaste, ikke vises som tomt")
  }
}

/// DisplayStudio — ordkontrakten fra `adapter/test/displayStudio.test.js`,
/// ordrett. Bytter noen et ord eller en desimal, feiler dette.
final class DisplayStudioTests: XCTestCase {

  func testLongitudinalBeforeAfter() throws {
    XCTAssertEqual(try DisplayStudio.longitudinalCm(10.5), "10.5 cm after")
    XCTAssertEqual(try DisplayStudio.longitudinalCm(-1.5), "1.5 cm before")
    XCTAssertEqual(try DisplayStudio.longitudinalCm(3.04), "3.0 cm after")
    XCTAssertEqual(try DisplayStudio.longitudinalCm(-20), "20.0 cm before")
  }

  func testLongitudinalZeroAfterRoundingHasNoWord() throws {
    XCTAssertEqual(try DisplayStudio.longitudinalCm(0), "0.0 cm")
    XCTAssertEqual(try DisplayStudio.longitudinalCm(-0.04), "0.0 cm")
    XCTAssertEqual(try DisplayStudio.longitudinalCm(0.04), "0.0 cm")
  }

  func testMetreVariantConvertsInAdapterNeverInUI() throws {
    XCTAssertEqual(try DisplayStudio.longitudinalMetres(0.105), "10.5 cm after")
    XCTAssertEqual(try DisplayStudio.longitudinalMetres(-0.015), "1.5 cm before")
    XCTAssertEqual(try DisplayStudio.longitudinalMetres(0), "0.0 cm")
  }

  func testHeightAboveBelow() throws {
    XCTAssertEqual(try DisplayStudio.heightCm(2), "2.0 cm above")
    XCTAssertEqual(try DisplayStudio.heightCm(-5), "5.0 cm below")
    XCTAssertEqual(try DisplayStudio.heightCm(-0.04), "0.0 cm")
  }

  func testFaceOffsetHighLow() throws {
    XCTAssertEqual(try DisplayStudio.faceOffsetMm(16.63), "16.6 mm high")
    XCTAssertEqual(try DisplayStudio.faceOffsetMm(-16.63), "16.6 mm low")
    XCTAssertEqual(try DisplayStudio.faceOffsetMm(-1.05), "1.1 mm low")
    XCTAssertEqual(try DisplayStudio.faceOffsetMm(0.04), "0.0 mm")
  }

  func testLiePresetsAreIntegers() throws {
    XCTAssertEqual(try DisplayStudio.lieMm(0), "0 mm")
    XCTAssertEqual(try DisplayStudio.lieMm(8), "8 mm")
    XCTAssertEqual(try DisplayStudio.lieMm(42), "42 mm")
  }

  func testNonFiniteThrows() {
    for bad in [Double.nan, .infinity, -.infinity] {
      XCTAssertThrowsError(try DisplayStudio.longitudinalCm(bad))
      XCTAssertThrowsError(try DisplayStudio.longitudinalMetres(bad))
      XCTAssertThrowsError(try DisplayStudio.heightCm(bad))
      XCTAssertThrowsError(try DisplayStudio.faceOffsetMm(bad))
      XCTAssertThrowsError(try DisplayStudio.lieMm(bad))
    }
  }

  func testNoHyphenOrMinusInAnyValue() throws {
    let samples = [
      try DisplayStudio.longitudinalCm(-12.3),
      try DisplayStudio.heightCm(-4.2),
      try DisplayStudio.faceOffsetMm(-9.9),
    ]
    for s in samples {
      XCTAssertFalse(s.contains("-"), "fant bindestrek i «\(s)»")
      XCTAssertFalse(s.contains(Format.minus), "fant minus i «\(s)»")
    }
  }
}
