# Flight Glass — status 2026-08-25

Oppdatert 2026-08-26 kveld. NB: designsystemet er nå v3 (D82) — mockenes visuelle språk. Se ANALYSE-DESIGNSYSTEM-V3.md. Ett dokument som samler natten, for å kunne leses uten å ha fulgt den.

---

## Hvor vi står

| | |
|---|---|
| Låste beslutninger | **54** |
| Dokumenterte funn | **17** (ett trukket tilbake) |
| Utfordringer fra dine skjermbilder | 10 — **5 lukket** |
| Motortester | **465**, alle grønne |
| `DESIGN.md` | linter **0 errors, 0 warnings** — alle 12 hull lukket |
| Spec-filer med korreksjonshode | **5 av 5** |

---

## Det som ble bygget

### Motoren

En referanseimplementasjon som **reproduserer den gamle motoren bit-eksakt**:
flight 5029/5029, studio 2500/2500, 12 av 14 moduler med `maxErr = 0`.

Deretter fire nye moduler som retter det baselinen avdekket:

| Modul | Hva den gjør |
|---|---|
| `contactModel.js` | Lie og køllegeometri som **uavhengige akser** |
| `strikeBand.js` | Én klassifiserer, tre akser, **begge svar returneres** |
| `studioSolve.js` | Produksjonssti som binder dem sammen |
| `aero-reference.js` | Uavhengig §5.7-utledning + differensialtest, 6 741 kombinasjoner bit-identiske |

### Designsystemet

`DESIGN.md` i `design.md`-format: 15 farger, 7 typografiskalaer, 19 komponenter,
5 radiusnivåer, 6 spacing-tokens. Pluss tallformatering, fortegnsregler,
fem tilstander utenfor normalen, interaksjonstilstander, bevegelse,
datavisualisering, responsivitet og ikonografi.

Bygget på ett målt funn: **Phoenix kjører 3,0 % mettet oransje mot 2,7 % vask.**
Oransjens tyngde er en differanse, ikke en mengde.

### Referansedata

`REALISME.md` — **442 siterte tall, null gjettede.** PGA og LPGA Tour, begge
Trackman-utgaver, 13 køller. `KOLLEGEOMETRI.md` — slagflate- og sweetspot-høyder
fra patentmålinger, 43 % sitert og **resten eksplisitt merket som antagelse**.

---

## De fem funnene som endret prosjektet

**F7 — to klassifiserere uenige i 82,3 % av driver-casene.** `strikeBand` sa `Low`,
`strikeQuality.band` sa `Whiff` — 544 ganger. Jern var 0 % uenig.

**F11 — jernets sweetspot var ballradiusen, limt inn.** `0.0213` begge steder, så
de kansellerte hverandre i formelen. `faceCentreOffsetMm` for jern målte aldri et
treffpunkt — den målte køllehøyde over bakken, negert. Verifisert med 1.42e-14 mm
avvik over 1 250 caser. Målt verdi er 18,4 mm.

**F8 — to definisjoner av spin loft i samme kjede.** Smash brukte 3D, spinnkalibreringen
brukte vertikal. Verifisert 4315/4315 begge veier. **Du fant den ved å resonnere,
før jeg målte noe.**

**F12 — motoren er en kortjernsmotor.** Tre uavhengige målinger peker på samme
kalibreringssenter: dragankeret krysser null ved 6-/7-jern, spinnsigmoidens midtpunkt
er 31,98°, og selvkonsistensen er 0,1° ved 9-jern mot 6,0° ved hybrid.

**F10 — jeg tok feil, og du fanget det.** Jeg hevdet at spinn ikke kan forutsis fra
leveringsgeometri. Påstanden hvilte på min egen inversjon gjennom motorens launch-modell,
som ga driver mer loft enn et 5-wood. Fysisk umulig, og det sto i utskriften jeg leste.

---

## Tre bunter som ble løst opp

`clubMode` bar **tre uavhengige beslutninger** i ett valg:

| Var | Er nå | Tilhører |
|---|---|---|
| `lift` | `lieHeightMm`, 0–45 | underlaget |
| `sweet` | `sweetSpotHeightMm` per kølle | kølla |
| `zClub` | *fjernet* | piggen, kodet en tredje gang |

Tre tilstander som var umulige å uttrykke er nå gyldige: **driver fra bakken**,
**3-wood fra pigg**, **jern fra pigg**.

---

## Det som er blokkert, og hvorfor

### Amatørbånd — LUKKET SOM UMULIG, ikke som ufullført

613 siterte tall fra 49 agenter. **Null av dem er blant de ni metrikkene.**
Årsaken er et **måleproblem**: Arccos og Shot Scope bruker GPS og grepsensor —
de registrerer start- og sluttpunkt, ikke ballflukt. Videre søk der er bortkastet.

`carry` er dessuten **enhetsblokkert**: alt er `total`, ingen publisert splitt,
og ingen mulig i prinsippet — dataene er ikke miljønormaliserte.

**Det som ble funnet er spredning**, i tre uavhengige former, kryssvalidert
mellom to plattformer innenfor 0,5–2,2 % og tidsstabilt over åtte år.
Det ingen kilde hadde publisert før.

Broen per D49 er bygget og kjører (`tools/d0-amator.mjs`). Den ga køllefart
80,2–104,0 mph, monotont fallende — men avslørte F17.

### Gear effect — DROPPET, og det var riktig valg

`centeredStrike: true` og `gearEffectApplied: false` på alle 5 028 caser. Motoren
gjorde det allerede; D52 formaliserer det framfor å planlegge et tillegg.

**Og valget unngår en dobbelttelling.** Spinnkalibreringen er fittet mot
TrackMan-bag-data — ekte slag. Gear-bidraget ved sentrert treff (F16 målte
~825 rpm vertikalt) er allerede inne i konstantene. Et eksplisitt sentrert ledd
ville talt det to ganger.

Tre blokkeringer forsvant med det: D4a, D4b og D4c. Og `GEAR-EFFECT.md` beholdes
som dokumentert vei videre, med D51-korreksjonen om at «sentrert = null» er usant.

**Sømmen er deklarert (D53):** Studio måler treffet, Ball Flight forutsetter
sentrert. Modellgrense-setningen sier det: *«Modelled shot — not a measurement.
Strike is assumed centred.»*

### D1 er omgjort

RK4 skal **ikke** overta lengden. Målt over hele baggen: empirisk fit **1,04 %**
snittfeil, RK4 **7,52 %** — empirisk vinner **12 av 12 køller**. D1 som spesifisert
ville gjort carryen sju ganger verre.

---

## Fire ting jeg tok feil om

1. **«Jernene er allerede reelle, driveren er ikke.»** Feil — jeg blandet to
   Trackman-utgaver. Målt riktig er spinnfeilen ~11–14 % på begge.
2. **«Spinn kan ikke forutsis fra leveringsgeometri.»** Sirkulær inversjon. Trukket.
3. **«Driverens 33 mm er 4–11 mm for høy.»** Jeg sammenlignet `Hg` med `Hs` —
   to ulike størrelser. 33 holder; 34 er bedre.
4. **Tidsstempler i loggen** mellom 04:10 og 06:16 var anslag, ikke målinger. Rettet.

En femte: min egen første klassifiserer ga `Whiff → Pure` på 320 caser. Fortegnet
var bakvendt, og jeg brukte én akse der spec bruker tre. **D7-diffen fanget det —
mine egne tester var grønne hele veien, fordi de testet mot mine egne antagelser.**

---

## Nattens siste tre funn

**F14 — amatørballflukt finnes ikke, og det er et måleproblem.** 613 siterte tall,
null av de ni metrikkene. Arccos og Shot Scope måler start- og sluttpunkt med GPS,
ikke ballflukt. Videre søk der er bortkastet. Og `carry` er enhetsblokkert: alt er
`total`, uten publisert splitt, og ingen mulig i prinsippet.

**F16 — gear effect-fysikken finnes, men min egen test var usann.** ~65 kildefestede
verdier, vertikal akse validert mot robotdata innenfor **7 %**. Men D4 krevde
«sentrert treff gir eksakt null gear-bidrag», og det er fysisk umulig:
nøytralpunktet ligger 5,6–6,4 mm over sweetspoten og flytter seg. Golden case
`D-plane default` får ~100 rpm ekstra slice-spinn **dødsentrert**.
D4 er halvert — vertikal kan lukkes, horisontal har null truth-data.

**F17 — utrullbroen avslørte at `rollFrac` er for lav.** Konstant 4,4 % over hele
handicapspennet, mot reelle 8–15 %. Sannsynlig faktor 2–3 for lav, og det gjør de
utledede køllefartene for høye. Smash-kryssjekken peker samme vei: 3,3 % høyt.

## Neste steg

**Tre blokkeringer, alle med navngitt datakrav — ikke vage mangler:**

| Blokkert | Trenger |
|---|---|
| **D45** launch-modellen | Launch monitor-økt der `dynamic loft` registreres sammen med launch angle, attack angle og club speed. 10–15 slag per kølle. |
| **D4b** horisontal gear effect | `faceStrikeHorizontalMm` + målt spinnakse, minst fem toe/heel-posisjoner på én identifisert driver. |
| **D0** mot målgruppen | Kan ikke lukkes med publiserte data. Krever egne målinger — eller at porten gates mot tour og amatørspredning i stedet for amatørabsoluttverdier. |

**Ikke blokkert:**

1. **D4a — vertikal gear effect** kan implementeres nå. Formel og konstanter finnes,
   validert mot robotdata. Fem Hotstix-punkter som truth-fixtur, toleranse ±15 %.
2. **F17 — `rollFrac`** er trolig 2–3× for lav. Kan undersøkes mot landingsvinkel.
3. **Hent de fire manglende kildeområdene** for gear effect — Trackman, patenter,
   OEM-whitepapers, MyGolfSpy.
4. **Innstillinger-flate og onboarding-enhetssteg** (D27, D31).
5. **Connections** kan bygges nå — den er motoruavhengig (D44), grafen er rettet
   og integritetstestet (D47).

---

## Det viktigste fra natten, i én setning

Fire ganger tok jeg feil på en måte mine egne tester ikke kunne fange, fordi de
testet mot mine egne antagelser. Hver gang var det **en sammenligning mot noe
uavhengig** som avslørte det: D7-diffen mot forrige versjon, den fysiske
rekkefølgen på loft, robotdata mot formel, og deg som spurte etter kilden.
