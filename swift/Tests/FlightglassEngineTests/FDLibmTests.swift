import Foundation
import XCTest

@testable import FlightglassEngine

/// D86 — de transcendentale funksjonene, verifisert BIT-EKSAKT mot V8.
///
/// Ingen toleranse her. Hele poenget med D86 er at porten ikke skal være
/// «innenfor toleranse» mot V8, men identisk med den — ellers kan en subtil
/// portfeil under `1e-12` gjemme seg i støyen for alltid.
///
/// Tabellene er generert av `swift/Tools/gen-libm-table.mjs` fra Node 24.14.1,
/// samme motor som genererte fixturen. Hver fil er par av (input-bits,
/// output-bits) som little-endian `UInt64`.
final class FDLibmTests: XCTestCase {

  // ── Tabellesing ──────────────────────────────────────────────────────────

  private static func tableURL(_ name: String) -> URL {
    URL(fileURLWithPath: #filePath)
      .deletingLastPathComponent()  // FlightglassEngineTests
      .deletingLastPathComponent()  // Tests
      .appendingPathComponent("Fixtures")
      .appendingPathComponent("libm")
      .appendingPathComponent("\(name).bin")
  }

  /// Kjører en enargumentsfunksjon mot hele tabellen og krever null avvik.
  ///
  /// Feilmeldingen bærer tall: input, forventet, fikk, og ULP-avstand — aldri
  /// bare «avvik funnet».
  private func verifyUnary(
    _ name: String,
    _ f: (Double) -> Double,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    let url = Self.tableURL(name)
    guard let data = try? Data(contentsOf: url) else {
      XCTFail(
        """
        Fant ikke \(url.path).
        Generer den først:  node swift/Tools/gen-libm-table.mjs \(name)
        """, file: file, line: line)
      return
    }
    XCTAssertEqual(data.count % 16, 0, "\(name).bin er ikke hele par", file: file, line: line)

    let pairs = data.count / 16
    XCTAssertGreaterThan(pairs, 1000, "\(name): for få par til å bety noe", file: file, line: line)

    var mismatches = 0
    var firstFew: [String] = []

    data.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
      for i in 0..<pairs {
        let inputBits = raw.loadUnaligned(fromByteOffset: i * 16, as: UInt64.self)
        let expectedBits = raw.loadUnaligned(fromByteOffset: i * 16 + 8, as: UInt64.self)

        let x = Double(bitPattern: inputBits)
        let expected = Double(bitPattern: expectedBits)
        let actual = f(x)

        if actual.bitPattern != expectedBits {
          mismatches += 1
          if firstFew.count < 5 {
            let ulp = Comparison(
              id: name, field: "x=\(x)", expected: expected, actual: actual
            ).ulpDistance
            firstFew.append(
              "  x=\(x)  forventet \(expected)  fikk \(actual)  (\(ulp) ULP)")
          }
        }
      }
    }

    XCTAssertEqual(
      mismatches, 0,
      """
      \(name): \(mismatches) av \(pairs) avviker fra V8.
      \(firstFew.joined(separator: "\n"))
      """,
      file: file, line: line)

    // Rapporteres uansett — leveranse 2 skal vise at funksjonen ER eksakt,
    // ikke bare at ingen test feilet.
    DeviationLog.shared.record(
      Report(
        "fdlibm/\(name)",
        [Comparison(id: name, field: "bit-eksakt", expected: 0, actual: Double(mismatches))],
        tolerance: .exact))
    print("fdlibm/\(name): \(pairs - mismatches)/\(pairs) bit-eksakt mot V8")
  }

  // ── exp ──────────────────────────────────────────────────────────────────

  func testExpIsBitExactAgainstV8() {
    verifyUnary("exp", FDLibm.exp)
  }

  func testExpNonFiniteBehaviour() {
    // JS: exp(+inf) = +inf, exp(-inf) = 0, exp(NaN) = NaN.
    XCTAssertEqual(FDLibm.exp(.infinity), .infinity)
    XCTAssertEqual(FDLibm.exp(-.infinity), 0.0)
    XCTAssertTrue(FDLibm.exp(.nan).isNaN)
  }

  func testExpMatchesTheSingleMeasuredDivergenceFromFdlibm() {
    // Ved x == 1.0 gir V8 den korrekt avrundede `e`, mens rå fdlibm gir
    // 1 ULP mer. Målt over 4001 sammenhengende doubles rundt 1.0: nøyaktig
    // dette ene punktet divergerer. Se `FDLibm.exp`.
    XCTAssertEqual(FDLibm.exp(1.0), 2.718281828459045)
    XCTAssertEqual(FDLibm.exp(1.0).bitPattern, 0x4005_BF0A_8B14_5769)
    XCTAssertNotEqual(FDLibm.exp(1.0), 2.7182818284590455)
  }

  /// Kjører en toargumentsfunksjon mot en triple-tabell `(a, b, resultat)`.
  private func verifyBinary(
    _ name: String,
    _ f: (Double, Double) -> Double,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    let url = Self.tableURL(name)
    guard let data = try? Data(contentsOf: url) else {
      XCTFail(
        """
        Fant ikke \(url.path).
        Generer den først:  node swift/Tools/gen-libm-table.mjs \(name)
        """, file: file, line: line)
      return
    }
    XCTAssertEqual(data.count % 24, 0, "\(name).bin er ikke hele tripler", file: file, line: line)

    let triples = data.count / 24
    var mismatches = 0
    var firstFew: [String] = []

    data.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
      for i in 0..<triples {
        let aBits = raw.loadUnaligned(fromByteOffset: i * 24, as: UInt64.self)
        let bBits = raw.loadUnaligned(fromByteOffset: i * 24 + 8, as: UInt64.self)
        let rBits = raw.loadUnaligned(fromByteOffset: i * 24 + 16, as: UInt64.self)

        let a = Double(bitPattern: aBits)
        let b = Double(bitPattern: bBits)
        let actual = f(a, b)

        if actual.bitPattern != rBits {
          mismatches += 1
          if firstFew.count < 5 {
            firstFew.append(
              "  (\(a), \(b))  forventet \(Double(bitPattern: rBits))  fikk \(actual)")
          }
        }
      }
    }

    XCTAssertEqual(
      mismatches, 0,
      """
      \(name): \(mismatches) av \(triples) avviker fra V8.
      \(firstFew.joined(separator: "\n"))
      """,
      file: file, line: line)

    DeviationLog.shared.record(
      Report(
        "fdlibm/\(name)",
        [Comparison(id: name, field: "bit-eksakt", expected: 0, actual: Double(mismatches))],
        tolerance: .exact))
    print("fdlibm/\(name): \(triples - mismatches)/\(triples) bit-eksakt mot V8")
  }

  // ── atan / atan2 ─────────────────────────────────────────────────────────

  func testAtanIsBitExactAgainstV8() {
    verifyUnary("atan", FDLibm.atan)
  }

  func testAtan2IsBitExactAgainstV8() {
    verifyBinary("atan2", FDLibm.atan2)
  }

  func testAtan2EdgeCasesFollowFdlibmExactly() {
    // Fortegnet på null er ikke pedanteri her: `atan2(+0, −1)` er `π` mens
    // `atan2(−0, −1)` er `−π`, og fixturen inneholder begge fortegn.
    XCTAssertEqual(FDLibm.atan2(0.0, 1.0), 0.0)
    XCTAssertEqual(FDLibm.atan2(-0.0, 1.0).sign, .minus)
    XCTAssertGreaterThan(FDLibm.atan2(0.0, -1.0), 3.14)
    XCTAssertLessThan(FDLibm.atan2(-0.0, -1.0), -3.14)
    XCTAssertEqual(FDLibm.atan2(1.0, 0.0), FDLibm.pi_o_2 + FDLibm.atanTiny)
    XCTAssertTrue(FDLibm.atan2(.nan, 1.0).isNaN)
    XCTAssertTrue(FDLibm.atan2(1.0, .nan).isNaN)
  }

  // ── tan ──────────────────────────────────────────────────────────────────

  func testTanIsBitExactAgainstV8() {
    verifyUnary("tan", FDLibm.tan)
  }

  func testTanNonFiniteBehaviour() {
    XCTAssertTrue(FDLibm.tan(.infinity).isNaN)
    XCTAssertTrue(FDLibm.tan(-.infinity).isNaN)
    XCTAssertTrue(FDLibm.tan(.nan).isNaN)
    XCTAssertEqual(FDLibm.tan(0.0), 0.0)
    XCTAssertEqual(FDLibm.tan(-0.0).sign, .minus, "tan(-0) skal bevare fortegnet")
  }

  // ── pow — D92 ────────────────────────────────────────────────────────────

  func testPowEsSemanticsAreExact() {
    // ES-wrapperen er semantikk, ikke libm — den skal være eksakt overalt.
    XCTAssertTrue(FDLibm.pow(1.0, .nan).isNaN, "pow(1, NaN) er NaN i ES, 1 i C")
    XCTAssertTrue(FDLibm.pow(5.0, .nan).isNaN)
    XCTAssertTrue(FDLibm.pow(1.0, .infinity).isNaN, "pow(1, inf) er NaN i ES")
    XCTAssertTrue(FDLibm.pow(-1.0, .infinity).isNaN)
    XCTAssertTrue(FDLibm.pow(-1.0, -.infinity).isNaN)
    XCTAssertEqual(FDLibm.pow(.nan, 0), 1, "pow(NaN, 0) er 1 — y==0-regelen vinner")
    // y == 2 → x·x, ordrett.
    XCTAssertEqual(FDLibm.pow(3.000000000000001, 2), 3.000000000000001 * 3.000000000000001)
    // y == 0.5 → sqrt(x+0): −0^0.5 er +0, ±inf → +inf.
    XCTAssertEqual(FDLibm.pow(-0.0, 0.5).sign, .plus)
    XCTAssertEqual(FDLibm.pow(-.infinity, 0.5), .infinity)
    XCTAssertEqual(FDLibm.pow(2.0, 0.5), (2.0).squareRoot())
  }

  func testPowCrtDriftAgainstV8IsMeasuredAndReported() {
    // D92: pow er plattform-CRT bak ES-wrapperen — IKKE bit-eksakt mot V8
    // per konstruksjon. Denne testen DØMMER ingenting numerisk utover
    // ES-semantikken; den MÅLER driften og fører den i avviksrapporten,
    // slik D92 krever.
    let url = Self.tableURL("pow")
    guard let data = try? Data(contentsOf: url) else {
      XCTFail("Generer først:  node swift/Tools/gen-libm-table.mjs pow")
      return
    }

    let triples = data.count / 24
    var mismatches = 0
    var engineMismatches = 0
    var engineTotal = 0
    var worstUlp = 0.0
    var worstRel = 0.0

    data.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
      for i in 0..<triples {
        let a = Double(bitPattern: raw.loadUnaligned(fromByteOffset: i * 24, as: UInt64.self))
        let b = Double(bitPattern: raw.loadUnaligned(fromByteOffset: i * 24 + 8, as: UInt64.self))
        let rBits = raw.loadUnaligned(fromByteOffset: i * 24 + 16, as: UInt64.self)
        let actual = FDLibm.pow(a, b)
        let expected = Double(bitPattern: rBits)

        let inEngineDomain = b == 0.4 && a >= 0.08 && a <= 0.22
        if inEngineDomain { engineTotal += 1 }
        if actual.bitPattern != rBits {
          if actual.isNaN && expected.isNaN { continue }
          mismatches += 1
          if inEngineDomain { engineMismatches += 1 }
          let c = Comparison(id: "pow", field: "", expected: expected, actual: actual)
          if c.ulpDistance > worstUlp { worstUlp = c.ulpDistance }
          if c.relativeDeviation > worstRel { worstRel = c.relativeDeviation }
        }
      }
    }

    print("")
    print("=== pow (D92): CRT-drift mot V8, målt ===")
    print("  totalt          : \(triples - mismatches)/\(triples) bit-like")
    print("  motorens domene : \(engineTotal - engineMismatches)/\(engineTotal) bit-like")
    print("  maks drift      : \(worstUlp) ULP  (\(worstRel) relativt)")
    print("")

    DeviationLog.shared.record(
      Report(
        "fdlibm/pow (D92: plattform-CRT, drift målt — dømmes ikke)",
        [
          Comparison(
            id: "pow", field: "ulp-drift", expected: 0, actual: worstUlp)
        ],
        tolerance: .absolute(.infinity)),
      informational: true)

    // Fornuftsvakter — ikke numeriske dommer: driften skal være i samme
    // størrelsesorden som målt (1 ULP, 0,21 %). Eksploderer den, er det ikke
    // CRT-drift lenger, men en feil.
    XCTAssertLessThanOrEqual(worstUlp, 4, "driften er ikke lenger CRT-støy")
    XCTAssertLessThan(
      Double(engineMismatches) / Double(Swift.max(engineTotal, 1)), 0.02,
      "over 2 % drift i motor-domenet — undersøk før du stoler på 1e-9-budsjettet")
  }

  // ── pow: måling før portering (historisk — beholdt som dokumentasjon) ────

  /// Hvor stor er jobben med `pow` egentlig?
  ///
  /// Motoren bruker `pow` på ÉN måte: `pow(max(0, spinParameter), 0.4)` i
  /// RK4-integratoren, to kallsteder. Før jeg porterer fdlibms `pow` — den
  /// største av de åtte, med egne interne `log`/`exp`-deler — måler denne
  /// testen hvor langt plattformens `pow` faktisk ligger fra V8.
  ///
  /// Resultatet avgjør ikke OM den skal portes (D86 sier ja), men det viser
  /// hva som står på spill hvis den må falle tilbake under sikkerhetsventilen.
  func testMeasureHowFarPlatformPowIsFromV8() {
    let url = Self.tableURL("pow")
    guard let data = try? Data(contentsOf: url) else {
      XCTFail("Generer først:  node swift/Tools/gen-libm-table.mjs pow")
      return
    }

    let triples = data.count / 24
    var mismatches = 0
    var engineDomainMismatches = 0
    var engineDomainTotal = 0
    var worstUlp = 0.0
    var worstAt = (0.0, 0.0)

    data.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
      for i in 0..<triples {
        let a = Double(bitPattern: raw.loadUnaligned(fromByteOffset: i * 24, as: UInt64.self))
        let b = Double(
          bitPattern: raw.loadUnaligned(fromByteOffset: i * 24 + 8, as: UInt64.self))
        let rBits = raw.loadUnaligned(fromByteOffset: i * 24 + 16, as: UInt64.self)

        let expected = Double(bitPattern: rBits)
        let actual = Foundation.pow(a, b)

        // Motorens faktiske domene: eksponent 0.4, base i det observerte
        // spinParameter-området.
        let inEngineDomain = b == 0.4 && a >= 0.08 && a <= 0.22
        if inEngineDomain { engineDomainTotal += 1 }

        if actual.bitPattern != rBits {
          mismatches += 1
          if inEngineDomain { engineDomainMismatches += 1 }
          let ulp = Comparison(id: "pow", field: "", expected: expected, actual: actual)
            .ulpDistance
          if ulp > worstUlp {
            worstUlp = ulp
            worstAt = (a, b)
          }
        }
      }
    }

    print("")
    print("=== pow: plattformens libm mot V8 ===")
    print("  totalt          : \(triples - mismatches)/\(triples) bit-eksakt")
    print("  motorens domene : \(engineDomainTotal - engineDomainMismatches)/\(engineDomainTotal) bit-eksakt")
    print("  maks avvik      : \(worstUlp) ULP ved pow(\(worstAt.0), \(worstAt.1))")
    print("")

    // Ingen assertion på tallet: dette er en MÅLING, ikke et krav.
    // Kravet kommer når `FDLibm.pow` finnes.
    XCTAssertGreaterThan(engineDomainTotal, 1000, "for få caser i motorens domene")
  }

  // ── asin / acos ──────────────────────────────────────────────────────────

  func testAsinIsBitExactAgainstV8() {
    verifyUnary("asin", FDLibm.asin)
  }

  func testAcosIsBitExactAgainstV8() {
    verifyUnary("acos", FDLibm.acos)
  }

  func testAsinAcosOutsideDomainIsNaN() {
    for x in [1.0000000000000002, -1.0000000000000002, 2.0, -2.0, 1e300] {
      XCTAssertTrue(FDLibm.asin(x).isNaN, "asin(\(x))")
      XCTAssertTrue(FDLibm.acos(x).isNaN, "acos(\(x))")
    }
    XCTAssertTrue(FDLibm.asin(.nan).isNaN)
    XCTAssertTrue(FDLibm.acos(.nan).isNaN)
  }

  func testAsinAcosAtTheDomainEdges() {
    XCTAssertEqual(FDLibm.asin(1.0), FDLibm.pio2_hi + FDLibm.pio2_lo)
    XCTAssertEqual(FDLibm.asin(-1.0), -(FDLibm.pio2_hi + FDLibm.pio2_lo))
    XCTAssertEqual(FDLibm.acos(1.0), 0.0)
    XCTAssertEqual(FDLibm.acos(-1.0), FDLibm.pi_fd + 2.0 * FDLibm.pio2_lo)
    XCTAssertEqual(FDLibm.asin(0.0), 0.0)
    XCTAssertEqual(FDLibm.acos(0.0), FDLibm.pio2_hi + FDLibm.pio2_lo)
  }

  func testStudioClampKeepsAsinInsideVerifiedDomain() {
    // Spec §8.3 klamper til ±0.999 før asin. Vakten sikrer at studios
    // faktiske domene er dekket av tabellen, ikke bare antatt dekket.
    XCTAssertEqual(Constants.studioThetaSinClamp, 0.999)
    XCTAssertFalse(FDLibm.asin(Constants.studioThetaSinClamp).isNaN)
    XCTAssertFalse(FDLibm.asin(-Constants.studioThetaSinClamp).isNaN)
  }

  // ── sin / cos ────────────────────────────────────────────────────────────

  func testSinIsBitExactAgainstV8() {
    verifyUnary("sin", FDLibm.sin)
  }

  func testCosIsBitExactAgainstV8() {
    verifyUnary("cos", FDLibm.cos)
  }

  func testSinCosNonFiniteBehaviour() {
    // JS: sin/cos av ±inf og NaN er NaN.
    XCTAssertTrue(FDLibm.sin(.infinity).isNaN)
    XCTAssertTrue(FDLibm.sin(-.infinity).isNaN)
    XCTAssertTrue(FDLibm.sin(.nan).isNaN)
    XCTAssertTrue(FDLibm.cos(.infinity).isNaN)
    XCTAssertTrue(FDLibm.cos(-.infinity).isNaN)
    XCTAssertTrue(FDLibm.cos(.nan).isNaN)
  }

  func testSinCosExactAtZero() {
    XCTAssertEqual(FDLibm.sin(0.0), 0.0)
    XCTAssertEqual(FDLibm.sin(-0.0).sign, .minus, "sin(-0) skal bevare fortegnet")
    XCTAssertEqual(FDLibm.cos(0.0), 1.0)
    XCTAssertEqual(FDLibm.cos(-0.0), 1.0)
  }

  func testEngineAngleRangeStaysWellInsideBranchThree() {
    // Gren 4 i argumentreduksjonen er ikke portert. Vakten: motorens
    // argumenter er vinkler i radianer, og selv ±360° gir |x| < 7 — fire
    // størrelsesordener under grensen på ~1 647 100.
    let widest = Angles.flightDegToRad(360)
    XCTAssertLessThan(widest, 7.0)

    // Og faktisk, over hele fixturen.
    var maxAngle = 0.0
    for c in Fixture.flight() {
      for field in ["attackAngle", "clubPath", "dynamicLoft", "faceAngle"] {
        let rad = abs(Angles.flightDegToRad(c.inDouble(field)))
        if rad > maxAngle { maxAngle = rad }
      }
    }
    print("største |x| inn i sin/cos fra fixturen: \(maxAngle) rad")
    XCTAssertLessThan(maxAngle, 7.0)
  }

  func testExpAgreesWithPlatformLibmToWithinOneUlp() {
    // Ikke en korrekthetstest — en fornuftssjekk. Avviker porten fra ucrt med
    // mer enn noen få ULP, er det sannsynligvis en transkripsjonsfeil og ikke
    // en libm-forskjell.
    var worst = 0.0
    var worstAt = 0.0
    for step in -700...700 {
      let x = Double(step) / 40
      let ours = FDLibm.exp(x)
      let platform = Foundation.exp(x)
      let ulp = Comparison(id: "exp", field: "", expected: platform, actual: ours)
        .ulpDistance
      if ulp > worst {
        worst = ulp
        worstAt = x
      }
    }
    print("fdlibm/exp mot plattformens libm: maks \(worst) ULP ved x=\(worstAt)")
    XCTAssertLessThanOrEqual(
      worst, 2.0,
      "fdlibm-exp avviker \(worst) ULP fra ucrt ved x=\(worstAt) — mistenk transkripsjonsfeil")
  }
}
