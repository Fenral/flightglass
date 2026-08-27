/// FORMATERING — D28 (desimaler) og D29/D67 (fortegn/bokstav/ord), normativ
/// tabell i `DESIGN.md`.
///
/// Portert fra `adapter/src/format.js`. Laget er rent tekstlig: ingen
/// konvertering (den bor i `Convert`), ingen fysikk, ingen enhetsvalg-logikk.
/// Inn kommer et tall som ALLEREDE er i visningsenheten; ut kommer strengen
/// brukeren ser.
///
/// Reglene, ordrett fra DESIGN.md:
/// - vinkler 1 desimal · avstander 1 · spinn heltall med tynt mellomrom ·
///   smash 3 · fart 1
/// - avstander bærer bokstav (L/R/C), vinkler bærer fortegn — aldri begge
/// - tusenskille er U+2009, aldri komma eller punktum
/// - minustegnet er U+2212 (typografisk); ASCII-bindestrek forekommer aldri
///
/// Fortegn og bokstav avgjøres av verdien ETTER avrunding: en spinAxis på
/// −0.04° runder til 0.0 og vises som `0.0°` — et fortegn på en verdi som
/// viser null er en påstand avrundingen ikke lenger dekker.
public enum Format {

  /// Typografisk minus, U+2212 — DESIGN.md sine eksempler bruker den.
  public static let minus = "\u{2212}"

  /// Tynt mellomrom, U+2009 — eneste lovlige tusenskille.
  public static let thinSpace = "\u{2009}"

  /// Spec §3-kontrakten: endelige tall inn, ellers kast.
  public enum ContractError: Error, Equatable {
    case nonFinite(name: String, value: Double)
  }

  private static func assertFinite(_ value: Double, _ name: String) throws {
    guard value.isFinite else {
      throw ContractError.nonFinite(name: name, value: value)
    }
  }

  /// Magnitudestreng — `toFixed` på absoluttverdien, så fortegnshåndteringen
  /// er adskilt fra sifrene og `-0.0` aldri kan oppstå.
  private static func magnitude(_ value: Double, _ decimals: Int) -> String {
    JSNumber.toFixedAbs(value, decimals)
  }

  /// Er den avrundede magnituden null? (JS: `Number(mag) === 0`.)
  private static func isZero(_ magnitudeText: String) -> Bool {
    !magnitudeText.contains(where: { $0 != "0" && $0 != "." })
  }

  /// Vinkel, 1 desimal (D28).
  ///
  /// `signed: true` → retningsbærende vinkel (D29): `−16.3°` · `+5.0°` · `0.0°`.
  /// `signed: false` → uten retning: `14.5°`. Skulle verdien likevel være
  /// negativ vises minus — formatering skjuler aldri data.
  public static func angle(_ deg: Double, signed: Bool = false) throws -> String {
    try assertFinite(deg, "deg")
    let mag = magnitude(deg, 1)
    if isZero(mag) { return "0.0\u{00B0}" }
    let sign = deg < 0 ? minus : (signed ? "+" : "")
    return "\(sign)\(mag)\u{00B0}"
  }

  /// Avstand uten retning — carry, total, apex. 1 desimal, enhet etter vanlig
  /// mellomrom: `173.5 m` · `189.8 yd`.
  public static func distance(_ value: Double, unit: String) throws -> String {
    try assertFinite(value, "value")
    let mag = magnitude(value, 1)
    let sign = (!isZero(mag) && value < 0) ? minus : ""
    return "\(sign)\(mag) \(unit)"
  }

  /// Sideveis avstand — curve, side. Bokstav, aldri fortegn (D29):
  /// `16.3 m L` · `4.1 m R` · `0.0 m C`. Positiv = høyre (spec §4).
  /// Bokstaven avgjøres etter avrunding: runder verdien til 0.0 er den `C`.
  public static func lateral(_ value: Double, unit: String) throws -> String {
    try assertFinite(value, "value")
    let mag = magnitude(value, 1)
    let letter = isZero(mag) ? "C" : (value > 0 ? "R" : "L")
    return "\(mag) \(unit) \(letter)"
  }

  /// Spinn — heltall med U+2009 som tusenskille: `3 173 rpm`.
  public static func spin(_ rpm: Double) throws -> String {
    try assertFinite(rpm, "rpm")
    let n = JSNumber.roundAbs(rpm)
    let digits = String(Int(n))
    // Grupper fra høyre i treere, som JS-regexen.
    var grouped = ""
    for (index, ch) in digits.enumerated() {
      let remaining = digits.count - index
      if index > 0 && remaining % 3 == 0 { grouped += thinSpace }
      grouped.append(ch)
    }
    let sign = (n != 0 && rpm < 0) ? minus : ""
    return "\(sign)\(grouped) rpm"
  }

  /// Smash factor — 3 desimaler, ingen enhet: `1.451`. Eneste metrikk der
  /// tredje desimal bærer mening (D28).
  public static func smash(_ ratio: Double) throws -> String {
    try assertFinite(ratio, "ratio")
    let mag = magnitude(ratio, 3)
    let sign = (!isZero(mag) && ratio < 0) ? minus : ""
    return "\(sign)\(mag)"
  }

  /// Fart — 1 desimal, alltid mph (D28, D57): `130.6 mph`.
  public static func speed(_ mph: Double) throws -> String {
    try assertFinite(mph, "mph")
    let mag = magnitude(mph, 1)
    let sign = (!isZero(mag) && mph < 0) ? minus : ""
    return "\(sign)\(mag) mph"
  }
}
