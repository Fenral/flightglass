# Oppdrag D — Motorintegrasjon og §11-verifikasjon

**Les `00-FELLES.md` først.** Uavhengig av A, B og C. Kan starte umiddelbart.

---

## Oppdraget, i brukerens egne ord

> «Hver modul kaller motoren, ingen regner selv.»

Det er spec §11 sitt portingkrav, og det er der gammel gjeld pleier å gjemme seg.

## Motoren

`engine/` — **465 tester, alle grønne.** Reproduserer den gamle motoren bit-eksakt:
flight 5029/5029, studio 2500/2500.

```
solveFlight.js    5 input → 81 utfall. Ren, deterministisk.
studioSolve.js    buegeometri → attack, path, low point, treff  (v2, produksjonssti)
deriveImpact.js   v1-baseline, pinnet. Ikke produksjonssti.
contactModel.js   lie og køllegeometri som uavhengige akser
strikeBand.js     én klassifiserer, tre akser, begge svar
aero-reference.js uavhengig §5.7-utledning, kun for differensialtest
```

**Kontrakten:** `solveFlight` tar nøyaktig fem tall og kaster på ikke-endelig
input. Ingen parsing, ingen koersjon, ingen andre parameter.

## De fem portingkravene fra spec §11

1. Én ren, deterministisk `solveFlight` eier **alle 13 flight-utfall**
2. **Ingen duplisert fysikk**
3. **Studio beregner ikke** spinn, carry eller ballflukt
4. Golden cases, nulltilstander, ugyldige tall og grenseverdier er testet
5. **Ingen renderer-konvertering, ingen skjult tilstand**

## Hva du skal gjøre

**Del 1 — verifiser at kravene holder i motoren i dag.**

### ⚠ Krav 2 har en felle, og den vil bite hvis du ikke leser dette

`aero-reference.js` **ER** en andre implementasjon av §5.7. Den ser ut som
akkurat den duplikatgjelden krav 2 forbyr.

**Den skal ikke slettes.** Den er en uavhengig utledning som brukes til
differensialtesting, og `test/aero-differential.test.js` håndhever at de to er
bit-identiske over 6 741 Reynolds × spinparameter-kombinasjoner. To uavhengige
utledninger som gir samme tall er et sterkere bevis enn én implementasjon testet
mot seg selv.

Feilen den ble omdøpt for å rette var at **formålet ikke sto skrevet noe sted**,
så den leste som slurv. Filhodet forklarer det nå.

**Det du skal sjekke er noe annet:** at ingen *produksjonssti* importerer den.
Bare testen skal gjøre det.

**Del 2 — bygg adapterlaget.**

Motoren regner i **yards og mph**. UI-et viser enheter brukeren valgte (D27).
Konverteringen skjer i **visningslaget**, aldri i fysikken.

Skriv adapteren, og test at:
- Konvertering skjer nøyaktig ett sted
- Motorens tall er urørt uansett enhetsvalg
- Avrundingsreglene fra `DESIGN.md` anvendes **etter** konvertering, ikke før

**Del 3 — en lint som fanger fremtidig gjeld.**

Et script som feiler hvis en UI-fil inneholder fysikk. Konkret: let etter
`Math.sin`, `Math.cos`, `Math.atan2`, `0.44704`, `0.9144`, `1.275116456035`
og lignende utenfor `engine/`.

Det er billig, og det er nøyaktig den lekkasjen prosjektet finnes for å hindre.

## Kjente feller

Fra `engine/README.md`, ti nummererte feller som **ikke skal fikses**:

- To ulike ballradier i den gamle motoren — `0.021335` og `0.0213`.
  Autoritativ verdi er **`0.021336`** (R&A: diameter 42,672 mm eksakt).
- `spinAxis` er en skalar tilt-vinkel og **kan ikke rekonstruere aksevektoren**.
  RK4 trenger `spinAxisUnit`. De 13 dokumenterte utfallene er utilstrekkelige.
- `extrapolated: true` er **normaltilstanden** — 87 % av realistiske slag.
  Ikke vis den som advarsel; den ville fyrt på nesten alt.
- Spinntaket 9000 rpm binder 18,5 % av casene.
- `curve` tvinges til 0 når `faceToPath === 0`. Verifisert redundant, men behold —
  som **assertion**, ikke maske.

## Ikke gjør

- Ikke endre fysikk. Enhver endring er en versjonert beslutning som skal opp.
- Ikke «rydd» en formel som ser rar ut. Sjekk `motor/FUNN.md` først — sannsynligvis
  er den rar med vilje, og grunnen står der.

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

1. Verifikasjonsrapport per §11-krav, med kommandoen som beviser det
2. Adapterlaget med tester
3. Lint-scriptet, kjørende i `npm test`
