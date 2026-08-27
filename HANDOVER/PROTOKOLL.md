# Orkestratorprotokoll — meldinger mellom øktene

## Kanal
Stopp-og-spør-spørsmål sendes med ccd send_message til økten
«ORKESTRATOR Flightglass». Svar kommer samme vei.

## Meldingsformat — filer bærer innholdet, meldinger peker
- Beslutninger LÅSES i DECISIONS.md før svaret sendes.
- Svarmeldingen er en peker: «Låst som D<N> — les raden, fortsett.»
  Pluss maks 2–3 linjer presisering som ikke står i raden.
- Alt over ~10 linjer, eller noe flere økter trenger: fil i HANDOVER/ + peker.
- Spørsmål FRA en strøm: still det komplett i meldingen (det finnes ikke i
  noen fil ennå — da er meldingen riktig sted).

## Hvorfor
Tokenkostnaden er lik per tegn uansett kanal — men en peker koster ~10 tokens
der en gjentatt begrunnelse koster hundrevis, ganger antall økter, ganger
antall gjenværende runder i hver økt.

## Øktrotasjon — strømmene byttes ved sømmer
En strømøkt som har LEVERT og eksternalisert alt (kode + BESLUTNINGER-fil
oppdatert) pensjoneres; videre arbeid på samme flate starter i NY økt som
leser filene. ALDRI bytt økt midt i en oppgave med uskrevet arbeidskunnskap
(eks: F midt i fdlibm). Sømtest: «kan en ny økt overta fra disk alene?»
Ja → bytt. Nei → strømmen skriver ned det som mangler først, så byttes det.
Gevinst: små kontekster = raskere og billigere turer; filene er hukommelsen.
