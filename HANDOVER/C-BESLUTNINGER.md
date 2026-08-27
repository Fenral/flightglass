# Strøm C — Connections: leveranse og beslutninger

**Leveranse:** `app/connections/` — klikkbar prototype (portrett).
Åpnes via lokal server: `.claude/launch.json` har konfigurasjonen
`flightglass-static` (`npx http-server -p 8321`), deretter
`http://localhost:8321/app/connections/index.html`.
Chrome blokkerer ES-moduler over `file://`; det gjelder også A og B sine
prototyper. Firefox åpner fila direkte.

**Ommalt til DESIGN.md v3 2026-08-26** (KORREKSJON-V3): se seksjonen
«v3-ommalingen» nederst. Struktur og lesemekanikk er uendret.

Data: `app/connections/graph-data.js` er **mekanisk avledet** fra
`/connections-graph-v2.json` (D47) og endres aldri for hånd.

Bygget på D43 (hele kjeden, sammenklappet), D44 (motoruavhengig), D68
(hviletilstanden er metrikkvelgeren), D69 (kjeden stopper ved de fem
leveringsinputene; Geometry nås progressivt; forover kun som tekst).

---

## Løsningen på de sju begrepene (leveranse 2)

Målt i grafen først: av 38 kanter er 26 `direct`, 11 `modeled`, 1 `coupled` —
og den ene `coupled`-kanten er også den eneste med styrken `variable`.
De to «ekstra» begrepene sammenfaller altså 1:1 i dataene. Det faktiske
systemet er ikke 3 × 4; det er **tre styrkegrader × to typer, pluss ett
særtilfelle**. Løsningen utnytter det:

| Begrep | På kartet | I nodekortet |
|---|---|---|
| `primary` / `contributing` / `contextual` | **ren geometri:** tykkelse 2.5 / 1.5 / 1 px og luminans `muted` / `grey` / `coal-3` | ordet, ved hver årsak |
| `direct` / `modeled` | **ett binært skille:** heltrukket mot stiplet, med to-ords nøkkel «Direct / Modelled» nederst | «modelled» ved kanten |
| `coupled` | prikket **retningsløs bue** med ordet COUPLED — finnes bare i geometri-utvidelsen (dataene gjør det umulig andre steder) | «coupled · varies» |
| `variable` | **aldri et eget visuelt trinn** — sammenfaller med coupled-kanten | ordet «varies» |

Begrunnelsen:

1. **Styrke trenger ingen legende** fordi retningen er selvforklarende:
   tykkere og lysere = sterkere. Ordene står i kortet, så D10 sine tre
   bærere (tykkelse + luminans + tekst) er alle til stede.
2. **Modellgrensen er den eneste typedistinksjonen som bærer produktmening.**
   Resten av appen deklarerer modellgrensen eksplisitt (D11, D53); kartet
   gjør det samme med stiplingen. Den kan ikke utledes av lagene alene —
   Backspin ligger i Flight-laget, men mates av `direct`-kanter — så den må
   stå på kanten, ikke på et bånd.
3. **Coupled er ikke årsak, men søskenskap** (attack og path er
   søskenresultater av Studio-geometrien). Derfor tegnes den uten retning
   og med ordet på seg — den skal ikke kunne leses som enda en pil.
4. Nøkkelen nederst er hele den synlige legenden: **to ord.** Alle sju
   begrepene finnes presist, men bare der noen faktisk spør — i kortet for
   den noden man har trykket på. `e28` sin betingelse vises samme sted som
   tekst («low launch only»).

## Synlige valg som trenger låsing

Ingen står i `DECISIONS.md`. Lås eller endre:

| # | Forslag | Begrunnelse |
|---|---|---|
| C-a | **Metrikkvelgeren tilbyr de 13 deriverte nodene** i lagene Separation / Flight / Landing, gruppert per lag, i grafens rekkefølge, to kolonner. Inputs og Geometry er ikke startpunkter (terminus / progressiv sone, D69). Strike tilbys ikke — se funn F-C1. | «Hva påvirker X» gir bare mening for noe som påvirkes; de fem inputene er svaret, ikke spørsmålet |
| C-b | Velgerens ordlyd: tittel `CONNECTIONS` i display-lens, underlinje «Choose a metric to see what shapes it.» | Én identitetslinje + én instruks; samme mønster som N-f |
| C-c | **Valgt metrikk vises som pill øverst** (aktiv stil, `METRIC`-etikett ved siden av); trykk på pillen åpner velgeren igjen | Pill = tilstand i modulen (grammatikken i NAVIGASJON.md); metrikken ER modulens tilstand |
| C-d | **Diagramform:** virkning øverst, årsaker under, rader etter lengste-vei-dybde fra metrikken; de fem inputene i eget bånd `BALL FLIGHT INPUTS` nederst; utvidet geometri i bånd `STUDIO GEOMETRY` under der. Lagnavn står ikke per rad (dybderader kan blande lag); laget står i nodekortets rollelinje | Spørsmålet leses først, svaret folder seg ut under; inputs nederst matcher appens fysiske grammatikk (input bor nederst i Ball Flight) |
| C-e | Begrepsløsningen over | — |
| C-f | **Trykk på node = fokus:** noden blir oransje (aktiv), dens kanter løftes til `primary-hi`, kortet åpnes. **Roten starter fokusert** ved metrikkvalg, så mekanikken lærer seg selv | Oransje er det du tar på (D14); målelinje-fargen på løftede kanter følger `measure`-rollen |
| C-g | **Nodekortet** er en egen bunnsone (deler aldri piksler med diagrammet): navn, rolle ordrett fra grafen, én-linjes forklaring, `SHAPED BY`-liste med styrkeord, «Shapes: …» som ren tekstlinje (D69), handlinger `CLOSE` / `TRACE {NAVN}` / `SHOW STUDIO GEOMETRY`. Frie inputs (face/loft/speed): «A free input — set directly in Ball Flight.» Kortet tåler 1–3 forklaringspunkter uten formendring (eierens svar 5) | Bunnark-mønsteret fra navigasjonsfunnet; rolle/forklaring designet mot dataene som finnes |
| C-h | **TRACE-snarveien:** en fokusert derivert node kan gjøres til ny metrikk fra kortet | Brukerkrav 1 («for eks curve — hva påvirker det?») oppstår også midt i en kjede; snarveien er samme handling som velgeren, ikke en ny mekanikk |
| C-i | **Geometri-utvidelsen** viser hele geometri-lukningen for den ene inputen (maks to trinn i grafen); kanter tegnes kun for utvidede inputs; COUPLED-buen tegnes når attack **eller** path er utvidet og begge brikkene finnes | D69 sier progressivt per input-trykk; lukningen er 3–4 noder, så ett trinn holder. Buen binder søsknene og hører til paret, ikke til én av dem |
| C-j | **Ingen historikk:** metrikkvalg skrives til URL-hash med `replaceState` — deep-link virker, tilbake-stack oppstår aldri | NAVIGASJON.md: ingen stack; nettleserens Tilbake går til forrige flate, ikke forrige metrikk |
| C-k | Connections-kortet på Home er koblet til prototypen (godkjent av eier, énlinjes-presedens fra A og B) | — |
| C-l | **Bevegelse:** kun eksisterende tokens — trykkrespons `fast`, kort/visningsbytte `base`; kantene tegnes uten animasjon; reduced motion → instant | Ingenting svarer på en slider her, men kartet er statisk — animasjon kun på det som skifter |

## Funn — meldes, ikke rettet stille

| # | Funn |
|---|---|
| F-C1 | **Strike er uoppnåelig i denne modellen — AVGJORT AV EIER 2026-08-25: Strike hører til Studio og finnes ikke i Connections.** Den har ingen utgående kanter i grafen (D52: treffet mater ikke ballflukten) og årsakene er ren geometri — den kan verken være metrikk (C-a) eller havne i noens bakoverkjede. Spørsmålet «hva former treffet?» besvares av Impact Studio, som tegner buen og treffhøyden med ekte geometri (D53). Ingen unntak fra D69 innføres. Prototypen oppfører seg allerede slik. |
| F-C2 | `explanations.nodes` i grafen (finnes kun for `attack`) konsumeres ikke av prototypen — innholdet er redundant mot den strukturerte `SHAPED BY`-listen som genereres fra kantene. Om kuratert prosa skal inn senere, er plassen kortets forklaringsfelt (tåler 1–3 punkter). |
| F-C3 | **`D82` er brukt to ganger i `DECISIONS.md`:** lie-stegslideren (2026-08-25) og designreverseringen (2026-08-26) deler nummer. Reverseringen refereres som «D82» fra DESIGN.md v3, tokens.css og KORREKSJON-V3; lie-vedtaket refereres kun fra loggen selv. Anbefalt fiks: lie-vedtaket omnummereres, reverseringen beholder D82. **LUKKET 2026-08-26: orkestrator rettet — lie-vedtaket er nå D93, reverseringen beholder D82; D66-raden og STUDIO.md oppdatert. Verifisert av C: ingen doble D-numre gjenstår i loggen.** |

## v3-ommalingen (2026-08-26, KORREKSJON-V3)

Struktur, lesemekanikk og begrepsløsning er uendret; kun malingen er byttet.
Kartleggingsvalg som trenger låsing:

| # | Forslag | Begrunnelse |
|---|---|---|
| C-m | **Kantstyrkene bruker mockens tre-styrke-grammatikk:** full / 55 % / 30 % av `muted`; fokusløftede kanter i `primary` | v3 bruker samme trinn for primary-hårlinjer; struktur er kald (`muted`), handling er varm (`primary`) |
| C-n | **Fokusert node = chip-active-mønsteret:** `primary-soft`-grunn + `primary`-tekst; metric-pillen samme | Direkte fra v3-komponentene; erstatter v2 sin fullmettede aktivflate |
| C-o | **Typografi — LÅST SOM D91:** nodebrikker i caption-størrelse (12 px, Geist caps); velgerknapper og etiketter forblir `label` 10; tittel og kortnavn i display-lens (Space Grotesk); IBM Plex Mono er ubrukt — Connections har null tall | D91: brikkene er skjermens primære innhold — informasjonsnivåregelen sier selv at hovedinnhold ikke står i minste grad. Justert og re-verifisert 2026-08-26 |
| C-p | **Nodekortet er glassplate:** `--plate-glass` + blur + 1 px `--glass-edge`-lyskant; brikker og knapper får samme lyskant | «Plate — glassplaten; avlesningenes hjem» (v3) |
| C-q | **LUKKET 2026-08-26:** nav.css er v3-migrert av strøm A; lenken er gjeninnført og duplikatene (reset, home-circle, lokale typografiklasser) fjernet. Connections bruker nå de delte `.t-*`-rollene; caps bæres av komponentene. HOME-sirkelen er delt chrome igjen (lik i alle moduler, per NAVIGASJON-grammatikken). Tre meldte avvik i nav.css (Archivo-rest, ink-fokusring, home-circle-mapping) er rettet av A samme dag; min lokale fokusring-overstyring er fjernet — én delt `:focus-visible`-regel gjelder nå (per D94: `ink`-ring, mock-konvensjonen; «secondary»-prosaen i DESIGN.md v3 ble reversert av eier samme dag). Verifisert: home-circle computed `plate`/`ink`/999px | — |
| C-r | **Ingen materialglød på kantene.** D85 tillater glød utenfor banescener, men kantene er informasjonsbærende hårlinjer der luminans koder styrke — glød ville forstyrret kodingen. Glassmaterialet (kort, brikker) bærer mock-stemningen | Luminanstrappen (C-m) er meningsbærende; bloom flater den ut |

Verifisert etter ommaling (375 × 812): Geist/Space Grotesk lastet, alle
v3-tokens i bruk (ingen naken hex), tyngste kjede + geometri-utvidelse
kollisjonsfri, kantopasiteter 1/0.55/0.3 målt i DOM, fokus `primary`,
null konsollfeil.

## Verifisert

Kjørt i nettleser (375 × 812): alle 13 kjeder tegner uten NaN, uten
horisontal overflow og uten brikkeoverlapp; tyngste kjede (Carry Side,
13 noder / 19 kanter) og Total med geometri utvidet (14 brikker / 17 kanter)
er kollisjonsfrie; COUPLED-etiketten treffer ingen brikke; kortet ligger i
egen sone; deep-link (`#carry`) åpner riktig kjede; pillen tilbake til
velgeren nullstiller hash; null konsollfeil. Tastatur: ekte `<button>`-er,
Escape = HOME via `nav.js`. Tekstalternativ: hver brikke bærer full
årsaksliste i `aria-label`.
