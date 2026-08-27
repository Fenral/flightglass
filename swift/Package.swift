// swift-tools-version: 6.0
import PackageDescription

// Flightglass — Swift-port av `engine/` og `adapter/` (D70, D71).
//
// Ingen produktavhengigheter. Ingen UIKit, ingen SwiftUI, ingen Foundation i
// selve fysikken — kun i testenes fixturelaser. Rene funksjoner hele veien.
let package = Package(
  name: "Flightglass",
  products: [
    .library(name: "FlightglassEngine", targets: ["FlightglassEngine"]),
    .library(name: "FlightglassAdapter", targets: ["FlightglassAdapter"]),
  ],
  targets: [
    .target(name: "FlightglassEngine"),
    .target(name: "FlightglassAdapter", dependencies: ["FlightglassEngine"]),
    .testTarget(
      name: "FlightglassEngineTests",
      // Adapteren er med fordi fixturelasteren bor her: integrasjonstester
      // som trenger alle 5028 caser (D79-endepunktene) ligger i dette målet.
      dependencies: ["FlightglassEngine", "FlightglassAdapter"]
    ),
    .testTarget(
      name: "FlightglassAdapterTests",
      dependencies: ["FlightglassAdapter", "FlightglassEngine"]
    ),
  ]
)
