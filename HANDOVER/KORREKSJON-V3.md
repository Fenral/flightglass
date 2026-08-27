# Korreksjon v3 — til strømmene A, B og C

**Designsystemet er reversert til mockenes visuelle språk (D82).** DESIGN.md er
skrevet om som v3; det oransje systemet er parkert i
`_source/DESIGN-v2-oransje-parkert.md`.

## Hva dette betyr for deg

**A og B: OMMALINGEN ER AVLYST.** Mockkoden i `_source/mocks/` har allerede
riktig utseende — den ER v3. Jobben din krymper til:

1. Motorkobling via `adapter/` (det du alt har bygget gjenbrukes)
2. U-feilene (tekstkollisjoner, hierarki) rettes I mockens look
3. Arvereglene anvendes: tallformat (IBM Plex Mono for ALLE tall),
   informasjonsnivåer, «én parameter leder», tilstander utenfor normalen
4. Fontbytte: Inter → **Geist** for UI (D83). Space Grotesk og IBM Plex Mono
   består. Metrikken er nær Inter — layout skal ikke forskyves merkbart.
5. Gul-opprydding (D84): `--warn` finnes ikke lenger; feiltilstander bruker
   `--bad`. Gull er KUN strike.

**C:** bytt til nye `app/tokens.css`-tokens. Grafstrukturen og alle låste
lesebeslutninger (D43/D68/D69) er UENDRET.

## Tokens

`app/tokens.css` er regenerert fra DESIGN.md v3 — 45 tokens, inkl.
parameterfargene (`--face --path --attack --loft --plane --strike --depth`),
glassmaterialet (`--plate-glass`, `--glass-edge`, `--scene-bg`) og fontrollene.

## Reglene som IKKE er endret

Hysterese-layouten · D59-brytepunktet · engelsk UI · enhetsvalg ·
modellgrense-setningen · fysikklinten · «naken hex forbudt» ·
glødregelen er nå SKOPET (D85): hårstreker + én myk flate INNE i banescener,
materialglød fri utenfor.

Les DESIGN.md v3 i sin helhet før du fortsetter. Bekreft, og oppsummer hva
som endres i din strøm, før du bygger videre.
