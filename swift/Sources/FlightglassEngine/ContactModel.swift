/// KONTAKTMODELL v2 — lie og køllegeometri som uavhengige akser.
///
/// Portert fra `engine/src/contactModel.js`. Erstatter den bundtede
/// `clubMode`-modellen i `StudioContact` (D17b). `deriveImpact.js` (v1)
/// forblir JS per D74.
///
/// ── F11: jernets sweetspot var ballradiusen ───────────────────────────────
/// I arvemodellen var `sweetSpotAboveSoleM.iron` (0.0213) tallidentisk med
/// `studioBallRadius`, og de kansellerte i `faceCentreOffsetMm` — jernets
/// offset målte aldri et treffpunkt, bare køllehøyde negert. Målt sweetspot
/// for 12 jernhoder er 17.7–19.2 mm (US10918918 Tab. 6+7); arvetallet 21.3 lå
/// 2.1 mm over det høyeste av tolv. v2 bruker målte tall.
///
/// ── Måledefinisjoner som ikke må blandes ──────────────────────────────────
/// - `sweetSpotHeightMm`: VERTIKALT over bakkeplanet — det formelen bruker.
/// - `faceHeightMm`: woods vertikalt, jern LANGS flaten — konverter med
///   `cos(loft)` før sammenligning.
public enum ContactModel {

  /// R&A/USGA: minste diameter 1.680 in = 42.672 mm eksakt.
  ///
  /// ⚠ Den TREDJE ballradiusen: IKKE flight (0.021335), IKKE studio-arven
  /// (0.0213). Alle tre er pinnet hver for seg.
  public static let ballRadiusM = 0.021336

  /// Ballens høyde over bakkeplanet, etter underlag. Millimeter.
  /// Erstatter den hardkodede `lift` (D17). D66: presetsene ER velgeren.
  public enum LiePreset: String, CaseIterable, Sendable {
    case hardpan, tight, fairway, lightRough, rough, tee, teeHigh

    public var heightMm: Double {
      switch self {
      case .hardpan: return 0  // matte, steingulv, tight lie
      case .tight: return 3
      case .fairway: return 8  // ballen ligger litt opp i gresset
      case .lightRough: return 15
      case .rough: return 22
      case .tee: return 30  // driverens gamle 0.030 m er dette punktet
      case .teeHigh: return 42
      }
    }
  }

  /// Hvordan `faceHeightMm` er målt.
  public enum FaceConvention: String, Sendable {
    case vertical
    case alongFace
  }

  /// Kildekonfidens per verdi — se `KOLLEGEOMETRI.md`.
  public enum Confidence: String, Sendable {
    case measured  // publisert måletall med riktig definisjon
    case interpolated  // mellom to målte punkter
    case assumed  // ingen kilde; plassholder
  }

  public struct ClubGeometry: Equatable, Sendable {
    public let sweetSpotHeightMm: Double
    public let faceHeightMm: Double
    public let faceConvention: FaceConvention
    public let confidence: Confidence

    public init(
      sweetSpotHeightMm: Double, faceHeightMm: Double,
      faceConvention: FaceConvention, confidence: Confidence
    ) {
      self.sweetSpotHeightMm = sweetSpotHeightMm
      self.faceHeightMm = faceHeightMm
      self.faceConvention = faceConvention
      self.confidence = confidence
    }
  }

  /// Køllegeometri, portert verdi for verdi fra `CLUB_GEOMETRY`.
  public enum Club: String, CaseIterable, Sendable {
    case driver, threeWood, hybrid, longIron, midIron, shortIron, wedge

    public var geometry: ClubGeometry {
      switch self {
      case .driver:
        return ClubGeometry(
          sweetSpotHeightMm: 34.0, faceHeightMm: 55.0,
          faceConvention: .vertical, confidence: .measured)
      case .threeWood:
        return ClubGeometry(
          sweetSpotHeightMm: 23.0, faceHeightMm: 37.7,
          faceConvention: .vertical, confidence: .interpolated)
      case .hybrid:
        return ClubGeometry(
          sweetSpotHeightMm: 21.0, faceHeightMm: 37.8,
          faceConvention: .vertical, confidence: .assumed)
      case .longIron:
        return ClubGeometry(
          sweetSpotHeightMm: 17.2, faceHeightMm: 43.0,
          faceConvention: .alongFace, confidence: .interpolated)
      case .midIron:
        return ClubGeometry(
          sweetSpotHeightMm: 18.4, faceHeightMm: 46.0,
          faceConvention: .alongFace, confidence: .measured)
      case .shortIron:
        return ClubGeometry(
          sweetSpotHeightMm: 19.6, faceHeightMm: 49.0,
          faceConvention: .alongFace, confidence: .interpolated)
      case .wedge:
        return ClubGeometry(
          sweetSpotHeightMm: 21.0, faceHeightMm: 51.0,
          faceConvention: .alongFace, confidence: .assumed)
      }
    }
  }

  /// Vertikal slagflatehøyde. Jernkilder måler LANGS flaten; projiser ned med
  /// `cos(loft)` før sammenligning. Studio-gruppering på grad→radian.
  public static func verticalFaceHeightMm(
    club: ClubGeometry, dynamicLoftDeg: Double
  ) -> Double {
    if club.faceConvention == .vertical { return club.faceHeightMm }
    return club.faceHeightMm * FDLibm.cos(Angles.studioDegToRad(dynamicLoftDeg))
  }

  /// Treffpunktets høyde relativt sweetspoten:
  /// `(lieHeightMm + ballRadiusMm) − (clubHeightMm + sweetSpotHeightMm)`.
  /// Positivt = ballen møter flaten OVER sweetspoten.
  public static func faceCentreOffsetMm(
    lieHeightMm: Double, clubHeightMm: Double, sweetSpotHeightMm: Double
  ) -> Double {
    lieHeightMm + ballRadiusM * 1000 - (clubHeightMm + sweetSpotHeightMm)
  }

  /// Fullt treffresultat, med fysisk grense.
  ///
  /// D3: treff utenfor slagflaten er en egen tilstand — ikke en ekstremverdi.
  /// D24: to mål samtidig — absolutt mm (fysikk) og andel av flatehøyde
  /// (lesbarhet).
  public static func strikeContact(
    lieHeightMm: Double,
    clubHeightMm: Double,
    club: ClubGeometry,
    dynamicLoftDeg: Double
  ) -> Strike {
    let offsetMm = faceCentreOffsetMm(
      lieHeightMm: lieHeightMm,
      clubHeightMm: clubHeightMm,
      sweetSpotHeightMm: club.sweetSpotHeightMm)
    let vfh = verticalFaceHeightMm(club: club, dynamicLoftDeg: dynamicLoftDeg)
    let halfFaceMm = vfh / 2
    return Strike(
      offsetMm: offsetMm,
      offsetRatio: offsetMm / halfFaceMm,
      onFace: abs(offsetMm) <= halfFaceMm,
      verticalFaceHeightMm: vfh,
      halfFaceMm: halfFaceMm)
  }

  public struct Strike: Equatable, Sendable {
    public let offsetMm: Double
    public let offsetRatio: Double
    public let onFace: Bool
    public let verticalFaceHeightMm: Double
    public let halfFaceMm: Double
  }
}
