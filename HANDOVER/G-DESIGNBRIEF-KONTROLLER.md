# Designoppdrag — kontrollområdet i Impact Studio

*Lim inn hele denne fila som prompt. Den er skrevet for å bli utfordret på,
ikke fulgt slavisk — men rammene er målt, og de er ekte.*

---

## Oppdraget i én setning

**Canvasen er ferdig og skal ikke røres. Alt under den skal designes på nytt:
hvordan de fire parameterne velges, hvordan verdien settes, hvordan kølle og
perspektiv vises — og en bunnmeny som ikke finnes ennå.**

## Hva dette er

Flight Glass er en ballfluktsimulator for telefon. Impact Studio er
instrumentflaten der brukeren drar i buegeometrien rundt treffet og ser hva
den gir. Brukeren **kan fagbegrepene** — spin axis, attack angle, face-to-path.
Det finnes ingen forenklet modus og ingen forklaringer av grunnbegreper.

Dette er et **måleinstrument**, ikke en app med et diagram i. Den følelsen er
hele oppdraget.

---

## 1 · Det som er låst, og hvorfor

Bryt gjerne mot smak. Ikke bryt mot disse — de er avgjort, og hver av dem har
en grunn du bør kjenne før du eventuelt argumenterer imot.

**Canvasen røres ikke.** Scenen, svingbuen, ballen, køllehodet, bakken,
DELIVERY/STRIKE-pillen øverst i canvasen og DTL-kontrollen i motsatt hjørne —
alt dette er gitt. Du designer det som ligger **under** canvasen.
*(DTL-kontrollens plassering er det ene unntaket: den er et forslag, og du kan
utfordre den — se §4.)*

**Grammatikken: chips velger parameter, slideren setter verdi.** Én slider,
fire parametre. Chipen sier hva slideren styrer akkurat nå. Dette er appens
gjennomgående mønster og gjelder i alle flater — bryter du det her, bryter du
det overalt.

**Fire parametre, aldri forkortede navn.** `SWING PLANE` · `SWING DIRECTION` ·
`BALL POSITION` · `ARC HEIGHT`. Navnene skrives fullt ut. `SWING DIRECTION`
måler 95 px i 10 px versal-Geist og er den som alltid sprekker først.

**Tre køller:** `DRIVER` · `3-WOOD` · `MID-IRON`. Køllen er **kontekst**, ikke
en leveringsparameter — den skal ikke se ut som en femte chip.

**Berøringsflate 44 px.** En kontroll kan være visuelt lettere enn 44 px, men
da må treffsonen utvides usynlig til 44. Visuell vekt og treffflate er to
uavhengige beslutninger.

**Alle tall i IBM Plex Mono.** Monospace gir tabulære siffer strukturelt — et
tall som hopper mens slideren dras finnes ikke i den fonten. Geist til UI,
Space Grotesk til display.

**Tallformatene er ikke fri:** vinkler får fortegn og én desimal (`−5.6°`,
`+4.0°`). Avstander bærer **ord**, aldri nakent fortegn: `3.9 cm before` ·
`1.4 cm above`. Aldri både fortegn og ord på samme verdi.

**Engelsk UI. Ingen emoji. Kun mørkt tema** — lys modus er et valg som er
avvist, ikke en forglemmelse.

---

## 2 · Flaten, målt

Portrettgulvet er **390 × 844** (iPhone 12-klassen). Alt skal få plass der.

```
 47 px   safe-area topp
 54 px   toppstripe:  ATTACK ANGLE −5.6°   CLUB PATH +4.0°   RESET
380 px   CANVAS — låst, røres ikke
───────
273 px   ← DITT OMRÅDE
───────
 56 px   bunnmeny  ⎫ 90 px totalt
 34 px   safe-area ⎭
```

**Du har 273 piksler.** I dem skal det ligge: køllevalg, perspektivbytte, fire
parameterchips og én slider. Dagens løsning bruker 208 av dem (chips i to rader
à 44, slider 44, kølle-rad 60) og har 65 px slark.

Bredde: 390 px minus 10 px marg hver side = **370 px**.

**Parameterfargene** (hver parameter eier sin kulør, konsekvent i hele appen):
Swing Plane `#9C8DF5` · Swing Direction `#5BC8F5` · Ball Position `#FF8A4D` ·
Arc Height `#C98AE6`. Grunnene: lerret `#07060C`, scene `#110D1C`, plate
`#0D0A18`, linje `#241E33`. Tekst `#F5F2FF`, dempet `#A79FC7`.

---

## 3 · Hva som er galt i dag

Se skjermbildet. Tre varianter er prøvd, og alle tre har samme grunnfeil.

**Alt har samme vekt.** Køllevalget, parameterchipene og verdiene er tre
rader med identiske avrundede rektangler i samme farge, samme høyde, samme
kantlinje. Skjermen sier ikke hva som er viktigst. Den aktive chipen er
oransje — det er hele hierarkiet, og det er for lite.

**Slideren henger i løse lufta.** Den er en tynn strek nederst uten visuell
forbindelse til chipen den styrer. Brukeren må huske koblingen.

**Køllen ser ut som en parameter.** I variant 1 er den en rad med tre
knapper som er identiske med parameterchipene. Men kølle og parameter er
ikke samme slags ting: den ene er hva du spiller med, den andre er hva du
justerer. De har samme form.

**Variant 3 sprekker, målt:** kølle til venstre og kontekstavlesning til
høyre gir 65 px per kølleknapp, og `MID-IRON` blir til `MID-IR…`. Det er et
brudd på regelen om uforkortede navn — og et bevis på at delingen ikke har
plass ved 390 px.

**Ingen dybde.** Flate kort på flat bakgrunn. Ingenting ligger foran eller
bak noe annet.

---

## 4 · Det du skal løse

### a) Hierarki

Tre nivåer skal være synlige uten at noen forklarer dem:

1. **Den aktive parameteren** — den slideren styrer nå. Den skal lede.
2. **De tre andre parameterne** — tilgjengelige, lesbare, men de viker.
3. **Kontekst** — kølle og perspektiv. De endrer seg sjelden og skal ikke
   konkurrere med instrumentet.

Regelen er at **maks én parameter leder per skjerm**. Uten den roper alle fire
likt, og det er nøyaktig feilen i dag.

Farge alene er ikke nok. Bruk størrelse, vekt, plassering, materiale — og la
fargen forsterke, ikke bære.

### b) Slideren

Løs koblingen mellom «hvilken parameter» og «hvilken verdi». I dag er de to
adskilte rader. De kan være det fortsatt — men da må noe binde dem sammen.
Eller de kan slås sammen. Eller slideren kan bo i chipen. Utfordre formen.

Krav som ikke kan forhandles: 44 px treffsone, tydelig nullpunkt for de
bipolare parameterne (`SWING DIRECTION`, `BALL POSITION`, `ARC HEIGHT` går
gjennom null), og verdien må være lesbar **mens** man drar.

### c) Køllevalg

Tre valg, sjelden brukt, men må være synlig hva som er valgt. Skal ikke se ut
som en parameter. Skal ikke koste en hel rad hvis den kan la være.

*Tre retninger er prøvd og målt: segmentrad (koster 60 px), ingen rad med
kølla som femte chip (gratis, men blander kontekst inn i parameterraden), og
kølle + kontekstavlesning (sprekker ved 390 px). Ingen av dem er riktige. Finn
en fjerde.*

### d) Perspektivbytte

`FACE ON` ↔ `DTL` (down the line). To kameraer på samme geometri.

Ligger i dag som en liten kontroll oppe til høyre **på** canvasen, med
begrunnelsen at perspektivkontroller hører på det de endrer perspektiv på.
Det er et forslag, ikke et vedtak. Vurder det. Hvis den skal ned i
kontrollområdet, må du vise hvorfor den ikke da forveksles med en parameter.

### e) Dybde

**Dybde er materiale, ikke slagskygge.** Systemet har allerede en modell:
lerretet bakerst, scener over det, og avlesninger på **glassplater** — halvt
gjennomsiktige flater med blur og en 1 px indre lyskant som leser som
refraksjon, ikke som ramme.

Bruk den. La ting ligge i lag. Men merk: inne i canvasen er glød forbudt
utenom ett element — utenfor canvasen er materialglød fri. Du jobber utenfor
canvasen, så du har frihet der mange andre flater ikke har.

Ikke løs dybde med drop shadows under alt.

### f) Bunnmenyen

Fire destinasjoner: **Home · Impact · Flight · Range**. 56 px stripe pluss 34
px safe-area.

Den er permanent krom på alle flater, så den skal være rolig. Den er ikke
innholdet. Aktiv tilstand må være utvetydig uten å rope.

Merk: appen har flere flater enn fire — menyen er en prioritering, ikke en
oppbevaring. Og prosjektets regel er at **ord slår ikon**; et ikon står aldri
alene som eneste bærer av en handling.

---

## 5 · Hva «profesjonelt designbyrå» betyr her

Ikke dekorasjon. Det betyr:

- **Én idé, gjennomført.** Et instrument som ser designet ut, ikke satt sammen.
- **Presisjon over uttrykk.** Dette er et måleverktøy. Tall skal være lette å
  lese i bevegelse. Ingenting skal danse mens man drar.
- **Rolig krom, tydelig innhold.** Kontrollene skal forsvinne når du bruker
  dem og være åpenbare når du leter.
- **Tåler å bli sett på lenge.** Brukeren drar i disse sliderne i minutter.

---

## 6 · Feller — ting som ser riktig ut og ikke er det

- **Ikoner i stedet for ord.** Sparer plass, men fem av de sju navnene her har
  ingen etablert ikonform. Et ikon for «swing direction» finnes ikke.
- **Forkortelser.** `MID-IRON` → `MID-IR…` er et brudd, ikke en tilpasning.
- **Å slette nullpunktet på slideren.** Tre av fire parametre er bipolare, og
  null er et sted brukeren sikter mot.
- **Å gjøre alt mindre for å få plass.** 44 px-kravet er absolutt. Har du ikke
  plass, er komposisjonen feil — ikke størrelsen.
- **Drop shadows som dybde.** Systemet bruker materiale.
- **Å flytte pillen eller DTL-kontrollen inn i kontrollområdet uten å løse at
  de da likner parametre.**
- **Å fylle de 273 pikslene fordi de er der.** Tomrom er lov. Det er ofte
  bedre.

---

## 7 · Leveranse

Én HTML-fil, selvforsynt, 390 × 844. Canvas-området kan være et grått
rektangel med teksten `CANVAS — LÅST, 380 px` — du designer ikke det, men
komposisjonen må vise hvordan det du lager forholder seg til det.

Vis **to tilstander**: en der `BALL POSITION` er aktiv, og en der
`ARC HEIGHT` er aktiv — så hierarkiskiftet blir synlig.

**Gi meg to reelt forskjellige forslag, ikke ett med varianter.** Og skriv
under hvert av dem hva du ofret for å få det til. Det er den setningen jeg
leser først.
