import FlightglassEngine

/// VISNINGSADAPTEREN — binder spec §6-mappingen (UI-verdi → motorfelt) til
/// konverteringslaget (`Convert`, D57) og formatlaget (`Format`, D28/D29).
///
/// Portert fra `adapter/src/displayFlight.js`.
///
/// Rekkefølgen er kontrakten: motor (yards/mph, urørt) → konverter → avrund.
/// Aldri omvendt: `100.04 yd` skal bli `91.5 m` (konverter så avrund), ikke
/// `91.4 m` (avrund så konverter).
///
/// Adapteren REGNER INGENTING. Den leser ferdige felt og oversetter dem til
/// visning — §11 krav 1 sett fra visningssiden.
public enum DisplayFlight {

  /// Formatvalg per metrikk, DESIGN.md «Fortegn og retning» (D29).
  public enum Kind: String, Sendable {
    case signedAngle  // startDirection, spinAxis, faceToPath + inputekko
    case plainAngle  // launchAngle, spinLoft, landingAngle, dynamicLoft
    case lateralDistance  // curve, side (L/R/C)
    case distance  // carry, total, apex
    case spin
    case smash
    case speed
  }

  public struct Spec: Equatable, Sendable {
    public let field: String
    public let kind: Kind
  }

  /// Spec §6-tabellen, ordrett: UI-verdi → motorfelt. Merk `side` → `offline`.
  /// `faceToPath` er ikke en §6-rad, men har egen rad i D28-tabellen og eies
  /// av DIRECTION-linsen (D42).
  public static let flightDisplay: [String: Spec] = [
    "launchDirection": Spec(field: "startDirection", kind: .signedAngle),
    "spinAxis": Spec(field: "spinAxis", kind: .signedAngle),
    "curve": Spec(field: "curve", kind: .lateralDistance),
    "side": Spec(field: "offline", kind: .lateralDistance),
    "launchAngle": Spec(field: "launchAngle", kind: .plainAngle),
    "spinLoft": Spec(field: "spinLoft", kind: .plainAngle),
    "backspin": Spec(field: "backspin", kind: .spin),
    "landingAngle": Spec(field: "landingAngle", kind: .plainAngle),
    "smash": Spec(field: "smash", kind: .smash),
    "ballSpeed": Spec(field: "ballSpeed", kind: .speed),
    "carry": Spec(field: "carry", kind: .distance),
    "total": Spec(field: "total", kind: .distance),
    "apex": Spec(field: "apex", kind: .distance),
    "faceToPath": Spec(field: "faceToPath", kind: .signedAngle),
  ]

  /// Inputekkoene — sliderne viser samme formatregler som avlesningene.
  public static let inputDisplay: [String: Spec] = [
    "clubSpeed": Spec(field: "clubSpeed", kind: .speed),
    "faceAngle": Spec(field: "faceAngle", kind: .signedAngle),
    "clubPath": Spec(field: "clubPath", kind: .signedAngle),
    "attackAngle": Spec(field: "attackAngle", kind: .signedAngle),
    "dynamicLoft": Spec(field: "dynamicLoft", kind: .plainAngle),
  ]

  /// Ett visningsobjekt: `value` er den KONVERTERTE, urundede verdien;
  /// `text` den avrundede strengen brukeren ser; `unit` visningsenheten.
  public struct Value: Equatable, Sendable {
    public let text: String
    public let value: Double
    public let unit: String
  }

  /// Én verdi fra motortall til visning.
  public static func displayValue(
    kind: Kind, raw: Double, unitSystem: Convert.UnitSystem
  ) throws -> Value {
    switch kind {
    case .signedAngle:
      return Value(text: try Format.angle(raw, signed: true), value: raw, unit: "deg")
    case .plainAngle:
      return Value(text: try Format.angle(raw), value: raw, unit: "deg")
    case .lateralDistance:
      let d = try Convert.distanceForDisplay(yards: raw, unitSystem: unitSystem)
      return Value(text: try Format.lateral(d.value, unit: d.unit), value: d.value, unit: d.unit)
    case .distance:
      let d = try Convert.distanceForDisplay(yards: raw, unitSystem: unitSystem)
      return Value(text: try Format.distance(d.value, unit: d.unit), value: d.value, unit: d.unit)
    case .spin:
      return Value(text: try Format.spin(raw), value: raw, unit: "rpm")
    case .smash:
      return Value(text: try Format.smash(raw), value: raw, unit: "ratio")
    case .speed:
      let s = try Convert.speedForDisplay(mph: raw)
      return Value(text: try Format.speed(s.value), value: s.value, unit: s.unit)
    }
  }

  /// Hele flight-avlesningen: de 13 §6-utfallene pluss faceToPath.
  /// Leser kun fra feltordboken; muterer aldri; regner aldri.
  ///
  /// Inngangen er `[String: Double]` — feltnavn fra `solveFlight` sitt
  /// returobjekt. Mangler et felt tabellen krever, kastes det (i JS ville
  /// `out[field]` gitt `undefined` og formatlaget kastet TypeError — samme
  /// kontraktsbrudd, samme utfall).
  public static func displayFlight(
    out: [String: Double], unitSystem: Convert.UnitSystem
  ) throws -> [String: Value] {
    var view: [String: Value] = [:]
    for (key, spec) in flightDisplay {
      guard let raw = out[spec.field] else {
        throw Format.ContractError.nonFinite(name: spec.field, value: .nan)
      }
      view[key] = try displayValue(kind: spec.kind, raw: raw, unitSystem: unitSystem)
    }
    return view
  }
}
