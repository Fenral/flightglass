# Beslutninger tatt i Swift-porten som ikke sto i DECISIONS.md

Leveranse 4 i oppdrag F. Føres løpende, ikke rekonstruert til slutt.

Hver post er merket med kategori:

- **Idiom** — Swift-idiom, filstruktur eller navnekonvensjon internt i pakken.
  Dekket av oppdragsbrevets eksplisitte unntak; føres her for sporbarhet, ikke
  fordi den trengte godkjenning.
- **Synlig** — blir synlig for laget som bygger SwiftUI oppå. IKKE dekket av
  unntaket. Skal godkjennes av eier før porten regnes som ferdig.
- **Numerisk** — enhver forskjell fra fixturen. IKKE dekket av unntaket.
  Skal aldri tas uten eier. Ingen slike er tatt.

---

## S1 — Pakken bor i `swift/` på rotnivå

**Kategori:** Idiom

Én Swift Package `Flightglass` med to library-targets, `FlightglassEngine` og
`FlightglassAdapter`, plassert i `swift/` ved siden av `engine/` og `adapter/`.
Ingen eksisterende fil er flyttet eller endret.

**Hvorfor:** Oppdragsbrevet sier «Swift Package: `FlightglassEngine` (motor) +
`FlightglassAdapter` (visningslag)», som leses som én pakke med to targets — det
gir én `swift test` for begge og lar adapteren avhenge av motoren uten et
publiseringssteg imellom.

---

## S2 — `Vec3` som verditype, ikke `[Double]`

**Kategori:** Synlig

JS bruker `{ x, y, z }`-objektliteraler og rå arrays om hverandre. Swift-porten
har én `Vec3`-struct med navngitte felt.

**Hvorfor:** `[Double]`-vektorer gir ingen kompilatorhjelp mot at en 3-vektor
forveksles med et 2-element-intervall, og motoren har begge deler
(`reynoldsValidity` er faktisk et par, `wind` er faktisk en vektor).

**Konsekvens for SwiftUI-laget:** vektorfelt i returobjektene er `Vec3`, ikke
array. Gjelder blant annet `spinAxisUnit`, `clubVelocityUnit`, `faceNormalUnit`.

---

## S3 — `aeroModel.class` heter `className` i Swift

**Kategori:** Synlig

Fixturen har feltet `out.aeroModel.class`. `class` er et reservert ord i Swift.
Feltet heter derfor `className` på `AeroModelIdentity`, og mappes tilbake til
`"class"` når verdien sammenlignes med eller serialiseres mot fixturen.

**Hvorfor:** Alternativet er `` `class` `` med backticks, som er lovlig Swift,
men som smitter til hver kallside og til enhver `Codable`-nøkkel.

**Merk:** Dette er en provenance-streng, ikke brukervendt kopi. Ingen numerisk
konsekvens.

---

## S4 — Ingen delt `degToRad(_:)`-funksjon finnes i pakken

**Kategori:** Idiom

`Angles` eksponerer tre navngitte konverteringer — `flightDegToRad`,
`studioDegToRad`, `studioPerDegreeScale` — og ingen nøytral variant.

**Hvorfor:** Den nøytrale varianten er nøyaktig fellen. Et navn som ikke tvinger
fram et motorvalg lar 1-ULP-forskjellen snike seg inn på en kallside der ingen
ser etter den. Konstanten `Constants.degToRad` finnes fortsatt, fordi fixturen
eksponerer den, men den er dokumentert som «ikke bruk rått».

---

## S5 — `clubMode` er en enum, ikke en streng

**Kategori:** Synlig

JS bruker `"iron"` / `"driver"` som strengnøkler i `arcZ0Cm` og
`sweetSpotAboveSoleM`. Swift bruker `enum ClubMode: String`.

**Hvorfor:** Oppslagene er totale i JS bare ved konvensjon; en enum gjør dem
totale ved kompilering, og `RawValue` gir gratis lesing fra fixturens strenger.

**Konsekvens for SwiftUI-laget:** studio-API-et tar `ClubMode`, ikke `String`.

---

## S6 — `Math.hypot` reproduseres som V8s algoritme, ikke som `sqrt`-sum

**Kategori:** Idiom (men den viktigste tekniske i porten så langt)

`Math.hypot` med tre argumenter finnes ikke i Swift, og C-bibliotekets `hypot`
tar bare to. `engine/README.md` måler at valget betyr noe: `hypot3` +
multiplikasjon med invers gir 4999/4999 bit-eksakte caser, mens
`sqrt(x²+y²+z²)` + multiplikasjon gir 3373/4999.

V8 implementerer `Math.hypot` som **normalisering mot største absoluttverdi +
Kahan-kompensert summasjon**, ikke som en naiv kvadratsum. `JSMath.hypot`
reproduserer den algoritmen steg for steg.

**Verifisert, ikke antatt:** algoritmen ble kjørt mot Node 24.14.1 sin egen
`Math.hypot` over 400 000 tilfeldige tripler og et sett kantverdier
(`0,0,0` · `1e300,1e300,1e300` · `5e-324,5e-324,0` · `1e-8,1e8,1`):
**0 avvik**. Naiv `sqrt`-sum avvek i 141 462 av de samme 400 000.

**Merk:** `JSMath.hypot` bruker kun `× ÷ − +` og `sqrt` — alle korrekt avrundet
under IEEE 754. Den er derfor bit-identisk på Windows og iOS, i motsetning til
`sin`/`cos`/`atan2`.

---

## S7 — Relativt avvik måles mot `|expected|`, ikke mot et gjennomsnitt

**Kategori:** Synlig (definerer tallene i avviksrapporten)

Oppdragsbrevet deklarerer `1e-12` og `1e-9` «relativt» uten å definere nevneren.
Porten bruker `|actual − expected| / |expected|`, med fallback til absolutt
avvik når `expected == 0`.

**Hvorfor:** fixturen er fasit. Et avvik skal måles mot fasiten, ikke mot
`max(|expected|, |actual|)` eller et gjennomsnitt av fasit og kandidat — de to
siste gjør et stort portavvik kunstig lite ved å la kandidatens egen feil vokse
nevneren.

**Konsekvens:** tallene i avviksrapporten er relative til JS-verdien. Det står
i rapportens hode.

---

## S8 — Avviksrapporten er et biprodukt av testkjøringen

**Kategori:** Idiom

`DeviationLog` samler én linje per felt per toleranseklasse mens testene
kjører, og skriver dem til fil til slutt. Rapporten skrives ikke for hånd.

**Hvorfor:** en håndskrevet avviksrapport kan drifte fra hva testene faktisk
måler. Da er den verre enn ingen rapport, fordi den ser etterprøvd ut.

**Bieffekt:** hvert felt rapporteres to ganger — én gang mot den deklarerte
toleransen (som dømmer) og én gang mot `.exact` (som bare teller). Antallet
bit-eksakte caser er det som avslører libm-forskjeller mellom Windows og iOS.

---

## S9 — Fixturene leses med `ExactJSON`, ikke `JSONSerialization`

**Kategori:** Idiom (kun testmålet), men den mest kritiske i porten

`JSONSerialization` på Windows leser ikke binary64 korrekt avrundet. Målt på
ni verdier fra fixturen: **5 av 9 feil**, opptil **2 ULP**.

| tekst i fixturen | Node / korrekt | JSONSerialization |
|---|---|---|
| `0.8377580409572781` | `…781` (`…ebd5`) | `…782` (`…ebd6`) |
| `10.391891433573875` | `…875` (`…9090`) | `…878` (`…9092`) |
| `-0.1693792957175766` | `…766` (`…fe18`) | `…7657` (`…fe17`) |
| `-0.0033788247838473073` | `…073` (`…d9dc`) | `…07` (`…d9db`) |
| `0.9205937574433162` | `…162` (`…dd97`) | `…161` (`…dd96`) |

Dette ble oppdaget av modul 1 sin egen presisjonsvakt, som var skrevet nettopp
for å fange det. Uten den ville hver eneste fixturesammenligning hatt en
1–2 ULP feilkilde i seg — og verre: den ville produsert «avvik» som ser ut som
portfeil og sendt feilsøkingen til feil sted.

`ExactJSON` er en rekursiv nedstigning over UTF-8-bytes som bruker `strtod`
til tall. `strtod` er korrekt avrundet per C99 og gir samme svar som V8.

Verifisert av `JSONPrecisionTests`, som også dokumenterer feilen. Blir
`JSONSerialization` rettet i en senere toolchain, sier testen fra — og da skal
`ExactJSON` fjernes, ikke omgås.

---

## S10 — Bit-eksakthet rapporteres, men dømmer ikke

**Kategori:** Synlig (definerer hva avviksrapporten påstår)

Hvert felt får to rader i avviksrapporten: én mot den deklarerte toleransen,
merket `OK`/`FAIL`, og én mot `.exact`, merket `INFO`.

**Hvorfor:** et felt som ligger innenfor sin deklarerte toleranse er godkjent
selv om libm avrundet siste bit ulikt. Å la bit-eksakthetsraden dømme ville
kalt en libm-forskjell for en portfeil. Men å ikke måle den ville skjult
nettopp det signalet som forteller hvilke felt som må måles på nytt på iOS.

---

## S11 — `exp` sin ENE målte divergens fra fdlibm er pinnet, ikke bortforklart

**Kategori:** Numerisk — men den GJENOPPRETTER samsvar med V8, den innfører
det ikke. Meldt her fordi enhver numerisk avgjørelse skal stå skrevet.

`FDLibm.exp` reproduserer fdlibm/msun `__ieee754_exp` bit-eksakt på 181 179
verdier. Ett punkt avviker: **`x == 1.0` eksakt.** fdlibm gir
`2.7182818284590455`; V8 gir `2.718281828459045`, som er den korrekt avrundede
`e` og bit-identisk med `Math.E`.

**Målt, ikke gjettet.** En tett ULP-sveip over 4001 sammenhengende doubles
rundt 1.0 ga avvik i nøyaktig ett punkt. To ulike algoritmer kan ikke være
enige om 4000 naboer og uenige om én i midten — altså er resten riktig, og
dette ene punktet gjør V8 annerledes. Bredere sveip over ~120 000 eksakte
desimalverdier (alle heltall i domenet, `k/16`, `k/64`, `k/1000`) fant ingen
flere.

Punktet er **nåbart fra motoren**: `exp(-vsl / 10.9)` treffer det ved
`vsl = -10.9`, og sigmoiden ved `vsl = 29.84`. Derfor er det implementert som
et eksplisitt tilfelle med testen som pinner det — ikke en kommentar om at det
er usannsynlig.

**Underveisfunn:** for `spinMagnitude` sine faktiske argumenter divergerer
`FDLibm.exp` og ucrt sin `exp` i **0 av 5028** caser. Der ga D86 altså
bit-eksakthet gratis. Gevinsten ligger i `atan2`, der plattformforskjellen
faktisk ble målt til 2 ULP.

---

## S12 — `sinSpinLoft3DFromDegrees` feiler høyt i stedet for å bruke plattform-`sin`

**Kategori:** Synlig

JS-modulen har en fallback fra grader til sinus for kallere uten
kryssproduktet. Den er dokumentert som IKKE baseline-veien (koster opptil
7.3e-12 rpm og gjør 1724 av 5028 caser bit-uleselige), og `solveFlight` bruker
den ikke.

Swift-versjonen kaller `preconditionFailure` til `FDLibm.sin` er portert og
verifisert.

**Hvorfor:** å midlertidig kalle plattformens `sin` ville lagt en stille
ikke-bit-eksakt sti inn i en motor hvis hele poeng etter D86 er at slike ikke
finnes. En høy feil er bedre enn et plausibelt tall.

---

## Løst — Å1 avgjort som D86

**PORTER FDLIBM.** Eierens beslutning, med begrunnelsen at bit-eksakthet er en
kategorisk sterkere garanti enn «innenfor toleranse»: enhver framtidig
differanse blir per definisjon en bug, og D73-forbeholdet faller bort.

Status per funksjon:

| funksjon | status | verifikasjon mot V8 |
|---|---|---|
| `hypot` | ✅ | 400 000 tripler + kantverdier, 0 avvik |
| `exp` | ✅ | 181 179 par bit-eksakt |
| `sin` | ✅ | 183 614 par bit-eksakt |
| `cos` | ✅ | 183 614 par bit-eksakt |
| `atan` | ✅ | 177 522 par bit-eksakt |
| `atan2` | ✅ | 130 048 tripler bit-eksakt |
| `asin` | ✅ | 178 454 par bit-eksakt |
| `acos` | ✅ | 178 454 par bit-eksakt |
| `pow` | ⏸ Å2 åpen | rk4, `pow(S, 0.4)` — V8 er IKKE fdlibm, se Å2 |
| `tan` | ✅ | 209 210 par bit-eksakt |

`sqrt` er IEEE-eksakt fra før. `round`, `min`, `max`, `abs`, `sign` er
JS-semantikk, ikke libm — portert i `JSMath`.

### Målt gevinst av D86

Beslutningen betalte seg der den ble spådd. `geometry3d`, før og etter:

| felt | før (plattform-libm) | etter (fdlibm) |
|---|---|---|
| `spinAxis` | 4095/5028 bit-eksakt, maks 2 ULP | **5028/5028**, maks avvik 0.0 |
| `spinLoft3DDeg` | 4169/5028 bit-eksakt, maks 2 ULP | **5028/5028**, maks avvik 0.0 |

Hele §5.2 er nå bit-eksakt mot fixturen — alle åtte felt, null avvik.

### Måling: hvor mye trenger `pow` porten?

`pow` brukes på ÉN måte i motoren: `pow(max(0, spinParameter), 0.4)`, to
kallsteder i RK4. Målt mot 142 006 tripler generert fra V8:

| | bit-eksakt | maks avvik |
|---|---|---|
| plattformens `pow`, hele tabellen | 141 734/142 006 | 1.0 ULP |
| plattformens `pow`, motorens domene | 47 429/47 531 | 1.0 ULP |

**102 caser i motorens eget domene divergerer.** Det er 0,21 % — men de mater
inn i RK4, som integrerer over ~600 steg. En 1-ULP forskjell i løftekoeffisienten
akkumulerer. `pow` skal derfor portes, ikke unntas.

`sqrt` er IEEE-eksakt fra før. `round`, `min`, `max`, `abs`, `sign` er
JS-semantikk, ikke libm — portert i `JSMath`.

---

## Åpne — venter på eier

### ~~Å2~~ AVGJORT SOM D92 — V8s pow er plattform-libm; ventilen vedtatt uendret

**Oppdatering 2026-08-26, med kildebevis.** Etter tre målinger (fdlibm-port
93,1 %, ucrt 99,79 %, dobbel-dobbel korrekt avrundet 80,1 %) hentet jeg V8s
faktiske kilde for versjonen Node 24.14.1 kjører (13.6.233.17):

`v8/src/numbers/ieee754.cc`, `v8::internal::math::pow`:

```cpp
double pow(double x, double y) {
  if (v8_flags.use_std_math_pow) {   // DEFAULT TRUE i 13.6
    // ES-spesialtilfeller: NaN-eksponent, ±1^±∞ → NaN,
    // y == 2 → x·x, y == 0.5 → sqrt(x + 0)
    return std::pow(x, y);           // ← PLATTFORMENS CRT
  }
  return base::ieee754::legacy::pow(x, y);  // fdlibm, AVSLÅTT
}
```

`DEFINE_BOOL(use_std_math_pow, true, "use std::pow instead of our custom
implementation")` — `flag-definitions.h:1029`.

**Node 24s `Math.pow` er altså `std::pow` fra CRT-en Node ble KOMPILERT med**
(statisk MSVC-CRT på Windows-builds). Det forklarer alle tre målingene:
maskinens dynamiske ucrtbase.dll er samme algoritmefamilie som Nodes statiske
libucrt (99,79 % enige, resten 1 ULP fra CRT-versjonsdrift), fdlibm er en
annen algoritme (93 %), og ingen av dem er korrekt avrundet (80 % mot dd).

**Konsekvensen for D86:** for `pow` FINNES det ingen pinnet algoritme å
portere. Referansen er en spesifikk CRT-binærs pow, og den flytter seg med
Node-versjonen og byggeplattformen. De sju andre funksjonene er ekte fdlibm
og forblir bit-eksakte; `pow` er unntaket der «reproduser V8» betyr
«reproduser en binær ingen har kildekoden til i pinnet form».

**Anbefaling (erstatter A/B/C):** sikkerhetsventilen, presist utformet:
- `FDLibm.pow` = ES-wrapperen (NaN-eksponent, ±1^±∞ → NaN, y==2 → x·x,
  y==0.5 → sqrt(x+0) — den er semantikk og skal med uansett) rundt
  **plattformens `pow`**.
- Dokumentert per-felt-toleranse på RK4-terminalfeltene (deklarert 1e-9 rel.;
  målt CRT-drift er 1 ULP i 0,21 % av motor-domenet — fire tierpotenser under).
- Differensialtesten (leveranse 3) dømmer RK4-feltene mot 1e-9, ikke eksakt,
  med målt maks avvik i rapporten.

Vei B er BEVIST umulig (V8 er ikke korrekt avrundet); en bit-eksakt kopi av
akkurat denne CRT-binæren ville vært skjørere enn toleransen den skulle
erstatte.

### ~~Å2 (opprinnelig formulering) — `pow`: V8 bruker IKKE fdlibm~~

**Kategori:** Numerisk. **Ikke min beslutning.**

Jeg portert fdlibms `__ieee754_pow` ordrett og kjørte den mot V8 med samme
metode som de seks andre. Resultatet er entydig — og negativt:

| implementasjon | bit-eksakt mot V8, motorens domene (`pow(S, 0.4)`, S ∈ [0.08, 0.22]) |
|---|---|
| fdlibm `__ieee754_pow` (min port) | 55 868/60 000 — **93,1 %** |
| plattformens `pow` (ucrt) | 47 429/47 531 — **99,79 %** |

**fdlibm er verre enn plattformen.** Alle avvik er 1 ULP. Det utelukker
praktisk talt en transkripsjonsfeil: en feil i porten ville gitt store,
klumpete avvik, ikke en jevn 1-ULP-strøm over hele domenet. Signaturen er
i stedet klassisk fdlibm-`pow`, som er ~1 ULP unøyaktig, målt mot noe som er
mer nøyaktig.

Konklusjonen er at **V8s `Math.pow` verken er fdlibm eller ucrt.** Den ser ut
til å være (nær) korrekt avrundet. De seks andre funksjonene var ren fdlibm;
`pow` er unntaket.

**Sidefunn som gjelder uansett vei:** `Math.pow` i JS er ikke C-ens `pow`.
ECMAScript overstyrer fire kanttilfeller:

| uttrykk | C `pow` | JS `Math.pow` |
|---|---|---|
| `pow(1, ∞)` | 1 | **NaN** |
| `pow(1, −∞)` | 1 | **NaN** |
| `pow(−1, ±∞)` | 1 | **NaN** |
| `pow(1, NaN)` | 1 | **NaN** |

Enhver `pow`-port må ha ES-innpakningen, ellers er den feil uansett hvilken
kjerne som velges. Dette gjelder ikke motorens eget domene, men det ville vært
en stille feil i en gjenbrukt funksjon.

**Hva som står på spill:** `pow` brukes to steder, begge i RK4 sin
løftekoeffisient. Med plattformens `pow` divergerer 102 av 47 531 caser i
motorens domene med 1 ULP — og de mater inn i en integrasjon over ~600 steg.

Se spørsmålet til eier. Ingenting gjøres før det er avgjort.

---

### ~~Å1 — Skal porten være bit-eksakt på tvers av plattformer?~~ AVGJORT: D86

**Kategori:** Numerisk / strategisk. **Ikke min beslutning.**

Modul 2 er grønn innenfor deklarert toleranse, men to felt er ikke bit-eksakte:

| felt | innenfor `rel 1e-12` | bit-eksakt | maks avvik | maks ULP |
|---|---|---|---|---|
| `spinAxis` | 5028/5028 | **4095/5028** | 2.41e-16 | 2.0 |
| `spinLoft3DDeg` | 5028/5028 | **4169/5028** | 2.44e-16 | 2.0 |

Årsaken er isolert: begge går gjennom `atan2`, og inputene deres er
bit-identiske (`spinAxisUnit` er 15084/15084 eksakt). Altså er det `atan2`
selv som avviker — ucrt sin mot den V8 brukte.

**V8 bruker ikke plattformens libm** for de transcendentale. Den har sin egen
fdlibm-port i `base/ieee754.cc`. Porteres den til Swift, blir motoren
uavhengig av libm og dermed bit-eksakt på Windows OG iOS — og hele
D73-forbeholdet faller bort.

Kostnaden er reell: `atan2`, `sin`, `cos`, `exp` og `pow` må portes og
verifiseres hver for seg, på samme måte som `JSMath.hypot` ble det.

Alternativet er å beholde plattformens libm og leve med de målte avvikene,
som ligger fire tierpotenser innenfor deklarert toleranse.

Se rapporten til eier. Ingenting gjøres her før det er avgjort.

---

## S13 — Modul 6–10 portert; alle felt bit-eksakte

**Kategori:** Statusnotat, ingen nye beslutninger utover det som står under.

Mens Å2 (pow) venter på eier, er alle modulene som IKKE trenger `pow` portert
og verifisert bit-eksakt mot alle 5028 flight-caser:

| modul | felt | detaljer pinnet i test |
|---|---|---|
| backspinProjection | 4 (+vektor) | kollineær-grenen fyrer i nøyaktig 692 caser |
| smashBallSpeed | 3 | rundtur-avvik smash≠smashEff i 372; clamp 290/127 |
| longitudinalLegacy | 16 | total = addisjon (1443 form-avvik); 382 no-flight-dekomponeringer eksakt 0; landingsgulv 455; roll-tak 531 |
| offlineComposition | 1 | manglende cos-ledd bryter nøyaktig de 4015 curve≠0-casene; §5.8 bruker (deg·π)/180-grupperingen INNE i flight — fixture-bevist |
| outcomeAdapter | shape + 3 predikater | shape ordrett i 5028/5028; inDomain-grensen er strengt `> 0` |

Én idiomatisk beslutning i outcomeAdapter: `reason` er `String?` med `nil` for
JS-ens `null` — samme skille, Swift-form. Kategori Synlig (API-form), meldes
her.

`offlineComposition`-testen leser `curve` fra fixturens `out` — samme mønster
som JS-motorens egen test, siden RK4-kjeden som produserer `curve` ikke er
portert enda. Når modul 11 (rk4) finnes, byttes inngangen til portens egen.

Full suite: **104 tester, 0 feil.** Gjenstår i motoren: rk4Integrator,
curveProjection (begge venter på Å2/pow), solveFlight, studio-kjeden.

---

## S14 — Studio-kjeden komplett: modul 11–14

**Kategori:** Statusnotat + tre synlige API-beslutninger.

Hele studio-kjeden er portert og verifisert: `StudioGeometry` (§8.1–8.4),
`StudioContact` (GAPS §7–9), `ContactModel` (v2), `StrikeBand` (v2),
`StudioSolve` (v2). Full suite: **136 tester, 0 feil.**

Verifikasjon mot studio-fixturen (2500 caser):

- **Bit-eksakt** på alle geometri- og kontaktfelt: `lowPointX`, `lowPointZ`,
  `effectiveLowPointX`, `thetaAtImpact`, `attackAngle`, `clubPath`,
  `contactHeight`, `faceCentreOffsetMm`, `clubBallContact` (alle fire),
  `groundCrossingTheta0`, `groundEntry`/`groundExit` (inkl. null-skap i alle
  1375 kryssingsfrie caser og den rå flyttallsresten i z), `planeBasis`,
  `lowPointWorld`.
- **Restfeilen i turfBand er identisk med JS:** 1239/1250, fordelt
  4 `Thin→Fat` + 7 `Fat→Thin`. Sammensetningen er pinnet i test, ikke bare
  totalen (D74).
- **v1-paritet for attack/path i studioSolve v2 er bit-eksakt** — JS-testen
  krever `< 1e-12`; porten måler avvik 0.0.
- NaN-vakten (BASELINE-FUNN [12]), F7-absurditeten (−121 mm), F11-vakten og
  whiff-terskelen på arve-radiusen er alle pinnet i egne tester.

Tre synlige beslutninger for SwiftUI-laget:

1. **Vokabularene er enums**, ikke strenger: `StrikeBand.TurfBand`
   (`Duff/Fat/Pure/Thin/Whiff`), `StrikeBand.FacePosition`
   (`OffFace/Low/Centre/High`), `StrikeBand.Regime` (`turf/teed`),
   `ContactModel.Confidence` (`measured/interpolated/assumed`). `rawValue`
   er JS-strengen, så fixturesammenligning er tapsfri. `strikeLead` forblir
   `String` fordi den spenner over begge vokabular.
2. **`StudioSolve.solve` kaster** (`ContractError`) på ikke-endelige input og
   negativ lie — samme kontrakt som JS (`TypeError`/`RangeError`), typet.
3. **`LIE_PRESETS` er `ContactModel.LiePreset`-enum** med `heightMm` —
   D66 sine sju navngitte presets, mm-verdien synlig.

---

## S15 — Hele adapterflaten portert (D74)

**Kategori:** Statusnotat + to synlige beslutninger.

Alle seks adaptermoduler er portert og testet: `Convert`, `Format`
(+ `JSNumber`), `DisplayFlight`, `DisplayStudio`, `TraceShape` (inkl.
`directionRay`, D63, og `traceSamples`, D79), `StudioShape`.
Full suite: **191 tester, 0 feil.**

Nøkkelfunn og -valg:

1. **`toFixed` er ikke `printf`** (Synlig — definerer hver visningsstreng).
   JS runder half-up på doublens EKSAKTE desimalekspansjon; `printf` runder
   half-even. Målt: `(0.25).toFixed(1) = "0.3"` mot printf `"0.2"`, men
   `(1.005).toFixed(2) = "1.00"` (doublen er 1.00499…). `JSNumber.toFixedAbs`
   reproduserer JS-semantikken via 25 korrekt avrundede desimaler + manuell
   half-up med mente. Grensetilfellene er målt i Node og pinnet i test.
2. **JS `Math.round` er half-mot-+∞**, ikke away-from-zero
   (`Math.round(-2.5) = -2`). `JSNumber.round` er tro; brukes av `lieMm`.
3. `traceShape` bruker `(deg · π) / 180`-grupperingen (målt: JS-koden er
   venstreassosiativ `deg * Math.PI / 180`) — altså `Angles.studioDegToRad`,
   i flight-adapteren. Samme mønster som `offlineComposition`.
4. D79-invariant 2 er verifisert over SAMTLIGE 5028 fixture-caser i Swift:
   `traceSamples`-endepunktene er bit-identiske med motorens `offline`/`carry`
   (tilordnet, aldri regnet).
5. **Synlig:** `DisplayFlight.displayFlight` tar `[String: Double]` — JS tar
   hele `out`-objektet. Når `SolveFlight` finnes, får den en typet overload;
   ordboksformen består for fixturedrevne tester.
6. `DisplayFlight`/`TraceShape`-testene kjører mot PINNEDE JS-referanseoutputs
   (generert fra `solveFlight` i Node, verdiene ligger i testfilen) til
   Swift-`SolveFlight` finnes — samme integrasjonsbevis, referansen som kilde.

---

## S16 — RK4-toleransens gulv er portert fra JS-baselinens eget testregime

**Kategori:** Numerisk presisering — men PORTERT, ikke oppfunnet. Kilden er
referansens egne tester.

Første kjøring av `solveFlight` mot fixturen feilet på ett felt:
`rawCurveFromLaunchLineM`, 93 caser, «relativt avvik 2.0». Årsaken var ikke
porten: i de 713 `faceToPath == 0`-casene ER feltet ren flyttallsstøy
(~1e-15 m), og `1e-9 relativt` av femtometer er attometer — meningsløst.

JS-baselinen møtte nøyaktig samme hull og formaliserte svaret i
`engine/test/rk4Integrator.test.js` og `integration.test.js`:

    toleranse = max(1e-9 × |forventet|, 1e-12 absolutt)

Swift-porten bruker samme form (`Tolerance.relativeWithFloor`), samme tall.
Gulvet gjelder DOMMEN, ikke målingen: rapporten fører fortsatt målt maks
avvik ufiltrert.

---

## S17 — Strøm F komplett: alle fire leveranser

**Kategori:** Statusnotat.

**207 tester, 0 feil.** Full kjede:

1. **Pakken:** `FlightglassEngine` (17 moduler) + `FlightglassAdapter`
   (6 moduler, `ported == true` båret av levende integrasjonstest) + XCTest
   som leser fixturene direkte.
2. **Avviksrapporten:** `swift/AVVIKSRAPPORT.md` + maskinlesbar TSV skrevet
   av kjøringen. Alt utenfor RK4-kjeden bit-eksakt (avvik 0.0); RK4-kjeden
   innenfor `max(1e-9 rel, 1e-12 abs)` med marginer på 5–7 tierpotenser.
3. **Differensialkjøringen:** 500 nye leveringer utenfor fixturen — Swift og
   JS enige på hvert felt, i praksis på bit-nivå (499/500 bit-eksakt på
   kurvefeltene, alt annet 500/500 med avvik 0.0). `shape` ordrett.
4. **Beslutningslisten:** denne filen — S1–S17 pluss Å-sporene, med
   kategoriene Idiom/Synlig/Numerisk og eierens vedtak (D73, D74, D75, D86,
   D90, D92) referert der de avgjorde.

Gjenstående forbehold: Mac-rekjøring (formalitet unntatt pow-stien, D92).
