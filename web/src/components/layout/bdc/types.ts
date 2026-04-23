/**
 * BDC (Flutter NuDS) — data contract.
 *
 * This module is intentionally decoupled from the Foundation (Web/Expo) report.
 * Today the `useBDCReport` hook returns a fully disconnected payload; when the
 * BDC service is available, only that hook's body changes — UI stays the same.
 *
 * The shape already supports a "connected" state with real numbers, lists of
 * tokens/components/extensions and hardcoded offenses, mirroring what the
 * Foundation report exposes — so wiring an API in the future is a drop-in swap.
 */

export type BDCConnectionState = 'connected' | 'disconnected' | 'loading' | 'error';

export interface BDCRepoStatus {
  /** Stable identifier used for keys and analytics. */
  id: 'nuds' | 'project';
  /** Display label (e.g. "NuDS", "Projeto"). */
  label: string;
  /** Sub-label shown under the main label (e.g. "Pending integration"). */
  sublabel: string;
  /** When false the link renders as a disabled chip with no href. */
  connected: boolean;
  /** Optional href — only used when `connected` is true. */
  url?: string;
}

export interface BDCHardcodedOffense {
  kind: string;
  value: string;
  where: string;
}

export interface BDCPlatformReport {
  /** Platform display label (e.g. "Flutter"). */
  label: string;
  /** Whether the reporting service is hooked up for this platform. */
  connected: boolean;
  /** Foundation score (0-100). Null when disconnected / no data. */
  pct: number | null;
  components: string[];
  tokens: string[];
  extensions: string[];
  hardcoded: BDCHardcodedOffense[];
}

export interface BDCReport {
  /** Overall connection state; drives the card/modal empty states. */
  connectionState: BDCConnectionState;
  /** Single-platform payload (Flutter today; extensible tomorrow). */
  platform: BDCPlatformReport;
  /** Repos that the report links to. Rendered in the modal footer. */
  repos: BDCRepoStatus[];
}
