# Navigasjonsarkitektur — anbefaling fra strøm A

**Status: LÅST av eier 2026-08-25** (N-a…N-h godkjent samlet). B, C og E kan bygge på dette.
Klikkbar prototype: åpne `app/nav/index.html` i en nettleser
(desktop: smalt vindu for portrett, bredt for Studio-landskap).

---

## Anbefalingen i én setning

**Home er hub. Hver modul bærer nøyaktig ett stykke permanent navigasjons-
chrome: en flytende HOME-sirkel øverst til venstre. Alt annet chrome er
modulens eget innhold.**

## De fire svarene

### 1 · Hvordan bytter man modul?

Via Home. Hver modul har én flytende sirkel, 44 × 44 px, øverst til venstre,
med ordet `HOME`. Enhver modul er dermed maks **to trykk** unna enhver annen:
HOME → destinasjon. Ingen direkte modul-til-modul-navigasjon i chrome.

**Unntaket er deklarerte deep-links**, som er *innhold*, ikke chrome:
D-plane ↔ Ball Flight deler state per spec (`02` §Top), og en slik lenke
tegnes som innholdslenke inne i modulen. En deep-link endrer aldri
HOME-sirkelens betydning — det finnes **ingen tilbake-stack**. HOME går
alltid til Home, uansett hvordan du kom dit.

Hvorfor ikke de andre kandidatene:

- **Kantsveip:** usynlig (ingen affordance), kolliderer med OS-gester
  (iOS/Android tilbake-sveip fra kantene) og med appens egen hovedinteraksjon
  — å dra. I en app der slidere og bunnark dras, er en kantgest en felle.
  Og en gest har ikke noe naturlig tastaturmotstykke; den kunne bare vært et
  *tillegg*, aldri veien.
- **Modul-pill øverst:** sju destinasjoner får ikke plass i en pill-rad på
  320–430 px uten skrolling eller dropdown. En dropdown er en meny = to trykk
  = samme kostnad som hub, men med permanent chrome i tillegg — og pillen
  måtte da bety to ting (tilstand *og* modul), som ødelegger grammatikken
  under.
- **Bunnfelt:** utelukket av oppdraget, og av funnet: ingen av de undersøkte
  visualiseringsappene bruker det.

Kostnaden ved hub — alltid to trykk mellom moduler — er akseptert med åpne
øyne: en sesjon i Flight Glass lever *inne i* én modul (dra slidere, les
utfall). Modulbytte er sjeldent i forhold, og de parene som faktisk henger
sammen (Ball Flight ↔ D-plane) dekkes av deep-links.

### 2 · Hva skjer i landskap?

**Landskap er et modus man går inn i og ut av** (eierens avgjørelse, D59).
`landscape` er en orienteringsbetingelse — bredde > høyde, minimum 568 × 320 —
ikke en breddeterskel.

Inngangen: velg Impact Studio på Home. Er skjermen ikke i landskap, viser
Studio rotasjonsoppfordringen (bestemt i `DESIGN.md`); roter, og flaten
vises. Utgangen: HOME-sirkelen, som finnes i **begge** tilstander — også på
oppfordringsskjermen. Tilbakeveien forsvinner aldri bak en rotasjon.

Navigasjonen ser altså **lik ut** i landskap: samme sirkel, samme hjørne,
samme betydning. Det som er et modus er flaten, ikke navigasjonen.

### 3 · Hvor mye chrome er permanent?

**Permanent chrome = 1 936 px² — én sirkel à 44 × 44 px.**
Absolutt tak: **3 872 px²** (to sirkler), reservert for et fremtidig behov
ingen har definert ennå. **0 px sammenhengende barer, og ingenting permanent
langs bunnkanten** — bunnkanten tilhører bunnark og inputpaneler, som er
instrument, ikke chrome.

Grensedragningen: *chrome* er det som verken viser eller endrer modellen
(navigasjon, branding). Linsevelger, slidere, avlesninger og pin-knapp er
instrumentet selv og teller ikke mot budsjettet.

Til sammenligning: på minste portrettskjerm (375 × 667) er én sirkel 0,8 %
av skjermen; et typisk bunnfelt (49 px + safe area) ville vært ~11 %.

### 4 · Hvordan kommer man tilbake?

- **Til Home:** HOME-sirkelen, alltid øverst til venstre, alltid ett trykk.
- **Mellom moduler:** via Home (to trykk), eller en deklarert deep-link.
- **Tastatur:** `Escape` = HOME, fra hvor som helst. `Tab`/`Shift-Tab`
  gjennom kontrollene, `Enter`/`Space` aktiverer. På Home gjør Escape
  ingenting.
- **Ingen stack, ingen historikk.** «Tilbake» finnes ikke som begrep;
  det finnes bare «opp til Home». Én mental modell, null spesialtilfeller.

## Grammatikken — det B, C og E arver

To navigasjonsnivåer, to former. Formene blandes aldri:

| Form | Nivå | Betyr | Eksempel |
|---|---|---|---|
| **Sirkel i hjørne** | modul | forlate/bytte flate | HOME-sirkelen |
| **Pill** | tilstand i modulen | bytte hva flaten viser | DIRECTION / HEIGHT |

I tillegg, fra navigasjonsfunnet, for modulenes eget innhold (B og C sitt
ansvar, ikke navigasjonens): avlesninger bor i flytende kort eller bunnark
som kan dras sammen; dataene fyller hele skjermen.

Regler som følger av grammatikken:

1. En pill navigerer aldri til en annen modul.
2. En sirkel bytter aldri tilstand inne i en modul.
3. Maks to sirkler på skjermen samtidig (chrome-taket). I dag finnes én.
4. HOME-sirkelen sitter øverst til venstre i alle moduler og begge
   orienteringer, med safe-area-avstand.
5. Deep-links tegnes som innhold, aldri som hjørnesirkler eller piller.

## Kravene fra brevet

- **44 × 44 px:** sirkelen er 44 px; pillene har 36 px synlig høyde med
  44 px treffsone (utvidet klikkeflate, mønsteret fra `DESIGN.md`:
  «En 3 px slider-skinne har 44 px treffsone»).
- **Tastatur:** ekte `<a>`/`<button>`-elementer — Tab, Enter, Space native.
  Escape = HOME som global «opp».
- **Synlig fokus:** 2 px ring i `primary-hi` med 2 px avstand via
  `:focus-visible`, definert i `tokens.css`, synlig i alle tilstander —
  fokus er en egen akse (`DESIGN.md`).
- **Reduced motion:** modulovergangen faller til øyeblikkelig bytte;
  ingenting informasjonsbærende ligger i overgangen.

## Prototypene

| Fil | Viser |
|---|---|
| `app/nav/index.html` | Home som hub: de sju flatene, ren inngang |
| `app/nav/ball-flight.html` | Modulskjelett: HOME-sirkel + linsepiller + soneinndeling |
| `app/nav/studio.html` | Orienteringsporten live: roter/endre vindusform og se D59-betingelsen slå inn og ut, med HOME i begge tilstander |

Skjelettene viser ingen tall — tall uten motor er oppfunnede tall.
`app/tokens.css` er avledet mekanisk fra `DESIGN.md`-frontmatter og deles
med del 2.

## Forslag som trenger låsing

Disse er synlige valg jeg har gjort for å kunne bygge prototypen. Ingen står
i `DECISIONS.md`. Lås eller endre:

| # | Forslag | Begrunnelse |
|---|---|---|
| N-a | Hele arkitekturen over (hub + én HOME-sirkel + grammatikken + chrome-tallet) | Dokumentets hoveddel |
| N-b | HOME-kontrollen er en 44 px sirkel med **ordet** `HOME` i label-typografi, aldri et ikon | Ikonografiregelen: intet ikon står alene; ordet er presist |
| N-c | HOME-sirkelens utforming: `coal-2` flate, `text`-farge, hover `coal-3`, pressed −12 % | Følger knappemønsteret i interaksjonstabellen |
| N-d | Modulbytte animeres med `base` 160 ms `easeInOut` | Samme situasjon som linsebytte: noe forlater mens noe ankommer |
| N-e | Rotasjonsoppfordringens ordlyd: «Rotate to landscape — the arc needs width over height.» | Sier *hvorfor*, ikke bare *hva*; gjenbruker D59-begrunnelsen |
| N-f | Home viser appnavnet i `display-lens` over modullisten | Ren inngang trenger én identitetslinje; slab ville gjort Home til en skjerm om seg selv |
| N-g | Modulrekkefølgen på Home = modultabellen i `00-FELLES.md` | Eneste eksisterende rekkefølge; ingen ny funnet på |
| N-h | `Escape` = HOME er den globale tastatursnarveien | Konvensjonell «opp»; ingen stack å tolke |
