# Designprinsipper - Fyrk Nettside

Dette dokumentet evaluerer Fyrk-nettsiden mot de 8 grunnleggende designprinsippene fra [Adobe Express](https://www.adobe.com/express/learn/blog/8-basic-design-principles-to-help-you-create-better-graphics).

## 1. Alignment (Justering) ✅

**Status:** Godt implementert

**Evaluering:**
- Alle elementer er konsistent justert med container-basert layout
- Tekst er sentrert i hero-seksjonen
- Service cards bruker grid-system for perfekt justering
- Navigation er horisontalt justert med konsistent spacing
- Footer bruker grid for justert layout

**Forbedringer:**
- ✅ Bruker `container mx-auto` for konsistent sentrering
- ✅ Grid-system sikrer perfekt justering av cards
- ✅ Konsistent padding og margin gjennom hele siden

## 2. Hierarchy (Hierarki) ✅

**Status:** Godt implementert

**Evaluering:**
- Klar typografisk hierarki: Display → H1 → H2 → H3 → Body
- Viktigste melding (hero heading) er størst og mest fremtredende
- CTA-knapper har visuell vekt gjennom farge og størrelse
- Service cards har konsistent struktur: ikon → tittel → beskrivelse

**Forbedringer:**
- ✅ Font-størrelser: display (56px) → h1 (48px) → h2 (36px) → h3 (28px)
- ✅ Font-vekter: semibold for headings, normal for body
- ✅ Visuell vekt: større spacing rundt viktige elementer

## 3. Contrast (Kontrast) ✅

**Status:** Utmerket - WCAG 2.1 AA compliant

**Evaluering:**
- Høy kontrast mellom tekst og bakgrunn (4.5:1+ for normal tekst)
- Navy (#001F3F) på hvit gir 16.1:1 kontrast
- Cyan-darker (#2A7A92) på hvit gir 4.8:1 kontrast
- Knapper har høy kontrast for god lesbarhet
- Dark mode har tilstrekkelig kontrast

**Forbedringer:**
- ✅ Alle kontrastforhold er testet og dokumentert
- ✅ Automatiserte tester sikrer kontinuerlig compliance
- ✅ Strategisk bruk av kontrast for å fremheve CTA-knapper

## 4. Repetition (Repetisjon) ✅

**Status:** Godt implementert

**Evaluering:**
- Konsistent bruk av brand-farger (navy, cyan) gjennom hele siden
- Inter font brukes konsekvent for headings
- System fonts brukes konsekvent for body text
- Service cards har identisk struktur og styling
- Knapper har konsistent styling (.btn-primary, .btn-secondary)

**Forbedringer:**
- ✅ Design tokens i Tailwind config sikrer konsistens
- ✅ Gjenbrukbare komponenter (ServiceCard, Section, CTASection)
- ✅ Konsistent spacing-system (8px grid)

## 5. Proximity (Nærhet) ✅

**Status:** Godt implementert

**Evaluering:**
- Relaterte elementer er gruppert sammen:
  - Service cards er gruppert i samme seksjon
  - Feature list items er gruppert med visuell sammenheng
  - Footer-seksjoner er logisk gruppert
- Spacing mellom relaterte elementer er mindre enn mellom urelaterte

**Forbedringer:**
- ✅ Service cards bruker grid med konsistent gap
- ✅ Feature list items har visuell gruppering med ikoner
- ✅ Footer bruker grid for logisk gruppering

## 6. Balance (Balanse) ✅

**Status:** Godt implementert

**Evaluering:**
- Asymmetrisk balanse i service grid (2fr 1fr 1fr)
- Sentrert hero-seksjon gir fokus
- Footer har symmetrisk 3-kolonne layout
- Visuell vekt er balansert med whitespace

**Forbedringer:**
- ✅ Asymmetrisk grid gir visuell interesse
- ✅ Whitespace balanserer innhold
- ✅ CTA-seksjoner er sentrert for fokus

## 7. Color (Farge) ✅

**Status:** Godt implementert

**Evaluering:**
- Strategisk bruk av brand-farger:
  - Navy (#001F3F) for autoritet og profesjonalitet
  - Cyan (#5AB9D3) for innovasjon og tillit
- Farger brukes konsistent:
  - Navy for primærknapper og headings
  - Cyan for hover-states og akcenter
  - Nøytrale farger for bakgrunn og tekst

**Forbedringer:**
- ✅ Begrenset fargepalett (navy, cyan, nøytrale)
- ✅ Farger brukes strategisk for å kommunisere merkevare
- ✅ Dark mode støtter samme fargeprinsipper

## 8. Negative Space (Tomrom) ✅

**Status:** Godt implementert

**Evaluering:**
- Generøs whitespace rundt viktige elementer
- Section padding: py-24 md:py-32 (96px/128px)
- Margin mellom elementer: mb-6, mb-8, mb-10, mb-12
- Max-width på tekstblokker (max-w-4xl, max-w-65ch) for lesbarhet

**Forbedringer:**
- ✅ Generøs spacing mellom seksjoner
- ✅ Max-width på tekst for optimal lesbarhet
- ✅ Whitespace brukes for å fremheve viktige elementer

## Konklusjon

Fyrk-nettsiden følger alle 8 designprinsippene godt. Designet er:
- ✅ Veldig justert og organisert
- ✅ Klar hierarki
- ✅ Høy kontrast (WCAG 2.1 AA compliant)
- ✅ Konsistent bruk av farger og fonter
- ✅ Logisk gruppering av relaterte elementer
- ✅ Balansert layout
- ✅ Strategisk fargebruk
- ✅ Generøs whitespace

## Anbefalinger for videre forbedring

1. **Alignment:** Vurder å legge til visuelle guides i dev-tools for å verifisere justering
2. **Hierarchy:** Vurder å teste med "squint test" for å verifisere visuelt hierarki
3. **Contrast:** Fortsett med automatiserte tester (allerede implementert)
4. **Repetition:** Dokumenter design tokens tydeligere
5. **Proximity:** Vurder å teste med brukere for å verifisere logisk gruppering
6. **Balance:** Vurder A/B testing av asymmetrisk vs symmetrisk layout
7. **Color:** Vurder å dokumentere fargepsykologi i design system
8. **Negative Space:** Vurder å teste med brukere for optimal spacing

