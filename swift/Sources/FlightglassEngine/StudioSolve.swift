/// STUDIO SOLVE v2 — produksjonsstien for Impact Studio.
///
/// Portert fra `engine/src/studioSolve.js`. `deriveImpact.js` (v1) forblir JS
/// som pinnet baseline (D74), slik at endringen kan måles i stedet for påstås.
///
/// ── Tre ting v1 buntet sammen ─────────────────────────────────────────────
/// `clubMode` bar tre uavhengige beslutninger: `lift` (underlaget), `sweet`
/// (kølla) og `zClub` (piggen, en tredje gang). I v2 er
/// `lowPointZ = arcHeightCm / 100`; underlaget lever kun i `lieHeightMm`, og
/// kun i kontaktberegningen.
///
/// Attack angle og club path er UBERØRT — verifisert bit-identiske mellom
/// jern og driver over 1250 matchede par i v1, fordi `zClub` aldri nådde dem.
///
/// Rene funksjoner. Ingen tilstand, ingen I/O, ingen presentasjonsdata.
public enum StudioSolve {

  /// Feil i inputkontrakten. Spec §3: ingen parsing, ingen koersjon —
  /// kast på brudd.
  public enum ContractError: Error, Equatable {
    case nonFiniteInput(field: String)
    case negativeLieHeight(Double)
  }

  /// Buens bunnpunkt over bakken. **Kun svingens arc height** — ingen
  /// køllekorreksjon. v1 la til `zClub` her, som kodet piggen en gang til.
  @inlinable
  public static func lowPointZv2(arcHeightCm: Double) -> Double {
    arcHeightCm / 100
  }

  /// Hele v2-kjeden i ett kall.
  ///
  /// - Parameters:
  ///   - lieHeightMm: ballens høyde over bakkeplanet (D17). Aldri negativ.
  ///   - club: oppføring fra `ContactModel.Club`-geometrien.
  ///   - dynamicLoftDeg: for vertikal slagflatehøyde (D65: per-kølle-konstant,
  ///     merket som antagelse).
  public static func solve(
    swingPlane: Double,
    swingDirection: Double,
    ballPositionCm: Double,
    arcHeightCm: Double,
    lieHeightMm: Double,
    club: ContactModel.ClubGeometry,
    dynamicLoftDeg: Double
  ) throws -> Result {
    // Spec §3-kontrakten, som i JS: endelige tall, ikke-negativ lie.
    for (name, value) in [
      ("swingPlane", swingPlane), ("swingDirection", swingDirection),
      ("ballPositionCm", ballPositionCm), ("arcHeightCm", arcHeightCm),
      ("lieHeightMm", lieHeightMm), ("dynamicLoftDeg", dynamicLoftDeg),
    ] {
      guard value.isFinite else { throw ContractError.nonFiniteInput(field: name) }
    }
    guard lieHeightMm >= 0 else { throw ContractError.negativeLieHeight(lieHeightMm) }

    // §8.1–8.4 — uendret fra v1. Attack og path er køllenøytrale;
    // clubMode-argumentet når bare lowPointZ, som v2 ikke bruker herfra.
    let geometry = StudioGeometry.solve(
      swingPlane: swingPlane,
      swingDirection: swingDirection,
      ballPositionCm: ballPositionCm,
      arcHeightCm: arcHeightCm,
      clubMode: .iron)

    let planeRadians = StudioContact.swingPlaneRad(swingPlane)
    let yawRadians = StudioContact.planeYawRad(swingDirection)
    let basis = StudioContact.planeBasis(
      planeYawRadians: yawRadians, swingPlaneRadians: planeRadians)

    // v2: buens bunn er svingens, ikke køllas.
    let zLowPoint = lowPointZv2(arcHeightCm: arcHeightCm)
    let theta = geometry.thetaAtImpact

    // Køllehøyde ved ballen — samme geometri som GAPS §7, uten zClub-fudgen.
    // ⚠ Venstre-mot-høyre, som i StudioContact.contactHeight.
    let clubHeightM =
      zLowPoint + Constants.studioRadius * (1 - FDLibm.cos(theta)) * FDLibm.sin(planeRadians)

    // Bakkekryssingene. NaN-vakten fra BASELINE-FUNN [12] er i
    // groundCrossingTheta0 og følger med.
    let crossingTheta = StudioContact.groundCrossingTheta0(
      lowPointZMetres: zLowPoint, swingPlaneRadians: planeRadians)
    let lowPoint = StudioContact.Point(
      x: geometry.effectiveLowPointX * FDLibm.cos(yawRadians),
      y: geometry.effectiveLowPointX * FDLibm.sin(yawRadians),
      z: zLowPoint)
    let crossings = StudioContact.groundCrossings(
      lowPointWorldMetres: lowPoint, basis: basis, crossingThetaRadians: crossingTheta)

    // Treffpunkt på slagflaten — to mål, D24.
    let contact = ContactModel.strikeContact(
      lieHeightMm: lieHeightMm,
      clubHeightMm: clubHeightM * 1000,
      club: club,
      dynamicLoftDeg: dynamicLoftDeg)

    // Én klassifiserer, regime valgt av underlaget. D5, D17b.
    let band = StrikeBand.classify(
      lieHeightMm: lieHeightMm,
      clubHeightM: clubHeightM,
      effectiveLowPointM: geometry.effectiveLowPointX,
      thetaAtImpact: theta,
      offsetMm: contact.offsetMm,
      halfFaceMm: contact.halfFaceMm)

    return Result(
      attackAngle: geometry.attackAngle,
      clubPath: geometry.clubPath,
      lowPointX: geometry.lowPointX,
      lowPointZ: zLowPoint,
      effectiveLowPointX: geometry.effectiveLowPointX,
      thetaAtImpact: theta,
      lowPointWorld: lowPoint,
      planeBasis: basis,
      impactPoint: StudioContact.arcPoint(
        lowPointWorldMetres: lowPoint, basis: basis, thetaRadians: theta),
      groundCrossingTheta0: crossingTheta,
      groundEntry: crossings.groundEntry,
      groundExit: crossings.groundExit,
      clubHeightM: clubHeightM,
      faceCentreOffsetMm: contact.offsetMm,
      faceCentreOffsetRatio: contact.offsetRatio,
      onFace: contact.onFace,
      verticalFaceHeightMm: contact.verticalFaceHeightMm,
      turfBand: band.turfBand,
      facePosition: band.facePosition,
      strikeRegime: band.regime,
      hasTurfContact: band.hasTurfContact,
      strikeLead: band.lead,
      lieHeightMm: lieHeightMm,
      sweetSpotHeightMm: club.sweetSpotHeightMm,
      clubGeometryConfidence: club.confidence,
      ballRadiusM: ContactModel.ballRadiusM
    )
  }

  public struct Result: Equatable, Sendable {
    // køllenøytral geometri
    public let attackAngle: Double
    public let clubPath: Double
    public let lowPointX: Double
    public let lowPointZ: Double
    public let effectiveLowPointX: Double
    public let thetaAtImpact: Double
    public let lowPointWorld: StudioContact.Point
    public let planeBasis: StudioContact.Basis
    public let impactPoint: StudioContact.Point

    // bakkekryssing
    public let groundCrossingTheta0: Double?
    public let groundEntry: StudioContact.Point?
    public let groundExit: StudioContact.Point?

    // kontakt — to mål, D24
    public let clubHeightM: Double
    public let faceCentreOffsetMm: Double
    public let faceCentreOffsetRatio: Double
    public let onFace: Bool
    public let verticalFaceHeightMm: Double

    // klassifisering — begge svar, alltid (U1, D3b)
    public let turfBand: StrikeBand.TurfBand?
    public let facePosition: StrikeBand.FacePosition
    public let strikeRegime: StrikeBand.Regime
    public let hasTurfContact: Bool
    public let strikeLead: String

    // proveniens: hva som ble antatt, ikke skjult
    public let lieHeightMm: Double
    public let sweetSpotHeightMm: Double
    public let clubGeometryConfidence: ContactModel.Confidence
    public let ballRadiusM: Double
  }
}
