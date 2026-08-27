# Gear effect — kildeverifisert formelgrunnlag

Underlag for **D4** (`DOD-DRIVER.md` §D4) og for et eventuelt brudd på
`01-PHYSICS-AND-MECHANICS-ENGINE.md` **§10**, som i dag sier at gear effect
**ikke** er modellert.

Motoren setter `gearEffectApplied: false` og `centeredStrike: true` på alle
5 028 flight-caser (`engine/src/solveFlight.js:318–321`). Dette dokumentet
endrer ikke det. Det avgjør om det *kan* endres.

---

## ⛔ Hovedfunnet: D4 sin akseptansetest er fysisk usann

`DOD-DRIVER.md` §D4 krever:

> **Test:** sentrert treff gir eksakt null gear-bidrag.

**Den testen kan ikke passere mot noen av de tre uavhengige kildene i dette
dokumentet.** Kraften fra ballen virker motsatt ballens *utgangsretning*, ikke
normalt på slagflaten. Med loft betyr det at kraftlinjen passerer **under**
tyngdepunktet selv når ballen treffer nøyaktig på sweetspoten:

```
y = H − D · sin(a)        H = 0 (sentrert)  ⇒  y = −D·sin(a)  ≠  0
```

For en 11° driver med `D = 1.3"` og launch 9,7° gir det `y = −0.22"` og
**+825 rpm ekstra backspinn** på et perfekt sentrert treff.

> «A center strike will create vertical gear effect to increase the backspin.
> That is because the force passes below the CG and rotates the face downward.
> In fact, you have to strike almost 1/4" above center face just to be
> gear-effect neutral»
> — `https://www.tutelman.com/golf/ballflight/gearEffect2_.html`

Det gear-effect-nøytrale punktet ligger **≈ 5,6–6,4 mm over sweetspoten**, og
det **flytter seg** med launch angle og CG-dybde. Det er ikke en konstant.

**Konsekvens:** D4 må omformuleres før den kan lukkes. Testen «null ved
sentrert» må bli «lik den dokumenterte, ikke-null baseline ved sentrert» —
en truth-label, ikke et nullpunkt. Se §5.

---

## 0. Hva dette dokumentet dekker — og ikke

| | |
|---|---|
| Kildeområder i råmaterialet som nådde hit | **2 av 6** — `tutelman`, `akademisk` |
| Kildeområder som **ikke** lå i leveransen | patenter, Trackman, OEM-whitepapers, MyGolfSpy |
| URL-er hentet og HTTP-verifisert av meg | **15** (11 × 200 OK, 1 PDF 200 OK, 1 landingsside 200 OK, 2 × 403 bot-blokk) |
| Formler reprodusert numerisk av meg | **6** |
| Kildetabeller reprodusert eksakt av meg | **2** |

**Fravær av Trackman-, patent- og OEM-tall i dette dokumentet betyr ikke at de
ikke finnes.** Det betyr at de ikke er levert hit. Ikke behandle §3 som en
uttømmende «ikke publisert»-liste for de fire områdene som mangler.

### URL-status, målt 2026-08-25

| URL | HTTP | Bytes |
|---|---|---|
| `https://www.tutelman.com/golf/ballflight/gearEffect_.html` | 200 | 21 141 |
| `https://www.tutelman.com/golf/ballflight/gearEffect1_.html` | 200 | 27 323 |
| `https://www.tutelman.com/golf/ballflight/gearEffect2_.html` | 200 | 37 439 |
| `https://www.tutelman.com/golf/ballflight/gearEffect3_.html` | 200 | 20 541 |
| `https://www.tutelman.com/golf/ballflight/gearEffect4_.html` | 200 | 38 022 |
| `https://www.tutelman.com/golf/ballflight/gearEffect5_.html` | 200 | 34 151 |
| `https://www.tutelman.com/golf/ballflight/gearEffect/Appendix.php` | 200 | 41 948 |
| `https://www.tutelman.com/golf/clubs/centerOfGravity2_.html` | 200 | 22 317 |
| `https://www.tutelman.com/golf/clubs/centerOfGravity4_.html` | 200 | 29 402 |
| `https://www.tutelman.com/golf/design/swing2_.html` | 200 | 29 231 |
| `https://www.tutelman.com/golf/ballflight/3dlaunch2_.html` | 200 | 85 224 |
| `http://www.raypenner.com/golf-convex.pdf` | 200 | 112 579 |
| `https://uwspace.uwaterloo.ca/items/5f76365e-4896-4472-907c-3380d9cb7de7` | 200 | 4 766 |
| `https://www.mdpi.com/2504-3900/49/1/2/pdf` | **403** | bot-blokk, ikke død lenke |
| `https://www.mdpi.com/2504-3900/2/6/245` | **403** | bot-blokk, ikke død lenke |

⚠ **URL-fellen:** Tutelman-sidene krever **understrek** før `.html`.
`gearEffect1.html` gir 404. `gearEffect1_.html` gir 200. Ikke fjern understreken.

⚠ **MDPI-blokken:** de to MDPI-URL-ene svarer 403 på maskinhenting (Cloudflare),
også via DOI-resolver. De ble hentet av forskningsagenten og sitatene er gjengitt,
men **jeg har ikke selv kunnet verifisere sitatene mot råkilde.** Alt fra MDPI er
merket `2. hånd` i tabellene under. Formelen derfra er derimot **numerisk
etterprøvd** — se §1.4.

---

## 1. Formlene

### 1.1 Grunnligningen — felles for begge akser

Rotasjons-impuls. Ballen får bevegelsesmengde `m·Vb` fra kraftimpulsen; samme
impuls gir køllehodet et dreiemoment om tyngdepunktet med arm `x`. Hodet roterer
med `ω`, flatens overflate ved tyngdepunktsarmen `C` beveger seg med `ω·C`, og
ballen «girer» mot den.

```
I·ω = x · m · Vb          →      ω = x·m·Vb / I
v   = ω·C
s   = 60·v / (π·d_ball)   →      s = 444 · ω · C           [444 = 60/(π·0.043 m)]
```

Med ballmassen 0,046 kg innbakt:

**Ligning 1 (MKS):**
```
s = 20.4 · Vb · C · x / I
```
| Symbol | Betydning | Enhet |
|---|---|---|
| `s` | spinn fra gear effect | rpm |
| `Vb` | ballfart | **m/s** |
| `C` | CG-dybde langs kraftlinjen, fra **midt på slagflaten** | **meter** |
| `x` | avstand fra kraftlinjen til CG, vinkelrett | **meter** |
| `I` | køllehodets treghetsmoment om aktuell akse | **kg·m²** |
| `20.4` | `= 444 × 0.046` — ballomkrets og ballmasse | — |

Kilde: `https://www.tutelman.com/golf/ballflight/gearEffect1_.html`
> «Since the golf ball's mass is within a fraction of a gram of 46g
> (or 0.046Kg): s = 20.4 Vb C x / Ih»

⚠ **Ligning 1 er IKKE den formen motoren skal implementere.** Enhetene er MKS.
Bruk ligning 2/3 under.

---

### 1.2 Horisontal gear effect — bulge-aksen

**Ligning 2 — klubbmakerenheter. Dette er formen motoren skal implementere.**

```
s = 58,830 · Vb · C · x / Ih
```

| Symbol | Betydning | Enhet | Fortegn |
|---|---|---|---|
| `s` | sidespinn fra gear effect | **rpm** | `+` = hook-spinn (RH) |
| `Vb` | ballfart | **mph** | |
| `C` | CG-dybde langs kraftlinjen, fra **midt på flaten** | **tommer** | alltid `+` |
| `x` | horisontal avstand fra kraftlinje til CG | **tommer** | `+` = mot toe |
| `Ih` | MOI for **horisontal** gear effect | **g·cm²** | |
| `58,830` | `= 20.4 × 0.447 / 0.0254² / 1e-7` — ren enhetsomregning | — | |

Kilde: `https://www.tutelman.com/golf/ballflight/gearEffect1_.html`
> «s = 20.4 * .447 Vb .0254 C * .0254 x 10-7 Ih = 58,830 Vb C x / Ih (Equation 2)»

**Jeg reproduserte konstanten uavhengig:**
`20.4 × 0.447 × 0.0254² / 1e-7 = 58 830,85` → sidens `58,830`. ✔

⚠ **Navnefelle som vil ødelegge fortegnet hvis den bommes:** `Ih` er MOI om den
**vertikale** aksen gjennom CG. Subskriptet `h` betegner at *effekten* er
horisontal, ikke at aksen er det. USGA-grensen på 5 900 g·cm² er nettopp denne
aksen. Mates et publisert «vertikalakse-MOI» inn i `Iv`, blir hele modellen
bakvendt.

**Korreksjonen (obligatorisk):** `x` er ikke treffpunktet. Kraftlinjen følger
ballens utgangsretning:

```
x_eff = x_miss − C · sin(HorLaunchAngle)
```
Kilde: `https://www.tutelman.com/golf/ballflight/gearEffect/Appendix.php`
> «Compute y from miss and horizontal launch angle: y=miss-Csin(HorLaunchAngle)
> (See section on vertical gear effect for rationale) Then equation 2a to get the spin.»

**Forenklet driverform (Ligning 2a):**
```
s = 16.4 · Vb · x_eff       [Ih = 5100 g·cm², C = 1.42"]
   = 0.6457 · Vb[mph] · x_eff[mm]     ← min enhetskonvertering, 16.4/25.4
```
Kilde: samme side.
> «Let's try Ih=5100 and CG depth=42mm. C is 14% less than CG depth, so
> C=36mm=1.42inches. … s = 58,830 Vb 1.42 x / 5100 = 16.4 Vb x (Equation 2a)»

Hvorfor én koeffisient holder på tvers av drivere: `Ih` og `C` samvarierer.
`Ih/C`-forholdet har snitt **121** og standardavvik **3,18 = 2,5 %**, mot 10 %
og 9,4 % for `Ih` og CG-dybde hver for seg. Trendlinje R² = 0,92.
⚠ **2,5 % er spredning mellom 17 drivere fra 2008/2009 — ikke modellens
treffsikkerhet mot målt spinn.** Ikke legg 2,5 % inn som feilmargin.

---

### 1.3 Vertikal gear effect — roll-aksen

**Ligning 3 — identisk med ligning 2, med `Iv` og `y`:**

```
s = 58,830 · Vb · C · y / Iv
```
| Symbol | Betydning | Enhet | Fortegn |
|---|---|---|---|
| `y` | vertikal avstand fra kraftlinje til CG | **tommer** | `+` over CG |
| `Iv` | MOI for **vertikal** gear effect (hæl–tå-aksen, pitch) | **g·cm²** | |
| `s` | `+` = topspinn = **mindre** backspinn | rpm | |

Kilde: `https://www.tutelman.com/golf/ballflight/gearEffect2_.html`
> «The only thing that is different is the moment of inertia; it is Iv instead
> of Ih. Well, we should probably change the horizontal miss distance x to a
> vertical miss y.»

⚠ **Enhetene står ikke på denne siden.** De arves fra `gearEffect1_.html` ved
symbolbytte. **Begge URL-er må siteres** i fixturen — én for formelen, én for
enhetssystemet.

**Korreksjonen (obligatorisk — dette er hele §hovedfunnet):**
```
C = D · cos(a)
y = H − D · sin(a)
```
| Symbol | Betydning | Enhet |
|---|---|---|
| `D` | CG-dybde fra **midt på flaten**, vinkelrett | tommer |
| `H` | treffhøyde over **midt på flaten** | tommer |
| `a` | launch angle | grader |

Kilde: `https://www.tutelman.com/golf/ballflight/gearEffect2_.html`
> «A more accurate picture would have the force exactly opposite the departure
> direction of the ball -- the launch angle … This will make a very small
> difference in C and a much larger difference in y … C = D cos a  y = H - D sin a»

**Forenklet driverform (Ligning 3a):**
```
s = 25 · Vb · y            = 0.9843 · Vb[mph] · y[mm]   ← min konvertering, 25/25.4
```

⚠ **Koeffisienten 25 er en eksplisitt GJETNING, ikke en måling.** Den kommer fra
antakelsen at `C/Iv` er like konstant som `C/Ih`, med `Iv ≈ ⅔ Ih` ⇒ `1,5 × 16,4 = 24,6 ≈ 25`.
Tutelmans eget beste fit mot måledata er **23,5** (med `C = 1,0"`), ikke 25. Han
beholdt 25 fordi det var «plenty close enough». **Arbeidsspenn: 23,5–25.**

---

### 1.4 Startretningsendringen fra bulge

To uavhengige bidrag som **legger seg sammen**, ikke motvirker hverandre.

**(a) Geometrisk — bulgekurven vipper flaten:**
```
horisontal «loft»    = arctan(x_miss / R_bulge)
horisontal launch    = 0.875 × horisontal «loft»
```
Kilde: `https://www.tutelman.com/golf/ballflight/gearEffect/Appendix.php`
> «Horizontal "loft" | Trig: arctan (miss/radius)»

Tabellen for 12" bulge: ¼"→1,2°/1,1° · ½"→2,4°/2,1° · 1"→4,8°/4,2° · 1½"→7,1°/6,2°.
Faktoren `0.875` er baklengsregnet av meg fra de tre siste radene (0,875 / 0,875 / 0,873).

**Per millimeter, 12" bulge:** `57.3/304.8 × 0.875 = 0.1645 °/mm`.

**(b) Hoderotasjon under kontakt** — samme rotasjon som lager gear-spinnet:
```
Δ launch = 32.7 · Vb · x / Ih        [grader; Vb mph, x tommer, Ih g·cm²]
```
Kilde: `https://www.tutelman.com/golf/ballflight/gearEffect5_.html`
> «Correction to increase launch angle due to clubhead rotation (degrees):
> 32.7 Vb y / Iv … This is half the backward velocity of the face at release.»

**Uavhengig kryssjekk fra akademisk hold** — Lambeth et al. (putter, flat flate,
ingen bulge, altså ren hoderotasjon):
```
φ = arctan( r_cx · r_cy / (r_cy² + 0.079 · I_cz) )
```
| Symbol | Betydning | Enhet |
|---|---|---|
| `r_cx` | hæl–tå-avstand CG → treffpunkt | mm |
| `r_cy` | CG-dybde | mm |
| `I_cz` | hæl–tå MOI | **g·mm²** (`= g·cm² × 100`) |
| `0.079` | ≈ 1/12,7 g⁻¹ | 1/g |

Kilde: `https://www.mdpi.com/2504-3900/49/1/2/pdf` **(403 for meg — 2. hånd)**
> «The launch direction is then: φ = tan⁻¹(r_cx r_cy / (r_cy² + 0.079 I_cz))»

**Jeg etterprøvde formelen numerisk mot artikkelens egne simulerte verdier:**

| Konfig | `r_cx` | `r_cy` | `I_cz` | Min utregning | Artikkelens tall |
|---|---|---|---|---|---|
| A | 15 mm | 11,2 mm | 3 997 g·cm² | **0,3036°** | 0,30° ✔ |
| B | 15 mm | 25,2 mm | 4 790 g·cm² | **0,5628°** | 0,56° ✔ |

Formelen og enhetskonvensjonen er dermed bekreftet uavhengig av at URL-en
er bot-blokkert. **Selve måletallene fra artikkelen er ikke verifisert.**

---

### 1.5 Støtteformler modellen forutsetter

| Hva | Formel | Enheter | Kilde |
|---|---|---|---|
| Loft → launch | `LaunchAngle = Loft · (0.96 − 0.0071·Loft)` | grader | `https://www.tutelman.com/golf/design/swing2_.html` |
| Backspinn fra loft | `Spin = 160 · Vclub · sin(loft)` | rpm, mph, ° | `https://www.tutelman.com/golf/design/swing2_.html` |
| Ballfart | `Vball = Vclub · (1+e)/(1+m/M) · cos(loft)` | mph | `https://www.tutelman.com/golf/design/swing2_.html` |
| Ballfartstap, off-centre | `Δ = 98 · Vb · y² / Iv` | mph | `https://www.tutelman.com/golf/ballflight/gearEffect5_.html` |
| Rollradius ↔ loftprogresjon | `R = 57.3 · ΔH/ΔL` · `L = L₀ + 57.3·(H−H₀)/R` | tommer, ° | `https://www.tutelman.com/golf/ballflight/gearEffect5_.html` |
| Spinnakse-dekomponering | `Sy = S·cos σ`, `Sx = S·sin σ` | rpm | `https://www.tutelman.com/golf/design/swing2_.html` |
| Kontakttid / snittkraft | `t = 0.5 ms`, `P = 92·Vb` N (Vb i m/s) | — | `https://www.tutelman.com/golf/ballflight/gearEffect/Appendix.php` |
| COR(fart), akademisk | `e = 0.86 − 0.0029·v_ci·cos θ` | v i m/s | `http://www.raypenner.com/golf-convex.pdf` |
| Skaftbøy → dynamisk loft | `ΔLoft = 1.5° × momentarm[tommer]` | ° | `https://www.tutelman.com/golf/clubs/centerOfGravity4_.html` |

**Full 2D-modell (2013)** — mest komplette implementerbare form, kombinerer
CG-plassering `[X,Z]`, treffhøyde `h`, rollradius `R` og skaftbøy:
```
Li = L₀ + arcsin(h/R) + 1.5·(X−F)
A  = Li·(0.96 − 0.0071·Li)
m  = tan(A)
s  = (m/(m²+1))·(j + m·i − Z + X/m)
t  = m·(i−s) + j
y  = (t−Z)/cos(A)
C² = (s−i)² + (t−j)²
SPIN_GE   = 58830 · Vball · C · y / Iv
SPIN_loft = 160 · Vclub · sin(Li)
SPIN      = SPIN_loft − SPIN_GE
```
Kilde: `https://www.tutelman.com/golf/clubs/centerOfGravity4_.html`

---

### 1.6 Utledning eller måling?

| Ledd | Status | Begrunnelse |
|---|---|---|
| Ligning 1 / 2 / 3 | **Utledning** | Ren impuls-/dreieimpulsmekanikk. Null frie parametere, null fittede konstanter. `444` er ballomkretsen, `0.046` er ballmassen, `58,830` er enhetsomregning. |
| `y = H − D·sin(a)` | **Utledning** | Geometri: kraftlinjen følger ballens utgangsretning. |
| Koeffisient **16.4** | **Utledning + målte parametere** | Formelen er utledet; `Ih = 5100`, `C = 1.42"` er fra 17 målte drivere (Alba, 2008/09). |
| Koeffisient **25** | **Gjetning** | `Iv` er aldri målt. 25 = `1,5 × 16,4`, antatt fra `Iv ≈ ⅔ Ih`. Beste fit mot data er 23,5. |
| `Iv ≈ 2950–3000 g·cm²` | **Beregnet, ikke målt** | Oblat sfæroide-skallmodell, 4,6" × 2,5", 454 cc, 200 g. **Modellens svakeste ledd.** |
| Bulge/roll-radier | **Katalogverdier** | Ikke målt av forfatteren. |
| Hotstix-tabellen (§4.3) | **Måling** | Robot, publisert i Golf Magazine feb. 2009. **Eneste truth-data i hele materialet.** |
| Lambeth-tallene | **Måling + simulering** | Putter, 3,6 mph. Ikke driver. **2. hånd — URL 403 for meg.** |

**Ingen av formlene er kalibrert mot spinn-måledata.** Ligning 3a ble
*sammenlignet* med Hotstix i etterkant, og koeffisienten ble beholdt uendret.

---

## 2. Konstantene

### 2.1 Driver — der det finnes tall

| Størrelse | Verdi | Konfidens | Kilde-URL |
|---|---|---|---|
| **Bulge-radius** | **12"** (305 mm) default · spenn **10–13"** (254–330 mm), nest vanligst 10" | Katalog, ikke målt | `https://www.tutelman.com/golf/ballflight/gearEffect1_.html` |
| **Roll-radius** | **12"** default · spenn **10–14"** (254–356 mm) | Katalog, ikke målt | `https://www.tutelman.com/golf/clubs/centerOfGravity4_.html` |
| **Roll, optimalt** | ≈ **8"**, «almost certainly between 8" and 12"» | Beregnet optimering | `https://www.tutelman.com/golf/ballflight/gearEffect5_.html` |
| **Bulge, optimalt** | **21,5 cm = 8,46"** (200 g, 250 cc, 10,5°, 45 m/s, treff 2,0 cm) | Beregnet optimering | `http://www.raypenner.com/golf-convex.pdf` |
| **Bulge, empirisk optimalt** | **20,3–27,9 cm = 8–11"** (Maltby, mekanisk golfer) | Målt, 2. hånd via Penner | `http://www.raypenner.com/golf-convex.pdf` |
| **Bulge = roll?** | I praksis omtrent like på ekte drivere; Tutelman **antar** roll = bulge = 12" i gear effect-artikkelen | Antakelse | `https://www.tutelman.com/golf/ballflight/gearEffect1_.html` |
| **CG-dybde `D`, fra flatemidt** | **1,3"** (33 mm) standard · **1,1"** best fit mot Hotstix · Tutelmans 4 egne hoder: 1,2–1,3" | Målt | `https://www.tutelman.com/golf/ballflight/gearEffect1_.html` |
| **CG-dybde, fra forkant** (Alba, 17 hoder) | **32–47 mm**, snitt **37,7 mm** | Målt, n=17, 2008/09 | `https://www.tutelman.com/golf/ballflight/gearEffect/Appendix.php` |
| **CG-dybde, akademisk skallmodell** | **40,4 mm** (`L/cos θ`, L=3,97 cm, θ=10,5°, 250 cc) | Modellert, 2001 | `http://www.raypenner.com/golf-convex.pdf` |
| **`Ih`** (horisontal gear effect) | **3 870–5 867 g·cm²**, snitt **4 575** (σ = 462 = 10 %), n=17 | Målt | `https://www.tutelman.com/golf/ballflight/gearEffect/Appendix.php` |
| **`Ih`, arbeidsverdi** | **5 100 g·cm²** (punkt på trendlinjen, med C = 1,42") | Valgt | `https://www.tutelman.com/golf/ballflight/gearEffect1_.html` |
| **`Ih`, USGA-grense** | **5 900 g·cm²** | Regelverk | `https://uwspace.uwaterloo.ca/items/5f76365e-4896-4472-907c-3380d9cb7de7` |
| **`Iv`** | **2 950 g·cm²** beregnet · arbeidsverdi ≈ **3 000** | ⚠ **Beregnet, aldri målt** | `https://www.tutelman.com/golf/ballflight/gearEffect2_.html` |
| **`Iv/Ih`** | **0,50–0,66** ⇒ vertikal gear effect er **1,5–2 ×** horisontal per mm | Anslag | `https://www.tutelman.com/golf/ballflight/gearEffect_.html` |
| **`Ih/C`-forhold** | snitt **121**, σ **3,18 = 2,5 %**, R² = 0,92 | Målt, n=17 | `https://www.tutelman.com/golf/ballflight/gearEffect1_.html` |
| **Hodemasse** | **200 g** | Målt/typisk | `https://www.tutelman.com/golf/ballflight/3dlaunch2_.html` |
| **COR** | **0,83** (USGA-max) | Regelverk | `https://www.tutelman.com/golf/ballflight/3dlaunch2_.html` |
| **`F`** (flatemidt → skaftsenterlinje) | **0,7"** | Default | `https://www.tutelman.com/golf/clubs/centerOfGravity2_.html` |
| **CG `[X,Z]`** (2013-modell) | `[1,3" bak flatemidt, −0,2" under]` | Default | `https://www.tutelman.com/golf/clubs/centerOfGravity2_.html` |

⚠ **`C` ≠ katalogens «CG depth».** OEM- og Alba-tall måles fra **forkanten**.
`C` måles fra **midt på flaten**. Ved driverloft er katalogtallet **~14 % større**.
Mates katalogverdien rett inn som `C`, overestimeres gear effect med ~14 %.
> «At driver lofts, the Alba measurements will be about 14% greater than C,
> which is measured from the middle of the face.»
> — `https://www.tutelman.com/golf/ballflight/gearEffect1_.html`

### 2.2 Ballen

| Størrelse | Verdi | Kilde-URL |
|---|---|---|
| Masse | **46 g** (0,046 kg) | `https://www.tutelman.com/golf/ballflight/3dlaunch2_.html` |
| Radius | **21,3 mm** (0,84"), diameter 1,68" | `https://www.tutelman.com/golf/ballflight/3dlaunch2_.html` |
| Masse (akademisk) | **45,9 g** (USGA-maks) | `http://www.raypenner.com/golf-convex.pdf` |
| Radius (akademisk) | **21,35 mm** (USGA-min diameter 4,27 cm) | `http://www.raypenner.com/golf-convex.pdf` |
| MOI, uniform kule | **83,7 g·cm²** (= `0.4·m·r²`) · målt spenn ekte baller **72,8–81,3** | `http://www.raypenner.com/golf-convex.pdf` |

Motorens `ballRadiusM = 0.021336` (`engine/src/contactModel.js`) er konsistent
med begge kildene.

### 2.3 Per driver-modell — rådata som kan brukes som per-hode truth

17 drivere, Alba magazine 2008/2009. Utdrag:

| Hode | CG-dybde (forkant) | `Ih` |
|---|---|---|
| Titleist 909D2 | 39,1 mm | 4 779 g·cm² |
| TaylorMade Tour Burner | 40,0 mm | 4 821 g·cm² |
| Nike Sasquatch Sumo² 5900 | 47,0 mm | 5 867 g·cm² |
| Srixon ZR-30 | 32,2 mm | 3 870 g·cm² |
| Ping Rapture V2 | 38,0 mm | 4 478 g·cm² |

Kilde: `https://www.tutelman.com/golf/ballflight/gearEffect/Appendix.php`

⚠ **Datasettet er fra 2008/2009.** 2026-drivere har systematisk høyere MOI og
ofte grunnere CG. `Ih/C = 121` er ikke uten videre gyldig i dag.

### 2.4 Andre køllekategorier

| Kategori | Bulge | Roll | `C` / `D` | `Ih` | `Iv` |
|---|---|---|---|---|---|
| Fairway wood | **ikke publisert** | **ikke publisert** | **ikke publisert** | **ikke publisert** | **ikke publisert** |
| Hybrid | **ikke publisert** | **ikke publisert** | **ikke publisert** | **ikke publisert** | **ikke publisert** |
| Jern (alle) | **ikke publisert** | **ikke publisert** | **ikke publisert** | **ikke publisert** | **ikke publisert** |

Dette er et **eksplisitt negativt funn**, ikke et hull i søket:

> «In real terms, the optimum roll is almost certainly between 8" and 12".
> **For drivers!** Hybrids or even fairway woods might be quite different,
> because their MOI and depth of CG are quite different.»
> — `https://www.tutelman.com/golf/ballflight/gearEffect5_.html`

For jern finnes **kun kvalitativ retning**, ingen tall:

> «The CG of an iron head isn't in the face; it is slightly behind the face. …
> iron heads are being designed with the CG further and further back … So
> today's irons have more gear effect than 20 years ago, but not nearly as
> much as drivers.»
> — `https://www.tutelman.com/golf/design/swing2_.html`

Til sammenligning har `contactModel.js` allerede `sweetSpotHeightMm` og
`faceHeightMm` for syv kategorier. **Gear effect kan ikke følge etter for mer
enn én av dem.**

### 2.5 Skaleringslover — retning uten tall

| Utsagn | Kilde-URL |
|---|---|
| Gear effect er **direkte proporsjonal** med anslagshastigheten; bulge-korreksjonen er hastighets**uavhengig** (rent geometrisk) | `http://www.raypenner.com/golf-convex.pdf` |
| Økt hodemasse eller volum → økt MOI → **mindre** gear effect → krever større faceradius | `http://www.raypenner.com/golf-convex.pdf` |
| Optimal bulgeradius med volum: 18,4 cm @150 cc → 22,6 cm @300 cc | `http://www.raypenner.com/golf-convex.pdf` |
| Optimal bulgeradius med masse: 16,2 cm @150 g → 23,0 cm @300 g | `http://www.raypenner.com/golf-convex.pdf` |
| Optimal bulgeradius med fart: 29,5 cm @30 m/s → 19,6 cm @60 m/s | `http://www.raypenner.com/golf-convex.pdf` |
| Høyere vertikalt MOI **og grunnere** CG-dybde → mindre sidespinn; men grunnere CG → **mer** backspinn. CG-dybde driver de to aksene motsatt vei. | `https://uwspace.uwaterloo.ca/items/5f76365e-4896-4472-907c-3380d9cb7de7` |
| Dypere CG gir **mer** startretningsavvik selv med høyere MOI (putterstudie) | `https://www.mdpi.com/2504-3900/49/1/2/pdf` (2. hånd) |

---

## 3. Hva som ikke er publisert

Eksplisitt liste. Hver post er et hull motoren **ikke** kan fylle med et tall.

| # | Manglende størrelse | Konsekvens for Flight Glass |
|---|---|---|
| 1 | **`Iv` er aldri målt av noen.** Tutelman estimerer den fra en oblat sfæroide-skallmodell. Han skriver selv at `Iv` og `C` er det mest suspekte ved modellen. | Hele den vertikale aksen hviler på et beregnet tall. Koeffisienten 25 arver usikkerheten. |
| 2 | **Bulge- og rollradier for fairway wood, hybrid og jern.** | Gear effect kan **kun** slås på for driver. Seks av syv kategorier i `CLUB_GEOMETRY` er uten dekning. |
| 3 | **`C`, `Ih`, `Iv` for fairway wood, hybrid og jern.** | Samme. Ingen skalering finnes å ekstrapolere langs. |
| 4 | **Gjennomsnittlig CG-dybde per køllenummer for jern.** Kun «slightly behind the face». | Ingen tallverdi å implementere. |
| 5 | **Gir-effektivitet / slippfaktor.** Alle modeller antar **perfekt gearing** — ballens overflatehastighet settes lik flatens `ω·C`, uten friksjonsgrense. | Systematisk **overestimering**. Ingen publisert korreksjonsfaktor. |
| 6 | **Fri-kropp-korreksjonen som tall.** Skaftet motstår hoderotasjon. Kun grenser finnes: horisontalt ≈ 1 % (neglisjerbart), vertikalt **maks 14 %**, «probably somewhat less and definitely not more». | Modellen ligger et sted 0–14 % for høyt vertikalt. Ingen kilde tallfester det. |
| 7 | **Moderne (2020-talls) `Ih`/CG-datasett.** Alba er 2008/2009. | `Ih/C = 121` kan være foreldet. |
| 8 | **Horisontal truth-data med registrert treffpunkt.** Hotstix-settet er **kun vertikalt**. | Den horisontale aksen har **null** måledata å valideres mot. Se §5. |
| 9 | **COR-fall over slagflaten som formel.** Kun «under 0,02 COR i første halvtomme» (Wishon, 2007), sitert 2. hånd. | Off-centre ballfartstap kan ikke modelleres komplett. |
| 10 | **Konsensus om gear effect-størrelsen.** Wishon: 300–500 rpm totalt. Upshaw: 3 300 rpm over 2". Tutelman ≈ 60 % over Upshaw. | **Faktor 4–5 uenighet mellom publiserte praktikere.** Ingen kilde avgjør. |

**Internt sprikende tall i samme kildeverk:** kontakttiden er 0,5 ms i
gear effect-artikkelen (2009) og 0,4 ms i CG-artikkelen (2013). Tutelman
harmoniserer dem ikke.

---

## 4. Sanity-sjekk

Alle utregninger under er gjort av meg og etterprøvd mot kildenes egne tabeller.

**Felles forutsetninger** (Tutelmans egne standardverdier for driver):
`Vb = 150 mph` · `Vclub ≈ 101 mph` · `loft 11°` · `D = C = 1,3"` ·
`Ih = 5 100 g·cm²` · `Iv = 3 000 g·cm²` · `bulge = roll = 12"` ·
`1 mm = 0,0393701"`

---

### 4.1 Horisontalt: 10 mm mot toe

**Steg 1 — bulge vipper flaten:**
```
x_miss           = 10 mm = 0.393701"
horisontal loft  = arctan(0.393701 / 12) = arctan(0.0328084) = 1.8791°
horisontal launch = 0.875 × 1.8791                            = 1.6442°
```

**Steg 2 — korriger `x` til kraftlinjen:**
```
x_eff = 0.393701 − 1.3 × sin(1.6442°)
      = 0.393701 − 1.3 × 0.028696
      = 0.393701 − 0.037305
      = 0.356396"
```

**Steg 3 — gear effect-spinn (Ligning 2a):**
```
s_gear = 16.4 × 150 × 0.356396 = 876.7 rpm hook
```

**Steg 4 — bulgens motvirkende slice-spinn:**
```
s_bulge = 160 × Vclub × sin(1.8791°)
        = 160 × 100.9 × 0.032790
        = 529.4 rpm slice
```

**Steg 5 — netto:**
```
netto = 876.7 − 529.4 = 347 rpm hook-spinn (draw)
```

**Steg 6 — spinnakse:**
```
σ = arctan(347 / 3960) = arctan(0.08763) = 5.0° venstre
```

**Steg 7 — startretning:**
```
bulge-geometri:  +1.64° høyre
hoderotasjon:    32.7 × 150 × 0.3937 / 5100 = +0.38° høyre
                 (Lambeth-kryssjekk, D=33 mm, Ih=4600: +0.51°)
totalt:          ≈ +2.0 til +2.15° høyre
```

**Ballfartstap fra samme rotasjon:**
`98 × 150 × 0.3937² / 5100 = 0.45 mph` (0,3 %). COR-fall kommer i tillegg.

#### Verifisering mot kildens egen tabell

Jeg reproduserte **hele** «sanity test»-tabellen på `gearEffect1_.html` med
Ligning 2a **pluss** den horisontale korreksjonen:

| Bom | `x_eff` | Min utregning | Kildens tall | Avvik |
|---|---|---|---|---|
| ¼" | 0,22504" | **553,6 rpm** | 553 | **0,1 %** ✔ |
| ½" | 0,45237" | **1 112,8 rpm** | 1 113 | **0,0 %** ✔ |
| 1" | 0,90480" | 2 226 rpm | 2 192 | 1,6 % |
| 1½" | 1,35960" | 3 345 rpm | 3 294 | 1,5 % |

To av fire rader treffer **eksakt**. Restavviket på de to store bommene
forsvinner nesten helt når ballfartstapet `98·Vb·x²/Ih` regnes inn (1" gir da
2 183 mot 2 192 = 0,4 %).

> ⚠ **Korreksjon av en tidligere kontrollpåstand.** En kontroll i råmaterialet
> hevdet at tabellen bruker koeffisient **14,7** i stedet for 16,4, og kalte det
> en «intern inkonsistens» hos Tutelman. **Det stemmer ikke.** Tabellen bruker
> 16,4 **med** den horisontale korreksjonen `x_eff = x − C·sin(HLA)`. 14,7
> framkommer bare hvis man glemmer korreksjonen. Sidens tall er konsistente.

**Netto interpolert fra kildens tabell ved 10 mm:** `215 + 0.5748 × (437−215) = 343 rpm`.
Min utregning ga **347 rpm** — **1 % avvik**. ✔

#### Er størrelsesordenen troverdig?

| Utfall ved 10 mm toe | Modell |
|---|---|
| Startretning | ≈ **2,0° høyre** |
| Spinnakse | ≈ **5,0° venstre** |
| Netto sidespinn | ≈ **347 rpm draw** |
| Endelig sidefeil | ≈ **5 yards venstre** (interpolert fra kildens 3 y @ ¼", 6 y @ ½") |
| Uten bulge ville det vært | ≈ **25 yards venstre** |

**Ja, troverdig.** Golfere rapporterer at toe-treff drar, men *lite* — og det er
akkurat det bulge er designet for å oppnå. En 10 mm toe-bom som starter et par
grader høyre og ender ~5 yards venstre er en helt vanlig, gjenkjennelig
driverball. **Uten** bulge ville modellen gitt 25 yards — som ingen golfer
opplever, og som er nettopp beviset for at bulge må modelleres sammen med gear
effect, ikke etterpå.

⚠ **Fellen:** bruttotallet `0.646 × Vb × x[mm]` gir **968 rpm** ved 10 mm — nesten
**3 ×** for mye. Legges det inn som netto sidespinn, blir hver toe-bom en snap
hook. **Bulge er ikke valgfri.**

---

### 4.2 Vertikalt: 10 mm høyt

**Steg 1 — roll øker loften ved treffpunktet:**
```
Li = 11° + 57.3 × 0.393701 / 12 = 11° + 1.8798° = 12.88°
```

**Steg 2 — launch angle:**
```
a = 12.88 × (0.96 − 0.0071 × 12.88) = 12.88 × 0.86855 = 11.19°
```

**Steg 3 — korriger `y` (dette er §hovedfunnet i praksis):**
```
y = 0.393701 − 1.3 × sin(11.19°)
  = 0.393701 − 1.3 × 0.194053
  = 0.393701 − 0.252269
  = 0.1414"
```
Treffet er 10 mm over sweetspoten, men kraftlinjen passerer kun **3,6 mm** over
tyngdepunktet. **64 % av treffhøyden spises av loften.**

**Steg 4 — gear effect-spinn (Ligning 3):**
```
C = 1.3 × cos(11.19°) = 1.2753"
s = 58,830 × 150 × 1.2753 × 0.1414 / 3000 = 530 rpm topspinn
```

**Steg 5 — men roll la også til backspinn:**
```
Spin_loft(12.88°) = 160 × 102.7 × sin(12.88°) = 3 662 rpm
Netto backspinn   = 3 662 − 530                = 3 132 rpm
```

**Steg 6 — sammenlign med sentrert treff:**
```
Sentrert:  y = 0 − 1.3 × sin(9.7°) = −0.2190"
           s = −825 rpm  (dvs. LEGGER TIL backspinn)
           netto = 3 135 + 825 = 3 960 rpm

Δ = 3 132 − 3 960 = −828 rpm
```

#### Verifisering mot kildens egen tabell

`gearEffect2_.html` har raden **0,4" over senter** = 10,16 mm — praktisk talt
samme punkt:

| Treffhøyde | Loft | Launch | `y` | Backspinn fra loft | Gear effect | Netto |
|---|---|---|---|---|---|---|
| Senter | 11° | 9,7° | −0,22" | 3 135 | **−825** | **3 960** |
| 0,4" over | 12,9° | 11,2° | 0,15" | 3 668 | +563 | **3 105** |

Kildens `Δ = 3 105 − 3 960 = −855 rpm`. Min utregning ved eksakt 10 mm:
**−828 rpm**. ✔ (Differansen er de 0,16 mm.)

#### Verifisering mot ekte robotdata — Hotstix / Golf Magazine feb. 2009

460 cc, nominelt 9,5° driver, robot, **100 mph køllefart, 148 mph ballfart**:

| `H` | Launch | **Målt total backspinn** | Modell | Feil |
|---|---|---|---|---|
| −0,50" | 4,3° | 3 165 rpm | 3 494 | 10,4 % |
| −0,25" | 5,3° | 2 971 rpm | 2 986 | 0,5 % |
| 0 | 6,8° | **2 564 rpm** | 2 657 | 3,6 % |
| +0,25" | 8,4° | 2 098 rpm | 2 392 | 14,0 % |
| +0,50" | 9,4° | 1 862 rpm | 1 893 | 1,7 % |

Kilde: `https://www.tutelman.com/golf/ballflight/gearEffect2_.html`

**Jeg kjørte modellen på Hotstix-driveren ved eksakt 10 mm** (interpolert
loft 10,09°, launch 8,98°):
```
y     = 0.393701 − 1.3 × sin(8.98°) = 0.1908"
s     = 25 × 148 × 0.1908           = 706 rpm topspinn
netto = 2 803 − 706                 = 2 097 rpm

Målt (interpolert):  1 962 rpm
Δ modell  = 2 657 → 2 097 = −560 rpm
Δ målt    = 2 564 → 1 962 = −602 rpm
Modellfeil på selve endringen: −7 %
```

#### Er størrelsesordenen troverdig?

| | 10 mm høyt treff koster |
|---|---|
| Tutelmans 11°-driver @ 150 mph ball | **≈ 830 rpm backspinn** |
| Hotstix-driveren @ 148 mph ball, **målt** | **≈ 600 rpm backspinn** |
| Hotstix-driveren, **modellert** | ≈ 560 rpm (7 % under målt) |

**Ja, troverdig — og modellen treffer måledata innenfor 7 % på dette punktet.**
Spennet 600–830 rpm er reelt, ikke slark: det følger av loft og ballfart, som er
ulike i de to tilfellene. Gear effect per mm er **ikke en universell konstant**.

Dette matcher også praktisk fittingerfaring direkte: å flytte treffet en
centimeter opp på flaten er en av de sterkeste enkeltspakene for driverlengde,
nettopp fordi et sentrert treff allerede bærer 825 rpm ekstra backspinn.
Tutelmans egen tabell gir **+7,3 yards** (237,2 → 244,5) for 0,4" opp.

⚠ **Fellen:** ukorrigert `0.984 × Vb × H[mm]` gir **1 476 rpm** ved 10 mm — over
**dobbelt** av det målte. Og det gir **null** ved sentrert treff, som er feil.
`y = H − D·sin(a)` er ikke en finpuss. Den er **halve modellen**.

---

### 4.3 Sammenstilling: per millimeter, driver

| Akse | Brutto (feil) | Med korreksjon | Netto etter bulge/roll | Målt |
|---|---|---|---|---|
| Horisontal @ 150 mph | 96,8 rpm/mm | 87,7 rpm/mm | **34,7 rpm/mm draw** | **ingen data** |
| Vertikal @ 150 mph | 147,6 rpm/mm | 133,5 rpm/mm | **≈ 83 rpm/mm** | — |
| Vertikal @ 148 mph (Hotstix) | 145,7 rpm/mm | — | **56 rpm/mm** | **60 rpm/mm** |
| Startretning, horisontal | — | — | **≈ 0,20 °/mm** | ingen data |
| Spinnakse, horisontal | — | — | **≈ 0,50 °/mm** | ingen data |

Merk at forholdet **`Iv/Ih` ⇒ 1,5–2 × sterkere vertikalt per mm** stemmer:
83 mot 34,7 er faktor 2,4 netto, og 133,5 mot 87,7 er faktor 1,52 før
bulge/roll-motvirkning — midt i det oppgitte spennet 1,5–2.

---

## 5. Kan D4 lukkes med dette?

### Nei. Tre blokkeringer, i rekkefølge etter alvorlighet.

#### 🔴 Blokkering 1 — akseptansetesten er fysisk usann

> «**Test:** sentrert treff gir eksakt null gear-bidrag.»

Kan ikke passere. Vertikalt gir sentrert treff **−825 rpm** (dvs. mer backspinn).
Horisontalt gir sentrert treff null **kun hvis flaten er kvadratisk mot banen** —
med face-to-path ≠ 0 er `x_eff = −C·sin(HorLaunchAngle) ≠ 0`.

**Konkret konsekvens for spec §9:** golden case «D-plane default»
(`90 / +2 / 0 / +3 / 24`) har åpen flate. En gear effect-modell vil legge til
`16.4 × Vb × (−1.42 × sin(HLA))` ≈ **100 rpm ekstra slice-spinn** på et
dødsentrert treff. Golden-tallene flytter seg selv uten off-centre treff.

**Dette er ikke en datamangel. Det er en spesifikasjonsfeil, og den kan rettes
i dag** — D4 må omformuleres før den kan implementeres, ikke før den kan lukkes.

#### 🔴 Blokkering 2 — den horisontale aksen har null truth-data

Spec §10 krever *«egne navngitte input, kilder, tester og **truth-labels**»*.

| Akse | Truth-data i materialet |
|---|---|
| Vertikal | **5 punkter.** Hotstix-robot, én uidentifisert 460cc 9,5° driver, 100 mph. Modellfeil 0,5–14 %. |
| Horisontal | **Null.** Ingen målt spinn mot registrert toe/heel-treffpunkt noe sted. |

Tutelmans horisontale «sanity test» er **ikke** måledata — den mater modellens
egen output inn i simuleringsprogrammet TrajectoWare Drive og argumenterer at
siden bulge nesten opphever gear effect, må formelen ligge i riktig
størrelsesorden. Det er et designer-intensjonsargument. Det er ikke en måling.

Lambeth-tallene *er* målte, men er **putter, 3,6 mph, flat flate** — og URL-en
svarte 403 for meg, så jeg har ikke sett dem i råkilde.

**Å slå på horisontal gear effect nå ville plassere en ukalibrert koeffisient i
motoren, med en URL bak seg, som ser ut som fysikk.** Det er nøyaktig det
oppdraget advarer mot.

#### 🟡 Blokkering 3 — D4 gjelder «driver», motoren har syv kategorier

`CLUB_GEOMETRY` i `contactModel.js` har syv kategorier. **Gear effect har
publiserte konstanter for én.** Hvis D4 leses som «kun driver», er dette ikke en
blokkering — men det må stå eksplisitt i modellen, ellers vil noen ekstrapolere
12" bulge til et 7-jern.

---

### Hva som kan gjøres nå, uten nye data

| Handling | Status |
|---|---|
| **Omformulere D4s test.** «Null ved sentrert» → «lik den dokumenterte, kildefestede baselinen ved sentrert» (`−825 rpm` for referansedriveren), pluss «**null ved det gear-effect-nøytrale punktet**», som modellen selv beregner. | ✅ Kan gjøres i dag |
| **Implementere vertikal gear effect for driver**, som versjonert, avskrudd-som-default modell med `gearEffectModelId`, eksplisitte navngitte konstanter og de 5 Hotstix-punktene som truth-fixtur. | ✅ Data finnes |
| **Legge inn de 5 Hotstix-punktene som truth-labels** med toleranse **±15 %** (kildens egen verste feil er 14,0 %). | ✅ Kan gjøres i dag |
| **Rette den feilaktige 14,7-påstanden** i råmaterialet — se §4.1. | ✅ Gjort her |
| **Implementere horisontal gear effect.** | ❌ Ingen truth-labels. Bryter spec §10. |
| **Regenerere golden fixture med gear effect på** (D7). | ❌ Vent til horisontal akse har data |
| **Gear effect for fairway/hybrid/jern.** | ❌ Null publiserte konstanter |

### Det som mangler kritisk — én ting

**Launch monitor-data med registrert horisontalt treffpunkt.** Et GCQuad- eller
Trackman-sett med `faceStrikeHorizontalMm` og målt spinnakse, over minst 5
toe/heel-posisjoner på én identifisert driver, ville lukke blokkering 2 alene.
Uten det er den horisontale aksen ren teori.

**Fire av seks kildeområder nådde aldri hit** (patenter, Trackman, OEM, MyGolfSpy).
Trackman-området er nettopp det som kunne båret horisontal truth-data.
**Hent det området før D4 forsøkes lukket igjen.**

---

### Direkte svar

> **Kan D4 lukkes med dette?**

**Nei.** Men blokkeringen er ikke der `STATUS.md` antar. Der står det at
«koeffisientene skal ikke finnes på». **De finnes** — fullt utledet, med
enheter, med URL, med reproduserbare tabeller, og den vertikale er validert mot
robotdata innenfor 7 % i det området vi bryr oss om.

Det som mangler er **truth-data for den horisontale aksen**, og det som er
**galt** er D4s egen akseptansetest. Den ene av de to kan rettes i dag.

D4 kan **halveres og delvis lukkes**: vertikal gear effect for driver, med
Hotstix som truth-fixtur, som en versjonert og navngitt modell. Den horisontale
halvdelen forblir åpen — og skal forbli åpen — til noen har målt den.

---

## Appendix — anbefalt implementasjonsform

Navngitte input i tråd med D3 og spec §10. **Ikke** hardkodede konstanter.

```js
// engine/src/gearEffect.js — FORSLAG, ikke implementert
export const GEAR_EFFECT_MODEL = Object.freeze({
  modelId: 'tutelman-2009-driver-v1',
  scope: 'driver',                    // ⚠ kun driver har publiserte konstanter
  sources: [
    'https://www.tutelman.com/golf/ballflight/gearEffect1_.html',  // Eq 1, 2, 2a, Ih, C, bulge
    'https://www.tutelman.com/golf/ballflight/gearEffect2_.html',  // Eq 3, 3a, y-korreksjon, Hotstix
    'https://www.tutelman.com/golf/ballflight/gearEffect/Appendix.php', // horisontal korreksjon, Alba
  ],
  cgDepthFromFaceCentreIn: 1.3,       // D — målt. IKKE katalogens CG depth (~14 % større)
  ihGramCmSq: 5100,                   // målt spenn 3870–5867, snitt 4575
  ivGramCmSq: 3000,                   // ⚠ BEREGNET, aldri målt. Modellens svakeste ledd
  bulgeRadiusIn: 12,                  // katalogspenn 10–13
  rollRadiusIn: 12,                   // katalogspenn 10–14
  unitConstant: 58830,                // rpm / (mph · in · in / g·cm²)
  horizontalLaunchFraction: 0.875,    // baklengsregnet fra kildens tabell
  derivation: 'analytic-uncalibrated',
  truthLabels: 'hotstix-2009-vertical-5pt',
  horizontalTruthLabels: null,        // ⚠ FINNES IKKE — se GEAR-EFFECT.md §5
});
```

**Rekkefølgen i beregningen er ikke valgfri:**

1. `Li` fra `loft₀ + arcsin(H/R_roll)` — roll endrer loften **først**
2. `a` fra `Li · (0.96 − 0.0071·Li)`
3. `y = H − D·sin(a)` og `C = D·cos(a)` — **korreksjonen, aldri hopp over**
4. `s_gear = 58830 · Vb · C · y / Iv`
5. `Spin_loft = 160 · Vclub · sin(Li)`
6. `Spin = Spin_loft − s_gear`

Bytter man 1 og 3, forsvinner roll-bidraget og modellen dobler seg.

**Fortegnskontrakt:** `s > 0` = topspinn = mindre backspinn = høyt treff.
Kildene bruker begge konvensjoner på ulike sider. Fest én i motoren og
kommenter den ved deklarasjonen.
