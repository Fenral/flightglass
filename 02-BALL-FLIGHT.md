> **RETTET 2026-08-25 — se D40, D42.**
> Dette dokumentet spesifiserer tre linser (Top, Side, Flight). Det er redusert til **to**:
> **DIRECTION** (tidligere Top) og **HEIGHT** (tidligere Side). `FLIGHT` er fjernet.
>
> De 13 utfallene fordeles på plan i stedet for å ligge i FLIGHT sitt panel:
> - **DIRECTION:** Launch Direction · Spin Axis · Curve · Side · Face-to-Path
> - **HEIGHT:** Launch Angle · Apex · Landing Angle · Carry · Total · Smash · Backspin · Spin Loft
> - **Begge:** Ball Speed
>
> Det lukker U5 (et sideveis tall vist i høydeplanet) og U6 (bare 4 av 13 synlige)
> uten en egen regel — navnet på linsen forteller hva den kan tegne.

# Ball Flight

Ball Flight er live-instrumentet som viser hva de fem leveringsverdiene gjør med
et modellert golfslag. Brukeren skal forstå sammenhengen ved å endre én verdi
og se alle relevante utfall oppdatere umiddelbart.

![Ball Flight i Side-visning](./assets/ball-flight.png)

> Skjermbildet er en funksjonsreferanse fra dagens app. Farge, typografi,
> komponentform og layout er ikke normative for det nye designsystemet.

## Produktjobb

Brukeren skal kunne svare på:

> «Hvis køllen leverer disse fem tallene, hvordan flyr det modellerte slaget,
> og hva endrer seg når jeg flytter én av dem?»

Ball Flight må være forståelig uten at brukeren kan D-plane-språk på forhånd.
Det skal alltid være tydelig hva som er input, hva som er output og hva som er
modellert fremfor målt.

## Plattform og orientering

- Primærflate: telefon i portrett.
- Historisk route: `impact.html`.
- Én tydelig Home-kontroll øverst til venstre.
- Ingen permanent bunnmeny inne i instrumentet.
- Ball Flight og D-plane deler samme state og motor.

## Standardtilstand

| Input | Standard | Område | Steg i dagens Range |
|---|---:|---:|---:|
| Club Speed | `90 mph` | 30–150 mph | 1 mph |
| Club Face | `+2.0°` | −15–+15° | 0.1° |
| Club Path | `0.0°` | −15–+15° | 0.1° |
| Attack Angle | `+3.0°` | −15–+15° | 0.1° |
| Dynamic Loft | `24.0°` | 0–50° | 0.1° |

Dette er en illustrativ modelltilstand, ikke brukerens målte slag.

## De fem inputene

| Input | Enkel forklaring |
|---|---|
| Club Speed | Hvor fort køllehodet beveger seg ved treff. |
| Club Face | Hvor køllebladet peker relativt til mållinjen. |
| Club Path | Køllehodets horisontale bevegelsesretning gjennom treffet. |
| Attack Angle | Om køllehodet beveger seg opp eller ned ved treffet. |
| Dynamic Loft | Loftet køllen faktisk leverer ved treffet. |

Alle fem skal kunne redigeres. UI-et skal aldri late som en skjult club selector,
balltype eller personlig kalibrering endrer motoren.

## Tre visninger, ett resultat

Kamera eller visning må aldri endre fysikken.

### Outcome

Den raskeste lesevisningen. Den skal vise hele utfallet og gjøre alle fem input
tilgjengelige uten å kreve at brukeren forstår kameraene først.

### Side

Viser høydeplanet:

- Launch Angle;
- Apex;
- Landing Angle;
- Carry;
- tracer og landingspunkt.

De primære edit-kontrollene er Dynamic Loft og Attack Angle. Club Speed skal
fortsatt være tilgjengelig.

### Top

Viser retningsplanet:

- target line;
- Launch Direction;
- Curve;
- final Side;
- live tracer og eventuelle sammenligninger.

De primære edit-kontrollene er Club Face og Club Path. Club Speed skal fortsatt
være tilgjengelig. D-plane-deep-linken åpner direkte her.

## Moduser

| Modus | Oppgave |
|---|---|
| **Shot** | Rolig standardtilstand for å lese slaget før man redigerer. |
| **Change** | Eksponerer relevant input og oppdaterer resultatet live. |
| **Details** | Viser alle utfall gruppert og med tydelig enhet/truth. |

Et nytt design kan presentere disse annerledes, men må bevare skillet mellom å
lese slaget, endre leveringen og undersøke detaljene.

## De 13 utfallene

| Gruppe | Utfall |
|---|---|
| Direction | Launch Direction, Spin Axis, Curve, Side |
| Launch & spin | Launch Angle, Spin Loft, Backspin, Landing Angle |
| Distance | Smash, Ball Speed, Carry, Total, Apex |

### Krav til presentasjon

1. Carry kan være det største, vedvarende tallet, men må ikke dupliseres i samme
   visning uten en klar funksjon.
2. Enheter skal alltid være synlige.
3. **Ny tilgjengelighetsforbedring i gjenoppbyggingen:** Retning skal bruke
   både fortegn og `L/R/C` eller ord, ikke farge alene. Den gamle flaten bruker
   bare fortegn på enkelte gradverdier.
4. Input som endres og output som reagerer skal være visuelt koblet.
5. Resultater skal oppdatere i samme frame eller event-loop-syklus som input;
   forklarende motion kan følge etter uten å forsinke tallet.

## Live interaksjonsloop

```text
Velg input
    ↓
Flytt slider eller bruk −/+
    ↓
Kjør den samme fem-input-motoren
    ↓
Oppdater tracer + alle 13 utfall
    ↓
Vis én kort årsakssammenheng
```

Den aktive slideren skal ha:

- minst 44 × 44 px touch target;
- tastatur- og knappalternativ;
- tydelig null/reference der det gir mening;
- min, maks, nåverdi og enhet;
- tilgjengelig navn og verdi;
- ingen kontinuerlig animasjon i reduced motion.

## Sammenligning

Brukeren kan feste et modellert slag som en midlertidig ghost og deretter endre
input. Kontrakten er:

- maksimalt tre synlige referanser;
- den eldste fjernes når en fjerde festes;
- referansen må bruke den samme motoren;
- live slag skal alltid ha høyere visuell prioritet;
- sammenligninger er sesjonsverktøy, ikke en lovet shot-history-funksjon.

Ved reload kan leveringsverdier og pins nullstilles i dagens produkt. Hvis den
nye appen skal persistere dem, må det besluttes i en egen state-kontrakt.

## Truth og modellgrenser

Ball Flight er:

- deterministisk;
- sentrert-treff-basert;
- en hybrid av beregnet D-plane/spinn/lateral flight og empiriske
  longitudinal estimates.

Ball Flight er ikke:

- en launch monitor;
- et faktisk målt slag;
- en kropps- eller svingdiagnose;
- en full vær-, ball-, kølle- eller turfmodell;
- et løfte om optimal personlig launch eller spin.

Se [motorfilen](./01-PHYSICS-AND-MECHANICS-ENGINE.md) for formler og truth per
output.

## State-kontrakt

Ball Flight skal eie én enkel delivery state:

```js
{
  clubSpeed: 90,
  faceAngle: 2,
  clubPath: 0,
  attackAngle: 3,
  dynamicLoft: 24
}
```

Renderet kamera, aktiv tab, åpent panel og animation state skal ligge separat
fra fysikkinput. `station` eller `lens` skal aldri inngå i motorens cache key.

## Akseptansekriterier

1. Alle fem input kan endres og alle 13 utfall kommer fra samme solve.
2. Outcome, Side og Top viser numerisk identiske resultater for samme state.
3. D-plane-deep-linken åpner samme state i Top/Change uten å kopiere motoren.
4. Ingen UI-lag regner ut egne launch-, curve-, carry- eller spinverdier.
5. Portrettflater fungerer ved 375 × 812, 390 × 844 og 430 × 932.
6. Alle kontroller er minst 44 px og brukbare med tastatur.
7. Reduced motion beholder alle tall, labels og årsakssammenhenger statisk.
8. **Ny gjenoppbyggingsregel:** Ugyldig/no-flight/out-of-domain state skal
   enten hindres ved input eller forklares med motorens `reason`; plausible
   flight-tall skal aldri vises. Den gamle motoren lager en `reason`, men den
   gamle flaten viser den ikke konsekvent.

## Kilder i gammel kodebase

- `impact.html`
- `impact-outcome.js`
- `impact-flight.js`
- `impact-camera.js`
- `impact-annotate.js`
- `scripts/impact-portrait-browser.test.mjs`

## Relatert

- [Motor og modell](./01-PHYSICS-AND-MECHANICS-ENGINE.md)
- [D-plane](./04-D-PLANE.md)
- [Ask Flightglass og Connections](./05-ASK-FLIGHTGLASS-AND-CONNECTIONS.md)
