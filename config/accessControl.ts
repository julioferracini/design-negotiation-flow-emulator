import { Platform } from 'react-native';

/**
 * SHA-256 hashes of allowed passwords.
 * To generate a hash: run in browser console:
 *   crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PASSWORD'))
 *     .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join(''))
 *     .then(console.log)
 *
 * Add hashes here — never store plain-text passwords.
 */
export const ALLOWED_PASSWORD_HASHES: string[] = [
  'b12aad524723ba97ed4ebbd036222cf06e7a262b3a113611b646cc138035ca02',
  '1c39d167e4c639aec92a269089be57dd23657d7f4ec4efc34cb6b0a2e2e97577',
  'e2c0260194d4c133bdd46ace5fc5a945a80b6a1b1ff379698e0351087362e4e7',
  '50ee1652569a0bd428bd7d98264528fc72a9e2d03d8c2ad876622bebdc5485c0',
  '1fe872d2aa6082989f49edf72bafd920ebb5074c2cd69f32a6ecc73cd0fa503b',
  '9a7ed35bd402566274e8dc3d18659f55f8379c6829781d309548402cf3339d1e',
  '3f59fde816ef3bb65b195a71e323fb28581d8121abbffca68b0dbab21ffab7c3',
  'c80e0882c4557f1f9d7e86d5bdf3064e7b3b348857846ebf70bfbdc7d6f97f82',
  'cf34d30e27da195551fe442f1dfbdbc417bac3441dcd32a9275d98c9ab13f35f',
  '07f30d9f1c7e01151ea58ca4bfb4117ebe69768e4eb441dfc01bafd5b6d7589a',
];

const STORAGE_KEY = 'prototype-access-token';
const LOCKOUT_KEY = 'prototype-lockout';

const ATTEMPTS_PER_ROUND = 3;
const BASE_LOCKOUT_MS = 30_000;
const HARD_BAN_MS = 24 * 60 * 60 * 1000;
const MAX_ROUNDS_BEFORE_BAN = 5;

export interface LockoutState {
  failedAttempts: number;
  lockoutRounds: number;
  lockedUntil: number | null;
}

function readLockout(): LockoutState {
  const empty: LockoutState = { failedAttempts: 0, lockoutRounds: 0, lockedUntil: null };
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(LOCKOUT_KEY);
      if (raw) return JSON.parse(raw) as LockoutState;
    }
  } catch { /* ignore */ }
  return empty;
}

function writeLockout(state: LockoutState): void {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
    }
  } catch { /* ignore */ }
}

export function getLockoutState(): LockoutState {
  return readLockout();
}

export function getRemainingLockMs(): number {
  const state = readLockout();
  if (state.lockedUntil === null) return 0;
  return Math.max(0, state.lockedUntil - Date.now());
}

export function registerFailedAttempt(): LockoutState {
  const state = readLockout();
  state.failedAttempts += 1;

  if (state.failedAttempts >= ATTEMPTS_PER_ROUND) {
    state.lockoutRounds += 1;
    state.failedAttempts = 0;

    if (state.lockoutRounds >= MAX_ROUNDS_BEFORE_BAN) {
      state.lockedUntil = Date.now() + HARD_BAN_MS;
    } else {
      state.lockedUntil = Date.now() + BASE_LOCKOUT_MS * state.lockoutRounds;
    }
  }

  writeLockout(state);
  return state;
}

export function resetLockout(): void {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCKOUT_KEY);
    }
  } catch { /* ignore */ }
}

export async function hashPassword(plain: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const buf = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(plain),
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for environments without SubtleCrypto (old Hermes)
  // Uses a simple but non-reversible hash — acceptable for prototype gating
  let h = 0;
  for (let i = 0; i < plain.length; i++) {
    h = (Math.imul(31, h) + plain.charCodeAt(i)) | 0;
  }
  return `fallback-${h.toString(16)}`;
}

export function shouldBypassGate(): boolean {
  // Bypass on native Expo Go (iOS / Android)
  if (Platform.OS === 'ios' || Platform.OS === 'android') return true;

  // Bypass on localhost / 127.0.0.1 (web dev)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location?.hostname ?? '';
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local')
    ) {
      return true;
    }
  }

  return false;
}

export function persistAccess(): void {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  } catch {
    // sessionStorage unavailable — ignore
  }
}

export function hasPersistedAccess(): boolean {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.sessionStorage.getItem(STORAGE_KEY) !== null;
    }
  } catch {
    // ignore
  }
  return false;
}

export function clearPersistedAccess(): void {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}
