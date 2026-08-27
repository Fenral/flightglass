/// Bit-eksakte reproduksjoner av JS-primitiver som IKKE har samme tallverdi i
/// Swift sitt standardbibliotek.
///
/// Referanseimplementasjonen (D71) kjører på V8. Der V8 og Swift regner ulikt,
/// er det V8 som er fasit — fixturen ble generert av V8.

public enum JSMath {

  /// `Math.hypot` slik V8 faktisk implementerer den.
  ///
  /// ⚠ DETTE ER IKKE `sqrt(x² + y² + z²)`, OG IKKE C-BIBLIOTEKETS `hypot`.
  ///
  /// V8 (`src/builtins/math.tq`, `MathHypot`) normaliserer mot største
  /// absoluttverdi og summerer kvadratene med **Kahan-kompensasjon**:
  ///
  /// ```
  /// max = maks(|xᵢ|)
  /// for hver i:  n = |xᵢ| / max
  ///              summand    = n·n − compensation
  ///              preliminary = sum + summand
  ///              compensation = (preliminary − sum) − summand
  ///              sum = preliminary
  /// return sqrt(sum) · max
  /// ```
  ///
  /// `engine/README.md` måler forskjellen på `spinAxisUnit`:
  ///
  /// | Variant                          | Bit-eksakte caser |
  /// |----------------------------------|-------------------|
  /// | hypot3 + multipliser med invers  | 4999 / 4999       |
  /// | hypot3 + divider                 | 2464 / 4999       |
  /// | sqrt(sum) + multipliser          | 3373 / 4999       |
  /// | sqrt(sum) + divider              | 1652 / 4999       |
  ///
  /// Algoritmen er verifisert mot Node 24.14.1 i denne porten: 0 avvik på
  /// 400 000 tilfeldige tripler og 0 avvik på kantverdiene
  /// (`0,0,0` · `1e300,1e300,1e300` · `5e-324,5e-324,0` · `1e-8,1e8,1`).
  /// Naiv `sqrt`-sum avvek i 141 462 av de samme 400 000.
  ///
  /// C-bibliotekets `hypot(x, y)` tar dessuten bare to argumenter, så
  /// tre-argumentsformen finnes ikke å låne noe sted.
  @inlinable
  public static func hypot(_ values: [Double]) -> Double {
    var max = 0.0
    var oneArgIsNaN = false

    // V8 lagrer absoluttverdiene i et eget array før summasjonen. Vi gjør det
    // samme framfor å regne `abs` to ganger — rekkefølgen på operasjonene er
    // det som betyr noe.
    var abs = [Double](repeating: 0, count: values.count)
    for i in values.indices {
      let v = values[i]
      if v.isNaN {
        oneArgIsNaN = true
      } else {
        let a = Swift.abs(v)
        abs[i] = a
        if a > max { max = a }
      }
    }

    if max == .infinity { return .infinity }
    if oneArgIsNaN { return .nan }
    if max == 0 { return 0 }

    var sum = 0.0
    var compensation = 0.0
    for i in abs.indices {
      let n = abs[i] / max
      let summand = n * n - compensation
      let preliminary = sum + summand
      compensation = (preliminary - sum) - summand
      sum = preliminary
    }
    return sum.squareRoot() * max
  }

  /// To-argumentsformen. Samme algoritme — V8 skiller ikke på antall.
  @inlinable
  public static func hypot(_ x: Double, _ y: Double) -> Double {
    hypot([x, y])
  }

  /// Tre-argumentsformen, som er den geometrien faktisk bruker.
  @inlinable
  public static func hypot(_ x: Double, _ y: Double, _ z: Double) -> Double {
    hypot([x, y, z])
  }

  /// `Math.sign`. Swift har ingen direkte ekvivalent som returnerer `Double`
  /// og bevarer `-0` og `NaN` slik JS gjør.
  ///
  /// JS: `Math.sign(-0) === -0`, `Math.sign(NaN)` er `NaN`.
  /// Swift `Double.sign` er en enum og `signum()` finnes ikke på `Double`.
  @inlinable
  public static func sign(_ x: Double) -> Double {
    if x.isNaN { return .nan }
    if x == 0 { return x }  // bevarer bade +0 og -0
    return x < 0 ? -1 : 1
  }

  /// `Math.min`. ⚠ IKKE det samme som Swift sin `min`.
  ///
  /// Swift definerer `min(x, y)` som `y < x ? y : x`. Med `x = 5, y = NaN` gir
  /// `NaN < 5` false, og resultatet blir **5**. JS gir `NaN`.
  ///
  /// | uttrykk               | JS    | Swift `min` |
  /// |-----------------------|-------|-------------|
  /// | `min(NaN, 5)`         | NaN   | NaN         |
  /// | `min(5, NaN)`         | NaN   | **5**       |
  ///
  /// Fixturen inneholder ingen NaN, så forskjellen er usynlig der. Men
  /// motorkontrakten sier «NaN inn gir NaN ut», og en clamp som svelger NaN
  /// ville gjort en ugyldig levering til et plausibelt tall i stedet for et
  /// synlig NaN. Det er verre enn å feile.
  ///
  /// `Math.min(+0, -0)` er `-0`; det følger av `y < x`-testen i JS-spekken og
  /// er reprodusert her.
  @inlinable
  public static func min(_ x: Double, _ y: Double) -> Double {
    if x.isNaN || y.isNaN { return .nan }
    if x == 0 && y == 0 {
      // Begge er null: JS returnerer -0 hvis en av dem er -0.
      return x.sign == .minus ? x : y
    }
    return y < x ? y : x
  }

  /// `Math.max`. Samme felle som `min`, speilvendt.
  /// `Math.max(+0, -0)` er `+0`.
  @inlinable
  public static func max(_ x: Double, _ y: Double) -> Double {
    if x.isNaN || y.isNaN { return .nan }
    if x == 0 && y == 0 {
      return x.sign == .plus ? x : y
    }
    return y > x ? y : x
  }

  /// `clamp(value, lo, hi)` slik motoren skriver den: `min(max(v, lo), hi)`.
  ///
  /// Rekkefølgen er JS-motorens egen. For endelige tall er den identisk med
  /// `max(lo, min(v, hi))`, så baseline er ikke følsom for valget — men den
  /// står slik kilden har den, ikke slik den kunne vært skrevet.
  @inlinable
  public static func clamp(_ value: Double, _ minimum: Double, _ maximum: Double) -> Double {
    min(max(value, minimum), maximum)
  }
}
