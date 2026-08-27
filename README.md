# Flightglass rebuild handoff

Denne mappen beskriver produktet som skal bevares når Flightglass bygges på
nytt. Den dokumenterer funksjon, fysikk, datagrenser og brukerjobber. Den
gjeldende fargepaletten, typografien og layouten er **ikke** en del av
kontrakten. Skjermbildene viser bare hva dagens funksjoner gjør.

## Les i denne rekkefølgen

| Fil | Oppgave |
|---|---|
| [01 — Motor og modell](./01-PHYSICS-AND-MECHANICS-ENGINE.md) | Definerer all beregning som nye flater skal bruke. |
| [02 — Ball Flight](./02-BALL-FLIGHT.md) | Beskriver live ballflukt, input, utfall og visninger. |
| [03 — Impact Studio](./03-IMPACT-STUDIO.md) | Beskriver bue, low point, kontakt og avledet levering. |
| [04 — D-plane](./04-D-PLANE.md) | Beskriver retning, face/path og den delte Ball Flight-motoren. |
| [05 — Ask Flightglass og Connections](./05-ASK-FLIGHTGLASS-AND-CONNECTIONS.md) | Beskriver svarmotoren og det visuelle parameterkartet. |

## Produktet i én setning

Flightglass lar en golfer endre leveringen av køllen, se et modellert slag eller
treff reagere umiddelbart og forstå **hvorfor** utfallet endret seg.

## Låste beslutninger i denne pakken

1. Det finnes én autoritativ ballfluktmotor og én autoritativ
   treffgeometrimotor.
2. D-plane er en inngang og visning av Ball Flight, ikke en separat beregning.
3. Attack Angle og Club Path er resultater i Studio, men input i Ball Flight.
4. Ask Flightglass er guidet og deterministisk. Ingen fritekst eller åpen
   chatbot inngår i denne produktbeskrivelsen.
5. Connections viser modellens dokumenterte relasjoner. Det skal ikke finne på
   forbindelser eller universelle påvirkningsprosenter.

## Skjermbilder

| Bilde | Oppløsning | SHA-256 | Bruk |
|---|---:|---|---|
| `assets/ball-flight.png` | 430 × 932 | `0BA98C698500A9A7E22C7812D3B2102B75B6AE0E49724800B64350CD201CE876` | Funksjonsreferanse for Side-visningen. |
| `assets/impact-studio.png` | 932 × 430 | `64D63CDA65D0B0D6E14A1E424AE431F28596D7784E14290D8A24658AA847C4AA` | Funksjonsreferanse for Face On Studio. |
| `assets/d-plane.png` | 430 × 932 | `B4AB68A7DE1D973EEF2AFE7A5FFD0D86D7B67A38EB1FFA79226881F1338D7F0E` | Funksjonsreferanse for D-plane Top. |

Bildene er kopiert fra den verifiserte appen 24. august 2026. De er ikke en
bestilling av det nye designsystemet.

## Fem kontrakter som fortsatt bør skrives

Disse fem filene bør lages før full implementering starter:

1. **Product, Home and onboarding contract** — målgruppe, V1-scope, splash,
   onboarding, Home, betalingsøyeblikk og eksplisitte ikke-mål.
2. **Design-system contract** — tokens, typografi, tall, fargesemantikk,
   komponenter, motion, reduced motion og tilgjengelighet.
3. **State and navigation contract** — én fem-input shot state, deep links,
   tilbakeflyt, lagring, orientering og hva som aldri skal persisteres.
4. **Truth and verification contract** — golden cases for motoren,
   sannhetsnivåer, godkjente Connections-kanter, device-matrise og visuell QA.
5. **Native, commerce and release contract** — Capacitor/iOS, RevenueCat,
   restore, personvern, support, signing, TestFlight og App Store.

Uten disse kan hver ny skjerm bli pen alene, men appen vil fortsatt kunne få
ulik fysikk, ulik state og ulik navigasjon fra modul til modul.

## Anbefalt byggerekkefølge

1. Portér motorene og lås golden cases.
2. Lag felles input-, output- og truth-schema.
3. Bygg Ball Flight og D-plane over samme state.
4. Bygg Impact Studio som en separat geometrimotor.
5. Koble Connections og Ask Flightglass til de to motorene uten å kopiere dem.

## Kildesannhet i gammel kodebase

| Ansvar | Autoritativ kilde |
|---|---|
| Ballflukt | `impact-flight.js`, `flightglass-3d-spin-model.js` |
| UI-normalisert utfall | `impact-outcome.js` |
| Treffgeometri | `swing-parameters-and-impact.js` |
| Ball Flight/D-plane-flate | `impact.html` |
| Studio-flate | `impact-studio.html` |
| Guidet kunnskap | `guide-knowledge.js`, `guide-engine.js`, `jarvis.js` |
| Relasjonskart | `connections-map.js` |

Ved konflikt skal implementert motor og tester vinne over gamle mocker,
skjermbilder og historiske spesifikasjoner.
