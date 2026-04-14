import { useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Monitor, Boxes, GitBranch, BookOpen, ArrowRight, ChevronDown, Play, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const FEATURES = [
  {
    id: 'glossary',
    path: '/glossary',
    icon: BookOpen,
    title: 'Glossary',
    subtitle: 'Comprehensive reference of business terms, domain definitions, and regulatory concepts.',
    ready: true,
  },
  {
    id: 'flow-management',
    path: '/flow-management',
    icon: GitBranch,
    title: 'Flow Management',
    subtitle: 'Manage product versions, active experiments, and advanced admin controls for the negotiation flow.',
    ready: false,
  },
  {
    id: 'emulator',
    path: '/emulator',
    icon: Monitor,
    title: 'Emulator',
    subtitle: 'Browse use cases with navigable prototypes and configurable financial and regulatory parameters.',
    ready: true,
  },
  {
    id: 'experience-architecture',
    path: '/experience-architecture',
    icon: Boxes,
    title: 'Experience Architecture',
    subtitle: 'Visual map and capability matrix to compare architecture coverage across product lines.',
    ready: true,
  },
] as const;

const SPOTLIGHT_VIDEO = {
  id: 'spotlight',
  title: 'How to change the Use Case',
  description:
    'Pick a product line, switch use case, and understand what changes automatically — financial rules, screens, and flow parameters adapt instantly.',
  duration: '3 min',
  track: 'Getting Started',
};

const GRID_VIDEOS = [
  {
    id: 'g1',
    title: 'Using the AI Assistant',
    description: 'Ask for navigation, explanations, and config help.',
    duration: '4 min',
    track: 'Assistant',
    accent: '#7C3AED',
  },
  {
    id: 'g2',
    title: 'Financial Rules — advanced mode',
    description: 'Formula selection, negotiation values, and offer impact.',
    duration: '5 min',
    track: 'Advanced',
    accent: '#EC4899',
  },
  {
    id: 'g3',
    title: 'Capability matrix deep dive',
    description: 'Coverage, experiments, and rollout visibility.',
    duration: '4 min',
    track: 'Operations',
    accent: '#0EA5E9',
  },
  {
    id: 'g4',
    title: 'Tuning negotiation parameters',
    description: 'Discount policies, installments, and simulation behavior.',
    duration: '6 min',
    track: 'Advanced',
    accent: '#F59E0B',
  },
  {
    id: 'g5',
    title: 'Timeline and changelog',
    description: 'Where to check updates and version context.',
    duration: '3 min',
    track: 'Operations',
    accent: '#10B981',
  },
  {
    id: 'g6',
    title: 'Running your first flow',
    description: 'Select country, pick a use case, configure screens, and hit Start Flow.',
    duration: '3 min',
    track: 'Getting Started',
    accent: '#8B5CF6',
  },
];

const CSS = `
  .hp-neon { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  .hp-neon-blob { position: absolute; border-radius: 50%; filter: blur(130px); opacity: 0.1; will-change: transform; }
  .hp-neon-blob.light { opacity: 0.14; }
  .hp-neon-blob.dark { opacity: 0.2; }
  .hp-blob-1 { width: 560px; height: 560px; top: -16%; left: -9%; animation: drift1 26s ease-in-out infinite alternate; }
  .hp-blob-2 { width: 520px; height: 520px; top: 26%; right: -12%; animation: drift2 28s ease-in-out infinite alternate; }
  .hp-blob-3 { width: 420px; height: 420px; bottom: -8%; left: 24%; animation: drift3 22s ease-in-out infinite alternate; }
  @keyframes drift1 { 0%{transform:translate(0,0) scale(1)}50%{transform:translate(70px,56px) scale(1.08)}100%{transform:translate(-38px,92px) scale(.95)} }
  @keyframes drift2 { 0%{transform:translate(0,0) scale(1)}50%{transform:translate(-70px,-52px) scale(1.1)}100%{transform:translate(24px,-84px) scale(.92)} }
  @keyframes drift3 { 0%{transform:translate(0,0) scale(1)}50%{transform:translate(58px,-34px) scale(1.04)}100%{transform:translate(-46px,36px) scale(.98)} }

  .hp-shell { position: relative; z-index: 1; width: 100vw; height: 100vh; overflow: auto; }

  .hp-container { width: min(1120px, 100%); margin: 0 auto; padding-left: 36px; padding-right: 36px; }

  .hp-fold1 { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding-top: 52px; padding-bottom: 36px; }
  .hp-fold1-inner { display: flex; flex-direction: column; align-items: center; gap: 32px; }
  .hp-hero-center { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 36px; }
  .hp-hero-title { font-size: 76px; font-weight: 400; letter-spacing: -3px; line-height: 1.02; margin: 0; }
  .hp-hero-sub { font-size: 18px; line-height: 1.6; max-width: 680px; margin: 0; white-space: nowrap; }

  .hp-bento { width: 100%; display: grid; grid-template-columns: repeat(12,minmax(0,1fr)); gap: 14px; }
  .hp-b-flow { grid-column: 1/8; grid-row: 1/3; min-height: 280px; }
  .hp-b-glossary { grid-column: 8/13; grid-row: 1/2; }
  .hp-b-emulator { grid-column: 8/13; grid-row: 2/3; }
  .hp-b-exp { grid-column: 1/13; }

  .hp-arrow-row { display: flex; justify-content: center; margin-top: 4px; }
  .hp-scroll-btn { cursor: pointer; background: none; border: none; padding: 6px; display: inline-flex; }

  /* ── Fold 2: Spotlight ── */
  .hp-fold2 { padding: 100px 0 80px; }
  .hp-spotlight { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-radius: 28px; overflow: hidden; min-height: 440px; }
  .hp-spot-text { display: flex; flex-direction: column; justify-content: center; padding: 48px 44px; gap: 20px; }
  .hp-spot-visual { position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .hp-spot-visual::after { content: ''; position: absolute; inset: 0; pointer-events: none; }

  /* ── Fold 3: Grid ── */
  .hp-fold3 { padding: 0 0 120px; }
  .hp-vid-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

  .hp-vid-card {
    position: relative; border-radius: 20px; overflow: hidden;
    min-height: 340px; display: flex; flex-direction: column;
    justify-content: flex-end; cursor: pointer;
    transition: transform .25s ease, box-shadow .25s ease;
  }
  .hp-vid-card:hover { transform: translateY(-4px) scale(1.01); }

  .hp-vid-thumb {
    position: absolute; inset: 0; z-index: 0;
    display: flex; align-items: center; justify-content: center;
  }

  .hp-vid-overlay {
    position: relative; z-index: 2;
    padding: 22px 20px; display: flex;
    flex-direction: column; gap: 6px;
  }

  @media (max-width: 980px) {
    .hp-hero-title { font-size: 52px; letter-spacing: -2px; }
    .hp-hero-sub { font-size: 15px; }
    .hp-bento { grid-template-columns: repeat(2,minmax(0,1fr)); grid-template-rows: auto; }
    .hp-b-flow { grid-column: 1/-1; grid-row: auto; min-height: 220px; }
    .hp-b-glossary { grid-column: 1/2; grid-row: auto; }
    .hp-b-emulator { grid-column: 2/3; grid-row: auto; }
    .hp-b-exp { grid-column: 1/-1; grid-row: auto; }
    .hp-spotlight { grid-template-columns: 1fr; min-height: auto; }
    .hp-spot-visual { min-height: 280px; }
    .hp-vid-grid { grid-template-columns: repeat(2,1fr); }
    .hp-container { padding-left: 28px; padding-right: 28px; }
  }
  @media (max-width: 700px) {
    .hp-container { padding-left: 18px; padding-right: 18px; }
    .hp-fold1 { padding-top: 36px; padding-bottom: 24px; }
    .hp-fold1-inner { gap: 24px; }
    .hp-hero-title { font-size: 36px; letter-spacing: -1.2px; line-height: 1.08; }
    .hp-hero-sub { font-size: 14px; max-width: 100%; white-space: normal; }
    .hp-bento { grid-template-columns: 1fr; grid-template-rows: auto; gap: 12px; }
    .hp-b-flow, .hp-b-glossary, .hp-b-emulator, .hp-b-exp { grid-column: 1/-1; grid-row: auto; min-height: auto; }
    .hp-spotlight { border-radius: 20px; }
    .hp-spot-text { padding: 28px 22px; }
    .hp-vid-grid { grid-template-columns: 1fr; }
    .hp-vid-card { min-height: 260px; }
    .hp-fold2 { padding: 60px 0 48px; }
    .hp-fold3 { padding: 0 0 80px; }
  }
`;

export default function HomePage({ onNavigate }: HomePageProps) {
  const { palette, mode, toggleMode } = useTheme();
  const isLight = mode === 'light';
  const pageBg = isLight ? '#F8F7F9' : '#09090A';

  const shellRef = useRef<HTMLDivElement>(null);
  const fold2Ref = useRef<HTMLDivElement>(null);
  const fold3Ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress: sp2 } = useScroll({ target: fold2Ref, container: shellRef, offset: ['start end', 'end start'] });
  const scale2 = useTransform(sp2, [0, 0.3, 0.7, 1], [0.88, 1, 1, 0.92]);
  const opacity2 = useTransform(sp2, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const { scrollYProgress: sp3 } = useScroll({ target: fold3Ref, container: shellRef, offset: ['start end', 'end start'] });
  const scale3 = useTransform(sp3, [0, 0.25, 0.75, 1], [0.9, 1, 1, 0.93]);
  const opacity3 = useTransform(sp3, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  const scrollDown = () => fold2Ref.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <style>{CSS}</style>

      {/* Theme toggle — orb style, Home only */}
      <motion.button
        onClick={toggleMode}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 997,
          width: 46, height: 46, borderRadius: '50%',
          border: `1px solid ${isLight ? 'rgba(200,180,240,0.4)' : 'rgba(180,140,255,0.2)'}`,
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, overflow: 'visible',
        }}
      >
        <div style={{
          position: 'absolute', inset: 3, borderRadius: '50%',
          background: isLight
            ? 'radial-gradient(circle at 35% 35%, #fde68a, #fbbf24 40%, #f59e0b 65%, #fcd34d 90%)'
            : 'radial-gradient(circle at 35% 35%, #312e81, #4338ca 40%, #6366f1 65%, #4f46e5 90%)',
          opacity: isLight ? 0.5 : 0.5,
          filter: 'blur(1px)',
          transition: 'opacity 0.3s ease',
        }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', inset: 3, borderRadius: '50%',
            background: isLight
              ? 'conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.35) 25%, transparent 50%, rgba(245,158,11,0.25) 75%, transparent 100%)'
              : 'conic-gradient(from 0deg, transparent 0%, rgba(99,102,241,0.3) 25%, transparent 50%, rgba(79,70,229,0.25) 75%, transparent 100%)',
            filter: 'blur(2px)',
          }}
        />
        <div style={{
          position: 'absolute', inset: 5, borderRadius: '50%',
          background: isLight
            ? 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 60%, transparent 100%)'
            : 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 60%, transparent 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="theme-orb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isLight ? '#f59e0b' : '#818cf8'} />
                <stop offset="100%" stopColor={isLight ? '#d97706' : '#6366f1'} />
              </linearGradient>
            </defs>
          </svg>
          <AnimatePresence mode="wait">
            {isLight ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex' }}
              >
                <Sun size={18} strokeWidth={1.8} style={{ color: 'url(#theme-orb-grad)' } as React.CSSProperties} stroke="url(#theme-orb-grad)" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex' }}
              >
                <Moon size={18} strokeWidth={1.8} style={{ color: 'url(#theme-orb-grad)' } as React.CSSProperties} stroke="url(#theme-orb-grad)" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      <div className="hp-neon" style={{ background: pageBg, transition: 'background .3s ease' }}>
        <div className={`hp-neon-blob hp-blob-1 ${isLight ? 'light' : 'dark'}`} style={{ background: palette.accent }} />
        <div className={`hp-neon-blob hp-blob-2 ${isLight ? 'light' : 'dark'}`} style={{ background: isLight ? '#4F46E5' : '#A78BFA' }} />
        <div className={`hp-neon-blob hp-blob-3 ${isLight ? 'light' : 'dark'}`} style={{ background: isLight ? '#EC4899' : '#FB7185' }} />
      </div>

      <div ref={shellRef} className="hp-shell">

        {/* ═══ FOLD 1 — Hero + Bento (100vh) ═══ */}
        <section className="hp-fold1">
          <motion.div
            className="hp-fold1-inner hp-container"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="hp-hero-center">
              <div style={{ display: 'inline-flex', padding: '7px 18px', borderRadius: 9999, background: palette.accent }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF', letterSpacing: '0.4px' }}>Negotiation Flow</span>
              </div>
              <h1 className="hp-hero-title" style={{ color: palette.textPrimary }}>
                Design, simulate, and ship.
              </h1>
              <p className="hp-hero-sub" style={{ color: palette.textSecondary }}>
                Explore prototypes, manage experiments, and track product performance — all from one place.
              </p>
            </div>

            <div className="hp-bento">
              <BentoCard f={FEATURES[1]} nav={onNavigate} p={palette} l={isLight} cls="hp-b-flow" d={0.05} v="hero" />
              <BentoCard f={FEATURES[0]} nav={onNavigate} p={palette} l={isLight} cls="hp-b-glossary" d={0.12} />
              <BentoCard f={FEATURES[2]} nav={onNavigate} p={palette} l={isLight} cls="hp-b-emulator" d={0.2} />
              <BentoCard f={FEATURES[3]} nav={onNavigate} p={palette} l={isLight} cls="hp-b-exp" d={0.28} v="wide" />
            </div>

            <div className="hp-arrow-row">
              <motion.button
                className="hp-scroll-btn"
                onClick={scrollDown}
                aria-label="Scroll"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 7, 0] }}
                transition={{ opacity: { delay: 0.8, duration: 0.4 }, y: { delay: 1, duration: 1.7, repeat: Infinity, ease: 'easeInOut' } }}
              >
                <ChevronDown size={26} strokeWidth={1.6} style={{ color: palette.textSecondary }} />
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* ═══ FOLD 2 — Spotlight (Framer-style split) ═══ */}
        <motion.section ref={fold2Ref} className="hp-fold2 hp-container" style={{ scale: scale2, opacity: opacity2 }}>
          <div
            className="hp-spotlight"
            style={{
              background: isLight
                ? `linear-gradient(135deg, ${palette.accent} 0%, #4F46E5 100%)`
                : `linear-gradient(135deg, ${palette.accent}E6 0%, #1E1B4B 100%)`,
              boxShadow: `0 24px 64px ${palette.accent}30`,
            }}
          >
            <div className="hp-spot-text">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999, background: 'rgba(255,255,255,0.16)', alignSelf: 'flex-start' }}>
                <Play size={10} style={{ color: '#FFF' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.3px' }}>
                  {SPOTLIGHT_VIDEO.track} · {SPOTLIGHT_VIDEO.duration}
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: 40, fontWeight: 500, letterSpacing: '-1.6px', lineHeight: 1.08, color: '#FFFFFF' }}>
                {SPOTLIGHT_VIDEO.title}
              </h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', maxWidth: 400 }}>
                {SPOTLIGHT_VIDEO.description}
              </p>
              <button
                style={{
                  alignSelf: 'flex-start', marginTop: 8, padding: '12px 24px',
                  borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                  color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  transition: 'background .2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              >
                <Play size={14} fill="#FFF" /> Watch video
              </button>
            </div>

            <div className="hp-spot-visual" style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.22)' }}>
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.4,
                background: `radial-gradient(circle at 30% 50%, ${palette.accent}60, transparent 60%), radial-gradient(circle at 80% 20%, rgba(79,70,229,0.4), transparent 50%)`,
              }} />
              <div style={{
                width: 90, height: 90, borderRadius: 45, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)', zIndex: 2, cursor: 'pointer',
                transition: 'transform .2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Play size={36} fill="#FFF" style={{ color: '#FFF', marginLeft: 4 }} />
              </div>
              <span style={{
                position: 'absolute', bottom: 18, right: 22, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
              }}>
                Video thumbnail slot
              </span>
            </div>
          </div>
        </motion.section>

        {/* ═══ FOLD 3 — Portfolio grid ═══ */}
        <motion.section ref={fold3Ref} className="hp-fold3 hp-container" style={{ scale: scale3, opacity: opacity3 }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ marginBottom: 32 }}
          >
            <h2 style={{ margin: 0, fontSize: 36, fontWeight: 500, letterSpacing: '-1.2px', lineHeight: 1.1, color: palette.textPrimary }}>
              More to explore
            </h2>
            <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.6, color: palette.textSecondary, maxWidth: 500 }}>
              Short guides covering every major feature — from basic setup to financial configuration.
            </p>
          </motion.div>

          <div className="hp-vid-grid">
            {GRID_VIDEOS.map((vid, i) => (
              <PortfolioCard key={vid.id} vid={vid} index={i} palette={palette} isLight={isLight} />
            ))}
          </div>
        </motion.section>
      </div>
    </>
  );
}

/* ───────── Portfolio Video Card ───────── */

type Palette = ReturnType<typeof useTheme>['palette'];

function PortfolioCard({ vid, index, palette, isLight }: {
  vid: (typeof GRID_VIDEOS)[number]; index: number; palette: Palette; isLight: boolean;
}) {
  const gradientBg = isLight
    ? `linear-gradient(145deg, ${vid.accent}18 0%, ${vid.accent}08 40%, ${isLight ? '#F3F1F6' : '#171719'} 100%)`
    : `linear-gradient(145deg, ${vid.accent}24 0%, ${vid.accent}0A 40%, #111113 100%)`;
  const overlayGrad = isLight
    ? 'linear-gradient(to top, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.7) 50%, transparent 100%)'
    : 'linear-gradient(to top, rgba(10,10,12,0.97) 0%, rgba(10,10,12,0.6) 50%, transparent 100%)';

  return (
    <motion.article
      className="hp-vid-card"
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isLight
          ? `0 16px 44px ${vid.accent}18` : `0 16px 44px rgba(0,0,0,0.5)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isLight
          ? '0 2px 8px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.3)';
      }}
    >
      {/* Full-bleed thumb background */}
      <div className="hp-vid-thumb" style={{ background: gradientBg }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.35,
          background: `radial-gradient(circle at 50% 40%, ${vid.accent}50, transparent 65%)`,
        }} />
      </div>

      {/* Play icon — top-right, discreet */}
      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 3,
        width: 36, height: 36, borderRadius: 18,
        background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Play size={14} fill={isLight ? palette.textPrimary : '#FFF'} style={{ color: isLight ? palette.textPrimary : '#FFF', marginLeft: 1 }} />
      </div>

      {/* Gradient overlay for text readability */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: overlayGrad }} />

      {/* Content overlay */}
      <div className="hp-vid-overlay">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
            color: vid.accent, background: `${vid.accent}16`, padding: '3px 8px', borderRadius: 9999,
          }}>
            {vid.track}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: palette.textSecondary }}>{vid.duration}</span>
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.2, color: palette.textPrimary }}>
          {vid.title}
        </h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: palette.textSecondary }}>
          {vid.description}
        </p>
      </div>
    </motion.article>
  );
}

/* ───────── Bento Card ───────── */

function BentoCard({ f, nav, p, l, cls, d, v }: {
  f: (typeof FEATURES)[number]; nav: (p: string) => void; p: Palette; l: boolean;
  cls: string; d: number; v?: 'hero' | 'wide';
}) {
  const Icon = f.icon;
  const isH = v === 'hero';
  const isW = v === 'wide';
  const base = import.meta.env.BASE_URL;

  const bg = isH ? p.accent : (l ? '#FFFFFF' : '#141414');
  const bdr = isH ? 'transparent' : (l ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)');
  const sub = isH ? 'rgba(255,255,255,0.78)' : p.textSecondary;
  const hd = isH ? '#FFF' : p.textPrimary;
  const iBg = isH ? 'rgba(255,255,255,0.2)' : f.ready ? p.accentSubtle : (l ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)');
  const iC = isH ? '#FFF' : (f.ready ? p.accent : p.textSecondary);

  return (
    <motion.button
      className={cls}
      onClick={() => nav(f.path)}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: d, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: 'relative', overflow: 'hidden', textAlign: 'left', cursor: 'pointer',
        borderRadius: 20, border: `1px solid ${bdr}`, background: bg,
        display: 'flex', flexDirection: isW ? 'row' : 'column',
        alignItems: isW ? 'center' : 'flex-start', gap: isW ? 20 : 16,
        padding: isH ? '32px 30px' : (isW ? '24px 26px' : '22px'),
        transition: 'transform .2s ease, box-shadow .2s ease',
        boxShadow: isH ? `0 15px 42px ${p.accent}38` : (l ? '0 1px 3px rgba(0,0,0,0.05)' : '0 2px 4px rgba(0,0,0,0.26)'),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = isH ? `0 20px 50px ${p.accent}48` : (l ? '0 14px 36px rgba(130,10,209,0.1)' : '0 16px 36px rgba(0,0,0,0.4)');
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isH ? `0 15px 42px ${p.accent}38` : (l ? '0 1px 3px rgba(0,0,0,0.05)' : '0 2px 4px rgba(0,0,0,0.26)');
      }}
    >
      {isH && (
        <>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${base}hero-bg.png)`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.28 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${p.accent}EA, ${p.accent}C8)` }} />
        </>
      )}

      <div style={{
        position: 'relative', zIndex: 1, width: isH ? 54 : 44, height: isH ? 54 : 44,
        borderRadius: isH ? 16 : 12, background: iBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={isH ? 25 : 20} strokeWidth={1.7} style={{ color: iC }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isH ? 10 : 6, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: hd, fontWeight: 700, letterSpacing: '-0.2px', fontSize: isH ? 24 : 16 }}>
            {f.title}
          </h3>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 6,
            background: isH ? 'rgba(255,255,255,0.22)' : f.ready ? (l ? p.accentSubtle : `${p.accent}20`) : (l ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)'),
            color: isH ? 'rgba(255,255,255,0.88)' : (f.ready ? p.accent : p.textSecondary),
          }}>
            {f.ready ? 'Available' : 'Soon'}
          </span>
          {(f.id === 'emulator' || f.id === 'glossary' || f.id === 'experience-architecture') && (
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: 4,
              background: isH ? 'rgba(255,255,255,0.2)' : (l ? '#FFF3E0' : 'rgba(255,152,0,0.16)'),
              color: isH ? 'rgba(255,255,255,0.84)' : (l ? '#E65100' : '#FFB74D'),
            }}>
              Work in Progress
            </span>
          )}
        </div>
        <p style={{ margin: 0, color: sub, lineHeight: 1.55, fontSize: isH ? 15 : 13, maxWidth: isH ? 420 : undefined }}>
          {f.subtitle}
        </p>
      </div>

      {(f.ready || isH) && (
        <div style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: isW ? 0 : 4 }}>
          <span style={{ fontSize: isH ? 14 : 12, fontWeight: 700, color: isH ? 'rgba(255,255,255,0.9)' : p.accent }}>
            {isH ? 'Explore' : 'Open'}
          </span>
          <ArrowRight size={isH ? 16 : 13} strokeWidth={2} style={{ color: isH ? 'rgba(255,255,255,0.9)' : p.accent }} />
        </div>
      )}
    </motion.button>
  );
}
