import FlightglassEngine

/// KONVERTERING — det ENE stedet enheter byttes (D57, D58, spec §11 krav 5).
///
/// Portert fra `adapter/src/convert.js`. Motoren regner i yards og mph og
/// røres aldri av enhetsvalget (D27).
///
/// D57: to enhetspakker — `meters` (avstander i meter) og `yards`. Fart er
/// ALLTID mph i begge. Enhetsuavhengig: spinn (rpm), smash (forholdstall),
/// vinkler (grader), Studios mm-verdier.
///
/// Konverteringsfaktoren er `Constants.yardToMetre` — aldri en lokal literal,
/// slik at faktoren ikke kan dupliseres (JS-siden håndhever det med lint).
public enum Convert {

  /// De to enhetspakkene fra D57. Interne id-er, ikke brukervendt kopi.
  public enum UnitSystem: String, CaseIterable, Sendable {
    case meters
    case yards
  }

  /// Kontraktsbrudd — spec §3: endelige tall inn, ellers kast.
  public enum ContractError: Error, Equatable {
    case nonFinite(name: String, value: Double)
  }

  public struct Distance: Equatable, Sendable {
    public let value: Double
    public let unit: String  // "m" | "yd"
  }

  public struct Speed: Equatable, Sendable {
    public let value: Double
    public let unit: String  // alltid "mph"
  }

  /// Avstand fra motor (yards) til visningsenhet. Returneres URUNDET —
  /// avrunding (D28) skjer i formatlaget, ETTER konvertering, aldri før.
  public static func distanceForDisplay(
    yards: Double, unitSystem: UnitSystem
  ) throws -> Distance {
    guard yards.isFinite else {
      throw ContractError.nonFinite(name: "yards", value: yards)
    }
    switch unitSystem {
    case .yards: return Distance(value: yards, unit: "yd")
    case .meters: return Distance(value: yards * Constants.yardToMetre, unit: "m")
    }
  }

  /// Fart. D57: alltid mph. Funksjonen finnes for at kallstedene skal gå
  /// gjennom konverteringslaget også der svaret er identitet — så regelen
  /// står ett sted, ikke implisitt i hvert kallsted.
  public static func speedForDisplay(mph: Double) throws -> Speed {
    guard mph.isFinite else {
      throw ContractError.nonFinite(name: "mph", value: mph)
    }
    return Speed(value: mph, unit: "mph")
  }
}
