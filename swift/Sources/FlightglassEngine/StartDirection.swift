/// §5.1 Startretning — `startDirection` og `startFaceW`.
///
/// BASELINE. Portert fra `engine/src/startDirection.js`.
///
/// ```
/// faceWeight     = clamp(0.90 − 0.005 × DynamicLoft, 0.60, 0.88)
/// StartDirection = faceWeight × FaceAngle + (1 − faceWeight) × ClubPath
/// ```
///
/// Ingen trigonometri her, så ULP-fellen for grader → radianer gjelder ikke
/// denne modulen. Alle tre vinklene inn og vinkelen ut er i grader hele veien.
/// Det gjør modulen **plattformuavhengig**: den skal være bit-eksakt på
/// Windows og iOS like godt.
public enum StartDirection {

  /// Face-vekten fra §5.1. Faller lineært med Dynamic Loft og klampes til
  /// `[0.60, 0.88]`.
  ///
  /// **BASELINE-DETALJ, ikke «fiks» den:** taket på `0.88` gjør at interceptet
  /// `0.90` aldri kan nås. Under `DynamicLoft = 4°` er vekten konstant `0.88`.
  /// Fixturen viser det direkte — `dynamicLoft: 0` gir `startFaceW: 0.88`,
  /// ikke `0.90`.
  ///
  /// Gulvet på `0.60` krever `DynamicLoft > 60°`, altså utenfor
  /// `declaredInputBounds` (`dynamicLoft: [0, 50]`). Ingen av de 5028 casene
  /// treffer det. Grenen er spec-belagt, men ikke fixture-belagt, og beholdes
  /// uendret. På nøyaktig `60°` gir `0.90 − 0.005 × 60` verdien
  /// `0.6000000000000001`, én ULP over gulvet, så clampen biter først OVER
  /// 60°. Flyttallsdetalj, ikke en bug.
  public static func startFaceWeight(dynamicLoft: Double) -> Double {
    JSMath.clamp(
      Constants.startFaceWIntercept - Constants.startFaceWLoftSlope * dynamicLoft,
      Constants.startFaceWMinimum,
      Constants.startFaceWMaximum
    )
  }

  /// Blandingen fra §5.1, med vekten som eksplisitt input.
  ///
  /// ⚠ Skrevet som `w × face + (1 − w) × path`, IKKE den algebraisk like
  /// `face + (1 − w) × (path − face)`. De to gir ulike siste-bit i flyttall,
  /// og bare den første er bit-eksakt mot fixturen.
  ///
  /// Fortegn (spec §4, høyrehendt golfer): `+` = høyre for både input og output.
  public static func blendStartDirection(
    faceAngle: Double,
    clubPath: Double,
    faceWeight: Double
  ) -> Double {
    faceWeight * faceAngle + (1 - faceWeight) * clubPath
  }

  /// §5.1 samlet. Ren funksjon.
  ///
  /// `clubSpeed` og `attackAngle` inngår ikke i §5.1 og tas bevisst ikke imot.
  /// Ingen validering av input: spec §3 legger parsing og koersjon i et
  /// separat adapterlag, og en kastende sjekk her ville vært ny oppførsel,
  /// ikke baseline.
  public static func solve(
    faceAngle: Double,
    clubPath: Double,
    dynamicLoft: Double
  ) -> Result {
    let startFaceW = startFaceWeight(dynamicLoft: dynamicLoft)
    return Result(
      startDirection: blendStartDirection(
        faceAngle: faceAngle, clubPath: clubPath, faceWeight: startFaceW),
      startFaceW: startFaceW
    )
  }

  public struct Result: Equatable, Sendable {
    public let startDirection: Double
    public let startFaceW: Double
  }
}
