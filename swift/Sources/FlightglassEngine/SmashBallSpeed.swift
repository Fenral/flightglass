/// §5.5 — Smash og Ball Speed.
///
/// BASELINE. Portert fra `engine/src/smashBallSpeed.js`. Fixturen er fasit.
/// Ren algebra — ingen libm, altså plattformuavhengig.
///
/// Tre felt eies her:
///
/// - `smashEff` — modellverdien. Kvadratisk i SPIN LOFT 3D, klampet til
///   `[1.15, 1.52]`. Uavhengig av clubSpeed; den er 1.4255… også når
///   clubSpeed er 0.
/// - `ballSpeed` — `clubSpeed × smashEff`, i mph.
/// - `smash` — `ballSpeed / clubSpeed`, altså smashEff etter en rundtur
///   gjennom én multiplikasjon og én divisjon. Det er IKKE det samme tallet:
///   i 372 av 5028 baseline-caser skiller de seg på siste bit. Behold
///   rundturen.
public enum SmashBallSpeed {

  /// Den uklampede smash-modellen. Eksponert fordi klampen fyrer ofte —
  /// 290 caser treffer gulvet på 1.15 og 127 taket på 1.52 i baseline.
  ///
  /// ⚠ ULP-FELLE, VERIFISERT MOT FIXTUREN I JS. Kvadratleddet må grupperes
  /// som `koeffisient × (SpinLoft × SpinLoft)`. Den venstreassosiative formen
  /// `(k × S) × S` avviker 1 ULP i 78 av 5028 caser. Ikke «rydd» bort
  /// mellomvariabelen.
  ///
  /// - Parameter spinLoftDeg: 3-D spin loft i grader (`spinLoft3DDeg`), IKKE
  ///   `signedVerticalSpinLoftDeg` (README-felle 9). De to skiller seg i
  ///   4392 av 5028 caser; med den vertikale blir 4122 caser feil.
  public static func smashEfficiencyRaw(spinLoftDeg: Double) -> Double {
    let spinLoftSquared = spinLoftDeg * spinLoftDeg
    return Constants.smashModelIntercept
      + Constants.smashSpinLoftLinear * spinLoftDeg
      + Constants.smashSpinLoftQuadratic * spinLoftSquared
  }

  /// `smashEff` — modellert smash-faktor, klampet til `[1.15, 1.52]`.
  public static func smashEfficiency(spinLoftDeg: Double) -> Double {
    JSMath.clamp(
      smashEfficiencyRaw(spinLoftDeg: spinLoftDeg),
      Constants.smashMinimum,
      Constants.smashMaximum)
  }

  /// `ballSpeed` — spec §5.5: `BallSpeed = ClubSpeed × smashEfficiency`.
  /// Inn og ut i mph; ingen enhetskonvertering skjer i §5.5.
  public static func ballSpeedFrom(clubSpeedMph: Double, smashEff: Double) -> Double {
    clubSpeedMph * smashEff
  }

  /// `smash` — det RAPPORTERTE forholdet, ikke modellverdien.
  ///
  /// Fixturens `_meta.units.smash`: «ratio; ballSpeed / clubSpeed, or 0 when
  /// clubSpeed is 0». Vakten er nødvendig: uten den gir clubSpeed 0 en
  /// `0/0 = NaN`, og fixturen inneholder ikke ett eneste ikke-endelig tall.
  ///
  /// ⚠ Divisjonen er ikke overflødig. Rundturen mister siste bit i 372 caser,
  /// og fixturen har den tapte biten. Ikke erstatt kroppen med `smashEff`.
  public static func smashFactor(clubSpeedMph: Double, ballSpeedMph: Double) -> Double {
    clubSpeedMph == 0 ? 0 : ballSpeedMph / clubSpeedMph
  }

  /// Hele §5.5 i ett kall.
  ///
  /// - Parameter spinLoft: 3-D spin loft i grader (`spinLoft3DDeg`).
  public static func solve(clubSpeed: Double, spinLoft: Double) -> Result {
    let smashEff = smashEfficiency(spinLoftDeg: spinLoft)
    let ballSpeed = ballSpeedFrom(clubSpeedMph: clubSpeed, smashEff: smashEff)
    let smash = smashFactor(clubSpeedMph: clubSpeed, ballSpeedMph: ballSpeed)
    return Result(smash: smash, smashEff: smashEff, ballSpeed: ballSpeed)
  }

  public struct Result: Equatable, Sendable {
    public let smash: Double
    public let smashEff: Double
    public let ballSpeed: Double
  }
}
