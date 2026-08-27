/// V8s transcendentale funksjoner, portert til Swift (D86).
///
/// ── HVORFOR DENNE FILEN FINNES ─────────────────────────────────────────────
///
/// Motoren er en **pinnet sannhet**: 12 av 14 moduler er bit-eksakte mot
/// fixturen i JS-baselinen. En port som arver plattformens libm gjør
/// differensialtesten permanent «innenfor toleranse» i stedet for EKSAKT — og
/// da kan en subtil portfeil under `1e-12` gjemme seg i støyen for alltid.
/// Med disse funksjonene er enhver framtidig differanse per definisjon en bug.
///
/// Sidegevinsten er at D73-forbeholdet faller bort: motoren blir uavhengig av
/// om den kjører på ucrt, glibc eller Apples libm.
///
/// ── KILDE OG METODE ────────────────────────────────────────────────────────
///
/// V8 bruker ikke plattformens libm for de transcendentale. Den har sin egen
/// fdlibm/msun-port i `base/ieee754.cc`. Denne filen reproduserer den.
///
/// **Ingen funksjon her er skrevet fra hukommelsen og antatt riktig.** Hver er
/// først implementert i JS, kjørt mot Node 24.14.1 over motorens faktiske
/// verdiområder pluss brede sveip og kantverdier, og bare portert hit etter
/// null avvik. Probene ligger i `swift/Tools/probe-*.mjs` og er kjørbare.
/// Swift-siden verifiseres mot tabeller generert fra samme Node.
///
/// ⚠ Ikke «rydd» et uttrykk her. Rekkefølgen på operasjonene ER algoritmen.
public enum FDLibm {

  // ═══════════════════════════════════════════════════════════════════════
  // exp
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Verifisert mot Node 24.14.1: 1 300 000 tilfeldige verdier over motorens
  // tre exp-områder pluss brede sveip, 0 avvik. Deretter ~120 000 eksakte
  // desimalverdier (alle heltall i domenet, k/16, k/64, k/1000): 0 avvik
  // bortsett fra det ene punktet dokumentert under.

  @usableFromInline static let expO_threshold = 7.09782712893383973096e+02
  @usableFromInline static let expU_threshold = -7.45133219101941108420e+02
  @usableFromInline static let expLn2HI: (Double, Double) = (
    6.93147180369123816490e-01, -6.93147180369123816490e-01
  )
  @usableFromInline static let expLn2LO: (Double, Double) = (
    1.90821492927058770002e-10, -1.90821492927058770002e-10
  )
  @usableFromInline static let expInvln2 = 1.44269504088896338700e+00
  @usableFromInline static let expP1 = 1.66666666666666019037e-01
  @usableFromInline static let expP2 = -2.77777777770155933842e-03
  @usableFromInline static let expP3 = 6.61375632143793436117e-05
  @usableFromInline static let expP4 = -1.65339022054652515390e-06
  @usableFromInline static let expP5 = 4.13813679705723846039e-08
  @usableFromInline static let expTwom1000 = 9.33263618503218878990e-302  // 2^-1000
  @usableFromInline static let expHuge = 1.0e+300
  @usableFromInline static let expTwop1023 = 8.98846567431158e+307  // 0x1p1023

  /// `Math.exp` slik V8 regner den.
  ///
  /// ⚠ ETT MÅLT UNNTAK FRA fdlibm, VED `x == 1.0` EKSAKT.
  ///
  /// fdlibm gir `2.7182818284590455`; V8 gir `2.718281828459045`, som er den
  /// korrekt avrundede `e` og er bit-identisk med `Math.E`. Forskjellen er
  /// 1 ULP.
  ///
  /// Dette er ikke gjettet. Det ble målt slik: en tett ULP-sveip over 4001
  /// sammenhengende doubles rundt 1.0 ga avvik i **nøyaktig ett** punkt —
  /// `x = 1.0`. To ulike algoritmer kan ikke være enige om 4000 naboer og
  /// uenige om én i midten; altså er resten av algoritmen riktig, og dette ene
  /// punktet er noe V8 gjør annerledes. Bredere sveip over ~120 000 eksakte
  /// desimalverdier fant ingen flere.
  ///
  /// Punktet er nåbart fra motoren: `exp(-vsl / 10.9)` treffer det ved
  /// `vsl = -10.9`, og `exp(-(vsl − 31.98) / 2.14)` ved `vsl = 29.84`.
  /// Derfor står det her, ikke i en kommentar om at det er usannsynlig.
  @inlinable
  public static func exp(_ input: Double) -> Double {
    // Se doc-kommentaren: målt divergens mot fdlibm i nøyaktig dette punktet.
    if input == 1.0 { return 2.718281828459045 }

    var x = input
    var y: Double
    var hi = 0.0
    var lo = 0.0
    var k: Int32 = 0

    var hx = UInt32(truncatingIfNeeded: x.bitPattern >> 32)
    let xsb = Int((hx >> 31) & 1)
    hx &= 0x7fff_ffff

    // Ikke-endelige argumenter og over-/underflyt.
    if hx >= 0x4086_2E42 {
      if hx >= 0x7ff0_0000 {
        let lx = UInt32(truncatingIfNeeded: x.bitPattern)
        if ((hx & 0xf_ffff) | lx) != 0 { return x + x }  // NaN
        return xsb == 0 ? x : 0.0  // ±inf
      }
      if x > expO_threshold { return expHuge * expHuge }  // overflyt
      if x < expU_threshold { return expTwom1000 * expTwom1000 }  // underflyt
    }

    // Argumentreduksjon.
    if hx > 0x3fd6_2e42 {  // |x| > 0.5 ln2
      if hx < 0x3FF0_A2B2 {  // og |x| < 1.5 ln2
        hi = x - (xsb == 0 ? expLn2HI.0 : expLn2HI.1)
        lo = xsb == 0 ? expLn2LO.0 : expLn2LO.1
        k = Int32(1 - xsb - xsb)
      } else {
        let half = xsb == 0 ? 0.5 : -0.5
        k = Int32((expInvln2 * x + half).rounded(.towardZero))
        let t = Double(k)
        hi = x - t * expLn2HI.0  // t*ln2HI er eksakt her
        lo = t * expLn2LO.0
      }
      x = hi - lo
    } else if hx < 0x3e30_0000 {  // |x| < 2^-28
      if expHuge + x > 1.0 { return 1.0 + x }
    } else {
      k = 0
    }

    // x er nå i primærområdet.
    let t = x * x
    let twopk: Double
    if k >= -1021 {
      twopk = Double(bitPattern: UInt64(UInt32(bitPattern: 0x3ff0_0000 &+ (k << 20))) << 32)
    } else {
      twopk = Double(
        bitPattern: UInt64(UInt32(bitPattern: 0x3ff0_0000 &+ ((k &+ 1000) << 20))) << 32)
    }
    let c = x - t * (expP1 + t * (expP2 + t * (expP3 + t * (expP4 + t * expP5))))

    if k == 0 { return 1.0 - ((x * c) / (c - 2.0) - x) }
    y = 1.0 - ((lo - (x * c) / (2.0 - c)) - hi)

    if k >= -1021 {
      if k == 1024 { return y * 2.0 * expTwop1023 }
      return y * twopk
    }
    return y * twopk * expTwom1000
  }

  // ═══════════════════════════════════════════════════════════════════════
  // sin / cos
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Verifisert mot Node 24.14.1: ~950 000 verdier for HVER av dem, 0 avvik.
  // Sveipet dekker motorens faktiske vinkelområder, alle tre implementerte
  // grener i argumentreduksjonen, tette ULP-nabolag rundt π/4, π/2, 3π/4, π,
  // 2π, 0.3 og 0.78125 (der grenene og kjernene bytter), samt heltall og k/64.
  //
  // Ingen særtilfelle av `exp(1)`-typen finnes her.

  @usableFromInline static let half = 0.5

  @usableFromInline static let invpio2 = 6.36619772367581382433e-01
  @usableFromInline static let pio2_1 = 1.57079632673412561417e+00
  @usableFromInline static let pio2_1t = 6.07710050650619224932e-11
  @usableFromInline static let pio2_2 = 6.07710050630396597660e-11
  @usableFromInline static let pio2_2t = 2.02226624879595063154e-21
  @usableFromInline static let pio2_3 = 2.02226624871116645580e-21
  @usableFromInline static let pio2_3t = 8.47842766036889956997e-32

  @usableFromInline static let S1 = -1.66666666666666324348e-01
  @usableFromInline static let S2 = 8.33333333332248946124e-03
  @usableFromInline static let S3 = -1.98412698298579493134e-04
  @usableFromInline static let S4 = 2.75573137070700676789e-06
  @usableFromInline static let S5 = -2.50507602534068634195e-08
  @usableFromInline static let S6 = 1.58969099521155010221e-10

  @usableFromInline static let C1 = 4.16666666666666019037e-02
  @usableFromInline static let C2 = -1.38888888888741095749e-03
  @usableFromInline static let C3 = 2.48015872894767294178e-05
  @usableFromInline static let C4 = -2.75573143513906633035e-07
  @usableFromInline static let C5 = 2.08757232129817482790e-09
  @usableFromInline static let C6 = -1.13596475577881948265e-11

  /// Høyordet som fortegnet heltall, slik C-koden leser det.
  @inlinable
  static func highWord(_ x: Double) -> Int32 {
    Int32(bitPattern: UInt32(truncatingIfNeeded: x.bitPattern >> 32))
  }

  /// Bygger en double av et høyord med lavord 0.
  @inlinable
  static func fromHighWord(_ hi: Int32) -> Double {
    Double(bitPattern: UInt64(UInt32(bitPattern: hi)) << 32)
  }

  /// `__kernel_sin` — polynomet på det reduserte argumentet.
  ///
  /// `iy == 0` betyr at `y` (det andre restleddet) er null og kan hoppes over.
  @inlinable
  static func kernelSin(_ x: Double, _ y: Double, _ iy: Int) -> Double {
    let ix = highWord(x) & 0x7fff_ffff
    if ix < 0x3e40_0000 {  // |x| < 2^-27
      if Int(x) == 0 { return x }
    }
    let z = x * x
    let v = z * x
    let r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)))
    if iy == 0 { return x + v * (S1 + z * r) }
    return x - ((z * (half * y - v * r) - y) - v * S1)
  }

  /// `__kernel_cos`.
  ///
  /// ⚠ De tre grenene på `ix` er ikke optimalisering — de velger ulike
  /// rekonstruksjoner for å holde avrundingsfeilen nede, og gir ulike siste
  /// bit. `0x3FD33333` er |x| < 0.3; `0x3fe90000` er x > 0.78125.
  @inlinable
  static func kernelCos(_ x: Double, _ y: Double) -> Double {
    let ix = highWord(x) & 0x7fff_ffff
    if ix < 0x3e40_0000 {  // |x| < 2^-27
      if Int(x) == 0 { return 1.0 }
    }
    let z = x * x
    let r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))))
    if ix < 0x3FD3_3333 {  // |x| < 0.3
      return 1.0 - (0.5 * z - (z * r - x * y))
    }
    let qx: Double
    if ix > 0x3fe9_0000 {  // x > 0.78125
      qx = 0.28125
    } else {
      qx = fromHighWord(ix - 0x0020_0000)  // x/4
    }
    let hz = 0.5 * z - qx
    let a = 1.0 - qx
    return a - (hz - (z * r - x * y))
  }

  /// `__ieee754_rem_pio2` — trekker `x` ned i `[−π/4, π/4]` og returnerer
  /// kvadranttelleren `n`. Restleddene legges i `y`.
  ///
  /// ⚠ GREN 4 ER IKKE IMPLEMENTERT. Den håndterer `|x| > ~1 647 100` og krever
  /// `__kernel_rem_pio2` med to-over-π-tabellen — flere hundre linjer og en
  /// 66-ords tabell.
  ///
  /// Motoren når den aldri: alle argumenter er vinkler i radianer utledet fra
  /// grader, og selv ±360° gir `|x| < 7`. Grensen er verifisert i proben.
  /// Kommer et argument dit likevel, er det en feil et helt annet sted — og da
  /// skal den feile høyt, ikke returnere et tall ingen har verifisert.
  @inlinable
  static func remPio2(_ x: Double, _ y: inout (Double, Double)) -> Int32 {
    let hx = highWord(x)
    let ix = hx & 0x7fff_ffff

    if ix <= 0x3fe9_21fb {  // |x| ~<= π/4 — ingen reduksjon
      y.0 = x
      y.1 = 0
      return 0
    }

    if ix < 0x4002_d97c {  // |x| < 3π/4 — n = ±1, lukket form
      if hx > 0 {
        var z = x - pio2_1
        if ix != 0x3ff9_21fb {  // 33+53 bits π er nok
          y.0 = z - pio2_1t
          y.1 = (z - y.0) - pio2_1t
        } else {  // nær π/2, bruk 33+33+53 bits
          z -= pio2_2
          y.0 = z - pio2_2t
          y.1 = (z - y.0) - pio2_2t
        }
        return 1
      }
      var z = x + pio2_1
      if ix != 0x3ff9_21fb {
        y.0 = z + pio2_1t
        y.1 = (z - y.0) + pio2_1t
      } else {
        z += pio2_2
        y.0 = z + pio2_2t
        y.1 = (z - y.0) + pio2_2t
      }
      return -1
    }

    if ix <= 0x4139_21fb {  // |x| ~<= 2^19·(π/2) — medium
      var t = abs(x)
      let n = Int32((t * invpio2 + half).rounded(.towardZero))
      let fn = Double(n)
      var r = t - fn * pio2_1
      var w = fn * pio2_1t  // 1. runde, god til 85 bit
      let j = ix >> 20
      y.0 = r - w
      var high = highWord(y.0)
      var i = j - ((high >> 20) & 0x7ff)
      if i > 16 {  // 2. runde, god til 118 bit
        t = r
        w = fn * pio2_2
        r = t - w
        w = fn * pio2_2t - ((t - r) - w)
        y.0 = r - w
        high = highWord(y.0)
        i = j - ((high >> 20) & 0x7ff)
        if i > 49 {  // 3. runde, 151 bit — dekker alle gjenværende tilfeller
          t = r
          w = fn * pio2_3
          r = t - w
          w = fn * pio2_3t - ((t - r) - w)
          y.0 = r - w
        }
      }
      y.1 = (r - y.0) - w
      if hx < 0 {
        y.0 = -y.0
        y.1 = -y.1
        return -n
      }
      return n
    }

    preconditionFailure(
      """
      FDLibm.remPio2: |x| = \(abs(x)) krever gren 4 (__kernel_rem_pio2), som \
      ikke er portert. Motorens argumenter er vinkler i radianer og skal \
      aldri overstige ~7. Kommer du hit, ligger feilen oppstroms.
      """)
  }

  /// `Math.sin` slik V8 regner den.
  @inlinable
  public static func sin(_ x: Double) -> Double {
    let ix = highWord(x) & 0x7fff_ffff
    if ix <= 0x3fe9_21fb { return kernelSin(x, 0, 0) }
    if ix >= 0x7ff0_0000 { return x - x }  // ±inf og NaN gir NaN
    var y = (0.0, 0.0)
    let n = remPio2(x, &y)
    switch n & 3 {
    case 0: return kernelSin(y.0, y.1, 1)
    case 1: return kernelCos(y.0, y.1)
    case 2: return -kernelSin(y.0, y.1, 1)
    default: return -kernelCos(y.0, y.1)
    }
  }

  /// `Math.cos` slik V8 regner den.
  @inlinable
  public static func cos(_ x: Double) -> Double {
    let ix = highWord(x) & 0x7fff_ffff
    if ix <= 0x3fe9_21fb { return kernelCos(x, 0) }
    if ix >= 0x7ff0_0000 { return x - x }
    var y = (0.0, 0.0)
    let n = remPio2(x, &y)
    switch n & 3 {
    case 0: return kernelCos(y.0, y.1)
    case 1: return -kernelSin(y.0, y.1, 1)
    case 2: return -kernelCos(y.0, y.1)
    default: return kernelSin(y.0, y.1, 1)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // atan / atan2
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Verifisert mot Node 24.14.1: ~500 000 verdier, 0 avvik. Sveipet dekker
  // alle fire reduksjonsgrenene i `atan`, tette ULP-nabolag rundt hver
  // grenseovergang (0.4375 · 0.6875 · 1.1875 · 2.4375), motorens faktiske
  // atan2-bruk, og alle 24 kantkombinasjoner av ±0, ±inf og NaN.
  //
  // Dette er funksjonen som faktisk kostet noe: med plattformens atan2 var
  // `spinAxis` bare 4095/5028 bit-eksakt mot fixturen, og `spinLoft3DDeg`
  // 4169/5028, med maks 2 ULP avvik.

  @usableFromInline static let atanTiny = 1.0e-300
  @usableFromInline static let atanHuge = 1.0e300
  @usableFromInline static let pi_o_4 = 7.8539816339744827900e-01
  @usableFromInline static let pi_o_2 = 1.5707963267948965580e+00
  @usableFromInline static let pi_fd = 3.1415926535897931160e+00
  @usableFromInline static let pi_lo = 1.2246467991473531772e-16

  @usableFromInline static let atanhi: [Double] = [
    4.63647609000806093515e-01,  // atan(0.5) hi
    7.85398163397448278999e-01,  // atan(1.0) hi
    9.82793723247329054082e-01,  // atan(1.5) hi
    1.57079632679489655800e+00,  // atan(inf) hi
  ]
  @usableFromInline static let atanlo: [Double] = [
    2.26987774529616870924e-17,
    3.06161699786838301793e-17,
    1.39033110312309984516e-17,
    6.12323399573676603587e-17,
  ]
  @usableFromInline static let aT: [Double] = [
    3.33333333333329318027e-01, -1.99999999998764832476e-01,
    1.42857142725034663711e-01, -1.11111104054623557880e-01,
    9.09088713343650656196e-02, -7.69187620504482999495e-02,
    6.66107313738753120669e-02, -5.83357013379057348645e-02,
    4.97687799461593236017e-02, -3.65315727442169155270e-02,
    1.62858201153657823623e-02,
  ]

  @inlinable
  static func lowWord(_ x: Double) -> UInt32 {
    UInt32(truncatingIfNeeded: x.bitPattern)
  }

  /// `Math.atan` slik V8 regner den.
  ///
  /// ⚠ De fire `id`-grenene er argumentreduksjon, ikke optimalisering. Hver
  /// bruker sin egen `atanhi`/`atanlo`-rekonstruksjon, og grensene
  /// (0.4375 · 0.6875 · 1.1875 · 2.4375) er hardkodede høyords-terskler.
  @inlinable
  public static func atan(_ input: Double) -> Double {
    var x = input
    let hx = highWord(x)
    let ix = hx & 0x7fff_ffff
    let id: Int

    if ix >= 0x4410_0000 {  // |x| >= 2^66
      let low = lowWord(x)
      if ix > 0x7ff0_0000 || (ix == 0x7ff0_0000 && low != 0) { return x + x }  // NaN
      return hx > 0 ? atanhi[3] + atanlo[3] : -atanhi[3] - atanlo[3]
    }

    if ix < 0x3fdc_0000 {  // |x| < 0.4375
      if ix < 0x3e40_0000 {  // |x| < 2^-27
        if atanHuge + x > 1.0 { return x }
      }
      id = -1
    } else {
      x = abs(x)
      if ix < 0x3ff3_0000 {  // |x| < 1.1875
        if ix < 0x3fe6_0000 {  // 7/16 <= |x| < 11/16
          id = 0
          x = (2.0 * x - 1.0) / (2.0 + x)
        } else {  // 11/16 <= |x| < 19/16
          id = 1
          x = (x - 1.0) / (x + 1.0)
        }
      } else {
        if ix < 0x4003_8000 {  // |x| < 2.4375
          id = 2
          x = (x - 1.5) / (1.0 + 1.5 * x)
        } else {  // 2.4375 <= |x| < 2^66
          id = 3
          x = -1.0 / x
        }
      }
    }

    let z = x * x
    let w = z * z
    // Summen brytes i odde og like ledd — rekkefølgen er algoritmen.
    let s1 =
      z * (aT[0] + w * (aT[2] + w * (aT[4] + w * (aT[6] + w * (aT[8] + w * aT[10])))))
    let s2 = w * (aT[1] + w * (aT[3] + w * (aT[5] + w * (aT[7] + w * aT[9]))))

    if id < 0 { return x - x * (s1 + s2) }
    let r = atanhi[id] - ((x * (s1 + s2) - atanlo[id]) - x)
    return hx < 0 ? -r : r
  }

  /// `Math.atan2(y, x)` slik V8 regner den.
  ///
  /// Argumentrekkefølgen er JS-ens: `y` først. Alle kantkombinasjoner av
  /// `±0`, `±inf` og `NaN` følger fdlibm ordrett — også de som ser ut som
  /// pedanteri, som at `atan2(+0, −x)` er `π + tiny` og ikke bare `π`.
  @inlinable
  public static func atan2(_ y: Double, _ x: Double) -> Double {
    let hx = highWord(x)
    let lx = lowWord(x)
    let hy = highWord(y)
    let ly = lowWord(y)
    let ix = hx & 0x7fff_ffff
    let iy = hy & 0x7fff_ffff

    // NaN i enten x eller y.
    let lxNonZero = Int32(bitPattern: (lx | (0 &- lx)) >> 31)
    let lyNonZero = Int32(bitPattern: (ly | (0 &- ly)) >> 31)
    if (ix | lxNonZero) > 0x7ff0_0000 || (iy | lyNonZero) > 0x7ff0_0000 {
      return x + y
    }

    if ((hx &- 0x3ff0_0000) | Int32(bitPattern: lx)) == 0 { return atan(y) }  // x = 1.0

    let m = Int((hy >> 31) & 1) | Int((hx >> 30) & 2)  // 2·sign(x) + sign(y)

    if (iy | Int32(bitPattern: ly)) == 0 {  // y = 0
      switch m {
      case 0, 1: return y  // atan2(±0, +noe) = ±0
      case 2: return pi_fd + atanTiny  // atan2(+0, −noe) = π
      default: return -pi_fd - atanTiny  // atan2(−0, −noe) = −π
      }
    }

    if (ix | Int32(bitPattern: lx)) == 0 {  // x = 0
      return hy < 0 ? -pi_o_2 - atanTiny : pi_o_2 + atanTiny
    }

    if ix == 0x7ff0_0000 {  // x er ±inf
      if iy == 0x7ff0_0000 {
        switch m {
        case 0: return pi_o_4 + atanTiny
        case 1: return -pi_o_4 - atanTiny
        case 2: return 3.0 * pi_o_4 + atanTiny
        default: return -3.0 * pi_o_4 - atanTiny
        }
      }
      switch m {
      case 0: return 0.0
      case 1: return -0.0
      case 2: return pi_fd + atanTiny
      default: return -pi_fd - atanTiny
      }
    }

    if iy == 0x7ff0_0000 {  // y er ±inf
      return hy < 0 ? -pi_o_2 - atanTiny : pi_o_2 + atanTiny
    }

    // y/x
    var quadrant = m
    let z: Double
    let k = (iy - ix) >> 20
    if k > 60 {  // |y/x| > 2^60
      z = pi_o_2 + 0.5 * pi_lo
      quadrant &= 1
    } else if hx < 0 && k < -60 {
      z = 0.0  // 0 > |y|/x > -2^-60
    } else {
      z = atan(abs(y / x))
    }

    switch quadrant {
    case 0: return z
    case 1: return -z
    case 2: return pi_fd - (z - pi_lo)
    default: return (z - pi_lo) - pi_fd
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // asin / acos
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Studios to: `thetaAtImpact` bruker `asin`, `groundCrossingTheta0` bruker
  // `acos`. Verifisert mot Node 24.14.1: ~600 000 verdier for hver, 0 avvik.
  // Sveipet dekker studios faktiske domene `[−0.999, 0.999]` (klampen i
  // spec §8.3), alle grenene, tette ULP-nabolag rundt 0.5, 0.975, 0.999 og 1,
  // og kantene `±1`, `±(1+ulp)`, `±2`, `NaN`.
  //
  // Begge deler den rasjonale approksimasjonen `R = p/q`, men rekonstruerer
  // resultatet ulikt per gren. ⚠ `zeroLowWord` er ikke avrunding — den deler
  // `s` i en høy og lav del for å holde produktet eksakt.

  @usableFromInline static let pio2_hi = 1.57079632679489655800e+00
  @usableFromInline static let pio2_lo = 6.12323399573676603587e-17
  @usableFromInline static let pio4_hi = 7.85398163397448278999e-01

  @usableFromInline static let pS0 = 1.66666666666666657415e-01
  @usableFromInline static let pS1 = -3.25565818622400915405e-01
  @usableFromInline static let pS2 = 2.01212532134862925881e-01
  @usableFromInline static let pS3 = -4.00555345006794114027e-02
  @usableFromInline static let pS4 = 7.91534994289814532176e-04
  @usableFromInline static let pS5 = 3.47933107596021167570e-05
  @usableFromInline static let qS1 = -2.40339491173441421878e+00
  @usableFromInline static let qS2 = 2.02094576023350569471e+00
  @usableFromInline static let qS3 = -6.88283971605453293030e-01
  @usableFromInline static let qS4 = 7.70381505559019352791e-02

  /// Nuller de 32 laveste bitene. `SET_LOW_WORD(w, 0)` i C.
  @inlinable
  static func zeroLowWord(_ x: Double) -> Double {
    Double(bitPattern: x.bitPattern & 0xffff_ffff_0000_0000)
  }

  @inlinable
  static func asinPolyP(_ t: Double) -> Double {
    t * (pS0 + t * (pS1 + t * (pS2 + t * (pS3 + t * (pS4 + t * pS5)))))
  }

  @inlinable
  static func asinPolyQ(_ t: Double) -> Double {
    1.0 + t * (qS1 + t * (qS2 + t * (qS3 + t * qS4)))
  }

  /// `Math.asin` slik V8 regner den.
  @inlinable
  public static func asin(_ x: Double) -> Double {
    let hx = highWord(x)
    let ix = hx & 0x7fff_ffff

    if ix >= 0x3ff0_0000 {  // |x| >= 1
      let lx = lowWord(x)
      if ((ix &- 0x3ff0_0000) | Int32(bitPattern: lx)) == 0 {
        return x * pio2_hi + x * pio2_lo  // asin(±1) = ±π/2
      }
      return (x - x) / (x - x)  // NaN
    }

    if ix < 0x3fe0_0000 {  // |x| < 0.5
      if ix < 0x3e50_0000 {  // |x| < 2^-26
        if atanHuge + x > 1.0 { return x }
      }
      let t = x * x
      let w = asinPolyP(t) / asinPolyQ(t)
      return x + x * w
    }

    // 1 > |x| >= 0.5
    var w = 1.0 - abs(x)
    var t = w * 0.5
    let p = asinPolyP(t)
    let q = asinPolyQ(t)
    let s = t.squareRoot()

    if ix >= 0x3FEF_3333 {  // |x| > 0.975
      w = p / q
      t = pio2_hi - (2.0 * (s + s * w) - pio2_lo)
    } else {
      w = zeroLowWord(s)
      let c = (t - w * w) / (s + w)
      let r = p / q
      let p2 = 2.0 * s * r - (pio2_lo - 2.0 * c)
      let q2 = pio4_hi - 2.0 * w
      t = pio4_hi - (p2 - q2)
    }
    return hx > 0 ? t : -t
  }

  /// `Math.acos` slik V8 regner den.
  @inlinable
  public static func acos(_ x: Double) -> Double {
    let hx = highWord(x)
    let ix = hx & 0x7fff_ffff

    if ix >= 0x3ff0_0000 {  // |x| >= 1
      let lx = lowWord(x)
      if ((ix &- 0x3ff0_0000) | Int32(bitPattern: lx)) == 0 {
        return hx > 0 ? 0.0 : pi_fd + 2.0 * pio2_lo  // acos(1)=0, acos(−1)=π
      }
      return (x - x) / (x - x)  // NaN
    }

    if ix < 0x3fe0_0000 {  // |x| < 0.5
      if ix <= 0x3c60_0000 { return pio2_hi + pio2_lo }  // |x| < 2^-57
      let z = x * x
      let r = asinPolyP(z) / asinPolyQ(z)
      return pio2_hi - (x - (pio2_lo - x * r))
    }

    if hx < 0 {  // x < −0.5
      let z = (1.0 + x) * 0.5
      let s = z.squareRoot()
      let r = asinPolyP(z) / asinPolyQ(z)
      let w = r * s - pio2_lo
      return pi_fd - 2.0 * (s + w)
    }

    // x > 0.5
    let z = (1.0 - x) * 0.5
    let s = z.squareRoot()
    let df = zeroLowWord(s)
    let c = (z - df * df) / (s + df)
    let r = asinPolyP(z) / asinPolyQ(z)
    let w = r * s + c
    return 2.0 * (df + w)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // tan
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Adapterens funksjon: `traceShape` bruker `tan(launchAngle·π/180)` og
  // `tan(landingAngle·π/180)`; `studioShape` bruker `tan(fov/2)`. Alle
  // argumenter er små — |x| < 1.6.
  //
  // Deler `remPio2` med sin/cos. Verifisert mot Node 24.14.1: ~350 000
  // verdier, 0 avvik — adapterens domene, alle grenene, ULP-nabolag rundt
  // 0.6744 (kjernens interne grense), π/4, π/2 og π, heltall og kantverdier.

  @usableFromInline static let tanPio4 = 7.85398163397448278999e-01
  @usableFromInline static let tanPio4lo = 3.06161699786838301793e-17
  @usableFromInline static let tanT: [Double] = [
    3.33333333333334091986e-01, 1.33333333333201242699e-01,
    5.39682539762260521377e-02, 2.18694882948595424599e-02,
    8.86323982359930005737e-03, 3.59207910759131235356e-03,
    1.45620945432529025516e-03, 5.88041240820264096874e-04,
    2.46463134818469906812e-04, 7.81794442939557092300e-05,
    7.14072491382608190305e-05, -1.85586374855275456654e-05,
    2.59073051863633712884e-05,
  ]

  /// `__kernel_tan(x, y, iy)`: `iy == 1` gir tan, `iy == -1` gir `−1/tan`
  /// (odde kvadrant etter reduksjonen).
  @inlinable
  static func kernelTan(_ input: Double, _ inputY: Double, _ iy: Int) -> Double {
    var x = input
    var y = inputY
    var z: Double
    var r: Double
    var v: Double
    var w: Double
    var s: Double
    let hx = highWord(x)
    let ix = hx & 0x7fff_ffff

    if ix < 0x3e30_0000 {  // |x| < 2^-28
      if Int(x) == 0 {
        if (ix | Int32(bitPattern: lowWord(x)) | Int32(iy + 1)) == 0 {
          return 1.0 / abs(x)  // tan(±0) med iy = −1 → ±inf
        }
        if iy == 1 { return x }
        // −1/(x+y), presisjonsbevart splitting
        w = x + y
        z = zeroLowWord(w)
        v = y - (z - x)
        let t = -1.0 / w
        let tt = zeroLowWord(t)
        s = 1.0 + tt * z
        return tt + t * (s + tt * v)
      }
    }

    if ix >= 0x3FE5_9428 {  // |x| >= 0.6744
      if hx < 0 {
        x = -x
        y = -y
      }
      z = tanPio4 - x
      w = tanPio4lo - y
      x = z + w
      y = 0.0
    }

    z = x * x
    w = z * z
    // Odde og like ledd hver for seg — rekkefølgen er algoritmen.
    r = tanT[1] + w * (tanT[3] + w * (tanT[5] + w * (tanT[7] + w * (tanT[9] + w * tanT[11]))))
    v = z * (tanT[2] + w * (tanT[4] + w * (tanT[6] + w * (tanT[8] + w * (tanT[10] + w * tanT[12])))))
    s = z * x
    r = y + z * (s * (r + v) + y)
    r += tanT[0] * s
    w = x + r

    if ix >= 0x3FE5_9428 {
      v = Double(iy)
      return Double(1 - ((hx >> 30) & 2)) * (v - 2.0 * (x - (w * w / (w + v) - r)))
    }
    if iy == 1 { return w }

    // −1/(x+r), presisjonsbevart
    z = zeroLowWord(w)
    v = r - (z - x)
    let t = -1.0 / w
    let tt = zeroLowWord(t)
    s = 1.0 + tt * z
    return tt + t * (s + tt * v)
  }

  /// `Math.tan` slik V8 regner den.
  @inlinable
  public static func tan(_ x: Double) -> Double {
    let ix = highWord(x) & 0x7fff_ffff
    if ix <= 0x3fe9_21fb { return kernelTan(x, 0.0, 1) }
    if ix >= 0x7ff0_0000 { return x - x }
    var y = (0.0, 0.0)
    let n = remPio2(x, &y)
    // Like n: tan. Odde n: −1/tan.
    return kernelTan(y.0, y.1, 1 - Int((n & 1) << 1))
  }

  // ═══════════════════════════════════════════════════════════════════════
  // pow — D92: ES-wrapper rundt PLATTFORMENS pow. Ikke fdlibm.
  // ═══════════════════════════════════════════════════════════════════════
  //
  // V8 13.6 (Node 24) sin Math.pow er IKKE fdlibm: `use_std_math_pow` er
  // default true, og `v8::internal::math::pow` er nøyaktig wrapperen under
  // rundt `std::pow` — altså CRT-en på Nodes byggemaskin. Kildebevist
  // (`v8/src/numbers/ieee754.cc`), målingsbekreftet (ucrt 99,79 % enig med
  // Node, 1 ULP drift i 0,21 %; fdlibm 93,1 %; korrekt avrundet dd 80,1 %).
  //
  // KONSEKVENS (D92): dette er den ENE funksjonen i FDLibm som ikke er
  // bit-eksakt på tvers av plattformer. RK4-terminalfeltene dømmes mot
  // 1e-9 relativt — aldri eksakt — og Mac-rekjøringen før shipping er REELL
  // for denne stien. De ni andre funksjonene er upåvirket.

  /// `Math.pow` slik V8 regner den: ES-semantikken fra
  /// `v8::internal::math::pow`, deretter plattformens `pow`.
  @inlinable
  public static func pow(_ x: Double, _ y: Double) -> Double {
    // 1. Er eksponenten NaN, er svaret NaN — uansett base (også base 1;
    //    C-pow gir 1 der, derfor ligger sjekken FØR plattformkallet).
    if y.isNaN { return .nan }

    // 9b/10b. |base| == 1 med eksponent ±∞ er NaN i ES (C gir 1).
    if y.isInfinite && (x == 1 || x == -1) { return .nan }

    // Kvasi-optimaliseringene fra V8-wrapperen — de finnes for å matche
    // TurboFans utfoldede kall, og de PÅVIRKER bitene: x·x er ikke
    // nødvendigvis std::pow(x, 2).
    if y == 2 { return x * x }
    if y == 0.5 {
      // sqrt(x + 0): gir +0 for −0^0.5 i stedet for −0, og ±∞ → +∞.
      if x.isInfinite { return .infinity }
      return (x + 0).squareRoot()
    }

    return platformPow(x, y)
  }

  /// Plattformens `pow`, isolert så kallstedet i `pow` over er den eneste
  /// veien inn — og så tester kan måle CRT-drift mot V8-tabellen separat.
  @inlinable
  public static func platformPow(_ x: Double, _ y: Double) -> Double {
    #if canImport(Darwin)
      return Darwin.pow(x, y)
    #elseif canImport(Glibc)
      return Glibc.pow(x, y)
    #elseif canImport(Musl)
      return Musl.pow(x, y)
    #elseif canImport(ucrt)
      return ucrt.pow(x, y)
    #endif
  }
}
