# FYRK — Designsystem (fyrk.no)

Visuell oversikt over designtokens. Maskinlesbar kilde: [`design-tokens.json`](./design-tokens.json) (W3C DTCG-format, importerbar i Figma via Tokens Studio).
Sannhetskilde i kode: `tailwind.config.mjs` + `src/styles/global.css`.

---

## Farger

### Brand

| Swatch | Token | Hex | Bruk |
|:------:|-------|-----|------|
| ![](https://readme-swatches.vercel.app/001F3F) | `brand.navy` | `#001F3F` | Overskrifter, primærtekst, mørke flater |
| ![](https://readme-swatches.vercel.app/C4A07A) | `brand.sand` | `#C4A07A` | Aksent (varm sand). Heter `cyan` i koden |
| ![](https://readme-swatches.vercel.app/D4B896) | `brand.sand-light` | `#D4B896` | Lysere aksent |
| ![](https://readme-swatches.vercel.app/E0CCAF) | `brand.sand-lighter` | `#E0CCAF` | — |
| ![](https://readme-swatches.vercel.app/ECDEC8) | `brand.sand-lightest` | `#ECDEC8` | Subtile tonede bakgrunner |
| ![](https://readme-swatches.vercel.app/8A6249) | `brand.sand-dark` | `#8A6249` | — |
| ![](https://readme-swatches.vercel.app/8E684A) | `brand.sand-darker` | `#8E684A` | Lenke-hover, outline-knapper (AA på hvit) |
| ![](https://readme-swatches.vercel.app/FFFFFF) | `brand.white` | `#FFFFFF` | Bakgrunn |

### Neutral

| Swatch | Token | Hex | Bruk |
|:------:|-------|-----|------|
| ![](https://readme-swatches.vercel.app/FAFAFA) | `neutral.50` | `#FAFAFA` | — |
| ![](https://readme-swatches.vercel.app/F5F5F5) | `neutral.100` | `#F5F5F5` | — |
| ![](https://readme-swatches.vercel.app/E0E0E0) | `neutral.200` | `#E0E0E0` | Kantlinjer |
| ![](https://readme-swatches.vercel.app/CBCED4) | `neutral.300` | `#CBCED4` | — |
| ![](https://readme-swatches.vercel.app/5A5A6E) | `neutral.500` | `#5A5A6E` | Dempet tekst (kontrastjustert) |
| ![](https://readme-swatches.vercel.app/333333) | `neutral.700` | `#333333` | Brødtekst (default) |
| ![](https://readme-swatches.vercel.app/0F1419) | `neutral.900` | `#0F1419` | — |

### Feedback

| Swatch | Token | Hex |
|:------:|-------|-----|
| ![](https://readme-swatches.vercel.app/0F7C3E) | `feedback.success` | `#0F7C3E` |
| ![](https://readme-swatches.vercel.app/C41E3A) | `feedback.error` | `#C41E3A` |
| ![](https://readme-swatches.vercel.app/E67E22) | `feedback.warning` | `#E67E22` |
| ![](https://readme-swatches.vercel.app/1E88E5) | `feedback.info` | `#1E88E5` |

**Kjernekombinasjon:** navy-tekst på hvit bakgrunn, sand (`#C4A07A`) som aksent, neutral-700 for brødtekst.

---

## Typografi

### Fontfamilier

| Token | Stack | Bruk |
|-------|-------|------|
| `font.family.primary` | Inter → InterVariable → system-ui | Overskrifter, knapper |
| `font.family.body` | -apple-system → Segoe UI → Roboto → Helvetica Neue → Arial | Brødtekst |
| `font.family.mono` | Courier New → Courier | Kode |

Inter lastes lokalt via `@fontsource/inter` i vektene **400, 500, 600, 700**.

### Vekter

| Token | Verdi |
|-------|-------|
| `font.weight.regular` | 400 |
| `font.weight.medium` | 500 |
| `font.weight.semibold` | 600 |
| `font.weight.bold` | 700 |

### Skala

| Token | rem | px |
|-------|-----|-----|
| `display` | 3.5 | 56 |
| `h1` | 3 | 48 |
| `h2` | 2.25 | 36 |
| `h3` | 1.75 | 28 |
| `h4` | 1.5 | 24 |
| `h5` | 1.25 | 20 |
| `h6` / `lg` | 1.125 | 18 |
| `base` | 1 | 16 |
| `sm` | 0.875 | 14 |
| `xs` | 0.75 | 12 |

### Linjehøyde

| Token | Verdi |
|-------|-------|
| `tight` | 1.2 |
| `snug` | 1.3 |
| `normal` | 1.5 |
| `relaxed` | 1.6 |

---

## Spacing

8px-basert skala (med 4px-trinn der nødvendig).

| Token | rem | px |
|-------|-----|-----|
| `1` | 0.25 | 4 |
| `2` | 0.5 | 8 |
| `3` | 0.75 | 12 |
| `4` | 1 | 16 |
| `5` | 1.25 | 20 |
| `6` | 1.5 | 24 |
| `8` | 2 | 32 |
| `10` | 2.5 | 40 |
| `12` | 3 | 48 |
| `16` | 4 | 64 |
| `20` | 5 | 80 |
| `24` | 6 | 96 |
| `28` | 7 | 112 |

---

## Border-radius

| Token | rem | px |
|-------|-----|-----|
| `sm` | 0.25 | 4 |
| `md` | 0.375 | 6 |
| `lg` | 0.5 | 8 |
| `xl` | 0.75 | 12 |
| `2xl` | 1 | 16 |
| `full` | — | 9999 (pille) |

---

## Skygger

| Token | Verdi |
|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `md` | `0 4px 6px rgba(0,0,0,0.1)` |
| `lg` | `0 10px 15px rgba(0,0,0,0.1)` |
| `xl` | `0 20px 25px rgba(0,0,0,0.1)` |
| `2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` |
| `brand-sand` | `0 10px 30px -5px rgba(160,120,90,0.3)` |

---

## Animasjon

| Token | Verdi |
|-------|-------|
| `duration.fast` | 150ms |
| `duration.normal` | 250ms |
| `duration.slow` | 350ms |
