# DoD — autonom kjøring 2026-08-25, stopp 08:58

Fem faser. Hver fase har en **maskinell portest**. Ingen fase regnes som ferdig
uten at porten er kjørt og grønn. Delvis ferdig rapporteres som delvis, aldri som ferdig.

Statusfil: `LOOP-STATUS.json`. Hver iterasjon leser den, gjør neste udekkede punkt,
skriver tilbake. Den er sannheten om framdrift — ikke min hukommelse.

---

## Fase 1 — Køllegeometri  `[ ]`

Gjenoppta `wf_34bc65ac-122`. To søk ligger i cache.

- [ ] Alle 8 søkeområder fullført: regulatorisk, driver-face, driver-cg,
      wood-hybrid, iron-face, iron-cg, wedge-face, ball-spec.
- [ ] **Hver siterbar påstand kontrollert** — URL hentet opp, tall bekreftet til stede,
      sitat ordrett, riktig størrelse målt. 0 kontroller kjørte forrige gang.
- [ ] `KOLLEGEOMETRI.md` har en tabell med én rad per køllekategori:
      driver, 3-wood, hybrid, langt jern, mellomjern, kort jern, wedge.
- [ ] Kolonner: `faceHeightMm`, `sweetSpotHeightMm`, kilde-URL, konfidens.
- [ ] Arvetallene dømt: jern 21,3 mm og **driver 33,0 mm** — holder de?
      Patentavledning antyder 22–29 mm for driver. Avklares.
- [ ] Ballradius-inkonsistensen lukket: `0.021335` vs `0.0213`. Autoritativ verdi 21,335 mm.

**PORT 1:** `node -e` som leser KOLLEGEOMETRI.md og bekrefter at hver rad enten har
en hentbar URL eller er eksplisitt merket «antagelse». Ingen naken verdi.

---

## Fase 2 — Realismetabell (D0)  `[ ]`

- [ ] Trackman PGA Tour-snitt per kølle, kildeverifisert: club speed, attack angle,
      ball speed, smash, launch angle, spin rate, apex, land angle, carry.
- [ ] **LPGA Tour** samme.
- [ ] **Minst to amatørnivåer** — dette er de viktigste. Målgruppen er ikke touspillere.
- [ ] 7-jernets spinn (brukt som 7 124 rpm i D0-målingen) verifisert eller korrigert.
- [ ] `REALISME.md` med tabell, kilder og toleransebånd per utfall.
- [ ] Foreslåtte bånd bekreftet eller justert: launch ±0,5° · carry ±2 % · spinn ±8 %.

**PORT 2:** script som kjører `engine/src/solveFlight.js` mot hver rad i REALISME.md
og skriver ut avvik. Porten er grønn når scriptet kjører og produserer tabellen —
ikke når avvikene er små. Det er D1 sin jobb.

---

## Fase 3 — Opprydding baseline  `[ ]`

Fra `engine/BASELINE-FUNN.md`:

- [ ] **[16]** `solveFlight` sin andre parameter `flightOptions` fjernet.
      Signaturen er `solveFlight({clubSpeed, faceAngle, clubPath, attackAngle, dynamicLoft})`. Punktum.
- [ ] **[19]** `src/aeroCoefficients.js` — 427 linjer duplisert §5.7 som ingen
      produksjonssti importerer. Slettes, eller `rk4Integrator` importerer den.
      Én implementasjon. Ikke to.
- [ ] **[12]** NaN-lekkasje: `sin(swingPlane) === 0` og `zLP === 0` gir `c = 0/0`.
      Skal gi `null`, ikke NaN.
- [ ] **[15]** `solveStrikeBandIron` kaster RangeError på en case den kan håndtere.
- [ ] **[17]** Ny kastende validering i Studio-kjeden som baseline ikke har.
- [ ] **[21]** `spinMagnitude` sin ikke-baseline numeriske sti og to ubrukte input.
- [ ] **[20]** Presentasjonskonstanter i `constants.js` uten konsument.
- [ ] Driver-bandene fra funn [4] pinnet som test:
      `contactHeight < −0.025 → Duff`, `offset < −8 → Low`, `> +8 → High`, ellers `Pure`.

**PORT 3:** `npm test` grønn **og** `grep -rn "flightOptions" engine/src/` tom
**og** importgrafen har ingen foreldreløse moduler.

---

## Fase 4 — D1: RK4 eier lengden  `[ ]`

Den store. Endrer carry for hvert eneste slag, også jern. Sanksjonert av `01` §5.8
og D26 (virkeligheten slår fixturen).

- [ ] `carry`, `apex`, `landingAngle`, `total`, flytid fra RK4-integrasjonen.
- [ ] `carryBallSpeedFit` og `launchEfficiency = sqrt(launch/10)` ute av shipping-solve.
- [ ] Spinntaket `9000 → 13000` rpm i samme endring.
- [ ] `dragCompatibilityScale = 1.275116456035` fjernet eller eksplisitt køllemerket.
- [ ] `club: "7iron"` settes ikke lenger implisitt.
- [ ] Gammel fixtur beholdt som `v1-legacy`. Ny fixtur generert.
- [ ] Diff-rapport: hvilke utfall flyttet seg, hvor mye.

**PORT 4:** tre tester må passere samtidig:
1. Ved fast ballfart endrer ±1000 rpm carry med **> 1 m** (i dag: 12 mm).
2. Ingen case klamres på spinntaket innenfor køllekonvolutten.
3. **Realismeavvikene fra PORT 2 er mindre enn før.** Driver +19,5 % spinn skal ned.

---

## Fase 5 — Kontaktmodell  `[ ]`

- [ ] **D3:** `lieHeightMm` eksplisitt input, 0–45 mm. Erstatter hardkodet `lift`.
- [ ] **D17b:** lie og køllegeometri separert. `sweetSpotHeightMm` og `faceHeightMm`
      er køllens, `lieHeightMm` er ballens. `clubMode` slutter å bunte dem.
- [ ] Verdier fra fase 1, ikke fra hukommelse.
- [ ] **D3b:** underlaget synlig; `PURE` + `NO TURF CONTACT` forenet i én setning.
- [ ] **D4:** gear effect påslått for driver. Sentrert treff gir eksakt null bidrag.
- [ ] **D5:** én klassifiserer per kølle. `strikeQuality` som dobbeltklassifiserer slettet.
- [ ] **D24:** treffpunkt i to mål — absolutt mm og andel av `faceHeightMm`.

**PORT 5:** `faceCentreOffsetMm` kan aldri overskride `faceHeightMm / 2`
(i dag: 1 177 av 2 500 caser bryter det) **og** null uenighet mellom klassifiserere
(i dag: driver 82,3 %) **og** driver-fra-bakken er en uttrykkbar tilstand.

---

## Stoppregler

1. **Hard stopp 08:58** uansett hvor langt vi er kommet.
2. Tomt for tokens → vent 30 min, sjekk igjen.
3. En fase som feiler porten to ganger på rad → hopp over, marker `BLOCKED`,
   gå videre til neste. Ikke stå fast.
4. Rapporter alltid ærlig hvilke porter som faktisk kjørte.
