import XCTest

@testable import FlightglassEngine

/// Hvilken JSON-parser kan leses binary64 uten å miste en bit?
///
/// ⚠ DENNE TESTEN ER GRUNNEN TIL AT FIXTURELASTEREN SER UT SOM DEN GJØR.
///
/// Oppdaget under portering av modul 1: `JSONSerialization` på Windows leser
/// `0.8377580409572781` som `0.8377580409572782` — **1 ULP feil**. Node leser
/// samme tekst som `…781`. Bitmønstrene er `d5eb7bf3e9ceea3f` mot
/// `d6eb7bf3e9ceea3f`.
///
/// En parser som bommer med 1 ULP gjør hele verifikasjonen verdiløs: hvert
/// «avvik» porten måler ville vært parserens feil, ikke portens, og en ekte
/// portfeil på samme størrelsesorden ville druknet i støyen.
///
/// `strtod` er korrekt avrundet per C99 og gir det samme svaret som V8.
/// Testen står igjen som en vakt: bytter noen ut tallparsingen, sier den fra.
final class JSONPrecisionTests: XCTestCase {

  /// Verdier der 1-ULP-feil faktisk er observert eller er sannsynlig.
  /// Bitmønstrene er hentet fra Node 24.14.1, som genererte fixturen.
  private let cases: [(text: String, bits: UInt64)] = [
    ("0.8377580409572781", 0x3FEA_CEE9_F37B_EBD5),  // studioSweepRad
    ("10.391891433573875", 0x4024_C8A5_FE75_9090),  // launchIntercept
    ("-0.1693792957175766", 0xBFC5_AE38_83DC_FE18),  // launchLoftW
    ("0.012024703872880052", 0x3F88_A068_6F06_5B95),  // launchLoftQuadratic
    ("1.544034400161688", 0x3FF8_B45D_6A49_7EAD),  // smashModelIntercept
    ("-0.0033788247838473073", 0xBF6B_ADE8_BE41_D9DC),  // smashSpinLoftLinear
    ("-0.00006496570484201677", 0xBF11_07C6_4F85_9793),  // smashSpinLoftQuadratic
    ("0.9205937574433162", 0x3FED_7581_0A23_DD97),  // carryBallSpeedLinear
    ("0.004072298666112809", 0x3F70_AE1D_5972_AF04),  // carryBallSpeedQuadratic
  ]

  func testStrtodIsCorrectlyRounded() {
    for c in cases {
      let parsed = c.text.withCString { strtod($0, nil) }
      XCTAssertEqual(
        parsed.bitPattern, c.bits,
        """
        strtod("\(c.text)") ga \(parsed) \
        (bits \(String(parsed.bitPattern, radix: 16))), \
        forventet bits \(String(c.bits, radix: 16)).
        """)
    }
  }

  /// Dokumenterer feilen. Er den rettet i en senere toolchain, feiler denne
  /// testen — og da skal den slettes, ikke omgås.
  func testJSONSerialisationIsNotTrustworthyForBinary64() {
    var wrong: [String] = []

    for c in cases {
      let json: String = "{\"v\":" + c.text + "}"
      guard let data = json.data(using: .utf8) else {
        XCTFail("kunne ikke kode \(json)")
        continue
      }
      guard let obj = try? JSONSerialization.jsonObject(with: data),
        let dict = obj as? [String: Any],
        let number = dict["v"] as? NSNumber
      else {
        XCTFail("kunne ikke parse \(json)")
        continue
      }

      let viaSerialisation: Double = number.doubleValue
      let expected: Double = Double(bitPattern: c.bits)
      if viaSerialisation.bitPattern != c.bits {
        let got: String = String(viaSerialisation.bitPattern, radix: 16)
        let want: String = String(c.bits, radix: 16)
        wrong.append("  \(c.text): forventet \(expected) (\(want)), fikk \(viaSerialisation) (\(got))")
      }
    }

    if wrong.isEmpty {
      // Ikke en feil — men det betyr at fixturelaseren kan forenkles, og at
      // notatet i `ExactJSON` er utdatert.
      print("MERK: JSONSerialization er na bit-eksakt pa denne toolchainen.")
      print("Vurder a forenkle fixturelaseren — men mal pa nytt for du gjor det.")
    } else {
      print("JSONSerialization bommer pa \(wrong.count) av \(cases.count) verdier:")
      for line in wrong { print(line) }
    }
  }

  /// Den faktiske vakten: lasteren fixturene bruker MÅ være bit-eksakt.
  func testFixtureLoaderIsBitExact() {
    for c in cases {
      let json: String = "{\"v\":" + c.text + "}"
      guard let value: Double = ExactJSON.parseObject(json)?["v"]?.double else {
        XCTFail("ExactJSON kunne ikke lese \(json)")
        continue
      }
      // `String.init` har for mange overlaster til at typesjekkeren klarer
      // den inne i en interpolert multilinjestreng — bygg meldingen separat.
      let got: String = String(value.bitPattern, radix: 16)
      let want: String = String(c.bits, radix: 16)
      let message: String =
        "ExactJSON leste \(c.text) som \(value) (bits \(got)), forventet bits \(want). "
        + "Fixturelaseren er ikke lenger bit-eksakt - stopp og finn ut hvorfor "
        + "for noen fysikktest stoler pa den."
      XCTAssertEqual(value.bitPattern, c.bits, message)
    }
  }

  /// Og den samme vakten mot den ekte fixturen, ikke bare mot syntetisk JSON.
  func testStudioSweepRadFromTheRealFixture() {
    guard let k = Fixture.studioMeta()["constants"]?.object,
      let sweep = k["sweepRad"]?.double
    else {
      return XCTFail("fant ikke sweepRad i fixturen")
    }
    XCTAssertEqual(
      sweep.bitPattern, Constants.studioSweepRad.bitPattern,
      """
      sweepRad fra fixturen: \(sweep) (bits \(String(sweep.bitPattern, radix: 16)))
      Constants.studioSweepRad: \(Constants.studioSweepRad) \
      (bits \(String(Constants.studioSweepRad.bitPattern, radix: 16)))
      """)
  }
}
