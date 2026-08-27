import Foundation  // String(format:) — printf-broen toFixed bygger på

/// Bit-tro reproduksjon av JS `Number.prototype.toFixed` — formatlagets
/// eneste tallmotor.
///
/// ⚠ `toFixed` ER IKKE `String(format: "%.1f")`.
///
/// ECMA-262 velger `n` slik at `n / 10^f − x` er nærmest null, og ved EKSAKT
/// uavgjort velges den STØRRE `n` (half-up). C-`printf` runder half-even.
/// Målt i Node 24.14.1:
///
/// | verdi | `toFixed` | `printf` |
/// |---|---|---|
/// | `(0.25).toFixed(1)` | `"0.3"` | `"0.2"` |
/// | `(1.005).toFixed(2)` | `"1.00"` (doublen er 1.00499…) | `"1.00"` |
///
/// Avgjørelsen skjer på doublens EKSAKTE desimalekspansjon — ikke på den
/// avrundede visningen. Implementasjonen henter 25 korrekt avrundede
/// desimaler fra `printf` (godt forbi enhver ULP for verdiene formatlaget
/// ser; de eneste doublene som printer `…5000…0` på posisjon ≤ 4 er eksakte
/// uavgjorte) og anvender half-up manuelt med mente.
enum JSNumber {

  /// `Math.abs(value).toFixed(decimals)` — formatlaget kaller den alltid på
  /// absoluttverdien, så bare ikke-negative verdier støttes her.
  static func toFixedAbs(_ value: Double, _ decimals: Int) -> String {
    precondition(decimals >= 0 && decimals <= 6, "utenfor formatlagets behov")
    let magnitude = abs(value)

    // 25 korrekt avrundede desimaler — langt forbi ULP for våre verdier.
    let expanded = String(format: "%.25f", magnitude)
    let parts = expanded.split(separator: ".", maxSplits: 1)
    var integerDigits = Array(parts[0].utf8)
    var fractionDigits = Array(parts[1].utf8)

    // Half-up på første forkastede siffer.
    let zero = UInt8(ascii: "0")
    let five = UInt8(ascii: "5")
    let nine = UInt8(ascii: "9")

    let roundUp = fractionDigits.count > decimals && fractionDigits[decimals] >= five
    fractionDigits.removeSubrange(decimals...)

    if roundUp {
      var carry = true
      var i = fractionDigits.count - 1
      while carry && i >= 0 {
        if fractionDigits[i] == nine {
          fractionDigits[i] = zero
        } else {
          fractionDigits[i] += 1
          carry = false
        }
        i -= 1
      }
      if carry {
        var j = integerDigits.count - 1
        while carry && j >= 0 {
          if integerDigits[j] == nine {
            integerDigits[j] = zero
          } else {
            integerDigits[j] += 1
            carry = false
          }
          j -= 1
        }
        if carry { integerDigits.insert(UInt8(ascii: "1"), at: 0) }
      }
    }

    let head = String(decoding: integerDigits, as: UTF8.self)
    if decimals == 0 { return head }
    return head + "." + String(decoding: fractionDigits, as: UTF8.self)
  }

  /// JS `Math.round` for ikke-negative verdier (spinnformatereren kaller den
  /// på `Math.abs(rpm)`): half-up. For positive tall er
  /// `.toNearestOrAwayFromZero` det samme.
  static func roundAbs(_ value: Double) -> Double {
    abs(value).rounded(.toNearestOrAwayFromZero)
  }

  /// JS `Math.round` for signerte verdier: half mot +∞, IKKE away-from-zero.
  /// `Math.round(-2.5)` er `-2` i JS; `.toNearestOrAwayFromZero` ville gitt
  /// `-3`. Halvdelene avgjøres på den eksakte verdien (`fraction == 0.5` er
  /// bare mulig når doublen ER en eksakt halv).
  static func round(_ value: Double) -> Double {
    let floor = value.rounded(.down)
    let fraction = value - floor
    if fraction == 0.5 { return floor + 1 }
    return value.rounded(.toNearestOrAwayFromZero)
  }
}
