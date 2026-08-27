# REALISME — publiserte referansebånd per køllekategori

**Formål.** Gjøre brukerkravet etterprøvbart: *«tallene skal oppleves reelle for det de
opplever ute når de spiller.»*

**Status:** 2026-08-25. Alle kilde-URL-er i dette dokumentet ble hentet og HTTP-verifisert
(200 OK) samme dag. Alle tabellrader er lest av meg direkte fra kilden — bildetabellene som
bilde, PDF-ene som tekst.

## Absolutt regel som er fulgt

Ingen tall i dette dokumentet er skrevet fra hukommelse. Hver rad har en hentbar URL.
Der noe ikke er publisert, står det **IKKE PUBLISERT** — det er et gyldig funn, ikke en
mangel som skal fylles med gjetning.

**Det viktigste enkeltfunnet er negativt:** det finnes ingen publisert kilde med de ni
metrikkene segmentert på handicap. Amatørbåndene — som oppdraget kaller de viktigste —
kan ikke bygges av publiserte data i dag. Se §1.5 og §5.

---

## 0. Kilderegister

| # | Kilde | URL | Type | Status |
|---|---|---|---|---|
| K1 | Trackman PGA Tour Averages 2023 | `https://a.storyblok.com/f/117513/1920x883/6aefae601d/pga_tour-averages_trackman_blog.jpg` | JPEG-tabell | 200, 743 886 B |
| K2 | Trackman LPGA Tour Averages 2023 | `https://a.storyblok.com/f/117513/1920x883/9617e89ecd/lpga_tour-averages_trackman_blog.jpg` | JPEG-tabell | 200, 699 552 B |
| K3 | Trackman: artikkelen som rammer inn K1/K2 | `https://www.trackman.com/blog/introducing-updated-tour-averages` | HTML | 200, publ. 2024-05-02 |
| K4 | Trackman PGA Averages (eldre utgave) | `https://teeituprva.com/wp-content/uploads/2019/03/PGA-AVERAGES-INTERACTIVE.pdf` | PDF | 200, 280 286 B |
| K5 | Trackman LPGA Averages (eldre utgave) | `https://teeituprva.com/wp-content/uploads/2019/03/LPGA-AVERAGES-INTERACTIVE.pdf` | PDF | 200, 280 781 B |
| K6 | PGA driver — club speed-fordeling | `https://support.trackmangolf.com/hc/article_attachments/7349792425115` | JPEG-graf | 200, 313 412 B |
| K7 | PGA driver — ball speed-fordeling | `https://support.trackmangolf.com/hc/article_attachments/7349744237851` | JPEG-graf | 200, 330 261 B |
| K8 | PGA driver — carry-fordeling | `https://support.trackmangolf.com/hc/article_attachments/7349792315035` | JPEG-graf | 200, 341 945 B |
| K9 | Trackman Smash Factor (Combine-snitt per handicap) | `https://www.trackman.com/blog/smash-factor` | HTML | 200 |
| K10 | Trackman: spinn-artikkel (uavhengig tekstkilde for 7124) | `https://www.trackman.com/blog/3-steps-to-improve-your-spin-rate-in-golf` | HTML | 200 |
| K11 | golf.com — gjengir eldre Trackman-tabell | `https://golf.com/instruction/driving/this-is-how-far-pga-and-lpga-tour-players-hit-it-with-every-club/` | HTML | 200 |

### Metode bak K1/K2 (bekreftet i K3)

- Menn: 40+ turneringer, 200+ spillere. Kvinner: 30+ turneringer, 150+ spillere.
- «Averages are based on data from competition as well as on the range.»
- Filtrering fjerner ikke-driver-slag i konkurranse; under 0,5 % kan gjenstå.
- Offisielle stat-hull velges i motsatte retninger for å dempe vindeffekt.
- **K3 publiserer ingen spredning:** intet standardavvik, ingen persentiler, ingen n per kølle.

### To viktige forbehold om kildetypen

1. **Kolonnen heter «Max Height», ikke «apex».** Samme størrelse, annet navn. Mappingen må
   være eksplisitt i testfila.
2. **K1/K2 er grafikk uten maskinlesbar tekst.** WebFetch returnerer binærsøppel på dem.
   De må lastes ned og leses som *bilde*. En etterprøver som bruker ren tekst-fetch vil
   feilaktig konkludere at kilden er uverifiserbar. Radene under er derfor **transkripsjoner**,
   ikke ordrette sitater — verdiene er eksakte, men pipe-formatet er vårt.

---

## 1. Tabeller per populasjon

### 1.1 PGA Tour — Trackman 2023 (ANBEFALT REFERANSE)

Kilde for alle rader: **K1**. Lest av meg direkte fra bildet. Overskrift i kilden:
`PGA TOUR AVERAGES YARDS/METERS`, årstall `2023`.

| Kølle | clubSpeed | attackAngle | ballSpeed | smash | launch | spin | apex | landAngle | carry |
|---|---|---|---|---|---|---|---|---|---|
| Driver | 115 | −0,9° | 171 | 1,49 | 10,4° | 2545 | 35 | 39° | 282 |
| 3-wood | 110 | −2,3° | 162 | 1,47 | 9,3° | 3663 | 32 | 44° | 249 |
| 5-wood | 106 | −2,5° | 156 | 1,47 | 9,7° | 4322 | 33 | 48° | 236 |
| Hybrid | 102 | −2,4° | 149 | 1,47 | 10,2° | 4587 | 31 | 49° | 231 |
| 3 Iron | 100 | −2,5° | 145 | 1,46 | 10,3° | 4404 | 30 | 48° | 218 |
| 4 Iron | 98 | −2,9° | 140 | 1,44 | 10,8° | 4782 | 31 | 49° | 209 |
| 5 Iron | 96 | −3,4° | 135 | 1,41 | 11,9° | 5280 | 33 | 50° | 199 |
| 6 Iron | 94 | −3,7° | 130 | 1,39 | 14,0° | 6204 | 32 | 50° | 188 |
| 7 Iron | 92 | −3,9° | 123 | 1,34 | 16,1° | 7124 | 34 | 51° | 176 |
| 8 Iron | 89 | −4,2° | 118 | 1,33 | 17,8° | 8078 | 33 | 51° | 164 |
| 9 Iron | 87 | −4,3° | 112 | 1,29 | 20,0° | 8793 | 32 | 52° | 152 |
| PW | 84 | −4,7° | 104 | 1,24 | 23,7° | 9316 | 32 | 52° | 142 |

Enheter: clubSpeed/ballSpeed mph · vinkler grader · spin rpm · apex og carry **yards**.
Kilden viser apex og carry som `yards/meters` (f.eks. `282/258`); meterverdien er utelatt her.

**Radetiketten er «Hybrid» — ikke «Hybrid 15-18°».** Loftangivelsen tilhører den eldre
tabellen (§1.2) og er ikke dekket av K1. Ikke lås 2023-hybridraden til en loftspesifikasjon
kilden ikke oppgir; 17° og 21° hybrid er materielt ulike køller.

### 1.2 PGA Tour — Trackman eldre utgave (KUN REFERANSE — IKKE BLAND MED 1.1)

Kilde: **K4**, yards-siden. Uavhengig bekreftet av **K11** (golf.com gjengir 113 / −1,3° /
167 / 10,9° for driver).

| Kølle | clubSpeed | attackAngle | ballSpeed | smash | launch | spin | apex | landAngle | carry |
|---|---|---|---|---|---|---|---|---|---|
| Driver | 113 | −1,3° | 167 | 1,48 | 10,9° | 2686 | 32 | 38° | 275 |
| 3-wood | 107 | −2,9° | 158 | 1,48 | 9,2° | 3655 | 30 | 43° | 243 |
| 5-wood | 103 | −3,3° | 152 | 1,47 | 9,4° | 4350 | 31 | 47° | 230 |
| Hybrid 15-18° | 100 | −3,5° | 146 | 1,46 | 10,2° | 4437 | 29 | 47° | 225 |
| 3 Iron | 98 | −3,1° | 142 | 1,45 | 10,4° | 4630 | 27 | 46° | 212 |
| 4 Iron | 96 | −3,4° | 137 | 1,43 | 11,0° | 4836 | 28 | 48° | 203 |
| 5 Iron | 94 | −3,7° | 132 | 1,41 | 12,1° | 5361 | 31 | 49° | 194 |
| 6 Iron | 92 | −4,1° | 127 | 1,38 | 14,1° | 6231 | 30 | 50° | 183 |
| 7 Iron | 90 | −4,3° | 120 | 1,33 | 16,3° | 7097 | 32 | 50° | 172 |
| 8 Iron | 87 | −4,5° | 115 | 1,32 | 18,1° | 7998 | 31 | 50° | 160 |
| 9 Iron | 85 | −4,7° | 109 | 1,28 | 20,4° | 8647 | 30 | 51° | 148 |
| PW | 83 | −5,0° | 102 | 1,23 | 24,2° | 9304 | 29 | 52° | 136 |

I denne utgaven heter raden faktisk `Hybrid 15-18°`.

### 1.3 LPGA Tour — Trackman 2023

Kilde: **K2**, lest direkte fra bildet. Overskrift: `LPGA TOUR AVERAGES YARDS/METERS`, `2023`.

| Kølle | clubSpeed | attackAngle | ballSpeed | smash | launch | spin | apex | landAngle | carry |
|---|---|---|---|---|---|---|---|---|---|
| Driver | 96 | **+2,8°** | 143 | 1,49 | 12,6° | 2506 | 26 | 36° | 223 |
| 3-wood | 92 | −0,8° | 135 | 1,47 | 11,6° | 2595 | 25 | 38° | 200 |
| 5-wood | 90 | −1,6° | 130 | 1,46 | 12,3° | 4320 | 25 | 43° | 189 |
| Hybrid | 87 | −1,9° | 125 | 1,44 | 13,9° | 4504 | 25 | 45° | 178 |
| 4 Iron | 82 | −1,7° | 118 | 1,43 | 13,9° | 4608 | 25 | 43° | 175 |
| 5 Iron | 81 | −2,0° | 114 | 1,42 | 14,6° | 4966 | 25 | 45° | 166 |
| 6 Iron | 80 | −2,3° | 111 | 1,41 | 16,7° | 5904 | 25 | 46° | 155 |
| 7 Iron | 78 | −2,5° | 106 | 1,38 | 18,5° | 6630 | 26 | 47° | 143 |
| 8 Iron | 76 | −2,8° | 102 | 1,36 | 20,8° | 7413 | 27 | 47° | 133 |
| 9 Iron | 74 | −3,2° | 95 | 1,30 | 23,5° | 7605 | 27 | 48° | 123 |
| PW | 72 | −3,2° | 88 | 1,25 | 25,2° | 8465 | 27 | 48° | 111 |

**Ingen 3 Iron i LPGA 2023.** Driverens attack angle er den eneste positive i hele
materialet (+2,8°) — det er et reelt trekk, ikke en fortegnsfeil.

### 1.4 LPGA Tour — eldre utgave (KUN REFERANSE)

Kilde: **K5**, yards-siden.

| Kølle | clubSpeed | attackAngle | ballSpeed | smash | launch | spin | apex | landAngle | carry |
|---|---|---|---|---|---|---|---|---|---|
| Driver | 94 | **+3,0°** | 140 | 1,48 | 13,2° | 2611 | 25 | 37° | 218 |
| 3-wood | 90 | −0,9° | 132 | 1,48 | 11,2° | 2704 | 23 | 39° | 195 |
| 5-wood | 88 | −1,8° | 128 | 1,47 | 12,1° | 4501 | 26 | 43° | 185 |
| 7-wood | 85 | −3,0° | 123 | 1,46 | 12,7° | 4693 | 25 | 46° | 174 |
| 4 Iron | 80 | −1,7° | 116 | 1,45 | 14,3° | 4801 | 24 | 43° | 169 |
| 5 Iron | 79 | −1,9° | 112 | 1,43 | 14,8° | 5081 | 23 | 45° | 161 |
| 6 Iron | 78 | −2,3° | 109 | 1,41 | 17,1° | 5943 | 25 | 46° | 152 |
| 7 Iron | 76 | −2,3° | 104 | 1,38 | 19,0° | 6699 | 26 | 47° | 141 |
| 8 Iron | 74 | −3,1° | 100 | 1,33 | 20,8° | 7494 | 25 | 47° | 130 |
| 9 Iron | 72 | −3,1° | 93 | 1,32 | 23,9° | 7589 | 26 | 47° | 119 |
| PW | 70 | −2,8° | 86 | 1,28 | 25,7° | 8403 | 23 | 48° | 107 |

Denne utgaven har **7-wood** og ingen hybrid — 2023-utgaven har hybrid og ingen 7-wood.
Køllesettet er altså ikke identisk mellom utgavene.

### 1.5 AMATØR — det som faktisk er publisert

Dette er oppdragets viktigste målgruppe, og her er funnet nesten utelukkende negativt.

**Publisert og hentbart (K9):** Trackman Combine-snitt, **kun smashFactor, kun driver.**

| Populasjon | Segment | smashFactor |
|---|---|---|
| Mannlig amatør | Scratch eller bedre | 1,49 |
| Mannlig amatør | 5 HCP | 1,45 |
| Mannlig amatør | 10 HCP | 1,45 |
| Mannlig amatør | **Gjennomsnittsgolfer (14,5)** | **1,44** |
| Mannlig amatør | Bogeygolfer | 1,43 |
| Kvinnelig amatør | Scratch eller bedre | 1,46 |
| Kvinnelig amatør | 5 HCP | 1,45 |
| Kvinnelig amatør | 10 HCP | 1,44 |
| Kvinnelig amatør | 15 HCP | 1,41 |

Samme side oppgir tour-referanse: PGA driver 1,49 / 6-jern 1,39; LPGA driver 1,49 / 6-jern 1,41.

**Dette er ni tall — og det er alt.** Segmentet «14,5 handicap» treffer oppdragets 15-handicapper
nøyaktig, men dekker **én av ni metrikker for én av tretten køller**.

**IKKE PUBLISERT — bekreftede blindveier:**

| Det vi lette etter | Utfall |
|---|---|
| Trackman amatørtall per handicap, ni metrikker | Finnes ikke. `trackman.com/blog/6-trackman-numbers-all-amateur-golfers-should-know` ble hentet: **null numeriske benchmarks**, kun konseptuell tekst, henviser til lokal coach. |
| Trackman blogg-indeks | Ingen amatør-tabellartikkel. Tour-averages-artikkelen står ikke lenger i indeksen. |
| clubSpeed per handicap | Ikke funnet publisert. `trackman.com/blog/club-speed` gir **404**. |
| Shot Scope per handicap, ni metrikker | Shot Scope publiserer **distanse**, ikke launch/spinn. Blogg-indeks gir ingen handicap-segmentert launch monitor-tabell. |
| Arccos / Golf Datatech / MyGolfSpy amatørmålinger | Ikke etablert med hentbar URL i denne økten. |
| LPGA per handicap | Finnes ikke. |
| Spredning per kølle (SD/persentiler) for noen populasjon | Finnes ikke, verken tour eller amatør. Kun driver, tre metrikker (§1.6). |

> **Konsekvens:** amatørbåndene kan ikke publiseres nå. Å konstruere dem ved å skalere
> tour-tall ned ville være nøyaktig den fiksjonen oppdraget forbyr — og verst der det betyr
> mest. Se §5 for hva som faktisk må gjøres.

### 1.6 PGA Tour driver — den ENESTE publiserte spredningen

Kilder: **K6**, **K7**, **K8**. Lest direkte fra grafikkene.

| Metrikk | Lavest | Snitt | Høyest | Spenn i % av snitt |
|---|---|---|---|---|
| clubSpeed | 104,3 mph | 114,3 mph | 132,5 mph | −8,7 % / +15,9 % |
| ballSpeed | 153,8 mph | 170,8 mph | 190,4 mph | −10,0 % / +11,5 % |
| carry | 252,2 yd | 280,3 yd | 319,6 yd | −10,0 % / +14,0 % |

**Avgjørende forbehold, trykt i grafikkene selv:**
`YTD, May 2021. Each player is represented with his avg. number.`

Dette er spredning **mellom spillere**, der hver spiller er redusert til sitt eget snitt.
Det er **ikke** slag-til-slag-spredning. Det sier hvor bredt tourfeltet er, ikke hvor mye
én spillers slag varierer. Forskjellen er kritisk for §3.

Merk også: snittene her (114,3 mph / 280,3 yd, mai 2021) tilhører verken 2023-tabellen
(115 / 282) eller den eldre (113 / 275). Det er en **tredje** datavintage.

---

## 2. Rader som ikke overlevde kildekontroll

| Påstand | Dom | Begrunnelse |
|---|---|---|
| `Hybrid 15-18°` som etikett på **2023**-raden | **AVVIST** | Kilden K1 skriver bare `Hybrid`. Loftintervallet er dratt inn fra den eldre tabellen. Rettet i §1.1; beholdt i §1.2 der det faktisk står. |
| «Trackman 2023 er *gjeldende*» | **AVVIST** | Ikke verifiserbart. `support.trackmangolf.com` gir HTTP 403. K3 (mai 2024) nevner ingen nyere revisjon, men fravær av bevis er ikke bevis. Skriv «2023-utgaven», aldri «gjeldende». |
| Alle `sourceQuote`-felt merket som *ordrett sitat* | **NEDGRADERT** | K1/K2 er bitmap-tabeller uten tekststrenger. Pipe-formatet er vårt. Verdiene er eksakte; merkingen var feil. Kall det **transkripsjon**. |
| Enhver tourrad brukt som «bånd» | **AVVIST** | Alle tabellene er punktestimater uten spredning. Et snitt kan ikke bli et bånd. Å legge ±x % rundt 282 yd er å finne opp x. |
| `neogolfclub.com` «2024 Season» LPGA-tall (94 / 139 / 220) | **UTELATT** | Tredjepart, motstridende merking, ser ut som feilmerket eldre utgave. Ikke brukt. |
| Cachet `lpga.txt` med forskjøvne radetiketter | **UTELATT** | Radetikettene er forskjøvet: driver får 94, 3-wood står tom, verdiene ligger én rad for høyt. §1.4 er lest fra den korrekt justerte kilden. Brukes filen rått, kalibreres LPGA mot feil kølle. |
| «Driver Fitting Chart: CARRY Optimizer» (klubbfart 75–95 mph) | **UTELATT — to grunner** | Funnet i øktens cache, merket `www.trackman.dk`. (a) **Kilde-URL ikke gjenfunnet** — bryter absoluttregelen. (b) Selv med URL er den **preskriptiv, ikke deskriptiv**: den viser *optimale* launch/spinn for en gitt fart, ikke hva amatører faktisk leverer. Den ville flatert amatørbåndene systematisk. |
| Amatørbånd for de åtte øvrige metrikkene | **IKKE PUBLISERT** | Se §1.5. Ingen erstatning konstruert. |

---

## 3. Toleransebånd per utfall

Forslaget var **launch ±0,5° · carry ±2 % · spinn ±8 %**.

### 3.1 Hva dataene faktisk viser

**(a) Ingen kilde publiserer spredning per kølle.** Bortsett fra §1.6 (driver, tre metrikker)
finnes ingen SD, persentiler eller n. Toleransebåndene kan derfor **ikke** utledes fra
publisert spredning. De er ingeniørporter mot et publisert *snitt* — ikke populasjonsbånd.
Dette må stå i testfila, ellers leses de som noe de ikke er.

**(b) Populasjonsspredningen er en helt annen størrelsesorden.** Tourfeltets driver-carry
spenner −10 % / +14 % (§1.6). Et ±2 %-krav ligger langt innenfor. Det er riktig for
«reproduser snittet», men det er ikke det samme som «ser ut som en ekte spiller».

**(c) Avrunding er ikke den bindende skranken.** Carry trykkes i hele yards (±0,5 yd =
±0,18 % på driver, ±0,28 % på 7-jern), launch i tideler (±0,05°), spinn i hele rpm.
Det er god margin under de foreslåtte båndene.

**(d) MEN radene er ikke internt konsistente.** `ballSpeed / clubSpeed` avviker fra trykt
smashFactor i **4 av 12 rader** i K1:

| Kølle | ballSpeed/clubSpeed | Trykt smash | Avvik |
|---|---|---|---|
| Hybrid | 1,4608 | 1,47 | −0,009 |
| 3 Iron | 1,4500 | 1,46 | −0,010 |
| 4 Iron | 1,4286 | 1,44 | −0,011 |
| 6 Iron | 1,3830 | 1,39 | −0,007 |

Hver kolonne er avrundet uavhengig fra underliggende data. **Raden er ni marginale
gjennomsnitt, ikke ett fysisk slag.** En test som asserter `ballSpeed = clubSpeed × smash`
mot tabellen bommer med opptil **1,12 mph (0,80 %)** — uansett hvor god motoren er.

**(e) Utgaveforskjellen alene spiser hele toleransebudsjettet.** Fra eldre utgave til 2023:

| Metrikk | Endring | Mot foreslått bånd |
|---|---|---|
| carry, alle 12 køller | **+2,33 % til +4,41 %** | **Sprenger ±2 % på hver eneste kølle** |
| driver launch | **−0,5°** | **Bruker opp hele ±0,5°-budsjettet** |
| driver spin | −5,25 % | To tredjedeler av ±8 % |
| 3 Iron spin | −4,88 % | Over halve budsjettet |
| apex | +2 til +3 yd | — |

> **Dette er hovedkonklusjonen i §3.** Å velge feil tabellutgave feiler carry-porten på
> samtlige tolv køller, helt uavhengig av motorens kvalitet. **Utgaven må låses før
> båndene betyr noe som helst.** Anbefaling: lås til **Trackman 2023 (K1/K2)**, og stemple
> utgaven i hver testrad.

### 3.2 Dom: justert båndsett

| Utfall | Foreslått | **Anbefalt** | Begrunnelse |
|---|---|---|---|
| `launchAngle` | ±0,5° | **±0,5° — BEKREFTET** | Avrunding er ±0,05°, så det er 10× margin. Men utgaveskiftet flytter driver-launch nøyaktig 0,5°: gyldig kun med låst utgave. |
| `carry` | ±2 % | **±2 % — BEKREFTET, men kun innen låst utgave** | Avrunding er ±0,18–0,35 %. Kryssutgave er skiftet 2,3–4,4 % og porten er da meningsløs. Aldri sammenlign på tvers av utgaver. |
| `spinRate` | ±8 % | **±8 % — BEHOLDT SOM MÅL, men merket UDOKUMENTERT** | Ingen kilde publiserer spinnspredning i det hele tatt. ±8 % kan ikke begrunnes i data — det er et ingeniørvalg. Merk det som det. Dagens motor feiler porten på begge målte køller. |
| `ballSpeed` | — | **±1,0 %** | Kan ikke settes strammere: tabellens egen inkonsistens er opptil 0,80 % (§3.1d). |
| `smashFactor` | — | **±0,02** | Tabellen er selvinkonsistent med 0,01. ±0,01 ville felle korrekte motorer. |
| `apex` (Max Height) | — | **±2 yd** | Trykt i hele yards på 30–35 yd; avrunding alene er ±1,4–1,6 %. ±1 yd er innenfor støyen. |
| `landAngle` | — | **±1,0°** | Trykt i hele grader. |
| `clubSpeed`, `attackAngle` | — | **Ikke porter** | Dette er **inndata** til motoren, ikke utfall. Å gate dem som utfall tester at man matet inn det man matet inn. |

### 3.3 Tre regler som må følge båndene

1. **Per metrikk, per kølle, per utgave.** Aldri aggregert.
2. **Ingen kryss-kolonne-identiteter mot tabellen.** `ballSpeed = clubSpeed × smash` holder
   ikke i kilden selv (§3.1d).
3. **Ingen «hele raden samtidig»-test.** De ni tallene er uavhengig avrundede marginaler fra
   ulike slag, ikke ett slag. Et krav om at én simulering treffer alle ni samtidig er
   uoppnåelig av grunner som ikke har med motoren å gjøre.

---

## 4. Dom over 7124 rpm

### **BEKREFTET — og dobbelt bekreftet, fra to uavhengige hentbare kilder.**

Forbeholdet i oppdraget (og i `DOD-DRIVER.md` linje 35: *«7-jernets tour-spinn (brukt som
7 124 rpm) verifisert mot hentbar kilde — i dag er det hukommelse»*) er **lukket**.

**Kilde 1 — K1 (bildetabell).** 7 Iron-raden lest direkte av meg fra bildet:
`92 | −3,9° | 123 | 1,34 | 16,1° | 7124 | 34/31 | 51° | 176/161`

**Kilde 2 — K10 (løpende tekst, maskinlesbar).** Trackmans spinn-artikkel oppgir 2023
PGA Tour-spinn som tekst, ikke som bilde:

| Kølle | Spinn (K10) | Spinn (K1) | Samsvar |
|---|---|---|---|
| Driver | 2 500 (avrundet) | 2545 | ✓ |
| 5-jern | 5 280 | 5280 | ✓ eksakt |
| 6-jern | 6 204 | 6204 | ✓ eksakt |
| **7-jern** | **7 124** | **7124** | **✓ eksakt** |
| 8-jern | 8 078 | 8078 | ✓ eksakt |
| 9-jern | 8 793 | 8793 | ✓ eksakt |

Dette er viktig utover selve tallet: **all tidligere verifikasjon hvilte på visuell lesing
av en JPEG.** K10 er tekst, og bekrefter fem av seks spinnverdier siffer for siffer.
2023-tabellens spinnkolonne er dermed uavhengig bekreftet.

**Presisering som må med:** 7124 rpm er **2023-utgavens** 7-jern. Den eldre utgaven har
**7097 rpm** (K4). Forskjellen er bare +0,38 %, så spinn skiller dårlig mellom utgavene —
men **carry gjør det**: 176 yd (2023) mot 172 yd (eldre), altså 2,33 %.

**Konsekvens for den målte 7-jern-kalibreringen.** Den rapporterte carry-feilen på −0,7 %
gjelder mot 176 yd. Var referansen i stedet 172 yd, ville samme motor gitt **−2,96 %** —
som **feiler** ±2 %-porten. «Nesten perfekt» på 7-jernet avhenger altså av at 2023-utgaven
faktisk var referansen. Siden 7124 (2023) er dokumentert brukt, er 2023 den konsistente
lesningen — men den må skrives ned, ikke antas.

### Åpent punkt som følger av dette

Driverens referanseutgave er **ikke dokumentert noe sted i repoet.** Jeg søkte gjennom
`engine/`, `motor/`, `DECISIONS.md`, `DOD-DRIVER.md` og `UTFORDRINGER.md`: ingen lagret
referansetabell finnes. `DECISIONS.md` D25 oppgir avvikene (+19,5 % spinn, −2,8 % carry)
uten å oppgi utgaven de er målt mot.

Rekonstruksjon av hva motoren må ha levert, under hver antakelse:

| Antatt referanse | Motorens driver-output | Samme motor scoret mot den ANDRE utgaven |
|---|---|---|
| 2023 (10,4° / 282 yd / 2545) | 9,53° · 274,1 yd · 3041 rpm | launch −1,37° · carry −0,33 % · **spinn +13,2 %** |
| Eldre (10,9° / 275 yd / 2686) | 10,03° · 267,3 yd · 3210 rpm | launch −0,37° · carry −5,21 % · **spinn +26,1 %** |

Driverens spinnfeil er altså et sted mellom **+13 % og +26 %** avhengig av hvilken utgave
som faktisk ble brukt. Uansett utgave er den langt utenfor ±8 %. **Diagnosen «for mye spinn
på driver» står — men størrelsen er ikke fastslått før utgaven er dokumentert.**

---

## 5. Ærlig sluttvurdering

### Hva som er sitert

| Blokk | Tall | Kilde |
|---|---|---|
| PGA Tour 2023 | 12 køller × 9 = **108** | K1 |
| PGA Tour eldre | 12 køller × 9 = **108** | K4 (+ K11 delvis) |
| LPGA Tour 2023 | 11 køller × 9 = **99** | K2 |
| LPGA Tour eldre | 11 køller × 9 = **99** | K5 |
| PGA driver-spredning | 3 metrikker × 3 = **9** | K6–K8 |
| Amatør smashFactor per handicap | **9** | K9 |
| Tour smash-referanse | 4 | K9 |
| Spinn-korroborasjon | 6 | K10 |
| **Sum** | **442** | |

### Hva som er gjetning

**Null.** Ingen tall i dette dokumentet er skrevet fra hukommelse eller avledet ved skalering.
Tallet som var gjetning — 7124 rpm — er nå bekreftet fra to kilder (§4). Der data mangler,
står **IKKE PUBLISERT**.

De eneste avledede tallene er de jeg selv har regnet ut fra de siterte (utgavedeltaer,
spredningsprosenter, smash-konsistens, motorrekonstruksjon). De er merket som utregninger og
kan reproduseres fra tabellene over.

### Køllekategorier som mangler helt

**Dekket av minst én sitert rad (13):** Driver · 3-wood · 5-wood · 7-wood · Hybrid ·
3 Iron · 4 Iron · 5 Iron · 6 Iron · 7 Iron · 8 Iron · 9 Iron · PW.

**Mangler i ALLE kilder, alle populasjoner:**

| Kølle | Status |
|---|---|
| Gap wedge / AW (50–52°) | **IKKE PUBLISERT** — ingen tabell går under PW |
| Sand wedge (54–56°) | **IKKE PUBLISERT** |
| Lob wedge (58–60°) | **IKKE PUBLISERT** |
| 2-jern, 1-jern | **IKKE PUBLISERT** |
| 4-wood, 9-wood | **IKKE PUBLISERT** |
| Putter | Ikke relevant |

Wedgehullet er praktisk viktig: en 15-handicapper slår svært mange slag med SW og LW, og
det finnes ingen publisert referanse for dem. Trackmans spinnartikkel (K10) gir det eneste
holdepunktet, og det er et **intervall, ikke en tabellrad**: PW menn **8 500–10 500 rpm**,
kvinner **7 500–9 500 rpm**, samt tommelfingerregelen «ca. 1 000 rpm per køllenummer».

**Delvis manglende:**
- 3 Iron: finnes i PGA, mangler i LPGA 2023.
- Hybrid: finnes i 2023, mangler i eldre LPGA (som har 7-wood i stedet).

### Den ærlige totalvurderingen

**Tour-siden er solid.** 414 tourtall fra fire hentbare tabeller, alle lest av meg direkte
fra kilden, med uavhengig tekstbekreftelse av 2023-spinnkolonnen. Det holder til å kalibrere
motoren og til å publisere referansepunkter.

**Målgruppesiden er ikke løst.** Oppdraget sier at amatørbåndene er de viktigste — at en
15-handicapper skal kjenne igjen sine egne tall. Vi har **ni amatørtall, alle smashFactor,
alle driver**. Det er 1 av 9 metrikker for 1 av 13 køller. Alt annet er ikke publisert.

Det betyr at kravet *«tallene skal oppleves reelle for det de opplever ute»* i dag **ikke kan
etterprøves for målgruppen**. Vi kan bevise at motoren reproduserer tourgjennomsnitt. Vi kan
ikke bevise at den føles riktig for en 15-handicapper, fordi fasiten ikke finnes publisert.

To ærlige veier videre — begge legitime, ingen av dem gjetning:

1. **Aksepter dekningen som er.** Publiser tourbåndene som referansepunkter, og si eksplisitt
   i produktet at amatørtall ikke er kalibrert mot publisert data. Ingen fiksjon, men kravet
   forblir uetterprøvd der det betyr mest.
2. **Skaff egne data.** Amatørbånd per handicap finnes ikke publisert, og kommer ikke til å
   dukke opp. Skal de finnes, må de måles — egen innsamling med launch monitor, segmentert på
   handicap. Da blir de førstepartsdata med kjent metode, ikke lånte tourtall skalert ned.

Det som **ikke** er en vei videre: å interpolere amatørbånd fra tourtall, eller å bruke
Trackmans optimizer-tabeller som om de var deskriptive. Begge produserer tall som ser
troverdige ut og er oppdiktet — og en motor kalibrert mot fiksjon er verre enn en ukalibrert
motor, fordi feilen da er dokumentert som riktig.

---

## 6. Handlingsliste

- [ ] **Lås tabellutgave til Trackman 2023 (K1/K2)** og stemple utgaven i hver testrad.
      Uten dette er carry-porten meningsløs (§3.1e).
- [ ] **Dokumentér driverens referanseutgave** i repoet. I dag finnes ingen lagret
      referansetabell (§4).
- [ ] Legg inn båndsettet fra §3.2, inkludert de fem nye portene (ballSpeed, smashFactor,
      apex, landAngle) og fjerningen av clubSpeed/attackAngle som utfallsporter.
- [ ] Merk `apex` ↔ kildens `Max Height` eksplisitt i mappingen.
- [ ] Fjern «ordrett sitat»-merkingen; bruk «transkripsjon» for K1/K2.
- [ ] Arkivér K1/K2 lokalt. Begge er CDN-assets uten artikkel-innramming i bloggindeksen og
      kan forsvinne uten varsel.
- [ ] Kryss av `DOD-DRIVER.md` linje 35 — 7124 rpm er verifisert (§4).
- [ ] Beslutt vei 1 eller vei 2 for amatørdekningen (§5).
