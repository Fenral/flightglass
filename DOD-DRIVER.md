# Definition of Done — ekte drivermodus

Vedtatt 2026-08-24. Ingen delleveranse regnes som ferdig før hele listen er grønn.
Hvert punkt er **maskinelt etterprøvbart**. «Ser riktig ut» teller ikke.

## Rotårsaken

Motoren integrerer allerede en fysisk korrekt bane med RK4, bruker den kun til
å utlede sidebøy, og **forkaster lengden** til fordel for et empirisk fit
kalibrert mot 7-jern.

- Gjennomsnittlig avvik empirisk vs. RK4: **58.7 %**. Største: **745.7 %**.
- Spinn fra 569 til 9000 rpm endrer empirisk carry med **12 mm**.
- Én koeffisientsett og én `dragCompatibilityScale = 1.275116456035` for alle 5028 caser.

Driver er ikke ødelagt fordi den mangler en modell. Den er ødelagt fordi den
arver 7-jernets lengdemodell.

## D0 — Realismeankere  ← MÅLET. Alt annet er maskineri.

**Krav fra bruker:** «tallene skal oppleves reelle for det de opplever ute når de spiller.»

Operasjonalisert: for hver køllekategori, ved den køllens typiske levering, skal
motorens utfall ligge innenfor publiserte Trackman-bånd for PGA Tour og for
amatørnivåer.

**Referanseutgave låst: Trackman 2023.** Det finnes to utgaver og de skiller seg
materielt — carry avviker 2,33–4,41 % på samtlige 12 køller, og driver-launch
nøyaktig 0,5°. Uten en låst utgave er D0-porten uetterprøvbar.

**Målt status 2026-08-25, ekte motor, mot Trackman 2023:**

| Kølle | launch | spinn | carry | landing |
|---|---:|---:|---:|---:|
| Driver | −0,5° ✓ | **+14,0 %** ✗ | **−2,3 %** ✗ | +1,7° ✗ |
| 7-jern | +0,4° ✓ | **+11,4 %** ✗ | −0,7 % ✓ | +0,3° ✓ |

Mot eldre utgave: driver spinn **+19,5 %**, 7-jern **+11,2 %**.

**KORREKSJON av tidligere diagnose.** Jeg meldte at «jernene er allerede reelle,
driveren er det ikke». Det var feil, og feilen kom av at jeg blandet tall fra to
utgaver. Sannheten er enklere og verre:

**Spinnet er systematisk 11–14 % for høyt på begge køller i begge utgaver.**
Det er én kalibreringsfeil, ikke to. Jernets spinnfeil er like stor som driverens —
den er bare usynlig i carry, fordi carry i dagens modell ikke avhenger av spinn
(12 mm over 8 431 rpm). Landingsvinkelen avslører den derimot: den er konsekvent
for bratt, +1,7° til +4,5°, som er nøyaktig hva for mye spinn skal gi.

Modellen er altså **internt inkonsistent**: spinnfeilen forplanter seg til
landingsvinkel, men ikke til carry. I virkeligheten ville den gjort begge.

- [x] Referansetabell hentet og kildeverifisert: **442 siterte tall, null gjettede**. PGA Tour og LPGA Tour, begge utgaver, 13 køller. `REALISME.md`.
- [ ] ⚠ **AMATØRBÅND FINNES IKKE PUBLISERT.** Kun 9 tall totalt (Trackman Combine smash per handicap, kun driver) = 1 av 9 metrikker for 1 av 13 køller. Se blokkering under.
- [x] 7-jernets tour-spinn **BEKREFTET 7 124 rpm**, dobbelt: Trackman 2023-tabellen og Trackmans spinn-artikkel som maskinlesbar tekst, fem av seks verdier siffer for siffer.
- [x] Toleransebånd definert og etterprøvd mot kildenes egen avrunding:
      launch ±0,5° ✓ · carry ±2 % ✓ · spinn ±8 % (beholdt, men **udokumentert** —
      ingen kilde publiserer spinnspredning) · ballSpeed ±1,0 % · smash ±0,02 ·
      apex ±2 yd · landAngle ±1,0°. `clubSpeed` og `attackAngle` fjernet som
      utfallsporter — de er inndata.
- [x] Tre regler: bånd gjelder per metrikk/kølle/**utgave** · ingen
      kryss-kolonne-identiteter (`ballSpeed = clubSpeed × smash` holder ikke i
      kilden selv) · ingen «hele raden samtidig»-test, fordi de ni tallene er
      uavhengig avrundede marginaler fra ulike slag, ikke ett slag.

### ⚠ BLOKKERING BEKREFTET OG PRESISERT 2026-08-25 — se F14, F15

49 agenter, 613 siterte tall. **Null av dem er blant de ni metrikkene.**
Alt som finnes er totaldistanse, fairwaytreff, nærhet og straffe.

Årsaken er et **måleproblem**, ikke et søkeproblem: Arccos og Shot Scope måler
med GPS og grepsensor — start- og sluttpunkt, ikke ballflukt.

Og `carry` er **enhetsblokkert**: alle amatørtall er `total`. Ingen publisert
splitt, og ingen mulig i prinsippet — dataene er ikke miljønormaliserte.
Høyde over havet alene flytter samme spiller 8,3 %.

**D0 kan ikke lukkes mot målgruppen med publiserte data. Punktum.**

### ⚠ OPPRINNELIG FORMULERING

Brukerkravet er «reelle for det de opplever ute når de spiller». Målgruppen er
amatører. **Amatørdata finnes ikke publisert i tilstrekkelig form.** Det eneste
som er funnet er Trackman Combine sin smash factor per handicap, kun driver —
9 tall. Segmentet 14,5 hcp treffer målgruppen nøyaktig, men dekker bare smash 1,44.

Ingen kilde publiserer spredning per kølle for noen populasjon. Wedger under PW
mangler i **alle** kilder, og en 15-handicapper slår mange slag med SW og LW.

D0 kan derfor lukkes mot **tour**, men ikke mot målgruppen. Det må sies rett ut
framfor å la en grønn port antyde noe den ikke beviser.
- [ ] **Test:** hver køllekategori innenfor båndet ved typisk levering.
- [ ] **Test:** avvikene er *koblet* — for mye spinn gir kortere carry. I dag er de uavhengige.
- [ ] Amatørnivåer dekket, ikke bare tour. Målgruppen er ikke touspillere.

**Merk konflikten med D7:** fixturen beviser «lik som før». D0 krever «lik som virkeligheten».
Der de peker ulikt, vinner D0 — men avviket skal dokumenteres som versjonert fysikkendring,
aldri stilltiende.

## D1 — OMGJORT 2026-08-25. Se D34.

~~RK4 eier lengden.~~ **Avvist på måledata.**

Målt over hele Trackman 2023-baggen: empirisk fit **1,04 %** gjennomsnittlig
absoluttfeil, RK4 **7,52 %**. Empirisk er nærmest på **12 av 12 køller**.

| | empirisk | RK4 |
|---|---:|---:|
| Driver | −2,3 % | **−17,0 %** |
| Hybrid | −1,5 % | −12,5 % |
| 7-jern | −0,7 % | +1,5 % |
| 9-jern | +1,4 % | +6,3 % |

RK4 krysser null ved 6-/7-jern og bommer monotont derfra i begge retninger. Det er
signaturen til `dragCompatibilityScale = 1.275116456035`, som er et 7-jern-anker.

**Men problemet D1 skulle løse står fortsatt:** den empiriske fitten er blind for
spinn. To slag med lik ballfart og 8 431 rpm forskjell får identisk carry (12 mm).
Fitten treffer *punktet*, men har feil *derivert*.

### D1b — den nye oppgaven

- [ ] Spinnmodellen (§5.4) rekalibreres **først**. Se D35 — feil funksjonsform, ikke feil konstant.
- [ ] Deretter: gjør `dragCompatibilityScale` køllespesifikk, slik at RK4 kan
      måle seg mot den empiriske fitten på hele baggen — ikke bare ved 7-jernet.
- [ ] Først når RK4 slår 1,04 % over 12 køller, kan den overta lengden.
- [ ] Til da beholdes den empiriske fitten som absoluttanker, og koblingen
      spinn→carry løses separat (D33 sin derivattest må uansett bestå).

**PORT 1b:** RK4 sin gjennomsnittlige absoluttfeil over de 12 tourskøllene er
**under 1,04 %** — den empiriske fittens nåværende resultat. Klarer den ikke det,
overtar den ikke.

## ~~D1 gammel~~ — RK4 eier lengden

- [ ] `carry`, `apex`, `landingAngle`, `total` og flytid kommer fra RK4-integrasjonen.
- [ ] Det empiriske `carrySpeedFit` er fjernet fra shipping-solve.
- [ ] **Test:** ved fast ballfart endrer ±1000 rpm carry med **> 1 m**. (I dag: 12 mm.)
- [ ] **Test:** `launchEfficiency = sqrt(launch/10)` med metning ved 10° finnes ikke lenger.
- [ ] **Test:** to leveringer med lik ballfart og ulik spinn gir ulik carry, monotont.

## D2 — Aerodynamikken er kølleuavhengig

- [ ] `dragCompatibilityScale = 1.275116456035` er fjernet eller eksplisitt køllemerket.
- [ ] Feltet `club: "7iron"` settes ikke lenger implisitt på hver solve.
- [ ] Koeffisientsett og gyldighetsområde rapporteres per slag.
- [ ] **Test:** identisk levering gir identisk resultat uavhengig av køllemerkelapp.

## D3 — Driverkontakt har egne navngitte input

Per `01-PHYSICS-AND-MECHANICS-ENGINE.md` §10: nye modeller skal ha egne input,
kilder, tester og truth-labels — ikke skjules i fem-input-solven.

- [ ] Nye input, **to uavhengige akser**:
  - **Ballen:** `lieHeightMm` (erstatter hardkodet `lift`), `0–45`.
  - **Kølla:** `sweetSpotHeightMm` (jern 21,3 · driver 33), `faceHeightMm` (jern ~40 · driver ~57).
  - **Treffet:** `faceStrikeVerticalMm`, `faceStrikeHorizontalMm`.
- [ ] `clubMode` slutter å bunte lie og køllegeometri.
- [ ] **Test:** driver fra bakken (`lieHeightMm = 0`, driver-geometri) er en gyldig, uttrykkbar tilstand og gir `−11.7 mm` ved `clubZ = 0`.
- [ ] **Test:** jern fra pigg og 3-wood fra pigg er også uttrykkbare.
- [ ] Skala: `0` hardpan/matte · `2–5` tight · `5–12` fairway · `12–25` rough · `25–45` tee.
- [ ] **Test:** `faceCentreOffsetMm = ((lieHeightMm/1000 + 0.0213) − (clubZ + sweet)) × 1000` reproduserer fixturen med avvik 0 ved `lieHeightMm = 0` (iron) og `30` (driver).
- [ ] **Test:** `PURE` + `NO TURF CONTACT` opptrer sammen uten å være en feiltilstand — 404 av 550 PURE-caser i dagens fixtur har det.
- [ ] Slagflategrenser fra publiserte USGA/R&A-mål (høyde ~52–60 mm, bredde ~95–115 mm).
- [ ] Treff utenfor flaten gir eksplisitt `off-face`-tilstand.
- [ ] **Test:** `faceCentreOffsetMm` kan aldri overskride `faceHeightMm / 2`.
      I dag spenner den `−121.2 … +52.0 mm`, og **1 177 av 2 500 caser (47 %)**
      ligger utenfor en fysisk slagflate. Det finnes ingen grense i modellen.
- [ ] Treffpunkt eksponeres i **to mål**: absolutt mm fra sweetspot (fysikk) og
      andel av `faceHeightMm` (lesbarhet). Se D24.

## ~~D4 — Gear effect~~  STRØKET 2026-08-25. Se D52.

**Gear effect droppes. Alt måles i slagflatens midte.**

Dette er ikke en utsettelse, det er en deklarert forutsetning. Motoren har allerede
`centeredStrike: true` og `gearEffectApplied: false` på alle 5028 caser — beslutningen
formaliserer status quo framfor å planlegge et tillegg.

**Og den unngår en dobbelttelling.** Motorens spinnkalibrering er fittet mot
TrackMan-bag-data. Gear-bidraget ved sentrert treff — F16 målte ~825 rpm vertikalt —
er allerede inne i de empiriske konstantene. Et eksplisitt sentrert ledd ville
talt det to ganger.

Strøket: D4a (vertikal), D4b (horisontal), D4c (kun driver har konstanter).
Utgår som input: `faceStrikeVerticalMm`, `faceStrikeHorizontalMm`.

### Tre krav som følger, og som ikke kan utelates

- [ ] **`centeredStrike` overlever inn i ny motor som synlig felt.** Forutsetningen
      skal kunne leses av den som bruker tallet, ikke ligge i en kommentar.
- [ ] **Modellgrense-setningen nevner det.** «Modellert slag — ikke en måling»
      utvides: treffpunktet påvirker ikke ballflukten i denne modellen.
- [ ] **Sømmen mellom Studio og Ball Flight er dokumentert** (D53). Studio kan si
      «du traff 16,6 mm lavt» mens Ball Flight viser uendret kurve. En bruker som
      kan begrepene vil legge merke til det, og da skal svaret stå klart framfor
      å måtte gjettes.

## D4b — Køllekonvolutt og spinntak

- [ ] Spinntaket heves `9000 → 13000` rpm, i samme commit som D1.
- [ ] **Test:** null caser klamres innenfor konvolutten `speed 45 … 130 − 0.95 × loft`, `loft 6–60°`.
- [ ] Konvolutten implementeres som **markering, ikke blokkering** — sliderne forblir frie i hele det deklarerte området.
- [ ] Face, path og attack har **ingen** konvolutt. Fri bevegelse i `−15…+15`.
- [ ] Utenfor konvolutten: én binær tilstand eksponert fra motoren, ikke fire sannhetsnivåer.
- [ ] **Test:** 88,8 %-baselinen for rene caser innenfor konvolutten skal stige, ikke falle, etter D1.

## D5 — Én klassifiserer per kølle

- [ ] `strikeQuality` som dobbeltklassifiserer er slettet.
- [ ] Jern beholder turf-vokabular: `Pure` `Thin` `Fat` `Duff` `Whiff`.
- [ ] Driver får treffpunkt-vokabular: vertikal `High`/`Centre`/`Low`,
      horisontal `Toe`/`Centre`/`Heel`, pluss `off-face`.
- [ ] **Test:** null uenighet mellom klassifiserere, for begge køller.
      (I dag: jern 0 %, driver **82.3 %**.)

## D6 — Ingen presentasjon i motoroutput

- [ ] `color`, `textColor`, `tip`, `pct`, `barPos` finnes ikke i noe motorfelt.
- [ ] **Test:** regex over hele fixturen finner null hex-farger og null UI-strenger.

## D7 — Fixtur og versjonering

- [ ] Ny golden fixture generert fra ny motor, samme rutenett.
- [ ] Gammel fixture beholdt som `v1-legacy` for diffing.
- [ ] **Endringen er dokumentert som eksplisitt, versjonert fysikkendring**,
      slik `01` §5.8 krever. Golden cases i spec §9 vil flytte seg. Det er meningen.
- [ ] Diff-rapport viser hvilke utfall som endret seg og med hvor mye.

## D8 — Inn i designsystemet

- [ ] `DESIGN.md` har tokens for treffpunktrutenettet (3×3 + off-face).
- [ ] Gear-effect-retning vises redundant: form + tekst, aldri farge alene (D10).
- [ ] `off-face` er en egen visuell tilstand, ikke en ekstremverdi på en skala.
- [ ] **Test:** `npx @google/design.md lint DESIGN.md` gir null errors.

## Det jeg ikke kan love

Ingen målte driverdata finnes i prosjektet. Geometri, gear effect og
slagflategrenser kan valideres eksakt — de er determinert matematikk og
publiserte mål. **Absolutt carry for driver kan ikke valideres mot virkeligheten**
uten launch monitor-data. Modellen blir fysisk konsistent, ikke kalibrert.

Det er fortsatt dramatisk bedre enn i dag, der driver arver 7-jernets fit og
rapporterer 277 m for et slag som faktisk bærer 121 m.
