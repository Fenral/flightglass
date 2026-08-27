# Strøm G — plan for D109: å skille strike fra path/attack i Impact Studio

D109 låser **AT** strike-visningen skal skilles fra path/attack-visningen, med
motivet «redusere ting på skjermen». Denne planen utformer **HVORDAN** i tre
reelt ulike alternativer, hver målt på den leverte flaten før den ble foreslått.

## Hvor dette står

**Splitten er IKKE bygget.** `app/studio/index.html`, `adapter/` og `engine/`
er urørt. Det som ER bygget er beslutningshjelpen:

| | |
|---|---|
| Demo | `app/studio/split-demo.html` — kjør dev-serveren, åpne `/app/studio/split-demo.html` |
| Artifact | https://claude.ai/code/artifact/48398cfd-b86f-47ab-a9c2-8bbc1ed81e2b |
| Gjenoppbygges | `node tools/artifact-build/build.mjs` (§14) |

**Hovedvalget er tatt (D128).** Gjenstår før byggestart:

1. **Køllevalgets plass** — tre mocker levert (§17.2): segmentrad ·
   raden utgår og høyden går til scenen · kølle + stille kontekstavlesning
2. **DTL-kontrollens plass** — mitt forslag: på scenen, motsatt hjørne av
   pillen (§17.3). Forslag, ikke vedtatt
3. **Scenehøyden i portrett** — men D130 gjør dette til et senere vedtak:
   landskap bygges først, portrett dømmes på ekte render (§15.2 for tallene)
4. **H-retningen** — påvirker G kun hvis H3 velges (§12)

## Avklart siden første levering

**Låst:** D113 (akseptkriteriene per modus) · D114 (G-1/G-2 rettet i strøm E) ·
D116 (onboardingen er del av byggescopet, §13) · D117 (artifact-utdata i
`_artifacts/`) · D118 (portrettgulvet 390 × 844) · **D128 hovedvalget:
alternativ 1 MODUS, pillen i canvasen, raden bærer kun køllevalget** · D129
lie som kontekstord · D130 landskap først · D131 delte verktøy skriver aldri
til en annen strøms artifact · D132 treffsone-regelen generalisert (§17.4).
**Eierretning innarbeidet:** G-a (fire chips i begge modi, LIE som kontekst,
§10) · portrett primær med landskap valgfritt (§11) · HOME ut i portrett,
orbene ut av scenen (§15).
**Fra H:** G-e besvart — ingen bunnmeny i landskap (§12). Arbeidsantagelse,
ikke låst: velges H3 gjelder §9 igjen i annen form.

## Leseveiledning — hva som er erstattet av hva

Planen er skrevet over flere runder, og noen tall er senere korrigert. Les
alltid det nyeste:

| Tema | Gjelder | Erstatter |
|---|---|---|
| Bunnmeny i landskap | §12 (H svarte: finnes ikke) | §9 sitt 60/80 px-regnestykke |
| Chipsene ved modusbytte | §10 (eierens G-a) | forslaget i §3 |
| Høydebudsjett i portrett | **§16 (netto, med safe-area)** | §13.4 og §15, som er BRUTTO |
| Buens lesbarhet | §15.2 (forsterkning, 77 px uansett høyde) | — |

**To selvkorreksjoner er ført med begrunnelse** så de ikke gjenoppdages:
buestigningen 12 → 77 px (§15.2) og brutto → netto høydebudsjett (§16).

---

## 1 · Hva jeg målte

Målt i nettleser på `http://localhost:8321/app/studio/index.html`, ved begge
ytterpunktene D59 krever. rAF er strupet når panelet ikke komponerer, så
canvas-innholdet er lest fra kilden, ikke fra en skjermdump; alle DOM-tall er
`getBoundingClientRect`.

### Flatene

| | 932 × 430 | 568 × 320 (minimum, D59) |
|---|---|---|
| Toppstripe | 932 × 54 | 568 × 54 |
| ATTACK / CLUB PATH-kort | 392 × 44 hver | 210 × 44 hver |
| Stage | 912 × 280 | 548 × 170 |
| Strike-inset (kompakt) | 240 × 138 = **13,0 %** av stage | 175 × 111 = **20,8 %** av stage |
| Utstansing i scenen (`sceneClipPath`, inset + 6 px) | 252 × 150 = **14,9 %** av scenearealet | 187 × 123 = **25,1 %** |
| Strike-inset (maksimert) | 894 × 262 = **91,7 %** av stage | 530 × 152 = **86,5 %** |
| Rail | 52 × 154, vertikal ved siden av scenen | 140 × 44, **liggende oppå scenen** (z 5 over inset z 4) |
| Kontroller (chips 44 + slider 44) | 932 × 96 = 22 % av skjermhøyden | 568 × 96 = **30 %** av skjermhøyden |

### Samtidig innhold i standardtilstand (Face On, kompakt inset)

**26 synlige tekstelementer i DOM**, identisk antall ved begge portstørrelser:
HOME · ATTACK ANGLE · −4.3° · CLUB PATH · +2.5° · RESET · STRIKE · PURE · · ·
1.0 mm low · MID-IRON · HARDPAN · 0 mm · ⤢ · DTL · MID-IRON · STRIKE ·
SWING PLANE · 60.0° · SWING DIRECTION · 0.0° · BALL POSITION · 0.0 cm ·
ARC HEIGHT · 0.0 cm · LIE · HARDPAN.
Maksimert inset: **29** (`· CONTACT ZONE`, `· DYNAMIC LOFT 31.0°`, `ASSUMED`).
I tillegg tegner canvas stance-merkene BACK/MID/FWD, ARC-braketten, inset-hakkene
ENTRY/LOW/EXIT og mm-braketten — og i DTL `TARGET` og `SWING DIRECTION`-calloutet.

**Seks av sju parameterkulører er på skjermen samtidig:** `attack` (kort),
`path` (kort + SWING DIRECTION-chip), `plane` (chip + glasset), `primary`
(BALL POSITION-chip + ballen), `depth` (ARC HEIGHT-chip + braketten),
`strike` (insetten) — pluss nøytral `ink` på LIE (D95). Kun `face` og `loft`
mangler, og de bor i Ball Flight.

Scenen bærer altså **to scener samtidig**: svingen, med et hull skåret i seg, og
kontaktsonen inni hullet. Ved 568 × 320 er hullet en fjerdedel av scenen.

### Den fysiske sømmen — målt, ikke antatt

Kjørt mot `engine/src/studioSolve.js` fra basis
`swingPlane 60 · swingDirection 0 · ballPosition 0 · arc 0 · hardpan · mid-iron · loft 31`
(`attack −4.345880982132436` · `path 2.5147257377799717`):

**186 caser — hele `arcHeightCm`-spennet −5…+5 i 0,1-steg, alle sju
`LIE_PRESETS`, alle sju `CLUB_GEOMETRY`-oppføringer og `dynamicLoftDeg` 5…40 —
gir 0 avvik i attack og club path. Ikke «innenfor toleranse»: `Object.is`-likt.**

Strike beveger seg over de samme casene: offset `−1,05 mm` (Pure/Centre) →
`−31,05` (arc +3, Whiff) · `+28,95` (arc −3, Duff) · `+6,95` (fairway) ·
`+40,95` (tee high, ingen turfkontakt) · `−16,65` (driver, Low).

Motsatt vei beveger disse **begge**:
`ballPosition +12` → attack `+0,620257`, path `−0,358122`, bånd Thin ·
`swingDirection +4` → attack `−2,610567`, path `+5,508430` ·
`swingPlane 50` → attack `−3,843354`, path `+3,231516`.

> **ARC HEIGHT, LIE og KØLLE beveger bare treffet.
> BALL POSITION, SWING DIRECTION og SWING PLANE beveger begge.**

Ett forbehold: `setClub()` re-presetter også `swingPlane` (D65-presetene
50/55/60), så et køllebytte flytter attack og path **gjennom UI-et**, ikke
gjennom fysikken. Det er en presentasjonskobling, ikke en modellkobling.

Konsekvensen for planen: en splitt kan ikke dele **inputene** rent i to, men den
kan dele **svarene** helt rent. Alle tre alternativene under deler svar.

---

## 2 · To målte defekter i den leverte onboardingen — meldt, ikke rettet

Begge er direkte følger av at strike-insetten og svingscenen deler én stage.
De hører til strøm E sin flate (`app/onboarding/`), ikke min, og er derfor
meldt her framfor rettet (PROTOKOLL).

**G-1 — steg 5 legger coachmarken utenfor skjermen ved begge portstørrelser.**
`steps.js` steg 5 setter `leftEdge: host.rect('inset').right`, mens `enter()`
kaller `openStrikeInset()`, som maksimerer insetten. Maksimert er
`inset.right` = 913 (932 × 430) og 549 (568 × 320), mens `rail.left` er 861 og
412. `applyPlacement` klemmer bredden til minimum 120 px og lar venstrekanten
stå. Målt resultat: boksen står på x 913 (bredde 120, høyre kant 1033) og
x 549 (høyre kant 669) — **101 px utenfor skjermen i begge tilfeller**. Ved
568 × 320 er 19 px av boksen synlig. Steget er i praksis uleselig.

**G-2 — steg 4 dekker avlesningen og markøren steget handler om.**
Ved **568 × 320** står coachmarken 218 × 194 på x 194…412, y 18…212. Målt
overlapp: `#vPath` (CLUB PATH-verdien, x 351…396, y 27…42) ligger **under**
boksen — nøyaktig det D107 er skrevet for å forby — sammen med begge kortene og
insetten. Den dekker også ballen (322, 174) og hele vandringen til
low point-markøren (x 312 → 392 ved y 174) mens steget lærer at low point
flytter seg.
Ved **932 × 430** (x 259…861, y 175…322) berører den ikke toppstripen, men
dekker fortsatt ballen (530, 252) og markørvandringen (636 → 514 ved y 252).
Coachmarken er ugjennomsiktig (`background: var(--surface)`).
Dette bryter `03-IMPACT-STUDIO.md` akseptansekriterium 3 («Low Point og bue er
alltid synlige») ved begge størrelser, og D107 ved 568 × 320.

Begge forsvinner av seg selv i alternativ 1 og 2, fordi de frie sonene da blir
ekte soner i stedet for restene mellom to overlappende visninger.

---

## 3 · Alternativ 1 — MODUS  *(anbefalt)*

To modi på samme flate. `STRIKE`-orben i railen slutter å være «maksimer» og
blir en modusbryter som **viser destinasjonen** — samme grammatikk som
view-orben allerede har (spec 03: «View-knappen skal vise destinasjonen»).

**DELIVERY** (standard)
Scenen er svingen. Kamera-aksen FACE ON ↔ DTL er uendret. Toppstripen bærer
ATTACK ANGLE + CLUB PATH. **Ingen inset, ingen utstansing** — `sceneClipPath()`
faller bort, og buens oppadgående arm blir hel for første gang.

**STRIKE**
Kontaktsonen fyller scenen — dagens maksimerte geometri, som allerede er
verifisert ved begge portstørrelser (894 × 262 / 530 × 152). Toppstripen bærer
strike-svaret `PURE · 1.0 mm low` og D3b-konteksten
`MID-IRON · HARDPAN 0 mm · DYNAMIC LOFT 31.0° [ASSUMED]`. Kamera-orben skjules
(kontaktsonen har ett kamera); railen blir to orber i stedet for tre — og ved
568 × 320 slutter railen dermed å ligge oppå kontaktsonen med tre knapper.

**Chipsene — avgjort av eier i G-a, se §10 for den bygde formen.** Kort: de fire
geometrichipsene står uendret i BEGGE modi (alle fire er relevante for begge
svar), ARC HEIGHT blir stående i DELIVERY nettopp for å vise ikke-effekten, og
bare LIE flytter seg — ut av DELIVERY og inn i STRIKE som kontekst.
*(Denne paragrafen sto opprinnelig med et forslag om demotering av de tre
ikke-ledende chipsene og fem chips i begge modi. Eierens retning gikk en annen
vei; §10 gjelder.)*

`crossViewHint()` utvides med samme mekanikk den alt har: dras ARC HEIGHT i
DELIVERY, pulser modusorben — svaret som beveger seg står i den andre modusen.

**Hva brukeren ser:** ett trykk veksler mellom «hvordan kølla kommer inn» og
«hvor den treffer». Aldri begge.

**Hva det koster:** lav–middels. Ett dokument, ingen ny route, ingen ny fysikk.
`setInspect()` **er** rørleggingen — den blir `setMode()`. Nytt arbeid: bytte av
toppstripens innhold (én ny avlesningskomponent for strike-svaret), orbsett per
modus, chip-demoteringen, og sletting av `sceneClipPath()`-hullet og av
`drawInset()`s kompakte gren. Anslag ~250–350 linjer i
`app/studio/index.html`; **0 i `engine/`, 0 i `adapter/`**. I `app/onboarding/`:
`openStrikeInset()` → `setMode('strike')`, og steg 4 sikrer DELIVERY.

---

## 4 · Alternativ 2 — SEKVENS: treffet er et tall du åpner

Scenen viser aldri kontaktsonen. Strike-svaret blir **én avlesning i
toppstripen**, sidestilt med ATTACK og CLUB PATH:
`STRIKE · PURE · 1.0 mm low · HARDPAN`. Den er en avlesning, ikke et bilde.
Trykk på den *går inn i* kontaktsonen, som da eier hele flaten inkludert
toppstripen — egen header med D3b-konteksten, egen vei ut.

**Hva brukeren ser:** Studios hovedskjerm er svingen, med tre tall. Treffet er et
tall man kan åpne.

**Hva det koster:** middels. Insettens kompakte gren slettes helt (canvas +
begge eyebrow-radene + maksimeringsknappen). Kontaktflaten er dagens maksimerte
gren. Reduksjonen i hovedtilstanden er størst av de tre: panelet og utstansingen
forsvinner begge.

**Alternativets harde punkt, målt:** toppstripen går fra to til tre avlesninger.
Ved 568 × 320 har stripen 62 → 491 px til kortene, i dag to à 210 px. Tre kort
blir ~139 px hver. `PURE · 1.0 mm low · HARDPAN` er 24 tegn og får ikke plass på
139 px i én linje i `data-md`. Enten må kortet få to linjer (og stripen vokse
forbi 54 px, som spiser av en stage som alt bare er 170 px høy), eller så må
`HARDPAN` flyttes til kontaktflaten — og da **brytes D3b**, som krever
underlaget synlig i *samme visning* som turfstatusen. Dette må avgjøres før
alternativet kan bygges.

---

## 5 · Alternativ 3 — EGEN FLATE

`app/studio/` beholder leveransen: bue, plan, retning, ballposisjon → attack,
club path, low point. En **ny landskapsflate** eier kontaktsonen med egne
kontroller (ARC HEIGHT + LIE-stegslider + kølle) og egne avlesninger. Delt
tilstand følger med mellom dem.

**Hva brukeren ser:** to navngitte instrumenter — «Impact Studio» og «Strike».

**Hva det koster:** høyest av de tre. Et andre dokument med duplisert skall
(orienteringsvakt, haptikk, chips + slider, HOME-sirkel, tokens),
tilstandsoverføring mellom flatene, **én skjerm til i Swift-porten** (D70–D72),
og onboardingen får et fjerde dokument i sekvensen — steg 5 blir et flatebytte.
Kølleorben må flytte til strike-flaten, men `setClub()` re-presetter `swingPlane`,
som bor på den andre flaten: en ny kobling tvers over en flategrense.

**Og den kolliderer med en åpen prosess.** D110 gjenåpnet navigasjonen 2026-08-26
og sier eksplisitt at **ingen strøm bygger navigasjon** før Home-redesign-runden
(D96) har vedtatt noe. En ny navngitt flate *er* navigasjon. Alternativ 3 bør
derfor enten avvises nå, eller utsettes til etter D96 og avgjøres der.

---

## 6 · Låste beslutninger som berøres, per alternativ

| Beslutning | 1 · MODUS | 2 · SEKVENS | 3 · EGEN FLATE |
|---|---|---|---|
| **D3b** underlaget synlig når turfstatus vises | Oppfylt. Lie flytter inn i STRIKE-modusens avlesning; i DELIVERY vises ingen turfstatus, så kravet er tomt der | **Truet** — se §4. Enten to linjer i kortet eller brudd | Oppfylt; strike-flaten bærer lie i egen header |
| **D65** tre køller, loft merket ASSUMED | Forbedret: loft-captionen får fast hjem i STRIKE i stedet for kun i maksimert tilstand (lukker B2-g fra STUDIO.md) | Samme forbedring | Samme, men kølle og plane-preset havner på hver sin flate |
| **D88** mock-gløden gjenopprettet i Studio | Uendret — hver glød følger sin scene | Uendret | Uendret |
| **D89** tre-trinns båndskala (good / strike-gull / bad) | Uendret | Uendret | Uendret |
| **D93** lie som stegslider, navn fast i D3b-avlesningen | Uendret; LIE-chipen består i begge modi | Uendret | LIE flytter flate; chip/slider-grammatikken må reetableres der |
| **D107** coachmark i midtbåndets nedre kant | **Må omskrives.** Sonen er utledet av dagens komposisjon (inset venstre, rail høyre) og brytes allerede i dag — se G-1/G-2. Ny sone måles per modus | **Må omskrives** | **Må skrives på nytt, for to flater** |
| **Onboarding steg 4–5** | Passer 1:1: steg 4 = DELIVERY, steg 5 = STRIKE. Begge defektene forsvinner | Steg 5 åpner kontaktflaten; steg 4 uendret | Steg 5 blir flatebytte; onboardingen spenner fire dokumenter |
| **Spec 03 akk. 5** «Strike-preview er alltid tilgjengelig» | Må leses som «alltid ett trykk unna». **Eiervedtak** | «Minivisning» blir en tekstlinje. **Eiervedtak** | Må leses om |
| **Spec 03 akk. 3** «Low Point og bue er alltid synlige» | I STRIKE er det den zoomede buen + LOW-hakket som er synlig. **Eiervedtak: gjelder kriteriet per modus eller per skjerm?** | Samme spørsmål | Samme spørsmål |
| **D110** navigasjonen er gjenåpnet; ingen strøm bygger meny før D96-runden | Ikke berørt — modus er ikke navigasjon | Ikke berørt — samme dokument | **Kolliderer direkte** |
| **D59** landskap ned til 568 × 320 | Forbedret: railen slutter å ligge oppå kontaktsonen | Forbedret i hovedtilstanden, presset i toppstripen | Nøytral |
| **D111** bunnmeny som permanent krom (strøm H) | **Tåler den best — og er forutsetningen** for at den kan finnes ved 568 × 320. Se §9 | Tåler den på hovedflaten, presses på kontaktflaten | Menyen blir *verre* av alternativet (åtte oppføringer mot uxpeaks maks fem) |

---

## 7 · Anbefaling

**Alternativ 1 — MODUS.**

1. Det gjør nøyaktig det D109 ber om: strike og attack/path står aldri på
   skjermen samtidig, og den ene scenen slutter å skjære hull i den andre
   (14,9 % / 25,1 % av scenearealet vinnes tilbake).
2. Geometrien er allerede verifisert. Den maksimerte insetten er kjørt og
   godkjent ved 568 × 320 og 932 × 430 i strøm B — alternativ 1 gjør den
   verifiserte tilstanden til en modus i stedet for en overlagring.
3. Det er billigst, og det er null endring i `engine/` og `adapter/` — fysikken
   er uberørt, så D0–D53-porten og de 465 + 75 testene er ikke i spill.
4. Ett dokument gir én skjerm i Swift-porten, ikke to.
5. Det retter G-1 og G-2 som bivirkning, uten at coachmark-reglene må omgås.
6. Det holder seg utenfor D110s åpne navigasjonsprosess.
7. **Argumentet fra §9 har flyttet seg, og blitt sterkere.** Det lød: en
   bunnstripe gjør at den kompakte insetten (111 px) ikke får plass i en stage
   på 90–110 px, så splitten er forutsetningen for menyen. H sitt svar fjerner
   bunnstripen fra landskap, så det holder ikke lenger *som menyargument*. Men
   samme mekanikk gjelder orienteringen: splitten er fortsatt forutsetningen
   for at Studio kan gå **portrett** (§11), og portrett er eierens retning.
   Argumentet gjelder altså en beslutning eieren allerede har tatt retning i,
   ikke en som fortsatt er åpen.

**Alternativ 2** er verdt å velge hvis eieren vil ha maksimal reduksjon i
hovedtilstanden og godtar at kontaktsonen mister sin lille faste tilstedeværelse
— men D3b-spørsmålet i §4 må avgjøres først.

**Alternativ 3** anbefales ikke nå: den koster mest, den treffer Swift-porten, og
den kolliderer med en prosess eieren nettopp åpnet. Hører hjemme i D96-runden om
den skal opp igjen.

**Vurdert og forkastet:** å la kameraet gjøre splitten (Face On = treffet,
DTL = path). Det ville skilt attack fra club path — og steg 4 sin hele leksjon
er at de to beveger seg *sammen* fra én input.

---

## 8 · Underbeslutninger som trengs uansett valg

Ingen av disse står i DECISIONS.md eller DESIGN.md. Jeg bygger ikke før de er
avgjort.

**G-a · Chipsene ved modusbytte — AVGJORT av eier 2026-08-26.**
Fire geometrichips i begge modi; LIE ut av DELIVERY og inn i STRIKE som
kontekst. Bygget og målt i §10. Resten av G-a er lukket; den ene gjenstående
tråden er D93-tillegget som form A krever (se §10).

**G-b · Hvordan modusen byttes.**
[1] Railens `STRIKE`-orb blir modusbryter og viser destinasjonen *(anbefalt —
gjenbruker view-orbens etablerte grammatikk fra spec 03, ingen ny form)*.
[2] En pille over stagen, per 00-FELLES «tilstandsbytter er piller, ikke faner».
[3] Begge: orben bytter, pillen viser hvor man er.

**G-c · Gjelder spec 03 akk. 3 og 5 per skjerm eller per modus? — LÅST som D113.**
Per modus, som anbefalt. Bygget slik i demoen: kamera-orben hører til DELIVERY
og faller bort i STRIKE, og LOW-hakket tegnes i begge modi.

**G-d · G-1 og G-2 — LÅST som D114.** Rettes i strøm E nå, ute av G sitt scope.
D107-omskrivingen tas når hovedvalget er låst.

**G-e · Bunnmenyen i Studio-landskap (D111 — spørsmålet G må samordne med H).**
Grunnlaget er målt i §9: ved 568 × 320 har Studio **1 px horisontal slakk** og
mister **35–47 % av scenehøyden** til en bunnstripe. 00-FELLES sitt eget
navigasjonsfunn — verifisert mot AllTrails, Moonlitt, Tide Guide, FocusFlight og
Weather — sier at flater der en visualisering *er* innholdet ikke bruker bunnfelt.
Studio er nøyaktig den flaten, og eieren har alt krevd at landskap får et eget
svar (HOME-REDESIGN-BRIEF).
[1] Menyen auto-skjules i landskap med kant-hint; Studio kjører full høyde til
brukeren henter den *(anbefalt — beholder menyen som produktbeslutning uten å
betale for den på den ene flaten som ikke har råd)*.
[2] Menyen er permanent også i Studio. Da er alternativ 1 ikke lenger et valg,
men obligatorisk — og Studio betaler med stance-etikettene og en 88 px scene ved
minimumsstørrelsen. Billigst, ikke best.
[3] Sidestilt meny i landskap. **Oppdatert etter G-a:** med LIE ute av chip-raden
går den fra fem til fire chips, og hvert chip vokser fra 103 til 131 px. Med
72 px sidemeny gir det 105 px innvendig mot `SWING DIRECTION`s 95 — **10 px
klaring der det før var 1 px underskudd.** Alternativet er ikke lenger dyrest;
det er blitt mulig uten å røre etikettene. Se §10.

**BESVART av H (§5 i H-planen), med ett forbehold.** H velger [1]-familien:
ingen bunnmeny i landskap i det hele tatt. Kun H3 velger [3], og H3 gjør seg
da **avhengig av G alternativ 1 pluss G-a** — uten dem faller chip-raden
tilbake til fem chips og railen gir 14 px etikett-overflyt, et D64-brudd.
Det er den eneste av H sine tre retninger som legger et krav på G sitt
hovedvalg. Målingene H ba om ligger i §12.

---

## 9 · Bunnmeny-toleranse per alternativ (D111)

Målt ved å injisere en `flex:0 0 auto`-stripe nederst i Studios flex-kolonne og
lese om igjen. Stagen er `flex:1`, så hele tapet lander der.

### Det vertikale regnestykket ved 568 × 320 (D59-minimum)

| Bunnmeny | Stage | Scene | Himmel over bakken | Jord under | Kompakt inset (111 px) |
|---:|---:|---|---:|---:|---|
| **0** (i dag) | 170 | 546 × 168 | 119 | 49 | passer |
| **60** | 110 | 546 × 108 | 77 | 31 | **passer ikke** |
| **80** | 90 | 546 × 88 | 62 | 26 | **passer ikke** |

Ballen er 28 px i diameter. Ved 80 px meny er himmelen 2,2 balldiametre.
Stance-etikettene (BACK/MID/FWD) tegnes på `gy + 26`: ved 60 px meny er det y 103
i en 108 px scene — 5 px klaring; ved 80 px meny y 88 i en 88 px scene — **klippet**.

### Ved 932 × 430

| Bunnmeny | Stage | Scene | Himmel | Jord | Kompakt inset |
|---:|---:|---|---:|---:|---|
| **0** | 280 | 910 × 278 | 197 | 81 | 13,0 % av stage |
| **60** | 220 | 910 × 218 | 155 | 63 | 16,5 % |
| **80** | 200 | 910 × 198 | 141 | 57 | 18,2 % — 138 av 200 px stagehøyde, altså **69 % av høyden** |

### Det horisontale regnestykket — 1 px slakk

Chip-raden er 548 px: fem chips à 103 px + fire mellomrom à 8 px = **547**.
`SWING DIRECTION` måler **95 px** i et chip med 95 px innvendig bredde. Målt med
en 72 px venstremeny krymper chipene til 89 px → 81 px innvendig, og etiketten
renner over med 14 px. D64/DESIGN.md krever uforkortede etiketter.
**Enhver sidestilt meny ved 568 × 320 bryter en låst etikettregel** med mindre
chip-raden bygges om.

### Den avgjørende observasjonen

**Det første en bunnmeny dreper ved minimumsstørrelsen er den kompakte
strike-insetten** — 111 px høy i en stage på 110 eller 90 px. Den kan ikke
eksistere. D109 og D111 peker altså samme vei: splitten er ikke bare forenlig med
en bunnmeny, den er **forutsetningen** for at en bunnmeny kan finnes i Studio ved
568 × 320.

### Alternativ 1 — MODUS: tåler den best

- Den kompakte insetten finnes ikke i noen modus. Det menyen dreper først, er
  allerede slettet.
- **DELIVERY ved 568 × 320 + 80 px meny:** scene 546 × 88 viser ÉN ting — svingen.
  Én navngitt endring kreves: stance-etikettene på `gy + 26` må flyttes over
  bakkelinjen, eller falle bort under en målt høydeterskel. Ellers klippes de.
- **STRIKE ved samme mål:** kontaktsonen trenger ~76–80 px canvas — dagens
  kompakte inset-canvas er 76 px ved 568 og fungerer. Fordi alternativ 1 flytter
  begge eyebrow-radene opp i toppstripen, er hele stagen canvas: 88 px. **Passer.**
- Ved 932 × 430 + 80 px har begge modi 910 × 198. Rikelig.
- **Coachmarkene:** med bunnmeny opphører «midtbåndets nedre kant» å være en fri
  sone — der står menyen. D107 må uansett skrives om (G-1/G-2); den nye sonen
  blir stagens venstre halvdel i DELIVERY, som er fri når insetten er borte
  (ballen står på 0,57 · W, low point-vandringen 312 → 392 px ved 568).

### Alternativ 2 — SEKVENS: tåler den på hovedflaten, presses på kontaktflaten

- Hovedflaten får samme gevinst som alternativ 1: ingen inset, ingen utstansing.
- Men toppstripen skal bære **tre** avlesninger. Menyen forverrer ikke bredden —
  den fjerner utveien: «gi kortet to linjer» koster 54 → 68 px toppstripe, altså
  14 px til fra en stage som alt er nede i 90. Ved 568 × 320 med 80 px meny blir
  stagen 76 px. Da faller også STRIKE-flatens eget pusterom.
- Kontaktflaten eier hele skjermen, men må med permanent krom (D111) også bære
  menyen: 320 − 80 = 240 px minus egen header. Holder, men flaten mister den
  fulle høyden som var hele poenget med å gå inn i den.

### Alternativ 3 — EGEN FLATE: den eneste som blir bedre av en meny, og likevel frarådet

- En meny gjør flatebytte billig; strike kunne blitt en menyoppføring.
- Men uxpeak-tips 4 (maks fem faner) mot 00-FELLES sine sju moduler **pluss** en
  strike-flate = åtte oppføringer. Alternativet gjør menyen verre, ikke bedre.
- Og D111 sier H eier navigasjonen sentralt. Alternativ 3 er G som bestemmer
  navigasjon. Dobbeltbrudd — mot D110 og mot D111.

### Hva G trenger fra H

Ett svar, før bygging: **G-e** i §8. Alternativ 1 fungerer under alle tre
utfallene av G-e — det er en av grunnene til at det anbefales — men
stance-etikettene og D107-sonen kan ikke tegnes ferdig før utfallet er kjent.

---

## 10 · G-a innarbeidet — konkret form

Eierens retning er bygget inn i demoen (`app/studio/split-demo.html`).

**Chip-raden er IDENTISK i begge modi: fire geometrichips.**
`SWING PLANE · SWING DIRECTION · BALL POSITION · ARC HEIGHT`. Ingen av dem
forsvinner ved modusbytte — alle fire er relevante for begge svar (målt: alle
tre av plane/dir/low flytter attack, path *og* treffbåndet). ARC HEIGHT står i
DELIVERY nettopp for å vise ikke-effekten.

**Bare LIE flytter seg.** Ute av DELIVERY (målt: bit-identisk attack/path over
alle sju presets), og i STRIKE som kontekst.

### Ikke-effekten, konkret
Når ARC HEIGHT leder i DELIVERY, trer ATTACK ANGLE og CLUB PATH tilbake til
Inaktiv-nivået mens sifrene står stille. Bæreren er at tallene ikke flytter seg;
dempingen forsterker (D10 er oppfylt uten at farge er eneste bærer). Mekanismen
finnes alt — `updateOutcomes()` sin `dim`-klasse — og utvides fra «denne endret
seg ikke» til «denne kan ikke endre seg». Verifisert i demoen: arc 0 → +3 gir
`−4.3°` / `+2.5°` før og etter, begge kort dempet.
*Åpent:* om det i tillegg skal stå et ord (f.eks. `HELD`) er eierens, ikke
strømmens (00-FELLES: «et ord»). Demoen viser formen uten ord.

### LIE som kontekst — form A (anbefalt), bygget i demoen
Kontekstraden i STRIKE er `MID-IRON · HARDPAN 0 mm · DYNAMIC LOFT 31.0° [ASSUMED]`.
**Lie-ordet i den raden ER kontrollen.** Trykk på det, og den delte slideren tar
D93s sju-stegs lie-parameter med detentene i behold; ordet oppdateres live ved
hvert steg. Trykk på et chip, og slideren går tilbake.

Begrunnelsen: kontekstraden har allerede to kontekstverdier som settes andre
steder — kølla fra rail-orben, loften avledet og merket `ASSUMED`. Å la lie
settes fra samme rad gjør raden konsekvent: **kontekst styres der kontekst
står.** Ingen ny form, ingen ny plass, én chip mindre.

**Konsekvens for D93 — må avgjøres:** D93s kjerne er urørt (sju diskrete
presets, aldri fri mm, navnet fast i D3b-avlesningen, mm som caption,
øyeblikkelig navnebytte, hvert steg en detent) og er bygget slik i demoen. Men
D93 sier også «LIE-chipen velger parameter, slideren setter verdi». Form A
erstatter chipen med ordet. Det krever et tillegg til D93-raden — det er den
ene låste setningen G-a bryter, og den meldes framfor å omgås.

**Kostnaden ved form A, funnet under byggingen:** ordet står i en caption-rad
som er 15 px høy, mens DESIGN.md og spec 03 akk. 9 krever 44 × 44 px
berøringsflate. Løsningen som er bygget: treffsonen utvides usynlig til 44 px
over kortets høyde (verifisert — treff registreres ±20 px fra ordets midte).
Det går fordi strike-kortet ikke har noen annen kontroll. Men det er en ekte
tilleggsregel formen krever, og den bør stå i vedtaket, ikke bare i koden.

**Form B, også bygget** (bytt i demoens verktøylinje): LIE som egen
kontekst-chip, avsatt fra parameterchipsene og i nøytral ink/ghost per D95.
Bevarer D93s ordlyd uendret og gir 44 px uten triks, men beholder en chip og
gjør ikke lie til kontekst i formen — bare i plasseringen.

### Sidegevinsten G-a gir, målt
Fem chips → fire. Ved 568 × 320 vokser hvert chip fra **103 til 131 px**.
Med en 72 px sidemeny får chipsene 105 px innvendig, og `SWING DIRECTION`
trenger 95. **Før G-a var slakken 1 px og etiketten brøt; etter G-a er det
10 px klaring.** G-a låser altså opp G-e[3] — en sidestilt meny i landskap går
fra umulig til mulig. Det bør strøm H få vite før de tegner.

---

## 11 · Portrett — eierens nye vurderingspunkt

Bygget som del C av demoen (390 × 844, begge modi).

### Det som avgjør spørsmålet
Det horisontale verdensvinduet i Face On er en **verdenskonstant** — 0,82 m
under 700 px bredde, 0,90 m over. En smalere skjerm **beskjærer derfor ikke**
scenen; den senker oppløsningen:

| Scenebredde | Oppløsning | Ball | 1 mm |
|---|---:|---:|---:|
| 910 px (932-port) | 1011 px/m | 43 px | 1,01 px |
| 546 px (568-port) | 666 px/m | 28 px | 0,67 px |
| 370 px (390 portrett) | 451 px/m | 19 px | 0,45 px |
| 355 px (375 portrett) | 433 px/m | 18 px | 0,43 px |

**Og alt som krever mm-oppløsning er nøyaktig det D109 flytter ut:**
kontaktblush, slagflaten med treffpunktet, strike-hakket, mm-braketten,
ENTRY/EXIT. STRIKE-canvaset har et **adaptivt** verdensvindu som alltid rammer
inn kontaktsonen, så oppløsningen der settes av sonen, ikke av skjermen. Etter
splitten trenger DELIVERY-scenen bare cm-skala, og den tåler 433 px/m.

> **Splitten er det som gjør portrett tenkelig. Uten den er det ikke det.**

### Kan man zoome inn og ta oppløsningen tilbake? Delvis — grensen er målt
Krymper man vinduet under 0,82 m stiger oppløsningen, men low point-markøren
forsvinner ut av rammen. Over ballposisjon −20…+20 cm vandrer den til
`+0,305 m`, og med ballen på 0,57 × bredden ligger høyre kant på 0,43 × vinduet.
Kravet `0,43 · win ≥ 0,305` gir **win ≥ 0,71 m** → 451 → **521 px/m, +16 %**.
Ikke landskapets 666. Under det brytes D113/spec 03 sitt krav om at low point er
synlig i DELIVERY.

### Kontrollraden er en egen designoppgave per orientering
Ved 390 px gir fire chips på én rad 87 px hver, og `SWING DIRECTION` (95 px)
forkortes — som D64 forbyr. Portrett har derimot høyden: raden brytes i to rader
à to, og det koster 44 px av de 426 som står ledige. Løst i demoen. Men det
bekrefter eierens egen setning fra HOME-REDESIGN-BRIEF: landskap og portrett er
to design, ikke én rotasjon — og det gjelder kontrollraden, ikke bare menyen.

### Regnestykket begge veier

**Portrett kjøper:** 374–426 px ledig høyde ved 390 × 844 — der H sin meny får
plass som permanent krom uten å røre scenen, som er hele floken D111 sitter fast
i. *(Rettelse: en tidligere versjon skrev «meny og dashboard» her. Dashboardet
hører til **Home** — D110 og alle tre H-retningene plasserer det der, aldri i en
modulflate. Studios ledige høyde er kandidat for menykrom, en høyere scene eller
ingenting.)*
Rotasjonsbruddet faller bort (D12; D8 står allerede «låst med forbehold» med
N1-merknaden «rotasjonsbruddet er ikke forsvart»). Swift-porten får én
orientering i stedet for to.

**Portrett koster:** 35 % av sceneoppløsningen (666 → 433/451 px/m), ballen fra
28 til 18–19 px, en egen kontrollradsdesign, og DTL havner i sin `tallStage`-gren
(fov 44, xStretch 0,92) — grenen finnes i mocken, men har aldri vært
hovedstien og må verifiseres.

### Ærlig grense for hva demoen kan avgjøre
Demoens scene er **skjematisk**: ekte geometri, men uten mockens
materialplater, glødpass (D88), sprites og footprints. Den kan vise at
komposisjonen og tallene holder ved 433 px/m. Den kan **ikke** avgjøre om
mockens render *ser riktig ut* på den størrelsen — det krever at splitten er
bygget i den ekte flaten først.

**Anbefaling:** ikke gjør om D8/D12 nå. Bygg splitten i landskap, og la portrett
være et eget vedtak som tas når den ekte renderen kan måles ved 370 px. Premisset
D12 ble låst på — «buen lever på bredde» — er fortsatt sant; det som har endret
seg er at DELIVERY-scenen etter splitten bare trenger cm-skala. Det er nok til å
gjøre spørsmålet levende, ikke nok til å svare på det med en skjematisk mock.

---

## 12 · D107-sonen målt for H (samordningssvaret tilbake)

H ba G måle hva en 72 px venstrerail (H3) gjør med coachmark-sonen. Målt mot
E sin **omskrevne** `studioZone` (`app/onboarding/steps.js`), som nå bruker
low point-markøren som gulv og toppstripen som hard kant.

### Utgangspunktet: hva sonen er I DAG

Ren innlasting, steg 4, E sin rettede kode — uavhengig verifisert av G:

| Mål | Boks | Innhold | Synlig | Dekker noe? |
|---|---|---|---|---|
| 932 × 430 | 578 × 148 | 148 px | **100 %** | nei |
| 568 × 320 | 194 × 146 | 217 px | **67 %** | nei |

**G-1 og G-2 er bekreftet lukket.** Boksen er innenfor skjermen ved begge mål
og dekker verken `#vAttack`, `#vPath`, insetten eller railen. At den ruller ved
568 × 320 er E sitt dokumenterte valg («heller en lav boks som ruller enn en
bred som skjuler svaret»), ikke en defekt.

**Korreksjon til G sin egen første avlesning:** et første forsøk viste boksen
som en 32 px stripe med `max-height: 0` og `data-orientation="portrait"` i
landskap. Det var **ikke** en E-feil, men et artefakt av nettleserpanelets
`resize_window`: den leverer ikke alltid et `resize`-event til siden, så
plasseringen ble stående fra forrige størrelse. Sendt manuelt `resize`-event
rettet den seg selv. Meldes her fordi fellen vil ta neste økt som måler
responsiv oppførsel i dette panelet.

### Hva splitten gjør med sonen

Sonens venstrekant er `inset.right + 12`. **I DELIVERY etter alternativ 1
finnes ingen inset** — kanten kollapser til scenens venstre kant:

| Tilstand ved 568 × 320 | Sonebredde | Mot i dag |
|---|---:|---:|
| I dag (inset til stede) | 194 px | — |
| Etter splitten, ingen rail | **371 px** | **+91 %** |
| Etter splitten + H3-rail | **299 px** | **+54 %** |

Ved 932 × 430: 851 px uten rail, 779 px med. Sonehøyden er urørt i alle
tilfeller (170 / 280 px).

**Svaret til H:** H3 sin rail koster 72 px av sonen, men splitten gir 177 px
tilbake. Selv med railen er sonen 54 % bredere enn i dag, og E sin
67 %-rulling ved minimumsmålet blir dermed bedre, ikke verre. Chip-raden
holder også: 105 px innvendig mot `SWING DIRECTION`s 95.

**Forbeholdet H selv navnga, bekreftet:** dette gjelder kun sammen med
alternativ 1 + G-a. Med fem chips gir railen 81 px innvendig mot 95 påkrevd —
et D64-brudd, som H skriver.

**Det som ikke kan måles ennå:** hvor boksen faktisk havner når insetten er
borte, avhenger av hva D107-omskrivingen setter som ny venstrekant. Det er
E sin kode og G sitt hovedvalg som møtes der, og begge deler er åpne. Tallene
over er sonens ytre konvolutt, ikke en plassering.

---

## 13 · Onboardingen er del av byggescopet (D116)

Eierkrav: tilpasningen er ikke en oppfølgingssak. Splitten regnes ikke som
levert før E sin ende-til-ende-sekvens er grønn. Konkret arbeid:

### 13.1 · Sømmen mot E — hva som faktisk må endres

E sin vertskontrakt kaller skjermens egne funksjoner gjennom `window.__studio`
(`app/studio/index.html` ~1920), som i dag eksponerer
`state · solved · applyStudio · selectParam · setInspect · reset`.
`app/onboarding/host-studio.js` mapper dem videre. Endringene er små og
navngitte:

| Sted | I dag | Etter splitten |
|---|---|---|
| `studioApi` | `setInspect(bool)` | `setMode('delivery'\|'strike')`. **Behold `setInspect` som tynn alias** (`setInspect(true)` → `setMode('strike')`) så E sin kode ikke knekker på versjonsskjeve mellomtilstander. |
| `host-studio.js` | `openStrikeInset()` | `setMode(m)` — navnet skal si modus, ikke panel |
| `steps.js` steg 4 | `enter: host => host.setActiveParam('low')` | + `host.setMode('delivery')` |
| `steps.js` steg 5 | `enter: host => host.setActiveParam('arc')` | + `host.setMode('strike')` |

**`rect('inset')` er den ene ikke-trivielle.** `studioZone()` bruker
`inset.right + gap` som venstrekant, og i DELIVERY etter alternativ 1 finnes
ingen inset. Minst inngripende løsning: la `rect('inset')` returnere en
nullbreddes rect ved **scenens venstre kant** når panelet ikke finnes. Da
degraderer `inset.right + gap` til `stage.left + gap` av seg selv, og
`steps.js` trenger ingen endring. Sonen blir 371 px i stedet for 194 (§12).

**`rect('lowPointMarker')` må fortsette å virke i BEGGE modi.** Den leser
`stage.dataset.lowPointMarker`, som canvas skriver. STRIKE-modus tegner også
lavpunktet (det gjør demoen), så kroken må skrives der òg — ellers faller
steg 5 sitt sonegulv tilbake til kontrollraden, og vi er tilbake i G-2.

### 13.2 · D115 må vurderes på nytt

D115 låser at steg 5 kjører med **kompakt** inset, og begrunnelsen er målt:
maksimert inset spente x 19–913 av 932 og etterlot null flate til coachmarken.
**Alternativ 1 opphever premisset** — det finnes ingen kompakt inset i STRIKE,
og D3b oppfylles i stedet av toppstripen, som bærer
`MID-IRON · HARDPAN 0 mm · DYNAMIC LOFT 31.0° [ASSUMED]`. D115 blir da hverken
oppfylt eller brutt; den blir uanvendelig. Raden bør omskrives i samme runde,
ikke stå som en regel om et panel som ikke finnes.

### 13.3 · Coachmark-sonen målt mot den splittede flaten

Målt på demoen, som HAR begge modi bygget. Metoden er canvasets alfakanal:
scenen er gjennomsiktig der den ikke tegner, så det høyeste sammenhengende
båndet med ~ingen blekk er nettopp der en ugjennomsiktig boks kan stå uten å
dekke noe. Terskelen er andel av raden som har blekk.

| Flate · modus | ≤2 % blekk | ≤10 % | ≤20 % |
|---|---:|---:|---:|
| landskap 568 × 320 · DELIVERY | **0** | **0** | **0** |
| landskap 568 × 320 · STRIKE | 0 | 55 px | 73 px |
| landskap 932 × 430 · DELIVERY | **0** | **0** | **0** |
| landskap 932 × 430 · STRIKE | 0 | 90 px | 127 px |
| portrett 390 × 844 · DELIVERY (scene 258) | 57 px | 77 px | 83 px |
| portrett 390 × 844 · STRIKE (scene 258) | 88 px | 139 px | 150 px |

Alle båndene ligger **øverst** i scenen.

Tre ting følger:

1. **Landskap DELIVERY har null tomme rader ved enhver terskel opp til 20 %.**
   Buens glødpass (18 px) sprer blekk over hele scenehøyden. En coachmark der
   dekker alltid noe. Det bekrefter uavhengig at E sitt valg — gulv ved
   low point-markøren framfor «finn tom plass» — var det riktige.
2. **STRIKE-modus har en ekte fri sone øverst**, i begge orienteringer.
   Steg 5 får altså en plassering steg 4 ikke har.
3. **Portrett gir sonen tilbake**, men bare hvis scenen får himmel — se 13.4.

### 13.4 · Portrettets scenehøyde — mot D118-gulvet

Demoen hadde en ekte feil her, funnet og rettet: portrettscenens høyde var en
flex-rest, så dekningsgrad og ledig bånd hvilte på et uhell. Høyden er nå et
eksplisitt valg i verktøylinja.

**Regnet om mot D118 (gulvet er 390 × 844; SE-klassen er utenfor garantien).**
Budsjettet er `844 − 54 topp − 148 kontroller = 642 px`, altså **562 px scene
med en 80 px meny**. Kontrollblokken er 148 px, ikke 96: portrett bryter
chip-raden i to rader à to, så det er chips 96 + slider 44 + luft. *(H sin
presisering §1.9, verifisert her.)*

| Scenehøyde | Fri sone DELIVERY | Fri sone STRIKE | Ledig under | Etter 80 px meny |
|---:|---:|---:|---:|---:|
| 115 px (samme verdensutsnitt som landskap) | 0 | 0 | 459 px | 379 px |
| 260 px | 57 px | 88 px | 314 px | 234 px |
| **380 px (standard)** | 142 px | 162 px | 194 px | 114 px |
| 520 px | 241 px | 249 px | 54 px | **−26 px** |

> **Tallene i denne tabellen er BRUTTO — uten safe-area. Netto tall står i
> §16.** Kort: trekk 47 px topp og 34 px bunn; scenens tak faller fra 502 til
> 421 px med en 80 px stripe.

*(Oppdatert etter at orb-raden flyttet ut av scenen — den koster 60 px.
Budsjettet er nå `844 − 54 topp − 60 orb-rad − 148 kontroller = 582 px`,
altså **502 px scene med en 80 px meny** mot 562 før. 520 px scene og
80 px meny går derfor ikke lenger sammen; frifeltet klipper framfor å
sprenge rammen, men plassen er borte.)*

**De tre nederste får plass med meny; 520 px gjør det ikke lenger.** Under
D118 er dette likevel ikke et plassproblem, men et spørsmål om hva scenen
*bør* være. H sin §1.9 sier
det samme fra sin kant: menyen knekker ingenting, den setter et tak.

**Og portrett åpner en mulighet landskap ikke har.** Målt i §13.3: i landskap
DELIVERY finnes **null** blekkfrie rader ved enhver terskel opp til 20 % —
en coachmark der dekker alltid noe. I portrett med en kort scenebåndhøyde
(115 px) er den frie sonen i scenen også null, men da står det **519 px ledig
under scenen** — nok til at coachmarken kan bo *utenfor* scenen og aldri dekke
noe som helst. Det snur D107-problemet på hodet.

Det er en endring av E sin plasseringsregel (E ankrer i dag i scenen), og
hører derfor til D107-omskrivingen som D116 alt legger i byggescopet — men det
er den eneste konfigurasjonen i hele matrisen der coachmarken kan være
ugjennomsiktig uten å skjule noe.

*(Parkert: tidligere regnestykker mot 320 × 568 — «98 px igjen, 18 px etter
80 px meny» — gjaldt SE-klassen og er ute av garantien med D118.)*

### 13.5 · Verifisering før splitten regnes som levert

Ut over portene i §7: E sin fulle sekvens kjørt manuelt —
Home → splash → enhetsskjerm → steg 1–3 (Ball Flight) → steg 4 (DELIVERY) →
steg 5 (STRIKE) → steg 6 (Connections) → Home — ved begge D59-ytterpunkter,
med kontroll på at (a) modusbyttet skjer i stegskriptet og ikke av brukeren,
(b) coachmarken verken går utenfor skjermen eller dekker toppstripens
avlesninger, low point-markøren eller strike-svaret, (c) SKIP og HOME
fortsatt avslutter (D102), og (d) `rect('lowPointMarker')` gir tall i begge
modi.

---

## 14 · Artifact-bygget — LEVERT og publisert

**Publisert 2026-08-26** av orkestrator:
https://claude.ai/code/artifact/48398cfd-b86f-47ab-a9c2-8bbc1ed81e2b

**Regenereres med én kommando** — `node tools/artifact-build/build.mjs`.
Se `tools/artifact-build/README.md`. Bygget er deterministisk (bit-identisk
over to kjøringer) og stopper selv hvis differensialtesten mot motoren finner
ett avvik, hvis det ligger igjen en ekstern referanse utenom Google Fonts,
eller hvis fila overstiger 16 MB. Artifact-en skal ALDRI håndredigeres —
endre `app/studio/split-demo.html` og bygg på nytt (S8). Demoen vil iterere
etter eierens valg, og det er nettopp derfor bygget er skriptet.

**D117: bygget legges i rot-katalogen `_artifacts/`, aldri i `app/`.**
Katalogen er unntatt fysikklinten, som den må være — en artifact inliner
motoren med vilje. Regelen kom av at en 1,79 MB forhåndsvisning lagt i `app/`
ga 49 falske lint-funn og rød rot-test 2026-08-26.

Tre ting bygget må løse, alle utredet:

1. **Selvstendighet.** Artifact-sider når ingen andre verter enn Google Fonts.
   Motoren og adapteren (ni moduler, 90 KB) bundles med **IIFE per modul** —
   ikke naiv konkatenering: fem navn kolliderer på tvers (`clamp`,
   `lowPointShiftPerDegree`, `faceCentreOffsetMm`, `assertFinite`,
   `magnitude`). Bundleren er skrevet og ligger i øktens scratchpad.
2. **Platene som `data:`-URI-er.** 6,3 MB rå blir ~8,4 MB base64 — under
   16 MB-taket, men unødig tungt. Nedskalert til faktisk visningsstørrelse
   (ball 256², køllehoder ~256 px høyde, turf og himmel 1024 px bredde) lander
   det på anslagsvis 600–800 KB. Målt behov: største køllehode i matrisen er
   172 px, største ball 72 px, så 256 px kilder har rikelig margin.
   Nedskaleringen kjøres gjennom nettleserens canvas (`drawImage` til mindre
   canvas → `toDataURL`); Node har ingen bildebehandling innebygd.
3. **`tokens.css` inlines** — den lastes i dag med `<link rel="stylesheet">`
   fra `../tokens.css`.

---

## 15 · Eierens tre retninger på portrettflaten (2026-08-26)

Gitt direkte på skjermbildet av portrettrammen. To utført som bedt om; den
tredje målt fram som en felle før den ble utført.

### 15.1 · HOME ut av portrett

Eieren: «Home kan fjernes siden menyen kommer der.» Utført, men **skopet til
portrett**: der bærer menyen modulnivået. I landskap står HOME-sirkelen, fordi
H §5 slår fast at landskap ikke får bunnmeny og at sirkelen der ER
menyåpneren. Toppstripen i portrett er nå `ATTACK ANGLE · CLUB PATH · RESET`.

**Melding, ikke demoatferd:** dette rører N-a/N-b («tilbakeveien forsvinner
aldri bak en rotasjon»). I portrett er veien ut nå menyen, ikke sirkelen. Det
skal låses som N-a/N-b-revisjon i H-runden — orkestrator har ført det i kø.

### 15.2 · Buen: høyde er ikke det som forstørrer den

Eieren ba om mer vertikal plass til svingbuen. Målt først, og leveren er en
annen enn den ser ut til:

**Buen stiger 77 px uansett scenehøyde** — 260 px scene gir 77 px bue (30 %
av scenen), 380 gir 77 px (20 %), 520 gir 77 px (15 %). Mer høyde gir bare mer
tom himmel. Årsaken: den vertikale skalaen henger på scenens **bredde**
(`scale = W / winM`); høyden flytter kun bakkelinjen nedover.

Det som gjør buen lesbar er den **vertikale forsterkningen** — mockens
hybrid-gain `PED_K`. Målt ved 380 px scene:

| Forsterkning | Buens høyde | Andel av 380 px scene |
|---|---:|---:|
| 1.7× (mocken) | 77 px | 20 % |
| 3× | 117 px | 31 % |
| 5× | 180 px | 47 % |
| 8× | 268 px | 71 % |

**De to henger sammen:** ved 8× trenger buen 268 px, så en 260 px scene
klipper den (viser 183). 380 px er den minste scenen som rommer 8× helt.
Høyden er altså det som gir forsterkningen **rom**, ikke det som forstørrer
buen.

Bygget som et **valg** i demoens verktøylinje, med mockens 1.7 som urørt
standard: `PED_K` er eierens mock-beslutning, og kontaktbåndet skal uansett stå
1:1 i mm (`PED_Z0`) — det er armene som forsterkes, aldri målesonen.
Standard scenehøyde er hevet til 380 px.

*(Selvkorreksjon: en første måling oppga 12 px. Den målte det flate
kontaktbåndet i midten, ikke hele buen. Riktig tall er 77 px; konklusjonen —
at høyde ikke endrer buen — står uendret.)*

### 15.3 · Perspektiv- og kølleorben ut av scenen

Eieren: «vurder å flytt perspektivendring og jernbytte et annet sted siden vi
har mye plass». Utført i portrett: DTL- og kølle-orbene står nå i egen rad
mellom scenen og chipsene — «hva ser jeg på» over «hva endrer jeg». Scenen blir
ren, som er hele D109-motivet. I landskap blir de i railen, der høyden er det
knappe godet.

**Kostnad, målt:** orb-raden er 60 px og tas fra scenens tak. Se den
oppdaterte tabellen i §13.4.

### 15.4 · Størrelseslisten flyttet til D118-gulvet

Med 380 px scene og orb-raden falt tre matrisetilstander ved 320 × 568 — SE-
klassen, som D118 la utenfor garantien. Demoens portrettliste hang etter det
låste gulvet og starter nå **på** det: 390 × 844 (gulv) · 402 × 874 ·
430 × 932. Alle atten tilstandene passerer igjen.

---

## 16 · Safe-area — grunnlaget for §13.4 og §15, sagt eksplisitt

H spurte om budsjettene mine var brutto eller netto. Svaret var **brutto**, og
det gjorde dem 81 px for optimistiske. Rettet, og simuleringen er nå bygget inn
i demoen så feilen ikke kan gjentas.

**Svar på H sine to spørsmål:**

1. **844-grunnlaget var RÅ CSS-px, ikke fratrukket insets.** Demoens rammer er
   rene `div`-er med `height: 844px` satt i JS; det finnes ikke ett eneste
   `env(safe-area-inset-*)` i `split-demo.html`. Den EKTE flaten håndterer dem
   (`body` får `padding-top: env(safe-area-inset-top)`, `.controls` får
   `calc(96px + env(safe-area-inset-bottom))`) — demoen gjorde ikke det.
2. **«80 px meny» var stripen ALENE**, uten inset. `menubar` var en `div` med
   `height: st.menu`. H sin regning er altså riktig: en 56 px stripe okkuperer
   90 px på 390 × 844-klassen.

### Nettotall ved 390 × 844 (topp 47 pt · bunn 34 pt)

Bunninsettet bæres av det **nederste** kromet — menyen når den finnes, ellers
kontrollraden. Aldri begge; det ville telt insettet to ganger.

| | Scene 260 | Scene 380 (standard) | Scene 520 |
|---|---:|---:|---:|
| Ingen meny (kontroller 148 + 34 = 180) | 235 px ledig | **115 px ledig** | over med 43 |
| 56 px stripe → 90 px totalt | ~181 px ledig | ~61 px ledig | over |
| 60 px stripe → 94 px totalt | 173 px ledig | 53 px ledig | over med 105 |
| 80 px stripe → 114 px totalt | 153 px ledig | 33 px ledig | over med 125 |

**Scenens tak, netto:** 503 px uten meny · **445 px med H-a sin 56 px-stripe**
· 441 med 60 px · 421 med 80 px. §15 oppga 502 med 80 px meny — det var
bruttotallet, og differansen er nøyaktig de to insettene (47 + 34 = 81).

**Konklusjonen står, med tynnere margin:** standardvalget 380 px scene får
plass i alle menyvariantene — 61 px ledig med H-a, 33 px med en 80 px stripe.
520 px scene får ikke plass i noen av dem, heller ikke uten meny.

### Treffflatene overlever insettet (H sitt §T8-spørsmål)

Bunninsettet bæres som **padding på kromboksen**, som VOKSER — det krymper
ikke treffraden. `.controls` har ingen fast høyde i noen orientering, chipsene
har `min-height: 44px` og sliderzonen er `flex: 0 0 44px`, så padding legger
seg utenpå innholdet i stedet for å spise det. Målt med meny av:

| | Kontrollboks | Chip | Slider | Range-flate | Minste treffflate |
|---|---:|---:|---:|---:|---:|
| portrett, safe av | 148 px | 44 | 44 | 44 | **44** |
| portrett, safe på | **180 px** | 44 | 44 | 44 | **44** |
| landskap, safe av | 96 px | 44 | 44 | 44 | **44** |
| landskap, safe på | **128 px** | 44 | 44 | 44 | **44** |

Orbene: 52 px i portrett, 46 px i landskap — begge over 44. Ingen dobbel
padding noe sted; `padding-bottom` er 34 px computed i begge safe-på-tilfellene.

### Simuleringen er bygget inn

Verktøylinja har nå «Safe-area (390×844-klassen): av (brutto) / 47 · 34 pt».
Under byggingen tok jeg først feil av retningen — padding inni en fast
stripehøyde gjorde at insettet ble spist av stripen i stedet for lagt til den,
altså det motsatte av H sitt poeng. Rettet: insettet legges til, så en 60 px
stripe måler 94 px og en 80 px stripe 114 px.

---

## 17 · D128–D130 innarbeidet — tre mocker av køllevalgets plass

Eierens G-valg er tatt: **alternativ 1 MODUS**, bryteren er **pillen inne i
canvasen**, raden under canvasen bærer **kun køllevalget**, lie er
**kontekstordet** (D129), og splitten bygges **i landskap først** (D130).

### 17.1 · Hva som er bygget om i demoen

- **STRIKE-orben er fjernet.** Modusbyttet skjer med pillen i canvasen (D128).
  Sammenligningen orb-mot-pille er dermed avviklet — den er avgjort.
- **Railen er redusert til kamerakontrollen** (se 17.3).
- **Raden under canvasen bærer køllevalget**, i tre varianter (17.2).
- Lie-kontekstordet står uendret fra §10, nå låst som D129 inkludert
  regelen om usynlig utvidet treffsone.

### 17.2 · De tre variantene, side om side

| | Hva den gjør | Hva den koster |
|---|---|---|
| **1 Segmentrad** | `DRIVER · 3-WOOD · MID-IRON` alle synlige, ett trykk, ingen sykling | Hele radens bredde. Til gjengjeld ser man hva som finnes uten å trykke |
| **2 Raden utgår** | Radens 60 px går til scenen (380 → 440 px målt); kølla blir en femte celle i kontrollraden, nøytral fordi den er kontekst og ikke leveringsparameter | Parameterraden får en gjest — chip-grammatikken (chips = parameter) tøyes |
| **3 Kølle + kontekst** | Kølla til venstre, stille avlesning til høyre: `DYNAMIC LOFT 31.0° [ASSUMED] · HARDPAN 0 mm` | Ingen høyde spart. Men D65/D3b-konteksten flytter HIT, og strike-kortet bærer da **bare svaret** — målt: `PURE · 1.0 mm low` mot variant 1s fulle kontekstlinje |

Variant 3 er den eneste som gjør noe med **ett svar per panel** (D81):
strike-kortet slutter å bære fire opplysninger og bærer én.

### 17.3 · DTL-kontrollen — FORSLAG, ikke vedtatt

Kameraet blir stående **på scenen**, i motsatt hjørne av pillen. To grunner:
Mobbin-presedensen H fant (T1-c: perspektivkontroller sitter på det de endrer
perspektiv på), og at raden under nå er reservert køllevalget (D128).
Alternativet — kamera sammen med kølla i raden — ville blandet «hva ser jeg
på» med «hva spiller jeg med». Merket som forslag i demoen.

### 17.4 · Funn: pillen brøt 44 px-kravet

Da pillen flyttet inn i canvasen på alle rammer, falt **alle atten**
matrisetilstandene. Ingen kolonne viste «nei» — det var treffflaten:
**pillens knapper er 32 px**, under kravet i DESIGN.md og spec 03 akk. 9.
Den var der før også, men bare i den ene sammenligningsrammen, så matrisen
så den aldri.

Løst med samme teknikk eieren nettopp låste for lie-ordet i D129: **usynlig
utvidet treffsone**. Pillen er visuelt 32 px — riktig vekt over en scene — og
treffer 44. Verifisert med `elementFromPoint`: treff ±21 px fra midten, canvas
utenfor.

**Generalisert og låst som D132:** enhver kontroll som med vilje er visuelt
lettere enn 44 px får usynlig utvidet treffsone — **verifisert med måling
(`elementFromPoint`), aldri antatt.** Visuell vekt og treffflate er to
uavhengige beslutninger. D129 formulerte regelen for lie-ordet; pillen var
tilfelle nummer to på to dager, og to tilfeller på to dager er en klasse.
