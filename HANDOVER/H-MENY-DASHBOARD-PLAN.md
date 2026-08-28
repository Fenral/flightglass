# Strøm H — plan for meny + dashboard (D110 / D111)

**Status: PLAN, ikke bygget.** Ingenting er rørt i `app/`, `adapter/` eller
`engine/`. Leveres til eier via orkestrator per PROTOKOLL.md. Samordnes med
strøm G før noen av oss bygger (D111).

---

## Kontekst — hva som skal avgjøres

D110 gjenåpnet navigasjonen. Eieren vil ha **en meny** (bunnmeny-retning,
uxpeak-referansen) og **et dashboard der korrelasjoner inngår, gjerne under
folden** — med D109 sitt motiv i bunn: mindre samtidig innhold på skjermen.
D96 sier eieren ikke er fornøyd med noen av dagens to Home-flater.
Retningen er **portrett-først**: portrett er hovedverdenen, landskap en
valgfri rotasjon på Studio-flatene.

Det som gjør dette til én sentral beslutning og ikke sju små (D111): en meny
er permanent krom på **hver** flate. Den treffer Ball Flights inputkort,
Studios landskap, Connections' nodekort og E sine coachmarks samtidig.

Alt under er målt på de leverte flatene på `http://localhost:8321/app/` før
det ble foreslått. rAF er strupet når panelet ikke komponerer (samme forbehold
som G og E), så canvas-innhold er lest fra kilde/DOM-datasett; alle DOM-tall er
`getBoundingClientRect`.

**Etterkontroll 2026-08-26:** G meldte i §12 at nettleserpanelets
`resize_window` ikke alltid leverer et `resize`-event, så en måling kan bli
stående fra forrige størrelse. De to mest bærende tallene mine er kjørt om
igjen med manuelt utsendt `resize` før avlesning: Ball Flight ved 375 × 667
(619 / 616 / 283 / 227 / 203) og Connections-velgeren (638 px innhold,
27 / 31 / 51 px overflyt ved 56 / 60 / 80 px meny). **Begge reproduserer
identisk.** Tallene i §1.3 og §1.4 står. Studio-tallene i §1.5 var allerede
uavhengig bekreftet mot G §1.

---

## 1 · Målingene

### 1.1 · Hvilke flater finnes egentlig

`app/nav/index.html` lister seks destinasjoner. Tre av dem er `href="#"`:

| Destinasjon | Fil | Status |
|---|---|---|
| Ball Flight | `app/ball-flight/impact.html` | bygget |
| Impact Studio | `app/studio/index.html` | bygget |
| Connections | `app/connections/index.html` | bygget |
| D-plane · Ask · Settings | — | **`#`. Finnes ikke.** |

Spenningen «uxpeak maks 5 faner mot sju flater» er altså mindre akutt enn
den ser ut: i dag er det **fire** flater inkludert Home. Settings er dessuten
en åpen gjeld (D27 krever den, D103 utsatte den eksplisitt).

### 1.2 · Ordbreddene — der spenningen faktisk bor

Målt i den ekte fonten (Geist 10 px / 700 / `0.1em`, `document.fonts` = loaded):

| Ord | px | | Ord | px |
|---|---:|---|---|---:|
| HOME | 34.1 | | BALL FLIGHT | 73.2 |
| FLIGHT | 40.5 | | IMPACT STUDIO | **90.5** |
| STUDIO | 43.4 | | D-PLANE | 51.4 |
| CONNECTIONS | **84.9** | | SETTINGS | 57.4 |
| MORE | 34.0 | | ASK | 23.5 |

Fanebredde ved 375 px (SE, minste portrettflate) med 8 px sidemarg:
**fire faner = 89.75 px · fem faner = 71.8 px.**

> **`IMPACT STUDIO` (90.5 px) får ikke plass i en firefanet ordmeny ved
> 375 px. Den bommer med 0,75 px.** Samme klasse funn som G sin 1 px
> chip-slakk — spenningen mellom uxpeak-tips 8 («korte etiketter») og
> DESIGN.md sin «intet ikon står alene» er ikke filosofisk, den er 0,75 px.

Forkortet sett (`HOME · FLIGHT · STUDIO · CONNECTIONS`) passer: bredeste ord
84.9 i 89.75 px = 4,9 px total luft ved 375, 8,6 ved 390, 18,6 ved 430.

**Fem faner er umulig ved 375 px så lenge ordet er `CONNECTIONS`** (84.9 mot
71.8 px slot). Et femfaners oppsett krever nytt ord for modulen i krom
(f.eks. `MAP`, 25.8 px) eller ulike faneflatebredder.

### 1.3 · Ball Flight (390 × 844 og 375 × 667)

| | 390 × 844 | 375 × 667 |
|---|---|---|
| Toppstripe | 48 px — **inneholder kun HOME** | 48 px |
| Stage | 796 | 619 |
| Panel, hviletilstand | 370 × 160, `bottom: 10` | 160 |
| Panel, «Change input» | 370 × **323** | 323 |
| Scene over panel, hvile / input | 626 / 463 | 449 / **283** |

`.app` er flex-kolonne, `#stage` er `flex: 1 1 auto`, `#panel` er
`position: absolute; bottom: 10px` inne i stagen. En bunnstripe injisert som
flex-søsken krymper stagen, og panelet følger med opp.

**Målt ved 375 × 667, input-panelet åpent — ingen klipping ved noen høyde:**

| Bunnmeny | Stage | Scene over panel |
|---:|---:|---:|
| 0 | 616 | 283 |
| 56 | 560 | 227 (−20 %) |
| 60 | 556 | 223 |
| 80 | 536 | 203 (−28 %) |

**Og en tilbakebetaling som er målt, ikke antatt:** toppstripen inneholder
bare HOME. Fjernes HOME, kollapser stripen fra 48 → **8 px** i
utfallstilstanden. Med en 56 px bunnmeny blir stagen da **603 px mot 619 i
dag — netto −16 px, 2,6 %.**
Forbehold: i linsemodus holder en egen regel
(`body.sa-shell-ready[data-range-lens=…] .topstrip`) stripen på 48 px
uavhengig av HOME, så i inputtilstanden betales hele menyhøyden. Å kollapse
den stripen også er en egen endring, ikke en bivirkning.

### 1.4 · Connections (375 × 667)

**Hviletilstanden er metrikkvelgeren** (låst lesemodell). Målt:
innhold **638 px** mot 667 px flate — passer i dag med 29 px slakk.

> **Under enhver bunnmeny slutter Connections' hviletilstand å passe:**
> 56 px → 27 px overflyt · 60 px → 31 px · 80 px → 51 px. Velgeren begynner
> å rulle.

Kjedevisningen: `cx-top` 60 px · `#diagram-scroll` 396 px ·
**`#node-card` 211 px, flush mot nederste skjermkant.** Diagraminnhold per
metrikk, og hvor mange som ruller:

| Metrikk | Innhold | 0 px | 60 px | 80 px |
|---|---:|:--:|:--:|:--:|
| Landing Angle | 291 | passer | passer | passer |
| Curve | 335 | passer | passer | **ruller** |
| Backspin | 335 | passer | passer | **ruller** |
| Apex | 411 | passer | **ruller** | ruller |
| Total | 531 | **ruller** | ruller | ruller |
| Carry Side | 575 | **ruller** | ruller | ruller |

Altså: kjedevisningen ruller allerede for de lange kjedene. En meny utvider
en eksisterende oppførsel; den innfører ingen ny feilklasse der. Velgeren er
det som faktisk brytes.

HOME-sirkelen er `position: fixed` på (8, 8), z 10, og peker fortsatt på
`../nav/index.html` — E sin meldte gjeld, bekreftet.

### 1.5 · Impact Studio

**568 × 320 reproduserer G §1 eksakt:** top 54 · stage 548 × 170 ·
inset 175 × 111 på (19, 63) · rail 140 × 44 på (412, 60), liggende oppå
scenen · controls 96 (chips 44 + slider 44) · fem chips à 103 px.
G sine tall i §9 er dermed etterprøvd og legges til grunn uendret.

**390 × 844 portrett:** `.rotate` er `position: fixed`, fullskjerm, z 60 —
rotasjonsoppfordringen, med HOME i seg. **Bak den legges flaten faktisk ut i
portrett, og fire av fem chip-etiketter er ellipsert:**

| Etikett | trenger | har |
|---|---:|---:|
| SWING DIRECTION | 95 | 58 |
| BALL POSITION | 79 | 58 |
| SWING PLANE | 72 | 58 |
| ARC HEIGHT | 63 | 58 |

Et levende D64-brudd på portrettstien, konsistent med G §11: kontrollraden er
en egen designoppgave per orientering, ikke en rotasjon.

**Toppstripen i Studio bærer HOME + ATTACK + CLUB PATH + RESET.** Å fjerne
HOME frigjør 44 px **bredde**, ikke høyde. Landskap er kort på høyde. Det er
den strukturelle grunnen til at landskap må ha et annet menysvar enn
portrett — ikke en smaksdom.

### 1.6 · Home i dag (375 × 667)

`main#homeMain` er `position: fixed`, `overflow: auto`, vindu **599 px**,
innhold **863 px**.

> **Home ruller allerede: 1,44 folder, 264 px under folden i dag.**
> Med 56 / 60 / 80 px meny: 1,60 / 1,63 / 1,66 folder.

Eierens «siden kan være under the fold» er altså allerede formen på Home.
Det som mangler er at innholdet under folden er et dashboard.

**Og korrelasjonene på Home i dag er nøyaktig det eieren sa irriterte ham.**
`app/home/connections-map.js` tegner **hele grafen samtidig**, med en
«All»-knapp som gjenoppretter full visning og en segmentbryter
`What shapes it / What it shapes`. Det bryter to låste setninger i
`CONNECTIONS-BESKRIVELSE.md`: «Ikke vis alle noder samtidig — heller ikke som
zoom ut-modus» og «Kartet navigerer ALDRI forover» (forover finnes kun som én
tekstlinje).

Verre: kartet er en **andre implementasjon av grafen**.
`app/connections/graph-data.js` er mekanisk avledet fra
`connections-graph-v2.json` (D47) og har `_meta.source: "connections-map.js"`
— altså er Home-kartet forfaren. Etter D47 har fasiten 24 noder;
**Home-kartet har 23 og mangler `verticalspinloft`**, og beskriver Spin Loft
med den setningen D47 rettet. To sannheter om samme modell er feilklassen
prosjektet finnes for å drepe.

### 1.7 · E sin onboarding tåler en meny strukturelt

`app/onboarding/steps.js` hardkoder ingen piksler. All plassering måles i
kjøretid: `above(rect)`, `between(topEdge, bottomEdge)`, `studioZone(host)`.
`applyPlacement` klemmer boksen inn i sonen og lar den **rulle** framfor å
vokse ut (D114-rettelsen).

Konsekvens, og den er god: skyver en bunnmeny vertens rects oppover, følger
coachmarken automatisk med. `above()` regner `bottom: innerHeight - rect.top
+ gap`, så boksen legger seg over panelet og menyen under. **Ingen overlapp
ved konstruksjon.** Eneste risiko er at en sone blir for lav og boksen ruller.

Den risikoen er reell **kun i landskap**: med 80 px permanent meny er Studios
stage 90 px (G §9), og `studioZone` sitt tak blir tilsvarende lavt. Det er et
selvstendig argument for landskapssvaret i §4.

### 1.9 · Portrett-Studio — målt på G sin demo etter G §13.4

G ba H se tallet «98 px igjen under scenen ved 320 × 568». Jeg målte det selv
på `app/studio/split-demo.html`, portrett, fire chips i **to rader**:

| Ved 320 × 568 | Topp | Scene | Kontroller | Ledig under kontrollene |
|---|---:|---:|---:|---:|
| Scene 115 px | 54 | 115 | 148 | **251 px** |
| Scene 260 px | 54 | 260 | 148 | **106 px** |
| Scene 380 px | 54 | 380 | 148 | **−14 px — flyter over alt uten meny** |

Tre ting følger, og de endrer historien:

1. **Kontrollblokken er 148 px, ikke 96.** Portrett bryter chip-raden i to
   rader à to (G §11), så blokken er chips 96 + slider 44 + luft. Det er
   *den*, ikke menyen, som er den bindende kostnaden ved 320 × 568: en 380 px
   scene får ikke plass der selv med null krom.
2. **Menyen bryter ingenting — den setter et tak på scenehøyden.**
   Maks scenehøyde ved 320 × 568: **366 px uten meny · 310 px med 56 px meny ·
   286 px med 80 px meny.** G sitt valgte 260 px ligger godt under alle tre.
3. **Chip-etikettene er hele i portrett.** `SWING DIRECTION` måler 95 px i et
   146 px chip — ingen ellipse, ingen D64-fare. Det er landskapets ene rad
   som er trang, ikke portrettets to.

Ved **375 × 667** — den minste portrettflaten jeg ellers har målt mot — er
taket **409 px med 56 px meny**. Forskjellen mellom de to portstørrelsene er
99 px scene, og det er nok til at spørsmålet må stilles: se **H-j**.

### 1.8 · Tredje uavhengige kilde mot en bunnmeny

`app/shared/sa-app-shell.css`, linje 2–3, mockens eget skall:

> «Home owns navigation. Tool routes keep only orientation, entitlement and a
> single explicit Home exit, so no persistent bar consumes the canvas.»

Mocken kom altså til samme konklusjon som N-a, uavhengig. Sammen med
00-FELLES-funnet (verifisert mot AllTrails, Moonlitt, Tide Guide,
FocusFlight, Weather) er det **tre uavhengige kilder** som sier nei til
permanent bunnkrom. Eieren skal vite det før han velger — og planen svarer
på det i §2, ikke rundt det.

*(Sidefunn: `sa-app-shell.js` bærer en død rutetabell — `home/range/studio/
jarvis` mot `../impact-studio/impact-studio.html` og `./jarvis.html`, filer
som ikke finnes. Den er mockarv og må ikke gjenbrukes som menyens rutekilde.)*

---

## 2 · Svaret på N-a — argument for argument

D111 krever at det nye vedtaket svarer på det gamle, ikke overser det.

**N-a §1 · «Modulbytte går via Home. To trykk er akseptert fordi en sesjon
lever inne i én modul.»**
Premisset er eierens eget å endre, og han har endret det: et dashboard er
per definisjon en flate man **vender tilbake til**. Returfrekvens går fra
biprodukt til designmål. Et kostnadsestimat avledet av et premiss som ikke
lenger gjelder er en slutning, ikke en lov. Merk også at N-a avviste
modul-pillen fordi «en dropdown er en meny = to trykk = samme kostnad som
hub, med permanent krom i tillegg». En fanerad er ikke en dropdown: fire
synlige mål, **ett trykk**. Byttet er ærlig — bunnmenyen vinner på trykk og
taper på piksler, og det valget er eierens.

**N-a §3 · «Permanent krom = 1 936 px². Tak 3 872 px². 0 px sammenhengende
barer, ingenting permanent langs bunnkanten.»**
Regnestykket, uten pynt: en 56 px meny på 375 px bredde er **21 000 px²** —
10,8 × taket. Trekker man fra HOME-sirkelen den erstatter (1 936 px²) er
netto **+19 064 px²**, altså 8,4 % av en 375 × 667-flate. I Ball Flights
utfallstilstand hentes 2,6 % tilbake ved at toppstripen kollapser (§1.3).
**Dette tallet må omgjøres eksplisitt.** Alle tre retningene under gjør det —
og alle tre **beholder N-a §3 uendret i landskap**, der argumentet er
sterkest og plassen faktisk er knapp.

**N-a §2 / §4 · «Tilbakeveien forsvinner aldri bak en rotasjon.»**
Holdes bokstavelig i alle tre retningene: i landskap står HOME-sirkelen der
den alltid har stått, også på rotasjonsoppfordringen.

**00-FELLES-funnet · «Flater der visualiseringen ER innholdet bruker ikke
bunnfelt.»**
Dette funnet **overlever** — det blir ikke omgjort, det blir *skopet*.
Funnet handler om flater der scenen eier hele skjermen: Studios bue,
Ball Flights bane i full høyde. Det er ikke et funn om et dashboard.
I portrett eier scenen allerede ikke bunnkanten — Ball Flights panel er
160/323 px der, Connections' nodekort er 211 px flush mot kanten. Menyen
konkurrerer altså med et bunnark som allerede finnes, ikke med scenen.
I landskap, der scenen faktisk eier flaten, sier alle tre retningene nei til
bunnkrom. **Funnet blir håndhevet, ikke overkjørt.**

**Grammatikken (sirkel = modul, pille = tilstand).**
Menyen er en tredje form. Reglene 1 og 2 overlever uendret; tabellen får en
rad og én ny regel:

| Form | Nivå | Betyr |
|---|---|---|
| Sirkel i hjørne | modul | forlate/bytte flate — **kun landskap** |
| **Menycelle** | **modul** | **bytte flate — kun portrett** |
| Pille | tilstand i modulen | bytte hva flaten viser |

> **Ny regel 6: modulnivå har nøyaktig én form per orientering.**
> Portrett: menycellen. Landskap: sirkelen. Aldri begge samtidig.

---

## 3 · De tre retningene

Alle tre er portrett-først, alle tre bruker **ord, ikke ikoner alene**
(DESIGN.md-ikonografien og N-b vinner over uxpeak-tips 7/10; tipsenes
*hensikt* — gjenkjennelighet og lite kromstøy — leveres av ord i
label-typografi).

---

### H1 — FANERAD (4 ord) · Home er dashboardet  *(anbefalt)*

**Menyens innhold og form.**
Permanent bunnrad i portrett, **56 px + `env(safe-area-inset-bottom)`**,
44 px treffrad. Fire celler à 89.75 px ved 375 px:

```
HOME          FLIGHT        STUDIO        CONNECTIONS
```

Rekkefølgen er N-g sin (00-FELLES-modultabellen), forkortet. Aktiv celle:
`ink`-tekst + 2 px `primary`-strek i cellens overkant. Inaktiv: `ghost`.
Aktivfargen er bevisst **ikke** `primary`-tekst: Ball Flights «Change input»
er allerede `primary`, og to primærflater per skjerm bryter hierarkiregelen.
Fargen forsterker; posisjon + streken bærer (D10). Menyen skilles fra
innholdet med `line` 1 px + `plate`-flate (uxpeak-tips 14/15/16).
D-plane, Ask og Settings er **ikke** faner — de er dashboardinnhold og
deep-links. Det er uxpeak-tips 1 anvendt: menyplass er prioritering.

**Dashboardet.**
Home blir dashboard. Første fold er **én ting**: dagens slag, sagt én gang —
`CARRY · SIDE · CURVE` fra motoren (Home er allerede motorkoblet), med
modellgrense-setningen som allerede står der (`.home-truth`).
**Under folden** ligger korrelasjonsbåndet: **én kjede om gangen**, bakover,
for en metrikk brukeren har festet (standard `Curve`, byttes via
Connections' egen velger og huskes i `localStorage`). 4–6 noder, aldri
grafen. Kjeden leses fra `graph-data.js` — den korrigerte D47-fasiten — og
et trykk åpner samme kjede i Connections. Under den igjen: Settings, og Ask
og D-plane når de finnes.
Dette er D109-motivet anvendt på Home: én ting i første fold, resten under.

**Konsekvens per flate.**

| Flate | Hva som skjer |
|---|---|
| **Ball Flight** | HOME-sirkelen fjernes; toppstripen kollapser 48 → 8 i utfallstilstanden. Netto høydekost 16 px (2,6 %) der, full 56 px i inputtilstanden (scene over panel 283 → 227). Ingen klipping ved noen målt størrelse. |
| **Studio** | **I landskap: ingenting endres** (se G-e under). **I portrett** arver Studio portrettregelen som alle andre flater — og konsekvensen er nå målt (§1.9): menyen bryter ingenting, den setter et **tak på scenehøyden**. Ved 320 × 568 er taket 310 px med 56 px meny, mot 366 uten; ved 375 × 667 er det 409 px. G sitt valgte 260 px ligger under begge. Kontrollblokkens 148 px er den bindende kostnaden der, ikke menyen. |
| **Connections** | Velgeren — hviletilstanden — slutter å passe ved 375 × 667 (638 mot 611). Løses i **H-f**. Kjedevisningen: to flere av seks målte metrikker begynner å rulle. Nodekortet beholder sin plass over menyen. HOME-sirkelen fjernes i portrett; `../nav/`-lenken dør med `nav/`. |
| **Onboarding (E)** | Plasseringen er kjøretidsmålt og følger med av seg selv (§1.7). Menyen er **synlig og levende**, og et trykk **avslutter onboardingen som hopp, så navigerer** — nøyaktig D102-regelen for HOME-sirkelen, og E sitt eget funn 4 («HOME var en felle»). Steg 4–5 i landskap er uberørt. D112(e) får en søsterklausul. |
| **Home / `nav/`** | `app/nav/` slettes (D96 sitt åpne punkt). `app/home/` er flaten. Studios og Connections' HOME-lenker dør med sirkelen i portrett; i landskap peker de på `home/`. Døde hub-oppføringer (`#`) fjernes. |

**G-e — menyens oppførsel når Studio står i landskap.**

> **I landskap finnes bunnmenyen ikke. Funksjonen bæres av HOME-sirkelen
> øverst til venstre — samme 44 × 44 kontroll N-a spesifiserte — som åpner
> menyen som et ark over scenen. Ingenting permanent langs bunnkanten.**

Regelen henger på **orienteringen, ikke modulen**. Det er nettopp derfor den
tåler begge utfall av G sin portrettmåling: går Studio portrett, fyrer regelen
aldri for Studio og ingenting må bygges ned; blir Studio i landskap, fyrer den
akkurat der. Én setning dekker begge.

Hva den koster G: **null.** Stagen beholder sine 170 px ved 568 × 320,
stance-etikettene på `gy + 26` er urørt, `studioZone` beholder gulvet sitt
(`marker.top` / `controls.top`), og E sine målte steg 4/5-plasseringer står.
Permanent krom i landskap forblir 1 936 px² — N-a sitt eget tall, uendret.

Merk at dette er **strengere** enn G sin egen anbefaling (auto-skjul med
kant-hint): en hint-stubbe langs bunnkanten er fortsatt permanent bunnkrom,
og den inviterer en kantgest — som N-a avviste på OS-gestkollisjon, og som i
Studio ville ligget rett på sliderzonen (y 274–318 ved 568 × 320). Hjørnet
finnes allerede i hver modul og koster ingen nye piksler.

**Låste beslutninger som må omgjøres.**

| # | Endring |
|---|---|
| N-a §1 | Modulbytte skjer i krom, ikke via Home. Deep-link-regelen består. |
| N-a §3 | Kromtaket omgjort **for portrett**; nytt tall settes (§6, H-a). Holdes uendret i landskap. |
| N-a rule 4 | HOME-sirkelen finnes kun i landskap. |
| N-a grammatikk | Ny form + ny regel 6 (§2). |
| N-b | Består, men skopes til landskap. |
| N-f | Home viser ikke lenger appnavnet over en modulliste — modullisten finnes ikke. Ny identitetslinje avgjøres i dashboardarbeidet. |
| D96 | `app/nav/` slettes; landingslenken flyttes til `app/home/`. |
| D107 | Skrives om uansett (G/E). Landskapssonen er uendret av menyen; portrettstegene 1–3 og 6 får en menyklausul. |
| D112(e) | Får søsterklausul for menyen (H-d). |
| D110 | Lukkes av vedtaket. |

**Kostnad:** lav–middels. Én delt menykomponent + ruter, fjerning av tre
HOME-sirkler, Home ombygd til dashboard, Connections-velgeren omarbeidet.
**0 linjer i `engine/`, 0 i `adapter/`.** Én skjerm mindre i Swift-porten
(`nav/` forsvinner).

---

### H2 — ANKER + ARK · ingen Home-flate; dashboardet **er** menyen

**Menyens innhold og form.**
Samme 56 px bunnrad i portrett, men fire celler med en annen betydning:

```
FLIGHTGLASS   FLIGHT        STUDIO        CONNECTIONS
   (anker)
```

`FLIGHTGLASS`-cellen er ikke en destinasjon — den **drar dashboardet opp**
som et ark over gjeldende flate. Eierens «siden kan være under the fold»
leses her helt bokstavelig: dashboardet er under folden *av menyen*.

**Dashboardet.**
Arket er dashboardet, tilgjengelig fra hvilken som helst flate uten å
forlate den.

> **Eierregel som treffer H2 alene (2026-08-26): «dashboardet skal aldri ha
> innhold i Studio — det bor på Home.»** H1 og H3 oppfyller den uten videre.
> **H2 må deklarere seg mot den:** arket kan hentes opp over Studio, og det ER
> dashboardinnhold vist over Studio — om enn som forbigående overlegg brukeren
> ba om, ikke som layouthøyde som konkurrerer med scenen. Enten godtar eieren
> det skillet (overlegg ≠ innhold), eller så må H2 sperre arket i Studio — og
> da mister H2 nettopp det som gjorde retningen reelt annerledes. **Dette må
> avgjøres før H2 kan velges.** Første høyde: dagens slag. Dras det høyere: de **fem
leveringsinputene** som en rad med «what each shapes» som én tekstlinje per
input — struktur på lagnivå, aldri grafen. Trykk går til Connections' kjede.
Nederst: Settings.

**Hva som gjør den reelt annerledes:** Home som skjerm **slettes**.
D96 sitt problem — to Home-flater, ingen god nok — løses ved fjerning i
stedet for redesign.

**Konsekvens per flate.** Som H1 for Ball Flight, Studio og Connections.
Forskjellene:

- **Onboarding:** D96 sitt anker forsvinner. Onboardingen starter og lander i
  `app/home/` i dag; uten Home må ankeret flyttes (til Ball Flight, som er
  D60-standardslagets hjem). Det er en ekte kostnad som må vedtas, ikke en
  detalj — E sin sekvens, «?»-restarten (D112b) og DONE-landingen henger alle
  i det ankeret.
- **`app/home/` og `app/nav/`** slettes begge; arket erstatter dem.

**G-e.** I landskap kollapser raden til **ankercellen alene**, dokket nede
til venstre som en 44 px pille; arket åpnes derfra og legger seg over scenen.
Permanent landskapskrom: 1 936 px² — N-a sitt tall, men i bunnkanten i stedet
for hjørnet. Tåler begge utfall av G sin måling av samme grunn som H1
(regelen henger på orienteringen). Kostnad for G: 44 px i nedre venstre
hjørne av stagen, som ved 568 × 320 er innenfor insettens område — **dette
må samordnes med G dersom H2 velges**, i motsetning til H1 som koster G null.

**Låste beslutninger som må omgjøres.** Alt i H1, pluss:

| # | Endring |
|---|---|
| D96 | Onboardingens anker flyttes ut av Home; Home finnes ikke. |
| D101 | «Etter steg 6 sendes brukeren til Home» må peke et annet sted. |
| D112(b) | «?» på Home restarter stegene — knappen mister flaten sin. |
| N-a §4 | «Til Home: ett trykk» blir «til dashboardet: ett trykk». |

**Kostnad:** middels. Arket er ny mekanikk (dra, høydetrinn, reduced-motion),
og fire låste onboardingbeslutninger må flyttes. **Hovedinnvendingen:** et
dashboard bak et trykk er ikke helt et dashboard — eieren ba om å *se*
korrelasjonene, og H2 gjemmer dem.

---

### H3 — FEM FANER (uxpeak etter boka) · Home er dashboardet · sidemeny i landskap

**Menyens innhold og form.**
Fem celler à 71.8 px ved 375 px:

```
HOME     FLIGHT    STUDIO    MAP       MORE
```

`MORE` åpner et ark med Settings, Ask og D-plane etter hvert som de bygges —
oppsettet som skalerer til sju flater uten å bryte uxpeak-tips 4.

**Målt hindring, og den er hard:** `CONNECTIONS` er 84.9 px og får **ikke**
plass i en 71.8 px celle ved 375. H3 krever derfor enten et nytt ord for
modulen i krom (`MAP`, 25.8 px) eller ulike cellebredder — begge er
avvik som må vedtas. Og `MORE` er per definisjon oppbevaring, altså det
uxpeak-tips 1 advarer mot.

**Dashboardet.** Som H1, men korrelasjonsbåndet er en **fast** teaser —
spec-ens egen eksempelkjede `Curve ← Spin Axis ← Club Face · Club Path` —
uten brukervalg og uten tilstand. Billigst, og ærlig: det er en prøve på
kartet, en invitasjon.

**Konsekvens per flate.** Som H1 for Ball Flight, Connections og
onboardingen i portrett. Studio er annerledes:

**G-e.** I landskap blir menyen en **permanent 72 px venstrerail**. Den
koster bredde, ikke høyde — og høyde er det landskap er kort på. G har målt
at dette nettopp har blitt mulig: etter G-a går chip-raden fra fem til fire
chips, hvert chip vokser 103 → 131 px, og med 72 px rail gir det 105 px
innvendig mot `SWING DIRECTION`s 95 — **10 px klaring der det før var 1 px
underskudd** (G §10).

**Men det gjør H3 avhengig av G sitt valg:** railen forutsetter G alternativ 1
(MODUS) **pluss** G-a. Velger eieren G alternativ 2 eller 3, står chip-raden
på fem chips og railen faller tilbake til G sitt målte 14 px etikett-overflyt
— et D64-brudd. Da må H3 i landskap falle tilbake på H1 sitt hjørnesvar.
Coachmarkene: **målt av G etter at denne planen ble levert (G §12), og det
gikk motsatt vei av det jeg antok.** Sonens venstrekant er insettens
høyrekant — og etter splitten finnes ingen inset i DELIVERY, så kanten
kollapser til scenekanten. Ved 568 × 320: 194 px i dag → **371 px etter
splitten uten rail (+91 %)** → **299 px med H3-railen (+54 % mot i dag)**.
Railen koster 72 px, splitten gir 177 px tilbake. Sonehøyden er urørt.
E sin 67 %-rulling ved minimumsmålet blir altså **bedre** med H3, ikke verre.
Forbeholdet mitt om fem chips er derimot bekreftet: 81 px innvendig mot
95 påkrevd = D64-brudd. Railen forutsetter fortsatt G alternativ 1 + G-a.

**Låste beslutninger som må omgjøres.** Alt i H1, pluss:

| # | Endring |
|---|---|
| D64 | Modulnavn i krom kan forkortes — og `Connections` får et eget kromord. |
| N-a §3 | Også landskap får permanent krom (72 × høyde ≈ 23 000 px² ved 320 px). |
| — | Bindingen til G alternativ 1 + G-a må låses som betingelse. |

**Kostnad:** høyest. To menyformer å bygge og verifisere, et `MORE`-ark, et
nytt kromord for Connections, og en landskapsform som ikke kan låses før G
sitt hovedvalg er tatt.

---

## 4 · Anbefaling

**H1 — FANERAD.**

1. Den gir eieren det han ba om, i den formen han ba om det: en bunnmeny og
   et dashboard med korrelasjoner under folden.
2. Den koster **strøm G null**. Studios landskap er bokstavelig talt urørt —
   stagen, stance-etikettene, `studioZone`, E sine målte steg 4/5-bokser.
   Ingen av G sine tre alternativer blir vanskeligere eller lettere av den.
3. Landskapssvaret er skrevet **for** landskap og henger på orienteringen,
   ikke på modulen — derfor tåler det begge utfall av G sin portrettmåling
   uten å bygges om.
4. Den beholder 00-FELLES-funnet i live der det gjelder, i stedet for å
   overkjøre det. Tre uavhengige kilder sa nei til bunnkrom på scenene;
   H1 sier ja i portrett og nei i landskap — og betaler i den ene
   dimensjonen som faktisk finnes å betale med.
5. Ordbreddene passer, målt: 84.9 i 89.75 px. Fem faner gjør ikke det.
6. Den lukker fire åpne gjeldsposter i én runde: to Home-flater (D96),
   `nav/`-lenkene fra Studio og Connections, de tre døde `#`-oppføringene, og
   den andre grafimplementasjonen på Home.
7. **0 linjer i `engine/` og `adapter/`** — fysikken og de 465 + 75 testene
   er ikke i spill.

**H2** er verdt å velge hvis eieren heller vil ha dashboardet tilgjengelig
fra *inne i* modulene enn å ha en Home-flate i det hele tatt — men fire låste
onboardingbeslutninger må flyttes, og et skjult dashboard svarer dårligere på
selve ønsket.

**H3** anbefales ikke nå: den koster mest, den krever et nytt kromord for
Connections, dens landskapsform kan ikke låses før G sitt hovedvalg er tatt,
og `MORE` er den oppbevaringsboksen uxpeaks eget første tips advarer mot.
Hører hjemme igjen den dagen D-plane, Ask og Settings faktisk finnes.

**Vurdert og forkastet:** å beholde HOME-sirkelen *sammen med* menyen i
portrett. To former for samme nivå samtidig er nøyaktig det
grammatikkbruddet N-a ble skrevet for å hindre, og sirkelen ville da vært
permanent krom uten jobb.

---

## 5 · Hva G får fra meg (D111-samordning)

**G-e er besvart: i landskap finnes ingen bunnmeny.**
Menyen er en portrettform; i landskap bæres modulnivået av HOME-sirkelen i
hjørnet, som åpner menyen som et ark. Konkret for G, ved begge
D59-ytterpunkter:

- Stagen beholder 170 px ved 568 × 320 og 280 px ved 932 × 430. G sitt §9
  regnestykke med 60/80 px bunnstripe er **ikke lenger et krav** for noen av
  hans alternativer.
- **Stance-etikettene på `gy + 26` er urørt.** Den ene navngitte endringen
  G listet under alternativ 1 med 80 px meny faller bort.
- `studioZone` beholder gulvet sitt (`marker.top` / `controls.top`).
  D107-omskrivingen trenger **ingen menyklausul i landskap**.
- Chip-raden er urørt. Den 1 px slakken forblir en slakk, ikke et underskudd.
- G-a sin sidegevinst (fem chips → fire) er **ikke lenger nødvendig for
  menyens skyld**. Den står fortsatt på sine egne meritter.

**G har svart tilbake (G §12, 2026-08-26) — sløyfen er lukket:**

D107-sonen ved 568 × 320 er **194 px i dag**, **371 px etter splitten uten
rail** og **299 px med H3-railen**. Det retter en antagelse jeg hadde feil om:
jeg skrev at H3-railen ville smalne coachmark-sonen. Den gjør det ikke netto —
splitten gir 177 px tilbake der railen tar 72. **H3 sitt eneste gjenstående
coachmark-forbehold er dermed borte**, og G bekreftet forbeholdet som faktisk
holder: fem chips + rail = 81 mot 95 px = D64-brudd. Railen forutsetter
alternativ 1 + G-a, som jeg skrev.

Dette gjør H3 billigere enn planen først anslo, men endrer ikke anbefalingen:
H1 koster fortsatt G null, passer fortsatt ordbreddene ved 375 px, og binder
seg fortsatt ikke til G sitt hovedvalg. H3 sin kostnad var aldri primært
coachmark-sonen — den er det nye kromordet for Connections, to menyformer å
bygge, og bindingen til et valg eieren ikke har tatt.

**Svar på G §13.4 — portrettets scenehøyde (målt av H på G sin demo):**

Menyen bryter ingenting i portrett-Studio; den setter et **tak på
scenehøyden**. Ved 320 × 568: **366 px uten meny · 310 px med 56 px ·
286 px med 80 px.** G sitt valgte 260 px ligger under alle tre, så en
56 px meny koster G **null** også i portrett ved den valgte høyden.

To presiseringer til G sitt eget tall:

- Den bindende kostnaden ved 320 × 568 er **kontrollblokken på 148 px**
  (to chip-rader + slider), ikke menyen. En 380 px scene flyter over med
  14 px **helt uten krom**. Menyen gjør et umulig valg litt mer umulig; den
  skaper det ikke.
- *(Rammen er korrekt i begge planer: G §13.4 sier selv «dashboardet er ikke i
  bildet — det bor på Home», og alle tre H-retningene plasserer det der.
  Presiseringen under gjelder mekanismen, ikke rammen.)*
- G sitt «coachmarken og menykrommet konkurrerer om samme høyde» stemmer ikke
  helt slik jeg måler det: G sine egne frie bånd i §13.3 ligger **øverst i
  scenen** (57 px DELIVERY / 88 px STRIKE ved 258 px scene), og E sin
  `studioZone` ankrer boksen over `marker.top`/`controls.top` — altså
  *inne i* scenen. Plassen under kontrollene er slakk ingen annen enn menyen
  gjør krav på. Konkurransen er reell, men den går via **scenehøyden**, ikke
  via en delt sone.

**Det G trenger fra H nå:** ingenting for å velge scenehøyde ≤ 286 px.
Vil G over 286, må menyhøyden (H-a) og portrettgulvet (H-j) låses først.

**Det G fortsatt bør vite:**

- G sitt argument i §9 om at splitten er *forutsetningen* for en meny i Studio
  gjelder ikke lenger som menyargument — men **splitten er fortsatt
  forutsetningen for at Studio kan gå portrett** (G §11), og portrett er
  eierens retning. Argumentet blir sterkere, ikke svakere: det flytter seg
  fra menyen til orienteringen.
- Velger eieren **H3**, snus dette: da trenger G en 72 px venstrerail, og
  railen forutsetter G alternativ 1 + G-a. Det er den eneste av mine tre
  retninger som legger et krav på G sitt hovedvalg.
- **Ingen av oss bygger før begge planer er eiergodkjent og orkestrator har
  samordnet dem** (D111).

---

## 6 · Underbeslutninger som trengs uansett retning

Ingen av disse står i `DECISIONS.md` eller `DESIGN.md`. Jeg bygger ikke før
de er avgjort. Neste ledige nummer er **D118**.

**H-a · Menyens mål.** Forslag: 56 px + `env(safe-area-inset-bottom)`,
44 px treffrad, `plate`-flate, 1 px `line` overkant. Nytt kromtak for
portrett settes samtidig — forslag: **ett bunnfelt ≤ 60 px + null sirkler**.
Landskapstaket forblir N-a sine 1 936 px².

**H-b · Etikettene.** Forslag: `HOME · FLIGHT · STUDIO · CONNECTIONS`.
Krever at det sies eksplisitt at D64s «fagbegreper forkortes aldri» gjelder
*fagbegreper*, ikke modulnavn i krom. `IMPACT STUDIO` passer ikke (målt).

**H-c · Aktiv/inaktiv.** Forslag: aktiv = `ink`-tekst + 2 px `primary`-strek
i cellens overkant; inaktiv = `ghost`. Alternativ: `primary`-tekst — men da
har Ball Flight to primærflater samtidig.
*(uxpeak-tips 12, varselmerker: ingen. Appen har ingen varsler.)*

**H-d · Menyen under onboarding.** Forslag: synlig og levende; et trykk
avslutter onboardingen som hopp, så navigerer — identisk med D102 for HOME.
Alternativ: inert. E sitt funn 4 er presedensen for hvorfor inert er farlig.

**H-e · Connections' velger under menyen.** Målt: 638 px innhold i 611 px
flate ved 375 × 667 med 56 px meny. Tre veier: [1] tre kolonner i stedet for
to *(anbefalt — velgeren er hviletilstanden og bør ikke rulle)* · [2] gruppe-
etikettene inline i rutenettet · [3] godta at hviletilstanden ruller.

**H-f · Korrelasjonene på dashboardet.** Forslag: **én kjede om gangen**,
bakover, fra `graph-data.js` (D47-fasiten). Aldri hele grafen, aldri forover
som navigasjon. Metrikken huskes som UI-preferanse — **ikke** utledet av
brukerens slag, som ville brutt D44.

**H-g · Home-kartet i dag.** `app/home/connections-map.js` viser hele grafen,
navigerer forover, og er en 23-noders pre-D47-kopi. Forslag: **fjernes**, og
korrelasjonsbåndet bygges på `graph-data.js`. Alternativ: rettes og beholdes
— men da finnes fortsatt to implementasjoner.

**H-h · `app/nav/`.** Forslag: slettes (D96 sitt åpne punkt). Studios og
Connections' `../nav/`-lenker dør med den. E sine ~114 linjer død
onboarding-CSS i `sa-home.css` ryddes i samme jobb, som E ba om.

**H-i · De døde oppføringene.** `D-plane`, `Ask`, `Settings` er `href="#"`.
Forslag: fjernes fra alt krom (D112b-prinsippet: en knapp som ikke gjør noe
er verre enn ingen). **Settings er unntaket** — D27 krever den og D103
utsatte den; forslag: bygges som dashboardets nederste oppføring i denne
runden, slik at enhetsvalget endelig kan endres.

**H-j · Hva er portrettgulvet?** *(ny, utløst av G §13.4)*
D59 setter landskapsminimum til 568 × 320. **Ingen har bestemt hva
portrettminimum er** — og portrett er nå hovedverdenen, så gulvet må settes.
Det avgjør 99 px scenehøyde i Studio og påvirker Connections-velgeren (H-e).
[1] **375 × 667** *(anbefalt — minste nålevende portrettflate; SE-2/SE-3-klassen.
Scenetak 409 px med 56 px meny; Connections-velgeren er allerede målt der)* ·
[2] **320 × 568** — SE-1-klassen, rotasjonen av D59s landskapsminimum.
Scenetak 310 px. Konservativt, men koster Studio 99 px scene på hver flate ·
[3] 390 × 844 — dagens vanligste, men da faller SE-klassen utenfor helt.
*Merk: dette er ikke H sitt å avgjøre alene — det treffer spec 03 kriterium 8
og G sitt scenehøydevalg samtidig.*

---

## 7 · Verifisering av valgt retning

Ingenting bygges før §6 er avgjort. Når det er:

1. **`npm test` grønn** i rot før og etter (fysikklint 53 filer · motor 465 ·
   adapter 75). Menyen rører ikke motoren; går testene rødt, er noe galt med
   noe annet enn menyen.
2. **`DESIGN.md` linter 0/0** etter at menykomponenten er ført inn i
   frontmatter (`.design-sync/NOTES.md` — node direkte, ikke npx-shimmen).
3. **Måles i nettleser ved fire porter:** 375 × 667 · 390 × 844 · 430 × 932
   portrett, og 568 × 320 · 932 × 430 landskap. Per port og per flate:
   ingen klipping, ingen ellipsert etikett, alle treffflater ≥ 44 × 44,
   `getBoundingClientRect` som bevis — ikke skjermdump.
4. **De fem tallene som må reproduseres etter bygging:**
   Ball Flight scene over panel ved 375 × 667 med panelet åpent ≥ 227 px ·
   Connections-velgeren ruller ikke ved 375 × 667 · Studios stage ved
   568 × 320 er fortsatt 170 px · chip-raden er fortsatt 548 px ·
   menyens bredeste ord ≤ cellebredden.
5. **Onboardingen kjøres ende-til-ende** i de ekte skjermene, begge
   enhetspakker, med menyen til stede: alle seks steg, coachmarkboksene
   klare av topp, marker og meny ved begge D59-ytterpunkter, og
   menytrykk-som-hopp verifisert i hvert steg.
6. **Tastatur:** `Tab` gjennom menycellene, `Enter`/`Space` aktiverer,
   `Escape` beholder sin betydning. Synlig `ink`-fokusring (D94) i alle
   tilstander.
7. **Reduced motion:** menybytte faller til `instant`; ingen informasjon
   ligger i overgangen.
8. **Artifact-bygg, hvis det lages et: rot-`_artifacts/`, aldri `app/`**
   (D117). En artifact inliner motoren med vilje og gjør fysikklinten rød med
   falske funn — samme klasse som D90.
9. **Visuell sømtest på telefon av eier** — samme forbehold som E meldte:
   nettleserpanelet i disse øktene komponerer ikke, så bevegelse og materiale
   er ubedømt fra min side.

---

## 8 · Leveranse og status

Levert til eier via orkestrator 2026-08-26. Denne fila er dokumentet;
meldingen til økten «ORKESTRATOR Flightglass» er en peker (PROTOKOLL.md).

**Eieren skal ta ett hovedvalg og ti underbeslutninger:**

- **Hovedvalget:** H1 (anbefalt) · H2 · H3 — §3 og §4.
- **H-a … H-j** — §6. Neste ledige nummer i `DECISIONS.md` er **D118**.

**G kan lese §5 nå, uten å vente på eieren:** G-e er besvart, og svaret
koster G null under H1. Skulle eieren velge H3, endres det — og bare da.

**Ingen bygging før eiergodkjenning og orkestrators samordning med G (D111).**


---

# TILLEGG — eierrunde 2026-08-26 kveld

Eieren tok tre valg og ba om én utredning. Dette tillegget skal speiles inn i
`HANDOVER/H-MENY-DASHBOARD-PLAN.md` og meldes orkestrator for låsing
(neste ledige nummer: **D118**).

## T1 · Eiervalg som er tatt

| # | Valg | Konsekvens |
|---|---|---|
| **T1-a** | **Impact Studio heter `GEOMETRY`** | Grafens eget lagnavn for nøyaktig de fire chipsene Studio styrer (plane · direction · ballposition/lowpoint · archeight). Provenienss: mockens Studio-fil het `geometry.html` (`_source/mocks/shared/sa-shots.js`, `sa-haptics.js`). |
| **T1-b** | **Ball Flight heter `IMPACT`** | Samme logikk: modulen heter det du SETTER i den — leveringsbetingelsene, grafens `delivery`-lag. Mockens fil het `impact.html`. Min innvending (D53 peker «impact» mot Geometry) ble hørt og overprøvd. |
| **T1-c** | **Senterringen skrinlegges** | Ingen ring, ingen femte celle. |
| **T1-d** | **Connections får kortere ord — eller går ut av menyen helt.** Avgjøres av Home-utfallet. `LINKS` (34,2 px) er eierens eksempel. | Går den ut, er menyen tre celler: `HOME · IMPACT · GEOMETRY`. |

**Målt grunnlag for T1-c**, som avgjorde det: `CONNECTIONS` er 84,9 px i
label-typografi. En femcellet meny gir 60,8 / 71,8 / 74,8 / 82,8 px celle ved
320 / 375 / 390 / 430 px. **Ordet passer ikke på noen skjerm som finnes** —
heller ikke den største. Firecellet med eierens navn passer fra 375 px og opp
(`HOME` 34,1 · `IMPACT` 43,8 · `GEOMETRY` 63,5 · `CONNECTIONS` 84,9 mot
89,75 px celle = 4,8 px luft), men **ikke ved 320 px** (76 px celle, −8,9 px).
Går Connections ut eller ned til `LINKS`, passer menyen ved 320 px også — og
**H-j (portrettgulvet) slutter da å være blokkerende for menyen.**

**Belegg fra referansene, som gjorde skrinleggingen enkel:** i alle tre
bildene eieren sendte er senteret et **verb** (Exchange · «+» · AI-assistent),
aldri en visningsbryter. Og hver perspektivkontroll jeg fant på Mobbin sitter
**på scenen**: [Tonal](https://mobbin.com/screens/5aa43142-889e-44d8-9a74-33bc0e55779a)
og [Apple Store](https://mobbin.com/screens/4f6a44a6-123f-4deb-a7cf-6831f34a9130)
bruker en segmentert pille øverst — samme form Flight Glass alt bruker —
[Slopes](https://mobbin.com/screens/9d935882-5d76-40c0-b3ac-634001a8d5ca) et
3D-hjørneikon, [Google Maps](https://mobbin.com/screens/ea28d54f-54e9-461f-af86-9875ad785814)
flytende kontroller i scenekanten.
Nærmeste nabolag i sjanger, [Garmin Connect](https://mobbin.com/screens/e5886795-a67f-4870-834c-946176f5d8c2)
— en måleapp for utøvere — kjører fem faner med ikon + ord og **ingen ring**.

## T2 · Haptikk og bevegelse — alt finnes allerede

Ingenting nytt trenger å oppfinnes. `app/shared/sa-haptics.js` bærer et ferdig
vokabular **med en regel i toppen**:

> «Per Apple HIG: haptics mark physical events and detents, never decoration.»

Det er i bruk i dag: `tick(key)` på slider-detenter og chips (70 ms gate),
`band('strike')` når treffbåndet skifter, `impact('light')` på orb-, kamera- og
modusknapper i Studio.

**Menyens haptikk, avledet av det som finnes:**

| Hendelse | Haptikk | Hvorfor |
|---|---|---|
| Bytte fane | `impact('light')` | Samme klasse som Studios kamera-/modusorb: en flate skifter |
| Trykke fanen du alt står i | **ingen** | Ingenting skjedde. Modulens egen regel |
| Pin festes | `impact('medium')` | Eneste hendelse tung nok til `medium`; holdes reservert |
| Meny under onboarding | arver stegets egen | Menyen legger ikke på et lag |

**Menyens bevegelse er allerede spesifisert av DESIGN.md sine tokens:**
`fast` 90 ms = trykkrespons · `base` 160 ms = modulbytte (N-d sier det alt
ordrett) · `ease` = `cubic-bezier(.2,.8,.2,1)` · reduced motion → `instant`.
`slow` 260 ms er i tabellen navngitt **«pin festes»** — bevegelsestokenet for
pin finnes altså før pin-knappen har fått sin plass.

**Aktiv-indikatoren — der personligheten flyttes når ringen er borte.**
Referanse 2 sin lysstråle er systemisk lovlig (D85/D88: glød utenfor scener er
fri, og materialglød ER appens identitet). Men en permanent glødende
`primary`-flate i menyen konkurrerer med modulens egen `primary`-CTA
(Ball Flights «Change input»). Forslag, som beholder effekten uten
konkurransen:

> **Hvile:** aktiv celle = `ink`-etikett + 2 px `primary`-strek i cellens
> overkant. Inaktiv = `ghost`. **Ved trykk:** strålen blomstrer i `fast`
> 90 ms og faller tilbake — bevegelsen bærer feiringen, ikke en permanent
> tilstand. Farge er aldri eneste bærer (D10): posisjon + strek + vekt gjør
> jobben, gløden forsterker.

## T3 · Home — hva prosjektet faktisk har å fylle den med

Eieren ba om en gjennomgang av **hele** prosjektet. Den strukturelle årsaken
til at Home har drevet, står i `README.md`: av fem kontrakter som «bør skrives
før full implementering», er nr. 1 **«Product, Home and onboarding contract»**
— og den er aldri skrevet. **Home er den eneste flaten i appen som aldri har
hatt et oppdrag.** Denne runden er den kontrakten.

### Funn: korrelasjonene på Home er ikke mockrester

`app/home/connections-map.js` implementerer **spec 05 §2 sin Connections**
ordrett: «alle 23 navn er synlige og kan trykkes», «What shapes it / What it
shapes», «maksimalt to hopp og syv fremhevede noder» — inkludert
7-node-taket i koden. Det er altså den **gamle, senere erstattede** spec-en,
bygget og stående. D43/D44 og `CONNECTIONS-BESKRIVELSE.md` erstattet den med:
bakover fra én valgt metrikk, hvilende tilstand er velgeren, aldri alle noder,
forover kun som tekst. Home-kartet er i tillegg 23 noder på pre-D47-modellen
(mangler `verticalspinloft`).

Det gjør eierens spørsmål — «enklere eller samme form?» — til et reelt valg
mellom to *definerte* former, ikke mellom en mock og en idé.

### Materialet som finnes, og hvem som eier det

| Kandidat | Hvor det ligger | Status |
|---|---|---|
| **Ask Flightglass** — 28 spørsmål, 19 interaktive labs, 6 temaer, engelsk, motorverifisert, med `shortAnswer` · `bullets` · `boundary` · `nextAction` · truth-tier | `motor/export/ask-catalog.json`, 40 KB | **Ubygget. Prosjektets største uutnyttede ressurs.** Spec 05 kaller Ask og Connections «to lag av samme læringsprodukt». |
| **Korrelasjonskjeden** | `app/connections/graph-data.js` (D47-fasit, 24 noder) | Bygget og korrekt. Home har den erstattede kopien. |
| **Pin/delta — «hvor mye er én grad»** | `state.pins` i Ball Flight, `Δ vs pin`-linja | Bygget, men **sesjonsverktøy**: spec 02 sier eksplisitt «ikke en lovet shot-history-funksjon», og pins kan nullstilles ved reload. Persistens krever egen state-kontrakt (README nr. 3). |
| **De 13 utfallene / «Details»** | Spec 02, bygget i Ball Flight | Finnes |
| **Settings / enheter** | D27 krever, D103 utsatte | **Ubygget gjeld** |
| **Tour-referansebånd** — 442 siterte tall, PGA/LPGA Trackman | `REALISME.md` | Finnes, men **D25 gjør dem til en motorport (D0), ikke brukerinnhold.** Å vise dem er et nytt vedtak. |
| **Amatørbånd** | `AMATOR.md` | **Lukket som umulig** (STATUS) — null av de ni metrikkene er publisert. Ikke tilgjengelig. |
| **Atmosfæren / nattfotoet** | D80: «Home bærer atmosfæren» | Bygget på Home |
| **Onboarding-restart «?»** | D112b | Bygget, i Home-headeren |

### Produktsetningen som binder det sammen

`README.md`: «Flightglass lar en golfer endre leveringen av køllen, se et
modellert slag eller treff reagere umiddelbart og **forstå hvorfor** utfallet
endret seg.»

Eierens egne ord for Home — «en form for aktualisering for de andre menyene,
samtidig som man kan lære» — er de to halvdelene av den setningen:
**aktualisering** = tilstanden de andre flatene deler, sagt ett sted;
**læring** = hvorfor-laget, som er nettopp Connections + Ask.

---

# T4 · OPPDRAGET: tre Home-mocks

Eieren valgte ikke form — han ba om **tre mocks å se på**. Og han låste
korrelasjonsformen: **én fast, ikke-interaktiv kjede.**

## T4.0 · Hjemmel — hvorfor dette ikke bryter D111

D111 sier ingen strøm bygger før begge planer er eiergodkjent. **Dette er ikke
menybyggingen.** Det er en kjørbar beslutningshjelp, ikke koblet inn noe sted —
samme mønster og samme hjemmel som `app/studio/split-demo.html` (G, i plan
mode) og `app/onboarding/splash-demo.html` (E, bevart som D108). Eieren ba om
den direkte. **Meldes orkestrator før den bygges**, per protokollen om at
eiervalg tatt i strømøkt låses umiddelbart.

Ingenting kobles til `app/home/index.html`. `engine/` og `adapter/` røres ikke.

## T4.1 · Form: ett dokument, tre-veis bryter

`app/home/home-demo.html` — én fil, verktøylinje øverst, tre Home-varianter i
samme ramme så de kan sammenlignes ved lik portstørrelse. Nøyaktig mønsteret
`split-demo.html` bruker for modus/port/scenehøyde/meny.

**Ikke** `_artifacts/` (D117): D117 gjelder byggeutdata med inlinet motor.
Denne importerer motor og adapter som ES-moduler, slik split-demo gjør — og
den regner ingenting selv. Alle tall gjennom adapteren; ingen matematikk i
mock-laget (fysikklintens egen regel).

**Verktøylinjens brytere:** variant A/B/C · port 320×568 / 375×667 / 390×844 ·
meny av / 4 celler / 3 celler.

## T4.2 · Skallet, likt i alle tre

- **Bunnmeny:** `HOME · IMPACT · GEOMETRY · LINKS` (fire ordceller, kun ord).
  3-celle-varianten dropper `LINKS` — T1-d avgjøres av hvilken variant som
  vinner. Aktiv = `ink`-etikett + 2 px `primary`-strek i overkant, inaktiv
  `ghost`, trykk = `fast` 90 ms blomstring som faller tilbake (T2).
- **Korrelasjonene, under folden, likt i alle tre:** én fast kjede —
  `Curve ← Spin Axis ← Club Face · Club Path` — lest fra
  `app/connections/graph-data.js` (D47-fasiten, 24 noder). Ikke-interaktiv.
  Ett trykk hvor som helst åpner samme kjede i Connections.
  **Home-kartet i `connections-map.js` brukes ikke** — det er den erstattede
  spec-en på pre-D47-data.
- Modellgrense-setningen, én gang: *Modelled shot — not a measurement.
  Strike is assumed centred.*
- Kun tokens fra `app/tokens.css`. Ingen naken hex. Ingen emoji.
- Reduced motion → `instant`.

## T4.3 · De tre variantene

**A · «Spørsmålet» — Ask blir Home.**
Første fold: ett spørsmål fra `motor/export/ask-catalog.json` med `shortAnswer`,
`boundary` og `nextAction` som knapp («Open the face–path model»). Tynn skive:
spørsmål + svar + neste handling. De 19 labene bygges ikke her.
*Prøver ut:* om «aktualisering for de andre menyene» fungerer når hver
inngang er en ferdigskrevet neste handling.

**B · «Kartet blir Home» — Connections flytter inn.**
Første fold: den faste kjeden, stor, som sidens emne. Under: metrikklisten som
statisk liste. Meny = tre celler.
*Prøver ut:* om et kart som forside gjenskaper «for mange noder samtidig» —
eierens egen hovedirritasjon — eller om én kjede er rolig nok.

**C · «Slaget + hvorfor».**
Første fold: tilstanden Impact og Geometry deler — de fem leveringsverdiene og
hovedutfallet, ekte tall fra D60-standardslaget gjennom `selectOutcome()` i
`app/ball-flight/impact-outcome.js` og `displayValue()` i
`adapter/src/displayFlight.js`.
*Prøver ut:* om en avlesning man alt får i Impact likevel gir Home en egen
grunn til å finnes.

## T4.4 · Gjenbruk — ingenting skrives på nytt

| Trenger | Finnes i |
|---|---|
| Grafen (D47-fasit) | `app/connections/graph-data.js` |
| Spørsmålskatalogen | `motor/export/ask-catalog.json` |
| Utfall fra fem input | `selectOutcome()` · `app/ball-flight/impact-outcome.js` |
| Tallformatering | `displayValue()` · `adapter/src/displayFlight.js` |
| Haptikk | `app/shared/sa-haptics.js` — `impact('light')` på fanebytte |
| Tokens | `app/tokens.css` |
| Demomønsteret | `app/studio/split-demo.html` |

## T4.5 · Verifisering

1. Rot-`npm test` grønn før og etter (fysikklint 53 filer · motor 465 ·
   adapter 75). Mocken regner ingenting; går linten rød, er det matematikk som
   har sneket seg inn i mock-laget.
2. Målt ved alle tre portene: ingen klipping, ingen ellipsert menyetikett,
   treffflater ≥ 44 × 44, `getBoundingClientRect` som bevis.
   **Manuelt `resize`-event før hver avlesning** (G §12-fella).
3. Ordbreddene bekreftet i den ekte fonten per port og per cellevariant.
4. Kjeden stemmer med `graph-data.js` — nodenavn og kantretning lest fra
   fila, ikke skrevet inn.
5. Tallene i variant C reprodusert mot Ball Flight ved samme input.
6. Tastatur: Tab gjennom menycellene, `ink`-fokusring (D94) synlig.
7. **Ikke verifiserbart herfra:** bevegelse og materiale — nettleserpanelet
   komponerer ikke. Krever eierens øyne på telefon, samme forbehold som E.

## T4.6 · Leveranse

Mocken sendes eieren som lenke (`http://localhost:8321/app/home/home-demo.html`),
og valget hans meldes orkestrator for låsing sammen med **T1-a…T1-d** og
korrelasjonsformen. Neste ledige nummer: **D118**.


---

## T5 · Mocken er bygget og verifisert (2026-08-26)

`app/home/home-demo.html` — 3 varianter × 3 porter × 3 menyvarianter.
Ikke koblet inn noe sted. **Rot-`npm test` grønn: 75/75.** Null konsollfeil.

**Tallene reproduserer D60 eksakt**, gjennom `selectOutcome()` + `displayValue()`:
**Push Fade · 172.3 m carry · 10.1 m R side · 5.4 m R curve** — D60-raden sier
«Gir Push Fade, 10.1 m side, 5.4 m curve», og Ball Flight viser samme 172.3 m.

**Kjeden er lest ut av `graph-data.js`**, ikke skrevet inn — og den er
D104s kjede: `spinaxis → curve` (primary/modeled), med
`face` · `path` (primary/direct) og `attack` · `loft` (contextual/direct)
inn i spinaxis. Styrke bæres av strektykkelse **og** ord, aldri farge alene.

**Spørsmålet er lest fra `ask-catalog.json`:** «Why does the ball curve right?»,
`engine-calculated`, nextAction «Open the face–path model».

### Menygeometrien — det siste breddeproblemet er borte

Ved **320 × 568**, porten som drepte `CONNECTIONS`, med eierens navn + `LINKS`:

| Celle | Bredde | Ord | Luft |
|---|---:|---:|---:|
| HOME | 79,5 | 34,1 | 45,4 |
| IMPACT | 79,5 | 43,8 | 35,7 |
| GEOMETRY | 79,5 | 63,5 | **16,0** |
| LINKS | 79,5 | 34,2 | 45,3 |

Ingen ellipse, ingen overflyt, ingen treffflate under 44 px, null horisontal
overflyt — ved **alle tre porter og begge cellevarianter**. 320 er verste
tilfelle; cellene blir bare bredere oppover. **T1-b + T1-d løser dermed
breddeproblemet fullstendig, og H-j slutter å være blokkerende for menyen.**

### Foldene — ett funn eieren bør se

| Variant | 320 × 568 | 375 × 667 | 390 × 844 |
|---|---:|---:|---:|
| A · Spørsmålet | 1,37 | 1,10 | **0,85** |
| B · Kartet | 1,59 | 1,31 | 1,01 |
| C · Slaget | 1,36 | 1,06 | **0,82** |

> **Ved 390 × 844 ruller ikke A og C i det hele tatt** — alt får plass på én
> skjerm, og da ligger korrelasjonene *over* folden. Eierens ønske om
> «korrelasjoner under folden» holder altså kun på de mindre telefonene, med
> dagens innholdsmengde. Enten må Home bære mer, eller så er «under folden»
> en egenskap ved små skjermer og ikke et designmål. **Dette er neste
> eierspørsmål.**

**Ikke verifisert herfra:** bevegelse og materiale — nettleserpanelet
komponerer ikke, så blomstringen på fanetrykk og haptikken er ubedømt.
Krever eierens øyne på telefon, samme forbehold som E meldte.

---

## T6 · Etter D118–D126 (2026-08-26 sen kveld)

### T6.1 · Mocken er regnet om mot 390-gulvet

D118 setter portrettgulvet til **390 × 844**. Mocken er oppdatert: portene er
nå `390×844 · GULV` (standard) · `430×932` · `375×667 · UNDER GULV` beholdt
som stresstest. 320 × 568 er droppet — to klasser under garantien.

Målt på nytt, alle varianter × alle porter: **null ellipserte menyetiketter,
null treffflater under 44 px, null horisontal overflyt.**

### T6.2 · Fold-funnet er nå avgjørende, ikke marginalt

| Variant | 390×844 (gulv) | 430×932 | 375×667 (under gulv) |
|---|---:|---:|---:|
| A · Spørsmålet | **0,85** | **0,73** | 1,10 |
| B · Kartet | 1,01 | **0,91** | 1,31 |
| C · Slaget | **0,82** | **0,74** | 1,06 |

> **På hver eneste flate appen nå garanterer, ruller ingen av de tre mockene.**
> Eierens ønske — «korrelasjonene kan ligge under folden» — kan altså ikke
> oppfylles med denne innholdsmengden på noen støttet skjerm. Før D118 var
> dette en marginal observasjon ved 390; nå er 390 gulvet, og funnet gjelder
> alt over det.

Tre ærlige veier, og valget er eierens:
1. **Home bærer mer** — spørsmål *og* slag *og* kjede, ikke ett av dem.
2. **«Under folden» var en småskjerm-effekt**, og det egentlige målet — at
   korrelasjonene ikke trenger seg på det første man ser — nås av *plassering*,
   ikke av rulling. Da er saken løst allerede.
3. **Godta det:** korrelasjonene er synlige uten å rulle, hvilket er bedre.

### T6.3 · Safe-area: en felles kostnad begge strømmer må regne inn

Prosjektet behandler safe-area som ekte i kode i dag — Ball Flights panel
ligger på `bottom: calc(10px + env(safe-area-inset-bottom))`, Connections og
Home padder for den, og **D126 fører H-a som «≤60 px + safe-area»**.

Konsekvensen for menyens virkelige høyde: på en 390 × 844-klasse enhet er
nedre inset 34 pt. **H-a sin 56 px stripe okkuperer da 90 px, ikke 56.**
En 60 px stripe okkuperer 94.

Det bør samordnes med G sitt §15-budsjett, som trekker fra **80 px flatt** for
menyen. To spørsmål G må svare på for at tallene skal kunne legges sammen:
om `844`-grunnlaget allerede er fratrukket topp- og bunninset, og om de 80 px
er stripen alene eller stripen pluss inset. **Jeg påstår ikke at G regner
feil — jeg påstår at de to regnestykkene ikke kan summeres før den ene
setningen er avklart.** Home har ingen scene, så tallet endrer ingenting i
mockene; det endrer Studios scenetak.

### T6.4 · Presisering: G §15 sine scenetall gjelder ikke Home

Beskjeden «regn med 502, ikke 562, i H-planen og Home-mockene» er notert, men
tallene finnes ikke i H-planen — verifisert, null treff på `562`, `502` og
`orb-rad`. De er **Studios scenetak**: scene + orb-rad + chip-kontroller.
**Home har ingen scene, ingen orb-rad og ingen chip-rad.** Endringen er reell
og viktig for G; den er tom for meg. Ført her så ingen leter etter den i
H-planen senere.

### T6.5 · D126 bekrefter H1 i praksis — og G §15.1 legger en revisjon på meg

D126 slår fast at Ball Flight får modulmeny, at A ikke bygger den, at A
reserverer ≤ 60 px + safe-area, og at **linser/moduser aldri går i
modulmenyen** — som er nøyaktig grammatikkregel 1 og 2 i §2, og ny regel 6.
Modulnivået i Ball Flight-portrett er dermed H1-retningen, eierbekreftet.

Og G §15.1 har fjernet HOME-sirkelen fra portrett i demoen sin, med henvisning
til §5 her. Det følger av alle tre retningene — men det **rører N-a/N-b**:
«tilbakeveien forsvinner aldri bak en rotasjon». Med en bunnmeny er veien ut i
portrett menyen, og sirkelen finnes kun i landskap. Det står allerede som omgjøring i §3-tabellen
(N-a rule 4, N-b skopet til landskap) og må låses i samme vedtak som
hovedvalget. **Ingen ny beslutning trengs — men den må skrives, ikke antas.**

### T6.6 · D124 traff variant C heldig

D124 reduserer Ball Flight V1 til launch dir, curve, offline + carry. Variant C
viser `CARRY · SIDE · CURVE` — altså tre av de fire, uten å ha visst om
vedtaket. Skal C velges, bør launch direction legges til så Home speiler
IMPACT sitt V1-sett nøyaktig.

---

## T7 · D127 + bevegelse/haptikk verifisert i mekanikk (2026-08-26)

**D127 lukker fold-spørsmålet:** «under folden» er tillatelse, ikke krav.
Synlige korrelasjoner uten rulling på 390-gulvet er ønsket. **Ingen kunstig
luft, ingen påfunnet innhold** — mockene står derfor som de er, og T6.2 sine
tre veier er avgjort til nr. 2/3. Home skal ikke padres for å tvinge rulling.

### Verifisert i mocken — mekanikken, ikke opplevelsen

| Sjekk | Resultat |
|---|---|
| Trykk **inaktiv** celle | `impact:light` logget · `bloom`-klasse satt · cellen ble aktiv |
| Trykk **aktiv** celle igjen | **ingen haptikk** — regelen i T2 holder («ingenting skjedde») |
| Blomstringen | registrert av motoren: `bloom`, **90 ms** = `fast`-tokenet, `running` |
| Aktiv-indikatoren | `transition: color 0.16s` = **`base`-tokenet** (N-d) |

### Det eieren MÅ vite før han dømmer haptikken

> **Haptikken kan ikke kjennes i nettleseren, og det er med vilje.**
> `sa-haptics.js` er en ren no-op utenfor native: den logger til en ringbuffer
> og `console.debug`, og **kaller aldri `navigator.vibrate`** — modulens egen
> deklarerte oppførsel. På web finnes ingen API som gir Core Haptics-følelsen.

Konsekvens: i mocken **skal** det ikke kjennes noe. At det ikke gjør det er
riktig oppførsel, ikke en mangel. Haptikkdesignet kan først dømmes på
native-bygget (D70, Core Haptics). Det eieren *kan* dømme nå er **timingen og
den visuelle blomstringen** — begge er verifisert til å fyre med riktige
tokenverdier.

**Fortsatt ubedømt herfra:** hvordan 90 ms-blomstringen faktisk ser ut i
bevegelse. Nettleserpanelet i denne økten komponerer ikke, så jeg har lest
animasjonens tilstand fra motoren, ikke sett den. Samme forbehold som E meldte
om splashen.

---

## T8 · Netto etter G §16 — mocken har fått safe-area-bryter

G bekreftet at §13.4/§15-tallene var **brutto**. Regningen i §T6.3 stemte:
en 56 px stripe okkuperer **90 px** på 390 × 844. Mocken har nå en
`SAFE-AREA: NETTO / BRUTTO`-bryter, med insets per port:

| Port | Topp | Bunn | Menyhøyde netto |
|---|---:|---:|---:|
| 390 × 844 (gulv) | 47 | 34 | **90 px** |
| 430 × 932 | 59 | 34 | 90 px |
| 375 × 667 (SE, under gulv) | 0 | 0 | 56 px |

### Regelen G formulerte, og hvordan den er implementert

> «Bunninsettet bæres av nederste krom — menyen når den finnes, ellers
> kontrollraden, aldri begge.»

Riktig, og den er mocken sin også: insettet er **padding på menyen**, ikke en
krymping av treffraden — og når menyen er av, faller insettet til innholdet.
**Målt konsekvens: cellehøyden står på 55 px i alle tilfeller**, netto som
brutto. Det er nettopp fella regelen finnes for å hindre — padder både
innholdet og menyen for insettet, spises treffflaten opp og 44 px-kravet ryker
uten at noen ser det.

### Foldene, netto — én rute flyttet seg

| Variant | 390×844 brutto | **390×844 netto** | 430×932 netto | 375×667 netto |
|---|---:|---:|---:|---:|
| A · Spørsmålet | 0,85 | **0,89** | 0,76 | 1,10 |
| B · Kartet | 1,01 | **1,06 — ruller nå** | 0,95 | 1,31 |
| C · Slaget | 0,82 | **0,86** | 0,77 | 1,06 |

Netto flyttet altså nøyaktig **én** rute: B begynner å rulle på gulvet.
A og C ruller fortsatt ikke på noen garantert flate. Etter **D127** er det
akseptert — «under folden» er tillatelse, ikke krav — så dette endrer ingen
anbefaling. Det er ført fordi tallene skal være netto heretter.

Null ellipser, null treffflater < 44 px, null horisontal overflyt — netto og
brutto, alle porter, alle varianter.

---

## T9 · Tallgrunnlaget er lukket (2026-08-26)

G bekreftet §T8 med egne tall (G §16): insettet er padding på kromboksen som
**vokser** — 148 → 180 px portrett, 96 → 128 px landskap — alle treffflater
står på nøyaktig 44 px, ingen dobbel padding. Samme mekanisme og samme
resultat som mocken (cellehøyde 55 px netto som brutto).

**Kryssverifiseringen G ↔ H er komplett på begge sider. Tallgrunnlaget under
begge planene er lukket.**

Gjenstår kun eierens valg:

| Sak | Hvor den står |
|---|---|
| **Hovedvalget H1 / H2 / H3** | §3–§4. D126 peker i praksis på H1: Ball Flight får modulmeny, A bygger den ikke, linser går aldri i modulmenyen |
| **H-a … H-i** | §6. H-j er avgjort (D118) |
| **Home-variant A / B / C** | §T4.3, kjørbar i `app/home/home-demo.html` |
| **H2-forbeholdet** | Arket over Studio: overlegg ≠ innhold, eller sperres? Avgjøres sammen med hovedvalget |

Når hovedvalget faller, er de to første byggetrinnene låst av det som allerede
er vedtatt: N-a/N-b-revisjonen (sirkelen kun i landskap, jf. G §15.1) og
menyens form etter H-a…H-c.

---

## T10 · Artifact publisert (2026-08-26)

**https://claude.ai/code/artifact/1c00664f-8de1-405a-8056-b0cc5b38bc33**

Kilde: `app/home/home-demo.html` · bygg: `node tools/artifact-build/build-home.mjs`
→ `_artifacts/home-demo.html` (0,26 MB, deterministisk). Skannet av
orkestrator før publisering: kun Google Fonts.

**Håndrediger aldri artifacten** — endre `app/home/home-demo.html` og bygg på
nytt, så publiseres den samme URL-en igjen. Byggets porter og
differensialtesten (12 150 caser, 0 avvik) kjører ved hver kjøring.

Sidesak, lukkes av G: jeg overskrev `_artifacts/studio-split-demo.html` under
en determinismesjekk mens G redigerte kilden. G har bygget den på nytt
(tidsstempel 22:49); **G har ordet på om saken er lukket.**
Lærdom ført i README: determinismesjekk skal bygge til midlertidig sti.

---

## T11 · Etter D131–D137 (2026-08-28)

### T11.1 · Landskap er ute av V1 — §5 og G-e gjelder nå V2

D133 sender Impact Studio i **portrett i V1**; landskap blir V2 og bevares som
`app/studio/landscape.html`. Konsekvensen for denne planen:

| Del | Ny status |
|---|---|
| **§5 / G-e-svaret** (ingen bunnmeny i landskap; sirkelen åpner menyen) | **V2.** Ingen landskapsflate finnes i V1 |
| **§1.5** Studios landskapsmål (568 × 320, chip-raden, railen) | **V2-referanse** |
| **§3 H1 sin Studio-rad**, landskapshalvdelen | **V2** |
| **H3 sin 72 px venstrerail** | **V2** — H3s eneste særtrekk mot H1 er dermed et V2-anliggende |
| **§2** «ny regel 6: én form per orientering» | Gjelder fortsatt, men **V1 har bare én orientering** |

> **Følgen ingen har skrevet ned ennå: i V1 finnes HOME-sirkelen ikke noe sted
> — og det gjelder under ALLE TRE H-retningene, ikke bare H1.** Alle tre
> legger en stripe i portrett og skoper sirkelen (eller ankerpillen) til
> landskap; landskap var dens eneste hjem i hver av dem. Modulnivået bæres
> derfor av menycellen alene i V1, og N-a §3s kromtak er omgjort i sin helhet
> der — ikke «skopet til portrett», slik §2 formulerte det da landskap fantes.
> Sirkelen blir en **V2-forpliktelse**. Ingen bør bygge en sirkelgren i V1.
>
> *Presisering (D139-runden): H-hovedvalget er IKKE tatt. Setningen over er
> likevel utfallsuavhengig — den følger av at alle tre retningene har
> bunnstripe i portrett, ikke av at H1 vinner.*

### T11.2 · Rotasjonsporten er en felle som må lukkes — ny sak

D133 gir V1 en **speilvendt rotasjonsport**: roterer brukeren til landskap,
møter han en oppfordring om å rotere tilbake. Dagens port i
`app/studio/index.html` er `position: fixed`, fullskjerm, **z 60** — den
dekker alt. Den bærer i dag en HOME-lenke, med en kodekommentar som sier
hvorfor: *«AVVIK (NAVIGASJON, låst): HOME finnes i BEGGE tilstander.»*

**Under alle tre H-retningene finnes ikke HOME-sirkelen i V1** (T11.1).
Bygges den speilvendte porten med
samme fullskjermsmønster, dekker den menyen — og da er den en blindvei.
Det er nøyaktig feilen E dokumenterte som funn 4 («HOME var en felle»), og
den N-a §4 er skrevet for å forby.

Tre veier, og valget er eierens:
1. **Menyen står synlig på rotasjonsporten** *(anbefalt — porten blir et
   sceneoverlegg, ikke et skjermoverlegg; menyen ER modulnivået i V1, og
   koster ingenting ekstra å la stå)*
2. Porten bærer sin egen utveisknapp — men da finnes to former for
   modulnivå igjen, som regel 6 forbyr
3. Rotasjon blokkerer ikke — flaten står i portrettlayout uansett
   *(målt i dag: gjør den ikke; fire av fem chip-etiketter ellipserer)*

Dette er **navigasjon**, altså H sitt (D111/D126) — men det bygges i B sin
flate. Må låses før B bygger porten.

### T11.3 · D131 — byggehygienen er nå regel

D131 låser at determinismekjøringer aldri skriver til en annen strøms
`_artifacts/`-utdata. Regelen kom av min overskriving 22:44; README-en i
`tools/artifact-build/` er ført i samme retning. **Saken er dermed lukket med
en regel framfor en beklagelse**, som er riktig utfall.

### T11.4 · D132 verifisert på menyen — målt, ikke antatt

D132 krever `elementFromPoint`-måling av enhver treffsone. Kjørt på den
publiserte artifacten, alle fire celler:

| Celle | Boks | Vertikalt treffspenn | Venstre/høyre kant |
|---|---|---:|---|
| HOME · IMPACT · GEOMETRY · LINKS | 97 × 55 | **56 px** | svarer begge |

Krav 44 px — oppfylt med 12 px margin, på hver celle.

**Målefelle verdt å notere:** første kjøring ga 0 px treff på alle celler.
Årsaken var ikke menyen, men at nettleserpanelets `innerHeight` var **0** —
uten viewport finnes ingen treffesting i det hele tatt. En `resize_window`
gjenopprettet den. Rapporterer man den første avlesningen, melder man et
brudd som ikke finnes.

### T11.5 · D137 er allerede oppfylt i visningslaget

«Aldri fortegn på null» er **allerede adapterens oppførsel**: målt
`displayValue('signedAngle', 0)` → `0.0°`, mens `+2.0°` og `−4.3°` beholder
fortegnet. Home-mocken arver det gjennom adapteren og bryter altså ikke
vedtaket. D137s tallformatarbeid ligger i Sol-handoffen, som hadde nakne
fortegn — ikke i adapteren og ikke her.

---

## T12 · D138–D139, og en rettelse av min egen drift (2026-08-28)

**D139 låser rotasjonsporten som sceneoverlegg** — menyen står synlig og aktiv
mens porten vises; fullskjermsmønsteret (fixed, z 60) gjenbrukes ikke; HOME
bygges ikke inn i V1-porten. Byggekrav til B.

### Rettelsen: jeg skrev «etter H1» om noe som ikke var valgt

Orkestrator påpekte at **H-hovedvalget ikke er tatt**, og at jeg tre steder
skrev «etter H1» som om det var det. Riktig påpekt — teksten er rettet.

Men rettelsen avdekket at formuleringen min var **svakere enn funnet**:

> Alle tre retningene legger en stripe i portrett, og alle tre skoper
> sirkelen (H1/H3) eller ankerpillen (H2) til landskap. **Konklusjonen «i V1
> finnes HOME-sirkelen ikke noe sted» er derfor utfallsuavhengig** — den
> følger av at hver retning har bunnstripe i portrett, ikke av at H1 vinner.

Det er nettopp derfor D139 kunne formuleres nøytralt og likevel bite: premisset
den hviler på holder under alle tre utfall. Rettelsen gjør planen mer presis,
ikke mindre — men den var nødvendig, og drift av dette slaget er verdt å fange.

**Det som faktisk ER utfallsavhengig**, og som hører til hovedvedtaks-raden:
sirkelens V2-skjebne, og at H3 mister sitt eneste særtrekk mot H1 når railen
blir et V2-anliggende (T11.1).

### D138 · standard-lie er FAIRWAY

Ingen konsekvens for meny eller Home: Home-mocken viser ikke lie. Notert fordi
variant C viser D60-standardslaget, og et framtidig Home som speiler Studios
tilstand må lese lie fra flaten, ikke anta hardpan.
