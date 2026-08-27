# Designsystem — hva vi har, og hva som mangler

Vurdert 2026-08-25 mot `DESIGN.md` (linter 0/0).

## Landet

| Område | Status |
|---|---|
| **Visuell identitet** | Målt, ikke antatt. Temperaturkontrast-funnet (3,0 % mettet mot 2,7 % vask) er begrunnelsen, ikke smak. |
| **Farger** | 15 tokens med roller. 12 kalde, 3 varme. Kontrast verifisert av linter. |
| **Typografi** | 7 skalaer. Archivo variabel, `wdth` 100/125. `tnum` på alle verdier. |
| **Form** | 5 radiusnivåer. `none` er en beslutning, ikke fravær. |
| **Rom** | 4-punkts skala, 6 tokens. |
| **Komponenter** | 19 stk, alle token-referert. |
| **Lagdeling** | Nøyaktig ett mykt element: deltaflaten. Verifisert seks ganger. |
| **Layout** | Reservert sone for faste avlesninger + dynamiske ankere med hysterese (120/300 ms). |
| **Regler** | 10 Do's and Don'ts, hver med målt begrunnelse. |

Det er et **ekte** designsystem. Det er ikke et komplett et.

---

## Mangler — kritisk for et måleinstrument

### 1. Tallformatering  ⚠ største hull

Ingen regel finnes. Det er alvorlig, fordi **avrunding er en sannhetspåstand.**

Motoren returnerer `spinAxis: -16.26454982658155`. Viser vi fire desimaler på en
verdi som ligger i aerodynamisk ekstrapolasjon 87 % av tiden, lyver vi om presisjon.
Viser vi `−16°`, kaster vi informasjon brukeren trenger for å se effekten av én grad.

Trengs: **desimaler per metrikk**, tusenskilletegn, og en regel for når et tall
skal vise færre siffer fordi modellen ikke fortjener flere.

| Metrikk | Forslag | Hvorfor |
|---|---|---|
| Vinkler (launch, attack, path, face) | 1 desimal | 0,1° er under oppfattelsesgrensen |
| Spin Axis | 1 desimal | samme |
| Carry, Total, Apex, Side, Curve | 1 desimal (m) | 10 cm er finere enn slag-til-slag-variasjon |
| Backspin, Total Spin | heltall, tusenskille | `3 173`, ikke `3173.0` |
| Ball Speed | 1 desimal | |
| Smash | 3 desimaler | eneste metrikk der 3. desimal betyr noe |
| Face-to-Path | 1 desimal | |

### 2. Fortegn- og retningsformat

`DESIGN.md` sier «fortegn *og* L/R/C». Den sier ikke **hvordan**.
Mine egne mockups har brukt tre ulike former. Trengs én, låst:

- `−16.3° L` — fortegn, verdi, enhet, retning?
- `16.3° L` — retning erstatter fortegn?
- `L 16.3°` — retning først?

Uavklart betyr at det blir avklart tilfeldig, ulikt per skjerm.

### 3. Tilstander utenfor normalen

Ingen spesifikasjon finnes for:

- `inDomain = false` — hva viser skjermen når spin loft ≤ 0?
- Utenfor køllekonvolutten (D23) — den binære markeringen er besluttet, ikke designet
- `off-face` treff
- Lasting / beregning
- Første oppstart, før noe er stilt inn

For et instrument er dette ikke kantcaser. Det er halve opplevelsen.

### 4. Interaksjonstilstander

`hover`, `active`, `focus`, `disabled`, `pressed` per komponent. Vi sier
«synlig fokus» i prosa, men det finnes ingen token og ingen matrise.

---

## Mangler — viktig

### 5. Bevegelse

Ingen varighets- eller easing-tokens. Vi har to hysteresetall (120/300 ms) og en
reduced-motion-regel, men ingen skala. Trengs: `duration-instant/fast/base/slow`
og 2–3 easing-kurver, med regel for hva som animerer og hva som aldri gjør det.

### 6. Datavisualisering er prosa, ikke tokens

Deltaflatens gradientstopp, glødens radius, måletrinnenes intervall, prikkrutenettets
tetthet, stiplingsmønsteret på referansebanen — alt er beskrevet i tekst.
Ingenting er tokenisert. To utviklere ville laget to ulike instrumenter.

### 7. Responsivitet

Ingen breakpoints. Vi vet portrett for Ball Flight og landskap for Studio, men
det finnes ingen token for hvor grensen går eller hva som skjer på nettbrett.

### 8. Språk og terminologi

Uavklart: norsk UI med engelske metrikknavn? `05-ASK` antyder det. Men det står
ingen steder at «Spin Axis» aldri oversettes, og «Carry» heller ikke. Uten regelen
blir halve appen oversatt av en som mente godt.

---

## Mangler — standard, men lav hast

9. **Ikonografi** — ingen definert. Størrelse, strektykkelse, stil.
10. **Komponenttilstandsmatrise** — systematisk tabell, ikke prosa.
11. **Appikon og splash** — ikke spesifisert.
12. **Lysmodus** — vi har forpliktet oss til mørkt. Det bør stå eksplisitt at lys er utenfor scope, ikke bare være uteglemt.

---

## Ærlig prosentanslag

**Omtrent halvveis.**

Vi har den delen folk vanligvis kaller «designsystemet» — identitet, farge, typografi,
komponenter. Vi mangler den delen som avgjør om et *instrument* er til å stole på:
tallformatering, tilstander, og tokeniserte datavisualiseringsregler.

For en vanlig app ville vi vært på 70 %. For et måleinstrument er punkt 1 alene
verdt mer enn punkt 9 til 12 til sammen — så realistisk **50 %**.

Det raskeste løftet: **punkt 1 og 2.** De er små å skrive, de er rene beslutninger
uten research, og de fjerner den mest sannsynlige kilden til at appen ser upresis ut
uansett hvor riktig motoren regner.
