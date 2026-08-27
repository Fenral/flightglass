/// studioContact — Impact Studio sin kontaktgeometri. ENGINE-GAPS §7, §8, §9.
///
/// BASELINE. Portert fra `engine/src/studioContact.js` — bit-eksakt i JS mot
/// alle 2500 caser på alle elleve tallfelt.
///
/// Verdensakser (spec §8, Studio — IKKE de samme som flight):
/// `+x` = target, `+y` = bort fra Face On, `+z` = opp. Meter.
///
/// Modulen eier seks felt i `cases[].out`: `contactHeight`,
/// `groundCrossingTheta0`, `groundEntry`, `groundExit`, `faceCentreOffsetMm`,
/// `clubBallContact`.
///
/// ── ULP-kritiske detaljer (verifisert i JS, ikke gjettet) ─────────────────
///
/// 1. Grader → radianer er studio-formen for både φ og ψ
///    (ψ via flight-formen: `planeBasis.u.y` faller til 1000/2500).
///    Unntak: gradskalaen i `perDegree` er `* degToRad`. Begge i samme uttrykk.
/// 2. cm → meter er DIVISJON med 100.
/// 3. `contactHeight` er `zLP + R * (1 − cos θ) * sin φ` VENSTRE-MOT-HØYRE:
///    de to omgrupperingene gir 2176 og 2230 av 2500.
/// 4. `d` i `lowPointWorld` likedan: alternativer gir 2050/2040 av 2500.
/// 5. `faceCentreOffsetMm` beholder parentesene fra GAPS §9 og ganger med
///    1000: `((lift+rBall) − (clubZ+sweet)) * 1000` er 2500/2500; de to
///    alternativene 1807 og 2170.
/// 6. `offsetRatio` er `(clubZ − rBall) / rBall`, ikke `clubZ/rBall − 1`
///    (1413/2500).
///
/// ── To ting fixturen viser som spec-en ikke sier ──────────────────────────
///
/// A. `groundEntry.z`/`groundExit.z` er IKKE tvunget til 0 — fixturen har den
///    rå flyttallsresten (f.eks. −1.39e-17). Nuller man z, ryker 1125 caser.
/// B. `clubBallContact.offset` bruker Studios ballradius 0.0213, og driveren
///    får INGEN løftkorreksjon her — `driverBallLiftM` inngår bare i
///    `faceCentreOffsetMm`. Ser inkonsistent ut; er dagens motor (FUNN F1/F7).
public enum StudioContact {

  /// Ballens løft over bakken per køllemodus, meter. Jern-verdien 0 er
  /// implisitt i ENGINE-GAPS §9 og har ingen fixture-kilde; driver-verdien er
  /// `Constants.driverBallLiftM`.
  @usableFromInline
  static func ballLiftM(_ mode: ClubMode) -> Double {
    switch mode {
    case .iron: return 0
    case .driver: return Constants.driverBallLiftM
    }
  }

  /// Meter → millimeter. GAPS §9 skalerer med `· 1000`. Ingen enhetskonstant
  /// i fixturen — bare den skalerte verdien.
  @usableFromInline static let metreToMillimetre = 1000.0

  /// Verdenspunkt i Studios koordinater. Fixturen lagrer `{x, y, z}`.
  public struct Point: Equatable, Sendable {
    public let x: Double
    public let y: Double
    public let z: Double

    public init(x: Double, y: Double, z: Double) {
      self.x = x
      self.y = y
      self.z = z
    }
  }

  /// Bueplanets ortonormale basis.
  public struct Basis: Equatable, Sendable {
    public let u: Point  // horisontal, langs svingretningen
    public let m: Point  // i planet, mot buens senter

    public init(u: Point, m: Point) {
      self.u = u
      self.m = m
    }
  }

  // ── §8.1 Input → motorstate ──────────────────────────────────────────────

  /// `xLP = (10.5 − ballPositionCm) / 100`.
  public static func lowPointX(ballPositionCm: Double) -> Double {
    (Constants.studioBallPositionOffsetCm - ballPositionCm) / Constants.cmPerMetre
  }

  /// `zLP = (arcHeightCm + zClub) / 100`.
  public static func lowPointZ(arcHeightCm: Double, clubMode: ClubMode) -> Double {
    (arcHeightCm + Constants.arcZ0Cm(clubMode)) / Constants.cmPerMetre
  }

  /// φ i radianer, studio-gruppering.
  @inlinable
  public static func swingPlaneRad(_ swingPlaneDeg: Double) -> Double {
    Angles.studioDegToRad(swingPlaneDeg)
  }

  /// ψ = −swingDirection · π/180 (GAPS §8). Fortegnet er snudd — kildens
  /// konvensjon.
  @inlinable
  public static func planeYawRad(_ swingDirectionDeg: Double) -> Double {
    Angles.studioDegToRad(-swingDirectionDeg)
  }

  // ── §8.2–8.3 ─────────────────────────────────────────────────────────────

  /// `perDegree = R · cos φ · π/180` — gradskalaen med flight-grupperingen,
  /// inne i studio. Se `StudioGeometry.lowPointShiftPerDegree`; samme uttrykk.
  public static func lowPointShiftPerDegree(swingPlaneRadians: Double) -> Double {
    Angles.studioPerDegreeScale(
      Constants.studioRadius * FDLibm.cos(swingPlaneRadians))
  }

  /// `xEff = xLP − swingDirection · perDegree`.
  public static func effectiveLowPointX(
    lowPointXMetres: Double, swingDirectionDeg: Double, swingPlaneRadians: Double
  ) -> Double {
    lowPointXMetres
      - swingDirectionDeg * lowPointShiftPerDegree(swingPlaneRadians: swingPlaneRadians)
  }

  /// `θ = asin(clamp(−xEff / R, −0.999, 0.999))`. Clampen er kildens, aldri
  /// observert aktiv i fixturen (maks 0.44).
  public static func thetaAtImpact(effectiveLowPointXMetres: Double) -> Double {
    FDLibm.asin(
      JSMath.clamp(
        -effectiveLowPointXMetres / Constants.studioRadius,
        -Constants.studioThetaSinClamp,
        Constants.studioThetaSinClamp))
  }

  // ── GAPS §7 Kontakthøyde ─────────────────────────────────────────────────

  /// `contactHeight = clubZ = zLP + R(1 − cos θ) sin φ`. Negativ = kølla
  /// under bakkenivå. ⚠ VENSTRE-MOT-HØYRE (punkt 3).
  public static func contactHeight(
    lowPointZMetres: Double, thetaRadians: Double, swingPlaneRadians: Double
  ) -> Double {
    lowPointZMetres
      + Constants.studioRadius * (1 - FDLibm.cos(thetaRadians))
      * FDLibm.sin(swingPlaneRadians)
  }

  // ── GAPS §8 Buen i verdenskoordinater ────────────────────────────────────

  /// `u = (cos ψ, sin ψ, 0)`, `m = (−sin ψ cos φ, cos ψ cos φ, sin φ)`.
  public static func planeBasis(
    planeYawRadians: Double, swingPlaneRadians: Double
  ) -> Basis {
    let cosYaw = FDLibm.cos(planeYawRadians)
    let sinYaw = FDLibm.sin(planeYawRadians)
    let cosPlane = FDLibm.cos(swingPlaneRadians)
    let sinPlane = FDLibm.sin(swingPlaneRadians)
    return Basis(
      u: Point(x: cosYaw, y: sinYaw, z: 0),
      m: Point(x: -sinYaw * cosPlane, y: cosYaw * cosPlane, z: sinPlane))
  }

  /// `d = R(1 − cos θ) cos φ` (⚠ venstre-mot-høyre, punkt 4);
  /// `LP = (xEff cos ψ + d sin ψ, xEff sin ψ − d cos ψ, zLP)`.
  /// `θ` er TREFF-thetaen, ikke kryssings-thetaen.
  public static func lowPointWorld(
    effectiveLowPointXMetres: Double,
    lowPointZMetres: Double,
    thetaRadians: Double,
    planeYawRadians: Double,
    swingPlaneRadians: Double
  ) -> Point {
    let cosYaw = FDLibm.cos(planeYawRadians)
    let sinYaw = FDLibm.sin(planeYawRadians)
    let depth =
      Constants.studioRadius * (1 - FDLibm.cos(thetaRadians))
      * FDLibm.cos(swingPlaneRadians)
    return Point(
      x: effectiveLowPointXMetres * cosYaw + depth * sinYaw,
      y: effectiveLowPointXMetres * sinYaw - depth * cosYaw,
      z: lowPointZMetres)
  }

  /// `P(t) = LP + R sin t · u + R(1 − cos t) · m`.
  public static func arcPoint(
    lowPointWorldMetres: Point, basis: Basis, thetaRadians: Double
  ) -> Point {
    let along = Constants.studioRadius * FDLibm.sin(thetaRadians)
    let inward = Constants.studioRadius * (1 - FDLibm.cos(thetaRadians))
    return Point(
      x: lowPointWorldMetres.x + along * basis.u.x + inward * basis.m.x,
      y: lowPointWorldMetres.y + along * basis.u.y + inward * basis.m.y,
      z: lowPointWorldMetres.z + along * basis.u.z + inward * basis.m.z)
  }

  /// `θ_g = arccos(1 + zLP / (R sin φ))`, eller `nil` når `|c| ≥ 1`.
  ///
  /// `c ≥ 1` betyr at low point ligger på eller over bakken — buen krysser
  /// aldri. 1375 av 2500 caser er `nil`, alle med `zLP ≥ 0`.
  ///
  /// ⚠ NaN-VAKTEN, BASELINE-FUNN [12]: er `sin φ = 0` OG `zLP = 0` blir `c`
  /// NaN, begge sammenligningene false, og uten vakten ville `acos(NaN)`
  /// havnet i et offentlig felt. `swingPlane = 0` finnes ikke i fixturen, så
  /// vakten endrer null av de 2500 casene — ikke-endelig `c` gir `nil`, samme
  /// svar som «buen krysser aldri bakken». Skal med (oppdragsbrevet).
  public static func groundCrossingTheta0(
    lowPointZMetres: Double, swingPlaneRadians: Double
  ) -> Double? {
    let cosTheta =
      1 + lowPointZMetres / (Constants.studioRadius * FDLibm.sin(swingPlaneRadians))
    if !cosTheta.isFinite { return nil }
    if cosTheta >= 1 || cosTheta <= -1 { return nil }
    return FDLibm.acos(cosTheta)
  }

  /// `Entry = P(−θ_g)`, `Exit = P(+θ_g)`; begge `nil` når `θ_g` er `nil`.
  ///
  /// ⚠ `z` beregnes med den generelle `P(t)` og er IKKE eksakt 0 — fixturen
  /// har den rå flyttallsresten. Nuller man z, ryker 1125 caser (punkt A).
  public static func groundCrossings(
    lowPointWorldMetres: Point, basis: Basis, crossingThetaRadians: Double?
  ) -> (groundEntry: Point?, groundExit: Point?) {
    guard let theta = crossingThetaRadians else { return (nil, nil) }
    return (
      arcPoint(lowPointWorldMetres: lowPointWorldMetres, basis: basis, thetaRadians: -theta),
      arcPoint(lowPointWorldMetres: lowPointWorldMetres, basis: basis, thetaRadians: theta)
    )
  }

  // ── GAPS §9 Face-centre offset ───────────────────────────────────────────

  /// `faceCentreOffsetMm = ((lift + rBall) − (clubZ + sweet)) · 1000`.
  ///
  /// Rå float — UI-ets avrunding hører ikke hjemme i motoren. Baseline går
  /// til −121 mm på driver, på en flate som er ~60 mm høy (FUNN F7): en
  /// selvmotsigelse i stand-in-modusen, ikke en regnefeil her.
  ///
  /// ⚠ Parentesene og `· 1000` er begge load-bearing (punkt 5).
  public static func faceCentreOffsetMm(clubZMetres: Double, clubMode: ClubMode) -> Double {
    (ballLiftM(clubMode) + Constants.studioBallRadius
      - (clubZMetres + Constants.sweetSpotAboveSoleM(clubMode)))
      * metreToMillimetre
  }

  // ── Kølle/ball-kontakt ───────────────────────────────────────────────────

  /// `clubBallContact` — sålehøyden relativt Studios ballradius 0.0213 m.
  /// `offset = clubZ − rBall`; `offsetRatio = offset / rBall`
  /// (⚠ IKKE `clubZ/rBall − 1`, punkt 6). Ingen løftkorreksjon for driver
  /// (punkt B).
  public static func clubBallContact(
    clubZMetres: Double, thetaRadians: Double
  ) -> Contact {
    let offset = clubZMetres - Constants.studioBallRadius
    return Contact(
      clubZ: clubZMetres,
      offset: offset,
      offsetRatio: offset / Constants.studioBallRadius,
      theta: thetaRadians)
  }

  public struct Contact: Equatable, Sendable {
    public let clubZ: Double
    public let offset: Double
    public let offsetRatio: Double
    public let theta: Double
  }

  // ── Samlet solve ─────────────────────────────────────────────────────────

  /// Hele GAPS §7–9 i ett kall. `planeBasis`, `lowPointWorld`,
  /// `effectiveLowPointX` og `thetaAtImpact` beregnes underveis men
  /// returneres IKKE — de tilhører studio-geometry. Trenger du dem, kall
  /// hjelperne direkte.
  public static func solve(
    swingPlane: Double,
    swingDirection: Double,
    ballPositionCm: Double,
    arcHeightCm: Double,
    clubMode: ClubMode
  ) -> Result {
    let planeRadians = swingPlaneRad(swingPlane)
    let yawRadians = planeYawRad(swingDirection)

    let xLowPoint = lowPointX(ballPositionCm: ballPositionCm)
    let zLowPoint = lowPointZ(arcHeightCm: arcHeightCm, clubMode: clubMode)
    let xEffective = effectiveLowPointX(
      lowPointXMetres: xLowPoint,
      swingDirectionDeg: swingDirection,
      swingPlaneRadians: planeRadians)
    let theta = thetaAtImpact(effectiveLowPointXMetres: xEffective)

    let clubZ = contactHeight(
      lowPointZMetres: zLowPoint, thetaRadians: theta, swingPlaneRadians: planeRadians)

    let basis = planeBasis(planeYawRadians: yawRadians, swingPlaneRadians: planeRadians)
    let lowPoint = lowPointWorld(
      effectiveLowPointXMetres: xEffective,
      lowPointZMetres: zLowPoint,
      thetaRadians: theta,
      planeYawRadians: yawRadians,
      swingPlaneRadians: planeRadians)

    let crossingTheta = groundCrossingTheta0(
      lowPointZMetres: zLowPoint, swingPlaneRadians: planeRadians)
    let crossings = groundCrossings(
      lowPointWorldMetres: lowPoint, basis: basis, crossingThetaRadians: crossingTheta)

    return Result(
      contactHeight: clubZ,
      groundCrossingTheta0: crossingTheta,
      groundEntry: crossings.groundEntry,
      groundExit: crossings.groundExit,
      faceCentreOffsetMm: faceCentreOffsetMm(clubZMetres: clubZ, clubMode: clubMode),
      clubBallContact: clubBallContact(clubZMetres: clubZ, thetaRadians: theta)
    )
  }

  public struct Result: Equatable, Sendable {
    public let contactHeight: Double
    public let groundCrossingTheta0: Double?
    public let groundEntry: Point?
    public let groundExit: Point?
    public let faceCentreOffsetMm: Double
    public let clubBallContact: Contact
  }
}
