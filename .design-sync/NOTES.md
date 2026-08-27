# design-sync — notater

- 2026-08-25: Førstegangssynk, minimal (guidelines-only). Prosjekt
  «Flight Glass Design System» (e3792b14-4901-4e6f-9a55-a74f0cb9402f).
- Repoet har INGEN kodede komponenter — komponentene bygges i SwiftUI (D70),
  som design-sync ikke leser. Synken bærer tokens + styles.css + guidelines
  (DESIGN.md, CONNECTIONS-BESKRIVELSE.md) + README (= conventions.md).
- Ingen `_ds_sync.json`-anker med vilje: neste synk re-verifiserer alt,
  som er korrekt for denne formen.
- Kilderekkefølge ved re-synk: DESIGN.md → app/tokens.css (mekanisk avledet)
  → ds-bundle/. Endres DESIGN.md, regenerer tokens.css FØR synk.
- conventions.md validert 2026-08-25: alle 14 refererte tokens finnes i
  tokens.css.
