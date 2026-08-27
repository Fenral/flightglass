/// Visningslaget over motoren (D74: hele `adapter/src/` sin produksjonsflate).
///
/// Formateringsreglene er D28/D29/D67; tabellene står i `DESIGN.md`.
/// Baneformen eies av dette laget, ikke av motoren og ikke av UI (D61).
///
/// Portstatus per modul — flagget under blir `true` først når ALT er inne,
/// slik at ingen leser grønt som ferdig:
///
/// | JS-modul | Swift | status |
/// |---|---|---|
/// | `convert.js` | `Convert` | ✅ portert, testet |
/// | `format.js` | `Format` (+ `JSNumber.toFixed`) | ✅ portert, testet |
/// | `displayFlight.js` | `DisplayFlight` | ✅ portert, testet |
/// | `displayStudio.js` | `DisplayStudio` | ✅ portert, testet |
/// | `traceShape.js` (inkl. `directionRay`, D63) | `TraceShape` | ✅ portert, testet |
/// | `studioShape.js` | `StudioShape` | ✅ portert, testet |
///
/// Verifikasjon i to lag: `DisplayFlightTests`/`TraceShapeTests` pinner
/// JS-referanseoutputs som literaler; `AdapterLiveIntegrationTests` beviser at
/// den levende Swift-`SolveFlight` reproduserer nettopp de literalene og at
/// visningskjeden gir samme tekster fra levende motor som fra referansen.
public enum FlightglassAdapter {
  /// Hele adapterflaten er portert og verifisert mot Swift-`SolveFlight`.
  public static let ported = true
}
