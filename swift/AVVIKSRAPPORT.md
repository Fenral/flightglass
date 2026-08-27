# Avviksrapport — Swift-porten mot fixturen (leveranse 2)

**Status: KOMPLETT.** Alle 17 motormoduler, hele adapterflaten, hele
libm-laget. **207 tester, 0 feil.**

**Kilde:** [Tests/AVVIKSRAPPORT.tsv](Tests/AVVIKSRAPPORT.tsv), skrevet av
testkjøringen selv (S8: aldri for hånd).

**Verifisert på:** Windows 10, Swift 6.3.3 (`x86_64-unknown-windows-msvc`),
Node 24.14.1 / V8 13.6.233.17 som referanse.

**Plattformstatus (D73/D86/D92):** De ni fdlibm-funksjonene bruker kun korrekt
avrundet IEEE-aritmetikk og er bit-eksakte på enhver plattform — for alt
UTENFOR RK4-kjeden er Mac-rekjøringen før shipping en formalitet. For
**pow-stien (RK4-kjeden) er den REELL**: `pow` er plattform-CRT bak
ES-wrapperen (D92), og tallene under må måles på nytt på Apples libm.
Budsjettet tåler det: målt drift er 5–7 tierpotenser under toleransen.

**Toleranseregimet** (deklarert; RK4-formen er JS-baselinens egen,
`engine/test/integration.test.js`):

| klasse | dømmes mot |
|---|---|
| algebra + fdlibm-transcendentale | eksakt (bit) |
| RK4-kjeden (`rawCurveFromLaunchLineM`, `curveFlightCarryYd`, `curveFlightTimeSeconds`, `curve`, `curveFromLaunchLineM`, `curveCarryProjectionScale`, `offline`, aero-intervallene) | `max(1e-9 · |forventet|, 1e-12)` |

Relativt avvik måles mot `|expected|` (S7).

---

## Hovedresultat

**Alle felt UTENFOR RK4-kjeden: bit-eksakte i samtlige caser. Maks avvik 0.0.**
Det gjelder 66 av 73 skalarfelt + alle 4 vektorfelt i flight (5028 caser),
alle studio-felt (2500 caser), og strengfeltene (`shape`, `club`) ordrett.

**RK4-kjedens 7 felt: alle innenfor regimet, med marginer på 5–7
tierpotenser:**

| felt | pass | målt maks avvik | bit-eksakt | maks ULP |
|---|---|---|---|---|
| `curveFlightTimeSeconds` | 5028/5028 | 4.1e-16 rel | 4078/5028 | 3 |
| `curveFlightCarryYd` | 5028/5028 | 9.2e-16 rel | 4171/5028 | 7 |
| `curveCarryProjectionScale` | 5027/5027 (+1 null-case) | 8.4e-16 rel | 4262/5027 | 7 |
| `curve` | 5028/5028 | 5.3e-15 rel | 3564/5028 | 43 |
| `curveFromLaunchLineM` | 5028/5028 | 5.3e-15 rel | 3522/5028 | 39 |
| `offline` | 5028/5028 | 5.2e-14 rel | 3722/5028 | 256 |
| `rawCurveFromLaunchLineM` | 5028/5028 | * | 3455/5028 | * |
| aero-intervallene (Re/S min/maks) | 20112/20112 | 2.6e-15 rel | 17292/20112 | 16 |

\* `rawCurveFromLaunchLineM` sine ekstremtall (rel 2.0, enorme ULP) er
gulvsonens artefakt: i de 713 `faceToPath == 0`-casene ER feltet ren
flyttallsstøy (~1e-15 m — femtometer), og relative mål er meningsløse der.
Absolutt maks avvik i støysonen: 5.7e-14 m. Alle innenfor gulvet på 1e-12.
JS-baselinens egen port-fit hadde samme profil (3463/5028 bit-eksakt mot vår
3455/5028).

## Differensialkjøringen (leveranse 3) — 500 nye leveringer utenfor fixturen

Generert med pinnet frø (`gen-differential.mjs`, xorshift32), kjørt gjennom
JS-motoren (D71), null rutenettkollisjoner, alle 500 løste.

**Swift og JS er enige på HVERT felt i alle 500** — inkludert `shape` ordrett:

| feltklasse | resultat |
|---|---|
| alle eksakt-felt (66 skalarfelt + 4 vektorer) | 500/500 bit-eksakt, avvik 0.0 |
| `curve` / `curveFromLaunchLineM` / `rawCurveFromLaunchLineM` | 500/500; maks 3.1e-16 rel; **499/500 bit-eksakte** |
| `curveFlightCarryYd` / `curveFlightTimeSeconds` / `offline` / `curveCarryProjectionScale` | **500/500 bit-eksakt, avvik 0.0** |

Enigheten der fasiten ikke finnes er altså i praksis bit-nivå. (Den er så god
fordi maskinens ucrt og Nodes statiske CRT er 99,79 % enige om `pow` — på Mac
vil differensialen vise CRT-drift innenfor samme 1e-9-regime.)

## libm-laget (D86/D92)

| funksjon | verifisert mot V8 | status |
|---|---|---|
| `hypot` | 400 000 tripler + kanter | bit-eksakt, plattformuavhengig |
| `exp` `sin` `cos` `atan` `atan2` `asin` `acos` `tan` | 1 013 935 + 209 210 verdier | bit-eksakte, plattformuavhengige |
| `pow` | 142 006 tripler | **D92: ES-wrapper (eksakt) rundt plattform-CRT.** Målt drift mot V8: 1 ULP i 0,19 % totalt / 0,21 % i motor-domenet. Dømmes aldri bit-eksakt. |

`exp` har ETT pinnet V8-unntak (`x = 1.0` → korrekt avrundet `e`, S11).
`sqrt` er IEEE-eksakt. `rem_pio2` gren 4 er ikke portert (grense ~1,6 mill.
rad; motorens maksargument < 7) — vaktet med `preconditionFailure` + test.

## Motor- og adapterflaten (sammendrag)

- **Flight, 5028 caser:** constants · geometry3d · startDirection ·
  launchAngle · spinMagnitude · backspinProjection · smashBallSpeed ·
  longitudinalLegacy · offlineComposition · outcomeAdapter · rk4Integrator ·
  curveProjection · solveFlight. Timeout-casen kaster med ordrett melding.
- **Studio, 2500 caser:** studioGeometry · studioContact · contactModel v2 ·
  strikeBand v2 (restfeil 11, identisk sammensetning som JS: 4 `Thin→Fat` +
  7 `Fat→Thin`, pinnet per D74) · studioSolve v2 (attack/path-paritet
  bit-eksakt).
- **Adapter (D74, hele flaten):** Convert · Format (+`JSNumber.toFixed`) ·
  DisplayFlight · DisplayStudio · TraceShape (D79-endepunkter bit-identiske
  over alle 5028 caser, mot både fixtur og levende motor) · StudioShape.
  `FlightglassAdapter.ported == true`, båret av `AdapterLiveIntegrationTests`.

## D74-eksklusjonene (vedtatt, ikke mangler)

| JS-modul | hvorfor ute |
|---|---|
| `deriveImpact.js`, `strikeBandIron.js` | v1-baseline, forblir JS; delte geometrifelt verifisert direkte |
| `aero-reference.js` | differensialpartneren ER JS-motoren selv |
| `metricRegistry.js` | porteres med Ask-strømmen |
| `connectionsGraph` | data, motoruavhengig (D44) |

## Gjenstående forbehold

1. **Mac-rekjøring før shipping** — formalitet for alt unntatt RK4-kjeden;
   REELL for den (D92). Regenerer denne rapporten der.
2. Restfeilen på 11 i `turfBand` er pinnet (D74) — ikke et forbehold, en
   egenskap.
