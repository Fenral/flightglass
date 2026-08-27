/// §8.1–8.4 Impact Studio-geometri — buens low point, treffparameter og den
/// geometrisk avledede leveringen (`attackAngle`, `clubPath`).
///
/// BASELINE. Portert fra `engine/src/studioGeometry.js`.
/// `studio-golden.json` er fasit — 2500/2500 bit-eksakt i JS på alle seks felt.
///
/// Verdensakser (spec §8): `+X` = target, `+Y` = bort fra Face On, `+Z` = opp.
///
/// Modulen eier de seks skalarene i §8.1–8.4 — IKKE verdensrom-feltene
/// (`lowPointWorld`, `planeBasis`, …) og ikke kontakt/strike (egne moduler).
/// Studio beregner aldri spinn, carry eller ballflukt (spec §11.3).
///
/// ── ULP-konvensjoner: tre grupperinger som IKKE er utbyttbare ─────────────
///
/// 1. grader → radianer for `phi`: `(deg * π) / 180` (`Angles.studioDegToRad`).
///    Motsatt rekkefølge: `thetaAtImpact` faller til 2300/2500.
/// 2. gradskalaen i `perDegree`: `* degToRad` (`Angles.studioPerDegreeScale`)
///    — MOTSATT av punkt 1, i samme uttrykk. `* π / 180` gir 2370/2500.
/// 3. radianer → grader for `attackAngle`/`clubPath`: `(rad * 180) / π`
///    (`Angles.studioRadToDeg`). `rad * radToDeg` gir 1910 / 1990 av 2500.
///
/// `JSMath.hypot(a, b)` er heller ikke utbyttbar med `sqrt(a² + b²)`:
/// den siste gir 1630/2500 på `attackAngle`.
///
/// ── VERIFISERT FAKTUM: kølla rører kun `lowPointZ` ────────────────────────
///
/// `attackAngle`, `clubPath`, `thetaAtImpact`, `effectiveLowPointX` og
/// `lowPointX` er bit-identiske for iron og driver i alle 1250 parene.
/// `clubMode` går kun inn i `lowPointZ`, via `arcZ0Cm`.
public enum StudioGeometry {

  /// §8.1: `LowPointX = (10.5 − BallPositionCm) / 100`.
  ///
  /// ⚠ DIVIDER med `cmPerMetre` (= 100). `* 0.01` er 1 ULP unna og gir feil
  /// `lowPointX` i 250 av 2500 caser.
  public static func ballLowPointX(ballPositionCm: Double) -> Double {
    (Constants.studioBallPositionOffsetCm - ballPositionCm) / Constants.cmPerMetre
  }

  /// §8.1: `LowPointZ = (ArcHeightCm + z_club) / 100`, `z_club` fra `arcZ0Cm`.
  ///
  /// DET ENESTE stedet `clubMode` inngår i §8.1–8.4. Driveroffseten tilhører
  /// den uvaliderte stand-in-modusen (FUNN F1).
  public static func clubLowPointZ(arcHeightCm: Double, clubMode: ClubMode) -> Double {
    (arcHeightCm + Constants.arcZ0Cm(clubMode)) / Constants.cmPerMetre
  }

  /// §8.2: `perDegree = Radius × cos(SwingPlane × π/180) × π / 180`.
  ///
  /// ⚠ BEGGE konvensjonene i samme uttrykk: `phi` bruker studio-grupperingen,
  /// den avsluttende gradskalaen bruker flight-grupperingen. Det er dagens
  /// kode, og 2500/2500 krever begge.
  public static func lowPointShiftPerDegree(swingPlaneDeg: Double) -> Double {
    Angles.studioPerDegreeScale(
      Constants.studioRadius * FDLibm.cos(Angles.studioDegToRad(swingPlaneDeg)))
  }

  /// §8.2: `EffectiveLowPointX = LowPointX − SwingDirection × perDegree`.
  @inlinable
  public static func shiftLowPointX(
    lowPointX: Double, swingDirection: Double, perDegree: Double
  ) -> Double {
    lowPointX - swingDirection * perDegree
  }

  /// §8.3: `theta = asin(clamp(−EffectiveLowPointX / Radius, −0.999, 0.999))`.
  ///
  /// Negativ theta = treff før low point (kølla på vei ned), positiv = etter.
  /// Clampen er spec-belagt men IKKE fixture-belagt: største `|−eff/R|` i
  /// baseline er 0.4355, så den biter aldri. Grenen reproduseres uendret.
  public static func impactTheta(effectiveLowPointX: Double) -> Double {
    FDLibm.asin(
      JSMath.clamp(
        -effectiveLowPointX / Constants.studioRadius,
        -Constants.studioThetaSinClamp,
        Constants.studioThetaSinClamp))
  }

  /// §8.4: de tre tangentkomponentene i buens eget plan. Dimensjonsløse;
  /// brukes kun til å utlede `attackAngle` og `clubPath`.
  ///
  /// ⚠ Dette er IKKE fixturens `tangentAtImpact` — den er skalert med radius
  /// og rotert til verdensrom via `planeBasis`, og eies av verdensrom-modulen.
  public static func arcDeliveryComponents(
    theta: Double, swingPlaneDeg: Double
  ) -> Components {
    let phi = Angles.studioDegToRad(swingPlaneDeg)
    return Components(
      horizontalParallel: FDLibm.cos(theta),
      horizontalPerpendicular: -FDLibm.sin(theta) * FDLibm.cos(phi),
      vertical: FDLibm.sin(theta) * FDLibm.sin(phi)
    )
  }

  /// §8.4: `AttackAngle = atan2(vertical, hypot(hPar, hPerp)) × 180/π`.
  /// Fortegn: `+` = kølla går oppover gjennom treff.
  public static func attackAngleFromComponents(_ c: Components) -> Double {
    Angles.studioRadToDeg(
      FDLibm.atan2(
        c.vertical,
        JSMath.hypot(c.horizontalParallel, c.horizontalPerpendicular)))
  }

  /// §8.4: `ClubPath = SwingDirection + atan2(hPerp, hPar) × 180/π`.
  /// Fortegn (spec §4): `+` = in-to-out/høyre.
  public static func clubPathFromComponents(
    _ c: Components, swingDirection: Double
  ) -> Double {
    swingDirection
      + Angles.studioRadToDeg(
        FDLibm.atan2(c.horizontalPerpendicular, c.horizontalParallel))
  }

  /// §8.1–8.4 samlet. Ren funksjon. Returnerer nøyaktig de seks skalarene —
  /// ingen vektorer, ingen bånd, ingen presentasjonsdata.
  public static func solve(
    swingPlane: Double,
    swingDirection: Double,
    ballPositionCm: Double,
    arcHeightCm: Double,
    clubMode: ClubMode
  ) -> Result {
    let lowPointX = ballLowPointX(ballPositionCm: ballPositionCm)
    let lowPointZ = clubLowPointZ(arcHeightCm: arcHeightCm, clubMode: clubMode)

    let effectiveLowPointX = shiftLowPointX(
      lowPointX: lowPointX,
      swingDirection: swingDirection,
      perDegree: lowPointShiftPerDegree(swingPlaneDeg: swingPlane))

    let thetaAtImpact = impactTheta(effectiveLowPointX: effectiveLowPointX)
    let components = arcDeliveryComponents(
      theta: thetaAtImpact, swingPlaneDeg: swingPlane)

    return Result(
      lowPointX: lowPointX,
      lowPointZ: lowPointZ,
      effectiveLowPointX: effectiveLowPointX,
      thetaAtImpact: thetaAtImpact,
      attackAngle: attackAngleFromComponents(components),
      clubPath: clubPathFromComponents(components, swingDirection: swingDirection)
    )
  }

  public struct Components: Equatable, Sendable {
    public let horizontalParallel: Double
    public let horizontalPerpendicular: Double
    public let vertical: Double
  }

  public struct Result: Equatable, Sendable {
    public let lowPointX: Double
    public let lowPointZ: Double
    public let effectiveLowPointX: Double
    public let thetaAtImpact: Double
    public let attackAngle: Double
    public let clubPath: Double
  }
}
