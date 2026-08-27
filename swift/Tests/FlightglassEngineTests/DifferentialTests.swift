import XCTest

@testable import FlightglassEngine

/// Leveranse 3 — differensialkjøring mot JS-motoren på 500 NYE leveringer.
///
/// Fixturen er et grovt rutenett: fem verdier per akse. En port kan i prinsippet
/// treffe hvert eneste rutenettpunkt og likevel divergere mellom dem — det er
/// nettopp det en fit gjør. Denne testen dekker mellomrommene.
///
/// Leveringene er generert av `swift/Tools/gen-differential.mjs` med pinnet
/// PRNG-frø, kjørt gjennom `engine/src/solveFlight.js` (referanse-
/// implementasjonen, D71). Ingen av dem treffer et rutenettpunkt — generatoren
/// sjekker mot alle 5029 fixture-tupler og forkaster kollisjoner.
///
/// ⚠ Dette er IKKE en fasittest. Fixturen er fasit; dette er en enighetstest
/// mellom to implementasjoner. Feiler den mens fixturtestene er grønne, har
/// porten en feil som rutenettet ikke traff.
final class DifferentialTests: XCTestCase {

  private static let fileName = "differential-flight.json"

  /// Ligger i `swift/Tests/Fixtures/`, ikke i `motor/export/`. Fixturen er
  /// pinnet og skal ikke få selskap av genererte filer.
  private func loadDifferentialCases() -> [FixtureCase] {
    // Denne filen ligger i Tests/FlightglassEngineTests/ nar den er tatt i
    // bruk; fixturen ligger i Tests/Fixtures/ ved siden av.
    let url = URL(fileURLWithPath: #filePath)
      .deletingLastPathComponent()   // FlightglassEngineTests
      .deletingLastPathComponent()   // Tests
      .appendingPathComponent("Fixtures")
      .appendingPathComponent(Self.fileName)

    // ⚠ ExactJSON, ikke JSONSerialization — samme presisjonskrav som
    // fixturene (JSONPrecisionTests: opptil 2 ULP feil i sistnevnte).
    guard let parsed = try? ExactJSON.parse(contentsOf: url),
      let doc = parsed.object,
      let raw = doc["cases"]?.array
    else {
      XCTFail(
        """
        Fant ikke \(url.path).
        Generer den først:  node swift/Tools/gen-differential.mjs
        """)
      return []
    }
    return raw.compactMap { $0.object.map(FixtureCase.init) }
  }

  func testFiveHundredNewDeliveriesAgreeWithTheJSEngine() {
    let cases = loadDifferentialCases()
    XCTAssertEqual(cases.count, 500, "differensialsettet skal ha 500 leveringer")
    guard !cases.isEmpty else { return }

    // Ingen av dem skal ligge på fixturens rutenett — det er hele poenget.
    let gridValues: Set<Double> = [30, 60, 90, 120, 150]
    let onGrid = cases.filter { gridValues.contains($0.inDouble("clubSpeed")) }
    XCTAssertTrue(
      onGrid.isEmpty,
      "\(onGrid.count) leveringer landet på rutenettet — de beviser ingenting nytt")

    var perField: [String: [Comparison]] = [:]

    for c in cases {
      guard
        let solved = try? SolveFlight.solveThrowing(
          clubSpeed: c.inDouble("clubSpeed"),
          faceAngle: c.inDouble("faceAngle"),
          clubPath: c.inDouble("clubPath"),
          attackAngle: c.inDouble("attackAngle"),
          dynamicLoft: c.inDouble("dynamicLoft"))
      else {
        XCTFail("\(c.id): porten kastet der JS ga et resultat")
        continue
      }

      for field in SolveFlight.numericFieldNames {
        guard let expected = c.outDouble(field),
          let actual = solved.numericValue(field)
        else { continue }
        perField[field, default: []].append(
          Comparison(id: c.id, field: field, expected: expected, actual: actual))
      }
      for field in ["spinVectorRadPerSec", "spinAxisUnit", "clubVelocityUnit", "faceNormalUnit"] {
        guard let expected = c.outVec3(field), let actual = solved.vectorValue(field)
        else { continue }
        for (axis, e, a) in [
          ("x", expected.x, actual.x), ("y", expected.y, actual.y), ("z", expected.z, actual.z),
        ] {
          perField["\(field).\(axis)", default: []].append(
            Comparison(id: c.id, field: "\(field).\(axis)", expected: e, actual: a))
        }
      }
      if let expectedShape = c.outString("shape") {
        // Strengfeltet: ordrett likhet, telles som pass/fail-sammenligning.
        perField["shape", default: []].append(
          Comparison(
            id: c.id, field: "shape", expected: 0,
            actual: expectedShape == solved.shape ? 0 : 1))
      }
    }

    XCTAssertFalse(perField.isEmpty, "ingen felt ble sammenlignet")

    var failedFields: [String] = []
    for (field, comparisons) in perField.sorted(by: { $0.key < $1.key }) {
      let baseName = field.split(separator: ".").first.map(String.init) ?? field
      // Samme deklarerte regime som fixturetestene: RK4-kjeden rel 1e-9 med
      // gulv 1e-12 (JS-baselinens eget), alt annet eksakt.
      let tolerance: Tolerance =
        SolveFlight.declaredToleranceIsRK4(baseName)
        ? .relativeWithFloor(rel: 1e-9, floor: 1e-12) : .exact
      let report = Report("differential/\(field)", comparisons, tolerance: tolerance)
      DeviationLog.shared.record(report)
      if !report.ok {
        failedFields.append(report.summary)
      }
    }

    XCTAssertTrue(
      failedFields.isEmpty,
      "Felt utenfor deklarert toleranse på nye leveringer:\n"
        + failedFields.joined(separator: "\n"))
  }

  func testThrowingDeliveriesThrowInBothEngines() {
    let cases = loadDifferentialCases()
    let throwing = cases.filter { $0.out == nil }

    // Baseline-settet har null kastende leveringer. Vakten står der fordi et
    // regenerert sett kan få dem, og da skal porten kaste på nøyaktig de samme.
    for c in throwing {
      let expectedMessage = (c.error?["message"] as? String) ?? ""
      XCTAssertThrowsError(
        try SolveFlight.solveThrowing(
          clubSpeed: c.inDouble("clubSpeed"),
          faceAngle: c.inDouble("faceAngle"),
          clubPath: c.inDouble("clubPath"),
          attackAngle: c.inDouble("attackAngle"),
          dynamicLoft: c.inDouble("dynamicLoft"))
      ) { error in
        XCTAssertEqual(
          "\(error)", expectedMessage,
          "\(c.id): feilmeldingen må matche ordrett")
      }
    }
  }
}
