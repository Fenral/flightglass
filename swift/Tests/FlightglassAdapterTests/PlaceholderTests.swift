import XCTest

@testable import FlightglassAdapter

/// Vaktene rundt portstatus-flagget. Plassholderen fra byggefasen er byttet
/// med det motsatte kravet: flagget skal nå VÆRE true, og
/// `AdapterLiveIntegrationTests` (i engine-testmålet, som har fixturelasteren)
/// bærer beviset mot den levende motoren.
final class PortedFlagTests: XCTestCase {
  func testAdapterIsPorted() {
    XCTAssertTrue(
      FlightglassAdapter.ported,
      "Flagget er satt tilbake til false — er en modul trukket ut?")
  }
}
