import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  type MotionValue,
  type Variants,
} from 'motion/react';
import { ArrowRight, ArrowUpRight, Sun, Moon, SplitSquareHorizontal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/* ═══════════════════════════════════════════════════════════════════ */
/*  Motion variants — shared entrance vocabulary                      */
/* ═══════════════════════════════════════════════════════════════════ */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/*
 * Opening sequence timeline (~4s total):
 *   0.0 – 2.2s   Aurora field + dust motes build and drift
 *   1.8 – 2.9s   "welcome" fades in (the *last* thing to appear)
 *   2.9 – 3.3s   Aurora recedes, welcome fades out
 *   3.2s+        Hero elements start their staggered entrance
 *   ~4.0s        Hero fully settled
 */
const HERO_DELAY = 3.2;
const HERO_LOADER_DURATION = 3400;

/*
 * Formula pools for the hero loader — organized by visual depth.
 * Far layer is pure symbols (texture only), mid is compact
 * expressions, near layer is recognizable finance snippets that
 * hint at the product's domain (rates, installments, currency).
 */
const FORMULA_FAR = [
  'π', 'Σ', '∫', '∂', '√', '≈', '∞', 'μ', 'σ²', 'Δ', 'λ', '∇', 'φ', 'Π', 'ρ', 'τ',
];

const FORMULA_MID = [
  'n = 48',
  '0.0247',
  'x̄ = 0.42',
  'log₂(n)',
  'e^(−rt)',
  'y = mx + b',
  '17.4%',
  'P(x) = 0.73',
  'r² = 0.91',
  'θ = 0.5',
  'Δy / Δx',
  '√2 ≈ 1.41',
  'f(x) = 0',
  '2.8e−3',
  '12 × 36',
  'α = 0.05',
];

const FORMULA_NEAR = [
  'R$ 127,36',
  'CET 12.9%',
  'APR 2.8%',
  'IOF 0.38%',
  '48 × R$ 412,80',
  'PMT = 312,04',
  'PV = 14.800',
  'FV = 19.264',
  'i = 1.49% a.m.',
  'PV·i / (1−(1+i)^−n)',
  'ΔROI +4.2pp',
  'τ = 0.095',
];

const HERO_STAGGER: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: HERO_DELAY },
  },
};

const WORD_STAGGER: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const LIFT: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

const LIFT_WORD: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: '0%',
    transition: { duration: 0.75, ease: EASE },
  },
};

const SLIDE_LR: Variants = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: EASE },
  },
};

interface HomePageProps {
  onNavigate: (path: string) => void;
}

type FeatureId = 'emulator' | 'flow-management' | 'experience-architecture' | 'glossary' | 'screen-compare';

interface Feature {
  id: FeatureId;
  path: string;
  title: string;
  description: string;
  image: string;
  ready: boolean;
}

const FEATURES: readonly Feature[] = [
  {
    id: 'emulator',
    path: '/emulator',
    title: 'Emulator',
    description: 'Browse use cases with navigable prototypes and tune financial, regulatory and visual parameters in real time.',
    image: '/brand/emulator.png',
    ready: true,
  },
  {
    id: 'screen-compare',
    path: '/screen-compare',
    title: 'Screen Compare',
    description: 'Place Figma designs and live platform screens side by side — or diff two Figma files to spot every pixel delta.',
    image: '/brand/screen-compare.png',
    ready: false,
  },
  {
    id: 'flow-management',
    path: '/flow-management',
    title: 'Flow Management',
    description: 'Advanced version control, running experiments and admin controls. Freeze, roll out or rewind the negotiation flow.',
    image: '/brand/flow-management.png',
    ready: false,
  },
  {
    id: 'glossary',
    path: '/glossary',
    title: 'Glossary',
    description: 'Reference of business terms, domain definitions and regulatory concepts used across the flow.',
    image: '/brand/glossary.png',
    ready: true,
  },
  {
    id: 'experience-architecture',
    path: '/experience-architecture',
    title: 'Experience Architecture',
    description: 'Product lines, one capability atlas. Browse the coverage across markets, formulas and use cases.',
    image: '/brand/snowball.png',
    ready: true,
  },
] as const;

const LIBRARY = [
  { id: 'g1', track: 'Getting Started', title: 'Running your first flow',            duration: '3 min' },
  { id: 'g2', track: 'Assistant',       title: 'Using the AI Assistant',            duration: '4 min' },
  { id: 'g3', track: 'Advanced',        title: 'Financial rules — advanced mode',   duration: '5 min' },
  { id: 'g4', track: 'Advanced',        title: 'Tuning negotiation parameters',     duration: '6 min' },
  { id: 'g5', track: 'Operations',      title: 'Capability matrix deep dive',       duration: '4 min' },
  { id: 'g6', track: 'Operations',      title: 'Timeline and changelog',            duration: '3 min' },
] as const;

const CSS = `
  .hp-shell {
    position: relative; z-index: 1;
    width: 100vw; height: 100vh;
    overflow: auto; background: var(--nf-bg);
  }

  .hp-fold { padding-top: 96px; padding-bottom: 96px; }
  .hp-fold--hero {
    position: relative;
    padding-top: 56px;
    padding-bottom: 88px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .hp-fold-foot {
    margin-top: 56px;
    padding-top: 28px;
    border-top: 1px solid var(--nf-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--nf-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--nf-text-tertiary);
  }

  @media (max-width: 700px) {
    .hp-fold { padding-top: 56px; padding-bottom: 56px; }
    .hp-fold--hero { padding-top: 40px; padding-bottom: 64px; min-height: auto; }
  }
`;

export default function HomePage({ onNavigate }: HomePageProps) {
  const { palette, mode, toggleMode } = useTheme();
  const isLight = mode === 'light';

  const shellRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const libraryRef = useRef<HTMLDivElement>(null);

  /* ───── Hero parallax (image escapes upward as we scroll) ───── */
  const { scrollYProgress: spHero } = useScroll({
    target: heroRef,
    container: shellRef,
    offset: ['start start', 'end start'],
  });
  const spHeroSmooth = useSpring(spHero, {
    stiffness: 60,
    damping: 22,
    mass: 0.6,
  });
  const heroImageY = useTransform(spHeroSmooth, [0, 1], [0, -140]);
  const heroCopyY = useTransform(spHeroSmooth, [0, 1], [0, -60]);

  /* ───── Section scrubs ───── */
  const { scrollYProgress: spFeat } = useScroll({
    target: featuresRef,
    container: shellRef,
    offset: ['start end', 'end start'],
  });
  const spFeatSmooth = useSpring(spFeat, {
    stiffness: 60,
    damping: 22,
    mass: 0.6,
  });
  const featHeadScale = useTransform(spFeatSmooth, [0, 0.25, 0.75, 1], [0.92, 1, 1, 0.96]);
  const featHeadY = useTransform(spFeatSmooth, [0, 0.25, 0.75, 1], [40, 0, 0, -20]);

  /* ───── Video fold (fade in/out) ───── */
  const { scrollYProgress: spVideo } = useScroll({
    target: videoRef,
    container: shellRef,
    offset: ['start end', 'end start'],
  });
  const spVideoSmooth = useSpring(spVideo, {
    stiffness: 60,
    damping: 22,
    mass: 0.6,
  });
  const videoOpacity = useTransform(
    spVideoSmooth,
    [0, 0.25, 0.5, 0.75, 1],
    [0, 0.4, 1, 0.4, 0],
  );
  const videoScale = useTransform(
    spVideoSmooth,
    [0, 0.5, 1],
    [0.96, 1, 0.96],
  );

  const { scrollYProgress: spLib } = useScroll({
    target: libraryRef,
    container: shellRef,
    offset: ['start end', 'end start'],
  });
  const spLibSmooth = useSpring(spLib, {
    stiffness: 60,
    damping: 22,
    mass: 0.6,
  });
  const libHeadScale = useTransform(spLibSmooth, [0, 0.25, 0.75, 1], [0.92, 1, 1, 0.96]);
  const libHeadY = useTransform(spLibSmooth, [0, 0.25, 0.75, 1], [40, 0, 0, -20]);

  return (
    <div data-mode={mode} className="nf-page" style={{ color: palette.textPrimary }}>
      <style>{CSS}</style>

      <button
        type="button"
        onClick={toggleMode}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        className="nf-page__theme-toggle"
      >
        {isLight ? <Moon size={15} strokeWidth={1.8} /> : <Sun size={15} strokeWidth={1.8} />}
      </button>

      <div ref={shellRef} className="hp-shell">

        {/* ═══ HERO ═══ */}
        <section ref={heroRef} className="hp-fold hp-fold--hero nf-page__container">
          <HeroLoader />
          <motion.div
            className="nf-page__hero"
            variants={HERO_STAGGER}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="nf-page__hero-copy" style={{ y: heroCopyY }}>
              <motion.span className="nf-page__hero-pill" variants={LIFT}>
                <span className="nf-page__hero-pill-dot" aria-hidden />
                Negotiation Flow · v0.9 beta
              </motion.span>

              <motion.h1
                className="nf-page__hero-title"
                variants={WORD_STAGGER}
              >
                <span className="nf-page__hero-word">
                  <motion.span className="nf-page__hero-word-inner" variants={LIFT_WORD}>
                    Design.
                  </motion.span>
                </span>{' '}
                <span className="nf-page__hero-word">
                  <motion.span
                    className="nf-page__hero-word-inner nf-page__hero-mute"
                    variants={LIFT_WORD}
                  >
                    Simulate.
                  </motion.span>
                </span>{' '}
                <span className="nf-page__hero-word">
                  <motion.span
                    className="nf-page__hero-word-inner nf-page__hero-italic"
                    variants={SLIDE_LR}
                  >
                    Ship.
                  </motion.span>
                </span>
              </motion.h1>

              <motion.p className="nf-page__hero-subtitle" variants={LIFT}>
                A workbench to explore prototypes, tune financial rules and measure
                experiments — without leaving the flow.
              </motion.p>

              <motion.div className="nf-page__hero-actions" variants={LIFT}>
                <button
                  type="button"
                  className="nf-page__cta"
                  onClick={() => onNavigate('/emulator')}
                >
                  Launch emulator
                  <ArrowRight size={20} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  className="nf-page__cta nf-page__cta--ghost"
                  onClick={() => onNavigate('/experience-architecture')}
                >
                  See architecture
                </button>
              </motion.div>
            </motion.div>

            <HeroVisual parallaxY={heroImageY} scrollProgress={spHeroSmooth} />
          </motion.div>

          <ScrollCue />
        </section>

        {/* ═══ FEATURES — Overlap studio, symmetric ═══ */}
        <section ref={featuresRef} className="hp-fold nf-page__container">
          <div className="nf-page__section-head">
            <div className="nf-page__section-head-left">
              <motion.span
                className="nf-page__eyebrow nf-page__eyebrow--sticky"
                style={{ y: featHeadY, scale: featHeadScale }}
              >
                Index · 05 entries
              </motion.span>
              <motion.h2
                className="nf-page__section-title"
                style={{ y: featHeadY, scale: featHeadScale }}
              >
                Five ways{' '}
                <span className="nf-page__hero-italic">in</span>.
              </motion.h2>
            </div>
            <p className="nf-page__section-desc">
              Each entry opens a focused workspace. Open one, come back to the index whenever.
            </p>
          </div>

          <FeatureGrid
            features={FEATURES}
            onNavigate={onNavigate}
            scrollProgress={spFeatSmooth}
          />

          <div className="hp-fold-foot">
            <span>— NF / 2026</span>
            <span>Roll the flow, tune the math.</span>
          </div>
        </section>

        {/* ═══ DEMO VIDEO — fade-in centered clip ═══ */}
        <section ref={videoRef} className="hp-fold nf-page__container nf-page__video-fold">
          <div className="nf-page__section-head nf-page__section-head--single">
            <div className="nf-page__section-head-left">
              <span className="nf-page__eyebrow">Live · 20s loop</span>
              <h2 className="nf-page__section-title">
                See it{' '}
                <span className="nf-page__hero-italic">in flow</span>.
              </h2>
            </div>
            <p className="nf-page__section-desc">
              A continuous tour of the negotiation flow. No narration, no cuts —
              just the product in motion.
            </p>
          </div>

          <motion.div
            className="nf-page__video-embed"
            style={{ opacity: videoOpacity, scale: videoScale }}
          >
            <video
              src={`${import.meta.env.BASE_URL}demo.mp4`}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
            />
            <span className="nf-page__video-embed-caption" aria-hidden>
              — Demo · live loop
            </span>
          </motion.div>
        </section>

        {/* ═══ SCREEN COMPARE HIGHLIGHT — teaser fold ═══ */}
        <section className="hp-fold nf-page__container">
          <ScreenCompareFold onNavigate={onNavigate} />
        </section>

        {/* ═══ LIBRARY — editorial list with staircase reveal ═══ */}
        <section ref={libraryRef} className="hp-fold nf-page__container nf-page__library-fold">
          <MarqueeBanners />

          <div className="nf-page__section-head">
            <div className="nf-page__section-head-left">
              <motion.span
                className="nf-page__eyebrow nf-page__eyebrow--sticky"
                style={{ y: libHeadY, scale: libHeadScale }}
              >
                Library · 06 clips
              </motion.span>
              <motion.h2
                className="nf-page__section-title"
                style={{ y: libHeadY, scale: libHeadScale }}
              >
                Short reads,
                <span className="nf-page__section-title-stack">
                  <span className="nf-page__hero-emph">fewer tabs</span>.
                </span>
              </motion.h2>
            </div>
            <p className="nf-page__section-desc">
              Quick guides on the features that change often. No fluff.
            </p>
          </div>

          <div className="nf-page__video-list">
            {LIBRARY.map((v, i) => (
              <motion.button
                key={v.id}
                type="button"
                className="nf-page__video-row"
                initial={{ opacity: 0, x: -28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => undefined}
              >
                <span className="nf-page__video-row-index">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="nf-page__video-row-track">{v.track}</span>
                <h3 className="nf-page__video-row-title">{v.title}</h3>
                <span className="nf-page__video-row-soon" aria-label="Coming soon">
                  Soon
                </span>
                <span className="nf-page__video-row-duration">{v.duration}</span>
                <ArrowUpRight
                  size={22}
                  strokeWidth={1.8}
                  className="nf-page__video-row-arrow"
                  aria-hidden
                />
              </motion.button>
            ))}
          </div>

          <div className="hp-fold-foot">
            <span>— End of index</span>
            <span>More coming soon.</span>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Hero visual — transparent card with cursor-tilt + parallax        */
/* ═══════════════════════════════════════════════════════════════════ */

function HeroVisual({
  parallaxY,
  scrollProgress,
}: {
  parallaxY: MotionValue<number>;
  scrollProgress: MotionValue<number>;
}) {
  const base = import.meta.env.BASE_URL;

  /*
   * Block-level cursor tracking. mx/my are normalized to [-0.5..0.5]
   * and drive BOTH the main card tilt and each satellite's parallax
   * offset — so the whole visual reacts as a single block when the
   * cursor enters anywhere over it, not card-by-card.
   */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sMx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.6 });
  const sMy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.6 });

  const rotY = useTransform(sMx, [-0.5, 0.5], [-14, 14]);
  const rotX = useTransform(sMy, [-0.5, 0.5], [10, -10]);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mx.set((e.clientX - rect.left) / rect.width - 0.5);
      my.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [mx, my],
  );

  const onLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  /*
   * Scroll-driven satellite spread.
   * At rest (scroll=0) each satellite sits close to the main card.
   * As the hero scrolls out (scroll→1) they drift away from the
   * center — TL goes up-left, BL down-left, BR down-right — and
   * fade slightly. Scrolling back up brings them home on the same
   * path. Spring-smoothed in the parent for ease-in/out feel.
   */
  const tlScrollX = useTransform(scrollProgress, [0, 1], [0, -130]);
  const tlScrollY = useTransform(scrollProgress, [0, 1], [0, -190]);
  const tlRot = useTransform(scrollProgress, [0, 1], [-18, -34]);
  const tlScale = useTransform(scrollProgress, [0, 1], [1, 0.82]);
  const tlOpacity = useTransform(scrollProgress, [0, 0.6, 1], [1, 0.7, 0]);

  const blScrollX = useTransform(scrollProgress, [0, 1], [0, -110]);
  const blScrollY = useTransform(scrollProgress, [0, 1], [0, 80]);
  const blRot = useTransform(scrollProgress, [0, 1], [-8, -24]);
  const blScale = useTransform(scrollProgress, [0, 1], [1, 0.78]);
  const blOpacity = useTransform(scrollProgress, [0, 0.6, 1], [0.92, 0.55, 0]);

  const brScrollX = useTransform(scrollProgress, [0, 1], [0, 140]);
  const brScrollY = useTransform(scrollProgress, [0, 1], [0, 170]);
  const brRot = useTransform(scrollProgress, [0, 1], [22, 40]);
  const brScale = useTransform(scrollProgress, [0, 1], [1, 0.8]);
  const brOpacity = useTransform(scrollProgress, [0, 0.6, 1], [1, 0.7, 0]);

  /*
   * Parallax offsets driven by block cursor position. Each satellite
   * has its own parallax "depth" so the block reads as layered: the
   * near card (BR) translates the most, the far card (TL) the least,
   * and each rotates slightly toward the cursor.
   */
  const tlParX = useTransform(sMx, [-0.5, 0.5], [22, -22]);
  const tlParY = useTransform(sMy, [-0.5, 0.5], [16, -16]);
  const tlParRot = useTransform(sMx, [-0.5, 0.5], [-3, 3]);

  const blParX = useTransform(sMx, [-0.5, 0.5], [30, -30]);
  const blParY = useTransform(sMy, [-0.5, 0.5], [22, -22]);
  const blParRot = useTransform(sMx, [-0.5, 0.5], [-4, 4]);

  const brParX = useTransform(sMx, [-0.5, 0.5], [-38, 38]);
  const brParY = useTransform(sMy, [-0.5, 0.5], [-26, 26]);
  const brParRot = useTransform(sMx, [-0.5, 0.5], [4, -4]);

  /* Combine scroll translation + cursor parallax into single motion values. */
  const tlX = useTransform([tlScrollX, tlParX] as const, ([s, p]) => (s as number) + (p as number));
  const tlY = useTransform([tlScrollY, tlParY] as const, ([s, p]) => (s as number) + (p as number));
  const tlRotate = useTransform([tlRot, tlParRot] as const, ([s, p]) => (s as number) + (p as number));

  const blX = useTransform([blScrollX, blParX] as const, ([s, p]) => (s as number) + (p as number));
  const blY = useTransform([blScrollY, blParY] as const, ([s, p]) => (s as number) + (p as number));
  const blRotate = useTransform([blRot, blParRot] as const, ([s, p]) => (s as number) + (p as number));

  const brX = useTransform([brScrollX, brParX] as const, ([s, p]) => (s as number) + (p as number));
  const brY = useTransform([brScrollY, brParY] as const, ([s, p]) => (s as number) + (p as number));
  const brRotate = useTransform([brRot, brParRot] as const, ([s, p]) => (s as number) + (p as number));

  return (
    <motion.div
      className="nf-page__hero-visual"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ y: parallaxY }}
    >
      <motion.span
        className="nf-page__hero-satellite nf-page__hero-satellite--tl"
        style={{ x: tlX, y: tlY, rotate: tlRotate, scale: tlScale, opacity: tlOpacity }}
      >
        <motion.span
          className="nf-page__hero-satellite-jitter"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: HERO_DELAY + 0.95 }}
        >
          <img src={`${base}brand/cards/angle-66.png`} alt="" aria-hidden />
        </motion.span>
      </motion.span>

      <motion.span
        className="nf-page__hero-satellite nf-page__hero-satellite--bl"
        style={{ x: blX, y: blY, rotate: blRotate, scale: blScale, opacity: blOpacity }}
      >
        <motion.span
          className="nf-page__hero-satellite-jitter"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: HERO_DELAY + 1.15 }}
        >
          <img src={`${base}brand/cards/angle-69.png`} alt="" aria-hidden />
        </motion.span>
      </motion.span>

      <motion.span
        className="nf-page__hero-satellite nf-page__hero-satellite--br"
        style={{ x: brX, y: brY, rotate: brRotate, scale: brScale, opacity: brOpacity }}
      >
        <motion.span
          className="nf-page__hero-satellite-jitter"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: HERO_DELAY + 1.05 }}
        >
          <img src={`${base}brand/cards/angle-84.png`} alt="" aria-hidden />
        </motion.span>
      </motion.span>

      <motion.img
        className="nf-page__hero-visual-img"
        src={`${base}brand/cards/hero.png`}
        alt="Nubank card — brand signature"
        loading="eager"
        style={{ rotateX: rotX, rotateY: rotY }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: HERO_DELAY + 0.85 }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  HeroLoader — aurora field + drifting formulas, crescendos on "welcome" */
/* ═══════════════════════════════════════════════════════════════════ */

/*
 * Mounts on top of the viewport (position: fixed) so the aurora
 * bleeds edge-to-edge without respecting the hero container
 * padding. A set of 4 soft purple blobs glide organically,
 * intermittent dust motes bloom and fade at random positions,
 * and "welcome" appears last as the crescendo before the page
 * elements take over.
 */
function HeroLoader() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const shell = document.querySelector('.hp-shell') as HTMLElement | null;
    if (shell) shell.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const t = window.setTimeout(() => {
      setMounted(false);
      if (shell) shell.style.overflow = '';
      document.documentElement.style.overflow = '';
    }, HERO_LOADER_DURATION);
    return () => {
      window.clearTimeout(t);
      if (shell) shell.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  /*
   * Formula field — instead of dust motes, the loader drifts tiny
   * math / finance snippets through the screen (a nod to the
   * "Nazaré confused math lady" meme, kept tasteful). Each glyph
   * picks a depth layer so the field reads volumetric:
   *   depth 0 → far   (tiny, blurred, low alpha — pure symbols: π ∫ Σ)
   *   depth 1 → mid   (small, sharp, muted — short expressions)
   *   depth 2 → near  (larger, saturated — currency / percentages)
   * Positions, depths and delays are deterministic so SSR/CSR match.
   */
  const glyphs = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => {
        const top = 10 + ((i * 53) % 80);
        const left = 5 + ((i * 71 + 23) % 90);
        const depth = i % 3;
        const pool = depth === 0 ? FORMULA_FAR : depth === 1 ? FORMULA_MID : FORMULA_NEAR;
        const text = pool[i % pool.length];
        const delay = (i * 97) % 2200;
        const duration = 2600 + ((i * 67) % 1400);
        const blur = depth === 0 ? 1.8 + ((i * 2) % 2) * 0.6 : depth === 1 ? 0.5 : 0;
        const drift = ((i * 17) % 30) - 15;
        const rotate = ((i * 13) % 8) - 4;
        const zStart = -(100 + ((i * 41) % 600));
        return { id: i, top, left, text, depth, delay, duration, blur, drift, rotate, zStart };
      }),
    [],
  );

  if (!mounted) return null;

  return (
    <div className="nf-page__hero-loader" aria-hidden>
      <span className="nf-page__hero-loader-welcome">
        {'welcome'.split('').map((ch, i) => (
          <span
            key={i}
            className="nf-page__hero-loader-welcome-char"
            style={{ animationDelay: `${1400 + i * 120}ms` }}
          >
            {ch}
          </span>
        ))}
      </span>

      <div className="nf-page__hero-loader-aurora">
        <span className="nf-page__hero-loader-blob nf-page__hero-loader-blob--a" />
        <span className="nf-page__hero-loader-blob nf-page__hero-loader-blob--b" />
        <span className="nf-page__hero-loader-blob nf-page__hero-loader-blob--c" />
        <span className="nf-page__hero-loader-blob nf-page__hero-loader-blob--d" />
      </div>

      <div className="nf-page__hero-loader-dust">
        <div className="nf-page__hero-loader-field">
          {glyphs.map((g) => (
            <span
              key={g.id}
              className={`nf-page__hero-loader-glyph nf-page__hero-loader-glyph--d${g.depth}`}
              style={{
                top: `${g.top}%`,
                left: `${g.left}%`,
                filter: g.blur ? `blur(${g.blur}px)` : undefined,
                ['--glyph-drift' as string]: `${g.drift}px`,
                ['--glyph-rotate' as string]: `${g.rotate}deg`,
                ['--glyph-z' as string]: `${g.zStart}px`,
                ['--glyph-delay' as string]: `${g.delay}ms`,
                ['--glyph-dur' as string]: `${g.duration}ms`,
              }}
            >
              {g.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Scroll cue — animated indicator at the base of the first fold     */
/* ═══════════════════════════════════════════════════════════════════ */

function ScrollCue() {
  return (
    <motion.div
      className="nf-page__scroll-cue"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: HERO_DELAY + 1.4, duration: 0.6, ease: EASE }}
      aria-hidden
    >
      <span>Scroll</span>
      <span className="nf-page__scroll-cue-track">
        <span className="nf-page__scroll-cue-dot" />
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Feature Card — symmetric, image as muted background, staggered in */
/* ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════ */
/*  MarqueeBanners — two diagonal strips with "coming soon" i18n       */
/* ═══════════════════════════════════════════════════════════════════ */

const COMING_SOON = [
  'Em breve',
  'Coming soon',
  'Bientôt',
  'Próximamente',
  'Demnächst',
  'Presto',
  'Wkrótce',
  '近日公開',
  '即将推出',
  'Скоро',
  'Binnenkort',
  'Yakında',
];

function MarqueeBanners() {
  /*
   * Two overlapping diagonal strips: one goes +8° (accent color,
   * scrolling left→right), the other -8° (dark, scrolling
   * right→left). The content is duplicated once so the loop is
   * seamless. Separators are subtle × glyphs.
   */
  const content = useMemo(
    () =>
      COMING_SOON.flatMap((w, i) => [
        <span key={`${w}-${i}`} className="nf-page__marquee-word">
          {w}
        </span>,
        <span key={`${w}-${i}-sep`} className="nf-page__marquee-sep" aria-hidden>
          ×
        </span>,
      ]),
    [],
  );

  return (
    <div className="nf-page__marquee-stack" aria-hidden>
      <div className="nf-page__marquee nf-page__marquee--accent">
        <div className="nf-page__marquee-track">
          {content}
          {content}
        </div>
      </div>
      <div className="nf-page__marquee nf-page__marquee--dark">
        <div className="nf-page__marquee-track nf-page__marquee-track--rev">
          {content}
          {content}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  ScreenCompareFold — teaser for the upcoming compare tool           */
/* ═══════════════════════════════════════════════════════════════════ */

function ScreenCompareFold({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const subtleBg = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
        borderRadius: 24,
        border: `1px solid ${borderColor}`,
        overflow: 'hidden',
        background: subtleBg,
      }}
    >
      {/* Left — copy */}
      <div style={{
        padding: '56px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: palette.accentSubtle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <SplitSquareHorizontal size={20} strokeWidth={1.6} style={{ color: palette.accent }} />
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: palette.accent,
          }}>
            Coming Soon
          </span>
        </div>

        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          lineHeight: 1.2,
          color: palette.textPrimary,
          margin: 0,
        }}>
          Screen Compare
        </h2>

        <p style={{
          fontSize: 15,
          lineHeight: 1.65,
          color: palette.textSecondary,
          margin: 0,
          maxWidth: 420,
        }}>
          Place Figma designs and live platform screens side by side to catch every mismatch.
          Or diff two Figma files to track how the design evolved between versions.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
          {['Figma vs Platform', 'Figma vs Figma', 'Pixel overlay'].map((tag) => (
            <span
              key={tag}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: palette.textSecondary,
                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${borderColor}`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/screen-compare')}
          style={{
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
            background: 'transparent',
            color: palette.textPrimary,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            alignSelf: 'flex-start',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Learn more
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Right — illustrative placeholder */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background: isLight
          ? `linear-gradient(135deg, ${palette.accentSubtle}, rgba(79,70,229,0.06))`
          : `linear-gradient(135deg, ${palette.accent}12, ${palette.accent}06)`,
        borderLeft: `1px solid ${borderColor}`,
        minHeight: 340,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 360,
          aspectRatio: '16/10',
          borderRadius: 16,
          border: `2px dashed ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)',
        }}>
          <SplitSquareHorizontal size={36} strokeWidth={1.2} style={{ color: palette.accent, opacity: 0.5 }} />
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: palette.textSecondary,
            opacity: 0.6,
            letterSpacing: '0.3px',
          }}>
            Illustration placeholder
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  FeatureGrid — shared cursor tracker so every card reacts at once  */
/* ═══════════════════════════════════════════════════════════════════ */

/*
 * The grid owns the mouse position. Each FeatureCard subscribes
 * to the same MotionValues, so a hover on one area of the grid
 * tilts every card based on its distance to the cursor — the
 * whole block animates, not just the hovered card.
 */
function FeatureGrid({
  features,
  onNavigate,
  scrollProgress,
}: {
  features: readonly Feature[];
  onNavigate: (path: string) => void;
  scrollProgress: MotionValue<number>;
}) {
  const gridMouseX = useMotionValue(0.5);
  const gridMouseY = useMotionValue(0.5);
  const gridActive = useMotionValue(0);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      gridMouseX.set((e.clientX - rect.left) / rect.width);
      gridMouseY.set((e.clientY - rect.top) / rect.height);
    },
    [gridMouseX, gridMouseY],
  );

  const onEnter = useCallback(() => {
    gridActive.set(1);
  }, [gridActive]);

  const onLeave = useCallback(() => {
    gridActive.set(0);
    gridMouseX.set(0.5);
    gridMouseY.set(0.5);
  }, [gridActive, gridMouseX, gridMouseY]);

  return (
    <div
      className="nf-page__feature-grid"
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {features.map((f, i) => (
        <FeatureCard
          key={f.id}
          feature={f}
          index={i}
          onNavigate={onNavigate}
          scrollProgress={scrollProgress}
          gridMouseX={gridMouseX}
          gridMouseY={gridMouseY}
          gridActive={gridActive}
        />
      ))}
    </div>
  );
}

/*
 * Per-card scroll entry offsets + idle 3D attitude. Every card
 * shares the same anatomy; these values drive how it drifts in
 * and out as the section enters/exits the viewport, plus a
 * shallow idle rotation in 3D so the group reads as floating.
 * `cx`, `cy` are the card's visual center in grid space [0..1]
 * so cards can react collectively to cursor position on the grid.
 */
const FEATURE_SCROLL = [
  { inX: -18, inY: 24,  outX: -14, outY: -22, baseRotY: -6, baseRotX:  3, baseZ: 20, cx: 0.25, cy: 0.25 },
  { inX:  22, inY: 18,  outX:  18, outY: -20, baseRotY:  5, baseRotX: -3, baseZ: 12, cx: 0.75, cy: 0.25 },
  { inX: -20, inY: -18, outX: -16, outY:  22, baseRotY: -5, baseRotX: -3, baseZ: 16, cx: 0.17, cy: 0.75 },
  { inX:   0, inY: -20, outX:   0, outY:  18, baseRotY:  0, baseRotX:  3, baseZ: 14, cx: 0.50, cy: 0.75 },
  { inX:  20, inY: -18, outX:  16, outY:  22, baseRotY:  5, baseRotX: -3, baseZ: 18, cx: 0.83, cy: 0.75 },
] as const;

function FeatureCard({
  feature,
  index,
  onNavigate,
  scrollProgress,
  gridMouseX,
  gridMouseY,
  gridActive,
}: {
  feature: Feature;
  index: number;
  onNavigate: (path: string) => void;
  scrollProgress: MotionValue<number>;
  gridMouseX: MotionValue<number>;
  gridMouseY: MotionValue<number>;
  gridActive: MotionValue<number>;
}) {
  const disabled = !feature.ready;
  const base = import.meta.env.BASE_URL;
  const [isHover, setIsHover] = useState(false);

  const m = FEATURE_SCROLL[index % FEATURE_SCROLL.length];

  /*
   * Scroll-mapped position: card slides in from a direction,
   * rests in the middle of the section, then drifts out on exit.
   */
  const x = useTransform(
    scrollProgress,
    [0, 0.45, 0.55, 1],
    [`${m.inX}%`, '0%', '0%', `${m.outX}%`],
  );
  const y = useTransform(
    scrollProgress,
    [0, 0.45, 0.55, 1],
    [`${m.inY}%`, '0%', '0%', `${m.outY}%`],
  );
  const opacity = useTransform(
    scrollProgress,
    [0, 0.2, 0.45, 0.55, 0.8, 1],
    [0, 0.65, 1, 1, 0.65, 0],
  );

  /*
   * Grid-level cursor response — every card reads the same cursor
   * position and tilts/translates based on its own center's offset
   * to the cursor. Close cards react strongly, far cards barely
   * move — the whole grid behaves like a single field of cards.
   *
   *   dx, dy  : signed distance from the card center to the cursor
   *   falloff : radial falloff so far-away cards only whisper
   *   gridActive transitions 0→1 on mouseenter and back to 0 on leave
   */
  const dx = useTransform([gridMouseX, gridActive] as const, ([mx, a]) => ((mx as number) - m.cx) * (a as number));
  const dy = useTransform([gridMouseY, gridActive] as const, ([my, a]) => ((my as number) - m.cy) * (a as number));

  const sDx = useSpring(dx, { stiffness: 110, damping: 20, mass: 0.5 });
  const sDy = useSpring(dy, { stiffness: 110, damping: 20, mass: 0.5 });

  /* Card tilts toward cursor + lifts when cursor is near. */
  const cardRotY = useTransform(sDx, [-0.6, 0.6], [m.baseRotY - 10, m.baseRotY + 10]);
  const cardRotX = useTransform(sDy, [-0.6, 0.6], [m.baseRotX + 8, m.baseRotX - 8]);
  const cardTX = useTransform(sDx, [-0.6, 0, 0.6], [-14, 0, 14]);
  const cardTY = useTransform(sDy, [-0.6, 0, 0.6], [-10, 0, 10]);
  const cardZ = useTransform(
    [sDx, sDy] as const,
    ([xd, yd]) => {
      const d = Math.hypot(xd as number, yd as number);
      const falloff = Math.max(0, 1 - d * 1.6);
      return m.baseZ + falloff * 40;
    },
  );

  /* Thumb image parallax — 3× the card translation so the image
   * feels like it floats over the card. Scale grows when cursor
   * is close; baseline 1.32 zooms past the atmospheric edges of
   * the PNG illustrations. */
  const thumbX = useTransform(sDx, [-0.6, 0.6], [-18, 18]);
  const thumbY = useTransform(sDy, [-0.6, 0.6], [-12, 12]);
  const thumbScale = useTransform(
    [sDx, sDy] as const,
    ([xd, yd]) => {
      const d = Math.hypot(xd as number, yd as number);
      return 1.32 + Math.min(d * 0.22, 0.13);
    },
  );

  /*
   * Image zoom is handled entirely in CSS (scale 1.18 at rest,
   * scale 1.28 on .nf-page__feature:hover). No JS motion needed
   * for the image itself — that avoids any sub-pixel drift from
   * motion transforms combining with the card's 3D rotation.
   */

  return (
    <motion.button
      type="button"
      className={`nf-page__feature${disabled ? ' nf-page__feature--disabled' : ''}`}
      onClick={() => (disabled ? undefined : onNavigate(feature.path))}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        x,
        y,
        opacity,
        rotateY: cardRotY,
        rotateX: cardRotX,
        translateZ: cardZ,
      }}
      aria-disabled={disabled}
    >
      <motion.div
        className="nf-page__feature-float"
        style={{ x: cardTX, y: cardTY }}
      >
        {/*
         * Thumb frame stays locked to the card; the <img> inside is
         * a plain element scaled via CSS (rest 1.18, hover 1.28).
         * No motion transforms on the image — the card's 3D
         * rotation (rotateX/Y + translateZ) was combining with
         * motion's own scale/translate to produce sub-pixel gaps
         * at the card edges, exposing the white card background.
         */}
        <motion.div
          className="nf-page__feature-thumb"
          style={{ x: thumbX, y: thumbY, scale: thumbScale }}
        >
          <img
            src={`${base}${feature.image.replace(/^\//, '')}`}
            alt=""
            loading="lazy"
          />
        </motion.div>

        {!disabled && (
          <motion.div
            className="nf-page__feature-arrow"
            aria-hidden
            animate={{
              rotate: isHover ? 0 : -8,
            }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <ArrowUpRight size={17} strokeWidth={1.8} />
          </motion.div>
        )}

        <div className="nf-page__feature-body">
          <div className="nf-page__feature-meta">
            <span className="nf-page__feature-meta-index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span aria-hidden>·</span>
            <span
              className={
                feature.ready
                  ? 'nf-page__feature-meta-status--ready'
                  : 'nf-page__feature-meta-status--soon'
              }
            >
              {feature.ready ? 'WIP' : 'Soon'}
            </span>
          </div>
          <h3 className="nf-page__feature-title">{feature.title}</h3>
          <p className="nf-page__feature-desc">{feature.description}</p>
        </div>
      </motion.div>
    </motion.button>
  );
}
