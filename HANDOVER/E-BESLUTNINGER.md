# Strøm E — Onboarding og splash: leveranse og beslutninger

**Status: LEVERT 2026-08-26.** Rot-`npm test` grønn: fysikklint 53 filer 0 funn ·
motor 465 · adapter + lint 75.

Onboardingen kjører **inne i de ekte skjermene** (D56). Det finnes ingen
mockup-versjon av appen noe sted i denne leveransen.

---

## Leveransen

| Fil | Rolle |
|---|---|
| `app/onboarding/copy.js` | All tekst brukeren ser. Godkjent ordrett av eier (D105). |
| `app/onboarding/steps.js` | De seks stegene som data: skript, port, plassering. |
| `app/onboarding/refs.js` | Leksjonens faste referansetall, hentet fra motoren. |
| `app/onboarding/onboarding.js` | Kontrolleren + enhetsskjermen. |
| `app/onboarding/onboarding.css` | Coachmark og enhetsskjerm. Kun tokens. |
| `app/onboarding/host-ball-flight.js` | Vertsadapter, steg 1–3. |
| `app/onboarding/host-studio.js` | Vertsadapter, steg 4–5. |
| `app/onboarding/host-connections.js` | Vertsadapter, steg 6. |
| `app/onboarding/splash-demo.html` | De tre splash-konseptene. **Beholdes** (D108). |
| `app/shared/sa-units.js` | Enhetspreferansen (D27/D57/D103). |

### Navngitte inngrep i andre strømmers filer

Hvert av dem kaller vertens EGNE funksjoner. Ingen ny fysikk, ingen parallell
tilstand, ingen ny tegnevei.

| Fil | Inngrep |
|---|---|
| `app/ball-flight/impact-outcome.js` | `UNIT_SYSTEM` fra byggetidskonstant til kjøretidsverdi (D103); memoen tømmes ved bytte. |
| `app/ball-flight/impact.html` | `api.applyShot()` + `api.setActiveParam()`; onboarding-CSS og montering. |
| `app/studio/index.html` | `window.__studio` (applyStudio/selectParam/setInspect/reset); onboarding-CSS og montering. |
| `app/connections/connections.js` | `window.__connections` (selectMetric/showSelector); montering. |
| `app/home/index.html` | D97-fjerning + splash-konsept 1 (D108). |
| `app/home/sa-home.js` | D97-fjerning; enhetsskjermen som start; «?» wiret på nytt. |
| `app/home/sa-home.css` | Splash-CSS byttet; foreldreløse keyframes fjernet; SKIP i label-form. |

---

## Verifisering

Alle tall i oppdragsbrevet ble **regnet på nytt med motoren** og reproduserer.
To ting brevet ikke sa, som verifiseringen avdekket og som er bygget inn:

- **Steg 3 sin basis er `face 0.0° · path +3.0°`** (face-to-path −3). Kun den
  kombinasjonen gir carry 185.4 / 180.9 / 176.2 / 171.1 m.
- **Steg 5 krever `dynamicLoftDeg 31`** (D65 mid-iron) inn i `studioSolve`.
  Uten den blir `arc −1.5` til `High` i stedet for `OffFace`.

Kjørt ende-til-ende i de ekte skjermene, over tre dokumenter: Home → splash →
enhetsskjerm → steg 1–3 (Ball Flight) → steg 4–5 (Studio, landskap) → steg 6
(Connections) → DONE → Home. Verifisert i begge enhetspakker.

**Ikke verifisert:** hvordan splash og coachmark ser ut i bevegelse. Nettleser-
panelet i økten min vises ikke, så sidene komposittes ikke — rAF står stille og
animasjonenes tidslinje blir 0. Bevegelsen er derfor verifisert ved å pause
animasjonene og sette `currentTime` manuelt; keyframene er riktige, men
opplevelsen er ubedømt. **En visuell gjennomgang på telefon gjenstår.**

---

## Beslutninger jeg tok som ikke sto i DECISIONS.md

### Låst underveis av eier (via orkestrator)

D96–D108 kom av spørsmål fra denne strømmen og står i beslutningsloggen.
De gjentas ikke her.

### Mine, som IKKE er låst — lås eller endre

| # | Valg | Begrunnelse |
|---|---|---|
| **E-a** | **NEXT er `primary` når den er aktiv, `plate`/`ghost` når den er død.** SKIP er tekst i `muted`. | Hierarkiregelen sier én parameter leder per skjerm; NEXT er ingen parameter, men den ER handlingen når steget er ferdig. Alternativet — nøytral NEXT — gjør at steget ikke har noe synlig svar på «hva nå». |
| **E-b** | **«?»-knappen på Home restarter de seks stegene.** | Den åpnet den gamle turen. D97 sa ikke hva som skjer med den, og en knapp som ikke gjør noe er verre enn en som er borte. Restart er samme betydning som før, med nytt innhold. Alternativet er å fjerne knappen. |
| **E-c** | **Coachmarken har ingen glød og ingen parameterkulør.** | D85 skoper glød bort fra banescener, og boksen ligger oppå en slik scene i fire av seks steg. Kulør ville dessuten latt veiledningen konkurrere med kontrollen den ber deg røre. |
| **E-d** | **Progresjonen bor i `sessionStorage`, enhetsvalget i `localStorage`.** | Stegene spenner tre dokumenter, så «hvor er jeg» må overleve navigasjon — men ikke en ny økt. Enheten skal overleve alt. |
| **E-e** | **Onboardingen tegner ingen egen HOME-knapp og skjuler ingen.** | NAVIGASJON.md sitt chrome-budsjett er én sirkel; en ekstra ville brutt det. |

### Utført per D104 (E9)

Steg 6 viser grafens faktiske kjede — `Curve ← Spin Axis ← Club Face · Club
Path · Attack Angle · Dynamic Loft`. Brevets kjede med en Face-to-Path-node
finnes ikke i grafen, og grafen er ikke rørt.

---

## D114 — G-1 og G-2 rettet 2026-08-26

Strøm G målte to defekter i Studio-stegene. Begge reprodusert, begge rettet,
verifisert ved **begge** D59-ytterpunkter.

**G-1 — boksen 101 px utenfor skjermen (932×430 og 568×320).**
Årsak: steg 5 maksimerte strike-insetten, og `place()` brukte `inset.right` som
venstrekant. Maksimert spente insetten x 19–913 av 932 px, så «båndet mellom
inset og rail» både kollapset og snudde (913 mot railens 861). Ved 568×320 var
19 px av boksen synlig.
Rettet: **insetten maksimeres ikke lenger — låst som D115.** D3b krever at
underlaget er synlig — og den KOMPAKTE insetten viser allerede
«MID-IRON · FAIRWAY 8 mm» (STUDIO.md B2-g; maksimert modus legger bare til
ASSUMED-loftcaptionen). Maksimert etterlot null ledig flate: steget kunne ikke
både maksimere og bære en coachmark.

**Åpen mot sømtesten:** inspeksjonsvisningen av kontaktsonen må brukeren nå
åpne selv. Overprøver eieren dette, er alternativet å dele steg 5 i to — ikke
å gjeninnføre maksimeringen, som er målt umulig sammen med en coachmark.

**G-2 — boksen dekket CLUB PATH-verdien ved 568×320.**
Årsak: ingen toppvakt. Boksen ble ankret over kontrollraden og vokste oppover
til 194 px høyde, inn i toppstripen (y 18 mot stripens 0–54) og over `#vPath`.
Rettet: sonen har nå fire kanter, og toppstripen er en hard kant.

**Og et tredje, som G-2 nevnte og min første fiks IKKE traff:** boksen dekket
low point-markøren i *hver* ballposisjon (markør y 251, boks y 175–322 ved
932×430). Steg 4 handler om å se den markøren flytte seg — bokstaven i D107 var
oppfylt mens meningen var brutt. Markøren er canvas, ikke DOM, så den fantes
ikke i sjekkene mine; Studio skriver posisjonen til
`stage.dataset.lowPointMarker`, og sonen stopper nå over den.

To feil jeg innførte underveis og fanget selv: en `MIN_BAND` på 260 px forkastet
en brukbar 194 px-sone og tvang boksen ut i full bredde, der den la seg over
insetten (altså over LIE — D3b). Og et gulv på 96 px i `maxHeight` lot boksen
vokse ut av sonen og havne 1 px fra toppstripen. Begge var bekvemmelighets-
grep som brøt garantien sonen finnes for å gi.

**Målt etter rettelsen** — alle kanter klare, markøren fri i hele vandringen,
D3b intakt:

| | 568 × 320 | 932 × 430 |
|---|---|---|
| Steg 4 | boks 206–400 × 66–161 · 12 px til toppstripe · 12 px til markør | boks 271–849 × 92–239 · markør fri |
| Steg 5 | boks 206–400 × 66–161 · 12 px til toppstripe · 34 px til markør | boks 271–849 × 115–239 · 61 px til toppstripe · 45 px til markør |

Er sonen lavere enn teksten, **ruller** boksen (`overflow-y: auto`) framfor å
vokse ut i en flate steget bruker.

---

## Etter A sin V1-kirurgi (D123–D126) — verifisert på nytt 2026-08-26

A opererte Ball Flight etter at E leverte: pin/Δ ut (D123), Details og
13-utfallslisten ut (D124), modellgrense-setningen flyttet (D125), og ~68 px
reservert i bunnen for den sentralbygde modulmenyen (D126). D124 påla E å kjøre
steg 1–3 grønt etterpå, siden koordinatene flytter seg.

**Kjørt på nytt mot den opererte flaten:** steg 1 porten og resolved-teksten
(9.2 m R), steg 2 uten NEXT med linsevelgeren tegnet, steg 3 auto-framført med
face 0.0 og loft 18. Alle grønne.

**Koordinatene flyttet seg, som varslet — og plasseringen fulgte etter av seg
selv.** `place()` måler vertens egne elementer i stedet for å bære tall, så
D126-reservasjonen ble respektert uten at noe måtte endres. Målt nå ved
375×812: inputpanelet slutter y 744 med nøyaktig **68 px** til bunnen, og
coachmarken står y 355–458, 13 px over panelet.

Tidligere Ball Flight-koordinater i rapporteringen min (boks y 364–468,
linsevelger y 490) er **historiske** og gjelder flaten før kirurgien.
Studio-tallene i D114-tabellen over er derimot uendret — kirurgien rørte ikke
Impact Studio.

**Ryddet samtidig:** `setRangeMode()` tar ikke lenger argument (D124 fjernet
shot-tilstanden). Vertsadapterens `reset()` kalte `setRangeMode('shot')` — en
no-op som pekte på en flate som ikke finnes. Kallet er fjernet der, og
argumentene er droppet i de to andre kallstedene, som beholdes fordi de bygger
panelet og remåler scenen — ikke fordi de bytter modus.

---

## Feil funnet ved verifisering, ikke ved lesing

Fire feil sto grønne i koden og falt først da jeg dro i de ekte kontrollene:

1. **Capture-fasen løy.** Onboardingens lytter kjørte før skjermens egen
   slider-handler, så porten leste forrige verdi og lå ett trykk bak: `face`
   3.4 ga fortsatt død NEXT. Rettet til boblefase pluss ett mikrotask-hopp.
   Samme mønster er brukt i alle tre vertene.
2. **`state.station` lerper.** Den er et flyttall midt i et kamerabytte og sier
   ikke hva brukeren valgte, så steg 2 førte aldri videre. Leser nå
   `stationTarget`.
3. **Linsevelgeren finnes kun i «change»-modus.** Steg 2 pekte på et element
   uten flate, og coachmarken havnet utenfor skjermen (y −139). Steget setter
   nå modus selv.
4. **HOME var en felle.** D102 sier sirkelen forblir aktiv og avslutter
   onboardingen som hopp. Uten det ville trykket sendt brukeren til Home, som
   er onboardingens anker (D96) — og rett tilbake i steget. En ring man ikke
   kommer ut av. HOME og `Escape` avslutter nå onboardingen før navigasjonen.

---

## Kjent gjeld og det som ikke er bygget

- **Innstillinger-flaten finnes ikke.** D27 sier enheten skal kunne endres der.
  D103 sa eksplisitt at den ikke bygges i denne strømmen. Enhetsskjermen lover
  derfor ikke Settings — å love en flate som ikke finnes er verre enn å tie.
- **~114 linjer død CSS** i `app/home/sa-home.css` (`.onboarding-*`,
  `.product-proof`, `.product-map`, `.relationship-pairs`). Jeg lot den stå
  framfor å slette i A sin fil: noen klasser deles med flater jeg ikke har
  verifisert. Meldt, ikke skjult.
- **Visuell gjennomgang på telefon gjenstår** — se verifiseringsforbeholdet.
- **Nettleserens tilbakeknapp oppfører seg ikke under onboarding — kun i
  prototypen.** Home er ankeret (D96) og gjenopptar gjeldende steg, så
  «tilbake» til Home sender brukeren framover i steget igjen. Verifisert:
  direkte navigasjon til Home på steg 3 lander i Ball Flight med `3 of 6`.
  Det er *riktig* mot den låste modellen — NAVIGASJON.md sier «Tilbake finnes
  ikke som begrep; det finnes bare opp til Home» — og utveien finnes hele
  tiden (HOME-sirkelen og `Escape`, verifisert også fra et gjenopptatt steg).
  Native (D70) har ingen tilbakeknapp, så dette treffer ikke produktet. Notert
  her så laget som bygger SwiftUI ikke arver forvirringen som en «feil».
- **`app/nav/index.html` og `app/home/index.html`** er fortsatt to Home-flater.
  D96 gjorde `home/` til midlertidig anker og la redesignet til en egen runde.
  Studio og Connections sine HOME-lenker peker fortsatt på `nav/`; onboardingen
  bruker `home/` konsekvent.
