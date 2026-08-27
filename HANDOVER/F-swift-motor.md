# Oppdrag F — Swift-port av motoren

**Les `00-FELLES.md` først.** Uavhengig av alle designstrømmer. Kan starte nå.
Dette er den kritiske stien til native (D70): ingenting kan skipes før motoren
finnes i Swift.

---

## Prinsippet

**JS-motoren er referanseimplementasjonen (D71). Fixturen er fasit.**

Du porterer ikke «etter beste evne» — du reproduserer en pinnet sannhet:

- `motor/export/flight-golden.json` — 5 028 caser, 81 felt hver
- `motor/export/studio-golden.json` — 2 500 caser
- `engine/` — 465 grønne tester som viser nøyaktig hva hver modul gjør

Dette er samme mønster som `engine/src/aero-reference.js`: to uavhengige
implementasjoner er trygt **kun** når differansen håndheves i test.

## Rekkefølgen

Speil JS-motorens moduler, i samme rekkefølge som baseline ble bygget:

1. `constants` — alle konstanter, navngitt som i JS
2. `geometry3d` → `startDirection` → `launchAngle` → `spinMagnitude` →
   `backspinProjection` → `smashBallSpeed` → `longitudinalLegacy`
3. `rk4Integrator` → `curveProjection` → `offlineComposition` → `outcomeAdapter`
4. `studioGeometry` → `studioContact` → `contactModel` → `strikeBand` → `studioSolve`
5. `solveFlight` som syr sammen 2–3

Hver modul porteres med sin egen test mot fixturen **før** neste begynner —
ikke alt på én gang og debug til slutt.

## Toleranse — deklarert, ikke antatt

Bit-eksakthet på tvers av språk er urealistisk: `sin`/`cos`/`atan2` har ulike
libm-implementasjoner, og rekkefølgefølsomme summer kan avvike i siste ULP.
Men JS `Number` og Swift `Double` er begge IEEE 754 binary64, så ren aritmetikk
skal være eksakt.

- **Algebraiske operasjoner:** forvent eksakt likhet. Avvik er en feil i porten.
- **Transcendentale kjeder:** toleranse `1e-12` relativt per felt.
  **Rapporter maks avvik per felt** — tallet skal stå i leveransen, ikke bare
  «innenfor toleranse».
- **RK4-kjeden:** akkumulerte ULP-avvik over ~600 steg; toleranse `1e-9`
  relativt på terminalfeltene. Rapporter.

Klarer et felt ikke toleransen: **finn årsaken**, ikke løsne toleransen.
JS-baselinen fant bit-eksakthet i 12 av 14 moduler — lista over ULP-feller
(rekkefølge på grad-til-radian, `x*(1/hypot)` mot `x/hypot`, osv.) står i
`engine/README.md` og gjelder like mye i Swift.

## Feller som VIL bite

Fra `engine/README.md`, ti nummererte — de viktigste for en port:

- **To ballradier med vilje:** flight bruker `0.021335`, studio-arven `0.0213`,
  ny kontaktmodell `0.021336`. IKKE harmoniser dem — de er pinnet hver for seg.
- **Whiff-terskelen er `1.4 × 0.0213`**, ikke `1.4 × 0.021336`. Utledet fra
  fixturen, dokumentert i `strikeBand.js`.
- **`curve` tvinges til 0 når `faceToPath === 0`** — behold som assertion.
- **Grad-til-radian:** flight bruker `deg * (Math.PI/180)`, studio
  `(deg * Math.PI) / 180`. Det er 1 ULP forskjell og fixturen ser den.
- **NaN-vakten** i `groundCrossingTheta0` (BASELINE-FUNN [12]) skal med.
- Restfeilen på 11 caser i `turfBand` er **kjent og pinnet** — ikke «fiks» den.

## Adapteren følger med

`adapter/src/` porteres også: `convert`, `format`, `displayFlight`,
`traceShape` (inkl. `directionRay`). Formateringsreglene er D28/D29/D67 —
tabellene står i `DESIGN.md`. Testene i `adapter/test/` porteres med.

## Struktur

Swift Package: `FlightglassEngine` (motor) + `FlightglassAdapter` (visningslag),
rene funksjoner, ingen UIKit/SwiftUI-avhengighet i noen av dem. Testene er
XCTest som leser fixturene direkte fra `motor/export/`.

## Ikke gjør

- Ikke «forbedre» fysikk underveis. Enhver forskjell fra JS er en feil i porten
  til det motsatte er bevist mot fixturen.
- Ikke skriv om JS-motoren for å gjøre porten lettere. Den er pinnet.
- Ikke slå sammen konstantene som ser like ut. De er ikke like.

---

## Regelen som gjelder over alle andre

Finner du noe som **ikke** er bestemt i `DECISIONS.md` eller `DESIGN.md` —
**stopp og spør eieren. Ikke bestem selv.** Det gjelder selv om valget virker
opplagt. Særlig da.

**Unntak:** rene implementeringsdetaljer uten designkonsekvens — Swift-idiomer,
filstruktur, navnekonvensjoner i pakken.

**Ikke unntak:** enhver numerisk forskjell fra fixturen, enhver API-endring i
motorkontrakten, alt som blir synlig for laget som bygger SwiftUI oppå.

## Leveranse

1. `FlightglassEngine` + `FlightglassAdapter` som Swift Package med XCTest
2. **Avviksrapport per felt:** maks avvik mot fixturen for alle 81 flight-felt
   og alle studio-felt, med toleransen de ble målt mot
3. Differensialkjøring mot JS-motoren på 500 tilfeldige nye leveringer
   (utenfor fixturen) — beviser at portene er enige også der fasiten ikke finnes
4. Liste over beslutninger du tok som ikke sto i `DECISIONS.md`
