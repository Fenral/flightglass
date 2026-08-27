# Strøm A — beslutninger tatt som ikke sto i DECISIONS.md

**Status: GODKJENT AV EIER 2026-08-25.** N-a…N-h og B-a…B-p er låst samlet;
avklaringene under står med eget svar. Ingenting er ført inn i `DECISIONS.md`
av meg — innføring der er eierens.

## Meldte motsigelser (allerede håndtert av eier)

- Studio-brytepunktet `wide ≥ 840` mot 03-kriterium 8 → **D59**
- «Nøytralt slag» i DESIGN.md mot 02-spec standardslag → **D60**

## Del 1 — navigasjon (N-listen)

Se «Forslag som trenger låsing» i `NAVIGASJON.md`: N-a … N-h.

## Del 2 — Ball Flight (B-listen)

| # | Beslutning | Begrunnelse |
|---|---|---|
| B-a | **Tracer-geometrien er en presentasjonsinterpolasjon** forankret i motorens tall: høydeprofilen er en kubisk Bézier gjennom launch angle, apex, carry og landing angle — alle fire EKSAKT, null frie parametre. Retningssporet er launch-linjen pluss kvadratisk avvik som ender eksakt i motorens offline. | Motoren eksponerer ingen banepolylinje. Å tegne RK4-banen ville latt traceren lande et annet sted enn sitt eget landingsmerke: viste carry er den empiriske fitten (D34), og RK4 er 7,5 % feil på lengde. Scenen må tegne tallene den viser. |
| B-b | **Scene-skala er auto-fit** til live + pin med 6 % margin. | Maks carry over sliderområdet er 412,8 yd; et fast vindu ville tegnet et 90 mph-slag i under halve scenen permanent. |
| B-c | **HEIGHT-scenen bruker samme skala vertikalt som horisontalt** — ingen vertikal forstørrelse. | D16 forbyr forfalsket sideveis målestokk i hovedvisningen; jeg utvidet prinsippet til høydeaksen. Konsekvens: profilen tegnes flat-ærlig (apex 28,7 m på 172 m carry). Si fra om høyden heller skal auto-fittes separat. |
| B-d | **Standardlinse er DIRECTION.** Aktiv parameter per linse: FACE i DIRECTION, LOFT i HEIGHT. | DIRECTION står først overalt i spec; face er retningens primærakse, loft er høydens. |
| B-e | **Én pin.** PIN fester nåværende slag; nytt trykk re-fester. Ingen unpin. **Ghost-linjene (inntil to ekstra referanser uten fyll, eierens svar 7) er IKKE bygget ennå.** | Én fylt flate er kjernen; re-pin dekker arbeidsflyten «fest, dra, fest igjen». |
| B-f | **Fast sone viser CARRY i begge linser, SIDE kun i DIRECTION.** Delta-setningen er linseavhengig: DIRECTION = Δcarry + Δcurve, HEIGHT = Δcarry + Δapex. | U5/D42: et sideveis tall vises aldri i planet som ikke kan tegne det. Kurve er sideveis — setningen må følge samme regel. |
| B-g | **Duplikater fjernet fra utfallsgriden:** Carry og Side bor i fast sone. DIRECTION-grid: Launch Direction, Spin Axis, Curve, Face-to-Path, Ball Speed. HEIGHT-grid: Launch Angle, Spin Loft, Backspin, Landing Angle, Smash Factor, Ball Speed, Total, Apex. Alle 13 til stede på tvers av flatene. | 02-krav: ingen duplisering uten klar funksjon. Fast sone er carry/side sitt hjem. |
| B-h | **Delta-setningens ordlyd:** `Δ vs pin: −0.7 m carry · → 10.2 m more curve`. Pilen er kurvens retning (→ høyre, ← venstre); «more/less» er endringen i kurvestørrelse. | Mock-formatet fra grep 1, presisert. |
| B-i | **No-flight-tilstanden:** slab erstattes av `status-warn` «NO FLIGHT»; forklaringen er «No flight — spin loft is zero or negative: the face is delivered at or below the club's direction of travel, so the ball gets no lift.» Flight-avhengige avlesninger fjernes; resten står. Scenen viser target- og launch-linje. | DESIGN.md: warn eier no-flight; «de flukt-avhengige avlesningene erstattes av ett kort svar på hvorfor». Ordlyden er min — bygget på DESIGN.md sin egen forklaring. |
| B-j | **Konvoluttmerkets tekst:** `OUTSIDE CLUB ENVELOPE: 129 MPH × 40.0°` i primary-hi ved stepperen. | D23 krever tekst som sier hva som er utenfor; paret er det som er utenfor. |
| B-k | **Måletrinn-etiketten på ytterste trinn viser downrange-avstanden** (linjal-tolkning). **Landingsmålelinjens verdi er avstanden mellom de to landingspunktene**, uten retningsbokstav. | Trinnene er en linjal langs downrange; gapet mellom landingspunkter er en separasjon, ikke en retning. |
| B-l | **Chips viser navn + verdi; verdien flyter over slideren i primary.** | Apple Photos-mønsteret fra 00-FELLES: velgeren er tynn, verdien flyter. Verdi i chip gjør holdt parameter avlesbar uten å velge den. |
| B-m | **Readout-etiketter uforkortet:** LAUNCH DIRECTION, ikke «Launch Dir» som i D42-teksten. | DESIGN.md: fagbegreper «forkortes ikke». D42 fordeler utfall; etikettformen styres av DESIGN.md. |
| B-n | **SPIN LOFT viser `out.spinLoft` (3D-verdien).** | Motorens offentlige felt av det navnet. Vertikal spin loft finnes også — si fra om den skal vises i stedet. |
| B-o | **Enhetstoggle M/YD øverst til høyre er prototype-only** og teller ikke mot chrome-budsjettet. Fjernes når Innstillinger finnes. | Eierens svar 5 ba om testtoggle. |
| B-p | **Slab viser shape i caps:** `PUSH FADE`. | DESIGN.md slab-eksemplene er caps: DRAW, FADE, PUSH SLICE. |

## Rettet underveis, uten designkonsekvens

- `nav.js` Escape pekte relativt feil fra Ball Flight-mappen; nå `data-home`.
- Hub-kortet peker på ekte Ball Flight, ikke skjelettet.

## Ikke bygget ennå (kjent, ikke glemt)

- Ghost-linjer for referanse 2 og 3 (eierens svar 7)
- «Beregner»-tilstanden over 100 ms (motoren svarer < 1 ms lokalt — tilstanden
  er definert i DESIGN.md men har ingen naturlig trigger i prototypen)
- Modellgrense-setningen («Modelled shot …») — D11 sier den bor i Details;
  ingen Details-flate er definert i denne prototypen. **Trenger plassering.**

## Avklart av eier underveis (før samlet låsing)

| Punkt | Eierens svar |
|---|---|
| B-a tracer-interpolasjon | **Godkjent.** Banen tegnes som interpolasjon som treffer motorens launch, apex, carry, landing og offline eksakt. |
| Appens åpningsflate | **Home.** Appen åpner på hub-en; Ball Flight har standardslaget (D60) ferdig lastet når man går inn. |
| B-d presisert | Gjelder kun linsevalg inne i Ball Flight (DIRECTION først), ikke appens åpning. |

| Modellgrense-setningen | **Godkjent:** én grå caption-linje nederst under tallisten i Ball Flight. Implementert. |
| Ghost-linjer | **Bygget** etter svar 7: nyeste pin driver deltaflaten; inntil to eldre referanser tegnes som linje i `primary` ved 0.30 opasitet, stiplet 4 4, aldri fyll, aldri markører. Fjerde pin fjerner eldste (02-kontrakten). Opasiteten 0.30 er min (B-q) — svakere enn pin (0.55), står under pin og live i prioritet. |

## Gjenstår utenfor min strøm

- «Beregner»-tilstanden over 100 ms har ingen naturlig trigger lokalt — motoren
  svarer < 1 ms. Definert i DESIGN.md; blir aktuell først om løsing flyttes.
- Innføring av N/B-listene i `DECISIONS.md` — eierens penn.

## D61 — baneformen flyttes til adapter/ (vedtatt av eier)

Eier: `topPoints`/`heightPoints` er en tegneantagelse, ikke fysikk, og skal bo
i `adapter/` (D sitt eierskap) slik at D-plane og Ball Flight aldri kan tegne
ulike kurver for samme slag. Koordinering med D om filnavn er sendt
(forslag: `adapter/src/traceShape.js`); flyttingen skjer når D har svart.
`Math.hypot` i bf.js er avklart som skjermgeometri — D presiserer linten.

## D61/D63 — gjennomført

- **D61:** `topPoints`/`heightPoints` bor i `adapter/src/traceShape.js` (D flyttet,
  tekstdiff-verifisert). `bf.js` importerer derfra; lokale kopier slettet.
- **D58:** `adapter.local.js` + test slettet; all konvertering/formatering går
  via `adapter/src/{convert,format,displayFlight}.js`. Tall verifisert bit-like
  før/etter migrering.
- **D63:** launch-/retningsstrålene leveres av `directionRay(deg)` i traceShape.
  Null trigonometri igjen i app-koden; vinkelfelt går rett fra `out` til
  adapteren. Piksel-verifisert: 1.56° (topp) og 14.00° (høyde).
- Rot-`npm test` grønn: fysikklint 0 funn · motor 465 · adapter 48.

## D76-ommalingen — vedtak underveis (føres løpende)

| Vedtak | Innhold |
|---|---|
| D79 | traceSamples godkjent med fire invarianter (ren funksjon i traceShape, endepunkter bit-like motorens felt, kun presentasjonsinterpolasjon, testet i adapter/test/). D bygger; A konsumerer. |
| D80 | Fotobakgrunnen tapes i Ball Flight som D40-konsekvens (står på avvikslisten) og får nytt hjem på Home/splash/onboarding. Prinsipp: atmosfære hører til ikke-instrumentflater. |
| Home-scope | A ommaler `_source/mocks/home/` etter at Ball Flight er verifisert; fotoet flyttes dit i samme jobb. |

## D82-reverseringen (v3) — utført 2026-08-26

- `sa-p3.css` og `sa.css` gjenopprettet bit-like fra `_source`, med KUN tre
  vedtatte endringer: Geist for UI (D83), gul-opprydding (D84: `--warn` og
  `--gold` pensjonert; `--reward-gold`→secondary, eyebrow-out→strike), og
  `--trace-live` (v3-datavis: levende bane er varm hvit).
- Alle mine v2-demoteringer i canvasen reversert til mockens alfaer;
  `const`→`let`-fiksen og launch dir/curve-dekomponeringen står.
- Deltafeltet: én primary-hue i gradienten (v3). Baner uendret — v3
  spesifiserer det som var bygget (1.6/1.4/30 %, ingen bloom, D85-skopet).
- HOME-sirkelen i v3-drakt (plate/pill); mockens skallstil vinner der den
  har høyere spesifisitet — D82-korrekt.
- Linsepille-aktiv tilbake til mockens secondary; delta-setningen på
  v3-støttenivået (ink 80 %).
- **Hull tettet (eiergodkjent):** no-flight-tilstanden (status-bad-badge,
  B-i-ordlyden, treffet uten flukten, flight-avhengige verdier viser `–`,
  synlig også i change-modus) og konvoluttmerket (D21/D23) — mocken viste
  ingen av dem.
- Består: motorseam/traceSamples, all adapterformatering, D40/D42, D11-noten,
  D18-stabilisatoren, paywall-nøytralisering, Home-motorkobling + D80-splash.

## Etter-v3-vedlikehold (2026-08-26)

- `app/nav/` migrert til v3-tokens (D82): mekanisk mapping coal→plate/surface/
  line, text→muted/ink, radier→control/card, ease→mockens kurve; `.t-*`-
  typografiklassene reetablert i v3-roller i nav.css (regenererte tokens.css
  er kun tokens); fontlenker → Geist/Space Grotesk/Plex. C varslet om at
  lenken (C-q) kan gjeninnføres.
- Home regresjonssjekket etter sa-p3-gjenopprettingen: v3-riktig uten endring
  (flaten var tokenren); lab på ekte motor, D80-splashfoto intakt.
- C-kryssjekk av nav.css: tre funn, tre rettelser (Archivo-rest → --font-ui;
  fokusring → 2px secondary per v3 Interaksjonstilstander; home-circle →
  plate/ink/pill per komponentspesifikasjonen). Verifisert computed.
- FLAGGET, ikke rettet: mockens egen `.sa-focus` (sa-p3, dobbel ink-ring) og
  ball-flight `.ts-back` (ink-ring, mock-konvensjon) avviker fra v3-tekstens
  «2 px secondary-ring». Mock-fasit (D82) og v3-normativ tekst peker hver sin
  vei — trenger et ord fra eier om hvilken som vinner for fokus.
- Fokusring-flagget LUKKET som D94 (eier): ink-ringen vinner, v3-prosaen er
  rettet. nav.css sin fokusregel reversert secondary → ink. Ball Flight sin
  ts-back var allerede riktig (mock-konvensjonen).
- PROXY BEKREFTET AV EIER (direkte i A-økten, 2026-08-26): ORKESTRATOR-økten
  taler for eieren. Stopp-og-spør-punkter rutes dit; vedtak derfra gjelder.
  A-praksis videreføres: låste rader verifiseres i DECISIONS.md (kildesannhet),
  slik D94 ble.

## V1-forenklingen (eierdirektiv direkte i A-økten, 2026-08-26)

Utført, verifisert ende-til-ende, meldt orkestrator for D-rader:
- **Pin fjernet** (knapp, Δ-setning, pins-stack, seed-pin). Erstattet av
  auto-referanse: tilstanden man kom fra står som grå ghost (mockens --ghost,
  kun gjeldende slag bærer farge) mens man drar, holder 700 ms etter slipp,
  fader 260 ms. Reduced motion: forsvinner ved settle. Slider-ghostmarkørene
  leser auto-referansens inputverdier.
- **Deltaflaten ute av V1** (fulgte pin; støy-prinsippet). Spec består som
  dokumentert vei videre.
- **Shot-lesetilstanden og Details fjernet** (eierens skjermbilde). Appen står
  permanent i redigering, åpner direkte i DIRECTION. Done-knappen død.
  Kun de fire avlesningene: launch dir, curve, offline (sceneetiketter) +
  carry i hjørnet. Reverserer D42-visningsdelen/U6 — D-rad hos orkestrator.
- **D11-setningen** flyttet til bunnen av sliderpanelet (provisorisk til
  plasseringsvedtak).
- **Sliderboksen komprimert** (padding/stasjonsmarger redusert).
- **No-flight** består via paneNotice (nå modusuavhengig); konvoluttmerket består.
- VENTER: bunnmeny-innholdet (delegert orkestrator), fade-timing-låsing
  (700/260 forslag), HEIGHT-bekreftelse.
- D123–D126 verifisert og kvittert: fade-verdiene låst; D126-plass reservert
  (68px + safe-area under inputkortet, ingen egen meny — H bygger sentralt);
  E-plikten i D124 kjørt GRØNT ende-til-ende (steg 1–3 i den opererte flaten,
  overlevering til Studio med step=4). E sitt api-lag overlevde kirurgien;
  host-reset sitt 'shot'-kall er no-op mot change (D124-korrekt, meldt).
