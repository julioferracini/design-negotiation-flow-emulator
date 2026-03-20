# Nu Vibing Environment — Architecture Guide

A reusable template framework for prototyping negotiation flows (debt resolution, payment plans, lending) with full i18n support, centralized data, and configurable use cases.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [i18n System](#i18n-system)
4. [Use Case Engine](#use-case-engine)
5. [Screen Templates](#screen-templates)
6. [Formatters](#formatters)
7. [Transitions](#transitions)
8. [How-To Guides](#how-to-guides)
9. [Tone of Voice Guidelines](#tone-of-voice-guidelines)

---

## Architecture Overview

The project is organized into four layers:

```
┌─────────────────────────────────────────────┐
│              Config Layer                    │
│  useCases.ts  │  flows.ts  │  theme.ts      │
│  formatters.ts│  screens.registry.ts        │
├─────────────────────────────────────────────┤
│              i18n Layer (Pure Translations)  │
│  en.ts  │  es.ts  │  pt.ts  │  types.ts     │
├─────────────────────────────────────────────┤
│              Screens (Reusable Templates)    │
│  OfferHub  │  Conditions  │  Installments   │
│  (future screens...)                        │
├─────────────────────────────────────────────┤
│              Shared Components              │
│  ScreenTemplate  │  ShimmerPlaceholder      │
│  TransitionContainer                        │
└─────────────────────────────────────────────┘
```

### Core Principles

- **Locale files contain ONLY translatable strings** — no formatted amounts, no data arrays.
- **Numerical data lives in `config/useCases.ts`** — debt amounts, interest rates, discounts, offers, plans.
- **Screens are templates** — they read labels from i18n and data from the use case engine.
- **One locale file per language** — easy to manage, easy to hand off for translation review.
- **Type safety throughout** — TypeScript enforces all i18n keys exist in every language.

---

## Project Structure

```
├── App.tsx                    # Root navigator (custom stack)
├── config/
│   ├── flows.ts               # Experiment flow definitions
│   ├── formatters.ts          # Currency and string interpolation utilities
│   ├── index.ts               # Barrel exports
│   ├── screens.registry.ts    # Screen metadata registry
│   ├── theme.ts               # Design tokens (colors)
│   └── useCases.ts            # Use case engine (centralized data)
├── components/
│   ├── templates/
│   │   └── ScreenTemplate.tsx # Base screen layout
│   └── ui/
│       └── ShimmerPlaceholder.tsx
├── i18n/
│   ├── en.ts                  # English (US) translations
│   ├── es.ts                  # Spanish (Mexico) translations
│   ├── pt.ts                  # Portuguese (Brazil) translations
│   ├── types.ts               # TypeScript type definitions
│   └── index.ts               # Hook and utility exports
├── screens/
│   ├── StartScreen.tsx        # Language selector + screen browser
│   ├── OfferHubScreen.tsx     # Offer cards with tab navigation
│   ├── ConditionsScreen.tsx   # Suggested installment plans
│   └── InstallmentListModal.tsx # Full installment list (bottom sheet)
├── transitions/
│   ├── presets.ts             # Animation presets
│   ├── TransitionContainer.tsx
│   └── index.ts
└── docs/
    └── GUIDE.md               # This file
```

---

## i18n System

### File Structure

Each locale file (`en.ts`, `es.ts`, `pt.ts`) exports a single object conforming to the `Translations` type. Sections map 1:1 to screens:

| Section           | Screen / Purpose                    |
|-------------------|-------------------------------------|
| `start`           | Language selector (prototype-only)  |
| `picker`          | Screen browser (prototype-only)     |
| `common`          | Shared buttons (Continue, Back...)  |
| `offerHub`        | Offer Hub screen                    |
| `suggested`       | Suggested Conditions screen         |
| `installmentList` | Installment List modal              |
| `installmentValue`| Installment Value input screen      |
| `simulation`      | Simulation slider screen            |
| `dueDate`         | Due Date calendar screen            |
| `downPaymentValue`| Down Payment amount screen          |
| `downPaymentDate` | Down Payment date screen            |
| `summary`         | Summary / Review screen             |
| `terms`           | Terms & Conditions screen           |
| `pin`             | PIN confirmation overlay            |
| `loading`         | Processing animation screen         |
| `success`         | Success confirmation screen         |
| `feedback`        | Post-success feedback screen        |
| `errors`          | Error messages                      |
| `currency`        | Currency symbol and code            |
| `dates`           | Month/day names and labels          |

### String Interpolation

Use `{variable}` placeholders in locale strings:

```typescript
// In locale file:
discount: '{amount} de desconto',

// At render time:
import { interpolate } from '../config/formatters';
const text = interpolate(t.offerHub.discount, { amount: 'R$ 1.940,00' });
// → "R$ 1.940,00 de desconto"
```

### Key Naming Conventions

- Use **camelCase** for all keys.
- Prefix screen-specific offer titles with `offer` (e.g., `offerSolveAllMonthly`).
- Prefix badge labels with `badge` (e.g., `badgeMonthlyPayments`).
- Use `{amount}`, `{count}`, `{day}`, `{max}`, `{min}` as interpolation variables.

---

## Use Case Engine

### Purpose

`config/useCases.ts` centralizes all numerical data for a negotiation scenario. Changing one use case instantly updates all screens in the flow.

### Structure

```typescript
type UseCase = {
  id: string;
  name: string;
  description: string;
  locale: Locale;
  currency: CurrencyConfig;
  debt: DebtData;        // totalOriginal, interestRate, installmentRange
  tabs: TabConfig[];     // per-tab totals for Offer Hub
  offers: OfferConfig[]; // individual offer cards
  plans: PlanConfig[];   // suggested installment plans
  targetAmount: number;  // default simulation target
};
```

### Available Use Cases

| ID                  | Locale | Currency | Description                |
|---------------------|--------|----------|----------------------------|
| `debtResolutionBR`  | pt     | BRL      | Standard flow for Brazil   |
| `debtResolutionUS`  | en     | USD      | Standard flow for USA      |
| `debtResolutionMX`  | es     | MXN      | Standard flow for Mexico   |

### Helpers

- `getUseCaseForLocale(locale)` — returns the use case matching a locale.
- `getOffersForTab(useCase, tabKey)` — filters offers by tab.
- `getTabData(useCase, tabKey)` — returns totals for a tab.
- `generateInstallmentList(debt)` — generates 2-60 installment options with calculated discounts.
- `calculateDiscount(original, count)` — computes discount for a given installment count.

---

## Screen Templates

### Screen Types

Each screen is classified in `config/screens.registry.ts`:

| Type          | Behavior                                    |
|---------------|---------------------------------------------|
| `normal`      | Full-screen with header and scroll           |
| `bottomSheet` | Slides up from bottom, partial overlay       |
| `overlay`     | Transparent background, centered content     |
| `fullscreen`  | No header, fills entire screen               |

### Screen Status

- `done` — implemented and functional.
- `soon` — registered but not yet built.

### Registry Lookup

```typescript
import { getScreenMeta, getScreensByType, getScreensByStatus } from '../config';

const screen = getScreenMeta('offerHub');
const bottomSheets = getScreensByType('bottomSheet');
const readyScreens = getScreensByStatus('done');
```

---

## Formatters

### Currency Formatting

```typescript
import { formatCurrency } from '../config/formatters';

// Brazilian Real
formatCurrency(5230.00, { symbol: 'R$', code: 'BRL', decimalSeparator: ',', thousandSeparator: '.' });
// → "R$ 5.230,00"

// US Dollar
formatCurrency(1589.50, { symbol: '$', code: 'USD', decimalSeparator: '.', thousandSeparator: ',' });
// → "$ 1,589.50"

// Without symbol
formatCurrency(200.00, currency, { showSymbol: false });
// → "200,00"
```

### String Interpolation

```typescript
import { interpolate } from '../config/formatters';

interpolate('Up to {amount} OFF', { amount: '$ 463.00' });
// → "Up to $ 463.00 OFF"

interpolate('{count} installments of {amount}', { count: 6, amount: 'R$ 201,96' });
// → "6 installments of R$ 201,96"
```

---

## Transitions

Available presets in `transitions/presets.ts`:

| Preset      | Effect                                  |
|-------------|----------------------------------------|
| `none`      | No animation                           |
| `fade`      | Crossfade                              |
| `slideLeft` | Slide from right to left               |
| `slideUp`   | Slide from bottom to top               |
| `pushIn`    | Background shrinks, foreground slides up |

Use `TransitionContainer` for screen-to-modal transitions.

---

## How-To Guides

### Add a New Screen

1. Create `screens/MyNewScreen.tsx`.
2. Add the screen entry to `config/screens.registry.ts` with name, type, and status.
3. Add a translation section to `i18n/types.ts` (add type definition).
4. Add translations to `en.ts`, `es.ts`, `pt.ts`.
5. Add the screen to the appropriate flow in `config/flows.ts`.
6. Wire it into `App.tsx` navigation.

### Add a New Language

1. Create `i18n/xx.ts` following the `Translations` type.
2. Add the locale code to `Locale` type in `i18n/types.ts`.
3. Import and register in `i18n/index.ts` (`LANG_MAP`, `SUPPORTED_LOCALES`, `LOCALE_FLAGS`).
4. Add a matching use case in `config/useCases.ts` with the appropriate currency.
5. Add language option to `start.languages` in all locale files.

### Add a New Currency

1. Define a `CurrencyConfig` in your use case:
   ```typescript
   currency: { symbol: '€', code: 'EUR', decimalSeparator: ',', thousandSeparator: '.' }
   ```
2. Add a `currency` section to the locale file:
   ```typescript
   currency: { symbol: '€', code: 'EUR' }
   ```
3. Use `formatCurrency()` in screens — it reads from the use case config.

### Create a New Use Case

1. Add a new entry to `USE_CASES` in `config/useCases.ts`.
2. Define debt data, offers, plans, and target amount.
3. Set the appropriate locale and currency.
4. To activate it, change `ACTIVE_USE_CASE_ID` or use `getUseCaseForLocale()`.

---

## Tone of Voice Guidelines

### Portuguese (Brazil) — Nu Tone

**Characteristics:** Objective, caring, witty, tuned-in.

| Do                          | Don't                        |
|-----------------------------|------------------------------|
| "Acertar as contas"         | "Realizar o pagamento"       |
| "Ficou bom"                 | "Confirmar seleção"          |
| "Tudo certo!"               | "Operação concluída"         |
| "Ops, algo deu errado"      | "Erro no processamento"      |
| Use "pra" instead of "para" | Overly formal language       |

### English (US)

**Characteristics:** Clear, straightforward, professional but approachable.

| Do                    | Don't                          |
|-----------------------|--------------------------------|
| "Settle balance"      | "Execute debt settlement"      |
| "Looks good"          | "Selection confirmed"          |
| "All set!"            | "Operation completed"          |
| Short, active voice   | Passive, bureaucratic language |

### Spanish (Mexico) — Nu Tone

**Characteristics:** Direct, close, with personality, current.

| Do                          | Don't                          |
|-----------------------------|--------------------------------|
| "Ponte al día"              | "Realice su pago"             |
| "Se ve bien"                | "Selección confirmada"        |
| "¡Todo listo!"              | "Operación completada"        |
| Use "tú" (informal)        | Use "usted" (formal)          |
| "Enganche" (downpayment)   | "Pago inicial"                |
| "Mensualidades" (payments)  | "Cuotas" in MX context        |

---

## Running the Project

```bash
npx expo start
```

Scan the QR code with Expo Go on your device.

### Expo Go (install via QR code)

If Expo Go is not installed yet, scan this QR code to open the official download page:

![Expo Go QR code](https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fexpo.dev%2Fgo)

Direct link: [https://expo.dev/go](https://expo.dev/go)

No Expo account is required to run this prototype in Expo Go.
