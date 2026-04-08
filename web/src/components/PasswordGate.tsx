import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Hash & lockout config ─── */

const ALLOWED_HASHES: string[] = [
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

interface LockoutState {
  failedAttempts: number;
  lockoutRounds: number;
  lockedUntil: number | null;
}

function readLockout(): LockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { failedAttempts: 0, lockoutRounds: 0, lockedUntil: null };
}
function writeLockout(s: LockoutState) {
  try { localStorage.setItem(LOCKOUT_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function getRemainingMs(): number {
  const s = readLockout();
  return s.lockedUntil ? Math.max(0, s.lockedUntil - Date.now()) : 0;
}
function registerFail(): LockoutState {
  const s = readLockout();
  s.failedAttempts += 1;
  if (s.failedAttempts >= ATTEMPTS_PER_ROUND) {
    s.lockoutRounds += 1;
    s.failedAttempts = 0;
    s.lockedUntil = Date.now() + (s.lockoutRounds >= MAX_ROUNDS_BEFORE_BAN ? HARD_BAN_MS : BASE_LOCKOUT_MS * s.lockoutRounds);
  }
  writeLockout(s);
  return s;
}
function resetLockout() {
  try { localStorage.removeItem(LOCKOUT_KEY); } catch { /* ignore */ }
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function shouldBypass(): boolean {
  const h = window.location?.hostname ?? '';
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h.endsWith('.local');
}

function hasAccess(): boolean {
  try { return sessionStorage.getItem(STORAGE_KEY) !== null; } catch { return false; }
}
function persistAccess() {
  try { sessionStorage.setItem(STORAGE_KEY, Date.now().toString()); } catch { /* ignore */ }
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const t = Math.ceil(ms / 1000);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

/* ─── Component ─── */

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [shake, setShake] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLocked(true);
    timerRef.current = setInterval(() => {
      const ms = getRemainingMs();
      if (ms <= 0) {
        setLocked(false);
        setRemaining(0);
        setError('');
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setRemaining(ms);
      }
    }, 250);
  }, []);

  useEffect(() => {
    if (shouldBypass() || hasAccess()) {
      setAuthenticated(true);
    } else {
      const ms = getRemainingMs();
      if (ms > 0) { setRemaining(ms); startCountdown(); }
      setAttemptsLeft(ATTEMPTS_PER_ROUND - readLockout().failedAttempts);
    }
    setReady(true);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCountdown]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password.trim() || locked) return;

    const hash = await sha256(password.trim());
    if (ALLOWED_HASHES.includes(hash)) {
      resetLockout();
      persistAccess();
      setAuthenticated(true);
    } else {
      const ls = registerFail();
      const left = ATTEMPTS_PER_ROUND - ls.failedAttempts;
      setAttemptsLeft(left < 0 ? 0 : left);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (ls.lockedUntil && ls.lockedUntil > Date.now()) {
        const ms = ls.lockedUntil - Date.now();
        setRemaining(ms);
        setError(ms > 60 * 60 * 1000
          ? 'Too many attempts. Access blocked for 24 hours.'
          : 'Too many attempts. Please wait.');
        startCountdown();
      } else {
        setError(left > 0 ? `Invalid password. ${left} attempt${left === 1 ? '' : 's'} remaining.` : 'Invalid password.');
        setTimeout(() => setError(''), 3000);
      }
      setPassword('');
    }
  };

  if (!ready) return null;
  if (authenticated) return <>{children}</>;

  const isHardBan = remaining > 60 * 60 * 1000;
  const canSubmit = password.trim().length > 0 && !locked;

  return (
    <div style={styles.backdrop}>
      <div style={{ ...styles.center, opacity: ready ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        {/* Icon */}
        <div style={{ ...styles.iconCircle, background: locked ? 'rgba(212,24,61,0.08)' : 'rgba(130,10,209,0.08)' }}>
          {locked ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4183D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#820AD1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h1 style={styles.title}>{locked ? 'Temporarily Blocked' : 'Restricted Access'}</h1>
        <p style={styles.subtitle}>
          {locked
            ? isHardBan
              ? 'Too many failed attempts.\nAccess has been blocked for 24 hours.'
              : 'Too many failed attempts.\nPlease wait before trying again.'
            : 'Enter your access password to continue.\nContact us to request access.'}
        </p>

        {/* Countdown pill */}
        {locked && remaining > 0 && (
          <div style={styles.countdownPill}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4183D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            <span style={styles.countdownText}>{formatCountdown(remaining)}</span>
          </div>
        )}

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            ...styles.card,
            borderColor: locked ? 'rgba(212,24,61,0.10)' : 'rgba(0,0,0,0.06)',
            opacity: locked ? 0.6 : 1,
            animation: shake ? 'pw-shake 0.5s ease' : 'none',
          }}
        >
          {/* Label */}
          <div style={styles.inputLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={styles.labelText}>Password</span>
          </div>

          {/* Input */}
          <div style={{ ...styles.inputWrap, borderColor: error ? '#D4183D' : 'rgba(31,2,48,0.10)' }}>
            <input
              ref={inputRef}
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error && !locked) setError(''); }}
              placeholder={locked ? 'Locked — please wait' : 'Enter password'}
              disabled={locked}
              autoComplete="off"
              style={styles.input}
            />
            {!locked && (
              <button type="button" onClick={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                {showPw ? 'HIDE' : 'SHOW'}
              </button>
            )}
          </div>

          {/* Error */}
          {error && <p style={styles.errorText}>{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...styles.button,
              background: locked ? '#C7C7CC' : '#820AD1',
              opacity: canSubmit ? 1 : 0.45,
              cursor: canSubmit ? 'pointer' : 'default',
            }}
          >
            {locked ? 'Locked' : 'Unlock'}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footer}>All rights reserved</p>
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes pw-shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(12px); }
          30% { transform: translateX(-12px); }
          45% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          75% { transform: translateX(4px); }
          90% { transform: translateX(-4px); }
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ─── */

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F4F1F7',
    fontFamily: "'Nu Sans Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 28px',
    maxWidth: 420,
    width: '100%',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 500,
    letterSpacing: '-0.5px',
    color: '#1f0230',
    margin: '0 0 8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: '20px',
    color: 'rgba(31,2,48,0.62)',
    textAlign: 'center',
    margin: '0 0 28px',
    maxWidth: 280,
    whiteSpace: 'pre-line',
  },
  countdownPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 9999,
    background: 'rgba(212,24,61,0.06)',
    marginBottom: 20,
  },
  countdownText: {
    color: '#D4183D',
    fontSize: 18,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  card: {
    width: '100%',
    background: '#FFFFFF',
    borderRadius: 20,
    border: '1px solid',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    transition: 'opacity 0.3s ease',
  },
  inputLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1f0230',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 12,
    border: '1px solid',
    padding: '0 14px',
    height: 48,
    background: '#F7F5F9',
    transition: 'border-color 0.2s ease',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1f0230',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    height: '100%',
    fontFamily: 'inherit',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(31,2,48,0.62)',
    letterSpacing: '0.3px',
    paddingLeft: 10,
    fontFamily: 'inherit',
  },
  errorText: {
    color: '#D4183D',
    fontSize: 13,
    margin: 0,
    lineHeight: '18px',
  },
  button: {
    height: 48,
    borderRadius: 12,
    border: 'none',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'inherit',
    marginTop: 4,
    transition: 'opacity 0.15s ease, transform 0.15s ease',
  },
  footer: {
    marginTop: 32,
    fontSize: 11,
    color: 'rgba(31,2,48,0.62)',
    opacity: 0.5,
    textAlign: 'center',
  },
};
