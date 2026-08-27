/// §5.6 — Carry, Apex, Landing Angle og Total. Det empiriske 7-jern-fittet.
///
/// BASELINE. Portert fra `engine/src/longitudinalLegacy.js`. Fixturen er fasit.
///
/// Navnet sier hva dette er: en LEGACY longitudinalmodell — tre uavhengige
/// enkeltfit limt sammen, kalibrert på 7-jern, kjørt på alle køller. Carry
/// kommer fra ballhastighet og launch alene; landing fra vertikal spin loft
/// alene; de to koblingsleddene (`landingLaunchTerm`, `landingApexTerm`) er
/// hardkodet 0 i alle 5028 caser. Behold det. Senere faser bytter versjonert.
///
/// Enheter: `ballSpeed` i mph inn; `carry`, `apex`, `total`, `roll` i YARD ut.
/// Fittet er kalibrert direkte i yard — ingen meterkonvertering skjer i §5.6.
///
/// Den ene transcendentale er `exp` i landingsleddet — `FDLibm.exp` (D86).
/// `sqrt` er IEEE-eksakt. Resten er ren algebra.
public enum LongitudinalLegacy {

  // ── Carry ────────────────────────────────────────────────────────────────

  /// `carryLaunchEfficiency` — kvadratrot av en klampet rampe: 0 ved
  /// launch ≤ 0°, 1 ved ≥ 10°.
  ///
  /// ⚠ MODELLENS SYNLIGE GRENSE, IKKE ET UNNTAK. Øvre klamp fyrer i 3715 av
  /// 5028 caser: over 10° launch skiller modellen ikke mellom to slag. Under
  /// 0° er carry eksakt 0 — ballen «flyr ikke» uansett (381 caser).
  public static func launchEfficiency(_ launchAngleDeg: Double) -> Double {
    JSMath.clamp(
      JSMath.max(0, launchAngleDeg) / Constants.carryFullLaunchAtDeg, 0, 1
    ).squareRoot()
  }

  /// `carryBallSpeedFit` — carry i yard ved full launch-effektivitet.
  /// Kvadratisk i ballhastighet. Spinn inngår ikke.
  ///
  /// ⚠ ULP-FELLE: kvadratleddet grupperes `k × (B × B)`. Venstreassosiativt
  /// `(k × B) × B` avviker 1 ULP i 728 av 5028 caser. Samme felle som §5.5.
  public static func carryBallSpeedFit(_ ballSpeedMph: Double) -> Double {
    let ballSpeedSquared = ballSpeedMph * ballSpeedMph
    return Constants.carryBallSpeedLinear * ballSpeedMph
      + Constants.carryBallSpeedQuadratic * ballSpeedSquared
  }

  /// `carry` — spec §5.6: `Carry = carrySpeedFit × launchEfficiency`.
  @inlinable
  public static func carryFrom(_ ballSpeedFit: Double, _ efficiency: Double) -> Double {
    ballSpeedFit * efficiency
  }

  // ── Apex ─────────────────────────────────────────────────────────────────

  /// `apexBallSpeedTerm`.
  ///
  /// ⚠ ULP-FELLE: faktorene multipliseres VENSTRE MOT HØYRE,
  /// `(k × BallSpeed) × efficiency`. `k × (BallSpeed × efficiency)` avviker
  /// 1 ULP i 360 av 5028 caser. Ikke sett parentes rundt de to siste.
  public static func apexBallSpeedTerm(
    _ ballSpeedMph: Double, _ efficiency: Double
  ) -> Double {
    Constants.apexBasePerBallSpeed * ballSpeedMph * efficiency
  }

  /// `apexLaunchTerm`. Launch teller to ganger i apex: gjennom `efficiency`
  /// og direkte som `max(0, launch)`. Over 10° er `efficiency` mettet og bare
  /// det direkte leddet vokser.
  ///
  /// ⚠ ULP-FELLE: alle fire faktorene VENSTRE MOT HØYRE. Omgruppering avviker
  /// 1 ULP i 299 av 5028 caser.
  public static func apexLaunchTerm(
    _ ballSpeedMph: Double, _ launchAngleDeg: Double, _ efficiency: Double
  ) -> Double {
    Constants.apexLaunchPerBallSpeedDeg * ballSpeedMph
      * JSMath.max(0, launchAngleDeg) * efficiency
  }

  /// `apexLaunchFactor` — rent diagnostisk ratio.
  ///
  /// ⚠ MÅLT RATIO, IKKE FORMEL: motoren regner `apex / apexBallSpeedTerm`.
  /// Lukkede former avviker i 1747 hhv. 1551 av 5028 caser. Vakten står på
  /// NEVNEREN: alle 382 casene med nevner 0 har faktor eksakt 1 (0/0-vern).
  @inlinable
  public static func apexLaunchFactor(_ apex: Double, _ baseTerm: Double) -> Double {
    baseTerm == 0 ? 1 : apex / baseTerm
  }

  /// `apex = apexBase + apexLaunch`.
  ///
  /// ⚠ SUMMEN ER PRIMÆR. Ikke regn apex via `baseTerm × factor` — rundturen
  /// avviker 1 ULP i 479 av 5028 caser.
  @inlinable
  public static func apexFrom(_ baseTerm: Double, _ launchTerm: Double) -> Double {
    baseTerm + launchTerm
  }

  // ── Landing angle ────────────────────────────────────────────────────────

  /// `verticalSpinLoft = abs(DynamicLoft − AttackAngle)` — den VERTIKALE,
  /// ikke 3-D-en som §5.5 bruker (skiller seg i 4392 av 5028 caser).
  @inlinable
  public static func verticalSpinLoft(
    _ dynamicLoftDeg: Double, _ attackAngleDeg: Double
  ) -> Double {
    abs(dynamicLoftDeg - attackAngleDeg)
  }

  /// `landingSpinTerm = −41.5 × exp(−verticalSpinLoft / 10.9)`.
  ///
  /// Ledd, ikke vinkel: negativt (i `[−41.5, 0)`), legges til `landingBase`.
  /// Beregnes ALLTID — nulles i så fall ut av `landingDomainTerm`, ikke av en
  /// tidlig retur.
  public static func landingSpinTerm(_ verticalSpinLoftDeg: Double) -> Double {
    -Constants.landingSpinAmplitude
      * FDLibm.exp(-verticalSpinLoftDeg / Constants.landingSpinLoftTau)
  }

  /// `landingDomainTerm` — domenevakten som et LEDD, ikke en gren. Uten flukt
  /// er det nøyaktig det negative av alt annet, slik at `landingRaw` summerer
  /// til 0. Fyrer i 382 av 5028 caser.
  ///
  /// ⚠ Det er `landingBase + spinTerm` som nulles, ikke den KLAMPEDE
  /// vinkelen — `−clamp(model, 32, 60)` ville brutt 254 caser.
  @inlinable
  public static func landingDomainTerm(hasFlight: Bool, spinTerm: Double) -> Double {
    hasFlight ? 0 : -(Constants.landingBase + spinTerm)
  }

  /// `landingRaw` — summen av alle fem leddene, UKLAMPET. I 455 av 5028 caser
  /// ligger den under gulvet på 32° og løftes av klampen først i
  /// `landingAngleFrom`. Summeringen går venstre mot høyre i argumentrekkefølgen.
  @inlinable
  public static func landingRaw(
    _ spinTerm: Double, _ launchTerm: Double, _ apexTerm: Double, _ domainTerm: Double
  ) -> Double {
    Constants.landingBase + spinTerm + launchTerm + apexTerm + domainTerm
  }

  /// `landingAngle` — `hasFlight ? clamp(raw, 32, 60) : 0`. Gulvet fyrer i
  /// 455 caser; taket aldri (asymptote 52.8°). Taket beholdes fordi motoren
  /// har det.
  @inlinable
  public static func landingAngleFrom(hasFlight: Bool, raw: Double) -> Double {
    hasFlight
      ? JSMath.clamp(raw, Constants.landingMinimum, Constants.landingMaximum) : 0
  }

  /// De to døde leddene — FELT i fixturen, alltid eksakt 0 i baseline.
  /// Modellen har plass til launch- og apex-bidrag i landingsvinkelen, men
  /// koeffisientene er null. Kjent modellgrense, ikke en bug å fikse her.
  public static let landingLaunchTerm = 0.0
  public static let landingApexTerm = 0.0

  // ── Roll og total ────────────────────────────────────────────────────────

  /// `rollFrac` — utrulling som andel av carry. Leser den KLAMPEDE
  /// landingsvinkelen. Øvre klamp (0.055) fyrer i 531 caser; nedre aldri
  /// (ville krevd landing > 63.7° mot asymptote 52.8°).
  public static func rollFraction(carry: Double, landingAngleDeg: Double) -> Double {
    carry > 0
      ? JSMath.clamp(
        Constants.rollFracIntercept
          - (landingAngleDeg - Constants.rollFracLandingReferenceDeg)
          * Constants.rollFracLandingSlope,
        Constants.rollFracMinimum,
        Constants.rollFracMaximum)
      : 0
  }

  /// `roll = carry × rollFrac`.
  @inlinable
  public static func rollFrom(carry: Double, rollFrac: Double) -> Double {
    carry * rollFrac
  }

  /// `total`.
  ///
  /// ⚠ SPEC §5.6 SIER `Carry × (1 + rollFraction)`. MOTOREN GJØR DET IKKE.
  /// Den regner `carry + roll`. Algebraisk likt, numerisk ulikt: den
  /// distribuerte formen avviker 1 ULP i 1443 av 5028 caser. Fixturen har
  /// addisjonsformen. Motoren er fasit.
  ///
  /// Følge: `total − carry` gjenskaper ikke `roll` bit-eksakt (4492 caser).
  @inlinable
  public static func totalFrom(carry: Double, roll: Double) -> Double {
    carry + roll
  }

  // ── Hele §5.6 ────────────────────────────────────────────────────────────

  /// Alle 16 §5.6-feltene fixturen har, i yard og grader.
  ///
  /// `hasFlight` (ENGINE-GAPS §2: `carry > 0`) beregnes internt og returneres
  /// IKKE — den er lokal i dagens motor og `solveFlight` eksponerer den ikke.
  public static func solve(
    ballSpeed: Double,
    launchAngle: Double,
    dynamicLoft: Double,
    attackAngle: Double
  ) -> Result {
    let efficiency = launchEfficiency(launchAngle)
    let ballSpeedFit = carryBallSpeedFit(ballSpeed)
    let carry = carryFrom(ballSpeedFit, efficiency)

    let baseTerm = apexBallSpeedTerm(ballSpeed, efficiency)
    let launchTerm = apexLaunchTerm(ballSpeed, launchAngle, efficiency)
    let apex = apexFrom(baseTerm, launchTerm)

    // ENGINE-GAPS §2. Lokal, ikke returnert.
    let hasFlight = carry > 0

    let spinTerm = landingSpinTerm(verticalSpinLoft(dynamicLoft, attackAngle))
    let domainTerm = landingDomainTerm(hasFlight: hasFlight, spinTerm: spinTerm)
    let raw = landingRaw(spinTerm, landingLaunchTerm, landingApexTerm, domainTerm)
    let landingAngle = landingAngleFrom(hasFlight: hasFlight, raw: raw)

    let rollFrac = rollFraction(carry: carry, landingAngleDeg: landingAngle)
    let roll = rollFrom(carry: carry, rollFrac: rollFrac)
    let total = totalFrom(carry: carry, roll: roll)

    return Result(
      carry: carry,
      apex: apex,
      total: total,
      landingAngle: landingAngle,
      rollFrac: rollFrac,
      roll: roll,
      carryLaunchEfficiency: efficiency,
      carryBallSpeedFit: ballSpeedFit,
      apexBallSpeedTerm: baseTerm,
      apexLaunchTerm: launchTerm,
      apexLaunchFactor: apexLaunchFactor(apex, baseTerm),
      landingSpinTerm: spinTerm,
      landingLaunchTerm: landingLaunchTerm,
      landingApexTerm: landingApexTerm,
      landingDomainTerm: domainTerm,
      landingRaw: raw
    )
  }

  public struct Result: Equatable, Sendable {
    public let carry: Double
    public let apex: Double
    public let total: Double
    public let landingAngle: Double
    public let rollFrac: Double
    public let roll: Double
    public let carryLaunchEfficiency: Double
    public let carryBallSpeedFit: Double
    public let apexBallSpeedTerm: Double
    public let apexLaunchTerm: Double
    public let apexLaunchFactor: Double
    public let landingSpinTerm: Double
    public let landingLaunchTerm: Double
    public let landingApexTerm: Double
    public let landingDomainTerm: Double
    public let landingRaw: Double
  }
}
