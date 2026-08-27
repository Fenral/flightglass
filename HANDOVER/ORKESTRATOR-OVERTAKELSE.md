# Orkestrator-overtakelse — 2026-08-26 ~10:00

Du er ny orkestrator for Flightglass-strømmene. Forrige orkestratorøkt ble for
stor og er arkivert. ALT du trenger ligger på disk.

## Les i denne rekkefølgen
1. HANDOVER/PROTOKOLL.md      — meldingsformatet (pekerstil, filer bærer innhold)
2. DECISIONS.md               — 91 låste beslutninger. Din lov.
3. STATUS.md                  — prosjektstatus
4. HANDOVER/README.md         — strømmene og bølgene

## Din rolle
- Eierens beslutningsproxy. Strømmene A–F sender stopp-og-spør-spørsmål til
  økten med tittel «ORKESTRATOR Flightglass» via ccd send_message. Du svarer
  samme vei, PEKERSTIL: lås beslutningen i DECISIONS.md først (neste nr: D92),
  meldingen er «Låst som D<N> — les raden» + maks 3 linjer.
- Beslutninger som genuint er eierens (identitet, scope, penger): samle og
  legg fram for eieren i DIN økt.
- Eierens kommandoord «sjekk» = kjør full runde umiddelbart:
  list_sessions + diskaktivitet (app/, adapter/, swift/) + rot-`npm test`.
- ScheduleWakeup-loop hvert 30. min som sikringsnett (se mønster i loggen
  under). Innkommende meldinger vekker deg uansett.

## Øktene (ccd session-id-er)
NB (eierønske 2026-08-26): økt-titlene er omdøpt til «<bokstav> · <side/tema>»
— bokstaven består som sporingsnøkkel i dokumenter og D-rader. Nye strømmer
døpes i samme format av orkestrator når de melder seg. G = Studio
Strike-splitt (plan, local_5db60b83-d64e-45b5-a3c8-971a6bf2d5e9), H = Meny +
dashboard (plan, local_1954f5c8-00e7-41ba-aed0-023befed361f, startet ~14:29
med portrett-først-prompten).
  A: local_bac44d3a-c295-4cf4-9cab-971d9a6351f7   Ball Flight/nav/Home
  B: local_8ec98f1b-262c-4ce3-a9a6-ad47a00c9a34   Impact Studio
  C: local_bc22c348-34dd-4cfc-ae5d-d3b775e09762   Connections
  D: local_db6a032a-6a6d-4a6a-b9fd-70cdfb4612e3   FERDIG — ikke vekk
  F: local_7d04e860-a786-462e-b3c6-b7e1df6d40f2   Swift-port

## Venter på, akkurat nå (oppdatert av ny orkestrator ~11:00)
- A: FERDIG og lukket (~11:00). D94-reverten utført, proxy bekreftet av eier
  direkte i A-økten.
- B: FERDIG og lukket (~10:45). D94/D95 implementert og verifisert;
  range-presiseringen ført i D94-raden.
- C: FERDIG og lukket. F-C3 (D82-dobbeltbruk) rettet: lie-vedtaket er D93.
- F: FERDIG og lukket. Å2 låst som D92; 207 tester 0 feil, verifisert
  uavhengig av orkestrator. Rest: Mac-rekjøring før shipping (pow-stien).
- E: LEVERT (~13:10, hele sekvensen ende-til-ende, D112 låser leveransevalgene).
  Lukkes endelig etter eierens visuelle sømtest på telefon/PC. Kjente rester
  (med vilje): ~114 linjer død onboarding-CSS i sa-home.css, Studio/Connections
  sine HOME-lenker peker på nav/ — begge ryddes i Home-redesign-runden.
- ETTER E: Home-redesign som egen runde (D96 — eieren er ikke fornøyd med
  noen av dagens to Home-flater; brief må hentes fra eieren).
- A: V1-forenklingen LEVERT og lukket (~17:40). D123–D126 utført inkl.
  hovedside-fjerning (eieren ga bildet direkte i A-økten); E-steg 1–3
  verifisert grønt mot operert flate; 68 px + safe-area reservert for H-meny.
- EIERENS BESLUTNINGSKØ (per ~16:30): G sine fire (splitt-form/bryter/
  lie-form/portrett-strategi) · H hovedvalg H1/H2/H3 (NB: H2 krever samtidig
  vedtak om ark-dashboard over Studio — overlegg ≠ innhold, eller sperres) ·
  ordvalg menyceller (pågår i H-økten; utløser D64-presisering) · sømtest av
  onboardingen. Ved G-alt-1: D115 omskrives i byggerunden.
  OPPDATERT ~17:30: ordvalg TATT (D119–D121); nye køpunkter: Home-variant
  A/B/C (mock på /app/home/home-demo.html) · fold avgjort (D127) · H1-
  hovedvedtaket MÅ inkludere N-a/N-b-revisjonen (HOME-sirkel kun i landskap,
  veien ut i portrett er menyen — G §15.1/H §3) · safe-area-avklaring G↔H
  pågår (56 px stripe = 90 px med inset på 390-klassen).
- Hos eier: kun å åpne E-økten når ønsket.

## Porter som alltid gjelder
- Rot-`npm test` skal være grønn (fysikklint + motor 465 + adapter 75)
- DESIGN.md skal alltid linte 0/0 (design.md-linter, se .design-sync/NOTES.md
  for hvordan — npx-shimmen svelger output, bruk node direkte)
- Strømmene skal aldri bestemme noe synlig som ikke står i DECISIONS.md

## Fallgruver forgjengeren lærte
- Økt-tidsstempler i list_sessions er UTC; lokal klokke er +2t
- Meldinger til strømmer som venter: si eksplisitt «fortsett/bygg nå»,
  ellers blir de stående i vent-modus fra sine gamle prompter
- swift/ er unntatt fysikklinten (D90) — probene der er verifiseringsrigg
- _source/ er skrivebeskyttet (D77). Aldri rør.
