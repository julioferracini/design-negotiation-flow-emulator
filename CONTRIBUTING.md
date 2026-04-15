# Contributing — Keeping Web and Expo Go in sync

This project has two rendering targets that must evolve together:

| Layer | Where |
|---|---|
| **Expo Go** (React Native) | `screens/`, `App.tsx`, `config/`, `i18n/` |
| **Web / Vite** (GitHub Pages) | `web/src/` |
| **Shared logic** (both targets) | `shared/`, `config/emulatorConfig.ts`, `config/financialCalculator.ts`, `config/formatters.ts`, `config/useCases.ts` |

---

## The single source of truth rule

Everything in `shared/` and `config/` is platform-agnostic.
**Never duplicate** logic that already lives there.

| Need | Where it lives |
|---|---|
| Translations / locale types | `shared/i18n/` |
| Emulator state types & pure fns | `config/emulatorConfig.ts` |
| Financial calculation | `config/financialCalculator.ts` |
| Currency formatters | `config/formatters.ts` |
| Use-case / offer data | `config/useCases.ts` |
| Shared TS types | `shared/types/` |
| Shared product-line config | `shared/config.ts` |

The `i18n/` files in the root are **thin proxies** — they re-export from `shared/i18n/`. Do not add content there.

---

## Adding a new screen

### 1. Add the translation keys

Edit **all four** locale files (`shared/i18n/pt-BR.ts`, `en-US.ts`, `es-CO.ts`, `es-MX.ts`) and add the new section to `shared/i18n/types.ts` → `Translations`.

### 2. Create the Expo screen

File: `screens/MyNewScreen.tsx`

Minimal contract:

```tsx
export default function MyNewScreen({
  locale = 'pt-BR',
  onBack,
}: {
  locale?: Locale;
  onBack?: () => void;
}) { ... }
```

- Read rules/debt from `useEmulatorConfig()` — never call `getRules(locale)` or `getSimDebtData(locale)` directly in a screen.
- Use `useTranslation(locale)` for all copy.
- Use `getUseCaseForLocale(locale)` only for currency/display data that isn't in the emulator context.

### 3. Register the screen in Expo

In `App.tsx`:
- Add a union member to `type Screen`
- Add a `case` in `handleNavigate`
- Add a `case` in `renderScreen`
- Add a depth value in `getDepth`

### 4. Register the screen in ConfigScreen

In `screens/ConfigScreen.tsx`:
- Add to `SCREEN_LABELS`
- Add to `SCREEN_ORDER`
- If it has a Preview button, add to `READY_SCREENS` and `SCREEN_NAV_MAP`

### 5. Add the Web screen (if applicable)

If the screen is part of the prototype emulator:
- Create `web/src/screens/MyNewScreen.tsx`
- Add a case to `resolveScreenType` in `web/src/App.tsx`
- Add a `motion.div` block in the `EmulatorSection` component

---

## Modifying financial rules

Rules flow like this:

```
shared/config (UseCaseDefinition defaults)
  → config/emulatorConfig.ts (resolveEffectiveRules)
    → EmulatorConfigContext (effectiveRules)
      → screens (useEmulatorConfig().effectiveRules)
        → config/financialCalculator.ts calculate(input, locale, rulesOverride)
```

To change a default: edit `config/emulatorConfig.ts → RULE_DEFAULTS`.
To let users override: the web ParameterPanel and Expo ConfigScreen already expose overrides via context.

---

## Modifying the emulator state

`config/emulatorConfig.ts` is the **shared pure layer** — no React, no platform APIs.
Both `web/src/context/EmulatorConfigContext.tsx` and `config/EmulatorConfigContext.tsx` (Expo) consume it.

If you need to add a new config field:
1. Add the type and default to `config/emulatorConfig.ts`
2. Add it to both context files
3. Expose it via `useEmulatorConfig()` in both

---

## Type-checking

Run before every commit:

```bash
# Expo / shared
npx tsc --noEmit

# Web
cd web && npx tsc --noEmit
```

Both must pass with zero errors.

---

## AI tooling workflow

Different AI tools have different strengths in this project. Use each where it excels.

| Task | Best tool |
|---|---|
| Architecture decisions, shared layer, financial logic | **Claude Code** |
| TypeScript types, context/config structure, debugging | **Claude Code** |
| Building screens (layout, visual fidelity, Figma match) | **Cursor** |
| Pixel-perfect iteration on components | **Cursor** |
| Reviewing Cursor-generated code for architectural correctness | **Claude Code** |

**Why:** Claude Code cannot see the rendered output or Figma directly — it interprets from descriptions, which makes visual iteration slow and imprecise. Cursor has hot-reload feedback and Figma MCP integration, making it far more effective for UI work. Use them together, not interchangeably.

---

## What NOT to do

- ❌ Don't call `getRules(locale)` or `getSimDebtData(locale)` inside a screen — use `useEmulatorConfig()`.
- ❌ Don't import from `@nubank/nuds-vibecode-react-native` in `web/src/` — it's org-restricted and will break GitHub Pages.
- ❌ Don't add content to `i18n/pt-BR.ts` (or other root locale files) — they're proxies.
- ❌ Don't add a screen only to one target without a plan for the other.
