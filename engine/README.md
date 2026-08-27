# flightglass-engine

Baseline-reproduksjon av Flightglass' ballflukt- og treffgeometrimotor,
kilde-commit `410a365d47de5c7a1542edc71d0336cd5b7d1b56`.

## Absolutt regel

Dette er en **baseline**. Oppgaven er å reprodusere dagens motor **eksakt**,
inkludert alt som ser ut som en bug. Ingen forbedring, ingen opprydding, ingen
modernisering. Ser en formel feil ut: implementer den feil, akkurat som den er.

`motor/export/flight-golden.json` og `motor/export/studio-golden.json` er fasit.
Avviker koden fra fixturen, er det **koden** som har feil.

Senere faser endrer fysikken bevisst og versjonert. Ikke nå.

## Kjøring

```
cd engine
npm test          # node --test test/**/*.test.js
```

Ingen avhengigheter utenfor `node:test`. ESM, Node 24.

Testfiler må hete `*.test.js` og ligge under `test/`. Hjelpere med `_`-prefiks
(`_fixture.js`) plukkes ikke opp av globben.

> **Ikke bytt tilbake til `node --test test/`.** En positional mappe tolkes som
> glob på Node 24.14.1, matcher mappen selv, og runneren prøver å laste den som
> modul → `MODULE_NOT_FOUND`, exit 1. Glob-formen gir exit 0 både med og uten
> testfiler. Notatet ligger også i `package.json` som `"//scripts.test"`.

## Kodestil

- Rene funksjoner. Ingen skjult tilstand. Ingen I/O inne i fysikken.
- Ingen farger, UI-strenger eller presentasjonsdata i noe returobjekt.
- Alle numeriske konstanter kommer fra `src/constants.js`. Ingen tall
  hardkodes i en solver.
- Norsk i kommentarer er greit; identifikatorer på engelsk som i spec.

## Lagt (dette fundamentet)

| Fil | Innhold |
|---|---|
| `src/constants.js` | Alle numeriske konstanter fra spec §5 og §8 + ENGINE-GAPS. 86 eksporterte bindinger, ingen fysikk. |
| `test/_fixture.js` | `loadFlight()`, `loadStudio()`, `close(a, b, tol)`, `report(name, results)` + `loadFlightErrors()`, `loadStudioErrors()`, `loadFlightMeta()`, `loadStudioMeta()`. Filene leses én gang og caches i modulscope. |
| `test/_fixture.test.js` | 14 selvtester av fundamentet. Verifiserer casetall mot `_meta.counts`, at fixturen ikke har ikke-endelige tall, at `close`/`report` oppfører seg, at hver konstant er bit-identisk med feltet fixturen eksponerer, og de tre ULP-konvensjonene under. |

`loadFlight()` og `loadStudio()` returnerer **frosne, delte** arrays. Muter dem
aldri. Skal du sortere: `[...loadFlight()]`.

`report(name, results)` er ren — den skriver ingenting. Hver oppføring er
`{ id?, field?, expected, actual, tol? }`, eller `{ pass }` for et eksplisitt
utfall. Den returnerer `{ ok, total, passed, failed, maxDeviation, worst,
failures, summary }`. Vanlig bruk:

```js
const r = report('flight/carry', results);
assert.ok(r.ok, r.summary);
```

## Modulgrenser som skal fylles

Én modul per boks. Hver eksporterer rene funksjoner, importerer konstanter fra
`src/constants.js`, og har én testfil i `test/` som verifiserer mot fixturen.

### Fellesnivå

| Modul | Ansvar |
|---|---|
| `src/vec3.js` | `add`, `sub`, `scale`, `dot`, `cross`, `length`, `unit`, `hypot`. Verdensakser flight: `x = høyre`, `y = mållinjen`, `z = opp`. |
| `src/math.js` | `clamp`, `sign`, `degToRad`/`radToDeg`-bruk. Ingen fysikk. |
| `src/units.js` | mph ↔ m/s, yard ↔ meter, cm ↔ meter, rpm ↔ rad/s. Konverter **én gang** (spec §6). |

### Ball Flight

| Modul | Spec | Utfall som må matche fixturen |
|---|---|---|
| `src/dplane.js` | §5.2, GAPS §1 | `clubVelocityUnit`, `faceNormalUnit`, `spinLoft3DDeg`, `spinLoft`, `spinAxisUnit`, `spinAxis`, `signedVerticalSpinLoftDeg`, `horizontalSpinLoftComponent`, `verticalSpinLoftComponent`, `faceToPath` |
| `src/launch.js` | §5.1, §5.3 | `startDirection`, `startFaceW`, `launchAngle`, `launchInterceptBlend` |
| `src/smash.js` | §5.5 | `smash`, `smashEff`, `ballSpeed` |
| `src/spin.js` | §5.4, GAPS §5 | `spinCalibration`, `spinRpmRaw`, `totalSpinRpm`, `spinVectorRadPerSec`, `signedBackspinRpm`, `backspin`, `rightCurveSpinRpm` |
| `src/distance.js` | §5.6 | `carryBallSpeedFit`, `carryLaunchEfficiency`, `carry`, `apexBallSpeedTerm`, `apexLaunchTerm`, `apex`, `apexLaunchFactor`, `landingBase`/`landingSpinTerm`/`landingLaunchTerm`/`landingApexTerm`/`landingDomainTerm`/`landingRaw`, `landingAngle`, `rollFrac`, `roll`, `total` |
| `src/aero.js` | §5.7 | `Cl`, `Cd`, `CdBridge`, spinParameter, Reynolds, og akkumulert `aerodynamicDiagnostics` (`reynoldsRangeObserved`, `spinParameterRangeObserved`, `extrapolated`) |
| `src/rk4.js` | §5.7, GAPS §1 | Deterministisk RK4 på state `[x, y, z, vx, vy, vz, \|ω\|]`, start `z = 1e-6`, spinnretning låst til `unit(ω₀)`, lineær interpolasjon ved første bakkekryssing, kast ved 30 s. Gir `curveFlightTimeSeconds`, `curveFlightCarryYd`, `rawCurveFromLaunchLineM` |
| `src/curve.js` | §5.8, GAPS §6 | `curveCarryProjectionDefined`, `curveCarryProjectionScale`, `curveFromLaunchLineM`, `curve`, `offline` |
| `src/shape.js` | — | `shape` (15 verdier: `Straight`, `Push`, `Pull`, `Draw`, `Fade`, `Hook`, `Slice`, og kombinasjonene). **Terskler finnes ikke i spec — må fittes mot fixturen.** |
| `src/solve-flight.js` | §11.1 | Den offentlige `solveFlight({clubSpeed, faceAngle, clubPath, attackAngle, dynamicLoft})`. Eier alle 81 feltene i `out`. Skal bare motta endelige tall — parsing hører hjemme i et separat adapterlag. |
| `src/outcome.js` | GAPS §2–4 | Adapterlaget over `solveFlight`: `hasFlight = carry > 0`, `inDomain = signedVerticalSpinLoftDeg > 0`, `reason = null \| "spin-loft"`. Ingen av dem returneres av `solveFlight` selv. |

### Impact Studio

| Modul | Spec | Utfall som må matche fixturen |
|---|---|---|
| `src/studio-geometry.js` | §8.1–8.4 | `lowPointX`, `lowPointZ`, `effectiveLowPointX`, `lowPointWorld`, `planeBasis`, `thetaAtImpact`, `attackAngle`, `clubPath`, `impactPoint`, `shaftPivot`, `tangentAtImpact`, `planePolygon` |
| `src/studio-contact.js` | GAPS §7–9 | `contactHeight`, `clubBallContact` (`clubZ`, `offset`, `offsetRatio`, `theta`), `faceCentreOffsetMm`, `groundCrossingTheta0`, `groundEntry`, `groundExit` |
| `src/studio-strike.js` | §8.5, FUNN F1/F7 | `strikeBand` (7 verdier) og `strikeQuality.band` (5 verdier). **To ulike klassifiserere.** Terskler er ikke dokumentert numerisk — må fittes mot fixturen. |

Studio beregner aldri spinn, carry eller ballflukt (spec §11.3).

## Feller — ikke «fiks» disse

Verifisert i fixturen. Hver av dem vil se ut som en bug. Reproduser dem.

1. **To ulike ballradier.** Flight bruker `0.021335 m`, Studio `0.0213 m`.
2. **`spinAxis` kan ikke rekonstruere aksen.** Den offentlige skalaren er en
   tilt-vinkel. RK4 trenger `spinAxisUnit`-vektoren. (GAPS §1, FUNN F3.)
3. **`extrapolated: true` er normaltilstanden**, ikke unntaket — 87 % av
   realistiske slag. Ikke bygg en advarsel på den. (FUNN F2.)
4. **Spinntaket på 9000 rpm fyrer på 12 %** av realistiske slag. (FUNN F5.)
5. **`curve` tvinges til 0** når `hasFlight = false` eller `faceToPath === 0`.
   I baseline er rå RK4-kurve allerede 0 i alle 713 slike caser. Behold linjen
   som **assertion**, ikke som maske.
6. **`offline` mangler et `cos(startDirection)`-ledd** (spec §5.8, dokumentert
   ekstremvinkelbegrensning). Ikke legg det til.
7. **RK4 starter på `z = 1e-6`**, ikke 0.
8. **Studio-driver er en selvmotsigende stand-in.** `strikeBand` og
   `strikeQuality.band` er uenige i 82 % av driver-casene; `faceCentreOffsetMm`
   går til `−121 mm` på en flate som er ~60 mm høy. Jern er 0 % uenig.
   Reproduser begge klassifisererne som de er. (FUNN F1, F7.)
9. **`smash` bruker den 3-dimensjonale `spinLoft3DDeg`**, ikke den signerte
   vertikale spin loft.
10. **`solveFlight` klamper ikke de fem inputene.** `declaredInputBounds` i
    fixturens `_meta` er UI- og Guide-grenser, ikke motorgrenser.

## ULP-fellen: grader → radianer

Dette koster deg en dag hvis du ikke vet det. **De to motorene konverterer
grader til radianer i ulik rekkefølge**, og forskjellen er 1–2 ULP — nok til å
bryte bit-eksakte tester. Verifisert mot begge fixturene:

| Motor | Uttrykk | Bevis |
|---|---|---|
| Flight | `deg * (Math.PI / 180)`, dvs. `deg * degToRad` | `faceNormalUnit` 5028/5028 bit-eksakt. Motsatt rekkefølge: 4189/5028. |
| Studio | `(deg * Math.PI) / 180`, dvs. **ikke** `deg * degToRad` | `planeBasis.m.z`, `thetaAtImpact`, `contactHeight` alle 2500/2500. `deg * degToRad`: 2000 / 2300 / 2354. |

Ett unntak inne i Studio: den avsluttende gradskalaen i `perDegree`
(spec §8.2, `Radius × cos(φ) × π/180`) er gruppert som `* (Math.PI / 180)`,
altså `* degToRad`. Bit-eksakt `effectiveLowPointX` 2500/2500 krever begge
konvensjonene i samme uttrykk. Den blandingen finnes i dagens kode. Behold den.

`studioSweepRad` er tilsvarende `(48 * Math.PI) / 180`, ikke `48 * degToRad`.
Bruk literalen i `constants.js`, ikke en ny utregning.

Samme felle for cm → meter: Studio **dividerer med 100**. `* 0.01` gir feil
`lowPointX` i 250 av 2500 caser. Derfor heter konstanten `cmPerMetre = 100`
og ikke `cmToMetre = 0.01` — den gale operasjonen skal være tungvint å skrive.

Verifiserte bit-eksakte formler du kan bygge videre på (2500/2500, avvik 0):

```
// Studio
phi                 = (swingPlane * Math.PI) / 180
lowPointX           = (studioBallPositionOffsetCm - ballPositionCm) / cmPerMetre
lowPointZ           = (arcHeightCm + arcZ0Cm[clubMode]) / cmPerMetre
perDegree           = studioRadius * Math.cos(phi) * degToRad
effectiveLowPointX  = lowPointX - swingDirection * perDegree
thetaAtImpact       = Math.asin(clamp(-effectiveLowPointX / studioRadius, -0.999, 0.999))
contactHeight       = lowPointZ + studioRadius * (1 - Math.cos(theta)) * Math.sin(phi)
```

Alle tre fellene er dekket av `test/_fixture.test.js`. Feiler den, har noen
endret en konstant eller en rekkefølge — ikke fysikken.

## Sanering av fixturen (FUNN F6)

`studio-golden.json` sitt `strikeQuality` inneholder det gamle designsystemet
som data: `color`, `textColor`, `tip`, `pct`, `barPos` — Tailwind-palett og sju
hardkodede engelske UI-strenger, inkludert en rød/grønn-akse.

**Motoren skal ikke returnere noen av dem.** Behold `band`, `clubZ`,
`offsetRatio`, `theta`. Testene kan lese de øvrige feltene fra fixturen for å
bekrefte at de bevisst er utelatt — de skal aldri inn i et returobjekt.

Tilsvarende for flight: `aeroModel.disclosure`, `coefficientSetId` og
`reverseMagnusPolicy` er provenance-strenger som ligger i baseline-`out`. De
er samlet i `constants.js` som `aeroModelIdentity` slik at ingen hardkoder dem
i en solver. De er ikke brukervendt kopi.

## Åpne punkter for senere agenter

- **Shape-terskler** (`shape`, 15 verdier) er ikke dokumentert i noen spec-fil.
  Må reverse-engineeres fra `flight-golden.json`.
- **Strike-båndterskler** for både `strikeBand` og `strikeQuality.band` er ikke
  dokumentert numerisk utover Duff-dybden på 25 mm. Må reverse-engineeres fra
  `studio-golden.json`.
- **`landingDomainTerm`** har fem distinkte verdier i baseline og er tydeligvis
  et avledet clamp-/domeneledd, ikke en konstant. Utled det, ikke tabuler det.
- **RK4-timeout-casen** (`edge.rk4-no-ground-within-30-seconds`, `clubSpeed:
  18000`) har `error`, ikke `out`. `loadFlight()` filtrerer den bort;
  `loadFlightErrors()` gir den. Feilmeldingen må matche ordrett:
  `"Flight did not reach the ground within maxTimeSeconds"`.

## Kilder

| Fil | Innhold |
|---|---|
| `../01-PHYSICS-AND-MECHANICS-ENGINE.md` | Formler, konstanter, fortegn |
| `../motor/export/ENGINE-GAPS.md` | Ni hull spec-en ikke dekket, besvart med formler |
| `../motor/export/flight-golden.json` | 5029 caser (5028 med `out`), 81 outputfelt |
| `../motor/export/studio-golden.json` | 2500 caser, 1250 iron / 1250 driver |
| `../motor/FUNN.md` | Verifikasjonsrapport, kjente feil F1–F7 |
| `../motor/export/VERIFY.md` | Feltvis verifikasjon |
