# FYRK UX Design Contract v1.0

Binding rules for all UI/UX changes on fyrk.no. Updated only by explicit decision.

---

## 1) Contract Summary

- All contact CTAs **MUST** use label "Ta kontakt" and href `mailto:hei@fyrk.no`, except the header CTA, which points to `/#kontakt` (the contact section on the front page).
- All contact CTAs **MUST NOT** use icons (no email icon, no arrow icon).
- Same action **MUST** have same visual treatment in the same context type.
- Primary CTA (`btn btn-primary`) **MUST NOT** appear more than once per visual section.
- Inline links **MUST** only be used inside body text paragraphs.
- External links **MUST** use `target="_blank" rel="noopener noreferrer"`.
- External links **MUST NOT** have external-link icons.
- All interactive elements **MUST** have visible focus state.
- All clickable targets **MUST** meet 44px minimum touch target.
- New CTA variants **MUST NOT** be introduced without updating this contract.
- Labels **MUST** follow the approved label list (section 4).
- Tool page footers **MUST** use the shared `ToolFooter.astro` component.

---

## 2) Allowed Actions & Link Types

### Internal route
- `href`: Absolute path (e.g. `/konsulenter`, `/verktoy`)
- `target`: None (same tab)
- `aria-label`: Not required (label text is sufficient)
- Icon: None
- Tracking: `data-track-button` on primary CTAs only

### External link
- `href`: Full URL
- `target`: `_blank`
- `rel`: `noopener noreferrer`
- `aria-label`: Not required if label includes destination (e.g. "LinkedIn")
- Icon: Allowed only for LinkedIn in the consultant profile inline context (not in buttons)
- Tracking: `data-track-button` where applicable

### Mailto
- `href`: `mailto:hei@fyrk.no`
- `target`: None
- `aria-label`: Not required
- Icon: None
- Tracking: `data-track-button` on primary instances

### Anchor link
- Usage: **Restricted.** Allowed for skip-links (`#main-content`), within-page anchors on tool pages (e.g. `#skriv`), and the single header contact CTA (`/#kontakt`), which takes the visitor to the contact section on the front page.
- **MUST NOT** be used for footer navigation or for regular header nav items.
- **MUST NOT** cross pages, apart from the header contact CTA above.

---

## 3) CTA System

### Primary CTA
- Class: `btn btn-primary no-underline`
- When: Main action per section — contact CTA, hero CTA, service page bottom CTA
- Max: One per visual section
- Forbidden: Multiple primary CTAs side by side (use primary + outline)

### Secondary CTA (outline)
- Class: `btn btn-outline no-underline`
- When: Alternative action next to a primary CTA (e.g. "LinkedIn" next to "Ta kontakt")
- Forbidden: Standalone without a primary CTA nearby

### Inline link
- Class: `text-brand-navy underline hover:text-brand-cyan-darker` (in body text) or `underline hover:text-brand-navy` (in fine print)
- When: Links within paragraph text (cross-references, legal links, "Les mer om personvern")
- Forbidden: As standalone CTAs outside body text

### Footer link
- Class: `hover:text-brand-navy transition-colors no-underline`
- When: Footer navigation only
- Forbidden: Outside footer context

---

## 4) Copy Rules

### Approved labels

| Label | Action | Context |
|-------|--------|---------|
| Ta kontakt | `/#kontakt` in the header, `mailto:hei@fyrk.no` elsewhere | Contact CTAs (header, sections, pages) |
| Send e-post | `mailto:hei@fyrk.no` | Contact section primary button only |
| LinkedIn | Company LinkedIn (external) | Contact section, footer |
| Se full CV på LinkedIn | Personal LinkedIn (external) | Consultant profile inline only |
| Prøv [verktøynavn] | Tool page (internal) | Verktøy page cards |
| Lag [verktøynavn] | Tool page (internal) | Verktøy page cards (beslutningslogg, pre-mortem) |
| Les mer om personvern | `/personvern` | Fine print inline links |
| Personvern | `/personvern` | Footer, tool footers |
| Vilkår | `/vilkar` | Footer, tool footers |
| Konsulenter | `/konsulenter` | Header nav, footer |
| Verktøy | `/verktoy` | Header nav, footer |

### Forbidden synonyms

| Forbidden | Use instead |
|-----------|------------|
| Avklar behov | Ta kontakt |
| Start en uforpliktende samtale | Ta kontakt |
| Kontakt | Ta kontakt |
| Les mer → (as CTA button) | Make card clickable instead |

---

## 5) Icon Policy

- **Mailto actions: No icons.** The pattern is learned after one interaction.
- **External links: No icons.** B2B audience, no external-link indicator needed.
- **Exception:** LinkedIn SVG icon allowed in the consultant profile inline link ("Se full CV på LinkedIn") to differentiate it from surrounding text.
- **Rule: No mixed states.** If one instance of an action has an icon, all instances must. If one doesn't, none should.

---

## 6) Component Contract

| Purpose | Component | File |
|---------|-----------|------|
| Page layout | `BaseLayout.astro` | `src/layouts/BaseLayout.astro` |
| Tool page layout | `MinimalLayout.astro` | `src/layouts/MinimalLayout.astro` |
| Header (all pages) | `LandingHeader.astro` | `src/components/landing/LandingHeader.astro` |
| Footer (marketing pages) | `LandingFooter.astro` | `src/components/landing/LandingFooter.astro` |
| Footer (tool pages) | `ToolFooter.astro` | `src/components/ui/ToolFooter.astro` |
| Breadcrumb | `Breadcrumb.astro` | `src/components/ui/Breadcrumb.astro` |
| Contact section | `ContactSection.astro` | `src/components/landing/ContactSection.astro` |
| Consultant profile | `ConsultantProfile.astro` | `src/components/konsulenter/ConsultantProfile.astro` |
| Testimonials | `TestimonialsSection.astro` | `src/components/konsulenter/TestimonialsSection.astro` |

### Rules
- **Do not create new header, footer, or CTA components** without updating this contract.
- **Do not inline footer markup** in page files — use `ToolFooter` or `LandingFooter`.
- **Do not duplicate card markup** — if a pattern is used on 2+ pages, extract to a component.
- All navigation data lives in `src/data/landing.ts`. Do not hardcode nav links in components.

---

## 7) Accessibility Minimums

These are non-negotiable:

- **Focus state:** All interactive elements must have `focus-visible:ring-2` or equivalent visible focus indicator.
- **Touch target:** Minimum 44x44px on all clickable elements (`min-h-[44px]` on links, `min-h-[48px]` on buttons).
- **Keyboard navigation:** All actions reachable via Tab. Mobile menu closeable via Escape.
- **Skip link:** Present on all page layouts (BaseLayout provides it; MinimalLayout pages must include their own).
- **Contrast:** Text on `bg-brand-navy` must be white. Text links must use `text-brand-navy` or stronger on white backgrounds.
- **ARIA:** Active nav links must have `aria-current="page"`. Mobile menu button must have `aria-expanded` and `aria-controls`.
- **Language:** `<html lang="no">` on all pages.

---

## 8) Enforcement

### PR Checklist (must pass before merge)

1. [ ] All "Ta kontakt" CTAs use `mailto:hei@fyrk.no`, except the header CTA, which uses `/#kontakt` — no other variants
2. [ ] No new CTA labels introduced outside approved list (section 4)
3. [ ] No icons on mailto or contact buttons
4. [ ] Primary CTA appears max once per visual section
5. [ ] External links have `target="_blank" rel="noopener noreferrer"`
6. [ ] No inline footer markup in tool pages — uses `ToolFooter.astro`
7. [ ] All interactive elements have visible focus state
8. [ ] Touch targets meet 44px minimum
9. [ ] No new component variants created without contract update

### Manual Audit Spots

When reviewing for consistency, check these locations in order:

1. **Header** — same on all pages? CTA label and href correct?
2. **Footer** — Konsulenter, Innsikt, Verktøy, LinkedIn, Personvern, Vilkår present?
3. **Konsulenter** — profile and collaboration section intact? LinkedIn label matches contract?
4. **Tool pages** — footer uses `ToolFooter`? Breadcrumb present on sub-pages?
5. **Contact section** (landing) — no icons on buttons? Label matches contract?
6. **`src/data/landing.ts`** — navLinks and contactContent labels match contract?
