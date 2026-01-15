# UI/UX Test Suite

Comprehensive test suite validating UI/UX guidelines for the Fyrk website and AI tools (OKR-sjekken, Konseptspeilet, Antakelseskart).

## Test Categories

### 1. Accessibility (`accessibility.spec.ts`)
- WCAG 2.1 AA compliance
- Semantic HTML structure
- ARIA labels and roles
- Color contrast
- Focus indicators
- Screen reader support
- Touch target sizes

### 2. Keyboard Navigation (`keyboard-navigation.spec.ts`)
- Tab order
- Arrow key navigation
- Home/End keys
- Enter/Space activation
- Focus management
- Keyboard shortcuts

### 3. Dark Mode (`dark-mode.spec.ts`)
- System preference detection
- Color contrast in dark mode
- Status color preservation
- Dark gray backgrounds (not pure black)
- Shadow adaptations
- Layout consistency

### 4. Responsive Design (`responsive.spec.ts`)
- Multiple viewport sizes
- Mobile/tablet/desktop layouts
- Touch target sizes
- Font size scaling
- Content width optimization
- Orientation changes

### 5. Typography (`typography.spec.ts`)
- Base font size (16px+)
- Line height (1.4-1.8)
- Typographic hierarchy
- Line length limits (65ch)
- Font family consistency
- Text zoom support

### 6. Microinteractions (`microinteractions.spec.ts`)
- Hover feedback
- Loading states
- Panel transitions
- Copy feedback
- Smooth transitions
- Reduced motion support
- Performance (60fps)

### 7. Internationalization (`internationalization.spec.ts`)
- Text expansion support
- Multiline wrapping
- Clear language
- Universal icons
- RTL support
- Locale-aware formatting

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:accessibility
npm run test:keyboard
npm run test:dark-mode
npm run test:responsive
npm run test:typography
npm run test:microinteractions

# Run with UI
npm run test:ui

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on mobile
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari
```

## Test Coverage

These tests validate compliance with:
- ✅ WCAG 2.1 AA accessibility standards
- ✅ Material Design guidelines
- ✅ Apple Human Interface Guidelines
- ✅ Responsive design best practices
- ✅ Internationalization requirements
- ✅ Performance benchmarks

## Continuous Integration

Tests are designed to run in CI/CD pipelines with:
- Multiple browser support (Chromium, Firefox, WebKit)
- Mobile device emulation
- Accessibility auditing with axe-core
- Screenshot on failure
- Trace collection for debugging




