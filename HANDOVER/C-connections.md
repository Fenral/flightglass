# Oppdrag C — Connections redesignet

**Les `00-FELLES.md` først, deretter `NAVIGASJON.md` på rotnivå** — navigasjonen
er låst: Home er hub, din modul har én flytende HOME-sirkel som eneste permanente
chrome. Inngang og utgang er dermed bestemt; det du designer er innholdet.

Bruk `app/tokens.css` — tokens finnes allerede.

---

## Hvorfor denne er lettest

Connections er **motoruavhengig** (D44). Ingen deriverte, ingen kobling til
sliderne, ingen live beregning. Det er en **statisk graf**.

Arbeidsdelingen er:

> **Connections eier struktur. Ball Flight eier størrelse.**

Spørsmålet «hvor mye er én grad» besvares av Pin/delta-mekanikken i Ball Flight,
ikke av kartet. Kartet kan derfor aldri bli feil på tall — bare på struktur.

## Dataene

**`connections-graph-v2.json` på rotnivå** — **24 noder, 38 kanter, 5 lag, 0 gjeld.**

⚠ IKKE bruk `motor/export/connections-graph.json` — det er v1 fra det gamle
uttrekket, med 23/36 og en åpen gjeldspost. v2 (D47) splittet `spinloft` i
`spinloft` (3-D) og `verticalspinloft`, pekte `e30` om, og la til to kanter.
Én node kan ikke bære to størrelser: smash bruker 3-D, landingsmodellen vertikal.

Grafen er integritetstestet: ingen foreldreløse noder, ingen sykler, ingen
kanter som hopper baklengs mellom lag. Avvik mot dagens kode står i `_changeLog`.

## Brukerens tre krav

Fra intervju, ordrett og i prioritert rekkefølge:

**1 — «Vise hvordan de ulike parameterne henger sammen. For eks curve. Hva er det
som påvirker det?»**

Kartet leses **bakover fra én valgt metrikk**. Du velger `Curve`, og ser hva som
driver den.

**2 — «For mange noder samtidig» var hovedirritasjonen.**

23 noder på en telefonskjerm blir en hårball.

**3 — Hele årsakskjeden til inputene, sammenklappet** (D43).

`Curve ← Spin Axis ← Face-to-Path ← Face og Path`, alt i én visning — men **kun
nodene på den kjeden**, aldri alle 23.

Merk at 2 og 3 ikke er i konflikt: en kjede er 4–6 noder, ikke 23. Filtreringen
ligger i valget av metrikk.

## Designutfordringen

De sju begrepene forklarer seg ikke selv: `direct` / `coupled` / `modeled`, og
`primary` / `contributing` / `contextual` / `variable`.

Sju begreper på et kart uten legende er støy. Løsningen er sannsynligvis å
**ikke vise alle sju** — men det er din vurdering.

**D10 gjelder:** farge kan aldri være eneste bærer av kanttype eller styrke.
Bruk tykkelse, mønster, tekst.

## Kjent gjeld

Ingen. v1 hadde én åpen post (`e30`); den er lukket i v2 (D47). Finner du noe
i grafen som ser feil ut mot spec-ene, meld det — ikke rett stille.

## Ikke gjør

- Ikke koble til motoren. D44 sier rent generelt.
- Ikke vis tall eller deriverte. Det er Ball Flight sin jobb.
- Ikke vis alle 23 noder samtidig. Det var hovedirritasjonen.

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

1. Bakoverkjede fra valgt metrikk, som klikkbar prototype
2. Løsning på de sju begrepene — vis dem, forenkle dem, eller skjul dem
3. Inngangen: hvordan velger man metrikk å starte fra?
