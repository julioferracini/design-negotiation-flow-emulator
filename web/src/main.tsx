import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { registerNuDSFonts } from './nuds/fonts';

// Register Nubank typefaces before React mounts so every first paint has
// the correct font-family resolved — otherwise some users were seeing the
// Inter fallback momentarily (or permanently, if CSS url() resolution was
// flaky in their pipeline). See `./nuds/fonts.ts` for the full rationale.
registerNuDSFonts();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
