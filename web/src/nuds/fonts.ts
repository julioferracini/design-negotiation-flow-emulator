/**
 * Nubank typeface registration for the web prototype.
 *
 * Imports the three composite weights we actually use as ES module `?url`
 * assets so Vite processes them into its asset graph (dev-server path,
 * GitHub-Pages base path, content-hashed cache-busting — all handled
 * automatically). The @font-face block is then injected once at boot from
 * the guaranteed-correct URLs.
 *
 * Why this module exists on top of the CSS @font-face already in index.css:
 *   - CSS `url('./assets/fonts/*.woff2')` works in dev but has flaky
 *     resolution with some PostCSS/Tailwind pipelines, and we saw the
 *     fonts falling through to the Inter fallback on Web while the
 *     Expo Go twin rendered the real Nubank typefaces.
 *   - Importing the `.woff2` file as a module guarantees Vite emits the
 *     asset and returns the final URL, which we then hand-inject. This
 *     sidesteps every CSS url()-rewrite edge case.
 *   - `font-display: block` ensures typography is rendered with the real
 *     Nu Sans, not the fallback, even during the first 100 ms of load —
 *     avoiding the momentary flash of Inter some users reported.
 *
 * Kept the pure-CSS `@font-face` declarations in `index.css` as a belt-
 * and-suspenders backup (identical family names + font-weights), so even
 * if this JS never runs (e.g. some SSR snapshot) the styles still resolve.
 */

import nuSansTextRegularUrl from '../assets/fonts/NuSansText-Regular.woff2?url';
import nuSansTextSemiboldUrl from '../assets/fonts/NuSansText-Semibold.woff2?url';
import nuSansDisplayMediumUrl from '../assets/fonts/NuSansDisplay-Medium.woff2?url';

let registered = false;

export function registerNuDSFonts(): void {
  if (registered || typeof document === 'undefined') return;
  registered = true;

  const css = `
    @font-face {
      font-family: 'NuSansText-Regular';
      src: local('NuSansText-Regular'), local('Nu Sans Text Regular'), local('Nu Sans Text'), local('NuSansText'),
           url('${nuSansTextRegularUrl}') format('woff2');
      font-display: block;
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'NuSansText-Semibold';
      src: local('NuSansText-Semibold'), local('Nu Sans Text Semibold'),
           url('${nuSansTextSemiboldUrl}') format('woff2');
      font-display: block;
      font-weight: 600;
      font-style: normal;
    }
    @font-face {
      font-family: 'NuSansDisplay-Medium';
      src: local('NuSansDisplay-Medium'), local('Nu Sans Display Medium'),
           url('${nuSansDisplayMediumUrl}') format('woff2');
      font-display: block;
      font-weight: 500;
      font-style: normal;
    }
    @font-face {
      font-family: 'Nu Sans Text';
      src: local('Nu Sans Text'), local('NuSansText'), local('NuSansText-Regular'),
           url('${nuSansTextRegularUrl}') format('woff2');
      font-display: block;
    }
    @font-face {
      font-family: 'Nu Sans Display';
      src: local('Nu Sans Display'), local('NuSansDisplay'), local('NuSansDisplay-Medium'),
           url('${nuSansDisplayMediumUrl}') format('woff2');
      font-display: block;
    }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-nuds-fonts', '');
  style.textContent = css;
  // Prepend so these font-face rules are available before any other stylesheet
  // (Tailwind, platform.css, prototype.css) might reference the family names.
  document.head.insertBefore(style, document.head.firstChild);

  // Nudge the browser to start fetching the woff2 files immediately, not on
  // first paint. Uses the same URLs we just registered.
  for (const href of [nuSansTextRegularUrl, nuSansTextSemiboldUrl, nuSansDisplayMediumUrl]) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'font';
    preload.type = 'font/woff2';
    preload.href = href;
    preload.crossOrigin = 'anonymous';
    document.head.appendChild(preload);
  }
}
