# Ball Flight-ommalingen — avviksliste (D76 leveranse 2)

**Hvert punkt der resultatet skiller seg fra mockens komposisjon, med
beslutningen som krever det.** Et avvik uten referanse er en feil.
Kilde: `_source/mocks/ball-flight/` (fasit) → `app/ball-flight/` (ommalt).

## Strukturelle avvik

| # | Avvik fra mocken | Krevd av |
|---|---|---|
| S1 | OUTCOME-stasjonen er fjernet; linsene er DIRECTION (før TOP) og HEIGHT (før SIDE), stasjonsrommet klemt til [1, 2]. Change-modus skjer i gjeldende linse, aldri i outcome-kameraet. `renderPane(0)`/`outcomePaneHTML` står dormant, samme mønster som mockens egen legacy-board. | D40 |
| S2 | DIRECTION er standardlinse ved inngang (mocken åpnet i outcome, station 0). | D40 + B-d (D64) |
| S3 | `faceToPath` er lagt til metrikkregisteret og direction-gruppen (fantes ikke i mocken). | D42 |
| S4 | Fotobakgrunnen (`range-night-3d-33.png`) er unåelig: den viste kun i outcome-linsen. Tapet er godtatt; fotoet får nytt hjem på Home/splash/onboarding. Dusk-rampe + fog + grid bærer atmosfæren i linsene. | D80 (konsekvens av D40) |
| S5 | Deltaflaten er bygget inn: gradientfylt areal mellom nyeste pin og levende bane, glød 2 % av scenens korteste side (skjermens eneste myke element), måletrinn hver 25 % av carry over flaten/under banene. Fantes ikke i kameramocken. | D15 + D64 (delta-field er DESIGN.md-komponent) |
| S6 | Delta-setningen «Δ vs pin: −0.7 m carry · → 10.2 m more curve» er lagt til, linseavhengig (DIRECTION: Δcarry+Δcurve · HEIGHT: Δcarry+Δapex), synlig i både lese- og dra-modus, oppdatert i frame-løkka. | D64/B-h + B-f (U5-prinsippet) |
| S7 | Modellgrense-setningen står som caption nederst i Details-panelet. | D11 (plassering eiergodkjent) |
| S8 | Motorseamen (`impact-outcome.js`) kaller `engine/` + `adapter/`; gammel motor (`impact-flight.js`, `flightglass-3d-spin-model.js`) er aldri kopiert inn. Banegeometrien kommer fra adapterens `traceSamples` (D79-invariantene). | D13 + D79 + spec §11 |

## Maleavvik (paint — komposisjon uendret)

| # | Avvik | Krevd av |
|---|---|---|
| M1 | Hele tokenpaletten byttet: ember→primary, violet→nøytral, per-param-huer→grå med aktiv=primary via tilstand, dusk-lilla→kald kullrampe, status/reward-huer→DESIGN.md-familien. | D14/D19 (U3/U4) |
| M2 | Banene følger banetabellen: levende 1.6 px `trace` heltrukket; pin 1.4 px primary 0.55 stiplet 4 4; eldre ghosts primary 0.30; landingsmarkører per spec. Mockens 9 px bloom-underlegg på levende bane er fjernet, og ink→accent-gradientstrøket erstattet. | D15 + DESIGN.md Datavisualisering (normativ) + B-q |
| M3 | Launch-linjen tegnes i primary (banetabellen), ikke parameterhuen `--q-launch` (som nå er grå). | D19 + DESIGN.md |
| M4 | Typografi: Inter/Space Grotesk/IBM Plex Mono → Archivo overalt. | DESIGN.md Typography |
| M5 | Alle tallformater via adapteren: vinkler 1 des, avstander 1 des (mocken hadde 0 på avstander/landing/spinaxis), smash 3 (mocken 2), fart 1 (mocken 0), spinn heltall med tynt mellomrom, U+2212-minus. Delta-chips samme regler, magnitude uten retningsbokstav. | D28/D29 (D64/B-m: uforkortede etiketter — LAUNCH DIRECTION, SMASH FACTOR) |
| M6 | Fokusring: 2 px primary-hi med 2 px avstand (mockens doble ink-ring og ts-back-ringen erstattet). | DESIGN.md Interaksjonstilstander |
| M7 | Tilbake-pilen → HOME-ordet i 44 px sirkel, coal-2/coal-3-tilstander; lenker til nav-huben til Home-mocken er ommalt. | D64/N-b/N-c |
| M8 | Pin-knappens fylte bokmerkeikon fjernet; ordet bærer handlingen. | DESIGN.md Ikonografi (aldri fyll; ord over symbol) |
| M9 | Radier: 12/16/20 → 8/11/11 (Shapes-skalaen); easing → easeOut-kurven. | DESIGN.md Shapes + Bevegelse |
| M10 | `PIN_RETURN_DELAY` 320 → 300 ms. | D18 (hysteresisReturn, normativ) |

## Bevisst IKKE endret (mockens komposisjon står)

- Kamerasystemet, scrub-gesten, dusk-scenen, grid/fog, carryHero som permanent
  venstre-anker, shotBrief («one conclusion, two facts»), stasjons-segmentet,
  panelarkitekturen Shot/Change/Details, pin-FAB-ens ankerløser, komet-punktet,
  annotasjonskaskaden, haptikk-, IAP- og paywall-infrastrukturen.
- Interne navn (`side`/`top`, `data-s`) — implementeringsdetalj; kun synlige
  navn er byttet.

## Kjente rester — LUKKET i finpussrunden (eiervedtak)

- ~~D18-tidshysterese~~ → offsetbasert stabilisator over kaskaden:
  ankerbevegelse følges instant, slotbytte 120 ms, retur 300 ms, snapp uten
  mellomposisjoner. `labelBase` eksponert fra placeLabels for formålet.
- ~~IAP/paywall i pin~~ → NØYTRALISERT: pin er fri og ubegrenset i V1
  (02-kontrakten maks 3 referanser står). IAP-koden ligger dormant i
  shared/, klar for et fremtidig monetiseringsvedtak.
- ~~wdth 125~~ → lagt på carryHero-heroen (skjermens display-tall).
- HOME-sirkelen peker på den ommalte mock-Home; nav-hubben fra del 1
  beholdes som klikkbart arkitekturbevis. `app/_v1-ball-flight/` slettet.

## D81-revisjonen (hierarkireglene)

| # | Endring | Krevd av |
|---|---|---|
| H1 | Linjalens landingsprikk/-tall og apex-markør demotert 0.95/0.8 → 0.55. | D81 oransje-stigen (måleannotasjon = sekundær) |
| H2 | Kometen demotert til sekundærtrinnet; kjernen forblir ink (ballen er nøytral). | D81 |
| H3 | Sentralt alfatak 0.55 på alle sceneannotasjoner og DOM-etiketter (min-cap: allerede stille elementer røres ikke). | D81 |
| H4 | Hot-glød på annotasjonsetiketter fjernet — hot bæres av vekt alene. | D15 (kun deltaflaten er myk) |
| H5 | Delta-setningen demotert til støtte-nivået (`text` #D2D5DA): shotLine er shotBrief-panelets svar, carryHero er scenens. 12 px beholdt (scene-overlegg), avvik fra støtte-typografien listet. | D81 informasjonsnivåer |
| H6 | Aktiv linsepille: grå tint → primary med on-primary tekst. I change-modus er de to fulle elementene aktiv kontroll + aktiv pille (≤ 2). | DESIGN.md interaksjonstabell + D81 |
| H7 | Launch-etikettens DOM-tone: parameterhuen (nå grå) → accent-familien, matcher canvas. | D19 |
| H8 | Details-griden er bevisst uten ett enkelt svar — den er gruppert telemetri (tabell), ikke et panel med konklusjon. **Avgjort i finpussrunden (eier delegerte): tabell-unntaket står.** Å utpeke én metrikk som «svaret» per gruppe ville vært en produktbeslutning ingen har tatt. | D81 (avgjort) |

Merk: D81-rettelse 1 (Contact zone-headeren) gjelder Impact Studio og hører
til strøm B.

## Home-ommalingen (samme D76-jobb)

| # | Avvik fra mocken | Krevd av |
|---|---|---|
| HM1 | `sa-home.js` kaller `engine/solveFlight` (drop-in) i stedet for mockmotoren; lab-verdiene formateres via adapteren (vinkler 1 des, spinn med tynt mellomrom). | D13 + spec §11 + D28 |
| HM2 | Range-fotoet har fått sitt nye hjem som splash-bakgrunn, kjølt med kull-overlegg — ingen lilla vask. | D80 (U4) |
| HM3 | Paletten arves ferdig ommalt fra delte `sa-p3.css`; Home hadde null egne fargeverdier. | D14/D19 |
| HM4 | Connections-kartforhåndsvisningen mistet per-parameter-huene (alle `--q-*` er nå grå). Kartet leser flatere enn mocken — men fargeløsningen for Connections EIES av strøm C (D41/D43/D44), og en midlertidig egen palett her ville gjenskapt U3. | D19 (flagget til C) |
| HM5 | Lenker til `jarvis.html` (Ask) og andre moduler peker på flater som ennå ikke finnes i `app/` — andre strømmers leveranser. Ikke rørt. | — (kjent rest) |
