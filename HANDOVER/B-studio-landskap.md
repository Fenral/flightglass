# Oppdrag B — Impact Studio i landskap

**Les `00-FELLES.md` først, deretter `NAVIGASJON.md` på rotnivå** — navigasjonen
er låst: Home er hub, én flytende HOME-sirkel 44×44 øverst til venstre er modulens
eneste permanente chrome. Studio bygger innenfor den.

Les også `app/tokens.css` og `adapter/src/` — tokens og konvertering finnes
allerede og skal gjenbrukes, ikke gjenoppfinnes. Fysikklinten på rot feiler hvis
du regner i app-laget; be adapteren om det du trenger (mønster: D61–D63).

---

## Problemet, presist

Impact Studio er den eneste landskapsflaten, og vertikal plass er kritisk.
I brukerens eksisterende mock konkurrerer fire ting om høyden:

1. **Bunnpanelet med fire parameterkort** — Swing Plane, Swing Direction,
   Ball Position, Arc Height, pluss én slider under. **Dette er hovedproblemet.**
2. Topplinjen med Attack Angle og Club Path
3. Høyrekolonnen DTL / IRON / CONTACT
4. STRIKE-insetten oppe til venstre, som dekker deler av scenen

## Diagnosen

Parameterkortene gjør **to jobber samtidig**: de er både velger og avlesning.
Derfor er de høye.

Apple Photos, Depop og eBay løser det samme problemet ved å **skille jobbene**:
velgeren er en tynn rad, og den aktive verdien flyter over slideren. Telegram
viser det motsatte — fire slidere stablet à 40 px, alle synlige samtidig.

Begge er gyldige. Velg én, og begrunn valget mot landskapshøyden.

Merk også at de tre høyreknappene **ser like ut men gjør tre ulike ting**:
bytte visning, bytte kølle, utvide panel. Det er en egen feil.

## Hva Studio faktisk skal vise

**Fire input:** Swing Plane (°) · Swing Direction (°) · Ball Position (cm) ·
Arc Height (cm). Pluss **`lieHeightMm`** som ny input — se under.

**Avledet output:** Attack Angle · Club Path · Low Point · treffpunkt.

**Underlaget er nytt og viktig.** `clubMode` er avviklet (D17b). Det bandt tre
uavhengige ting sammen. Nå er de separate:

```
lieHeightMm        ballens høyde over bakkeplanet — UNDERLAGET
                   0 hardpan · 3 tight · 8 fairway · 15 light rough
                   22 rough · 30 tee · 42 high tee
sweetSpotHeightMm  sweetspot over sålen — KØLLA
faceHeightMm       slagflatehøyde — KØLLA
```

Tre tilstander som var umulige i den gamle modellen er nå gyldige og bør kunne
vises: **driver fra bakken**, **3-wood fra pigg**, **jern fra pigg**.

## Strike-visningen

`strikeBand.js` returnerer **begge svar samtidig**, alltid:

```
turfBand      Duff · Fat · Pure · Thin · Whiff   (null når ballen er luftbåren)
facePosition  OffFace · Low · Centre · High
hasTurfContact
lead          hvilket som skal LEDE i grensesnittet
```

En driver fra bakken kan ha `turfBand: "Pure"` og `facePosition: "Low"` samtidig.
**Begge er sanne.** Å vise bare det ene var utfordring U1.

**D3b:** ingen skjermtilstand får vise turfkontakt-status uten at underlaget står
i samme visning. Uten `lieHeightMm` synlig ser «PURE» og «NO TURF CONTACT» ut som
en selvmotsigelse.

## Krav fra spec 03

- **Low Point-prikken og svingbuen skal være synlige hele tiden.** Midlertidige
  forklaringschips eller piler kan aldri dekke dem.
- View-knappen viser **destinasjonen**: i Face On står det DTL, i DTL står det FO.
- **Brytepunktet er rettet (D59):** `landscape` er en orienteringsbetingelse —
  bredde > høyde, minimum `568 × 320` — ikke en breddeterskel. Landskap skal
  fungere ved 568×320, 812×375 og 932×430 (spec 03, kriterium 8). Kun under
  minimum vises rotasjonsoppfordringen. Et tidligere utkast sa «wide ≥ 840 px»;
  det er forkastet — en telefon i landskap ville fått beskjed om å rotere.

## Ikke gjør

- Ikke bygg fysikk. `engine/src/studioSolve.js` gjør alt.
- Ikke gjenopprett `clubMode`. Den bandt underlag, køllegeometri og pigg sammen.
- Ikke la treffpunktet påvirke ballflukten. Gear effect er droppet (D52).

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

1. Landskapslayout som løser høydeproblemet, med målt pikselbudsjett
2. Begrunnet valg mellom stablede slidere og velger-pluss-én-slider
3. Løsning på at de tre høyreknappene gjør ulike ting
4. Underlagsvelgeren, med de tre nye tilstandene demonstrert
