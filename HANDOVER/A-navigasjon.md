# Oppdrag A — Navigasjonsarkitektur og Ball Flight

**Les `00-FELLES.md` først.** Dette brevet forutsetter den.

**Denne strømmen låser navigasjonen for hele appen.** B, C og D venter på deg.
Lever navigasjonsbeslutningen først, deretter Ball Flight.

---

## Problemet

Appen har sju flater og to orienteringer. Vertikal plass er knapp — særlig i
Impact Studio som er landskap. Et permanent bunnfelt ville spist plassen scenen
trenger.

## Det som allerede er funnet

Ingen av de undersøkte visualiseringsappene bruker bunnfelt. De bruker:
flytende sirkler i hjørnene, bunnark som kan dras sammen, og piller for
tilstandsbytte. Se navigasjonsfunnet i `00-FELLES.md`.

## Del 1 — navigasjonsarkitektur

Lever **én** anbefaling, ikke en meny. Den skal svare på:

1. **Hvordan bytter man modul?** Sju flater. Bunnfelt er utelukket. Alternativer
   verdt å vurdere: flytende hjem-knapp, kantsveip, en Home som er hub framfor
   forside, eller modulbytte via en pill øverst.
2. **Hva skjer i landskap?** Impact Studio er den eneste landskapsflaten.
   Skal navigasjonen se lik ut der, eller er landskap et modus man går *inn i*
   og *ut av*?
3. **Hvor mye chrome er permanent?** Sett et tall: hvor mange piksler av
   skjermen har appen lov til å bruke på noe som ikke er data?
4. **Hvordan kommer man tilbake?** Fra en modul til Home, og mellom moduler.

**Krav:** minimum 44 × 44 px berøringsflate. Tastaturalternativ. Synlig fokus i
alle tilstander — fokus er en egen akse, ikke en tilstand.

Bygg 2–3 klikkbare HTML-prototyper som viser arkitekturen i praksis. Ikke
beskrivelser — noe som kan trykkes på.

## Del 2 — Ball Flight fra bunnen

Bygges med `DESIGN.md`, ikke ved å refaktorere gammelt.

**To linser: DIRECTION og HEIGHT.** Utfallsfordelingen står i `00-FELLES.md`.

**Fem input:** Club Speed (mph) · Club Face (°) · Club Path (°) · Attack (°) ·
Dynamic Loft (°). Én aktiv om gangen i `primary`, fire holdt i `grey`.

**Disse fem grepene fra brukerens egne mocker skal overleve:**

1. **Pin + delta-setning.** En festet referanse, og endringen i klartekst:
   «−6 m carry · → 27 m more curve». Dette er sensitivitetssvaret levert som
   én setning, og det er appens kjerneverdi.
2. **Måletrinn tvers over deltaflaten.** Vannrette streker ved faste
   downrange-intervaller som gjør flaten målbar, ikke bare synlig.
3. **Linse styrer inputpanel.** DIRECTION viser face+path, HEIGHT viser loft+attack.
4. **Køllefart som permanent stepper** øverst, uavhengig av linse.
5. **Deltaflaten** — arealet mellom forrige og nåværende bane, fylt gjennomsiktig.

**Deltaflaten er hovedgrepet.** Spesifikasjonen står i `DESIGN.md` under
Datavisualisering: gradient langs downrange-aksen, ikke vertikalt på skjermen.
Glød med `stdDeviation` = 2 % av scenens korteste side. Måletrinn hver 25 % av
carry, tegnet over flaten og under banene.

## Feil som skal rettes, ikke arves

Fra `UTFORDRINGER.md`:

- **U2** — tekstkollisjoner. `122 m L` overlappet `Apex 36 m`. Løsningen er i
  `DESIGN.md` under Layout: reservert sone for faste avlesninger, dynamiske
  ankere med hysterese (120 ms inn, 300 ms tilbake) for scenefestede etiketter.
- **U5** — SIDE viste et sideveis tall den ikke kunne tegne. Løst av D42.
- **U6** — bare 4 av 13 utfall synlige. Alle skal være tilgjengelige.
- **U7** — gridetiketter kolliderte med hovedtallet.

## Ikke gjør

- Ikke bygg motoren. Den finnes i `engine/`, 465 tester grønne.
- Ikke finn på tall. Trenger du eksempeldata, kall `engine/src/solveFlight.js`.
- Ikke legg glød på banene. Kun deltaflaten er myk.
- Ikke forfalsk sideveis målestokk. 5× gjør et slag på 5,18° til 24,4° på skjermen
  og leses som hook av en bruker som kjenner Trackman.

---

## Regelen som gjelder over alle andre

Finner du noe som **ikke** er bestemt i `DECISIONS.md` eller `DESIGN.md` —
**stopp og spør eieren. Ikke bestem selv.**

Det gjelder selv om valget virker opplagt. Særlig da.

Dette prosjektet er en gjenoppbygging fordi den forrige versjonen samlet opp
beslutninger ingen husket å ha tatt. Hver av dem virket opplagt i øyeblikket.
En parallell strøm som tar tretti små opplagte valg produserer tretti nye
udokumenterte bestemmelser — bare raskere enn sist.

**Unntaket:** rene implementeringsdetaljer uten designkonsekvens. Variabelnavn,
filstruktur, hvilken løkke du bruker. Det trenger ingen å vite.

**Ikke unntak:** alt som blir synlig for brukeren. En tom tilstand, en
lastetilstand, en feilmelding, en overgang, en plassering, et ord. Er det
synlig og ikke bestemt — spør.

## Leveranse

1. Navigasjonsanbefaling med begrunnelse, som klikkbar prototype
2. Ball Flight, begge linser, med ekte motortall
3. Liste over beslutninger du tok som ikke sto i `DECISIONS.md`
