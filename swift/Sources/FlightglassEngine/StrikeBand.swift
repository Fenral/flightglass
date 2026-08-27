/// STRIKE BAND v2 — én klassifiserer, regimekorrekt vokabular.
///
/// Portert fra `engine/src/strikeBand.js` (D74: v2 er produksjonsstien;
/// v1-klassifisererne `strikeBandIron.js`/`deriveImpact.js` forblir JS).
///
/// ── Hva som var galt i den gamle motoren ──────────────────────────────────
/// TO klassifiserere, uenige i 82,3 % av driver-casene (FUNN F7).
/// `strikeQuality` bar hex-farger og UI-strenger gjennom motorgrensen
/// (FUNN F6) — slettet, ikke portert.
///
/// ── Reproduksjon ──────────────────────────────────────────────────────────
/// Turf-regelen treffer 1239 av 1250 jerncaser = 99,12 %. De 11 gjenværende
/// er 4 `Thin→Fat` og 7 `Fat→Thin` på grensen mellom de to. Grensen lar seg
/// ikke utlede av fixturen alene, og originalkoden er utenfor prosjektgrensen
/// (D13). **Restfeilen er KJENT og PINNET — ikke «fiks» den** (oppdragsbrevet).
///
/// ── Vokabularet er regime-spesifikt, ikke kølle-spesifikt ─────────────────
/// Turf (Fat/Thin/Duff/Whiff/Pure) gjelder slag fra bakken; flate-vokabularet
/// (OffFace/Low/Centre/High) gjelder alltid. Regimet velges av UNDERLAGET,
/// ikke av køllemerket (D17b).
public enum StrikeBand {

  /// Whiff-terskelen: eksakt `1.4 × 0.0213` — ARVE-radiusen, IKKE den nye
  /// 0.021336 (oppdragsbrevet). Utledet fra fixturen: observert grense lå i
  /// `(0.029752, 0.029886)`; `1.4 × 0.0213 = 0.029820`.
  public static let whiffThresholdM = 1.4 * Constants.studioBallRadius

  public enum Turf {
    /// Spec §8.5: kølla graver mer enn 25 mm under bakken ved ballen.
    public static let duffDepthM = -0.025
    /// Se `StrikeBand.whiffThresholdM`.
    public static let whiffClubHeightM = StrikeBand.whiffThresholdM
    /// Spec §8.5: «low point 20–150 mm foran ballen». Bekreftet mot fixturen.
    public static let pureLowPointMinM = 0.020
    public static let pureLowPointMaxM = 0.150
    /// Fixturens Pure-tak på køllehøyde.
    public static let pureClubHeightMaxM = 0.016
    /// Spec §8.5: «low point ligger bak ballen i treffsonen» → Fat.
    public static let fatLowPointM = -0.10
  }

  public enum Face {
    /// Fixturens rene gap: Pure `[−7.77, 7.93]`, Low ≤ −8.08, High ≥ 8.02.
    public static let centreBandMm = 8.0
  }

  /// Underlagsregime. Ballen 20 mm eller mer over bakkeplanet er luftbåren —
  /// turf er ute av spill.
  public enum Regime: String, Sendable {
    case turf
    case teed
  }

  /// Turf-vokabularet, spec §8.5.
  public enum TurfBand: String, Sendable {
    case duff = "Duff"
    case fat = "Fat"
    case pure = "Pure"
    case thin = "Thin"
    case whiff = "Whiff"
  }

  /// Flate-vokabularet. `OffFace` er en egen tilstand, ikke en ekstremverdi.
  public enum FacePosition: String, Sendable {
    case offFace = "OffFace"
    case low = "Low"
    case centre = "Centre"
    case high = "High"
  }

  /// Underlaget avgjør vokabularet.
  public static func contactRegime(lieHeightMm: Double) -> Regime {
    lieHeightMm >= 20 ? .teed : .turf
  }

  /// TURF-klassifisereren, spec §8.5. TRE akser: køllehøyde, low point
  /// foran/bak ballen, og om kølla er nedadgående.
  ///
  /// ⚠ Whiff er HØY kølle (kølla passerer OVER ballen) — fortegnet som var
  /// bakvendt i den første v2-en og kostet 320 `Whiff→Pure`-feil.
  public static func turfBand(
    clubHeightM: Double,
    effectiveLowPointM: Double,
    thetaAtImpact: Double
  ) -> TurfBand {
    if clubHeightM < Turf.duffDepthM { return .duff }
    if clubHeightM > Turf.whiffClubHeightM { return .whiff }
    if clubHeightM < 0 || effectiveLowPointM < Turf.fatLowPointM { return .fat }
    if effectiveLowPointM >= Turf.pureLowPointMinM
      && effectiveLowPointM <= Turf.pureLowPointMaxM
      && thetaAtImpact < 0
      && clubHeightM <= Turf.pureClubHeightMaxM
    {
      return .pure
    }
    return .thin
  }

  /// TEED-klassifisereren: kun vertikalt treffpunkt på flaten.
  public static func teedBand(offsetMm: Double, halfFaceMm: Double) -> FacePosition {
    if abs(offsetMm) > halfFaceMm { return .offFace }
    if offsetMm < -Face.centreBandMm { return .low }
    if offsetMm > Face.centreBandMm { return .high }
    return .centre
  }

  /// Én inngang. **Begge svar returneres alltid** — de er ulike spørsmål
  /// (U1). `regime` sier hvilket svar som skal LEDE i grensesnittet, ikke
  /// hvilket som beregnes (D3b: turfkontakt vises aldri uten underlag).
  public static func classify(
    lieHeightMm: Double,
    clubHeightM: Double,
    effectiveLowPointM: Double,
    thetaAtImpact: Double,
    offsetMm: Double,
    halfFaceMm: Double
  ) -> Result {
    let regime = contactRegime(lieHeightMm: lieHeightMm)

    // Turf er i spill så lenge ballen ikke er luftbåren.
    let hasTurfContact = regime == .turf
    let turf: TurfBand? =
      hasTurfContact
      ? turfBand(
        clubHeightM: clubHeightM,
        effectiveLowPointM: effectiveLowPointM,
        thetaAtImpact: thetaAtImpact)
      : nil

    // Flateposisjonen gjelder alltid.
    let facePosition = teedBand(offsetMm: offsetMm, halfFaceMm: halfFaceMm)

    return Result(
      turfBand: turf,
      facePosition: facePosition,
      regime: regime,
      hasTurfContact: hasTurfContact,
      lead: hasTurfContact ? turf!.rawValue : facePosition.rawValue)
  }

  public struct Result: Equatable, Sendable {
    public let turfBand: TurfBand?
    public let facePosition: FacePosition
    public let regime: Regime
    public let hasTurfContact: Bool
    public let lead: String
  }
}
