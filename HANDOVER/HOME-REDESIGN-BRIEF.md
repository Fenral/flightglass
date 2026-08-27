# Home-redesign — eierens brief (påbegynt 2026-08-26)

Runden er booket i D96 (eieren er ikke fornøyd med noen av dagens to
Home-flater). Dette dokumentet samler eierens ønsker og referanser fram til
prosessen startes. D110: navigasjonen er reåpnet for utforsking — N-a-hubben
gjelder til nytt vedtak.

## RETNINGSENDRING (eier, 2026-08-26 ettermiddag): PORTRETT-FØRST

Eieren har lansert og presisert en retning som — hvis G sin måling bekrefter
den — endrer hele landskapsproblemet: **portrett overalt som standard, med
landskap som VALGFRI mulighet på strike/path/attack-flatene (Studio).**
Rotasjonen blir en berikelse, ikke et krav; D12-bruddet forsvinner som tvang.
For menyen betyr det: ÉN meny-verden å designe (portrett), og landskapssvaret
reduseres til «hva skjer med menyen når brukeren frivillig roterer Studio».
G måler nå om leveringsscenen FUNGERER i portrett per modus. Design
portrett-først, men ikke lås landskapssvaret før G-målingen foreligger —
begge utfall skal tåles av planen din. D8/D12/D59 er fortsatt gjeldende til
eget vedtak.

## Eierens ønsker (2026-08-26)

1. **En meny** — eieren vet det går mot N-a-hubvedtaket og vil det likevel.
   Referansen under er en bunnmeny-video; retningen er bunnmeny.
2. **Et «dashboard» der korrelasjoner blir en del** — Connections-innholdet
   (eller et utsnitt) inn på en dashboard-flate. «Siden kan være under the
   fold» — altså dashboard-innhold nedenfor førsteskjermen.
3. (Fra D109, beslektet motiv:) mindre samtidig innhold på skjermen.

## Eierens presisering av menyen (2026-08-26, ettermiddag)

- **Innhold: Home · Flight · Studio — og KANSKJE Connections.** Eieren heller
  mot at Connections ligger PÅ Home (som del av dashboardet), «så ikke Home
  bare blir en 'ekstra meny'». Poenget: hvis alt ligger i menyen, mister Home
  jobben sin — Home skal ha eget innhold, ikke være en duplisert meny.
  Altså 3 (evt. 4) menyoppføringer — godt innenfor uxpeaks maks 5.
- **Arbeidsmåte:** bruk uxpeak-innholdet (tipslista under) OG **Mobbin-MCP-en**
  (verktøyene search_flows / search_screens / search_sections — last dem via
  ToolSearch) til å hente virkelige menyeksempler før formen låses.
- **Kvalitetskrav:** proff HAPTIKK (detent-språket finnes alt i prosjektet —
  sa-haptics.js er eierens egen modul) og en SUBTIL animasjon som passer
  identiteten (jf. DESIGN.md Bevegelse og D18: det som skifter, skifter).

## Referanse: uxpeak — «How to Design a Great Bottom Mobile Navigation Bar»

https://youtu.be/wLJ40GV2XEc · 23:46 · kanal uxpeak. Transkript utilgjengelig
via API; kapittellisten er videoens faktiske tipsliste:

1. Prioriter — menyplass er prioritering, ikke oppbevaring
2. Forstå hvem brukerne er
3. Velg riktige størrelser, padding og marger
4. Maks 5 faner
5. Tommelvennlige treffflater
6. Differensier aktiv/inaktiv tilstand tydelig
7. Enkle og gjenkjennelige ikoner
8. Korte etiketter
9. Hold det rent og enkelt
10. Én ikonstil
11. Unngå for mange farger
12. Varselmerker (badges) i bunnmenyen
13. Eksperimenter med kreative oppsett
14. Skill bunnmenyen fra hovedinnholdet (delelinje/flate)
15. Bruk bakgrunnsfarge på menyen
16. Nøytrale farger
17. Unngå svak kontrast på inaktive tilstander
18. Slanke mikrointeraksjoner

## MÅLT GRUNNLAG fra strøm G (les G-STRIKE-SPLITT-PLAN.md §9 før du tegner)

G har målt Studios flate mot en meny, ved D59-ytterpunktene. Hovedfunn:
- **568×320: strike-insetten (111 px) kan ikke eksistere under NOEN bunnmeny**
  (verken 60 eller 80 px). Strike-splitten (D109) er altså en FORUTSETNING for
  meny i Studio — ikke bare forenlig med den.
- Stance-etikettene klippes ved 80 px meny på minimumsstørrelsen.
- Horisontalt: chip-raden har 1 px slakk (548 av 549). En sidestilt meny (72 px)
  gir 14 px etikett-overflow og bryter D64 (uforkortede etiketter) — sidemeny
  krever ombygd chip-rad, den kan ikke bare legges til.
- G sitt samordningsspørsmål G-e (menyens oppførsel i Studio-landskap:
  auto-skjul med kant-hint · permanent · sidestilt) er DIN å svare på i planen —
  G bygger slik at alle tre utfall tåles, og ditt svar avgjør stance-etikettene
  og coachmark-sonene. G anbefaler auto-skjul, med 00-FELLES-funnet
  («flater der visualiseringen ER innholdet bruker ikke bunnfelt») som belegg.
- Eieren har i tillegg bedt G måle om Studio kan gå PORTRETT etter splitten —
  faller den ut positivt, kan hele landskap-menyspørsmålet bortfalle. Følg med
  på G-planens portrettvurdering før du låser landskapssvaret ditt.

## KRAV: landskap er en egen designoppgave, ikke en rotasjon (eier, 2026-08-26)

Eieren, ordrett: «meny på portrait er en ting, men vi må finne en god løsning
på meny i landscape også.» Det betyr:

- Hver menyretning i planen skal ha et EKSPLISITT landskapssvar, tegnet for
  landskap — «portrettmenyen rotert» godtas ikke som svar.
- Regnestykket som gjør dette hardt: Impact Studio er landskap (D8/D12) med
  minimum 568×320 (D59). En bunnstripe på 60–80 px spiser 19–25 % av
  skjermHØYDEN der høyde alt er knappest — og scenen (buen) lever på høyde.
- Mulige retninger å utforske (eksempler, ikke fasit): sideplassert
  rail/meny i landskap, auto-skjul med kant-hint, hjørneanker som utvider
  seg. H velger og begrunner selv.
- Onboarding-coachmarkene i Studio (D107) ligger i midtbåndets nedre kant —
  et menysvar i landskap må deklarere hva som skjer med dem.

Merk spenninger prosessen må løse eksplisitt:
- Tip 4 (maks 5 faner) mot appens sju flater (00-FELLES-modultabellen).
- Ikon-tipsene (7, 10) mot DESIGN.md-regelen «intet ikon står alene» og
  NAVIGASJON-ordprinsippet (N-b: ord, aldri ikon).
- Bunnmeny = permanent chrome, som N-a-resonnementet eksplisitt avviste —
  det nye vedtaket må svare på det gamle argumentet, ikke overse det.
