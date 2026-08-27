/// curveProjection — carry-projeksjon av den rå RK4-kurven. ENGINE-GAPS §6.
///
/// BASELINE. Portert fra `engine/src/curveProjection.js`. Modulen eier ingen
/// fysikk: den skalerer `C_raw` med forholdet mellom empirisk carry og rå
/// downrange, og nuller feltet i to tilfeller.
///
/// ── Grenene, ordrett fra GAPS §6 (⚠ rekkefølgen er load-bearing) ──────────
/// 1. `targetCarryM <= 1e-12` → definert, skala 1
/// 2. ellers `D_raw >= 1`     → definert, skala `targetCarryM / D_raw`
/// 3. ellers                  → IKKE definert, skala nil, kurven står rå
///
/// Alle 382 casene med `carry = 0` treffer gren 1 selv om `D_raw` er opptil
/// 3 m. Gren 3 treffes av nøyaktig ÉN case (`edge.curve-sub-one-m-positive-
/// carry`, `D_raw = 0.0023 m`).
///
/// ── Nullingen ─────────────────────────────────────────────────────────────
/// `hasFlight == false` ELLER `faceToPath == 0` tvinger METERTALLET til 0;
/// `curve` er gradskonverteringen av det allerede nullede tallet.
/// `hasFlight`-leddet undertrykker ekte tall (opptil 3.5e-6 m, 300 caser);
/// `faceToPath`-leddet undertrykker flyttallsstøy (maks 2.02e-13 m) men er
/// IKKE bit-redundant — 400 caser ryker uten det. Behold begge.
///
/// ── ULP-regler verifisert i JS ────────────────────────────────────────────
/// - yard → meter: `yards * 0.9144` (ikke divisjon med resiprok)
/// - meter → yard: `metres / 0.9144` (ikke multiplikasjon med resiprok)
/// - skala: `targetCarryM / D_raw` (ikke `* (1/D_raw)`)
public enum CurveProjection {

  /// Yard → meter: MULTIPLIKASJON.
  @inlinable
  public static func yardsToMetres(_ yards: Double) -> Double {
    yards * Constants.yardToMetre
  }

  /// Meter → yard: DIVISJON.
  @inlinable
  public static func metresToYards(_ metres: Double) -> Double {
    metres / Constants.yardToMetre
  }

  /// De tre grenene. `scale == nil` nøyaktig når `defined == false`.
  public static func carryProjection(
    rawDownrangeM: Double, targetCarryM: Double
  ) -> (defined: Bool, scale: Double?) {
    // Gren 1 FØR gren 2: ingen flukt ⇒ ingen projeksjon, uansett hva RK4 rakk.
    if targetCarryM <= Constants.curveCarryProjectionTargetCarryEpsilon {
      return (true, 1)
    }
    if rawDownrangeM >= Constants.curveCarryProjectionMinimumDownrangeM {
      return (true, targetCarryM / rawDownrangeM)
    }
    return (false, nil)
  }

  /// Rå kurve skalert. Udefinert projeksjon lar `C_raw` stå (gren 3).
  /// I gren 1 er `C_raw * 1` bit-identisk med `C_raw` — multiplikasjonen er
  /// uniform.
  @inlinable
  public static func projectedCurveFromLaunchLineM(
    _ rawCurveFromLaunchLineM: Double, scale: Double?
  ) -> Double {
    guard let s = scale else { return rawCurveFromLaunchLineM }
    return rawCurveFromLaunchLineM * s
  }

  /// GAPS §6-nullingen: `!hasFlight || faceToPath == 0`.
  @inlinable
  public static func curveIsSuppressed(hasFlight: Bool, faceToPath: Double) -> Bool {
    !hasFlight || faceToPath == 0
  }

  public struct Result: Equatable, Sendable {
    public let curve: Double  // yard
    public let curveFromLaunchLineM: Double  // meter
    public let curveCarryProjectionScale: Double?  // nil = udefinert
    public let curveCarryProjectionDefined: Bool
  }

  /// De fire offentlige feltene i ett kall. `curve` er ikke selvstendig:
  /// den er `curveFromLaunchLineM` i yard, etter nullingen.
  public static func solve(
    rawCurveFromLaunchLineM: Double,
    rawDownrangeM: Double,
    targetCarryM: Double,
    hasFlight: Bool,
    faceToPath: Double
  ) -> Result {
    let (defined, scale) = carryProjection(
      rawDownrangeM: rawDownrangeM, targetCarryM: targetCarryM)

    let projected = projectedCurveFromLaunchLineM(rawCurveFromLaunchLineM, scale: scale)

    let curveFromLaunchLineM =
      curveIsSuppressed(hasFlight: hasFlight, faceToPath: faceToPath) ? 0 : projected

    return Result(
      curve: metresToYards(curveFromLaunchLineM),
      curveFromLaunchLineM: curveFromLaunchLineM,
      curveCarryProjectionScale: scale,
      curveCarryProjectionDefined: defined)
  }
}
