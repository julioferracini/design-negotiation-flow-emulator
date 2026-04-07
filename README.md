# Negotiation Flow – Product Platform

React Native + Expo prototype to test negotiation flows quickly.

**Repository:** [github.com/julioferracini/design-negotiation-flow-emulator](https://github.com/julioferracini/design-negotiation-flow-emulator)

**Web Demo:** [julioferracini.github.io/design-negotiation-flow-emulator](https://julioferracini.github.io/design-negotiation-flow-emulator/)

**Contact:** [Julio Ferracini on Slack](https://nubank.enterprise.slack.com/team/U074WLC2SJG)

---

## Screen Versions

| Screen | Status | Version | Platform |
|--------|--------|---------|----------|
| Offer Hub | Done | `1.0.0` | Web + Expo |
| Suggested Conditions | Done | `1.0.0` | Web + Expo |
| Simulation | Done | `1.0.0` | Web + Expo |
| Summary | Done | `1.0.0` | Web + Expo |
| Installment Value | Done | `1.0.0` | Web + Expo |
| Due Date | Pending | — | — |
| Downpayment Value | Pending | — | — |
| Downpayment Due Date | Pending | — | — |
| Terms & Conditions | Pending | — | — |
| PIN | Pending | — | — |
| Loading | Pending | — | — |
| Feedback | Pending | — | — |

---

## Platforms

### Expo Go (Mobile)

Use this QR code to open the official Expo Go page on your phone:

![QR code to install Expo Go](https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fexpo.dev%2Fgo)

Direct link: [https://expo.dev/go](https://expo.dev/go)

You do not need an Expo account to run this prototype in Expo Go.

```bash
npm install
npx expo start
```

- iOS: open the Camera app and scan the QR code shown in the terminal.
- Android: open Expo Go and use its QR scanner.

### Web Emulator (Local)

```bash
cd web
npm install
npm run dev
```

Opens at `http://localhost:3000` — split-screen layout with configuration panel and iPhone viewport.

### GitHub Pages (Demo)

Deployed automatically on every push to the `develop` branch.

Live at: **https://julioferracini.github.io/design-negotiation-flow-emulator/**

---

## Architecture

### Overview

The architecture separates "text", "business data", "screens", and "animations".
This makes it easier to test new versions without rebuilding the whole app.

| Layer | Responsibility | Main files |
|---|---|---|
| Config | Flow rules and business data | `config/useCases.ts`, `config/flows.ts`, `config/screens.registry.ts` |
| i18n | Language content | `i18n/translations.ts`, `i18n/types.ts`, `i18n/pt-BR.ts`, etc. |
| Screens | Reusable screen templates | `screens/StartScreen.tsx`, `screens/ConditionsScreen.tsx`, etc. |
| Shared | Platform-agnostic types and tokens | `shared/types/`, `shared/tokens/`, `shared/config/` |
| Web | Vite + React + Tailwind emulator | `web/src/` |

### i18n system

The i18n layer is split into two modules for cross-platform compatibility:

| Module | Purpose | React dependency |
|---|---|---|
| `i18n/translations.ts` | Pure data: locale maps, `getTranslations()`, `interpolate()` | No |
| `i18n/index.ts` | Re-exports everything + `useTranslation()` React hook | Yes |

- **Expo screens** import from `i18n/` (with React hook).
- **Web screens** import from `i18n/translations` (pure, no React).
- **Config files** import only types from `i18n/types`.

Each locale file follows the same `Translations` type, so all languages keep the same keys.

### How data flows

1. The active locale picks UI text from `i18n/`.
2. The active use case loads numeric values from `config/useCases.ts`.
3. The active flow in `config/flows.ts` defines screen order.
4. Each screen combines text + data and renders UI.
5. `transitions/` applies animation between screens.

### Folder structure

```text
design-negotiation-flow-emulator/
├── App.tsx                # Expo entry point
├── config/                # flows, use cases, screen registry, formatters
├── i18n/                  # translations (pure) + React hook
│   ├── translations.ts    # pure data layer (no React)
│   ├── index.ts           # re-exports + useTranslation hook
│   ├── types.ts           # Locale, Translations types
│   └── pt-BR.ts, ...      # locale files
├── screens/               # Expo flow screens
├── shared/                # platform-agnostic types and tokens
├── components/            # visual foundation (template, shimmer, etc.)
├── transitions/           # animation presets
├── web/                   # Vite + React + Tailwind web emulator
│   ├── src/stubs/         # token stubs for CI (GitHub Pages)
│   ├── vite.config.ts     # default config (Vercel / local dev)
│   └── vite.config.ghpages.ts  # GitHub Pages config (subpath + stubs)
└── .github/workflows/     # CI: GitHub Pages deploy on develop
```

### Architecture principles

- Locale files contain only translatable text.
- Business values (debt, interest, discount, installments) stay centralized in `useCases`.
- Screens work as templates, reusable across scenarios.
- A central screen registry keeps navigation consistent.
- TypeScript typing catches missing keys and structure errors early.

### Transitions

Main presets:
- `pushIn` for overlays/modals;
- `slideUp` for bottom sheets;
- `slideLeft` and `slideRight` for forward/back navigation;
- `fade` for subtle swaps.

## Documentation

- Technical guide (Markdown): `docs/GUIDE.md`
- Visual guide (HTML): `docs/guide.html`
