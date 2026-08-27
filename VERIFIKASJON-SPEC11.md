# Verifikasjonsrapport — spec §11 portingkrav

Oppdrag D, 2026-08-25. Hvert krav har kommandoen som beviser det; alle er
kjørt mot motoren slik den står (465 tester grønne før og etter — denne
strømmen har ikke endret én linje i `engine/src/`).

Kjør alt på én gang fra rot:

```
npm test
```

Tre trinn: fysikklinten (0 funn), motorens 465 tester, adapterlagets 26 +
lintens 8 selvtester. Feiler ett trinn, feiler kommandoen.

---

## Krav 1 — Én ren, deterministisk `solveFlight` eier alle 13 flight-utfall

**HOLDER.**

```
node --input-type=module -e "
import { solveFlight } from './engine/src/solveFlight.js';
const f13 = ['startDirection','spinAxis','curve','offline','launchAngle','spinLoft','backspin','landingAngle','smash','ballSpeed','carry','total','apex'];
const shot = Object.freeze({ clubSpeed: 85, faceAngle: 0, clubPath: 0, attackAngle: -4.3, dynamicLoft: 20.9 });
const a = solveFlight(shot), b = solveFlight(shot);
console.log('mangler:', f13.filter(f => !(f in a) || !Number.isFinite(a[f])));
console.log('deterministisk:', JSON.stringify(a) === JSON.stringify(b));
"
```

Resultat: `mangler: []`, `deterministisk: true`, frosset input passerer uten
kast (ingen mutasjon). De 13 utfallene er spec §6-tabellens 13 motorfelt;
merk at `side` er motorfeltet `offline`. `faceToPath` ligger også i `out`,
så begge tellemåter (§6 sine 13, eller D42-fordelingens 5+8+1) er dekket av
samme kall. I tillegg: `test/integration.test.js` verifiserer alle 81
outputfelt bit-eksakt/1e-9 mot fixturen over 5028 caser, pluss egen
determinismetest (`determinisme: samme input gir bit-identisk output`).

Predikatene `hasFlight`/`inDomain`/`reason` eies av `outcomeAdapter.js` OVER
solveren — det er baseline-arkitekturen (ENGINE-GAPS §2–4), ikke et brudd:
de er avledninger av `solveFlight`-felt, ingen egen fysikk.

## Krav 2 — Ingen duplisert fysikk

**HOLDER, med to deklarerte og testhåndhevede unntak.**

```
grep -rn "aero-reference" engine/src/
```

Resultat: eneste treff i `engine/src/` er en prosakommentar i
`studioSolve.js`. Ingen produksjonssti importerer `aero-reference.js` —
kun `test/aero-differential.test.js` og `test/aero-reference.test.js`.

De to deklarerte parene:

1. **`aero-reference.js` ↔ `rk4Integrator.js`** — bevisst uavhengig
   §5.7-utledning for differensialtesting. `test/aero-differential.test.js`
   håndhever bit-identitet over > 6 000 Reynolds × spinparameter-
   kombinasjoner. Filhodet (lagt til etter BASELINE-FUNN [19]) dokumenterer
   formålet. **Ikke rørt, skal ikke røres.**
2. **`deriveImpact.js` (v1) ↔ `studioSolve.js` (v2)** — v1 er pinnet
   baseline, ikke produksjonssti. Eneste konsument er
   `test/integration.test.js`, som bruker den til å bevise at v2 ikke har
   endret geometri («attack og path er UENDRET fra v1»). Samme mønster:
   verifikasjonskopi, ikke duplikatgjeld.

Fremover håndheves kravet mekanisk: `tools/lint-physics.mjs` feiler
`npm test` hvis trigonometri eller motorkonstantene dukker opp utenfor
`engine/`.

## Krav 3 — Studio beregner ikke spinn, carry eller ballflukt

**HOLDER.**

```
grep -n -i "spin\|carry\|ballSpeed\|apex\|launch" engine/src/studioSolve.js engine/src/studioGeometry.js engine/src/studioContact.js engine/src/contactModel.js engine/src/strikeBand.js engine/src/strikeBandIron.js
```

Resultat: eneste treff er kommentaren i `studioGeometry.js` som SIER regelen
(«Studio beregner aldri spinn, carry eller ballflukt (spec §11.3)»).
Importgrafen bekrefter det: `studioSolve.js` importerer kun
`studioGeometry`, `studioContact`, `contactModel`, `strikeBand` — ingen
flight-modul. Testene `returobjektet har nøyaktig de seks feltene og ingen
presentasjonsdata` og `ingen presentasjonsdata i returobjektet` låser
returflatene.

## Krav 4 — Golden cases, nulltilstander, ugyldige tall og grenseverdier er testet

**HOLDER.**

```
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const doc = JSON.parse(readFileSync('motor/export/flight-golden.json','utf8'));
console.log([...new Set(doc.cases.map(c => c.id.split('.')[0]))]);
"
```

Resultat: fixturen har fire casegrupper — `grid`, `spec-9` (golden cases fra
spec §9), `declared-boundary` (grenseverdier) og `edge` (nulltilstander og
kanter) — og `test/integration.test.js` kjører alle 5028 gjennom
`solveFlight` feltvis. I tillegg, navngitte tester (kjør
`cd engine && npm test`):

| Kravdel | Test |
|---|---|
| Golden cases | `spec-9`-gruppen i integrasjonen, feltvis, toleranse 0/1e-9 |
| Nulltilstander | `edge.in-domain-false.*`, `hasFlight`-grensen (`carry > 0`, 382 caser med eksakt 0), `negativ clubSpeed kaster RangeError; 0 er lovlig` |
| Ugyldige tall | `ikke-endelige tall kaster TypeError (ingen koersjon)` — flight; `ikke-endelige tall og ukjent clubMode kaster TypeError` — studio |
| Grenseverdier | `declared-boundary`-gruppen; `de fem inputene klampes ikke (declaredInputBounds er UI-grenser)`; `RK4-timeouten kaster med fixturens ordrette melding` |

## Krav 5 — Ingen renderer-konvertering, ingen skjult tilstand

**HOLDER — og er nå mekanisk håndhevet.**

```
grep -n "^let \|^var \|Math\.random\|Date\.now\|new Date\|process\.\|node:fs\|node:path" engine/src/*.js
```

Resultat: null treff. Ingen modultilstand, ingen klokke, ingen tilfeldighet,
ingen I/O i noen fysikkmodul. Renhetstestene (`ren funksjon: samme input gir
identisk output, input urørt`) dekker begge solvere.

Konverteringssiden: motoren konverterer internt kun der spec §5 krever det
(f.eks. `targetCarryM` i §5.8) — det er fysikk, ikke rendering. Alt
visningsvendt bor nå i `adapter/`, og `tools/lint-physics.mjs` gjør kravet
selvhåndhevende: en fremtidig renderer som regner selv, feiler `npm test`
før den når en skjerm.

---

## Flagg — funnet under verifikasjonen, ikke rettet

1. **`_explore/orange/` inneholder banematematikk** i fem av seks døde
   HTML-skisser fra fargeutforskningen (`glasslag.html` har bl.a.
   `Math.atan(tan) * 180 / Math.PI` — en launch-vinkel regnet i UI).
   Eierbeslutning 2026-08-25: mappen er unntatt linten og skal IKKE slettes.
   Flagget her som avtalt. Skulle en skisse noen gang bli produktkode, må
   regnestykkene ut først — linten tar dem da automatisk, siden unntaket er
   stibasert.
2. **`STUDIO_RADIUS_M = 1.2` er hardkodet i `studioSolve.js`**, mens
   kodestilregelen i `engine/README.md` sier at numeriske konstanter kommer
   fra `constants.js`. Ingen fysikkfeil (verdien er testlåst 2500/2500), og
   ikke min strøm å rydde — kun notert.
3. **Lintens første ekte fangst — `app/ball-flight/adapter.local.js`.**
   Under sluttkjøringen dukket strøm A sin midlertidige lokale adapter opp,
   med egen `YARD_TO_METRE = 0.9144` — nøyaktig mønsteret linten finnes for.
   Fangsten er IKKE en feil hos A: filhodet deklarerer selv «SLETTES NÅR
   STRØM D LEVERER `adapter/` PÅ ROTNIVÅ (D58)», og det øyeblikket er nå.
   `npm test` sto med vilje RØD på rotnivå til byttet var gjort — linten
   ble ikke myket opp for å skjule kjent, tidsbegrenset gjeld. **LUKKET
   samme dag:** A migrerte (D58/D61/D63), og rot-`npm test` er GRØNN —
   fysikklint 0 funn, motor 465/465, adapter + lintselvtester 48/48.
   Uavhengig verifisert fra begge strømmer.

## Tillegg 2026-08-25 — lintpresisering og D61

Linten skiller nå tre kategorier (eierpresisering):

| Kat | Hva | Regel |
|---|---|---|
| 1 | Rekalkulering av et motorutfall | Brudd overalt utenfor `engine/` |
| 2 | Projeksjon/interpolasjon mellom motortall | Tillatt i `adapter/`, forbudt i `app/` |
| 3 | Ren skjermgeometri (px-avstander) | Alltid tillatt — `Math.hypot` er fjernet fra regellista |

**D61 er levert:** `adapter/src/traceShape.js` eier baneformen —
`topPoints` (kvadratisk lateralavvik som ender eksakt i `offline`) og
`heightPoints` (kubisk Bézier som treffer launch, apex, carry og landing
eksakt). Matematikk flyttet uendret fra strøm A sin `bf.js` (tekstdiff-
verifisert), med 10 kontraktstester i `adapter/test/traceShape.test.js`.

Migreringsstatus (D58/D61/D63), alle poster i `app/ball-flight/`:

- `adapter.local.*` (kat 1) — **LUKKET**: A har slettet filene og gått over
  til `adapter/src/{convert,format,displayFlight}.js` (D58). Verifisert.
- `bf.js` lokale traceShape-kopier (kat 2) — **LUKKET**: A importerer
  `adapter/src/traceShape.js` (D61). Verifisert.
- Launch-/retningsstrålene (kat 2) — **VEDTATT SOM D63**: strålene
  omklassifiseres ikke; dekomponering av en motorvinkel er kategori 2.
  Adapteren leverer `directionRay(deg)` (frossen `[sin, cos]`-enhetsvektor,
  bit-lik dagens uttrykk, 2 nye tester). App-koden ber om en stråle og får
  punkter — den ser aldri en vinkel. A bytter sine fire kallsteder.
- `bf.js` (`Math.hypot`, kat 3) — **passerer**, som presisert i D62.

## Tillegg — D79 `traceSamples` (vei B) og mock-ommalingen

- **`_source/` er unntatt linten** (D77: skrivebeskyttet fasit); kopiene i
  `app/` skannes fullt ut. To kat 3-unntak er sentralt allowlistet etter
  manuell verifikasjon (`impact-camera.js`: null motorfelt; `impact.html`:
  tre pilhode-linjer på skjermpunkter). Pragma-mekanisme ble avvist —
  unntak skal revideres ett sted.
- **D79 er levert som vei B** etter målt ULP-brudd i brøkkontrakten
  (410/4646 caser): `traceSamples(out, n)` gir (n+1) frosne `{lat, d, h}`
  i yards, endepunktene TILORDNET motorfeltene og Object.is-testet over
  samtlige 5028 fixture-caser. Indre punkter deler uttrykk med
  `topPoints`/`heightPoints` via interne hjelpere — de tre projeksjonene
  kan ikke avvike. Snap-regresjonstest for side ≈ 0-buen inkludert.
- Sluttstatus: fysikklint 0 funn / 43 filer · motor 465/465 ·
  adapter + selvtester 75/75.
