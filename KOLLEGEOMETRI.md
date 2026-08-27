# Køllegeometri — kildeverifisert tabell

Workflow `wj85tn3fx`: 57 agenter, 48 kildekontroller, **11 bekreftet, 5 avvist**.
Fullført 2026-08-25.

> **43 % av tabellen er sitert. 57 % er kvalifisert gjetning** — og gjetningen er
> konsentrert der køllene brukes mest presist: kort jern og wedge.

---

## ⛔ F11 — Jernets sweetspot er ballradiusen, limt inn

**Verifisert: 1.42e-14 mm avvik over 1 250 jerncaser.**

```
faceCentreOffsetMm = ((lift + r_b) − (clubZ + sweet)) × 1000
jern:  lift = 0 · r_b = 0.0213 · sweet = 0.0213
   ⇒   offset = −clubZ × 1000
```

Ballradius og «sweetspot» er **samme tall** og kansellerer hverandre bort.
Jernets `faceCentreOffsetMm` har aldri målt et treffpunkt på slagflaten — den
måler køllehøyde over bakken, negert.

Målt sweetspot-høyde for **12 jernhoder** er 17,7–19,2 mm, snitt **18,4**
(US10918918 Tab. 6+7, samme datum og SS-definisjon). Arvetallet 21,3 ligger
**2,1 mm over det høyeste av tolv hoder** — 16 % for høyt.

Med 18,4 mm forskyves hvert jernslag **+2,935 mm**, og alle fem båndgrensene flytter seg:

| Band | i dag | med målt sweetspot |
|---|---|---|
| Pure | −15,8 … −0,0 | −12,9 … 2,9 |
| Thin | −29,8 … −1,4 | −26,8 … 1,6 |
| Fat | −20,4 … 25,0 | −17,5 … 27,9 |
| Duff | 25,1 … 52,0 | 28,0 … 54,9 |
| Whiff | −119,5 … −29,9 | −116,5 … −27,0 |

**Driveren har ikke feilen** — der kansellerer ingenting (avvik 0.00e+0 mot full formel).

Sjekk versjonshistorikken til den gamle motoren før tallet erstattes. Stemmer
mistanken, har jernberegningene vært feil hele veien — ikke bare unøyaktige.

---

## ⚠ Måledefinisjon — må inn i kontrakten

Kildene bruker minst fire ulike konvensjoner. To må skilles:

- **`faceHeight` for jern måles LANGS slagflaten** (parallelt loftplanet)
- **`faceHeight` for woods måles VERTIKALT**
- **`sweetSpotHeight` måles alltid VERTIKALT over bakkeplanet**

Legges de i samme kolonne uten konvensjonsmerking, leses en wedge som 51 mm høy
når den vertikalt er ~28,5 mm.

Og for driver: **`Hg`** (CG over sålen, ~25 mm) er **ikke** **`Hs`**
(sweetspot = CG projisert normalt på den loftede flaten, ~34 mm). Formelen trenger
`Hs`. Min mistanke i går om at 33,0 var «4–11 mm for høy» sammenlignet to ulike
størrelser og var feil.

---

## 1. Leveransetabell — Flight Glass klubbgeometri

Alle verdier i millimeter. **Fet** = anbefalt modellverdi. Desimaltegn er punktum (kontraktformat).

| Køllekategori | faceHeightMm | sweetSpotHeightMm | Kilde-URL | Konfidens |
|---|---|---|---|---|
| **driver** | **55.0**<br>publisert spenn 49.3–60.5 | **34.0**<br>målt 33.8–34.4 (4 arbeidseksempler), 33.8–36.0 (6 hoder) | face: `https://www.freepatentsonline.com/10721339.html` (Tab. 6: 49.3/52.6/54.6) · `https://www.freepatentsonline.com/8628433.html` (59.3/60.5, USGA-TPX 3003) · `https://www.freepatentsonline.com/11857852.html` (53–59, nominelt 56)<br>SS: `https://www.freepatentsonline.com/7775907.html` (Tab. 1) | **Sitert – målt.** SS fra ÉN patent (435 cc driver). faceHeight har ±6 mm konvensjonsspredning |
| **3-wood** | **37.7**<br>generisk FW-spenn 32–38 | **23.0**<br>← **interpolasjon** | face: `https://www.freepatentsonline.com/8628433.html` (3W, 180–190 cc) · `https://www.freepatentsonline.com/11857852.html` (FW 32–38, nom. 35) · `https://www.golfclub-technology.com/golfhybrids.html` (Wishon 949MC: 32 mm)<br>SS: **ikke publisert for 3W** | face: **Sitert – målt**<br>SS: **Interpolasjon** |
| **hybrid** | **37.8** | **21.0**<br>← **antagelse** | face: `https://www.freepatentsonline.com/8628433.html` (hybrid, 120–125 cc)<br>SS: **ikke publisert** | face: **Sitert – målt** (1 hode, 1 kilde)<br>SS: **Antagelse** |
| **langt jern**<br>(3–4) | **43.0**<br>← **antagelse**<br>(innenfor publisert 39.0–53.0) | **17.2**<br>← **interpolasjon** | båndkilde: `https://www.freepatentsonline.com/10918918.html` (Tab. 6+7, 12 hoder)<br>retning: `https://www.golfclub-technology.com/771CSI_Irons.html`<br>**ingen kilde oppløser per køllenummer** | **Antagelse / interpolasjon** |
| **mellomjern**<br>(5–7) | **46.0**<br>målt 39.0–53.0, n=12 | **18.4**<br>målt 17.7–19.2, n=12 | `https://www.freepatentsonline.com/10918918.html` (Tab. 6 Ex.1–7 + Tab. 7 Com.Ex.1–5) | **Sitert – målt.** Sterkeste raden i tabellen |
| **kort jern**<br>(8–PW) | **49.0**<br>← **antagelse** | **19.6**<br>← **interpolasjon** | samme båndkilde som over<br>**ikke publisert per køllenummer** | **Antagelse / interpolasjon** |
| **wedge**<br>(52–60°) | **51.0**<br>← **antagelse** | **21.0**<br>← **interpolasjon** | **ingenting publisert i noen kilde jeg fikk hentet** | **Ren ekstrapolasjon — svakeste raden** |

---

## 2. Måledefinisjon — MÅ inn i kontrakten

Tallene over er ikke sammenlignbare uten konvensjonen de er målt med. Kildene bruker minst fire ulike:

| Konvensjon | Kilde | Konsekvens |
|---|---|---|
| **A. Vertikalt, høyeste til laveste punkt på slagflaten, i referansestilling** | US10721339 (`.../10721339.html`): *"face height 154 denotes a vertical distance … between a first plane … passing through the highest point … of the strike face, and a second plane … passing through the lowest point"* | Riktig konvensjon for Flight Glass (z-koordinater). Driver 49.3–54.6 |
| **B. USGA-TPX 3003 (woodhoder)** | US8628433 (`.../8628433.html`): *"determined based on the USGA Procedure for Measuring the Club Head Size of Wood Clubs, USGA-TPX 3003"* | Driver 59.3/60.5 — **6–10 mm høyere enn A på ellers like hoder** |
| **C. Face plate-komponentens høyde** | US11857852 (`.../11857852.html`) | Øvre grense, ikke synlig flate. Driver 53–59, FW 32–38 |
| **D. Målt LANGS slagflaten ved slagflatesenterets tå-hæl-posisjon** | US10918918 (`.../10918918.html`): *"the face height Hf being measured along the hitting face at a toe-heel direction position of the face center"* | **Gjelder alle jern-radene.** Vertikal ekvivalent = Hf × cos(loft) |

**Kritisk for jern og wedge:** jerntallene er langs flaten. Vertikal ekvivalent:
- mellomjern 46.0 × cos(30°) ≈ **39.8 mm vertikalt**
- wedge 51.0 × cos(56°) ≈ **28.5 mm vertikalt**

Bruker motoren jerntallet som vertikal høyde blir wedge nesten **80 % for stor**. Feltet må enten hete `faceHeightAlongFaceMm` eller konverteres ved innlesing.

**sweetSpotHeightMm-datum er derimot entydig og riktig i alle SS-kildene:** vertikal høyde fra det horisontale planet klubben hviler på, i referansestilling (lie + loft satt). Det er sålen som datum, akkurat som formelen forutsetter.

Sweet spot er i alle kildene definert som **CG projisert vinkelrett ut på slagflaten** — ikke CG selv:
> *"sweet spot, which is the orthogonal projection of the club head's center of gravity (CG) onto the striking face of the head"* — US10721339

Det er nettopp det punktet `faceCentreOffsetMm` skal treffe. Ikke bytt inn CG-høyde: for driver ligger CG **26.2 / 27.4 / 28.7 mm** over bakken (US10721339 Tab. 5), mens sweetspoten ligger **34 mm** — 5–7 mm høyere, som er loftprojeksjonen. De to tallene er ikke utbyttbare.

---

## 3. Rådata bak tabellen (etterprøvbar bevislogg)

**Jern — US10918918 B2, "Iron type golf club head", Sumitomo Rubber Industries** — `https://www.freepatentsonline.com/10918918.html`
Gjelder reell loft 20°–35° (≈ 5–8 jern). Tab. 6 (Ex.1–7) + Tab. 7 (Com.Ex.1–5):

| | Ex1 | Ex2 | Ex3 | Ex4 | Ex5 | Ex6 | Ex7 | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Face height Hf | 45.5 | 47.0 | 45.5 | 50.0 | 42.0 | 41.0 | 51.0 | 45.5 | 50.5 | 42.0 | 39.0 | 53.0 |
| **Hs (sweetspot)** | 17.8 | 18.2 | 18.5 | 18.8 | 18.3 | 17.7 | 18.5 | 19.0 | 19.2 | 18.7 | 17.7 | 18.5 |
| Hc (flatesenter) | 22.4 | 23.6 | 22.4 | 25.0 | 20.5 | 20.0 | 25.0 | 22.4 | 25.0 | 20.5 | 19.0 | 27.0 |

Bonus-validering av selve modellutgangen: patentet oppgir SS-Y (sweetspot relativt flatesenter) = −4.8 / −5.9 / −3.6 / −6.3 / −3.5 / −3.5 / −6.4 mm. Snittet Hs − Hc = −4.3 mm. **`faceCentreOffsetMm` for et jern bør lande rundt −3 til −6 mm.** Kommer motoren utenfor det, er noe galt.

**Driver sweetspot — US7775907 B2, SRI Sports Limited** — `https://www.freepatentsonline.com/7775907.html`
Hult titanhode for driver, 435 cc, 195.0 g. Definisjon ordrett: *"the height of the center of gravity indicates the vertical height of the sweet spot SS measured from the above-mentioned horizontal plane HP under the standard state."*
Tab. 1, "Center of gravity Height (mm)": **34.0 · 33.8 · 34.4 · 34.1** (Ex.1–4) · 35.0 · 36.0 (Ref.1–2)

**Fairway wood sweetspot — US8795101 B2, SRI Sports Limited** — `https://www.freepatentsonline.com/8795101.html`
Woodhode, 155 cm³, loft 19.0°, lie 59°, 42". Definisjon: *"height of the center of gravity which is vertical height from the horizontal plane to the sweet spot SS was measured."*
Tab. 1: **22.0 · 21.9 · 21.9 · 22.1 · 21.0 · 21.3 · 21.2 · 20.8 · 20.6** (snitt 21.4)

**Dimensjoner per kølletype — US8628433 B2, Nike Inc.** — `https://www.freepatentsonline.com/8628433.html`

| Køllehode | Volum | Head height | **Face height** |
|---|---|---|---|
| Driver #1 | 400–430 cm³ | 65.7 | **60.5** |
| Driver #2 | — | 62.1 | **59.3** |
| Fairway Wood 3W | 180–190 cm³ | 42.2 | **37.7** |
| Fairway Wood 5W | 170–175 cm³ | 39.3 | **35.3** |
| Hybrid | 120–125 cm³ | 39.0 | **37.8** |

**Driver face height + CG — US10721339 B2, Sumitomo Rubber** — `https://www.freepatentsonline.com/10721339.html`
Tab. 6 Face Height: **49.3 / 52.6 / 54.6 mm**. Tab. 5 First Vertical Distance (CG over bakken): **26.2 / 27.4 / 28.7 mm**. Spennformulering: face height 43–61 → 45–58 → mest foretrukket 48–58 mm; CG-høyde 20–33 → mest foretrukket 25–30 mm.

**Face plate — US11857852 B2, TaylorMade** — `https://www.freepatentsonline.com/11857852.html`
Driver: *"face plate has a height between about 53 mm and about 59 mm"* → 55–57 → *"about 56 mm"*.
Fairway wood: *"between about 32 mm and about 38 mm"* → 34–36 → *"about 35 mm"*.

**Klubbmakerkilder (kvalitativ retning, ingen tall per køllenummer)**
- `https://www.golfclub-technology.com/golfhybrids.html` — *"fairway woods with a 32mm face height … (949MC woods)"*, og at hybrider typisk har **høyere** face height enn fairway woods (bekrefter Nike: hybrid 37.8 > 5W 35.3).
- `https://www.golfclub-technology.com/771CSI_Irons.html` — *"Progressive blade height from semi-shallow in the #4, 5 to taller in the wedges keeps the CG lower in the low loft heads while raising the CG in the high loft irons"*. Dette er **hele belegget** for at jernprogresjonen går oppover; det finnes ingen tall.
- Prior art sitert i US10918918: JPH8-112378A — kølle med loft 27°±3° har CG-høyde **19 mm ± 3 mm**, og *"the greater the golf club number is, the higher the center-of-gravity height"*.

---

## 4. Regulatoriske grenser — verifisert, men UBRUKELIG som modellinput

`https://www.randa.org/en/roe/the-rules-of-equipment/part-2-conformance-of-clubs` (Sect. 2.4b(i), ikke "Rule 6" som oppdragsteksten sa)

| Verdi | Hva det faktisk er | Karantene |
|---|---|---|
| 71.12 mm | Woods: såle-til-**krone**, maks, ved 60° lie, inkl. krontykkelse | ✗ Ikke faceHeight. 16 mm over faktisk driver-flatehøyde |
| 127 mm | Woods: hæl-til-tå — **horisontal** akse | ✗ Feil akse. Må aldri i vertikale felt |
| 63.5 / 177.8 mm | Putter, såle-til-topp / hæl-til-tå, maks | ✗ Grense, ikke måling |
| 22.23 mm | Målekonvensjon for hvor hælen defineres når ytterpunktet er udefinert | ✗ **Farlig:** ligner arvetallet 21.3, men er ubeslektet |

Jern og wedge har **ingen** dimensjonsgrense i mm overhodet — kun "hæl-til-tå > face-til-back". Regelverket inneholder null slagflatehøyder og null CG-høyder. Strengen "face height" forekommer 0 ganger. Regelverket kan aldri fylle noen av de to feltene.

**Ballradius:** R&A minimum er 42.67 mm diameter → 21.335 mm radius. Formelen bruker 0.0213 m = 21.3 mm, altså 0.035 mm lavere. Neglisjerbart, men bør rettes til 0.0213335 for renhet.

---

## 5. Interpolasjonsreglene jeg brukte (så de kan overprøves)

| Rad | Regel | Basis |
|---|---|---|
| 3-wood SS = 23.0 | 21.4 × (42.2 / 39.3) | Målt FW-snitt skalert med Nikes head height 3W/5W |
| hybrid SS = 21.0 | 21.4 × (39.0 / 39.3) | Samme skalering; hybrid head height ≈ 5W |
| jern SS-gradient | **+0.4 mm per køllenummer**, forankret i målt 18.4 ved ≈6-jern | Retning fra Wishon + JPH8-112378A. **Selve gradienten er min egen, ingen kilde oppgir den** |
| jern face-gradient | **+1.0 mm per køllenummer**, forankret i målt 46.0 ved ≈6-jern | Samme. Holder seg innenfor det målte båndet 39–53, men er ikke belagt |


---

## Dom over arvetallene

**DRIVER 33,0 mm — HOLDER.** Bruk heller **34,0**.
Målt sweetspot på et 435 cc driverhode: 33,8 / 34,0 / 34,1 / 34,4 mm over fire
arbeidseksempler (33,8–36,0 over seks), US7775907 Tab. 1, med nøyaktig riktig
definisjon. Uavhengig kryssjekk: US10721339 måler CG-høyde 26,2–28,7 mm, og
sweetspoten skal ligge `CG-dybde × sin(loft)` ≈ 6 mm høyere ≈ 34 mm. To
uavhengige patenter og en ren geometrikontroll peker på samme tall.

**JERN 21,3 mm — HOLDER IKKE.** Se F11. Anbefaling **18,4 mm** for mellomjern.

**BALLRADIUS.** Autoritativt: 1.680 in = eksakt **42,672 mm** → radius
**0,021336 m**. Motorens `0.021335` er halve regelens *avrundede* 42,67 (1 µm lav).
Studios `0.0213` er 3-sifret avrunding (36 µm lav). Bruk 0,021336 begge steder.

---

## Svakheter jeg ikke kan skjule

**Kildekonsentrasjon.** Fire av fem patenter med faktiske måletall tilhører samme
konsern (Sumitomo Rubber / SRI Sports / Srixon). Jern-båndet 17,7–19,2 mm er i
praksis **ett selskaps designmål**, ikke en bransjemåling — og patentet forsøker
eksplisitt å *senke* sweetspoten, så utvalget er systematisk skjevt lavt.
Konklusjonen «21,3 er for høyt» er robust (ingen av tolv hoder er i nærheten),
men bredden på det sanne bransjebåndet er ukjent.

**Wedge er helt udekket.** Null kildedekning på begge felt. Ren ekstrapolasjon.
Samtidig er wedge kategorien der `cos(loft)`-korreksjonen er mest brutal.

**Ingen kilde oppløser jern per køllenummer.** Gradientene +0,4 mm/køllenummer for
sweetspot og +1,0 mm for face height er agentens egne, uten kilde.

**Ingen OEM publiserer disse tallene.** Bekreftet for TaylorMade, Titleist, Ping,
Callaway og Mizuno. Alt måledata må hentes fra patenter.

**Driverdata er gammelt.** US7775907 beskriver et 435 cc hode. Dagens 460 cc med
lav-fremover-CG kan ligge annerledes. Ingen kilde fra siste ti år oppgir målt
sweetspot-høyde for driver.

---

## Neste steg, prioritert

1. **Finn én uavhengig måling av et wedgehode.** Tabellens svakeste ledd, og den
   eneste raden der arvetallet 21,3 faktisk kan vise seg riktig.
2. **Sjekk versjonshistorikken** til den gamle motoren for F11-mistanken.
3. **Merk konvensjonen** i feltnavnene før tallene tas i bruk.
