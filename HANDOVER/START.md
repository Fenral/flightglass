# Start en strøm

Alle økter kjører i samme prosjektmappe. Brevene ligger på disk og skal **leses**,
ikke limes inn — en økt som har lest brevet kan følge referansene videre til
`DESIGN.md`, `DECISIONS.md` og `engine/` på egen hånd.

Lim inn **én** av promptene under som første melding i en ny økt.
Sett modell og effort som oppgitt over hver.

---

## Bølge 1 — start begge nå

### A — Navigasjon + Ball Flight · **Opus 5 · effort xhigh**

```
Du overtar én strøm i et gjenoppbyggingsprosjekt for golf-appen Flight Glass.

Les disse to filene først, i rekkefølge — de ligger i prosjektmappen:
  1. HANDOVER/00-FELLES.md        felles kontekst
  2. HANDOVER/A-navigasjon.md     ditt oppdrag

Ikke gjett på innholdet. Les dem.

FØR DU BYGGER NOE: skriv en kort oppsummering av (a) hva du har forstått at
oppdraget er, (b) hvilke filer du kommer til å røre, og (c) hva du er usikker på.
Vent på svar før du starter.

DEN VIKTIGSTE REGELEN: finner du noe som ikke er bestemt i DECISIONS.md eller
DESIGN.md — stopp og spør meg. Ikke bestem selv, selv om valget virker opplagt.
Særlig da. Unntaket er rene implementeringsdetaljer uten designkonsekvens:
variabelnavn, filstruktur, løkkevalg. Alt brukeren ser er ikke unntak — en tom
tilstand, en lastetilstand, en feilmelding, en overgang, en plassering, et ord.

Prosjektet har 56 låste beslutninger fordi forrige versjon samlet opp valg ingen
husket å ha tatt. Hver av dem virket opplagt i øyeblikket.

IKKE les den gamle kodebasen. Den er utenfor prosjektgrensen (D13).

Din strøm er den mest bærende: navigasjonsbeslutningen arves av tre andre
strømmer. Lever den først, separat, før Ball Flight.

Når du er ferdig, lever to ting: leveransen, og en liste over beslutninger du
tok som ikke sto i DECISIONS.md.
```

### D — Motorintegrasjon + §11 · **Sonnet 5 · effort high**

```
Du overtar én strøm i et gjenoppbyggingsprosjekt for golf-appen Flight Glass.

Les disse to filene først, i rekkefølge — de ligger i prosjektmappen:
  1. HANDOVER/00-FELLES.md            felles kontekst
  2. HANDOVER/D-motorintegrasjon.md   ditt oppdrag

Ikke gjett på innholdet. Les dem.

FØR DU BYGGER NOE: skriv en kort oppsummering av (a) hva du har forstått at
oppdraget er, (b) hvilke filer du kommer til å røre, og (c) hva du er usikker på.
Vent på svar før du starter.

DEN VIKTIGSTE REGELEN: finner du noe som ikke er bestemt i DECISIONS.md eller
DESIGN.md — stopp og spør meg. Ikke bestem selv, selv om valget virker opplagt.

IKKE les den gamle kodebasen. Den er utenfor prosjektgrensen (D13).

ADVARSEL SOM GJELDER DIN STRØM SPESIELT: engine/src/aero-reference.js ER en
andre implementasjon av samme fysikk. Den ser ut som akkurat den duplikatgjelden
oppdraget ber deg finne. Den skal IKKE slettes — den er en uavhengig utledning
brukt til differensialtesting, bit-identisk over 6741 kombinasjoner. Les filhodet
før du rører den.

Motoren har 465 grønne tester. Endrer du fysikk, er det en versjonert beslutning
som skal opp til meg først — ikke en opprydding.

Når du er ferdig, lever to ting: leveransen, og en liste over beslutninger du
tok som ikke sto i DECISIONS.md.
```

---

## Bølge 2 — start først når A har levert navigasjonsbeslutningen

### B — Impact Studio landskap · **Opus 5 · effort high**

```
Du overtar én strøm i et gjenoppbyggingsprosjekt for golf-appen Flight Glass.

Les disse to filene først, i rekkefølge — de ligger i prosjektmappen:
  1. HANDOVER/00-FELLES.md             felles kontekst
  2. HANDOVER/B-studio-landskap.md     ditt oppdrag

Ikke gjett på innholdet. Les dem.

FØR DU BYGGER NOE: skriv en kort oppsummering av (a) hva du har forstått at
oppdraget er, (b) hvilke filer du kommer til å røre, og (c) hva du er usikker på.
Vent på svar før du starter.

DEN VIKTIGSTE REGELEN: finner du noe som ikke er bestemt i DECISIONS.md eller
DESIGN.md — stopp og spør meg. Ikke bestem selv, selv om valget virker opplagt.
Særlig da. Unntaket er rene implementeringsdetaljer uten designkonsekvens.
Alt brukeren ser er ikke unntak.

IKKE les den gamle kodebasen. Den er utenfor prosjektgrensen (D13).

Navigasjonsarkitekturen er LÅST og ligger i NAVIGASJON.md på rotnivå — les den
som fil nummer tre. Home er hub; din modul har én flytende HOME-sirkel som
eneste permanente chrome. Design innenfor den, aldri i konkurranse med den.

Gjenbruk det som finnes: app/tokens.css (tokens) og adapter/src/ (konvertering
og geometri). Fysikklinten på rot feiler hvis du regner i app-laget — be
adapteren om det du trenger.

Når du er ferdig, lever to ting: leveransen, og en liste over beslutninger du
tok som ikke sto i DECISIONS.md.
```

### C — Connections · **Fable 5 · effort high**

```
Du overtar én strøm i et gjenoppbyggingsprosjekt for golf-appen Flight Glass.

Les disse to filene først, i rekkefølge — de ligger i prosjektmappen:
  1. HANDOVER/00-FELLES.md         felles kontekst
  2. HANDOVER/C-connections.md     ditt oppdrag

Ikke gjett på innholdet. Les dem.

FØR DU BYGGER NOE: skriv en kort oppsummering av (a) hva du har forstått at
oppdraget er, (b) hvilke filer du kommer til å røre, og (c) hva du er usikker på.
Vent på svar før du starter.

DEN VIKTIGSTE REGELEN: finner du noe som ikke er bestemt i DECISIONS.md eller
DESIGN.md — stopp og spør meg. Ikke bestem selv, selv om valget virker opplagt.
Særlig da. Unntaket er rene implementeringsdetaljer uten designkonsekvens.
Alt brukeren ser er ikke unntak.

IKKE les den gamle kodebasen. Den er utenfor prosjektgrensen (D13).

Navigasjonsarkitekturen er LÅST og ligger i NAVIGASJON.md på rotnivå — les den
som fil nummer tre. Inngang og utgang til din modul er bestemt; det du designer
er innholdet.

Grafen din er connections-graph-v2.json på rotnivå — IKKE v1 i motor/export/.

Din strøm har en ekte designnøtt: sju begreper som ikke forklarer seg selv.
Løsningen er sannsynligvis å ikke vise alle sju — men det er din vurdering, og
den vil jeg høre begrunnelsen for.

Når du er ferdig, lever to ting: leveransen, og en liste over beslutninger du
tok som ikke sto i DECISIONS.md.
```

---

## Bølge 3 — start først når A og B har levert skjermene

### E — Onboarding + splash · **Opus 5 · effort high**

```
Du overtar én strøm i et gjenoppbyggingsprosjekt for golf-appen Flight Glass.

Les disse to filene først, i rekkefølge — de ligger i prosjektmappen:
  1. HANDOVER/00-FELLES.md        felles kontekst
  2. HANDOVER/E-onboarding.md     ditt oppdrag

Ikke gjett på innholdet. Les dem.

FØR DU BYGGER NOE: skriv en kort oppsummering av (a) hva du har forstått at
oppdraget er, (b) hvilke filer du kommer til å røre, og (c) hva du er usikker på.
Vent på svar før du starter.

DEN VIKTIGSTE REGELEN: finner du noe som ikke er bestemt i DECISIONS.md eller
DESIGN.md — stopp og spør meg. Ikke bestem selv, selv om valget virker opplagt.
Særlig da. Alt brukeren ser er ikke unntak — og i din strøm er nesten alt
brukervendt.

IKKE les den gamle kodebasen. Den er utenfor prosjektgrensen (D13).

Alle tall i brevet ditt er regnet ut med motoren og verifisert. Bruk dem som de
står. Trenger du flere, kall engine/src/solveFlight.js eller studioSolve.js —
ikke finn på tall.

Onboardingen kjører inne i de EKTE skjermene, ikke i egne kopier. Finnes ikke
skjermen ennå, si ifra framfor å bygge en mockup av den.

Når du er ferdig, lever to ting: leveransen, og en liste over beslutninger du
tok som ikke sto i DECISIONS.md.
```


---

## Strøm F — kan starte når som helst, uavhengig av bølgene

### F — Swift-port av motoren · **Opus 5 · effort xhigh**

```
Du overtar én strøm i et gjenoppbyggingsprosjekt for golf-appen Flight Glass.

Les disse to filene først, i rekkefølge — de ligger i prosjektmappen:
  1. HANDOVER/00-FELLES.md        felles kontekst (merk Plattform-seksjonen: D70-D72)
  2. HANDOVER/F-swift-motor.md    ditt oppdrag

Ikke gjett på innholdet. Les dem.

FØR DU BYGGER NOE: skriv en kort oppsummering av (a) hva du har forstått at
oppdraget er, (b) hvilke filer du kommer til å opprette, og (c) hva du er
usikker på. Vent på svar før du starter.

DEN VIKTIGSTE REGELEN: finner du noe som ikke er bestemt i DECISIONS.md eller
DESIGN.md — stopp og spør meg. Ikke bestem selv, selv om valget virker opplagt.
Unntaket er Swift-idiomer, filstruktur og navnekonvensjoner i pakken.
IKKE unntak: enhver numerisk forskjell fra fixturen, enhver endring i
motorkontrakten, alt som blir synlig for laget som bygger SwiftUI oppå.

IKKE les den gamle kodebasen. Den er utenfor prosjektgrensen (D13).

DIN STRØMS KJERNE: du porterer ikke «etter beste evne» — du reproduserer en
pinnet sannhet. JS-motoren i engine/ er referanseimplementasjonen (D71) og
røres aldri. Fixturen (motor/export/, 7 528 caser) er fasit. Hver modul
porteres med sin egen fixturtest FØR neste modul begynner — ikke alt på én
gang med debugging til slutt.

TRE FELLER SOM VIL BITE (resten står i brevet og engine/README.md):
- Det finnes TRE ballradier med vilje (0.021335, 0.0213, 0.021336). IKKE
  harmoniser dem — de er pinnet hver for seg, og fixturen ser forskjellen.
- Grad-til-radian: flight bruker deg * (PI/180), studio (deg * PI) / 180.
  Det er 1 ULP forskjell, og fixturen ser den.
- Restfeilen på 11 caser i turfBand er KJENT og pinnet. Ikke «fiks» den.

Avvik rapporteres per felt med tall — aldri bare «innenfor toleranse».
Klarer et felt ikke toleransen: finn årsaken, ikke løsne toleransen.

Når du er ferdig, lever fire ting: Swift-pakken med tester, avviksrapporten
per felt, differensialkjøringen mot JS på 500 nye leveringer, og listen over
beslutninger du tok som ikke sto i DECISIONS.md.
```

---

## Hvis en økt ikke kjører i prosjektmappen

Bytt de relative stiene mot absolutte:

```
C:/Users/siver/Documents/Apper 2026/Flightglass final/HANDOVER/00-FELLES.md
```
