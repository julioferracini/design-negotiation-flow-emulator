# Nu Hiring / Negotiation Flow • Magic App

React Native + Expo prototype to test negotiation flows quickly.

**Repository:** [github.com/julioferracini/design-negotiation-flow-emulator](https://github.com/julioferracini/design-negotiation-flow-emulator)

## Priority: Expo Go (QR code)

Use this QR code to open the official Expo Go page on your phone:

![QR code to install Expo Go](https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fexpo.dev%2Fgo)

Direct link: [https://expo.dev/go](https://expo.dev/go)

You do not need an Expo account to run this prototype in Expo Go.

## Run the project

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npx expo start
```

3. Open it on your phone:
- iOS: open the Camera app and scan the QR code shown in the terminal.
- Android: open Expo Go and use its QR scanner.

## Architecture Proposal (detailed)

### Overview

The architecture separates "text", "business data", "screens", and "animations".  
This makes it easier to test new versions without rebuilding the whole app.

| Layer | Responsibility | Main files |
|---|---|---|
| Config | Flow rules and business data | `config/useCases.ts`, `config/flows.ts`, `config/screens.registry.ts` |
| i18n | Language content | `i18n/en.ts`, `i18n/es.ts`, `i18n/pt.ts`, `i18n/types.ts` |
| Screens | Reusable screen templates | `screens/StartScreen.tsx`, `screens/ConditionsScreen.tsx`, etc. |
| Shared/UI | Base visual components | `components/templates/ScreenTemplate.tsx`, `transitions/TransitionContainer.tsx` |

### How data flows

1. The active locale picks UI text from `i18n/`.
2. The active use case loads numeric values from `config/useCases.ts`.
3. The active flow in `config/flows.ts` defines screen order.
4. Each screen combines text + data and renders UI.
5. `transitions/` applies animation between screens.

### Architecture principles

- Locale files contain only translatable text.
- Business values (debt, interest, discount, installments) stay centralized in `useCases`.
- Screens work as templates, reusable across scenarios.
- A central screen registry keeps navigation consistent.
- TypeScript typing catches missing keys and structure errors early.

### Folder structure (summary)

```text
design-negotiation-flow-emulator/
├── App.tsx
├── config/        # flows, use cases, screen registry, formatters
├── i18n/          # translations and translation types
├── screens/       # flow screens
├── components/    # visual foundation (template, shimmer, etc.)
├── transitions/   # animation presets
└── docs/          # technical and visual docs
```

### Use Case Engine (business layer)

In `config/useCases.ts`, each use case defines:
- currency and locale;
- debt data;
- tabs and offers;
- suggested plans;
- target amount for simulation.

Result: to test a new country or scenario, update the use case instead of rewriting all screens.

### i18n system (content layer)

Each locale file follows the same `Translations` type, so all languages keep the same keys.

Interpolation example:

```ts
interpolate('{count} installments of {amount}', { count: 6, amount: 'R$ 201,96' });
```

### Navigation and screen states

- `config/screens.registry.ts` classifies screens by type (`normal`, `bottomSheet`, `overlay`, `fullscreen`).
- It also marks status (`done` or `soon`) to show implementation progress.
- `config/flows.ts` builds the journey for each experiment.

### Transitions

Main presets:
- `pushIn` for overlays/modals;
- `slideUp` for bottom sheets;
- `slideLeft` and `slideRight` for forward/back navigation;
- `fade` for subtle swaps.

## Documentation

- Technical guide (Markdown): `docs/GUIDE.md`
- Visual guide (HTML): `docs/guide.html`
