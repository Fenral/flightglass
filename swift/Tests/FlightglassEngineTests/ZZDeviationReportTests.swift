import XCTest

@testable import FlightglassEngine

/// Leveranse 2 — avviksrapporten, skrevet som biprodukt av testkjøringen.
///
/// `ZZ`-prefikset er ikke pynt: XCTest kjører testklasser i alfabetisk
/// rekkefølge, så denne klassen kjører sist og ser hele `DeviationLog`.
///
/// ⚠ Rapporten er bare komplett når HELE suiten kjøres. Kjører du med
/// `--filter`, inneholder den bare feltene fra de testene som faktisk kjørte,
/// og filen sier det selv i hodet.
final class ZZDeviationReportTests: XCTestCase {

  func testWriteDeviationReport() {
    let lines = DeviationLog.shared.snapshot
    guard !lines.isEmpty else {
      // Kjørt med et filter som ikke traff noen feltsammenligning. Ikke en
      // feil — men rapporten skal ikke overskrives med ingenting.
      print("DeviationLog er tom — rapporten ble ikke skrevet.")
      return
    }

    let root = URL(fileURLWithPath: #filePath)
      .deletingLastPathComponent()  // FlightglassEngineTests
      .deletingLastPathComponent()  // Tests
    let url = root.appendingPathComponent("AVVIKSRAPPORT.tsv")

    DeviationLog.shared.flush(to: url)

    print("")
    print("=== AVVIKSRAPPORT (\(lines.count) rader) ===")
    print("status\tfelt\tpass\ttoleranse\tmaks avvik\tbit-eksakt\tmaks ULP")
    for line in lines { print(line) }
    print("=== skrevet til \(url.path) ===")
    print("")

    // Vakten: rapporten skal ikke inneholde en eneste FAIL-rad. Gjør den det,
    // har en feltrapport sluppet gjennom uten at testen som eide den feilet.
    let failures = lines.filter { $0.hasPrefix("FAIL") }
    XCTAssertTrue(
      failures.isEmpty,
      "Avviksrapporten har FAIL-rader:\n" + failures.joined(separator: "\n"))
  }
}
