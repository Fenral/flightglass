> **KORREKSJONER 2026-08-25.** Spec-teksten under er ikke rettet — sporet skal
> være synlig.
>
> **Hele grensesnittet er på engelsk** (D30) — og det er allerede oppfylt.
> Verifisert: `ask-catalog.json` er 100 % engelsk. Alle 28 prompts, shortAnswers,
> bullets og boundaries. Null norske tegn eller ord. Kun dette dokumentets
> *prosa* er norsk. **Ingen oversettelsesjobb finnes.**
>
> **`truthTier` har seks verdier, ikke fire** — `engine-calculated` (10),
> `engine-derived` (9), `geometry-calculated` (3), `heuristic-estimate` (2),
> `unsupported` (3), `external-reference` (1).
>
> Den kolliderer **ikke** med D11. D11 forbyr sannhetsmerker på hver *verdi* i
> grensesnittet. `truthTier` sitter på hvert *spørsmål* og styrer svarets form
> gjennom `gapClass`. Arbeidsdelingen er ren:
>
> > `truthTier` er **hvorfor**. `gapClass` er **hva vi gjør med det**.
>
> Fire av seks tiers bestemmer `gapClass` entydig. `unsupported` opptrer i tre
> ulike `gapClass` fordi «vi kan ikke svare» kan håndteres på tre måter:
> modeller omtrentlig, pek på ekstern data, eller nekt å gi falsk presisjon.
>
> **Connections er rent generelt** (D44) — ingen kobling til brukerens slag,
> ingen deriverte, ingen motoravhengighet. Kartet blir en **statisk graf**.
> Arbeidsdelingen er dermed ren:
>
> > **Connections eier struktur. Ball Flight eier størrelse.**
>
> Spørsmålet «hvor mye er én grad» (D6) besvares utelukkende av Pin/delta-mekanikken.
>
> **Kartet leses bakover fra én valgt metrikk** (D43), med hele årsakskjeden til
> inputene sammenklappet — men kun nodene på den kjeden, aldri alle 23 samtidig.
>
> **Kant `e30` er fortsatt feilmerket.** Grafen sier Spin Loft → Landing Angle,
> men landingsmodellen leser `abs(signedVerticalSpinLoftDeg)`, ikke den offentlige
> ikke-negative 3D-verdien. Ført i `_knownDebt`, ikke rettet.

# Ask Flightglass og Connections

Ask Flightglass og Connections er to lag av samme læringsprodukt:

```text
Connections
«Hvor hører parameteren hjemme, og hva er den koblet til?»
                         ↓
Ask Flightglass
«Hva betyr denne konkrete relasjonen?»
                         ↓
Interactive lab
«Hva endres når jeg flytter ett støttet input?»
```

Ingen av dem eier egen fysikk. Ask Flightglass bruker motoroutput. Connections
bruker en kuratert relasjonsgraf med eksplisitte sannhetsgrenser.

Denne filen har med vilje ikke skjermbilde. Den beskriver produktet uten å
bestille layout eller visuelt designsystem.

## 1. Ask Flightglass

### Produktbeskrivelse

Ask Flightglass er en deterministisk, guidet svarmotor for golfballfysikk.
Brukeren velger et forhåndsdefinert spørsmål, får kortsvaret først og kan deretter
åpne belegg, eksakte modellverdier, begrensninger og — når motoren støtter det —
en interaktiv én-variabel-sammenligning.

Det er ikke chat, AI-coaching eller fritekstsøk.

### Brukerjobben

Ask Flightglass skal være stedet brukeren åpner når en vennegjeng diskuterer et
enkelt eller avansert golfspørsmål. Man skal finne et konkret svar raskt og
kunne grave dypere uten å lese et helt kapittel først.

### Navigasjonsmodell

Tre innganger:

1. **Saved setup** — bruk en gyldig, lagret modellstate hvis en finnes.
2. **Explore a topic** — velg område og deretter spørsmål.
3. **Compare the model** — åpne en kontrollert én-input-lab.

Seks temaer:

| Tema | Omfang |
|---|---|
| Direction | Start, face/path, curve og side. |
| Impact | Low point, kontakt og Studio-geometri. |
| Launch & spin | Launch Angle, Spin Loft, Backspin, høyde og landing. |
| Distance | Ball Speed, Smash, Carry og Total. |
| Conditions | Vær og forhold som ligger utenfor fem-input-motoren. |
| Model limits | Hva modellen vet, estimerer eller ikke kan svare på. |

Dagens katalog har 28 faste spørsmål: Direction 10, Impact 4, Launch & spin 5,
Distance 3, Conditions 2 og Model limits 4.

### Spørsmålsdata

Hvert spørsmål skal ha:

```js
{
  id,
  topicId,
  prompt,
  tags,
  shortAnswer,
  bullets,
  truthTier,
  boundary,
  nextAction,
  metricIds,
  lab,
  gapClass
}
```

Krav:

- `shortAnswer`: én eller to setninger;
- `bullets`: to eller tre konkrete belegg;
- `boundary`: hva svaret ikke fastslår;
- `nextAction`: nøyaktig én hovedhandling;
- `metricIds`: kun ID-er som finnes i en eksplisitt capability-registry;
- `lab`: valgfri, men bare når modellen støtter relasjonen;
- `gapClass`: synlig beslutning om motorens evne til å svare.

Den gamle katalogen har kjent datagjeld: fem spørsmål refererer til ID-er som
den gamle rendereren ikke kan lese (`lowPoint`, `contactHeight`, `entry`,
`exit`, `altitude`, `temperature`, `windSpeed` og `windDirection`, med enkelte
gjentakelser). Den gamle UI-en filtrerer dem bort og kan vise generiske
direction-metrics i stedet. Gjenoppbyggingen skal ikke ha denne fallbacken:
legg ID-en i en navngitt Studio-/external-registry, eller fjern metrikkravet og
vis modellgrensen.

### Anbefalt svarhierarki i gjenoppbyggingen

1. Spørsmålet.
2. Kort svar.
3. To eller tre kulepunkter med belegg.
4. Synlig truth-label.
5. Deterministisk illustrasjon når romlig forståelse hjelper.
6. Eksakt tabell når en gyldig modellstate finnes.
7. Model limits, sekundært men tilgjengelig.
8. Én neste handling.

Den gamle flaten viser truth-label før spørsmålet og kulepunktene. Rekkefølgen
over er et nytt informasjonsvalg, ikke en beskrivelse av gammel DOM-rekkefølge.

Vanlig brødtekst skal kunne brukes når det er mest lesbart. Kulepunkter er
standard for belegg, ikke et absolutt forbud mot korte forklaringsavsnitt.

### Truth-labels

| Intern tier | Brukertekst |
|---|---|
| `engine-calculated`, `engine-derived` | Range modelled |
| `geometry-calculated` | Studio geometry |
| `heuristic-estimate` | Estimate |
| `external-reference` | External reference |
| `unsupported` | Not modelled |

### Evne til å svare

| Klasse | Dagens antall | Produktatferd |
|---|---:|---|
| `answer-now` | 19 | Svar med eksisterende motor og eventuelt lab. |
| `bounded-model` | 5 | Forklar hva en separat, testet modell trenger. |
| `external-data` | 2 | Forklar hvilken måling eller kalibrering som mangler. |
| `reject-false-precision` | 2 | Avvis et presist svar som ikke kan forsvares. |

### Interactive labs

| Lab | Aktiv input | Live output |
|---|---|---|
| Direction | Face eller Path | Start Direction, Spin Axis, Curve, Side |
| Launch & spin | Dynamic Loft, Attack eller Speed | Launch Angle, Spin Loft, Backspin, Apex |
| Distance | Speed, Dynamic Loft eller Attack | Ball Speed, Smash, Carry, Total |

Hver lab skal:

- vise alle fem input;
- la nøyaktig ett input være aktivt;
- merke de fire andre som `held constant`;
- vise Before, Current og Delta;
- ha både visuell graf og eksakt tabell;
- gi samme informasjon i reduced motion;
- stoppe eller forklare no-flight, feil spin-loft-domain og spin ceiling.

Katalogen deklarerer også Landing Angle for Launch & spin, men den gamle UI-en
viser bare de første fire outputene. Gjenoppbyggingen skal gjøre dette
eksplisitt: behold fire oversiktschips og legg Landing Angle i den eksakte
tabellen, eller gi plass til fem uten å kutte en verdi stille.

### Ask Flightglass skal aldri

- ta imot fritekst i denne versjonen;
- kalle et eksternt LLM eller late som det gjør det;
- diagnostisere kropp eller svingbevegelse;
- velge kølle eller utstyr for brukeren;
- love en personlig optimalverdi;
- omtale en modellstate som målt eller faktisk uten ekstern datakilde;
- regne et eget resultat som avviker fra Ball Flight/Studio.

## 2. Connections

### Produktbeskrivelse

Connections er det visuelle kartet over Flightglass-modellen. Hele systemet er
synlig i hvile. Når brukeren velger én parameter, kan man se enten hva som former
den eller hva den selv former.

Signalstyrke er kvalitativ og lokal til den støttede modellen. Den er ikke en
universell årsaksprosent eller generell viktighet i golf.

### De 23 nodene

| Lag | Noder |
|---|---|
| Geometry | Swing Plane, Swing Direction, Low Point, Ball Position, Arc Height |
| Delivery | Attack Angle, Club Path, Club Face, Dynamic Loft, Club Speed, Strike |
| Separation | Spin Loft, Spin Axis, Launch Direction, Launch Angle, Ball Speed |
| Flight | Backspin, Curve, Apex, Carry |
| Landing | Landing Angle, Carry Side, Total |

### Interaksjon

Default:

- alle 23 navn er synlige og kan trykkes;
- ingen node er forhåndsvalgt;
- kartet er rolig, men forbindelsesstrukturen kan anes;
- Ask Flightglass og produktmenyen er tilgjengelig.

Fokus:

1. Velg node.
2. Velg `What shapes it` eller `What it shapes`.
3. Vis maksimalt to hopp og syv fremhevede noder.
4. Behold resten som et lesbart, romlig stabilt bakgrunnskart.
5. Vis rolle, tre korte forklaringspunkter og eventuell Ask-deep-link.
6. Reset gjenoppretter hele systemet og menyen.

### Relasjonstyper

| Type | Betydning |
|---|---|
| Direct | En eksplisitt, umiddelbar relasjon i modellen. |
| Coupled | En koblet eller kontekstavhengig geometrirelasjon. |
| `modeled` | Et downstream-resultat skapt av Flightglass-modellen. Brukertekst kan være «Modelled». |

Dagens kuraterte grafdata har 36 lenker: 24 `direct`, 1 `coupled` og 11
`modeled`. Gjenoppbyggingen skal validere alle endepunkter og typer samlet;
den gamle testen låser bare et representativt utvalg.

Grafen har én kjent semantisk gjeld: den gamle kanten `Spin Loft → Landing
Angle` peker fra den offentlige 3D Spin Loft-noden, mens landingsmodellen faktisk
bruker absoluttverdien av `signedVerticalSpinLoft`. Gjenoppbyggingen skal enten
modellere `Vertical Spin Loft` som en egen intern node/egenskap eller fjerne
kanten. Den skal ikke videreføres som en verifisert 3D-relasjon.

Attack Angle ↔ Club Path er den nåværende coupled-relasjonen. De er
søskenresultater av Studio-geometrien, ikke en enkel énveis årsak mellom to
uavhengige knapper.

### Relativ påvirkning

Styrkenivåer:

- `primary`;
- `contributing`;
- `contextual`;
- `variable`.

De skal uttrykkes redundant med linjetykkelse, luminans og tekst. Farge alene
er ikke nok. Pulshastighet skal ikke variere med styrke, fordi det ville antyde
ulik fysisk tidsforsinkelse.

### Forbindelser som ikke finnes

Ikke legg til disse bare fordi de kan være sanne i bredere golfkontekst:

- Strike → Ball Speed;
- Backspin → Carry;
- Backspin → Apex;
- Backspin → Landing Angle;
- Apex → Landing Angle.

Dagens hybridmotor implementerer dem ikke. En senere full ballfluktmodell kan
endre dette, men da må motor, tester og graf endres samlet.

### Rollemarkering

Attack Angle og Club Path må få en synlig rolle med denne betydningen:

```text
Derived in Studio · Used in Ball Flight
```

Den gamle flaten bruker teksten `Studio-derived · Range input`. Begge er
semantisk riktige; velg én ordlyd i det nye designsystemet.

Uten denne rollen ser Connections ut som én overbestemt graf hvor alle noder er
frie input samtidig.

## 3. Sammenhengen mellom modulene

| Behov | Riktig modul |
|---|---|
| Se hele systemet | Connections |
| Forstå én relasjon | Ask Flightglass |
| Prøve ett input med fire holdt | Ask-lab |
| Se hele slaget reagere | Ball Flight |
| Se face/path og retning | D-plane |
| Se bue, low point og kontakt | Impact Studio |

Connections kan være Home eller hovedinngangen. Ask Flightglass kan åpnes fra
spørsmål på Home eller fra valgt parameter. De skal ikke slås sammen til én
tett skjerm hvor kart, langt svar, lab og tre instrumentmenyer vises samtidig.

## 4. Akseptansekriterier

1. Ask har ingen fritekst, nettverksmodell eller skjult chat-path.
2. Alle 28 spørsmål er stabile ID-er med truth, boundary og én next action.
3. Labs bruker samme Ball Flight-motor og endrer nøyaktig ett input.
4. Connections viser alle 23 noder i default og holder dem direkte valgbare.
5. Fokus viser maksimalt syv relevante noder og kan resettes.
6. Grafen bruker bare dokumenterte `direct`/`coupled`/`modeled`-kanter.
7. Styrke beskrives som relativ innen modellen, aldri som universell prosent.
8. Attack og Path har kontekstrolle for Studio og Ball Flight.
9. Alle diagrammer har tekstalternativ, tastatursti og reduced-motion-paritet.
10. Ingen av modulene kopierer eller omdefinerer fysikk.

## 5. Kilder i gammel kodebase

- `guide-knowledge.js`
- `guide-engine.js`
- `jarvis.html`
- `jarvis.js`
- `connections-map.js`
- `scripts/guide-browser.test.mjs`
- `scripts/connections-contract.test.mjs`
- `scripts/connections-browser.test.mjs`

## Relatert

- [Motor og modell](./01-PHYSICS-AND-MECHANICS-ENGINE.md)
- [Ball Flight](./02-BALL-FLIGHT.md)
- [Impact Studio](./03-IMPACT-STUDIO.md)
- [D-plane](./04-D-PLANE.md)
