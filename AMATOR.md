# AMATØR — publiserte amatørreferansedata per segment og kølle

**Formål.** Gjøre brukerkravet etterprøvbart **for målgruppen**:
*«tallene skal oppleves reelle for det de opplever ute når de spiller.»*
`REALISME.md` løste tour. Dette dokumentet handler om amatører.

**Status:** 2026-08-25. Søsterdokument til `REALISME.md`. Samme absoluttregel gjelder.

---

## Absoluttregelen, og hva den koster her

Ingen tall i dette dokumentet er skrevet fra hukommelse. Hver rad har en hentbar URL.
Der noe ikke er publisert står det **IKKE PUBLISERT** — det er et funn, ikke en mangel
som skal fylles.

**Hovedfunnet er delt i to, og de trekker i hver sin retning.**

**Positivt:** amatørdekningen går fra 9 tall til **613 tall**. Det finnes ekte
spredning — ikke bare snitt — for driver, fra tre uavhengige konstruksjoner.
Handicap, score, alder og kjønn er alle dekket. Køllekartet dekker 19 køller.

**Negativt, og det avgjør saken:** **ingen av de 613 tallene er en av de ni
ønskede metrikkene.** Verken Arccos eller Shot Scope måler launch monitor-data.
De måler GPS-posisjon: hvor ballen startet, hvor den stoppet. Dekningen mot
ønskelisten er fortsatt **1 av 9 metrikker for 1 av 13 køller** — akkurat som før.

Det vi fikk er en **tiende metrikk som ikke sto på lista**: totaldistanse.
Den er verdifull, men den er ikke carry, og den kan ikke gjøres om til carry.

---

## 0. Dekningsmatrise — de ni ønskede metrikkene

| Metrikk | Amatørdekning | Kilde | Segmentert på |
|---|---|---|---|
| `clubSpeed` | **IKKE PUBLISERT** | — | — |
| `attackAngle` | **IKKE PUBLISERT** | — | — |
| `ballSpeed` | **IKKE PUBLISERT** | — | — |
| `smashFactor` | 9 tall, kun driver | Trackman Combine (forrige runde, `REALISME.md` §1.5) | handicap, kjønn |
| `launchAngle` | **IKKE PUBLISERT** | — | — |
| `spinRate` | **IKKE PUBLISERT** | — | — |
| `apex` | **IKKE PUBLISERT** | — | — |
| `landAngle` | **IKKE PUBLISERT** | — | — |
| `carry` | **IKKE PUBLISERT** | — | — |
| *(utenfor lista)* `totalDistance` | **613 tall** | Arccos, Shot Scope | handicap, score, alder, kjønn, kølle |
| *(utenfor lista)* fairway-treff, straffe, nærhet | rikt dekket | Arccos, Shot Scope | handicap, alder, kjønn |

**Dette er dokumentets viktigste tabell.** Åtte av ni metrikker har null amatørdekning
etter to fulle researchrunder. Det er ikke et søkeproblem — det er et måleproblem:
plattformene som har amatørvolumet (GPS-brikker i grepet) måler ikke ballflukt, og
plattformene som måler ballflukt (launch monitors) publiserer ikke amatøraggregater.

---

## 0.1 Forbehold om datagrunnlaget jeg faktisk mottok

Oppdraget oppgir **åtte kildeområder** og `STATUS.md` oppgir **325 rader**.
Datasettet som nådde meg inneholder **to områder** — `arccos` og `shotscope` — med
til sammen **63 rader**. De øvrige seks områdenes rader er ikke i det jeg mottok og
kan ikke føres inn her. Dette dokumentet dekker altså 2 av 8 områder.

Videre: oppdraget sier «hver rad kontrollert». Kontrollpostene som nådde meg dekker
**6 av 63 rader** (5 Arccos, 1 Shot Scope). De resterende 57 radene har jeg ingen
kontrollpost for. Se §6 — jeg markerer hvilke rader som er kontrollert og hvilke som
ikke er det, i stedet for å la alle fremstå som verifiserte.

---

## 1. Kilderegister

| # | Kilde | URL | Type | Merknad om henting |
|---|---|---|---|---|
| A1 | Arccos Annual Driving Distance Report, 2026 Edition (data: 2025) | `https://uploads.mygolfspy.com/uploads/2026/05/ArccosDrivingDistanceReport_2026Edition.pdf` | PDF, 33 s, 4,31 MB | **WebFetch alene virker ikke.** Hver side er ett helsides raster. Må lastes ned, sidebilder ekstraheres og leses visuelt. Et WebFetch-sammendrag av denne fila er verdiløst. |
| A2 | Arccos: Caddie Smart Distances | `https://www.arccosgolf.com/blogs/community/arccos-caddie-smart-distances-provide-rapid-golf-game-improvement` | HTML | Vintage ~2020. Eneste per-kølle-kilde hos Arccos. |
| A3 | Arccos: What happens to your game as you age | `https://www.arccosgolf.com/blogs/community/what-happens-to-your-game-as-you-age` | HTML | «Smart Distance» = filtrert, se §7. |
| A4 | Arccos: 50 % sjanse for å treffe green | `https://www.arccosgolf.com/blogs/community/from-this-distance-you-have-a-50-chance-of-hitting-the-green` | HTML | |
| A5 | Arccos: Course management 101 — layup | `https://eu.arccosgolf.com/blogs/community/course-management-101-what-layup-yardage-is-your-sweet-spot` | HTML | Kilden skriver feilaktig «yards» for hcp 16-20-cella; enheten er fot. |
| A6 | Arccos: 5 stats to tame your expectations | `https://www.arccosgolf.com/blogs/community/5-arccos-stats-to-tame-your-golf-expectations` | HTML | Vintage 2023. |
| A7 | Arccos: 26 million drives | `https://ca.arccosgolf.com/blogs/community/26-million-drives-has-driving-distance-increased` | HTML | Vintage 2017-2019. |
| S1 | Shot Scope via Troon: Do you hit it further than average | `https://troon.com/shot-scope/articles/do-you-hit-it-further-than-average-for-your-handicap-shot-scope` | HTML | **HTTP 403 mot WebFetch.** Krever browser-UA. Publisert 2024-10-22. Troon er speil, ikke primærkilde. |
| S2 | Shot Scope: 6 benchmarks for success | `https://shotscope.com/blog/practice-green/reduce-your-handicap/shot-scope-6-benchmarks-for-success/` | HTML | |
| S3 | Shot Scope: Distribution of driving distances 2022 | `https://shotscope.com/blog/practice-green/stats-and-data/distribution-of-driving-distances-2022/` | HTML | **Eneste publiserte fordeling i hele datasettet.** |
| S4 | Shot Scope: Driver or 3-wood | `https://shotscope.com/blog/practice-green/stats-and-data/driver-or-3-wood-what-is-better/` | HTML | **Eneste avg/P-Avg/longest-tripler.** |
| S5 | Shot Scope: Driver versus 3-wood (nærhet) | `https://shotscope.com/blog/practice-green/stats-and-data/driver-versus-3-wood/` | HTML | |
| S6 | Shot Scope: Hybrids or long irons | `https://shotscope.com/blog/practice-green/stats-and-data/what-should-you-use-hybrids-or-long-irons/` | HTML | |
| S7 | Shot Scope: Law of Averages (serie, 0/5/10/15/20/25 hcp) | `https://shotscope.com/blog/practice-green/game-improvement/reduce-hcp-law-of-averages-0hcp/` | HTML | Seks søsterartikler, én per handicap. |
| S8 | Shot Scope: Ryder Cup — the average golfer | `https://shotscope.com/blog/tour-truck/events-and-tournaments/ryder-cup-at-bethpage-black-on-the-tee-the-average-golfer/` | HTML | |
| S9 | Shot Scope: Numbers on the women's game | `https://shotscope.com/blog/practice-green/stats-and-data/golf-numbers-you-actually-need-to-know-on-the-womens-game/` | HTML | **Kun relative tall.** Ingen absolutte kvinnedistanser. |
| S10 | Shot Scope support: Hva er P-AVG | `https://support.shotscope.com/hc/en-us/articles/360000810145-What-is-the-P-AVG-Performance-Average-Distance` | HTML | Metodedefinisjon. Kritisk for §7. |
| M1 | MyGolfSpy: What does an average drive look like in 2026 | `https://mygolfspy.com/news-opinion/what-does-an-average-drive-look-like-in-2026/` | HTML | Refererer Shot Scope Annual Report 2026. |
| M2 | MyGolfSpy: Driver distance chart 2026 | `https://mygolfspy.com/news-opinion/driver-distance-chart-2026-update-how-far-golfers-hit-it-by-handicap/` | HTML | |
| M3 | MyGolfSpy: Fairway wood distance chart | `https://mygolfspy.com/news-opinion/instruction/fairway-wood-distance-chart-whats-average-for-your-handicap/` | HTML | |
| M4 | MyGolfSpy: Hybrid distance chart | `https://mygolfspy.com/news-opinion/hybrid-distance-chart-whats-average-for-your-handicap/` | HTML | |
| M5 | MyGolfSpy: Complete iron distance chart | `https://mygolfspy.com/news-opinion/instruction/how-far-should-you-hit-each-iron-complete-iron-distance-chart-for-every-handicap/` | HTML | |
| M6 | MyGolfSpy: How far should you be hitting each club | `https://mygolfspy.com/news-opinion/how-far-should-you-be-hitting-each-club-distance-data-you-should-know/` | HTML | Kilde for wedger og eldre 3-wood-sett. |
| P1 | Shot Scope: 5 key launch monitor stats | `https://shotscope.com/blog/practice-green/stats-and-data/5-key-launch-monitor-stats-every-golfer-should-track/` | HTML | **PRESKRIPTIV — se §7.** Brukes ikke i bånd. |

### Provenienssvakhet som må stå

**12 av 25 Shot Scope-rader har ikke shotscope.com som URL.** 10 står på
mygolfspy.com, 2 på troon.com. Og det er verre enn antallet antyder: **all
per-kølle-detalj for jern, wedger, hybrider og fairwaywooder finnes kun i
tredjepartsgjengivelse** (M3-M6). Shot Scope publiserer ikke disse tabellene selv
på et hentbart sted. Primærkilden — Shot Scope Annual Report 2026 — er skjemalåst
bak e-postregistrering og ble **ikke hentet**. Utvalgstallene (74 mill. slag,
870 000 runder, 24 000 baner, 124 land) er derfor sitert via M1, ikke fra rapporten.

### Metode bak A1

- Tilfeldig utvalg av 37 000+ golfere med minst 100 driverutslag i verifiserte runder 2025.
- Totalt 9 723 986 driverutslag. Kun par 4 og par 5; par 3 utelatt.
- Vektet metodikk: antall kvalifiserende slag per gruppe.
- **Ikke normalisert** for vær, høyde over havet eller underlag.
- **Ingen SD, ingen persentiler, ingen n per celle.** Kun globalt n.

### Metode bak S1-S8 (P-Avg), fra S10

> «Performance Average uses algorithms to remove all outlier shot distances (both
> long and short) to give the golfer a true representation of the distance a well
> struck golf shot travels.»

Ekskluderer posisjonsslag og slag innenfor 50 yd av flagget. Krever ca. 5 runder.
**Trimmefraksjonen er ikke publisert.** Det er grunnen til at nedre hale i §5 ikke
kan utledes.

---

## 2. HANDICAPSEGMENTER

### 2.0 Enhets- og definisjonsvarsel som gjelder ALLE tabeller i §2-§4

1. **Alle tall er TOTAL distanse (carry + utrull). Ingen av dem er carry.**
   A1 sier det ordrett to ganger: *«capturing total yardage (carry plus rollout)
   without normalization»*. Shot Scope måler GPS-punkt til GPS-punkt, altså der
   ballen stoppet. **Ingen kilde publiserer en carry/utrull-splitt for amatører.**
   Disse tallene skal aldri skrives inn i et `carry`-felt. Se §8.
2. **To uforenlige metrikkdefinisjoner er i omløp.** «Snitt» (alle slag, mishits
   inkludert) og «P-Avg / Smart Distance» (uteliggere fjernet). Forskjellen er
   6,6-12,1 %. Hver rad under er merket med hvilken. Å blande dem er den største
   enkeltfeilkilden i dette datasettet.
3. **Et snitt er ikke et bånd.** Ingen kilde publiserer SD eller persentiler per
   kølle. Spredningen som faktisk finnes står i §5, og den finnes bare for driver.

---

### 2.1 Driver, MENN — totaldistanse per handicap × alder (Arccos)

Metrikk: snitt av **alle** driverutslag, total yd. Kilde: **A1** s. 8 og s. 10.
Kontrollert: radene 0.0-4.9 til 20.0-24.9 (§6).

| Handicap | 15-19 | 20s | 30s | 40s | 50s | 60s | 70s | **Snitt** |
|---|---|---|---|---|---|---|---|---|
| 0.0-4.9 | 259 | 263 | 259 | 253 | 239 | 227 | 209 | **244** |
| 5.0-9.9 | 247 | 250 | 247 | 239 | 230 | 218 | 206 | **234** |
| 10.0-14.9 | 237 | 239 | 236 | 230 | 220 | 206 | 194 | **223** |
| 15.0-19.9 | 221 | 233 | 224 | 221 | 208 | 195 | 185 | **212** |
| 20.0-24.9 | 204 | 219 | 216 | 204 | 193 | 188 | 168 | **199** |
| 25.0-29.9 | 207 | 209 | 206 | 198 | 188 | 183 | 166 | **194** |
| 30+ | 190 | 193 | 197 | 193 | 176 | 165 | 155 | **181** |
| **Alle hcp** | 240 | 237 | 235 | 230 | 219 | 206 | 190 | **224,1** |

`https://uploads.mygolfspy.com/uploads/2026/05/ArccosDrivingDistanceReport_2026Edition.pdf`

**Om «Snitt»-kolonnen.** Metodedelen lover skuddvektet snitt, men kolonnen er
regnet ut å være det enkle uvektede snittet av de sju alderscellene i 14 av 14
rader (distanse + treffsikkerhet). Vektingen skjer altså *innad* i hver celle, ikke
på tvers av alderskolonnene. Konsekvens: en 17-åring teller like mye som en
50-åring. Arccos' brukerbase er skjøvet mot eldre spillere, så det
populasjonsvektede segmentsnittet er trolig **lavere** enn tallet i kolonnen.
Bruk det som «snitt av alderskohortene», ikke som «snittet for en tilfeldig
17-handicapper».

### 2.2 Driver, MENN — fairwaytreff per handicap × alder (Arccos)

Kilde: **A1** s. 11 og s. 13. Enhet: % fairways hit.

| Handicap | 15-19 | 20s | 30s | 40s | 50s | 60s | 70s | **Snitt** |
|---|---|---|---|---|---|---|---|---|
| 0.0-4.9 | 48 | 42 | 43 | 47 | 51 | 57 | 60 | **50** |
| 5.0-9.9 | 44 | 40 | 41 | 45 | 51 | 53 | 57 | **47** |
| 10.0-14.9 | 42 | 38 | 39 | 42 | 47 | 52 | 57 | **45** |
| 15.0-19.9 | 40 | 37 | 38 | 41 | 45 | 51 | 55 | **44** |
| 20.0-24.9 | 39 | 36 | 37 | 40 | 45 | 50 | 54 | **43** |
| 25.0-29.9 | 33 | 36 | 36 | 38 | 42 | 47 | 54 | **41** |
| 30+ | 29 | 35 | 36 | 38 | 42 | 49 | 54 | **40** |
| **Alle hcp** | 43 | 38 | 39 | 43 | 48 | 52 | 56 | — |

`https://uploads.mygolfspy.com/uploads/2026/05/ArccosDrivingDistanceReport_2026Edition.pdf`

Merk at treffsikkerhet stiger monotont med alder i **alle sju** handicapbånd, mens
distanse faller monotont. Det er den reneste demonstrasjonen i datasettet av at
lengde kjøpes med spredning.

### 2.3 Driver, KVINNER — totaldistanse per handicap × alder (Arccos)

Kilde: **A1** s. 18 og s. 20. Kolonnene 15-19 og 70+ mangler i kilden på grunn av
lav n — det er kildens eget valg, ikke et hull i transkripsjonen.

| Handicap | 20s | 30s | 40s | 50s | 60s | **Snitt** |
|---|---|---|---|---|---|---|
| 0.0-4.9 | 244 | 237 | 232 | 201 | 184 | **220** |
| 5.0-9.9 | 227 | 229 | 212 | 195 | 167 | **206** |
| 10.0-14.9 | 217 | 209 | 195 | 180 | 176 | **195** |
| 15.0-19.9 | 187 | 194 | 182 | 173 | 152 | **178** |
| 20.0-24.9 | 194 | 174 | 166 | 155 | 148 | **167** |
| 25.0-29.9 | 169 | 163 | 152 | 145 | 140 | **154** |
| 30+ | 168 | 151 | 144 | 134 | 127 | **145** |
| **Alle hcp** | 201 | 192 | 183 | 168 | 158 | **176,2** |

`https://uploads.mygolfspy.com/uploads/2026/05/ArccosDrivingDistanceReport_2026Edition.pdf`

### 2.4 Driver, KVINNER — fairwaytreff per handicap × alder (Arccos)

Kilde: **A1** s. 21 og s. 23.

| Handicap | 20s | 30s | 40s | 50s | 60s | **Snitt** |
|---|---|---|---|---|---|---|
| 0.0-4.9 | 55 | 46 | 50 | 60 | 65 | **55** |
| 5.0-9.9 | 44 | 46 | 50 | 57 | 64 | **52** |
| 10.0-14.9 | 41 | 48 | 51 | 58 | 63 | **52** |
| 15.0-19.9 | 44 | 49 | 51 | 57 | 63 | **53** |
| 20.0-24.9 | 48 | 47 | 49 | 55 | 60 | **52** |
| 25.0-29.9 | 42 | 47 | 48 | 59 | 59 | **51** |
| 30+ | 48 | 46 | 51 | 59 | 58 | **52** |
| **Alle hcp** | 46 | 48 | 53 | 58 | 63 | — |

`https://uploads.mygolfspy.com/uploads/2026/05/ArccosDrivingDistanceReport_2026Edition.pdf`

**Kvinners treffsikkerhet er flat på tvers av handicap (51-55 %)** — mot menns
40-50 % med tydelig fall. En kvinnelig 30+-handicapper treffer fairway like ofte
som en scratchspiller. Hele forskjellen ligger i lengde. Dette bekreftes
kvalitativt av **S9**, som oppgir 85 yd forskjell i lengde og «ikke mye forskjell»
i fairwayprosent mellom scratch og hcp 30.

### 2.5 Driver — Shot Scope, begge metrikkdefinisjoner

| Handicap | Snitt, alle slag (M1) | P-Avg (S1) | P-Avg (M1) | P-Avg (S4, hcp 8/14/20) |
|---|---|---|---|---|
| 0 / scratch | **261** | **285** | — | — |
| 5 | **242** | **261** | — | — |
| 8 | — | — | — | **242** |
| 10 | **228** | **259** | **253** | — |
| 14 | — | — | — | **222** |
| 15 | **214** | **236** | **240** | — |
| 20 | **202** | **225** | — | **213** |
| 25 | **195** | **204** | — | — |

Kilder, i kolonnerekkefølge:
`https://mygolfspy.com/news-opinion/what-does-an-average-drive-look-like-in-2026/` ·
`https://troon.com/shot-scope/articles/do-you-hit-it-further-than-average-for-your-handicap-shot-scope` ·
`https://mygolfspy.com/news-opinion/what-does-an-average-drive-look-like-in-2026/` ·
`https://shotscope.com/blog/practice-green/stats-and-data/driver-or-3-wood-what-is-better/`

**⚠ P-Avg-kolonnene er innbyrdes uforenlige.** For hcp 10 oppgir S1 **259**, M1
oppgir **253**, og S4 interpolert fra hcp 8/14 gir ca. **235**. Det er **24 yards
sprik på samme metrikk fra samme plattform.** Se §6.

**⚠ S1 er nesten flat mellom hcp 5 og 10** (261 → 259, 2 yd) mens de andre båndene
faller 20-30 yd. Dette er ikke et isolert utslag: hcp 10-raden hos Shot Scope
ligger systematisk høyt også i jerntabellen (§2.7). Se §6.

### 2.6 Kryssvalidering Arccos ↔ Shot Scope — dokumentets sterkeste resultat

To uavhengige GPS-plattformer, hver med titalls millioner slag, ulike brukerbaser,
ulike land, ulike år. Sammenlignet på **samme metrikkdefinisjon** (snitt av alle
slag, total distanse):

| Handicap | Arccos (A1) | Shot Scope (M1) | Avvik yd | Avvik % |
|---|---|---|---|---|
| 0 / 0.0-4.9 | 244 | 261 | 17 | 7,0 % |
| 5 / 5.0-9.9 | 234 | 242 | 8 | 3,4 % |
| 10 / 10.0-14.9 | 223 | 228 | 5 | 2,2 % |
| 15 / 15.0-19.9 | 212 | 214 | 2 | 0,9 % |
| 20 / 20.0-24.9 | 199 | 202 | 3 | 1,5 % |
| 25 / 25.0-29.9 | 194 | 195 | 1 | 0,5 % |

`https://uploads.mygolfspy.com/uploads/2026/05/ArccosDrivingDistanceReport_2026Edition.pdf` ·
`https://mygolfspy.com/news-opinion/what-does-an-average-drive-look-like-in-2026/`

**For hcp 10-25 er de to plattformene enige innenfor 0,5-2,2 %.** Det er
bemerkelsesverdig og gjør disse tallene til de best underbygde amatørtallene i
prosjektet. Det setter også et empirisk gulv for hvor stramt et bånd kan settes —
se §8.

**Avviket vokser til 7,0 % ved scratch.** Sannsynlig forklaring: Arccos' «0.0 til
4.9» er et bånd med populasjonssnitt rundt 2,5 og inkluderer alle aldre inkludert
70-åringer, mens Shot Scope «scratch» er handicap 0. Forklaringen er plausibel,
men **ikke verifisert mot kilde** — behandle den som hypotese.

**Merk hva sammenligningen forutsetter:** den holder bare fordi begge kolonner er
«alle slag». Sammenlignet mot S1s P-Avg ville Arccos ligget 36 yd under, og
konklusjonen ville blitt at plattformene er uforenlige. Metrikkdefinisjonen avgjør
alt.

### 2.7 Alle køller — P-Avg totaldistanse per handicap (Shot Scope via tredjepart)

Metrikk: **P-Avg** — uteliggere fjernet, altså *velltruffet* slag. Systematisk
høyere enn segmentsnittet, se §7. Enhet: total yd.

| Kølle | hcp 0 | hcp 5 | hcp 10 | hcp 15 | hcp 20 | hcp 25 | Kilde-URL |
|---|---|---|---|---|---|---|---|
| Driver | 285 | 261 | 259 | 236 | 225 | 204 | `https://troon.com/shot-scope/articles/do-you-hit-it-further-than-average-for-your-handicap-shot-scope` |
| 3-wood *(nyere sett)* | 256 | 239 | 225 | 212 | 196 | 179 | `https://mygolfspy.com/news-opinion/instruction/fairway-wood-distance-chart-whats-average-for-your-handicap/` |
| 3-wood *(eldre sett)* | 261 | 234 | 227 | 215 | 195 | 178 | `https://mygolfspy.com/news-opinion/how-far-should-you-be-hitting-each-club-distance-data-you-should-know/` |
| 5-wood | 232 | 215 | 203 | 190 | 179 | 167 | `https://mygolfspy.com/news-opinion/instruction/fairway-wood-distance-chart-whats-average-for-your-handicap/` |
| 7-wood | 218 | 200 | 190 | 179 | 171 | 163 | `https://mygolfspy.com/news-opinion/instruction/fairway-wood-distance-chart-whats-average-for-your-handicap/` |
| 9-wood ⚠ | — | — | — | 160 | 152 | — | `https://mygolfspy.com/news-opinion/instruction/fairway-wood-distance-chart-whats-average-for-your-handicap/` |
| **3-jern** | **—** | **—** | **—** | **—** | **—** | **—** | **IKKE PUBLISERT** |
| 4-jern | 223 | 201 | 199 | 186 | 169 | 151 | `https://mygolfspy.com/news-opinion/instruction/how-far-should-you-hit-each-iron-complete-iron-distance-chart-for-every-handicap/` |
| 5-jern | 200 | 183 | 187 ⚠ | 169 | 162 | 143 | *(samme)* |
| 6-jern | 185 | 172 | 171 | 162 | 151 | 137 | *(samme)* |
| 7-jern | 178 | 164 | 161 | 154 | 146 | 132 | *(samme)*, bekreftet av `https://troon.com/shot-scope/articles/do-you-hit-it-further-than-average-for-your-handicap-shot-scope` |
| 8-jern | 166 | 153 | 150 | 146 | 138 | 122 | *(samme)* |
| 9-jern | 155 | 139 | 140 ⚠ | 136 | 129 | 108 | *(samme)* |
| PW ⚠ | 141 | 126 | 127 ⚠ | 121 | 108 | 90 | `https://mygolfspy.com/news-opinion/how-far-should-you-be-hitting-each-club-distance-data-you-should-know/` |
| GW ⚠ | 126 | 109 | 110 ⚠ | 104 | 94 | 79 | *(samme)* |
| SW ⚠ | 105 | 86 | 98 ⚠ | 84 | 85 ⚠ | 80 | *(samme)* |
| LW ⚠ | 86 | 71 | 79 ⚠ | 75 | 78 ⚠ | 49 | *(samme)* |

⚠ = ikke-monoton mot nabo-handicap, eller kildeoppgitt lite utvalg. Se §6.

**7-jernet er den eneste kølla med uavhengig bekreftelse:** Troon (S1) og MyGolfSpy
(M5) oppgir identiske seks verdier. Begge stammer fra Shot Scope, så det er
konsistent gjengivelse, ikke uavhengig måling — men det utelukker
transkripsjonsfeil.

### 2.8 Hybrider — snitt OG P-Avg per handicap (Shot Scope via MyGolfSpy)

Eneste tabell i datasettet som gir **begge** metrikkdefinisjoner per kølle.
Format: `snitt / P-Avg`, total yd. **Hcp 10 og hcp 20 mangler i kilden.**

| Kølle | hcp 0 | hcp 5 | hcp 15 | hcp 25 |
|---|---|---|---|---|
| 2-hybrid | 205 / 230 | 189 / 215 | 163 / 204 | 134 / 168 |
| 3-hybrid | 197 / 219 | 181 / 207 | 166 ⚠ / 195 | 132 / 161 |
| 4-hybrid | 186 / 209 | 174 / 199 | 155 / 188 | 121 / 149 |
| 5-hybrid | 171 / 193 | 162 / 184 | 143 / 175 | 113 / 140 |

`https://mygolfspy.com/news-opinion/hybrid-distance-chart-whats-average-for-your-handicap/`

⚠ hcp 15: 3-hybrid snitt (166) > 2-hybrid snitt (163). Ikke-monoton innad i raden.

Snitt→P-Avg-gapet her er **+11,2 % til +25,4 %** — vesentlig større enn driverens
6,6-12,1 %. Det er som forventet: hybrider treffes dårligere enn driver, så
uteliggerfiltreringen fjerner mer.

### 2.9 Arccos per kølle — median FAKTISK distanse vs. spillerens VALGTE distanse

Kilde: **A2**. Vintage ca. 2020. Total distanse inkl. utrull.
«Mean start distance» = avstanden spilleren sto på da han valgte kølla, altså
avstanden han *tror* han slår. «Median distance hit» = hvor langt ballen faktisk gikk.

| Kølle | Segment | Tror (yd) | Faktisk (yd) | **Persepsjonsgap** |
|---|---|---|---|---|
| 5-jern | scratch | 194 | 176 | **+18** |
| 5-jern | hcp 20 | 187 | 152 | **+35** |
| 7-jern | scratch | 170 | 159 | **+11** |
| 7-jern | hcp 10 | 165 | 148 | **+17** |
| 7-jern | hcp 20 | 162 | 140 | **+22** |
| PW | scratch | 126 | 122 | **+4** |
| PW | hcp 10 | 119 | 114 | **+5** |
| PW | hcp 20 | 112 | 104 | **+8** |

`https://www.arccosgolf.com/blogs/community/arccos-caddie-smart-distances-provide-rapid-golf-game-improvement`

**Dette er den eneste raden i hele dokumentet som direkte adresserer ordlyden i
brukerkravet.** Kravet er at tallene skal *oppleves* reelle. Data viser at
amatørens opplevde distanse ligger **4 til 35 yards over** hans faktiske distanse,
og at gapet vokser både med handicap og med køllelengde. Et teknisk korrekt tall
vil derfor føles **for kort** for målgruppen — mest for den svakeste spilleren med
det lengste jernet.

Samme kilde bekrefter konsekvensen på banen: **40 % av innspill lander kort av
green, åtte ganger så mange som lander bakenfor** (n > 6 mill. slag).
Det er ikke en tilfeldig spredning — det er en systematisk skjevhet.

Dette er et **designfunn, ikke et båndfunn**. Det hører hjemme i `DECISIONS.md`,
ikke i en toleranseport. Men det bør ikke gå tapt.

### 2.10 Nærhet til hull per handicap — dispersjonsproxy

Nærhet er middels radialt bom, altså en ekte 2D-spredning. Det er den nærmeste
publiserte proxyen for dispersjon i hele datasettet.

**Wedge, per utgangsavstand (Arccos, A5).** Enhet: fot.

| Handicap | fra 60-80 yd | fra 100-120 yd |
|---|---|---|
| 0-5 | 41,38 | 48,82 |
| 6-10 | 45,20 | 54,56 |
| 11-15 | 50,49 | 61,85 |
| 16-20 | 55,21 | 70,76 |
| 20+ | 62,43 | 83,46 |
| *PGA Tour-referanse* | — | *19'7" (fra 100-125 yd)* |

`https://eu.arccosgolf.com/blogs/community/course-management-101-what-layup-yardage-is-your-sweet-spot`
· n > 100 mill. slag / ca. 2 mill. runder.
Kilden skriver feilaktig «yards» i 16-20-cella; enheten er fot.

**Jern, alle amatører samlet (Shot Scope, S5).** Enhet: fot.

| 4-jern | 5-jern | 6-jern | 7-jern | 8-jern | 9-jern |
|---|---|---|---|---|---|
| 85 | 79 | 67 | 55 | 48 | 44 |

`https://shotscope.com/blog/practice-green/stats-and-data/driver-versus-3-wood/`

**Avstand for 50 % greentreff (Arccos, A4).** Enhet: yd.

| scratch | hcp 5 | hcp 10 | hcp 15 | hcp 20 |
|---|---|---|---|---|
| 165 | 147 | 129 | 110 | 92 |

`https://www.arccosgolf.com/blogs/community/from-this-distance-you-have-a-50-chance-of-hitting-the-green`

### 2.11 Retningsspredning per handicap

**Arccos (A1 s. 15) — wayward tee shots, driver.** Enhet: %.

| Handicap | Straffe | Recovery | **Totalt** |
|---|---|---|---|
| 0.0-4.9 | 4,4 | 7,6 | **12,0** |
| 5.0-9.9 | 5,6 | 11,3 | **16,9** |
| 10.0-14.9 | 6,9 | 15,7 | **22,6** |
| 15.0-19.9 | 8,0 | 20,2 | **28,2** |
| 20.0-24.9 | 9,3 | 24,2 | **33,5** |
| 25.0-29.9 | 10,4 | 27,8 | **38,2** |
| 30+ | 11,9 | 33,2 | **45,1** |

`https://uploads.mygolfspy.com/uploads/2026/05/ArccosDrivingDistanceReport_2026Edition.pdf`

**Shot Scope (M2) — driver, retningsfordeling.** Enhet: %.

| Handicap | Fairway | Bom venstre | Bom høyre | Straffe |
|---|---|---|---|---|
| 0 | 48 | 25 | 25 | 1 |
| 5 | 49 | 23 | 24 | 1 |
| 10 | 49 | 24 | 25 | 2 |
| 15 | 47 | 23 | 26 | 2 |
| 20 | 46 | 25 | 25 | 3 |
| 25 | 47 | 19 | 28 | 3 |

`https://mygolfspy.com/news-opinion/driver-distance-chart-2026-update-how-far-golfers-hit-it-by-handicap/`

**⚠ De to kildene er uforenlige på begge målene.** Arccos' fairwaytreff faller
50 → 40 % over handicapspennet; Shot Scopes er flat på 46-49 %. Arccos' straffe-
prosent er 4,4-11,9 %; Shot Scopes er 1-3 %, altså **3-4× lavere**.
Sannsynligvis definisjonsforskjell — Arccos skiller straffe fra recovery, Shot Scope
gjør det ikke — men **det er ikke verifisert**. Ingen av settene bør brukes som
sannhet før definisjonen er avklart. Se §6.

**Venstre/høyre er tilnærmet symmetrisk** hos Shot Scope for hcp 0-20 (23-25 % mot
24-26 %), med et høyrehalende utslag først ved hcp 25 (19 % / 28 %). For en
D-plane-modell er det et brukbart, om enn grovt, holdepunkt om at
sidespredning ikke er systematisk skjev for de fleste amatørsegmenter.

---

## 3. SCORESEGMENTER

### 3.1 Driver — P-Avg per scoreklasse

| Scorer i | 60-tallet | 70-tallet | 80-tallet | 90-tallet | 100-tallet |
|---|---|---|---|---|---|
| Driver P-Avg (yd) | 285 | 261 | 236 | 225 | 204 |

`https://shotscope.com/blog/practice-green/reduce-your-handicap/shot-scope-6-benchmarks-for-success/`

### 3.2 ⚠ Scoresegmenteringen er ikke uavhengige data

Handicapsettet fra S1 er `{285, 261, 259, 236, 225, 204}` for hcp `{0, 5, 10, 15, 20, 25}`.
Scoresettet er `{285, 261, 236, 225, 204}`.

**Scoresettet er en ekte delmengde av handicapsettet** — de fem verdiene er
identiske, kun hcp 10-verdien (259) mangler. Shot Scope bøtter altså samme
underliggende spillerpopulasjon på to måter og publiserer samme tall to ganger.

**Konsekvens:** scoreaksen tilfører **null nye tall**. Å sitere begge som separate
bevis er dobbelttelling. Kartleggingen som faktisk følger av dette:

| Score | Tilsvarer handicap |
|---|---|
| 60-tallet | 0 |
| 70-tallet | 5 |
| 80-tallet | 15 |
| 90-tallet | 20 |
| 100-tallet | 25 |

Merk at 80-tallsspilleren kartlegges til **hcp 15**, ikke hcp 10 som man kunne tro.

### 3.3 Scoresegmentert data for øvrige køller

**IKKE PUBLISERT.** Ingen kilde i datasettet segmenterer noen annen kølle enn
driver på score. Ingen kilde segmenterer noen metrikk utenom distanse på score.

**Anbefaling:** dropp scoreaksen som egen akse i motoren. Bruk handicapaksen og
kartleggingstabellen i §3.2 til å presentere for brukeren, hvis scorespråk er
ønskelig i UI-et. Å bygge en egen scoresegmentert datastruktur ville gi et
tomt skall.

---

## 4. ALDER OG KJØNN

### 4.1 Driver etter alder — to uavhengige kilder, samme kurve

| Aldersgruppe | Arccos, alle hcp (A1) | Shot Scope P-Avg (S3) | Snitt-hcp i SS-utvalget |
|---|---|---|---|
| 15-19 | 240 | — | — |
| 20-29 | 237 | 243 | 13,7 |
| 30-39 | 235 | 241 | 14,7 |
| 40-49 | 230 | 232 | 13,7 |
| 50-59 | 219 | 224 | 13,5 |
| 60-69 | 206 | 212 | 14,7 |
| 70+ | 190 | 196 | 15,8 |

`https://uploads.mygolfspy.com/uploads/2026/05/ArccosDrivingDistanceReport_2026Edition.pdf` ·
`https://shotscope.com/blog/practice-green/stats-and-data/distribution-of-driving-distances-2022/`

**Aldersforfallet er replikert eksakt:**
Arccos 237 → 190 = **47 yd, 19,8 %** fra 20-årene til 70+.
Shot Scope 243 → 196 = **47 yd, 19,3 %**.
Konstant offset på ca. 6 yd (Shot Scope høyere, som forventet av P-Avg-filtreringen),
men helt lik form. Dette er den nest sterkeste kryssvalideringen i dokumentet.

**Kvinner etter alder (Arccos, A1):**

| 20s | 30s | 40s | 50s | 60s |
|---|---|---|---|---|
| 201 | 192 | 183 | 168 | 158 |

43 yd / **21,4 %** fall fra 20-årene til 60-årene. Menn over samme spenn:
237 → 206 = 31 yd / 13,1 %. **Kvinner mister lengde raskere med alder enn menn.**

### 4.2 Tidsstabilitet — brukbar som gyldighetsvindu

Aggregert driverdistanse, alle spillere, total yd (**A1**):

| År | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|---|
| Menn | 224,0 | 222,2 | 223,3 | 221,7 | 224,1 | 225,0 | 224,7 | 224,1 |
| Kvinner | 179,2 | 177,6 | 178,8 | 179,7 | 178,4 | 178,1 | 176,2 | 175,7 |

Menn 40-49 år, per handicapbånd, 2018 → 2025 (**A1** appendiks s. 25-31):

| Handicap | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|---|
| 0.0-4.9 | 251 | 251 | 251 | 252 | 252 | 254 | 255 | 253 |
| 10.0-14.9 | 229 | 228 | 228 | 226 | 228 | 230 | 231 | 230 |
| 20.0-24.9 | 208 | 209 | 207 | 205 | 206 | 207 | 208 | 204 |
| 30+ | 192 | 188 | 192 | 189 | 191 | 188 | 191 | 193 |

`https://uploads.mygolfspy.com/uploads/2026/05/ArccosDrivingDistanceReport_2026Edition.pdf`

**Amatørtall drifter ikke.** Åtte år, maks spenn 3,3 yd (1,5 %) for menn samlet og
under 5 yd innen hvert handicapbånd. Dette står i skarp kontrast til
`REALISME.md` §3.1(e), der tourtabellens utgaveskifte alene flyttet carry 2,3-4,4 %
og spinn 5,25 %.

**Praktisk konsekvens:** utgavelåsing er **ikke** nødvendig for amatørtallene, i
motsetning til tourtallene. Vintage kan blandes innenfor ca. 2 % uten at det
sprenger noe. Det er en reell forenkling.

**⚠ Én intern inkonsistens i A1:** kvinner 2025 oppgis som 176,2 i tabelldelen og
175,7 i trendgrafen. 0,5 yd. Ikke avklart hvilken som er riktig.

### 4.3 Kjønn — hva som mangler

| | Menn | Kvinner |
|---|---|---|
| Driver, hcp × alder | **Full 7×7-matrise** (A1) | **Full 7×5-matrise** (A1) |
| Fairwaytreff, hcp × alder | **Full 7×7-matrise** (A1) | **Full 7×5-matrise** (A1) |
| Alle andre køller | Shot Scope-tabell, 18 køller | **IKKE PUBLISERT** |
| Straffe / recovery | A1 s. 15 | **IKKE PUBLISERT** |
| Nærhet / dispersjon | A5, S5 | **IKKE PUBLISERT** |

**Kvinnedata finnes kun for driver, kun for totaldistanse og fairwaytreff, kun fra
Arccos.** Shot Scope publiserer ingen absolutte kvinnetall — S9 gir bare relative
utsagn (85 yd forskjell mellom scratch og hcp 30; scratch-kvinnens 7-jern går 30 yd
lenger enn hcp 30-kvinnens *driver*; 11 greener mot 1 per runde; 28 mot 37 putter).
Relative tall kan ikke bli bånd.

---

## 5. SPREDNING — den mest verdifulle delen

`REALISME.md` §1.6 fant én publisert spredning i hele tourmaterialet: PGA driver,
tre metrikker, mellom spillere. Amatørmaterialet er **bedre** på dette punktet.
Her er alt som finnes, sortert etter hvilken type spredning det faktisk er.

### 5.1 Innen spiller, slag til slag — driver og 3-wood

Dette er den typen spredning som avgjør om **ett simulert slag** ser ekte ut.
Hver spiller bidrar med sitt eget snitt, sin egen P-Avg og sitt eget lengste slag.

**Driver (S4):**

| Handicap | Snitt | P-Avg | Lengste | Snitt→P-Avg | Snitt→lengste |
|---|---|---|---|---|---|
| 8 | 227 | 242 | 261 | +15 (**+6,6 %**) | +34 (**+15,0 %**) |
| 14 | 207 | 222 | 246 | +15 (**+7,2 %**) | +39 (**+18,8 %**) |
| 20 | 198 | 213 | 239 | +15 (**+7,6 %**) | +41 (**+20,7 %**) |

**3-wood (S4):**

| Handicap | Snitt | P-Avg | Lengste | Snitt→P-Avg | Snitt→lengste |
|---|---|---|---|---|---|
| 8 | 206 | 214 | 225 | +8 (**+3,9 %**) | +19 (**+9,2 %**) |
| 14 | 188 | 194 | 222 | +6 (**+3,2 %**) | +34 (**+18,1 %**) |
| 20 | 182 | 195 ⚠ | 220 | +13 (**+7,1 %**) | +38 (**+20,9 %**) |

`https://shotscope.com/blog/practice-green/stats-and-data/driver-or-3-wood-what-is-better/`

**Paret snitt/P-Avg fra uavhengig kilde (M1):**

| Handicap | Snitt | P-Avg | Gap |
|---|---|---|---|
| 10 | 228 | 253 | +25 (**+11,0 %**) |
| 15 | 214 | 240 | +26 (**+12,1 %**) |

`https://mygolfspy.com/news-opinion/what-does-an-average-drive-look-like-in-2026/`

**Tre resultater å ta med videre:**

1. **Snitt→P-Avg-gapet er 6,6-12,1 %.** De to kildene er ikke enige — S4 sier
   6,6-7,6 %, M1 sier 11,0-12,1 %. Bruk hele spennet, ikke ett tall.
2. **Snitt→lengste er +15,0 til +20,9 %, og gapet vokser med handicap.**
   Den dårligere spilleren har større relativ toppspredning, ikke mindre.
3. **⚠ Nedre hale er IKKE PUBLISERT og kan ikke utledes.** P-Avg fjerner
   uteliggere i *begge* ender, og trimmefraksjonen er ikke oppgitt (S10). Vi vet
   at korte mishits trekker snittet 15 yd under P-Avg, men ikke hvor langt ned
   halen går. **Dette er det eneste virkelig kritiske hullet i spredningsdataene.**

### 5.2 Mellom spillere — den eneste publiserte fordelingen

Driver, hele amatørpopulasjonen. Andel av spillere per eget snitt-drivelengde.

| Snitt-drivelengde | Andel | Kumulativt |
|---|---|---|
| Under 200 yd | 19 % | 19 % |
| 200-224 yd | 35 % | 54 % |
| 225-249 yd | 22 % | 76 % |
| 250-274 yd | 14 % | 90 % |
| 275-299 yd | 8 % | 98 % |
| Over 300 yd | 2 % | 100 % |

`https://shotscope.com/blog/practice-green/stats-and-data/distribution-of-driving-distances-2022/`
Publisert snitt for samme populasjon: **225 yd**.

**Persentiler lest direkte av bøttegrensene** (kildeverdier, ikke beregnet):
P19 = 200 yd · P54 = 225 yd · P76 = 250 yd · P90 = 275 yd · P98 = 300 yd.

**Median ca. 222 yd** — dette er **UTLEDET**, ved lineær interpolasjon i
200-224-bøtta ((50−19)/(54−19) × 25 + 200). Det er ikke et publisert tall og skal
merkes som utledet der det brukes.

Relativt til medianen: **P19 = −10 % · P90 = +24 % · P98 = +35 %.**

Merk hva dette **ikke** er: hver spiller er redusert til sitt eget snitt, akkurat
som i `REALISME.md` §1.6. Det er bredden på amatørfeltet, ikke bredden på én
spillers slag. De to må ikke blandes.

### 5.3 Mellom aldersgrupper innen samme handicapbånd (Arccos)

Beregnet av meg fra §2.1 og §2.3. Kildetallene er sitert; prosentene er utledet.

**Menn:**

| Handicap | Snitt | Lavest (70s) | Høyest | Nedre avvik | Øvre avvik |
|---|---|---|---|---|---|
| 0.0-4.9 | 244 | 209 | 263 | −14,3 % | +7,8 % |
| 5.0-9.9 | 234 | 206 | 250 | −12,0 % | +6,8 % |
| 10.0-14.9 | 223 | 194 | 239 | −13,0 % | +7,2 % |
| 15.0-19.9 | 212 | 185 | 233 | −12,7 % | +9,9 % |
| 20.0-24.9 | 199 | 168 | 219 | −15,6 % | +10,1 % |
| 25.0-29.9 | 194 | 166 | 209 | −14,4 % | +7,7 % |
| 30+ | 181 | 155 | 197 | −14,4 % | +8,8 % |

**Kvinner:**

| Handicap | Snitt | Lavest | Høyest | Nedre avvik | Øvre avvik |
|---|---|---|---|---|---|
| 0.0-4.9 | 220 | 184 | 244 | −16,4 % | +10,9 % |
| 5.0-9.9 | 206 | 167 | 229 | −18,9 % | +11,2 % |
| 10.0-14.9 | 195 | 176 | 217 | −9,7 % | +11,3 % |
| 15.0-19.9 | 178 | 152 | 194 | −14,6 % | +9,0 % |
| 20.0-24.9 | 167 | 148 | 194 | −11,4 % | +16,2 % |
| 25.0-29.9 | 154 | 140 | 169 | −9,1 % | +9,7 % |
| 30+ | 145 | 127 | 168 | −12,4 % | +15,9 % |

**Dette er dokumentets reneste spredningsresultat.** For menn er utslaget
**−12 til −16 % / +7 til +10 %** i **sju av sju** handicapbånd. Så stabilt på
tvers av bånd at det ikke er tilfeldig: alder alene sprer et handicapsegment med
ca. **−14 % / +8 %** rundt segmentsnittet.

**Og det er asymmetrisk.** Halen går nedover, ikke oppover — 70-åringene trekker
lengre ned enn 20-åringene trekker opp. Et symmetrisk ±x % har feil form.

Kvinnetallene viser samme størrelsesorden, men er mer ujevne (−9 til −19 % / +9 til
+16 %). Færre alderskolonner og lavere n per celle.

### 5.4 Straffe/recovery som spredningsproxy

§2.11 gir en monoton, fint gradert kurve: andelen villfarne utslag går fra
**12,0 % ved scratch til 45,1 % ved hcp 30+** (Arccos). Det er ikke en
distansespredning, men det er den beste publiserte indikatoren på hvor mye
lateral spredning som skiller segmentene — den fjerdedobles over handicapspennet
mens fairwaytreffet bare faller 10 prosentpoeng.

### 5.5 Hva som IKKE finnes — uttømmende liste

| Det vi lette etter | Utfall |
|---|---|
| Standardavvik per kølle, noen metrikk, noen populasjon | **IKKE PUBLISERT.** Null forekomster i begge kildeområder. |
| Persentiler per kølle | **IKKE PUBLISERT.** Kun driver, kun mellom spillere (§5.2). |
| n per celle | **IKKE PUBLISERT.** Kun globalt n. A1 oppgir at tomme celler betyr lav n, men ikke terskelen. |
| Nedre hale i slagfordelingen | **IKKE PUBLISERT.** Trimmefraksjonen i P-Avg er ikke oppgitt. |
| Spredning for noen av de ni ønskede metrikkene | **IKKE PUBLISERT.** Metrikkene finnes ikke i det hele tatt. |
| Spredning for noen annen kølle enn driver og 3-wood | **IKKE PUBLISERT.** |
| Spredning for kvinner | **IKKE PUBLISERT.** |
| Slag-til-slag-spredning i rå form | **IKKE PUBLISERT.** Arccos har 68 %-ellipse og persentiler *i appen*; ikke publisert utenfor. |

Arccos' 68 %-ellipse er verdt å merke seg som mulig neste steg: den finnes, den er
per bruker, og den er nøyaktig det vi trenger — men den er ikke publisert.

---

## 6. RADER SOM IKKE OVERLEVDE KONTROLL, ELLER IKKE ER KONTROLLERT

### 6.1 Kontrollstatus

| Status | Antall rader | Hvilke |
|---|---|---|
| **Kontrollert, `confirmed`** | 5 | Arccos menn driver, handicapbåndene 0.0-4.9 / 5.0-9.9 / 10.0-14.9 / 15.0-19.9 / 20.0-24.9. Alle verdier verifisert mot faktiske sidebilder i A1, ingen avvik. |
| **Kontrollert, `partially-confirmed`** | 1 | S1 Troon driver P-Avg. Se §6.2. |
| **Ikke kontrollert** | 57 | Alle øvrige rader i §2-§5. |

**Dette er ikke det samme som at de 57 er feil** — de har hentbar URL og sitat, og
de fem kontrollerte radene kom alle tilbake `confirmed`, noe som taler for
transkripsjonskvaliteten. Men de er ikke etterprøvd, og skal ikke fremstilles som
om de er det.

### 6.2 S1 (Troon) — `partially-confirmed`, `segmentCorrect: false`

Tallene `285 / 261 / 259 / 236 / 225 / 204` er ekte og korrekt avlest fra siden.
**To kvalifikatorer i påstanden står ikke på siden:** kjønnsmerkingen «menn» er
lagt til av oss, ikke hentet fra kilden.

**Hentbarhet:** WebFetch gir **HTTP 403** (Troon blokkerer bot-UA), med og uten
avsluttende skråstrek. Siden må hentes med browser-UA. Publisert 2024-10-22.

**Konsekvens:** bruk tallene, men **ikke merk dem «menn»**. Vi vet ikke om
populasjonen er kjønnsblandet. Gitt at Shot Scopes brukerbase er overveiende
mannlig, er tallene sannsynligvis mannsdominerte — men det er en antakelse.

### 6.3 Rader merket ⚠ — ikke-monotone eller lite utvalg

| Rad | Problem | Dom |
|---|---|---|
| Wedge-tabellen PW/GW/SW/LW (M6) | Kraftig ikke-monoton: hcp 10 SW = 98 > hcp 5 SW = 86; hcp 20 SW = 85 > hcp 15 SW = 84; hcp 20 LW = 78 > hcp 15 LW = 75; hcp 25 SW = 80 > hcp 25 LW = 49 | **IKKE BRUK TIL BÅND.** Sitér som indikasjon. Sannsynlig små utvalg per celle. |
| 9-wood (M3), kun hcp 15 og 20 | Kilden oppgir selv mindre utvalg | **LAV KONFIDENS.** Kun to celler. |
| 5-jern hcp 10 = 187 > hcp 5 = 183 (M5) | Invertert | Del av et mønster, se under |
| 9-jern hcp 10 = 140 > hcp 5 = 139 (M5) | Invertert | Del av samme mønster |
| Driver hcp 10 = 259 vs hcp 5 = 261 (S1) | Nesten flat, 2 yd | Del av samme mønster |
| PW/GW/SW/LW hcp 10 > hcp 5 (M6) | Invertert i alle fire | Del av samme mønster |
| 3-hybrid hcp 15 snitt = 166 > 2-hybrid = 163 (M4) | Invertert innad i rad | **LAV KONFIDENS** |
| 3-wood hcp 14 P-Avg = 194 < hcp 20 P-Avg = 195 (S4) | Invertert | **LAV KONFIDENS** |

**⚠ Mønsteret, ikke enkeltcellene, er funnet.** Shot Scopes hcp 10-rad ligger
systematisk høyt mot hcp 5 i **sju** uavhengige køller (driver, 5-jern, 9-jern, PW,
GW, SW, LW). Det er ikke syv tilfeldige avrundingsutslag. Enten har hcp 10-bøtta en
annen populasjon enn nabobøttene, eller så er det en systematisk feil i
tabellgenereringen. **Anbefaling: ikke bruk Shot Scopes hcp 10-rad som ankerpunkt.**
Bruk hcp 5 og hcp 15 og interpoler, eller bruk Arccos' hcp 10.0-14.9 = 223 som er
kontrollert (§6.1) og kryssvalidert (§2.6).

### 6.4 Motstridende sett — begge sitert, ingen valgt

| Konflikt | Verdier | Dom |
|---|---|---|
| Driver P-Avg hcp 10 | 259 (S1) / 253 (M1) / ca. 235 (S4 interpolert) | **24 yd sprik, samme metrikk, samme plattform.** Ingen kan velges på grunnlag av kildene alene. |
| 3-wood P-Avg | `261/234/227/215/195/178` (M6) vs `256/239/225/212/196/179` (M3) | Opptil 5 yd. Ulik vintage. Bruk M3 (nyere), sitér begge. |
| Fairwaytreff-nivå | Arccos 50→40 % vs Shot Scope 48→47 % | Uforenlig form. Definisjonsforskjell antatt, **ikke verifisert**. |
| Straffeprosent | Arccos 4,4-11,9 % vs Shot Scope 1-3 % | 3-4× forskjell. Definisjonsforskjell antatt, **ikke verifisert**. |
| Snitt→P-Avg-gap | 6,6-7,6 % (S4) vs 11,0-12,1 % (M1) | Bruk hele spennet. |
| Arccos kvinner 2025 | 176,2 (tabell) vs 175,7 (trendgraf) | Intern i A1. 0,5 yd. Ikke avklart. |
| «Typisk golfer» driversnitt = 204 (S8) | Identisk med hcp 25 P-Avg = 204 (S1) | Mistenkelig sammenfall mellom to ulike metrikker. Begge sitert, ingen brukt som anker. |

### 6.5 Utelatt

| Påstand | Dom | Begrunnelse |
|---|---|---|
| Shot Scope Annual Report 2026, primær-PDF | **IKKE HENTET** | Skjemalåst bak e-postregistrering. Utvalgstallene (74 mill. slag osv.) er sitert via M1, altså andrehånds. |
| Enhver amatørdistanse brukt som `carry` | **AVVIST** | Alle er total. Se §8.1. |
| Enhver amatørrad brukt som «bånd» uten §5 | **AVVIST** | Samme regel som `REALISME.md` §2: et snitt kan ikke bli et bånd. |
| Trackman «Driver Fitting Chart CARRY Optimizer» | **FORTSATT UTELATT** | Preskriptiv. Allerede avvist i `REALISME.md` §2. Ingen ny grunn til å ta den inn. |
| Aldersspennet i §5.3 brukt som slag-til-slag-sigma | **AVVIST** | Det er spredning mellom alderskohortenes *snitt*, ikke mellom slag. |

---

## 7. PRESKRIPTIVE OG FILTRERTE TALL — HOLDES UTENFOR BÅND

Fallgruven oppdraget advarte mot er reell i dette materialet, men den har **to
former**, ikke én. Begge må holdes utenfor båndene, av forskjellige grunner.

### 7.1 Tier A — ekte preskriptivt (hva man BØR gjøre)

| Tall | Kilde | Hvorfor utenfor |
|---|---|---|
| «Ideell smash factor med driver er ca. 1,50» · «100 mph køllefart gir 150 mph ballfart» | `https://shotscope.com/blog/practice-green/stats-and-data/5-key-launch-monitor-stats-every-golfer-should-track/` | Generisk anbefaling, ikke måling. Ingen amatørpopulasjon bak. Ville flatert amatørbåndet oppover mot tourverdien 1,49. |
| Trackman «Driver Fitting Chart CARRY Optimizer» (75-95 mph) | *URL ikke gjenfunnet* | Allerede avvist i `REALISME.md` §2, på to grunnlag: manglende URL og preskriptiv natur. Nevnes her så den ikke sniker seg inn bakveien. |

**Dette er det eneste stedet i hele amatørmaterialet der en av de ni metrikkene
opptrer — og det er preskriptivt.** Shot Scope publiserer smash factor 1,50 som
mål, ikke som måling. Det er ubrukelig for oss, og det er verdt å si høyt: at et
tall finnes betyr ikke at det er data.

### 7.2 Tier B — deskriptivt, men filtrert (velltruffet slag, ikke populasjonssnitt)

Dette er den **farligere** kategorien, fordi tallene *ser* deskriptive ut.

| Metrikk | Definisjon | Målt inflasjon over usortert snitt |
|---|---|---|
| Shot Scope **P-Avg** | Alle uteliggere fjernet, begge ender. Ekskluderer posisjonsslag og slag < 50 yd fra flagget. Trimmefraksjon ikke oppgitt. | **+6,6 til +12,1 %** (driver) · **+12,2 til +25,4 %** (hybrider) |
| Arccos **Smart Distance** | Velltruffede slag, mishits fjernet, **og værnormalisert** | **+8,9 %** (alder 20-årene: 258 mot 237) · **+6,1 %** (alder 40-årene: 244 mot 230) |

`https://support.shotscope.com/hc/en-us/articles/360000810145-What-is-the-P-AVG-Performance-Average-Distance` ·
`https://www.arccosgolf.com/blogs/community/what-happens-to-your-game-as-you-age`

Arccos Smart Distance-tallene, for referanse (ikke til bruk som segmentsnitt):
driver 21-30 år = 258 yd, 41-50 år = 244 yd, 60+ ligger 43 yd under 21-30.
7-jern 21-30 = 164, 11-20 = 152, 51-60 = 151, 60+ = 140; ca. 4 yd tap per tiår.
*(Merk bracketavvik: Smart Distance-artikkelen bruker 21-30, A1 bruker «20s» = 20-29.)*

**Regelen som følger av dette:** filtreringsvalget flytter tallet **6-25 %**. Det er
mer enn hele det foreslåtte toleransebudsjettet. Å velge feil metrikkdefinisjon er
nøyaktig samme feilklasse som å velge feil tabellutgave i `REALISME.md` §3.1(e) —
og her er utslaget større.

### 7.3 Tier C — deskriptivt og usortert. Disse, og bare disse, brukes som senter

| Kilde | Metrikk |
|---|---|
| A1, alle tabeller | Snitt av **alle** driverutslag i verifiserte runder. Ikke normalisert for vær, høyde eller underlag. |
| M1, «Average Drive»-kolonnen | Alle slag, gode og dårlige. |
| S4, «AVG»-kolonnen | Alle slag. |
| S8, «average distance» = 204 yd | Alle slag. |

Alt annet i §2.7 og §2.8 er Tier B (P-Avg) og må merkes som sådan der det brukes.

---

## 8. FORESLÅTTE TOLERANSEBÅND FOR AMATØRSEGMENTET

### 8.1 Blokkeringen som må løses før bånd betyr noe: enheten

Tourbåndene gater `carry`. **Hvert eneste amatørtall i dette dokumentet er `total`.**
Ingen kilde publiserer en carry/utrull-splitt for amatører — hverken Arccos
(GPS-punkt til GPS-punkt) eller Shot Scope (samme).

Det finnes **ingen publisert konverteringsfaktor**, og det finnes ingen *i prinsippet*
heller: utrull avhenger av landingsvinkel, underlag, fuktighet og helning, og A1 sier
eksplisitt at datasettet **ikke** er normalisert for noe av dette.

**Regel: amatørtallene skal inn i et `totalDistance`-felt. `carry` står tomt for
amatørsegmentet.** Å anslå en konverteringsfaktor ville vært nøyaktig den fiksjonen
absoluttregelen forbyr, og den ville vært større enn hele toleransebudsjettet.

Dette er ikke et toleransespørsmål. Det er et enhetsspørsmål, og det er alvorligere.

### 8.2 Tre grunner til at amatørbåndet må være bredere enn tourbåndet

Alle tre er målt, ikke antatt.

**(a) Miljøvariansen er ikke normalisert bort — og den alene sprenger ±5 %.**
Samme 10-handicapper: **220,5 yd ved havnivå mot 239,7 yd på 5000+ fot = 19,2 yd,
8,3 %** (A1 s. 16). Én enkelt miljøvariabel flytter segmentet mer enn hele
carry-porten. Tourtabellene er samlet under kontrollerte turneringsforhold; disse
er ikke.

**(b) Metrikkdefinisjonen flytter tallet 6-25 %** (§7.2). Større enn budsjettet.

**(c) Fordelingen er skjev, ikke symmetrisk.** Beste slag ligger **+15,0 til
+20,9 %** over snittet (§5.1); aldersspredningen innen et handicapbånd går
**−14 % / +8 %** (§5.3). Halen går nedover for populasjonen og oppover for
enkeltslaget. Et symmetrisk `±x %` har feil form uansett hvilken x man velger.

### 8.3 Foreslått båndsett

| Metrikk | Tourbånd (D32 / `REALISME.md` §3.2) | **Amatørbånd** | Grunnlag |
|---|---|---|---|
| `totalDistance`, driver — **segmentsnitt** | *(finnes ikke i tour)* | **±5 % for hcp ≥ 10**<br>**±8 % for hcp 0-9** | Kryssvalidering Arccos↔Shot Scope (§2.6): 0,5-2,2 % for hcp 10-25, men 3,4-7,0 % for hcp 0-5. Båndet kan ikke settes strammere enn kildenes innbyrdes uenighet. |
| `totalDistance`, driver — **enkeltslag** | — | **usymmetrisk: nedre grense UDEFINERBAR, øvre +21 %** | §5.1. Snitt→lengste = +15,0 til +20,9 %. Nedre hale ikke publiserbar (§5.1 pkt. 3). |
| `totalDistance`, driver — **mellom spillere i samme hcp-bånd** | — | **−14 % / +8 %** | §5.3, replikert i 7 av 7 handicapbånd. |
| `totalDistance`, øvrige køller | — | **KAN IKKE SETTES** | Ingen spredning publisert for noen annen kølle enn driver og 3-wood. Kun punktestimater. |
| `carry` | **±5 %** | **KAN IKKE SETTES — enhetsblokkert** | §8.1. Null amatør-carry publisert. |
| `launchAngle` | **±0,5°** | **KAN IKKE SETTES** | Null data. |
| `spinRate` | **±8 %** *(udokumentert)* | **KAN IKKE SETTES** | Null data. |
| `apex` | **±5 %** | **KAN IKKE SETTES** | Null data. |
| `landAngle` | **±1,0°** | **KAN IKKE SETTES** | Null data. |
| `ballSpeed` | **±1,0 %** | **KAN IKKE SETTES** | Null data. |
| `smashFactor` | **±0,02** | **±0,02, kun driver, kun mot Combine-snittet** | 9 tall fra forrige runde (`REALISME.md` §1.5). Ingen spredning publisert — samme forbehold som tour. |
| `clubSpeed`, `attackAngle` | *ikke porter (inndata)* | *ikke porter* | Uendret. |

### 8.4 Hvordan amatørbåndet skiller seg fra tourbåndet — fire strukturelle forskjeller

1. **Ulikt formål.** Tourbåndene er *reproduksjonsporter*: traff motoren et publisert
   snitt? Amatørbåndene må være *plausibilitetsbånd*: ville en ekte spiller i dette
   segmentet slått dette? Første spørsmål har en fasit. Det andre har en fordeling.
2. **Ulik bredde, og bredden er målt.** Tourens carry-port er ±5 %. Amatørens
   segmentsnitt tåler ikke strammere enn ±5 % (hcp ≥ 10) / ±8 % (hcp 0-9), og
   *enkeltslag*-båndet er **3-4× bredere** enn tourbåndet.
3. **Ulik form.** Tourbåndene er symmetriske. Amatørfordelingen er skjev i begge
   retninger avhengig av hvilken spredning man ser på (§8.2c). Symmetriske bånd er
   feil verktøy.
4. **Motsatt vintage-regel.** `REALISME.md` §3.1(e): tourtabellens utgave **må**
   låses, ellers spises hele budsjettet. For amatørtallene er det motsatt — åtte
   års tidsserie viser under 1,5 % drift (§4.2). **Utgavelåsing er ikke nødvendig
   for amatørsegmentet.** Det er den ene tingen som er *enklere* her.

### 8.5 Fire regler som må følge amatørbåndene

1. **Hver amatørverdi må bære tre etiketter: metrikkdefinisjon (Tier A/B/C, §7),
   måltype (`total`, aldri `carry`), og kilde+vintage.** Uten alle tre er tallet
   ikke etterprøvbart, og de tre kildesettene for hcp 10 (§6.4) beviser hvorfor.
2. **Aldri sammenlign på tvers av metrikkdefinisjon.** Arccos-snitt mot Shot Scope
   P-Avg gir 36 yd sprik og feil konklusjon (§2.6).
3. **Aldri bruk mellom-spiller-spredning som slag-til-slag-spredning.** Samme felle
   som `REALISME.md` §1.6.
4. **Bånd gjelder per metrikk, per kølle, per segment.** Aldri aggregert. Uendret
   fra tour.

---

## 9. ÆRLIG SLUTTVURDERING

### 9.1 Hvor mange tall er sitert

**613 tall plassert i tabeller i dette dokumentet**, alle med hentbar URL.
Fordelingen, så den kan etterprøves:

| Blokk | Antall |
|---|---|
| Arccos menn, distansematrise 7×7 + snittkolonne | 56 |
| Arccos menn, treffsikkerhetsmatrise 7×7 + snittkolonne | 56 |
| Arccos menn, marginal per alder + aggregat | 15 |
| Arccos kvinner, distansematrise 7×5 + snittkolonne | 42 |
| Arccos kvinner, treffsikkerhetsmatrise 7×5 + snittkolonne | 42 |
| Arccos kvinner, marginal per alder + aggregat | 11 |
| Arccos straffe/recovery/totalt | 21 |
| Arccos tidsserier (menn 8, kvinner 8, 40-49 4×8) | 48 |
| Arccos høyde over havet | 4 |
| Arccos per kølle (5i/7i/PW, tror + faktisk) | 16 |
| Arccos øvrig (2020-vintage, innspill kort, Smart Distance ×2, 50 % GIR, nærhet ×2, hcp 10-2023, 2017-2019) | 44 |
| **Arccos totalt** | **355** |
| Shot Scope driver, alle metrikkdefinisjoner og segmenter | 42 |
| Shot Scope retningsspredning | 24 |
| Shot Scope fairwaywooder (3W/5W/7W/9W, to sett) | 26 |
| Shot Scope hybrider (snitt + P-Avg) | 32 |
| Shot Scope jern 4-9 | 36 |
| Shot Scope wedger PW/GW/SW/LW | 24 |
| Shot Scope avg/P-Avg/longest-tripler | 18 |
| Shot Scope øvrig (Troon 7-jern, nærhet, ruff, Law of Averages, kvinner relativt, n) | 56 |
| **Shot Scope totalt** | **258** |
| **SUM** | **613** |

Fem av dem (scoretabellen, §3.1) er relabelling av handicaptall og ikke nye data.
**Unike tall: 608.**

Fra 9 til 613 er en reell forbedring på volum. **Men null av dem er en av de ni
ønskede metrikkene.** Volumet ligger i en tiende metrikk som ikke sto på lista.

### 9.2 Hva som mangler helt

**Metrikker — 8 av 9 har null amatørdekning:**
`clubSpeed` · `attackAngle` · `ballSpeed` · `launchAngle` · `spinRate` · `apex` ·
`landAngle` · `carry`. Kun `smashFactor` har dekning, og bare 9 tall, bare driver,
bare som snitt uten spredning.

**Køller:**

| Kølle | Amatørdekning (totaldistanse) |
|---|---|
| **3-jern** | **HELT FRAVÆRENDE.** Shot Scopes jerntabell starter på 4-jern. Arccos har ingen. |
| 9-wood | Kun hcp 15 og 20, kildeoppgitt lite utvalg |
| Hybrider | Mangler hcp 10 og hcp 20 |
| GW / SW / LW | Finnes, men ikke-monotone — ikke brukbare til bånd (§6.3) |
| Driver, 3W, 5W, 7W, 4-9 jern, PW | Dekket, alle seks handicaptrinn |

**Segmenter:**

| Segment | Status |
|---|---|
| Handicap × kølle, menn | **God.** 19 køller (hybrider kun 4 handicaptrinn). |
| Handicap × alder, driver, begge kjønn | **Komplett.** Arccos 7×7 og 7×5. |
| **Score × alle køller unntatt driver** | **HELT FRAVÆRENDE**, og driverraden er relabelling (§3.2). |
| **Kvinner × alle køller unntatt driver** | **HELT FRAVÆRENDE.** Kun relative utsagn (§4.3). |
| **Køllehastighet (70/80/90/100 mph)** | **HELT FRAVÆRENDE.** Oppdraget nevner det eksplisitt som segmenteringsakse. Ingen av de to mottatte kildeområdene måler køllehastighet i det hele tatt, så aksen kan ikke eksistere hos dem. Eneste kjente kilde som segmenterer slik er Trackmans CARRY Optimizer — som er preskriptiv og avvist. |
| Spredning for annet enn driver/3-wood | **HELT FRAVÆRENDE.** |
| Spredning for kvinner | **HELT FRAVÆRENDE.** |

**Kildeområder:** 2 av 8 mottatt (§0.1). 6 områder mangler fra datasettet som nådde
meg. **Kontrollposter: 6 av 63 rader.**

### 9.3 Kan brukerkravet etterprøves for målgruppen nå?

**Delvis — og delen som er løst er ikke den delen kravet handler om.**

**JA, for én ting:** motoren kan nå etterprøves mot **totaldistanse per handicap for
driver**. Det tallet er kryssvalidert mellom to uavhengige plattformer innenfor
0,5-2,2 % for hcp 10-25 (§2.6), det har ekte spredning fra tre uavhengige
konstruksjoner (§5), og det er tidsstabilt over åtte år (§4.2). Det er det best
underbygde amatørtallet i prosjektet, og det er nok til å svare på spørsmålet
«slår motorens 15-handicapper omtrent så langt som en ekte 15-handicapper?».

**NEI, for de ni metrikkene kravet faktisk handler om.** Flight Glass viser
ballflukt: launch, spinn, apex, landingsvinkel, carry. **Ingen av dem har
amatørreferanse.** En 15-handicapper i appen kan ikke få verifisert at hans
spinnrate, launch-vinkel eller apex ligner på virkeligheten — det finnes ingen
virkelighet å sammenligne med, publisert.

**NEI, på enhetsnivå.** Selv distansetallet kan ikke gates mot `carry`, som er det
feltet motoren produserer (§8.1). Amatørtallene og motorens utdata måler ikke det
samme.

**Og et fjerde svar som er verdt mer enn de tre andre:** §2.9 viser at kravets
ordlyd — «oppleves reelle» — ikke er det samme som «er korrekte». Amatøren tror han
slår 7-jernet 17-22 yards lenger enn han gjør, og 40 % av innspillene hans lander
kort. **Et teknisk perfekt tall vil oppleves for kort av målgruppen.** Det er en
produktbeslutning, ikke en fysikkbeslutning, og den er nå datastøttet.

### 9.4 Anbefalte neste steg

1. **Legg inn det som faktisk finnes.** Driver totaldistanse per handicap, som
   `totalDistance` med Tier C-merking, gated på ±5 % / ±8 % (§8.3). Ikke som `carry`.
2. **Skriv `carry` som eksplisitt tom for amatørsegmentet**, med begrunnelsen fra
   §8.1 i testfila. Et tomt felt med grunn er sterkere enn et fylt felt uten.
3. **Hent de 6 manglende kildeområdene.** De kan inneholde launchdata som disse to
   ikke har. Dette er den eneste veien som kan lukke metrikkgapet.
4. **Ikke let mer hos GPS-plattformene.** Arccos og Shot Scope *kan ikke* måle
   launch monitor-data — grepsensor og GPS gir start- og sluttpunkt. Dette er
   avklart, ikke uavklart. Videre søk der er bortkastet.
5. **Vurder egne målinger.** `REALISME.md` §5 konkluderte allerede med dette for
   tour; det gjelder dobbelt her. Amatørbånd for de åtte metrikkene finnes ikke
   publisert og kommer sannsynligvis ikke til å bli det.
6. **Løft persepsjonsgapet (§2.9) til `DECISIONS.md`.** Det er det eneste funnet i
   dokumentet som treffer kravets ordlyd direkte, og det er en produktbeslutning
   som ikke bør ligge begravd i en datafil.

---

## 10. Sjekkliste

- [x] Handicapsegmenter og scoresegmenter i separate seksjoner (§2, §3)
- [x] Én rad per kølle der data finnes, med kilde-URL (§2.7, §2.8)
- [x] Rader som ikke overlevde kontroll eksplisitt merket (§6)
- [x] Preskriptive tall skilt ut og holdt utenfor bånd (§7)
- [x] Spredning dokumentert i alle former som finnes (§5)
- [x] Toleransebånd foreslått og kontrastert mot tourbåndene (§8)
- [x] Ærlig sluttvurdering med tellinger og hull (§9)
- [ ] ⚠ 6 av 8 kildeområder mangler fra datasettet som nådde meg (§0.1)
- [ ] ⚠ 57 av 63 rader er ikke kontrollert (§6.1)
- [ ] ⚠ 8 av 9 ønskede metrikker har fortsatt null amatørdekning (§0)
- [ ] ⚠ `carry` er enhetsblokkert for hele amatørsegmentet (§8.1)
