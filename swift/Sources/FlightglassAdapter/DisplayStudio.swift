import FlightglassEngine

/// VISNINGSADAPTER FOR IMPACT STUDIO — D65/D66/D67 pluss eierens presisering
/// av akseordene (2026-08-25, strøm B).
///
/// Portert fra `adapter/src/displayStudio.js`.
///
/// - Langsgående akse (ball position, low point, entry/exit):
///   `before` / `after` — bransjebegrepet fra launch monitor-litteraturen.
///   Positiv retning er målsiden, som motorens `+x = target`.
/// - Vertikal akse mot bakkeplanet (arc height): `above` / `below`.
/// - Vertikal akse på slagflaten (treffpunkt): `high` / `low` — matcher
///   Low/Centre/High-båndene fra `StrikeBand`.
///
/// Prinsippet er D29/D67: avstander bærer ord, aldri nakent fortegn.
/// Desimaler (D67): mm 1 · cm 1. Unntak: lie-presetene vises som heltall —
/// definerte konstanter, ikke målinger; `8.0 mm` ville påstått en
/// målepresisjon som ikke finnes.
///
/// Ordet avgjøres av verdien ETTER avrunding: en verdi som runder til 0.0
/// vises uten retningsord — `0.0 cm`, aldri `0.0 cm after`.
///
/// Studios mm/cm-verdier er enhetsuavhengige (D57) — ingen unitSystem her.
public enum DisplayStudio {

  private static func assertFinite(_ value: Double, _ name: String) throws {
    guard value.isFinite else {
      throw Format.ContractError.nonFinite(name: name, value: value)
    }
  }

  private static func isZero(_ magnitudeText: String) -> Bool {
    !magnitudeText.contains(where: { $0 != "0" && $0 != "." })
  }

  /// Langsgående avstand i centimeter — `10.5 cm after` · `3.0 cm before` ·
  /// `0.0 cm`. Positiv = målsiden.
  public static func longitudinalCm(_ cm: Double) throws -> String {
    try assertFinite(cm, "cm")
    let mag = JSNumber.toFixedAbs(cm, 1)
    if isZero(mag) { return "0.0 cm" }
    return "\(mag) cm \(cm > 0 ? "after" : "before")"
  }

  /// Samme akse, meter inn — motorens `effectiveLowPointX`, `groundEntry.x`
  /// er meter. Konverteringen (× 100) bor HER, aldri i UI.
  public static func longitudinalMetres(_ metres: Double) throws -> String {
    try assertFinite(metres, "metres")
    return try longitudinalCm(metres * 100)
  }

  /// Vertikal avstand mot bakkeplanet i centimeter — `2.0 cm above` ·
  /// `2.0 cm below` · `0.0 cm`. Positiv = over bakkeplanet.
  public static func heightCm(_ cm: Double) throws -> String {
    try assertFinite(cm, "cm")
    let mag = JSNumber.toFixedAbs(cm, 1)
    if isZero(mag) { return "0.0 cm" }
    return "\(mag) cm \(cm > 0 ? "above" : "below")"
  }

  /// Treffpunktets avvik fra sweetspoten i millimeter (D24, absoluttmålet) —
  /// `16.6 mm low` · `2.1 mm high` · `0.0 mm`. Positiv = over sweetspoten.
  public static func faceOffsetMm(_ mm: Double) throws -> String {
    try assertFinite(mm, "mm")
    let mag = JSNumber.toFixedAbs(mm, 1)
    if isZero(mag) { return "0.0 mm" }
    return "\(mag) mm \(mm > 0 ? "high" : "low")"
  }

  /// Lie-preset i millimeter — heltall fordi presetene er definisjoner
  /// (D66), ikke målinger: `8 mm` · `30 mm` · `0 mm`.
  /// JS: `Math.round(mm)` — half mot +∞, tro portert i `JSNumber.round`.
  public static func lieMm(_ mm: Double) throws -> String {
    try assertFinite(mm, "mm")
    return "\(Int(JSNumber.round(mm))) mm"
  }
}
