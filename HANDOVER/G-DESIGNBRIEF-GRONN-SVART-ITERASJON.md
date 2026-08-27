# Iterasjon på «Grønn og svart» — Impact Studio

*Lim inn hele fila som prompt, sammen med mocken.*

---

## Utgangspunkt

Denne mocken er allerede sterk. Den er målt opp mot alternativene og vinner på
fire punkter. Oppdraget er **ikke** å tegne på nytt — det er å rette fem
konkrete ting og vise to tilstander som mangler.

## Behold dette. Det er målt, og det er bedre enn alternativene

- **Parameterne som fulle rader** — navn til venstre, verdi til høyre. Dette
  løser et problem alle andre oppsett har slitt med: `SWING DIRECTION` er 95 px
  bred og får ikke plass sammen med en verdi i en delt trecelle-rad. Radformen
  gir ~350 px per rad, og problemet finnes ikke. **Ikke gå tilbake til faner
  side om side.**
- **Gressbåndet på 22 px.** Det er 2,75× tykkere enn i den bygde flaten, og det
  er hele grunnen til at ballen leses som *liggende på* gress uten at man må
  tenke. **Ikke gjør det tynnere.**
- **Målestokkene under avlesningene.** Den finstrekede linjalen under `−4.3°`
  sier at verdien lever på en skala uten å bruke et eneste tall ekstra.
- **Slideren som maskinert markør** — rektangulær slede med senterstrek,
  gradert linjal under sporet, min/maks i endene.
- **Canvas ut i kanten**, uten kortramme. Scenen leses som et vindu.

## Fem rettelser

### 1 · Treffflatene er 43 px. Kravet er 44

De tre parameterradene måler 43 CSS-px i høyden. Grensen er absolutt.
Løs det uten å gjøre radene visuelt tyngre: en usynlig utvidet treffsone er en
etablert løsning her — kontrollen kan være visuelt lettere enn 44 px så lenge
det som faktisk treffes er 44.

### 2 · Fortegn på null

`+0.0 cm`, `+0.0°` — fortegn på null leser som en retning der det ikke finnes
noen. Gjelder tre steder: ball position, swing direction, arc height.
Når verdien er nøyaktig null, dropp fortegnet: `0.0 cm`.

*(Fortegn på verdier som ikke er null beholdes — det er bestemt.)*

### 3 · Chevronene lover noe layouten ikke holder

De tre radene har `⌄`, som betyr «utvider seg her». Men den aktive parameteren
ligger i et eget kort **over** listen. Trykker brukeren `SWING PLANE` — folder
den seg ut på plass og skyver de andre ned, eller bytter den plass med kortet
øverst?

To signaler sier to forskjellige ting. Velg én modell og la formen si den:

- **Bytte:** raden er en fane, ikke en skuff. Da er `⌄` feil affordans — bruk
  noe som sier «velg», ikke «åpne».
- **Utvidelse på plass:** da hører det aktive kortet hjemme *i* listen, på sin
  egen plass, ikke over den.

Den andre er trolig mer ærlig, men koster at kortet flytter seg opp og ned. Vis
hva du velger og hvorfor.

### 4 · HOME er et ikon alene

Et hus-ikon uten ord. Regelen i dette systemet er at **intet ikon står alene som
eneste bærer av en handling** — der et ord er presist, slår ordet ikonet.

Merk at HOME bare er nødvendig fordi bunnmenyen din ikke har noen Home. Se
neste punkt: løses menyen, kan denne knappen forsvinne helt.

### 5 · Dybde i den nedre tredjedelen

Scenen har dybde: perspektivrutenett, materialer, lag. De tre parameterradene
har det ikke — de er flate felt på flat bakgrunn.

Dybde i dette systemet er **materiale, ikke slagskygge**: lerret bakerst,
flater over, avlesninger på halvt gjennomsiktige plater med blur og en 1 px
indre lyskant som leser som refraksjon. Bruk den modellen på radene. Ikke løs
det med drop shadows.

## To tilstander jeg mangler

### A · STRIKE

Velgeren din har `FACE ON | DTL | STRIKE`, men mocken viser bare FACE ON.
**STRIKE er halve poenget med hele skjermen** — det er den visningen som ble
skilt ut fra path/attack for å få mindre på skjermen samtidig.

I STRIKE gjelder:

- Toppavlesningene er **ikke** attack og club path. De er treffet:
  et båndord (`PURE` · `THIN` · `FAT` · `DUFF` · `WHIFF`) og en mm-verdi
  (`1.0 mm low`).
- Underlaget **må** være synlig i samme visning som treffstatusen — køllenavn,
  lie-navn og mm (`MID-IRON · FAIRWAY 8 mm`). Uten det leses «PURE» og «ingen
  bakkekontakt» som en selvmotsigelse.
- Dynamisk loft vises som en liten caption merket `ASSUMED` — det er en
  antagelse, ikke en måling, og det skal synes.
- Scenen er en **zoom inn på kontaktsonen**: bakken, ballen, køllehodet som
  referanseflate, buen gjennom sonen, og hakk for ENTRY / LOW / EXIT der de
  finnes.

Vis hvordan skjermen ser ut der. Kontrollene under kan gjerne være de samme.

### B · En tilstand der tallene ikke er null

Alt står på `0.0` i dag, så formatene er ikke prøvd. Vis for eksempel
ball position `+3.9 cm`, swing direction `−2.0°`, arc height `+1.4 cm` — og
sjekk at radene fortsatt sitter når verdiene er lengst mulig (`−20.0 cm`).

## Tre valg du ikke skal ta stille

Disse er større enn layout. Gjør dem synlige framfor å avgjøre dem:

**Bunnmenyen.** Du har `SESSIONS · STUDIO · HISTORY · SETTINGS`. Det er ikke
andre ord for det som er planlagt (`Home · Impact · Flight · Ask`) — det er en
annen produktmodell, som forutsetter lagrede økter og en historikk. Ingen av
delene finnes. Tegn gjerne begge, men marker hvilken som er hvilken.

**Grønn som systemaksent.** Aksentfargen i systemet er ember-oransje. Her er
grønn både aksent og gress — aksent og materiale deler farge. Det kan gå, men
det er en identitetsbeslutning. Vis gjerne en variant der aksenten er oransje
og grønt kun er gress, så forskjellen kan sammenlignes.

**STRIKE i visningsvelgeren.** Å slå sammen kamera (FACE ON ↔ DTL) og modus
(levering ↔ treff) til én tre-veis velger er nærmere spec-ens egen inndeling i
«tre visninger» enn dagens todeling. Men dagens er vedtatt. Behold din løsning
— bare vit at den er et forslag om å endre noe, ikke en detalj.

## Det denne mocken ikke svarer på ennå

Den er portrett. Den vedtatte rekkefølgen er at **landskap bygges først** —
Impact Studio er en landskapsflate, og gulvet der er 568 × 320, altså 320 px
total høyde. Ditt hodekort, avlesningsstripe og tre parameterrader ville alene
spise det meste av den.

Du trenger ikke løse landskap i denne runden. Men si én setning om hva som
skjer med komposisjonen når høyden er 320 i stedet for 844 — det avgjør om
denne retningen kan bygges som den er, eller om den trenger et eget
landskapssvar.

## Rammer

390 × 844. Safe-area 47 px topp, 34 px bunn — bunnmenyen bærer bunninsettet, og
det **legges til** stripens høyde, ikke spises av den.
Alle tall i monospace. Etiketter i versal sans. Mørkt tema, ingen lys modus.
Engelsk UI. Ingen emoji.

## Leveranse

Én HTML-fil per forslag. Vis minst: DELIVERY med et tall som ikke er null, og
STRIKE. **Skriv én linje under hver om hva du ofret.**
