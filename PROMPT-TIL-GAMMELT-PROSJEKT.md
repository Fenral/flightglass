# Uttrekksoppdrag — Flightglass motor

Du jobber i den eksisterende Flightglass-kodebasen. Den skal **ikke** endres.
Oppdraget er å eksportere motorens oppførsel som data, slik at en ny kodebase
kan bygges og verifiseres mot den uten å arve gammel kode.

## Harde regler

1. **Ikke send kildekode.** Ingen filer, ingen moduler, ingen klasser. Kun data
   og formler skrevet ut som matematikk.
2. **Ikke rund av.** Alle tall skal ut med full float-presisjon
   (`JSON.stringify` på råverdien). Avrundet UI-tekst er ubrukelig som fixture.
3. **Ikke forklar, ikke anbefal, ikke rydd.** Beskriv det koden faktisk gjør,
   inkludert det du mener er feil. Hvis noe er en bug, skriv «dette er dagens
   oppførsel» og gjengi den — ikke fiks den.
4. **Ikke endre en eneste fil i kodebasen** utover å legge til frittstående
   eksportskript.
5. Alle leveranser skrives til en ny mappe `export/`.

---

## Leveranse A — `export/flight-golden.json`

Sveip den autoritative `solveFlight` (kilde: `impact-flight.js`,
`flightglass-3d-spin-model.js`) over inputrommet og skriv ut hvert
input/output-par.

**Rutenett 1 — full bredde (3125 caser):**

```
clubSpeed    : 30, 60, 90, 120, 150
faceAngle    : -15, -7.5, 0, 7.5, 15
clubPath     : -15, -7.5, 0, 7.5, 15
attackAngle  : -15, -7.5, 0, 7.5, 15
dynamicLoft  : 0, 12.5, 25, 37.5, 50
```

**Rutenett 2 — realistisk band (1875 caser):**

```
clubSpeed    : 70, 90, 110
faceAngle    : -3, -1, 0, 1, 3
clubPath     : -5, -2, 0, 2, 5
attackAngle  : -5, -2, 0, 2, 5
dynamicLoft  : 10, 18, 24, 32, 42
```

**Randtilfeller — legg til eksplisitt:**

- de fire dokumenterte golden casene fra spec §9;
- alle fem input på hver sin clamp-grense, en om gangen;
- `clubSpeed = 0`;
- `dynamicLoft = 0` med og uten attack;
- caser som treffer spin-taket `9000 rpm`;
- caser der RK4 går utenfor deklarert Reynolds `70000–210000` eller
  spin parameter `0.08–0.20`;
- caser der RK4 ikke når bakken innen 30 s, hvis slike finnes;
- caser der `inDomain` blir `false`.

**Format — én linje per case:**

```json
{
  "in": { "clubSpeed": 90, "faceAngle": 2, "clubPath": 0,
          "attackAngle": 3, "dynamicLoft": 24 },
  "out": {
    "startDirection": 0, "spinAxis": 0, "curve": 0, "offline": 0,
    "launchAngle": 0, "spinLoft": 0, "signedVerticalSpinLoft": 0,
    "backspin": 0, "signedBackspinRpm": 0, "landingAngle": 0,
    "smash": 0, "ballSpeed": 0, "carry": 0, "total": 0, "apex": 0,
    "inDomain": true, "hasFlight": true, "reason": null,
    "rk4Diagnostics": {}
  }
}
```

Ta med **alle** felt motoren faktisk returnerer, også interne. Hvis et felt
ikke finnes, utelat det — ikke finn på et navn.

Oppgi enheten hvert felt har **i motoren** (ikke i UI) i en `_meta`-blokk øverst.

---

## Leveranse B — `export/studio-golden.json`

Samme øvelse for treffgeometrimotoren (kilde: `swing-parameters-and-impact.js`).

```
swingPlane        : 30, 42.5, 55, 67.5, 80
swingDirection    : -12, -6, 0, 6, 12
ballPositionCm    : -20, -10, 0, 10, 20
arcHeightCm       : -5, -2.5, 0, 2.5, 5
clubMode          : "iron", "driver"
```

Pluss et finere band rundt standardtilstanden
(`plane 60 / direction 0 / ball 0 / arc 0`) med steg `±1` og `±3`.

Output per case skal inneholde alt motoren gir, minst:
`attackAngle`, `clubPath`, `lowPointX`, `lowPointZ`, `effectiveLowPointX`,
`thetaAtImpact`, `contactHeight`, `groundEntry`, `groundExit`, `strikeBand`,
`faceCentreOffsetMm`.

Marker driver-caser med `"validated": false` slik spec-en krever.

---

## Leveranse C — `export/ENGINE-GAPS.md`

Ni spørsmål. Svar på hvert med **den faktiske matematikken slik koden gjør
det**, skrevet som formel eller pseudokode — ikke som kopiert kildekode.

1. **RK4 startbetingelser.** Hvordan konstrueres hastighetsvektoren og
   omega-vektoren ved `t = 0` fra `ballSpeed`, `launchAngle`, `startDirection`,
   `spinAxis` og `totalSpinRpm`? Oppgi eksakt akserekkefølge, fortegn og
   enhetskonvertering.
2. **`hasFlight`.** Nøyaktig betingelse som setter den `true` eller `false`.
3. **`inDomain`.** Nøyaktig regelsett. Hvilke felt inngår, hvilke terskler?
4. **`reason`.** Hvilke strengverdier finnes? Full liste, og betingelsen for
   hver enkelt.
5. **`signedBackspinRpm`.** Hvilken akse projiseres spinnvektoren på, med
   hvilket fortegn?
6. **Curve under 1 m downrange.** Hva returneres når rå downrange er mindre
   enn `1 m`? Er det `0`, en fallback, eller uendret RK4-verdi?
7. **Studio kontakthøyde.** Full formel for køllehøyden ved ballen, utledet fra
   low point, radius, treffparameter og swing plane.
8. **Ground Entry / Exit.** Hvordan beregnes krysningspunktene med bakkeplanet?
9. **Face-centre offset.** Full formel, og hvilket fortegn som betyr høyt/lavt
   på slagflaten.

For hvert svar: oppgi filnavn og linjenummer som kilde, slik at det kan
etterprøves. **Ikke lim inn selve koden.**

---

## Leveranse D — `export/ask-catalog.json`

Eksporter hele Ask Flightglass-katalogen (kilde: `guide-knowledge.js`) som ren
data. Alle 28 spørsmål, full skjema per spørsmål:

```
id, topicId, prompt, tags, shortAnswer, bullets, truthTier,
boundary, nextAction, metricIds, lab, gapClass
```

Ta også med de seks tema-definisjonene og capability-registryet for
`metricIds`.

**Viktig:** eksporter katalogen slik den faktisk er, inkludert de fem
spørsmålene med ID-er den gamle rendereren ikke kan lese (`lowPoint`,
`contactHeight`, `entry`, `exit`, `altitude`, `temperature`, `windSpeed`,
`windDirection`). Ikke filtrer dem bort. Marker hvilke det gjelder i en egen
`_knownDebt`-liste.

---

## Leveranse E — `export/connections-graph.json`

Eksporter relasjonsgrafen (kilde: `connections-map.js`) som ren data.

- alle 23 noder med lag, ID og visningsnavn;
- **alle 36 kanter** med `from`, `to`, `type` (`direct` / `coupled` /
  `modeled`) og styrke (`primary` / `contributing` / `contextual` /
  `variable`);
- eventuelle forklaringspunkter knyttet til node eller kant.

Ta med kanten `Spin Loft → Landing Angle` selv om den er kjent semantisk gjeld.
Marker den i `_knownDebt`.

---

## Leveranse F — `export/VERIFY.md`

Kort kvitteringsfil:

1. Git commit-hash kodebasen ble eksportert fra.
2. Antall caser i A og B.
3. Resultat av å kjøre de eksisterende testfilene
   (`scripts/impact-flight-3d-spin.test.mjs`,
   `scripts/impact-flight-calculated-spin.test.mjs`,
   `scripts/impact-flight-domain-coherence.test.mjs`,
   `scripts/flightglass-3d-spin-model.test.mjs`,
   `scripts/academy-attack-at-impact-model.test.mjs`,
   `scripts/academy-plane-coupling-model.test.mjs`,
   `scripts/academy-contact-height-model.test.mjs`) — lim inn rå testoutput.
4. De fire golden casene fra spec §9, hentet ut av `flight-golden.json`, slik
   at de kan sammenlignes mot dokumentet.
5. Eventuelle avvik du oppdaget mellom spec-dokumentene og faktisk kode.
   **Ikke fiks dem. Bare rapporter dem.**

---

## Leveranse G — `export/assets/`

Kopier de tre skjermbildene README refererer til:
`ball-flight.png`, `impact-studio.png`, `d-plane.png`.
Oppgi SHA-256 for hver, så de kan sjekkes mot README-tabellen.

---

Når `export/` er komplett: zip mappen. Det er alt som skal over. Ingen kode.
