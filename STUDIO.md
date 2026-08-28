# Impact Studio — leveranse fra strøm B

## v4: Portrett på Sol-handoffen (2026-08-28, eierbesluttet i intervju, ført til orkestrator)

Eier fikk ekstern UI/UX-handoff («Sol»: QA-testet interaktiv portrett-flate,
A/B-tema flightglass/titan, tilstandskontrakt, deklarert motorsøm) og besluttet
i strukturert intervju: **portrett i V1** (D8/D12/D59 omgjøres; landskapsflaten
bevart som `app/studio/landscape.html` = V2), **handoffen som komposisjonsfasit**,
**STRIKE-viewet droppet** (alt i FACE ON), **lie som navngitt velger ved
køllevelgeren** (D93-kjernen består: diskret, navngitt, aldri fri mm),
**A/B-tema beholdes** til mobiltest (`?theme=titan|flightglass`).

Utført i `app/studio/index.html`:
- **Motor i sømmen:** handoffens mock-formler er FJERNET; `updateScene()` driver
  SVG-en med `studioSolve` + adapterprojeksjoner (FO: stancefast kamera med
  BACK/MID/FWD, ball-relative adapterpunkter skiftet med ballPos; DTL: pinhole
  fra adapteren inn i handoffens ramme). Ingen trig i app; fysikklint 0 funn.
- **Strike-stripen** (ny, lav): båndord i D89-hue + mm med high/low-ord (D67) +
  `DYNAMIC LOFT x°` med ASSUMED-chip (D65) — begge svar alltid synlige (U1);
  lie-navnet står i velgeren i samme visning (D3b).
- **Entry/Low/Exit i FO** med ord og verdier (`18.1 cm before`-format);
  `NO TURF CONTACT` i muted i turf-regime uten kryssing.
- **D24 i scenen:** kølle-sprite (Higgsfield-hodene, kalibrert mot ballradius)
  med sweetspot-hakk + kontaktpunkt; turf-platen tonet inn i bakkebåndet.
- **Låste vedtak integrert:** 0.1-steg, D67-ord på sliderendene, HOME-ordsirkel
  (N-b) + Escape (N-h), ingen «+0.0» (adapterformater), Geist/Plex Mono/Space
  Grotesk (D83), plane-preset per kølle (50/55/60).
- **Sømmer bevart:** `window.__impactStudio` (handoffens testkontrakt, view-sett
  fo/dtl) og `window.__studio` (strøm E-onboarding, nøkkelmappet; `setInspect`
  er no-op siden strike alltid er synlig — meldt).
- Speilvendt rotasjonsport («Rotate to portrait.» — ordlyd meldt for låsing)
  med HOME i begge tilstander.

Verifisert 2026-08-28: motor live (−4.3°/+2.5°), 375×812/390×844, landskapsport,
DUFF/OFF FACE/PURE-nivåene, driver+tee, plane-preset, DTL, temabytte, seam-API,
reset, ingen konsollfeil/overflow, mål ≥ 44 px. Engine 465 + adapter 65 grønne.

Mine presentasjonsvalg meldt for låsing: strike-stripens plassering (under
Attack/Path-kortene), tittel-lockup «FLIGHT GLASS / Impact Studio» (Sols
«Delivery instrument» droppet som nytt produktutsagn), oversized ball i
FO (handoffens presentasjonsskala; tallene er motorens), portgate-ordlyden.

### v4-tillegg etter D133–D139-føringen + G-overleveringen (2026-08-28)

- **D138:** standard-lie er FAIRWAY (åpning og reset) — åpningsbildet viser
  strå fra første sekund; B2-e-hardpan omgjort.
- **D139/D142:** rotasjonsporten er et SCENE-overlegg inne i #stage (blur over
  canvasen alene) — alt krom rundt står synlig og aktivt; ingen HOME i porten
  (skjebnen følger D126). **D142: porten er WEB-FALLBACK, ikke produktatferd**
  — V1-appen orienteringslåses til portrett i native (SwiftUI-deklarasjon,
  D70), så porten finnes ikke i produktet og skal IKKE bygges av SwiftUI-laget.
  Ordlyden er eierlåst til kortformen «Rotate to portrait.» (ingen
  begrunnelsesprosa — dette er spec-lab). Implementeringen matcher allerede;
  koden har en foreldet «venter eierlåsing»-kommentar som rettes ved første
  opptining etter E-grønt (flaten er frosset per D141).
- **G-4:** gressbåndet utvidet til ~24 px, strå tegnet OPPÅ turf-platen langs
  bakkelinjen, lie-visualer ved ballen (tee-sprite for TEE/HIGH TEE, strå for
  gress-lies).
- **G-1/D114-kroken:** `stage.dataset.lowPointMarker` skrives av SVG-scenen i
  samme format — verifisert lest av onboardingens markørvakt.
- **D116 KJØRT GRØNN:** E-sekvensens steg 4–5 kjørt ende-til-ende på den nye
  flaten (sessionStorage-drevet, ekte skjermer, med H sin innerHeight-vakt —
  fella slo faktisk til og ble omgått med resize): steg 4 monterer i sonen
  (ingen overlapp med strike-stripe/velgere/dekk/markør), resolved-tekst med
  adapterord («2.0 cm before»), NEXT → steg 5, skript (arc −3, fairway),
  båndvandring til Pure, U1-payoff-teksten ordrett (D105, «8 mm» fra
  LIE_PRESETS), NEXT → navigerte til Connections med steg 6. E-siden
  (host-studio.js/steps.js) var samtidig-revidert av E etter FØR-varselet
  mitt; min side bevarte kontrakten (state/solved/applyStudio/selectParam/
  reset + markørkroken; `setInspect` består som no-op-ALIAS per D141/S13 til
  E melder grønt — fjernes først da). Mine tre forsøkte host-redigeringer
  feilet på samtidig-endring og ble forkastet — app/onboarding/* er urørt av
  strøm B (D141/D131-grensen holdt).
- D3b eksplisitt verifisert: lie-velgeren (navn + mm) er synlig i hver
  tilstand som viser turfstatus (strike-stripen og velgerne deler visning i
  både FO og DTL; porten viser ingen turfstatus).

### E-grønt-rettelsene (2026-08-28, D141-porten lukket)

- **Markørkontrakten rettet (E-funn):** `stage.dataset.lowPointMarker` skrev
  SVG-brukerenheter (131 px feil for kontraktstro konsumenter). Skriver nå
  CSS-piksler relativt #stage via xMidYMax-meet-mappingen (uniform skala,
  midtstilt x, bunnjustert y), med vakt: ved 0-målt boks (skjult fane)
  beholdes forrige gyldige verdi. Kontrakten står nå eksplisitt i koden.
- **Ankerbyttet dokumentert (Sol-fasit-egenskap, D134):** i portrett-v4 står
  low point-markøren FAST på skjermen mens BALLEN flytter seg — motsatt av
  landskapsflaten (ball fast, markør flytter). Stancefast kamera: svingens
  lavpunkt er stancens (stance-senter + 10.5 cm), ballen plasseres i stancen.
  Vakter og konsumenter skal beskytte MARKØRENS piksel, ikke ballens.
- **`setInspect`-aliaset fjernet** fra `window.__studio` etter E-grønt, med
  FØR-varsel (S13-mellomtilstanden avsluttet).
- **Driftsadvarsel fra E (måleprosedyre):** flaten krever REN tilstand per
  måling — kall `window.__studio.reset()` (eller RESET) før hver probe; en
  etterlatt ballposisjon gir feil bånd i første avlesning.
- **Sonepresisering (E-avvik, orkestratorgodkjent — skal STÅ):** coachmark-
  sonen ligger OVER ankeret (y 244–511 ved 390×844), ikke i båndet mellom
  markør og kontrolldekk (det er bare 57 px — boksen er 155–179). Harde
  kanter: `.topbar`/`#strikeStrip`/`.scene-tools`; D114-vakten holder mot
  ankeret. Regelen som gjelder er D107 («okkuper det steget ikke bruker»),
  ikke spec-bokstaven fra remapping-planen min.

---

## Historikk: v3-reverseringen (2026-08-26, D82-kjeden)

Ommalingen er avlyst; mockens visuelle språk er fasit og `app/studio/index.html`
er malt TILBAKE via de regenererte v3-tokens (som er mockens palett).
Det som består fra strømmens tidligere runder er alt som ikke var maling:
motorkoblingen, U-rettelsene og arvereglene. Utført i v3-runden:

- **Palett tilbake:** parameterfargene via tokens (`--attack`-rosa lavpunkt,
  `--path`-cyan, `--plane`-periwinkle glass, `--depth`-orkidé, `--strike`-gull
  kontaktsone, ember-`--primary` ball/aktiv). Dusk-bakteppet og himmelplatene
  (sky-face/bg-dtl) tilbake. Canvas leser tokens via `CSS()`/`tint()` — naken
  hex kun for scene-materiale uten token (gress, jord, dusk-vask), meldt under.
- **D88 (eierlåst i denne runden):** Studio er IKKE en banescene — mockens
  glød er fullt tilbake (buens glødpass, hvile-halo, glint, markør-bloom,
  DTL-ribbonens fire pass). Vaktregel: gløden får aldri gjøre en målt posisjon
  tvetydig; avvik meldes med målt belegg, aldri strippes preventivt.
- **D89 (eierlåst i denne runden):** tre-trinns kvalitetsskala — Pure/Centre
  → `good`, Thin/Fat/High/Low → `strike`-gull (treffbåndinfo), Duff/Whiff/
  no-flight/off-face → `bad`. Ordet er bæreren, fargen forsterker (D10).
  `warn` finnes ikke (D84).
- **D83:** Geist for UI (Google Fonts), Space Grotesk display, IBM Plex Mono
  for ALLE tall — også canvas-fontstrengene.
- **D93-lie (tidl. nummerert D82, omnummerert per F-C3):** preset-chipsene er erstattet av en STEGSLIDER låst til de sju
  `LIE_PRESETS`-punktene (indeks 0–6, step 1). LIE-chipen velger parameter,
  slideren setter verdi — grammatikken gjenopprettet. Navnet står fast i
  D3b-avlesningen (inset-kontekstraden), mm som caption; øyeblikkelig
  navnebytte ved stegkryssing; hvert steg er en haptisk detent.
- **D81-arven består:** meta på caption-nivå i muted, `ASSUMED` som prov-chip,
  inaktive chip-verdier på ghost-nivå, ett svar per panel. Oransje-stigens
  55 %-demoteringer er rullet tilbake (v2-parkert); «én parameter leder»
  bæres av mockens hero-logikk.
- **DESIGN.md-regresjon rettet:** v3-prosaen sa `ahead` igjen; before/after
  var eieravgjort 2026-08-25 og er gjeninnsatt.

**Meldingssaker — ALLE LUKKET av orkestrator 2026-08-26:**
- `--line-strong` og `--dusk-scene-bg` tettet i tokens.css; lokalkopiene i
  index.html er fjernet.
- **D94:** fokusring i INK per mock-konvensjonen (backdrop-sikker dobbelring;
  range-inputen får ink-outline siden flaten er transparent) — erstattet
  secondary-ringen; v3-prosaen rettet av orkestrator.
- **D95:** LIE har bevisst ingen parameterkulør (underlag er kontekst) —
  chip/slider byttet fra `--secondary`-forslaget til nøytral ink/ghost.
- swift-lintbruddet var foreldet: løst av D90 (swift/ unntatt), rot-`npm test`
  verifisert grønn av orkestrator.
- D67-føringen (before/after) bekreftet.

Verifisert 2026-08-26: motor live (−4.3°/+2.5°), stegslider, båndnivåer,
køllesyklus, viewbytte, maksimert inset med loft-chip, reset, 568×320 og
932×430, portrettport, ekstremsveip uten feil/NaN. Engine 465 + adapter 65
tester grønne.

---

# Historikk: D76-ommalingen (avlyst av v3, dokumentert for sporet)

**Status: ommalt 2026-08-25.** Denne leveransen ERSTATTER den forkastede
fra-bunnen-versjonen (D76: eierens mocker er komposisjonsfasit, DESIGN.md er
maling). Kjørende flate: `app/studio/index.html` — kopiert fra
`_source/mocks/impact-studio/impact-studio.html` (D77: originalen urørt) og
malt om. Statisk server på rot (`npx http-server -p 8321`), åpne
`/app/studio/index.html`.

Fysikk: `engine/src/studioSolve.js`. Projeksjon: `adapter/src/studioShape.js`.
Formatering: `adapter/src/format.js` + `displayStudio.js`.
Fysikklint **0 funn** (43 filer, `_source/` D77-unntatt) · **465 + 68 tester grønne** ·
verifisert ved 568×320, 812×375, 932×430 + portrettport.

---

## Hva som er bevart fra mocken (komposisjonen)

Canvas-scenen med hybrid vertikal gain i Face On (kontaktbånd 1:1 mm, armer
1.7×), pinhole-DTL med dybde-taperet bue og swing plane-glass, turf/soil/
kølle/ball/tee-materialplatene, strike-insetten oppe til venstre med
maksimering til inspeksjonsmodus, høyre-railen, fire chips + én slider med
nullhakk, footprints og stance-merker (BACK/MID/FWD), kontakt-blush,
underground-segmentet og outcome-vektorene som transienter, kryssvisnings-
hint, view-toast, hero-spotlight per valgt parameter, puls på endrede
avlesninger, haptikk-detents (`sa-haptics.js`, eierens modul, uendret),
WKWebView-remålingene og reduced-motion-drapet.

## Ommalingen (D76 punkt 2–5)

- **Palett:** P3-variablene er kartlagt til DESIGN-tokens i én mapping-blokk
  øverst i fila; mock-selektorene står ellers urørt. Per-parameter-huene
  (rosa/cyan/periwinkle/orkidé) er kollapset per D19/D14: aktiv/transient =
  `primary`, holdt = `grey`, måle-/gullspråket (low point, ENTRY/EXIT,
  brakketer, kontaktsone-bue) = `primary-hi`. Lilla dusk-vask og de
  lilla-tonede himmelbildene (sky-face/bg-dtl) er byttet med en kald
  kull-gradient av tokenfargene. Turf, soil, gress, ball, tee og køllehoder
  er beholdt — materialitet, ikke palettvask.
- **Glasset** (eierens presisering ved D15×D76-konflikten): består i begge
  visninger. Farge: nøytral røyk (`text`-tonen) i hvile, `primary-hi`-tint
  som hero når plane/direction er valgt.
- **Glød uten funksjon er fjernet** (samme presisering): buens glødpass,
  ballens hvile-halo, lowpoint-markørens linse-bloom, glint-spriten og de
  store platskyggene. Funksjonsbærende mykhet står: hero-halo på ballen når
  Ball Position er valgt (markerer det aktive objektet, D19), kontakt-blush
  (viser treffhøyden), underground-segmentet (viser divoten) og
  outcome-vektorene.
- **Typografi:** Archivo overalt (DOM og canvas-fontstrenger), `tnum` på
  alle verdier. Mockens Inter/Space Grotesk/IBM Plex Mono utgår.
- **Tallformat:** D28/D29/D67 via adapterlaget — vinkler 1 desimal med
  fortegn der de bærer retning, `before/after · above/below · high/low`
  på avstandsaksene, aldri nakent fortegn, U+2212.
- **Motor:** mockens `swing-parameters-and-impact.js` er IKKE portert (D13).
  Alle kall går til `studioSolve` + adapterens nye kategori 2-hjelpere
  (`arcWorldPoint(s)`, `tangentWorld`, `planePoint`, `pinholeCamera`,
  `projectPoint` — testbundet mot motorens `arcPoint`). All trigonometri er
  ute av app-laget; rotasjoner tegnes med enhetsvektor-transformer.

## Avvikslisten — hvert avvik med beslutningen som krever det

| Avvik fra mocken | Krevd av |
|---|---|
| Pil-ikonet `ts-back` → HOME-ordsirkel 44 px (ord, aldri ikon), Escape = HOME | NAVIGASJON.md N-a/N-b/N-h (låst) |
| HOME-sirkel også på rotasjonsskjermen (vakten inerter bakgrunnen) | NAVIGASJON.md: «tilbakeveien forsvinner aldri bak en rotasjon» |
| Porten er orientering + minimum 568×320, ikke bare portrett | D59 |
| 📱-emojien → tegnet SVG-glyf; ordlyden → «Rotate to landscape — the arc needs width over height.» | DESIGN «Ingen emoji» + N-e (og mockens egen SYS-12) |
| `↺` → ordet RESET | DESIGN Ikonografi: intet ikon står alene |
| `clubMode`-paret IRON/DRIVER → tre køller (driver · 3-wood · mid-iron), orb sykler; gress/pigg-glyfene på kølleknappen fjernet (de kodet underlaget) | D65, D17b |
| `ARC_Z0`/`zClub` ute — arc height er svingens, absolutt; nullstilles ikke ved køllebytte | D17b |
| `SWEET`-konstantene → `CLUB_GEOMETRY.sweetSpotHeightMm` (18.4/23/34) | D17b/F11 |
| Driver-standin-båndene (mockens High/Low-spesialkasus) → én klassifiserer, `strikeBand` v2, begge svar | F7, D17b, U1 |
| Femte chip LIE; kontrollraden viser sju diskrete preseter (navn + mm) når den er valgt | D66, D17 |
| Kontekstrad i strike-insetten: `KØLLE · LIE mm` alltid synlig; maksimert viser også `DYNAMIC LOFT x° · ASSUMED` | D3b (underlag i samme visning), D65 (loft merket som antagelse) |
| `NO TURF CONTACT` i muted, ikke warn; vises kun i turf-regime uten kryssing (teed uten kryssing er korrekt og taus — mockens egen driverregel, nå regimestyrt) | DESIGN: warn er reservert Duff·Whiff·no-flight·off-face |
| Strike-mm: `−20 mm` → `16.2 mm low` (1 desimal + ord; ordet er samtidig flatesvaret High/Low) | D67, D24 |
| Attack/Path viser + på positive verdier; plane 1 desimal | D29, D28 |
| Kortprikkene og hit-understreken: én hue (primary-hi/primary), ikke per metrikk | D14/D19 |
| Tee-spriten tegnes kun for TEE/HIGH TEE; gress-lie bærer ballen på strå | D66 (lie ≠ pigg) |
| IAP/paywall/analytics/guided-cue er strippet; haptics beholdt | Eierbeslutning i denne strømmen (utenfor gjenoppbyggingens scope) |
| 3-wood: planpreset 55°, driver-sprite, HEAD_MM 68, lean 2° | D65 (eierlåst preset; sprite/lean er presentasjonsskjønn, listet under) |

**Meldte konflikter (ikke rettet stille):**
- Spec 03 interaksjonsregel 2 krever synlig min/maks på slideren; mocken har
  ikke det (kun nullhakk + fylling). Mockens komposisjon er beholdt (D76);
  konflikten meldes her for eieravgjørelse.
- D15s «nøyaktig ett mykt element» ble avgjort av eier for Studio i denne
  strømmen (glass består, funksjonsløs glød ut); presiseringen bør inn i
  DESIGN.md ved synkroniseringen.

## Beslutninger tatt i strømmen som ikke sto i DECISIONS.md

Eierlåste underveis (bør speiles inn i DECISIONS.md):
- **D65-tillegg:** 3-wood auto-planpreset **55°** (driver 50 · mid-iron 60 fra mocken).
- **D15×D76-presisering:** glasset består med farge etter strøm B-vurdering;
  glød/mykhet uten funksjon fjernes; funksjonsbærende materialitet beholdes.
- **Skaffold:** IAP/paywall/analytics/guided-experiment porteres ikke; haptics beholdes.

Mine (presentasjonsskjønn, lås eller endre):
| # | Valg | Begrunnelse |
|---|---|---|
| B2-a | Glassets hvilefarge = `text`-tonen som røyk (210,213,218 @ mock-alfaene); hero = `primary-hi`-tint | Eier delegerte fargen; kald motpol er forbudt (D14), oransje hero = aktiv (D19) |
| B2-b | Kontaktsone-buens gradient `trace → primary-hi → primary` (erstatter kremgull→gull→varm) | Målespråk i tokenfamilien |
| B2-c | 3-wood tegnes med driver-hodespriten skalert (HEAD_MM 68) og 2° lean | Ingen 3-wood-sprite finnes; mellomverdi driver↔jern |
| B2-d | Lie-preset-knappene gjenbruker chip-formen (navn over mm) i kontrollraden | Minst mulig ny form; D66s mm-krav synlig |
| B2-e | Reset setter parametre + lie=HARDPAN, beholder kølle og kamera; plane følger køllas preset | Spec 03 regel 5 + mockens reset-oppførsel forent |
| B2-f | Orienteringsvaktens sync kobles også til resize/ResizeObserver | Mockens egen WKWebView-advarsel; change-eventet kan droppes |
| B2-g | Compact inset viser kølle·lie; ASSUMED-loftcaptionen bor i maksimert modus (`.ez`-mønsteret) | D65 «synlig som liten caption» der loften faktisk brukes; compact-bredden er 182 px |
| B2-h | Demoartifact oppdatert på samme URL; hub-lenken står på ekte Studio | Eiergodkjent i forrige runde |

## D81-hierarkijusteringene (2026-08-25, etter eierens gjennomgang)

Rene nivåjusteringer i farge og størrelse; komposisjonen urørt:

1. **Contact zone-headeren er meta:** paneltittelen (STRIKE · CONTACT ZONE)
   og kontekstraden (kølle · lie · loft) står i muted på caption-nivå,
   vekt 500. Svaret (`PURE · 4.6 mm low`) beholder value-nivået i ink.
   `ASSUMED` er nå en liten proveniens-chip (`.prov-chip`, coal-3-ramme,
   muted), aldri et ord i tekstlinjen.
2. **Oransje-stigen håndhevet:** fullmettet oransje = kun den aktive
   kontrollen (chip + slider + verdi, ett element) — verifisert mekanisk i
   DOM. Demotert til 55 % (`SEC`-konstanten i canvas): kort- og
   inset-pulsunderstrek, orb-pulsring, maks-glyfen, kortprikkene,
   orb-ikonenes oransje, low point-markøren, ENTRY/EXIT/LOW-merker og
   -etiketter, kontaktsone-buen, strike-tick + mm-brakett, kontakt-blush,
   underground-segmentet, chevron-strømmen, ARC-brakettene og
   SWING DIRECTION/PLANE-calloutene (også som hero).
3. **Ett svar per panel:** inaktive chip-verdier og uvalgte lie-preseter er
   demotert til Inaktiv-nivået (grå, 11/10 px); kun aktiv kontroll bærer
   verdinivået. Attack/Path-kortene har allerede ett svar hver.

**Meldt avvik funnet under D81-lesingen — LUKKET:** DESIGN.md «Fortegn og
retning» sa `ahead/behind` mens eieren hadde låst `before/after` som
bransjebegrepet i D67-runden. Eier avgjorde 2026-08-25: **before/after
vinner.** DESIGN.md-tabellen og -prosaen samt D67-raden i DECISIONS.md er
rettet; adapteren (`displayStudio.js`) brukte allerede before/after.

## Kjente begrensninger

- Visuell sluttkontroll i denne økten var strukturell (DOM/geometri/konsoll i
  skjult fane) — en gjennomgang i åpent nettleserpanel/på telefon anbefales.
- `-moz-`-sliderstyling arvet fra mocken er utestet visuelt i Firefox.
