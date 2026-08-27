# Oppdragsbrev — fem strømmer, tre bølger

**Hver ny chat får `00-FELLES.md` først, deretter sitt eget brev.**

---

## Bølgene

Kjør **to om gangen**, ikke fem.

| Bølge | Strømmer | Modell | Effort |
|---|---|---|---|
| **1** | **A** Navigasjon + Ball Flight | Opus 5 | **xhigh** |
| | **D** Motorintegrasjon + §11 | Sonnet 5 | high |
| **2** | **B** Impact Studio landskap | Opus 5 | high |
| | **C** Connections redesign | **Fable 5** | high |
| **3** | **E** Onboarding + splash | Opus 5 | high |

```
bølge 1        bølge 2              bølge 3
A ── navigasjon ──→ B (Studio) ──┐
 └── Ball Flight ────────────────┴──→ E (onboarding)
                    C (Connections)
D ── motor + adapter   (uavhengig hele veien)
```

## Hvorfor ikke alle samtidig

**C trenger å vite hvordan man kommer inn i og ut av Connections**, og det er A
som bestemmer. Starter C først, finner den opp sitt eget mønster — og da har du
to navigasjonsmodeller å slå sammen i etterkant.

Konflikter i **designbeslutninger** er mye vanskeligere å rydde opp i enn
konflikter i kode. En merge-konflikt i JavaScript løser seg på fem minutter.
To uforenlige navigasjonsmodeller løser seg ikke.

**D er unntaket.** Den rører kun `engine/` og adapterlaget og tar praktisk talt
null designbeslutninger. Den kan gå parallelt med hva som helst, og den vil nesten
aldri avbryte deg.

## Om modellvalget

**A får xhigh** fordi navigasjonen er den mest bærende beslutningen i prosjektet.
Alle andre strømmer arver den, og en dårlig arkitektur her betales fire ganger.

**C er testbenken for Fable**, ikke A. C har fast datasett — 23 noder, 36 kanter —
og tre eksplisitte krav. Du ser på resultatet i to minutter og vet om kjeden leser
klart. Går A dårlig, arver B, C og E feilen. Går C dårlig, har du mistet én skjerm.

C har dessuten en ekte designnøtt: sju begreper (`direct`/`coupled`/`modeled` og
`primary`/`contributing`/`contextual`/`variable`) som ikke forklarer seg selv.
Løsningen er sannsynligvis å *ikke* vise alle sju. Det er en oppgave der annen
smak faktisk kan vise forskjell.

**D får høyere effort enn oppgaven tilsier**, fordi den har én felle:
`aero-reference.js` **er** duplisert fysikk, med vilje, som differensialtest.
En modell som mønstergjenkjenner «duplikat = dårlig» vil slette den.

## Regelen som gjelder alle fem

Hvert brev slutter med den, og den er viktigere enn rekkefølgen:

> Finner du noe som ikke er bestemt i `DECISIONS.md` eller `DESIGN.md` —
> **stopp og spør. Ikke bestem selv.** Det gjelder selv om valget virker opplagt.
> Særlig da.

**Unntak:** rene implementeringsdetaljer. Variabelnavn, filstruktur, løkkevalg.

**Ikke unntak:** alt brukeren ser. En tom tilstand, en lastetilstand, en
feilmelding, en overgang, en plassering, **et ord**.

Regelen koster deg avbrytelser. Det er byttet: **oppmerksomhet nå, framfor
arkeologi senere.** Den forrige versjonen av prosjektet samlet opp beslutninger
ingen husket å ha tatt, og hver av dem virket opplagt i øyeblikket.

## Når en strøm er ferdig

Be den om **to ting**:

1. Leveransen
2. **En liste over beslutninger den tok som ikke sto i `DECISIONS.md`**

Punkt 2 er den siste sikringen. Slapp noe gjennom stopp-og-spør-regelen, fanges
det her — framfor om seks måneder, når ingen husker hvorfor.
