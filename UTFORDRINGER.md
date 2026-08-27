# Utfordringer i home-explorations — observert 2026-08-24

Kilde: fem skjermbilder fra `flightglass-home-explorations.sivertskotvold.chatgpt.site`.
Hver utfordring er knyttet til en kontraktsklausul eller en låst beslutning der en finnes.

## Løst

(U1 flyttet hit — se under.)

## Blokkerende

### U1 — LØST: underlaget mangler et navn
*Impact Studio, skjermbilde 1. Omklassifisert 2026-08-24 etter domeneavklaring.*

STRIKE-panelet sier `PURE · −13 mm` samtidig med `NO TURF CONTACT`. Det så ut som
en selvmotsigelse. Det er det ikke.

Ballen er en kule med radius `21.3 mm`. Kølla trenger bare nå ned til **treffhøyde**,
ikke til bakken. Kommer buens bunn til f.eks. 6 mm over bakken, treffer du ballen
rent — lavt på bladet — uten å ta turf.

Motoren modellerer dette allerede. `ENGINE-GAPS §9`:

```
faceCentreOffsetMm = ((lift + r_b) − (clubZ + sweet)) × 1000
    lift  = 0 m for iron · 0.030 m for driver
    r_b   = 0.0213 m
    sweet = 0.0213 m iron · 0.033 m driver
```

`lift` **er underlaget** — ballens høyde over bakkeplanet. Verifisert mot fixturen:
formelen reproduserer `faceCentreOffsetMm` med **0.00e+0 avvik** over alle 2500 caser.

Og kombinasjonen er ikke sjelden:

| | |
|---|---|
| PURE totalt | 550 |
| **PURE uten turfkontakt** | **404 (73 %)** |
| derav jern (`lift = 0`) | 120 |
| offset i de casene | `−15.81` … `+7.86` mm |

**Problemet er at `lift` er hardkodet til to verdier og aldri vises.** Brukeren ser
to sanne signaler uten den tredje opplysningen som forener dem.

**Løsning:** `lieHeightMm` blir en eksplisitt navngitt input, per `01` §10 sitt krav
om at nye modeller skal ha egne navngitte input framfor skjulte antagelser.

| Underlag | `lieHeightMm` | Konsekvens |
|---|---:|---|
| Steingulv / matte / hardpan | `0` | Ballen treffer lavt på bladet. Grense `−15.8 mm`. |
| Tight lie | `2–5` | |
| Normal fairway | `5–12` | Ballen ligger litt opp i gresset — treffer nærmere senter. |
| Rough | `12–25` | |
| Tee | `25–45` | Driverens nåværende `0.030 m` er ett punkt på denne skalaen. |

Med underlaget synlig blir `PURE` + `NO TURF CONTACT` ikke en motsetning, men en
nyttig setning: *du traff ballen rent, lavt på bladet, uten å ta turf.*

### U2 — Tekstkollisjoner i FLIGHT-visningen
*Skjermbilde 4.*

- `122 m L` overlapper `Apex 36 m`
- `Δ vs previous pin` og `−9 m carry · → 73 m more curve` ligger oppå ballbanen

Avlesningsblokken tegnes over scenen uten reservert plass. Dette er ikke en
designbeslutning, det er en layoutfeil — og den rammer nøyaktig de tallene som
skal være lettest å lese.

### U3 — To fargesystemer eksisterer nå samtidig
*Alle skjermbilder mot `DESIGN.md`.*

| | home-explorations | DESIGN.md (låst) |
|---|---|---|
| Attack | rosa | — |
| Path | cyan | — |
| Face | laksrød | — |
| Dyn Loft | lilla | — |
| Arc Height | fiolett | — |
| Aktiv input | parameterens egen kulør | `orange` #F75105 |
| Holdt konstant | parameterens egen kulør, dempet | `grey` #5D5C5B |
| Flater | lilla gradient | kjølig kull #22242B |

Det ene er **kategorisk** — hver parameter eier en hue. Det andre er **binært** —
oransje betyr aktiv, grått betyr holdt.

De kan ikke sameksistere. Dette er nøyaktig lekkasjemekanismen du hyret meg for:
to kildesannheter som begge ser gyldige ut.

## Alvorlige

### U4 — Lilla vask svekker oransjen
*Skjermbilde 2, 3, 4, 5.*

Flatene er fiolett gradient. Granskerne målte at Phoenix' oransje er tung fordi den
står mot **kjølig kull** — 3,0 % mettet mot 2,7 % vask. En varm eller lilla
atmosfærisk vask er den målte årsaken til at oransje mister tyngde.

Ballbanen må her kjempe mot en fiolett bakgrunn i stedet for å stå alene mot kull.

### U5 — SIDE-visningen viser et tall den ikke kan tegne
*Skjermbilde 2.*

`76 m L` står stort i hjørnet. SIDE er høydeplanet.

`02-BALL-FLIGHT.md` definerer SIDE som Launch Angle, Apex, Landing Angle, Carry,
tracer og landingspunkt. Sideveis avvik hører til TOP. Tallet har ingen visuell
referent på skjermen det står på.

### U6 — Bare 4 av 13 utfall er synlige
*Skjermbilde 4, `OUTCOME · READ`.*

TOTAL, APEX, CURVE, BALL SPEED er framme. Resten ligger bak `ALL METRICS ▾`.

`05-ASK-FLIGHTGLASS-AND-CONNECTIONS.md` flagget nøyaktig dette som kjent gjeld:
«den gamle UI-en viser bare de første fire outputene… gjenoppbyggingen skal gjøre
dette eksplisitt.» Mønsteret er reprodusert, ikke rettet.

### U7 — Gridetiketter kolliderer med hovedtallet
*Skjermbilde 3 og 5.*

Downrange-etiketten `200` ligger bak `77 m L` respektive `92 m L`. To ulike
tallsystemer i samme piksler.

## Kalibrering

### U8 — Demotilstandene er ekstremverdier
*Skjermbilde 3, 4, 5.*

`FACE −11.4°` med `PATH +0.0°` gir face-to-path `−11.4°` og **92 m venstre** på
209 m carry. Det er 23.8°. Skjermbilde 4 viser 122 m venstre.

Gyldig i modellen, men det er ikke et golfslag — det er en shank-klasse hook.
Designet blir vurdert på tilstander brukeren nesten aldri ser.

### U9 — Ufysisk køllekombinasjon presenteres som normal
*Skjermbilde 2.*

`DYN LOFT 41.1°` ved `129 mph` køllehastighet. Det er en wedge svingt i driverfart.
Motoren godtar det (loft 0–50°), men en bruker som kan begrepene ser en kølle som
ikke finnes.

Merk også `motor/FUNN.md` F2: 87 % av realistiske slag ligger allerede utenfor
aerodynamikkens deklarerte gyldighet. Ekstremverdier gjør det verre, usynlig.

### U10 — Rosa og laksrød brukes til to ulike parametre
*Skjermbilde 1 mot 3.*

`ATTACK` er rosa, `FACE` er laksrød. Nabofarger for to parametre som opptrer i
ulike visninger. Tekstetikettene redder D10, men fargekodingen bærer ikke sin
egen vekt.

## Verdt å beholde

Fem grep i disse skjermbildene er bedre enn det jeg lagde, og bør inn i systemet:

1. **Pin + «Δ vs previous pin»** — eksplisitt navngitt referanse med delta i klartekst:
   «−6 m carry · → 27 m more curve». Det er sensitivitetssvaret (D6) levert som én setning.
2. **Måletrinn tvers over deltaflaten** — de horisontale streken gjør flaten *målbar*,
   ikke bare synlig. Løser granskernes innvending om at flaten «lyver om sin egen størrelse».
3. **Linse styrer inputpanel** — `INPUT · DIRECTION PLANE` (face+path) for TOP,
   `INPUT · LAUNCH PLANE` (loft+attack) for SIDE, `OUTCOME · READ` for FLIGHT.
   Nøyaktig kartleggingen `02-BALL-FLIGHT.md` beskriver.
4. **Køllefart som permanent stepper** øverst, uavhengig av linse. Spec krever at den
   alltid er tilgjengelig; dette løser det uten å ta plass i inputpanelet.
5. **Utvidbar STRIKE-inset** i Studio med ekspander-pil. Matcher `03`s krav om at
   Strike alltid er tilgjengelig og kan ekspanderes uten å lage ny fysikk.
