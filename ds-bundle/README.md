# Flight Glass — slik designer du med dette systemet (v3)

Du designer skjermer for **Flight Glass**, et golf-ballfluktinstrument for
telefon. Brukeren kan fagbegrepene. Hele UI-et er på ENGELSK. Estetikken:
dyp dusk-lilla grunn, glassplater, og semantiske parameterfarger.

## Oppsett

Ren CSS med custom properties, ingen wrapper. `styles.css` importerer tokens
og fontene (Geist UI · Space Grotesk display · IBM Plex Mono data).
ENKELTTEMA (mørkt) — aldri lys variant. Scene-bakgrunn: `var(--scene-bg)`.

## Stilspråket: tokens, aldri rå hex

| Token | Rolle |
|---|---|
| `--neutral` | lerretet (nesten svart, lilla stikk) |
| `--surface` / `--plate` | scener / glassplater for avlesninger |
| `--plate-glass` + `--glass-edge` | ekte glassplate: rgba-fyll + 1px indre lyskant |
| `--ink` / `--muted` / `--ghost` | tekst: svar / meta / inaktiv |
| `--primary` (#FF8A4D) | handling og aktiv tilstand; hårlinjer i 100/55/30 % |
| `--secondary` (#9D8BFF) | kjølig motvekt: progresjon, lab |
| `--face --path --attack --loft --plane --strike --depth` | PARAMETERFARGENE — hver parameter eier sin kulør |
| `--good` / `--bad` | utfall. Gul finnes IKKE som signal — `--strike` betyr kun treffbånd |
| `--celebrate` | kun milepæler |

## De to reglene som avgjør om et design ser riktig ut

**1 — Én parameter leder.** Den AKTIVE parameteren i full kulør; holdte
parametre får `--ghost`-tekst med kulørprikk. Aldri sju kulører i full styrke.

**2 — Informasjonsnivåer.** Ett svar per panel: stort + `--ink`. Meta (kølle,
underlag, forbehold) = caption + `--muted`, aldri i svarets grad. Forbehold
som små chips.

## Typografi og tall

ALLE tall i IBM Plex Mono (`--font-data`). Avstander: 1 desimal + bokstav
(`16.3 m L`). Vinkler: fortegn (`−16.3°`). Foran/bak: ord (`10.5 cm ahead`).
Spinn: heltall, tynt mellomrom (`3 173 rpm`). Smash: 3 desimaler.

## Glødregelen (viktig)

I banescener: baner er hårstreker, deltaflaten er scenens ENESTE myke element.
Utenfor scener: materialglød er fri — hårlinjer, plater, aksenter.

## Sannhetskildene

`styles.css` → `tokens/tokens.css`, og `guidelines/DESIGN.md` (hele systemet).
For Connections: `guidelines/CONNECTIONS-BESKRIVELSE.md` — grafen der er ekte
innhold, aldri lorem.

## Idiomatisk eksempel

```html
<div style="background:var(--plate-glass); border:1px solid var(--glass-edge);
            border-radius:var(--r-card); padding:var(--sp-lg);
            backdrop-filter:blur(14px)">
  <div style="font-family:var(--font-ui); font-size:10px; letter-spacing:.1em;
              text-transform:uppercase; color:var(--muted)">CARRY</div>
  <div style="font-family:var(--font-data); font-size:18px; font-weight:600;
              color:var(--ink)">173.5 m</div>
</div>
```

## Aldri

Lys modus · rå hex · gul som advarsel · rød/grønn som retning · emoji ·
mer enn én parameter i full kulør samtidig.
