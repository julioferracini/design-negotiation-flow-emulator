# UI Building Blocks — Development Guide

## Overview

UI Building Blocks are the **prototype screens** that simulate the real negotiation flow. They must use NuDS design tokens and components to maintain visual fidelity with the production app.

This guide defines the rules for creating and editing Building Block screens.

## Architecture

```
Platform Pages (HomePage, GlossaryPage, etc.)
│   → Own styling (platform.css, var(--nf-*))
│   → NOT NuDS-bound
│
UI Building Blocks (OfferHubScreen, SimulationScreen, etc.)
│   → NuDS tokens + components
│   → Custom extensions in prototype.css
│   → Delivered to BOTH Web and Expo Go
│
Shared Foundation
    → @nubank/nuds-vibecode-tokens (design tokens)
    → shared/ (data, i18n, types, config)
    → config/ (financial calculator, formatters)
```

## Dual-Platform Delivery

Every UI Building Block exists in two places:

| Platform | Path | Theme Access |
|----------|------|--------------|
| **Expo Go** | `screens/*Screen.tsx` | `const theme = useNuDSTheme()` |
| **Web** | `web/src/screens/*Screen.tsx` | `const { nuds } = useTheme()` |

**Rule**: Any change to a Building Block MUST be made in both files.

## Styling Hierarchy

When styling a Building Block, always try to resolve in this order:

### 1. NuDS Token (highest priority)

All visual values should come from the theme:

| What | Token | Example |
|------|-------|---------|
| Brand color | `theme.color.main` | Button background, accent borders |
| Primary text | `theme.color.content.primary` | Headings, body text |
| Secondary text | `theme.color.content.secondary` | Labels, captions |
| Success green | `theme.color.positive` | Savings badges, discount text |
| Error red | `theme.color.negative` | Validation errors |
| Page background | `theme.color.background.screen` | Screen fill |
| Subtle background | `theme.color.background.secondary` | Cards, sections |
| Dividers | `theme.color.border.secondary` | Separator lines |
| Spacing | `theme.spacing[5]` | Padding, margin (= 20px) |
| Radius | `theme.radius.xl` | Card corners (= 24px) |
| Typography | `theme.typography.titleXSmall` | Font family, size, line height |
| Elevation | `theme.elevation.level1` | Shadow (RN) / `boxShadow.level1` (Web) |

**Never hardcode hex colors** like `#0c7a3a` or `#D01D1C` in Building Block screens.

### 2. NuDS Component

Use NuDS components before building custom elements:

| Component | Expo Go | Web |
|-----------|---------|-----|
| Text | `<NText variant="titleXSmall">` | `<NText variant="titleXSmall" theme={t}>` |
| Badge | `<Badge color="success" label="...">` | `<Badge color="success" label="..." theme={t}>` |
| Button | `<Button variant="primary" label="..." expanded>` | `<Button variant="primary" label="..." expanded theme={t}>` |
| Bottom Sheet | `<BottomSheet visible onClose title showHandle>` | `motion.div` + `.nf-proto__sheet` |
| Top Bar | `<TopBar variant="modal" title="...">` | `<TopBar variant="modal" title="..." theme={t}>` |

### 3. BEM CSS Class (Web only)

For interactive states and custom UI that NuDS doesn't cover:

```css
/* Card hover — from prototype.css */
.nf-proto__card:hover {
  box-shadow: var(--nuds-elevation-level2);
}

/* Keypad key press */
.nf-proto__keypad__key:active {
  background: var(--nuds-bg-secondary);
}
```

Classes live in `web/src/styles/prototype.css` with namespace `.nf-proto__*`.

### 4. Inline Style (lowest priority)

Only for values that must be computed at runtime:
- Motion/animation values (`framer-motion`, RN `Animated`)
- Conditional values based on state
- One-off layout unique to a single instance

## Platform Equivalence Map

| Concept | Expo Go (RN) | Web (Vite) |
|---------|--------------|------------|
| Theme | `useNuDSTheme()` | `useTheme().nuds` |
| NuDS components | `@nubank/nuds-vibecode-react-native` | `web/src/nuds/` |
| Bottom Sheet | NuDS `<BottomSheet>` | `motion.div` + prototype.css |
| Elevation | `theme.elevation.level1` (shadow props) | `boxShadow.level1` (CSS string) |
| CSS vars | N/A | `var(--nuds-*)` via `injectNuDSCSSVars()` |
| BEM classes | N/A | `.nf-proto__*` from prototype.css |

## Building Block Screens

### Negotiation Pack

| Screen | Expo | Web | Status |
|--------|------|-----|--------|
| Offer Hub | `screens/OfferHubScreen.tsx` | `web/src/screens/OfferHubScreen.tsx` | NuDS migrated |
| Eligibility | `screens/EligibilityScreen.tsx` | `web/src/screens/EligibilityScreen.tsx` | NuDS migrated |
| Input Value | `screens/InputValueScreen.tsx` | `web/src/screens/InputValueScreen.tsx` | NuDS migrated |
| Simulation | `screens/SimulationScreen.tsx` | `web/src/screens/SimulationScreen.tsx` | NuDS migrated |
| Suggested Conditions | `screens/ConditionsScreen.tsx` | `web/src/screens/SuggestedConditionsScreen.tsx` | NuDS migrated |
| Due Date | `screens/DueDateScreen.tsx` | `web/src/screens/DueDateScreen.tsx` | NuDS migrated |
| Summary | `screens/SummaryScreen.tsx` | `web/src/screens/SummaryScreen.tsx` | NuDS migrated |
| Terms & Conditions | `screens/TermsScreen.tsx` | `web/src/screens/TermsScreen.tsx` | NuDS migrated |

### System Pack

| Screen | Expo | Web | Status |
|--------|------|-----|--------|
| PIN | `screens/PinCodeSheet.tsx` | `web/src/screens/PinCodeSheet.tsx` | Done (DND-2170) |
| Loading | `screens/LoadingScreen.tsx` | — | Expo only |
| Feedback | `screens/FeedbackScreen.tsx` | — | Expo only |

## Checklist

Before marking a Building Block task as complete:

- [ ] All colors use NuDS tokens (no `#hex` literals)
- [ ] All text uses `<NText>` with typography variants
- [ ] All spacing uses `theme.spacing[N]`
- [ ] All border-radius uses `theme.radius.*`
- [ ] Bottom sheets use NuDS `<BottomSheet>` on Expo
- [ ] Change is delivered to **both** platforms
- [ ] Web uses `nuds` from `useTheme()` (not just `palette`)
- [ ] Expo imports from `@nubank/nuds-vibecode-react-native`
