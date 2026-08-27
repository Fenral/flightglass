/// offlineComposition — §5.8 Sluttposisjon. Produserer `offline`.
///
/// BASELINE. Portert fra `engine/src/offlineComposition.js`, inkludert den
/// dokumenterte ekstremvinkelfeilen. Fixturen er fasit.
///
/// Spec §5.8, ordrett: `Offline = Carry × sin(StartDirection × π/180) + Curve`.
/// Alt i yards. Fortegn: `+` = høyre for alle tre.
///
/// ── FEILEN SOM SKAL REPRODUSERES ──────────────────────────────────────────
///
/// `Curve` er målt vinkelrett på LAUNCH-LINJEN, `Offline` vinkelrett på
/// MÅLLINJEN. Den geometrisk konsistente formen ville hatt et
/// `cos(StartDirection)`-ledd på curve-komponenten. Det finnes ikke i dagens
/// motor og skal ikke legges til (README-felle 6). Med cos-leddet bryter 4015
/// av 5028 caser — også mot 1e-9 relativ toleranse, ikke bare bit-eksakt.
///
/// ── ULP-FELLE: grader → radianer ──────────────────────────────────────────
///
/// ⚠ DENNE MODULEN BRUKER IKKE `Angles.flightDegToRad`. Ikke en forglemmelse.
///
/// §5.8-komposisjonen ligger i en annen kildefil enn D-plane-geometrien
/// (`impact-flight.js`, ikke `flightglass-3d-spin-model.js`) og grupperer
/// motsatt — som studio:
///
///   `(StartDirection * π) / 180`   5028/5028 bit-eksakt, avvik 0
///   `StartDirection * degToRad`    4529/5028, maks avvik 2.84e-14
///
/// 499 caser skiller, alle peker samme vei. Fixture-bevist, ikke antatt.
/// Derfor kaller den `Angles.studioDegToRad` — grupperingsmessig er det den
/// samme regelen, selv om modulen hører til flight.
public enum OfflineComposition {

  /// `StartDirection × π/180` med §5.8-grupperingen `(deg * π) / 180`.
  @inlinable
  public static func startDirectionRad(_ startDirectionDeg: Double) -> Double {
    Angles.studioDegToRad(startDirectionDeg)
  }

  /// Sidekomponenten fra startretningen alene: `Carry × sin(StartDirection)`.
  ///
  /// Grunnen til at et rent push/pull får sideavvik selv når `Curve = 0`.
  /// Ved `StartDirection = 0` er leddet 0 og `offline == curve` —
  /// fixture-belagt i 206 caser.
  ///
  /// BASELINE-DETALJ: `Carry` er den empiriske carry-distansen langs bakken,
  /// ikke lengden langs launch-linjen. En del av feilen §5.8 dokumenterer.
  public static func startLineSide(carry: Double, startDirectionDeg: Double) -> Double {
    carry * FDLibm.sin(startDirectionRad(startDirectionDeg))
  }

  /// Selve komposisjonen: `startLineSide + curve`.
  ///
  /// ⚠ `curve` legges til URØRT. Ingen `cos(StartDirection)`.
  @inlinable
  public static func composeOffline(_ startLineSideYd: Double, _ curve: Double) -> Double {
    startLineSideYd + curve
  }

  /// §5.8 samlet. Tar de tre ferdige verdiene fra oppstrøms; beregner og
  /// validerer ingen av dem.
  ///
  /// Ingen guard på `hasFlight`: uten flukt er både `carry` og `curve`
  /// allerede 0 oppstrøms, og `0 × sin(x) + 0` er 0. Fixture-bekreftet i alle
  /// 382 casene med `carry = 0`.
  public static func solve(
    carry: Double, startDirection: Double, curve: Double
  ) -> Double {
    composeOffline(
      startLineSide(carry: carry, startDirectionDeg: startDirection), curve)
  }
}
