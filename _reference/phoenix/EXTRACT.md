# Phoenix — ekstrahert visuelt system

Kilde: Halo Lab, "Phoenix — UI/UX for IoT SaaS Technology Brand", Behance 211701239.
19 plater lastet ned til denne mappa. Pinterest-pinnen var samme prosjekt.

Dette er **referanse, ikke fasit**. Tokens og mønstre kan adopteres; logo, 3D-render,
produktbilder og illustrasjoner er Halo Labs eiendom og kopieres ikke.

## Farger (oppgitt eksplisitt på plate 04)

| Token | Hex | Rolle i Phoenix |
|---|---|---|
| black | `#000000` | Ytre lerret, sidebakgrunn |
| surface-1 | `#22242B` | Kortflate, blåstukket kull |
| surface-2 | `#2F323A` | Hevet flate, panel |
| muted | `#5D5C5B` | Kantlinjer, inaktiv tekst |
| text | `#D2D3D4` | Primærtekst (ikke ren hvit) |
| accent | `#F75105` | Aktiv / levende / handling |
| accent-warm | `#F78E21` | Gradienttopp, sekundær varme |

Signaturgradient: vertikal `#000000 → #F75105 → #F78E21`. Brukes som **miljø/bakgrunn**,
aldri som fyll i UI-komponenter.

## Typografi (oppgitt eksplisitt på plate 03)

| Rolle | Font | Bruk |
|---|---|---|
| Primær | **Neue Haas Grotesk** | Brødtekst, etiketter, verdier, UI |
| Sekundær | **Monument Extended** | Display-caps: "ZEUS-X", store %-tall |

Begge er kommersielle. Se «Åpne problemer» nedenfor.

## Mønstre som faktisk bærer systemet

1. **Aksentfargen er en tilstand, ikke pynt.** Oransje = aktiv/strøm går. Grå = av/inaktiv.
   Konsekvent gjennomført (plate 19: aktive porter oransje, inaktive grå). Binær semantikk.
2. **Bento-rutenett.** Dashbordet er moduler i avrundede rektangler, ulik størrelse, tett pakket.
3. **Etikett-over-verdi.** Liten grå etikett, større lys verdi under. `Main AC / 30 KWH`.
   Gjennomgående for all telemetri.
4. **Bred sperret display-caps** for seksjonstitler: `ENERGY FLOW`, `DETAILS`, `CHARGING MODE`.
   Stor, lett vekt, økt letter-spacing.
5. **Visualiseringen er helten.** Energiflyt-diagrammet er sidens midtpunkt — ekte datagrafikk,
   ikke dekorasjon. Kurvede bånd, tykkelse = mengde.
6. **Prikkrutenett** som bakgrunn i diagrampanelet.
7. **Radial måler** med oransje→grå bue og prosent i midten.
8. **Pilletoggles**, oransje fyll = på.
9. **Frostet glass-panel** med backdrop-blur for varsler/overlegg.
10. **Tynn vertikal oransje linjal** ved sitatblokker, tonet ut i begge ender.
11. **Sirkulær hvit CTA** — massiv hvit sirkel, mørk tekst. `ORDER`, `LOGIN`, `DISCOVER NOW`.
12. **Ikke ren hvit tekst.** `#D2D3D4` — demper glaringen mot svart.

## Hvorfor dette passer Flight Glass strukturelt

Phoenix er et **instrumentpanel for en fysisk enhet**: parameterinnganger, en
flytvisualisering i sentrum, numeriske avlesninger rundt, aktiv/inaktiv-tilstander.
Flight Glass er et instrumentpanel for et fysisk fenomen: treffparametre inn,
banevisualisering i sentrum, numeriske avlesninger rundt. Nesten 1:1 strukturell analogi.

## Åpne problemer — MÅ løses før adopsjon

**P1 — Én aksentfarge klarer ikke jobben.**
Phoenix koder kun av/på, og trenger derfor bare oransje vs grå. Flight Glass må kode
*retning* (venstre/høyre, draw/fade), og sannsynligvis *flere baner samtidig* til
sammenligning. Et ett-aksent-system kan ikke uttrykke det. Dette er den største
inkompatibiliteten og kan ikke pappes over senere.

**P2 — Fontene er kommersielle.**
Neue Haas Grotesk (Monotype) og Monument Extended (Pangram Pangram) krever begge
webfont-lisens. Enten kjøpes lisens, eller så velges substitutter bevisst.

**P3 — Gradientbakgrunnen er lånt følelse.**
Svart-til-oransje leser som storm/varme/energi fordi produktet er en generator i uvær.
På en golfapp leser den som solnedgang. Effekten er ikke gratis — den må fortjenes på nytt.
