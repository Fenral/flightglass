# Verifikasjon av motoruttrekk — 2026-08-24

Kilde-commit: `410a365d47de5c7a1542edc71d0336cd5b7d1b56`
Verifisert uavhengig av kvitteringen. Alt under er etterprøvd i fixturen selv.

## Verifisert OK

- **5028 gyldige flight-caser** + 1 eksplisitt feilcase (RK4-timeout, `clubSpeed 18000`).
  81 outputfelt. **Null ikke-endelige tall.**
- **2500 studio-caser**, 1250 iron / 1250 driver.
- Alle fire golden cases fra spec §9 reproduserer eksakt etter enhetskonvertering
  yards → meter (`× 0.9144`). Kontrollert for hånd.
- **63 tester, exit 0.**
- Tre SHA-256 matcher README-tabellen eksakt.
- 28 Ask-spørsmål (10/4/5/3/2/4 per tema), 19 med lab, gapClass 19/5/2/2 — stemmer med spec.
- 23 noder, 36 kanter (24 direct / 1 coupled / 11 modeled) — stemmer med spec.
- `_knownDebt` levert i begge datafiler, uredigert. Ingen kildekode fulgte med.

## F1 — Driver emitterer to udokumenterte strike bands  🔴

Spec-en dokumenterer **fem** bands: `Pure`, `Thin`, `Fat`, `Duff`, `Whiff`.
Motoren emitterer **syv**. `Low` og `High` finnes ikke i noen spec-fil.

Fordelingen viser at det kjører **to separate klassifiseringssystemer**:

| Band | n | clubMode |
|---|---:|---|
| `Low` | 586 | **100 % driver** |
| `High` | 293 | **100 % driver** |
| `Whiff` | 320 | **100 % iron** |
| `Thin` | 139 | **100 % iron** |
| `Fat` | 302 | **100 % iron** |
| `Duff` | 310 | 249 iron / 61 driver |
| `Pure` | 550 | 310 driver / 240 iron |

- **Iron:** Pure / Thin / Fat / Duff / Whiff — turf-vokabular. Dokumentert.
- **Driver:** Pure / Low / High / Duff — treffpunkt-vokabular. **Udokumentert.**

Bygges Studio fra spec-en alene, kan den aldri produsere `Low` eller `High`,
og 35 % av driver-tilstandsrommet klassifiseres feil.

**Dessuten:** `faceCentreOffsetMm` går til `−121.15` for driver `Low` og `−119.45`
for iron `Whiff`. En driverflate er ~60 mm høy. −121 mm er fysisk umulig.
Driver-stand-in-modellen produserer tull over store deler av sitt eget område.

`03-IMPACT-STUDIO.md` akseptansekriterium 7 åpner allerede for å fjerne driver.

## F2 — 87 % av realistiske slag er aerodynamiske ekstrapolasjoner  🟠

Koeffisientbroens deklarerte gyldighet er Reynolds `70 000–210 000` og
spin parameter `0.08–0.20`.

| Rutenett | extrapolated = true |
|---|---:|
| Realistisk band | **86.9 %** |
| Full bredde | 91.1 % |
| Totalt | **89.6 %** |

Årsak i realistisk band (n=1875): spin parameter over `0.20` i **1325** caser,
Reynolds under `70 000` i 913.

Dette er ikke en bug. Ballen bremser ned gjennom flukten, så `S = Rω/v` stiger
mot slutten av hver eneste bane. **Gyldighetsvinduet er smalere enn en ekte
ballbane.** `extrapolated: true` er normaltilstanden, ikke unntaket.

Konsekvens: å vise `extrapolated` som advarsel i UI ville fyre på 87 % av slagene.
Det er støy, ikke informasjon. Spec §5.7 formulerer det som et unntak — det er feil.

## F3 — Motorens offentlige kontrakt er utilstrekkelig til å reprodusere seg selv  🟠

`ENGINE-GAPS` §1, ordrett: *«the five public scalars named in the question are
insufficient without `spinAxisUnit`.»*

Spec §5.2 sier eksplisitt at den offentlige `spinAxis` er tilt-vinkelen i grader,
**ikke** aksevektoren. Men RK4 trenger vektoren for å initialisere `ω₀`.
De 13 dokumenterte outputene kan altså ikke reprodusere banen.

Ny motor må eksponere `spinAxisUnit`. Fixturen inneholder den.

## F4 — `inDomain` og `reason` er tynnere enn spec-en antyder  🟡

Ingen av dem returneres av `solveFlight`. Begge er felt i Outcome-adapteren.

```
inDomain = (signedVerticalSpinLoftDeg > 0)
reason   = null | "spin-loft"
```

Hastighet, Reynolds, spin parameter, launch, carry, clamps og RK4-diagnostikk
inngår **ikke** i predikatet. `reason` har nøyaktig to verdier.

`02-BALL-FLIGHT` akseptansekriterium 8 krever at ugyldig tilstand «forklares med
motorens `reason`». Den forklaringen dekker én eneste feilmodus.

## F5 — Spinntaket på 9000 rpm fyrer på 12 % av realistiske slag  🟡

| Rutenett | totalSpinRpm ≥ 9000 |
|---|---:|
| Realistisk band | **12.0 %** |
| Full bredde | 22.4 % |

En clamp som slår inn på hvert åttende slag er ikke et sanity ceiling — den er
en synlig modellgrense. To slag med ulik levering kan vise identisk spinn.

## Ikke et funn — kontrollert og frikjent

`ENGINE-GAPS` §6 sier at `curve` tvinges til `0` når `faceToPath === 0`.
Testet: **713 caser** har `faceToPath = 0`. I **alle** er rå RK4-kurve også `0`
og `spinAxis` `0`. Matematisk nødvendig — face og path i samme vertikalplan gir
horisontal spinnakse. Linjen er belte-og-seler, ikke maskering. Ingenting kastes.

Ny motor bør beholde den som **assertion**, ikke som maske: blir rå kurve noen
gang ulik null der, er det en bug som skal opp, ikke skjules.

---

## F6 — Motoroutput inneholder det gamle designsystemet som data  🔴

`strikeQuality` er ikke geometri. Den er et presentasjonsobjekt smuglet ut
gjennom motorgrensen:

```json
{ "band": "Thin", "color": "#EAB308", "textColor": "#FBBF24",
  "tip": "Thin — club catches the top of the ball (bladed).",
  "pct": 77, "barPos": 39.67, "offsetRatio": 0.3098, "clubZ": 0.0279 }
```

**Hardkodede farger i fixturen:**

| Felt | Verdier |
|---|---|
| `color` | `#22C55E` `#A16207` `#DC2626` `#EAB308` |
| `textColor` | `#4ADE80` `#F87171` `#FBBF24` |

Dette er **Tailwinds standardpalett** — green-500, yellow-500, red-600,
yellow-700, green-400, red-400, amber-400. Pluss sju hardkodede engelske
UI-strenger i `tip`.

Konsekvens: konsumeres fixturen rått, importerer vi det gamle fargesystemet —
inkludert en **rød/grønn**-akse, som er det dårligste mulige valget for
fargeblindhet og direkte i strid med D10.

**Fixturen må saneres før den blir kontrakt.** Behold `clubZ`, `offsetRatio`,
`theta`. Slett `color`, `textColor`, `tip`, `pct`, `barPos`.

## F7 — Driver har to klassifiserere som motsier hverandre i 82 % av tilfellene  🔴

`strikeBand` og `strikeQuality.band` er uenige:

| clubMode | n | uenige |
|---|---:|---:|
| **iron** | 1250 | **0 = 0.0 %** |
| **driver** | 1250 | **1029 = 82.3 %** |

Uenighetsparene er ikke nyanser — de er motsetninger:

| n | `strikeBand` | `strikeQuality.band` |
|---:|---|---|
| 544 | `Low` | **`Whiff`** |
| 240 | `High` | **`Fat`** |
| 127 | `Pure` | **`Thin`** |
| 42 | `Low` | `Thin` |
| 28 | `High` | `Pure` |
| 25 | `High` | `Thin` |
| 23 | `Pure` | `Fat` |

`Low` vs `Whiff` betyr: én klassifiserer sier «lavt treff på slagflaten»,
den andre sier «kølla gikk helt over ballen». 544 ganger.

**Jern er 0 % uenig.** Feilen er isolert til driver-stand-in-en.

Sammen med F1 (udokumenterte bands, `faceCentreOffsetMm` ned til −121 mm) er
saken avgjort: driver-modellen er ikke en umoden funksjon, den er selvmotsigende.

---

## Korreksjon til F1 — driver-bandene er utledet  ✅

Skeptiker `uavhengig-reberegning` reproduserte driver-klassifisereren **1250/1250**
med en tre-terskels regel på to verdier motoren allerede returnerer:

```
contactHeight < −0.025          → Duff
faceCentreOffsetMm < −8         → Low
faceCentreOffsetMm > +8         → High
ellers                          → Pure
```

Tersklene har rene gap i fixturen:
`Duff` maks `clubZ −0.02536835` mot `High` min `−0.02437712` (spec §8.5 oppgir 25 mm).
`Pure` `faceCentreOffsetMm [−7.7717, 7.9279]` mot `Low` maks `−8.0763` og `High` min `8.0172`.

`strikeQuality.band` lar seg tilsvarende reprodusere 2500/2500.

**Jeg skrev at bandene var udokumenterte. Det var riktig. Jeg lot det stå som om de
var ukjente. Det var feil.** Begge klassifiserere er nå fullt karakterisert, og
uenigheten på 82.3 % er en presist beskrivbar egenskap — ikke et mysterium.

Konsekvens for **D5**: vi vet nøyaktig hva vi erstatter, og kan diffe den nye
klassifisereren mot begge de gamle.

---

## F8 — To definisjoner av spin loft i samme beregningskjede  🔴

Påpekt av eier 2026-08-25, verifisert numerisk mot alle 4 315 caser der de skiller:

| Modell | Matet med | Treff |
|---|---|---:|
| `spinCalibration` (§5.4) | **vertikal** `abs(dynLoft − attack)` | 4315/4315 |
| `smash` (§5.5) | **3D** `spinLoft3DDeg` | 4315/4315 |

Kalibreringssigmoiden er altså **blind for face og path**. Ved en 7-jern-levering
står `spinCalibration` bom fast på `1.0782` mens face-to-path går fra −8° til +15°.
Spinnet stiger likevel 6,6 %, men kun gjennom tangentialleddet `|v × n|`, som ser
hele 3D-geometrien.

Halve modellen ser 3D, halve ser 2D.

Konsekvens av å mate 3D inn i kalibreringen i stedet:

| | |
|---|---|
| Caser der 3D ≠ vertikal | 4 315 av 5 028 = **85,8 %** |
| Snittendring i spinn | 1,93 % |
| Snittendring i realistisk band | 0,19 % |
| **Største endring** | **35,6 %** |
| Caser over 20 % endring | 150 |

Effekten er liten i midten og stor i ytterkantene — altså nøyaktig der appen
eksisterer for å forklare noe. Sigmoidens bredde er `2,14°`, og 3D-avviket ved
face-to-path 15° er `2,76°`. Mer enn en hel bredde.

## F9 — TRUKKET TILBAKE 2026-08-25  ⬛

> **Denne konklusjonen holdt ikke. Se F10.** Den er beholdt uredigert under fordi
> feilslutningen er mer lærerik enn påstanden var.

### ~~Spinn kan ikke forutsis fra leveringsgeometri alene~~

Tour-tall, Trackman 2023, loft invertert fra publisert launch:

| Kølle | spin loft | køllefart | tour spinn | nødvendig cal |
|---|---:|---:|---:|---:|
| Driver | 16,2° | 115 mph | 2 545 | **0,590** |
| 5-wood | 16,2° | 106 mph | 4 322 | **1,091** |

Identisk spin loft. Driver har **høyere** køllefart og **41 % lavere** spinn.

Modellen sier `spin ∝ clubSpeed × sin(spinLoft)`, altså at driver skulle hatt *mer*.
Ingen funksjon av `(spinLoft, clubSpeed)` kan reprodusere dette. Den nødvendige
kalibreringen er **ikke monoton** i spin loft uansett hvordan loft inverteres —
verifisert både fra smash og fra launch.

Forskjellen ligger i køllehodet: MOI, CG-høyde, slagflatens bulge/roll, og at
driveren treffes på vei opp fra pigg. **Ingen av disse finnes i modellen.**

### Hva det betyr

En enkelt kalibreringskurve `f(spinLoft)` kan **aldri** passe hele baggen.
Dagens 3/12 ved 5 % er ikke en dårlig fitting — det er taket for modellformen.

To veier:
1. **Køllen blir en førsteklasses parameter** med egne spinn-egenskaper.
   Henger sammen med fase 1 (køllegeometri) og D21 (køllekonvolutt).
2. **Aksepter feilen og si det.** Spinn merkes som modellert med kjent
   køllevariasjon, og appen slutter å påstå absolutt spinnpresisjon.

Vei 1 er riktig hvis appen skal si «driveren din spinner 2 900». Vei 2 er nok
hvis den skal si «én grad mer face-to-path gir X mer sidespinn» — den deriverte
er langt mindre køllefølsom enn absoluttverdien.


---

## F10 — F9 var en sirkelslutning, og D0 har en skjult avhengighet  🔴

Eier spurte: *«Hvor er kilden din at 5-wood får 41 % mer spinn med samme spinloft?»*

**Spinntallene er sitert** — Trackman 2023 gir driver 2 545 rpm og 5-wood 4 322 rpm.
**«Samme spin loft» er det ikke.** Trackman publiserer ikke dynamisk loft; null treff
i hele `REALISME.md`. Verdien kom fra min egen inversjon gjennom motorens launch-modell:

```
1. motorens launch-modell  →  utled dynamisk loft fra publisert launch
2. loft − attack           →  «spin loft»
3. begge ga 16,2°          →  «samme spin loft»
4. konklusjon              →  «modellen kan ikke forklare forskjellen»
```

Steg 1 bruker motoren til å utlede en verdi; steg 4 bruker den verdien til å dømme
motoren. Sirkulært.

### Signalet jeg overså

Inversjonen ga driver `15,3°` og 5-wood `13,7°` dynamisk loft — altså at **driveren
har mer loft enn 5-woodet.** Driver er 9–10,5° statisk, 5-wood 18–19°. Rekkefølgen
er fysisk umulig, og det var synlig i utskriften jeg selv leste.

### Hva som faktisk gjelder

| Antatt driver / 5-wood dyn. loft | Gap modell vs. tour |
|---|---:|
| 15,3° / 13,7° *(min inversjon)* | **84,2 %** |
| 13,0° / 17,0° *(typisk)* | 32,6 % |
| 12,0° / 18,0° | 17,5 % |
| 11,0° / 19,0° | **3,7 %** |

Med plausible loft er modellen nær riktig. F9 er ikke underbygget.

### Den skjulte avhengigheten i D0

**Dynamisk loft er ikke publisert av noen kilde.** Enhver sammenligning mellom
motoren og tourdata krever derfor at man antar én av inputene, og resultatet
avhenger helt av antagelsen.

Det rammer også `3/12`-målingen på spinn: den brukte loft invertert fra ballfart.
Bedre ordnet enn launch-inversjonen — driver 12,5° er plausibelt — men fortsatt antatt.

**D0-porten må derfor deklarere sin loftantagelse eksplisitt**, ellers måler den
motoren mot seg selv.

### Regel som følger

Enhver inversjon skal **fornuftssjekkes mot fysisk rekkefølge før den brukes**.
Gir en inversjon driver mer loft enn et 5-wood, er inversjonen feil — ikke modellen.

---

## F12 — Motoren er en kortjernsmotor med ekstrapolasjonsvinger  🔴

Tre uavhengige målinger peker på samme kalibreringssenter:

| Måling | Hva den viser |
|---|---|
| **RK4 dragankeret** | `dragCompatibilityScale = 1.275116456035` krysser null ved 6-/7-jern. RK4 er 17 % kort på driver, 6 % lang på 9-jern. |
| **Spinnsigmoidens midtpunkt** | `31,98°` — spin loft for et 7-/8-jern. Bredde `2,14°`. |
| **Intern selvkonsistens** | Sprik mellom loften launch, spinn og ballfart hver for seg krever: **9-jern 0,1° · PW 0,2°** mot **hybrid 6,0° · 5-wood 5,8°**. |

Tre separate deler av modellen sentrert rundt samme køllegruppe er ikke tilfeldig.
Det er fingeravtrykket til en **enkeltkølle-kalibrering**.

### Selvkonsistens per kølle

Ingen enkelt dynamisk loft kan gjøre launch, spinn og ballfart riktige samtidig.
Spriket mellom de tre løsningene:

```
Hybrid  6,0°   5-wood 5,8°   3-wood 5,6°   Driver 4,5°   3 Iron 4,5°
4 Iron  4,1°   5 Iron 2,3°   7 Iron 2,3°   6 Iron 1,2°   8 Iron 1,2°
9 Iron  0,1°   PW     0,2°
```

Monotont fallende fra trekøller til korte jern. **Dette er ikke en antagelsesfeil**
(D39) — det er modellen som er internt inkonsistent, og inkonsistensen vokser med
avstanden fra kalibreringspunktet.

### Hardt carry-tak på driver

Modellens maksimale carry ved tourens køllefart og attack, over alle loft:

| Kølle | Tour | Modelltak | Ved loft |
|---|---:|---:|---:|
| **Driver** | 282 | **275,8** | 13,0° |
| **Hybrid** | 231 | **228,3** | 15,2° |
| 9 Iron | 152 | 179,3 | 17,4° |
| PW | 142 | 170,2 | 17,8° |

**Driver og hybrid kan aldri nå tourens carry**, uansett loftvalg. Årsaken er en
kobling: launch over 10° krever loft, loft koster smash, smash koster ballfart,
ballfart koster carry. Modellen topper på 170,7 mph ballfart der touren har 171 —
og `carryBallSpeedFit` er selv ~2 % lav ved den farten.

For korte jern ligger taket 13–20 % over tour, som er forventet — man slår ikke
en PW på maksloft.

### Konsekvens for planen

Dette forklarer hvorfor D1 måtte omgjøres (D34) og hvorfor spinnrekalibrering (D35)
er den kritiske stien. Men det peker også videre: **enhver rekalibrering som holder
én kurve for hele baggen vil arve den samme svakheten**, bare med et annet senter.

Køllen må inn som parameter — ikke som en ny modell, men fordi modellen allerede
*har* en kølle bakt inn. Den er bare usynlig og heter `1.275116456035`.

---

## F13 — Launch-modellen er den ødelagte, ikke spinnmodellen  🔴

D35 siktet på spinnmodellen. Det var feil mål.

### Metoden (D38 anvendt)

Ingen kilde publiserer dynamisk loft. Men vi *vet* at loftrekka må være monotont
stigende fra driver til PW. Inverterer vi loft fra hver metrikk for seg, får vi
tre kandidatrekker — og den som er fysisk umulig kommer fra modellen som er feil.

Loftantagelsen inngår ikke: hver rekke er **utledet**, ikke antatt.

| Invertert fra | Rekke | Monotonibrudd |
|---|---|---|
| Ballfart | 12,5 · 13,8 · 13,8 · 15,8 · 17,6 · 20,6 · 23,5 · 26,5 · 32,3 · 33,3 · 37,7 · 42,7 | `−0,0°` ren |
| **Launch** | **15,3** · **10,0** · 13,7 · 16,2 · 16,7 · 19,0 · 22,7 · 27,7 · 31,6 · 34,5 · 37,7 · 42,5 | **`−5,4°`** |
| Spinn | 10,9 · 15,5 · 19,5 · 21,8 · 21,2 · 23,1 · 25,0 · 27,6 · 30,0 · 33,4 · 37,7 | `−0,6°` |

Launch-modellen krever **driver 15,3°** og **3-wood 10,0°**. En driver med mer
loft enn et 3-wood er fysisk umulig, og bruddet er konsentrert helt i driverenden.

Spinnrekka er monoton og plausibel hele veien. Det eneste avviket er `−0,6°`
mellom hybrid og 3-jern, to nabokøller.

### Årsaken

```
launchAngle = 10.3919 × blend − 0.16938 × L + 0.012025 × L² + 0.25 × A
```

Det lineære leddet er **negativt**. Vendepunktet ligger på `L = 7,04°`:
under det gir mer loft *mindre* launch.

| Loft | `d(launch)/d(loft)` |
|---:|---:|
| 5° | **−0,049** |
| 10° | +0,071 |
| **12,5°** | **+0,131** |
| 15° | +0,191 |
| 31° | +0,576 |
| 40° | +0,793 |

En ekte kølle gir omtrent **0,7–0,8°** launch per grad loft. Modellen når 0,7
først ved **loft 36°** — 8-jern-territorium. I driverens område ligger den på
`0,167`, altså **22 % av reell følsomhet**.

### F12 bekreftet en fjerde gang

Fire uavhengige deler av modellen peker på samme kalibreringssenter:

1. Dragankeret `1.275116456035` krysser null ved 6-/7-jern
2. Spinnsigmoidens midtpunkt er `31,98°`
3. Selvkonsistensen er 0,1° ved 9-jern mot 6,0° ved hybrid
4. **Launch-følsomheten når realistiske verdier først ved 36°**

### Konsekvens for planen

**D35 omprioriteres.** Spinnmodellen er ikke den kritiske stien — launch-modellen er.

Og rekkefølgen betyr noe: launch mater `launchEfficiency` som mater carry, og
launch mater RK4s startvinkel. Rettes launch først, flytter både carry og
banegeometri seg. Rettes spinn først, flytter ingenting av det seg — fordi spinn
i dag ikke påvirker carry i det hele tatt.

### F13b — diagnosen står, fiksen er blokkert

Tre ting er verifisert **uavhengig av enhver loftantagelse**:

1. **Bakvendt fysikk under 7,04°.** Følger direkte av formelens fortegn.
2. **Følsomhet 0,167 °/° i driverens område** mot veletablerte 0,7–0,8.
3. **Den launch-inverterte loftrekka er fysisk umulig** — driver 15,3°, 3-wood 10,0°.

Men **fiksen lar seg ikke kalibrere.** Tre forsøk:

| Referanserekke | Form | Snittavvik | Maks |
|---|---|---|---|
| Ballfart | lineær `k(L)` | 1,230° | 3,597° |
| Ballfart | eksponentiell `k(L)` | **0,618°** | 1,326° |
| Spinn | eksponentiell `k(L)` | 1,035° | 3,350° |

Båndet er **±0,5°**. Ingen av dem når det.

Årsaken er den samme som i F10: **dynamisk loft er ikke publisert av noen kilde.**
Enhver kalibrering må utlede loft gjennom en annen modell, og den modellens feil
forplanter seg inn i fittet. Ballfartrekka har til og med sin egen defekt — den
gir 3-wood `13,81°` og 5-wood `13,80°`, fordi begge har smash `1,47` og
smash-modellen kollapser køller som deler smash-verdi.

### Dataen som trengs, navngitt

Ikke «mer data». Dette:

> **Launch monitor-økter der `dynamic loft` er registrert sammen med
> `launch angle`, `attack angle` og `club speed`, per køllekategori.**

Trackman, GCQuad og Uneekor måler alle dynamisk loft. Det publiseres bare ikke
i gjennomsnittstabellene. Én økt med 10–15 slag per kølle ville låst
`k(L)`-kurven direkte, uten inversjon og uten sirkularitet.

Inntil da: **diagnosen dokumenteres, modellen står urørt.** Å erstatte en feil
kurve med en annen feil kurve som er fittet mot inferens, er ikke en forbedring —
det er å flytte feilen dit ingen ser den.

---

## F14 — Amatørdata for ballflukt finnes ikke, og det er et måleproblem  🔴

49 agenter, 40 kildekontroller, **613 siterte tall med hentbar URL**.
**Null av dem er blant de ni metrikkene D0 trenger.**

| Ønsket metrikk | Amatørdekning |
|---|---|
| clubSpeed, attackAngle, ballSpeed | **0** |
| launchAngle, spinRate | **0** |
| apex, landAngle, carry | **0** |
| smashFactor | 9 tall — kun driver, kun Trackman Combine |

Alt som ble funnet er **totaldistanse, fairwaytreff, nærhet til hull og straffe**.

### Årsaken er ikke søket

Arccos og Shot Scope måler med GPS og grepsensor. De registrerer **start- og
sluttpunkt**, ikke ballflukt. Ingen mengde videre søk hos dem kan produsere
launch-vinkel eller spinnrate, fordi utstyret ikke måler det.

Granskerens egen formulering: *«Dette er ikke et søkeproblem men et måleproblem.
Videre søk hos Arccos/Shot Scope er bortkastet.»*

### Carry er enhetsblokkert for hele segmentet

Hvert eneste av de 613 tallene er **total** — carry pluss utrull. Ingen kilde
publiserer splitten, og den finnes ikke i prinsippet heller: dataene er ikke
miljønormaliserte. Arccos viser at **høyde over havet alene flytter samme
spiller 8,3 %**.

Motoren produserer `carry`. Amatørdataene måler `total`. De kan ikke sammenlignes.

### Det som FAKTISK ble funnet, og det er verdifullt

**Spredning i tre uavhengige former** — det ingen kilde hadde publisert før:

1. **Innen spiller, slag til slag:** snitt → velltruffet `+6,6` til `+12,1 %`;
   snitt → lengste `+15,0` til `+20,9 %`. **Gapet vokser med handicap.**
2. **Mellom spillere:** eneste publiserte fordeling i hele materialet.
   `P19 = 200 yd · P54 = 225 · P76 = 250 · P90 = 275 · P98 = 300`.
3. **Mellom aldersgrupper innen handicapbånd:** `−12` til `−16 %` / `+7` til `+10 %`,
   replikert i **7 av 7 bånd**, og **asymmetrisk** — halen går nedover.

Kryssvalidert mellom to uavhengige plattformer innenfor `0,5–2,2 %` for hcp 10–25.
Tidsstabilt under `1,5 %` over åtte år.

### Tre anbefalinger fra granskeren

- **Dropp score-aksen.** Shot Scopes scoretabell er en ren delmengde av
  handicaptabellen — samme fem verdier, null nye tall.
- **Ikke bruk Shot Scopes hcp 10-rad som anker.** Den ligger systematisk høyt mot
  hcp 5 i **syv uavhengige køller** — et mønster, ikke sju avrundingsutslag.
  Bruk Arccos hcp 10.0–14.9 = 223 yd, som er kontrollert og kryssvalidert.
- **Ikke bruk fairwaytreff eller straffeprosent som sannhet ennå.** Arccos og
  Shot Scope er uforenlige: `50→40 %` mot flat `46–49 %`, og straffe `4,4–11,9 %`
  mot `1–3 %`. Definisjonsforskjell antatt, **ikke verifisert**.

## F15 — «Oppleves reelt» og «er korrekt» er i konflikt, og det er nå målt  🔴

Brukerkravet er ordrett: *«tallene skal oppleves reelle for det de opplever ute
når de spiller.»*

Arccos-data sier at det kravet ikke kan oppfylles av et korrekt tall alene:

| | |
|---|---|
| Amatørens antatte 7-jern-lengde | **17–22 yd lenger** enn faktisk |
| Innspill som lander **kort** | **40 %** |
| Innspill som lander langt | ~5 % — altså **8× skjevfordeling** |

**Et teknisk korrekt carry-tall vil oppleves for kort av målgruppen.**

Det er ikke en fysikkfeil vi kan kalibrere bort. Det er et persepsjonsgap, og det
er en produktbeslutning.

### Hvorfor gapet finnes

Spredningsdataene forklarer det. Innen samme spiller ligger et **velltruffet**
slag `+6,6` til `+12,1 %` over snittet, og det **lengste** `+15` til `+20,9 %`.

En golfer husker sitt beste slag, ikke sitt gjennomsnitt. På et 7-jern med snitt
165 yd er «det lengste» ~198 yd — og differansen er nøyaktig størrelsesordenen
på det målte persepsjonsgapet.

Gapet er altså ikke innbilning. Det er at spilleren sammenligner mot en reell
verdi — bare ikke mot medianen.

### Konsekvensen for D25

D25 sier at realisme er det overordnede målet. F15 sier at realisme har to
betydninger som peker ulikt. **Beslutningen om hvilken som gjelder er eierens.**

---

## F16 — Gear effect: fysikken finnes, men min egen test var usann  🔴

37 agenter, 30 kildekontroller, **~65 kildefestede verdier over 15 URL-er**.
13 av 15 URL-er HTTP-testet 200 OK.

`STATUS.md` sa at koeffisientene «ikke skal finnes på». **De finnes** — fullt
utledet, med enheter, med URL, og den vertikale er **validert mot robotdata**.

### Verifikasjon som holder

Granskeren reproduserte Tutelmans hele sanity-test-tabell:
`1/4"` ga `553.6` mot kildens `553` (0,1 %), `1/2"` ga `1112.8` mot `1113` (**0,0 %**).

Vertikal akse mot Hotstix-robotdata (460 cc, 9,5°, 100 mph):
10 mm høyt gir modell **−560 rpm** mot målt **−602 rpm**. **7 % feil.**

Og en korreksjon av rådataene sine egne: en kontrollpåstand hevdet at tabellen
brukte koeffisient `14.7` og kalte det «intern inkonsistens hos Tutelman».
Det stemmer ikke — tabellen bruker `16.4` **med** den horisontale korreksjonen
`x_eff = x − C·sin(HLA)`. `14.7` framkommer bare hvis man glemmer korreksjonen.

### Min spesifikasjonsfeil

D4 krevde *«sentrert treff gir eksakt null gear-bidrag»*. Fysisk usant:

- Kraften virker mot ballens **utgangsretning**, ikke normalt på flaten
- `y = H − D·sin(a)`; ved `H = 0` blir `y = −0.22"` og **+825 rpm**
- Nøytralpunktet ligger **5,6–6,4 mm over sweetspoten** og **flytter seg**
- Horisontalt: `x_eff = −C·sin(HLA) ≠ 0` når face-to-path ≠ 0

Golden case `D-plane default` får **~100 rpm ekstra slice-spinn dødsentrert**.

### To feller granskeren dokumenterte

| Uten korreksjon | Gir | Konsekvens |
|---|---|---|
| Horisontal | `968 rpm` | **3× for mye** — hver toe-bom blir snap hook |
| Vertikal | `1476 rpm` | **dobbelt av målt**, og null ved sentrert, som er feil |

### Hvorfor horisontal forblir stengt

Vertikal har fem robotpunkter. **Horisontal har null målt spinn mot registrert
treffpunkt noe sted.** Tutelmans horisontale «sanity test» er ikke måling — den
mater modellens egen output inn i en simulator.

Å slå den på ville plassert en ukalibrert koeffisient i motoren med en URL bak
seg, **som ser ut som fysikk**. Det er nøyaktig det prosjektet finnes for å hindre.

### Fire av seks kildeområder nådde aldri fram

Kun `tutelman` og `akademisk` var i rådataene. **Patenter, Trackman,
OEM-whitepapers og MyGolfSpy mangler helt** — og Trackman-området er nettopp det
som kunne båret horisontal truth-data.

Fraværet av deres tall betyr **ikke** at tallene ikke finnes. Området må hentes
før D4b forsøkes lukket igjen.

---

## F17 — Utrullbroen avslører at rollFrac er for lav  🟡

D49 lot motorens egen `rollFrac` bygge broen mellom `carry` og amatørdatas `total`.
Broen virker, og resultatet er plausibelt — men den avslørte en ny svakhet.

| Handicap | Total (Arccos) | → køllefart | carry | roll | roll % |
|---|---:|---:|---:|---:|---:|
| 0,0–4,9 | 250 yd | 104,0 mph | 238,9 | 11,1 | **4,4 %** |
| 10,0–14,9 | 223 yd | 95,8 mph | 213,1 | 9,9 | **4,4 %** |
| 30+ | 175 yd | 80,2 mph | 167,2 | 7,8 | **4,4 %** |

**Utrullandelen er konstant 4,4 % over hele spennet.** Reelt driver-utrull på
fairway er 8–15 % av total, og det **varierer** med landingsvinkel og fart.

To konsekvenser:

1. Modellens `rollFrac` er trolig **for lav med en faktor 2–3**.
2. De utledede køllefartene er derfor **for høye** — modellen må presse mer
   carry for å nå målt total.

Smash-kryssjekken støtter det: modellen gir `1,487` mot Trackman Combines målte
`1,44` for hcp ~14,5 — **3,3 % for høyt**, samme retning.

Dette er den eneste uavhengige kryssjekken som finnes for amatørsegmentet.
De øvrige åtte metrikkene har null dekning (F14).
