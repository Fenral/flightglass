# Designsystem v3 — analyse, arv og plan

2026-08-26 · Grunnlag: D82 (tilbake til mockenes visuelle språk).
Linser: impeccable · design-taste · frontend-design. Der linsene forbyr det
briefen krever, vinner briefen — det er impeccables egen første regel.

---

## 1 · ANALYSE AV DET GAMLE SYSTEMET

### Det som er sterkere enn antatt

**Dette er ikke en palett — det er et halvferdig designsystem med uvanlig
høy håndverkskvalitet:**

1. **OKLCH med dokumenterte kontrastforhold.** `--path: oklch(78.68% 0.1179
   228.25); /* 10.27:1 / 10.60:1 */` — noen har målt og notert kontrast per
   token. Det er sjeldnere enn linting; det er disiplin.
2. **Tre fontroller med dedikert datafont.** Inter (UI) · Space Grotesk
   (display) · IBM Plex Mono (`--font-data`). En monospace datafont løser
   tabular-tall-problemet *strukturelt* — hvert siffer er likt bredt av natur.
   Det oransje systemet trengte `tnum`-features for samme effekt.
3. **Semantisk parameterpalett.** Hver parameter eier en kulør: `--face`
   koral, `--path` cyan, `--attack` rosa, `--loft` lavendel, `--plane`
   periwinkle, `--strike` gull, `--depth` orkidé. Med kommentert regel:
   *«MUST leave coral --face ≥7.4:1»* — fargene er valgt mot hverandre.
4. **Eierspor.** *«pink, owner override 2026-07-11 holds»* — systemet har
   allerede en beslutningshistorikk. D-loggen vår er en fortsettelse, ikke
   en oppfinnelse.
5. **Materialitet.** `--plate: rgba(8,5,14,.86)` (glassplater), `--scene-bg`
   radial dusk-gradient, `--accent-line`-hårlinjer i tre styrker. Dette er
   grunnen til at mocken føles rik der remaken føltes tom.

### Svakhetene, per linse

**[impeccable · Operate-modus] Ingen hierarkiregel over parameterfargene.**
Sju kulører med lik metning og lik lysstyrke = ingen vet hvem som leder.
Skjermbildene viste det: rosa attack, cyan path, lilla loft samtidig, alle
like høyt. Operate-modus krever at scanability slår ekspresjon.
→ *Fiksbart uten å miste identiteten: aktiv parameter i full kulør, holdte
i avmettet form. D81-regelen, gjenbrukt med annen maling.*

**[impeccable] Semantikk-kollisjon i varmsonen.** `--accent #FF8A4D`,
`--focal-warm`, `--strike` gull, `--warn #FFD056`, pluss gull-tripletten
`#e3b05c/#e8b45a/#d9b36a` — fem varme gultoner med ulike jobber. `--warn`
og `--strike` er nesten samme farge; en advarsel kan leses som et treffbånd.
→ *Konsolider gulltripletten til én token; flytt warn mot rød-oransje
(`--bad #FF7B8A` finnes alt som anker).*

**[design-taste] Duplikat-hex uten navn.** `#ff8a4d` vs `#ff8a4c`,
`rgba(34,227,214)` cyan brukt 5× uten token, `#fbbf24/#f87171` — Tailwind-
rester fra F6-funnet lever fortsatt i enkelte mockfiler.
→ *Alt inn under navngitte tokens; ingen naken hex i komponentkode.*

**[design-taste] Inter som UI-font er systemets mest generiske valg.**
Display og data har karakter; UI-laget har ikke. Skillen banner Inter direkte.
→ *Alternativ: Geist eller Satoshi som UI, samme metrike rolle. Men dette er
identitetsendring — EIERENS valg, flagges, ikke gjøres.*

**[frontend-design] Atmosfæren er underutnyttet som system.** Mocken har
dusk-gradienter og glassplater, men de er per-fil-improvisasjon, ikke tokens.
Remake-fadesen beviste hva som skjer da: atmosfæren forsvant fordi den ikke
var spesifisert.
→ *Tokeniser: `--scene-bg`, `--plate`, glassrefraksjon (1px indre kant +
indre skygge — nøyaktig frontend-design sin «liquid glass»-oppskrift, som
mocken alt gjør intuitivt).*

**[alle tre] Det som mangler helt** (og som det oransje systemet bygde):
tallformat, informasjonsnivåer, interaksjonstilstander, tilstander utenfor
normalen, bevegelsestokens utover én `--ease`, datavisualisering som tokens,
coachmark, brytepunkter, ikonografi. **Reverseringen gjelder malingen —
ikke disse.**

---

## 2 · ARVELISTEN — hva det oransje systemet etterlater seg

Palettuavhengig innhold som overføres uendret eller med ommaling:

| Arv | Fra | Endring ved overføring |
|---|---|---|
| Tallformat-tabellen (desimaler, tusenskille, `ahead/behind`) | D28/D29/D67 | ingen |
| Informasjonsnivåene Svar/Støtte/Meta/Inaktiv | D81 | farger remappes |
| **Hierarkistigen** | D81 | omformuleres: «aktiv parameter i full kulør; holdte parametre avmettet; maks én leder per skjerm» |
| Interaksjonstilstander + fokus som egen akse | DESIGN.md | tokens remappes |
| Tilstander utenfor normalen (5) | DESIGN.md | `--warn`-mapping |
| Bevegelsestokens + «det som svarer på slider animeres ikke» | DESIGN.md | `--ease` finnes alt — behold mockens kurve |
| Deltaflate-spesifikasjonen (gradientstopp, glød, måletrinn) | DESIGN.md | farge: `--accent`-familien i stedet for oransje-stigen |
| «Kun deltaflaten gløder» | D15 | **vurderes på nytt** — mocken bruker glød friere; regelen var svar på et problem i det oransje systemet. Testes mot mock, ikke antas. |
| Coachmark + plasseringsregel | DESIGN.md | tokens remappes |
| Brytepunkter inkl. D59-orienteringsregelen | D59 | ingen |
| Engelsk UI, enhetsvalg, modellgrense-setning | D27/D30/D52 | ingen |
| Ikonografi-reglene | DESIGN.md | ingen |
| **Linter-disiplinen** (0 errors, 0 warnings før bruk) | prosess | ingen |

**Det som IKKE overføres:** oransje/kull-paletten, «ingen kald motpol»,
temperaturkontrast-begrunnelsen, binær aktiv/holdt-semantikk (D19) —
parameterfargene er tilbake som identitet, nå med hierarkidisiplin.

---

## 3 · IMPLEMENTERINGSPLAN

### Fase 0 — beslutninger som må låses først (eier)
- [ ] UI-fonten: beholde Inter, eller oppgradere til Geist/Satoshi?
- [ ] Gull-konsolidering: én `--strike`-gull, warn flyttes mot rød?
- [ ] Glødregelen: beholdes D15, eller frigis glød slik mocken bruker den?

### Fase 1 — DESIGN.md v3  (½ dag)
Skriv om med `sa-p3.css` som fargekilde: normaliser duplikater, navngi
de navnløse (cyan-linjen!), behold OKLCH + kontrastkommentarene som format.
Arvelisten inn uendret. Alle 12 seksjoner beholdes. **Port: linter 0/0.**

### Fase 2 — tokens og synk  (1 time)
Regenerer `app/tokens.css` mekanisk fra v3. Re-synk Claude Design-prosjektet
(`.design-sync/` vet hvordan). Oppdater `00-FELLES.md`-kortversjonen.

### Fase 3 — strømmene  (den store gevinsten)
**Reverseringen KRYMPER arbeidet:** mockkoden i `_source/mocks/` har alt
riktig utseende. A/B slutter å male om — jobben blir motorkobling + U-feilene
+ arvereglene (tallformat, hierarki, tilstander) oppå eksisterende look.
C: kun token-bytte. D/F: uberørt.
- [ ] Korreksjonsbrev v2 til A og B: «ommaling avlyst — mockens look ER
  fasit; koble motor og anvend arvereglene»
- [ ] C får ny tokens.css

### Fase 4 — bokføring  (½ time)
D14/D15/D19-kjeden markeres «parkert av D82» i DECISIONS.md (ikke slettet —
de dokumenterer et utforsket alternativ). STATUS.md oppdateres.

### Risiko
1. Tailwind-restene i mockfilene (F6-fargene) må IKKE tokeniseres inn.
2. `rgba(34,227,214)`-cyanen: finn dens jobb før den får navn.
3. Fontbytte (fase 0) endrer metrikk overalt — gjøres FØR fase 1 eller aldri.
