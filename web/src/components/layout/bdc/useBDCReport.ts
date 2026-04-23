/**
 * useBDCReport — data provider for the BDC (Flutter NuDS) panel.
 *
 * Today: returns an EMPTY/disconnected payload for every screen, so the UI
 *        can render its prepared "not connected" empty states without any
 *        backend dependency.
 *
 * Tomorrow: swap the body of this hook with a real fetch (React Query, SWR,
 *           plain useEffect — up to the integration) that hits the BDC
 *           service with the current `screenKey` and returns live data in
 *           the same `BDCReport` shape. No UI changes required.
 */

import type { BDCReport } from './types';

const DISCONNECTED_REPORT: BDCReport = {
  connectionState: 'disconnected',
  platform: {
    label: 'Flutter',
    connected: false,
    pct: null,
    components: [],
    tokens: [],
    extensions: [],
    hardcoded: [],
  },
  repos: [
    { id: 'nuds', label: 'NuDS', sublabel: 'Pending integration', connected: false },
    { id: 'project', label: 'Projeto', sublabel: 'Pending integration', connected: false },
  ],
};

export function useBDCReport(_screenKey: string | null): BDCReport {
  // Intentionally unused today — kept in the signature so the future API
  // implementation doesn't change the callsite.
  void _screenKey;
  return DISCONNECTED_REPORT;
}
