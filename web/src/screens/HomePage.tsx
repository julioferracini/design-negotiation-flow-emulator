import { motion } from 'motion/react';
import { Monitor, BarChart3, GitBranch, BookOpen, ArrowRight } from 'lucide-react';
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
    subtitle: 'Browse use cases with navigable prototypes, mocked data, and configurable financial and regulatory parameters.',
    ready: true,
  },
  {
    id: 'analytics',
    path: '/analytics',
    icon: BarChart3,
    title: 'Analytics',
    subtitle: 'Shortcuts for product performance analysis — conversion funnels, experiment outcomes, and real-time dashboards.',
    ready: false,
  },
] as const;

const RESPONSIVE_CSS = `
  .hp-wrap { max-width: 1080px; margin: 0 auto; padding: 60px 40px 80px 72px; position: relative; z-index: 1; }
  .hp-title { font-size: 64px; font-weight: 400; letter-spacing: -2.5px; line-height: 1.04; margin: 0 0 18px; max-width: 680px; }
  .hp-subtitle { font-size: 16px; line-height: 1.6; max-width: 440px; margin: 0; }
  .hp-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: auto auto;
    gap: 16px;
  }
  .hp-card-hero { grid-column: 1 / 8; grid-row: 1 / 3; min-height: 320px; }
  .hp-card-tr { grid-column: 8 / 13; grid-row: 1 / 2; }
  .hp-card-br { grid-column: 8 / 13; grid-row: 2 / 3; }
  .hp-card-full { grid-column: 1 / 13; }

  /* Neon blobs */
  .hp-neon {
    position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
  }
  .hp-neon-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.07;
    will-change: transform;
  }
  .hp-neon-blob.light { opacity: 0.14; }
  .hp-neon-blob.dark { opacity: 0.18; }

  .hp-blob-1 {
    width: 600px; height: 600px; top: -10%; left: -8%;
    animation: hp-drift-1 25s ease-in-out infinite alternate;
  }
  .hp-blob-2 {
    width: 500px; height: 500px; top: 30%; right: -12%;
    animation: hp-drift-2 30s ease-in-out infinite alternate;
  }
  .hp-blob-3 {
    width: 400px; height: 400px; bottom: -5%; left: 25%;
    animation: hp-drift-3 22s ease-in-out infinite alternate;
  }

  @keyframes hp-drift-1 {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(80px, 60px) scale(1.1); }
    100% { transform: translate(-40px, 100px) scale(0.95); }
  }
  @keyframes hp-drift-2 {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(-70px, -50px) scale(1.08); }
    100% { transform: translate(30px, -80px) scale(0.92); }
  }
  @keyframes hp-drift-3 {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(60px, -40px) scale(1.05); }
    100% { transform: translate(-50px, 30px) scale(0.97); }
  }

  @media (max-width: 900px) {
    .hp-wrap { padding: 48px 28px 60px 64px; }
    .hp-title { font-size: 48px; letter-spacing: -2px; }
    .hp-subtitle { font-size: 15px; }
    .hp-grid {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto;
    }
    .hp-card-hero { grid-column: 1 / -1; grid-row: auto; min-height: 240px; }
    .hp-card-tr { grid-column: 1 / 2; grid-row: auto; }
    .hp-card-br { grid-column: 2 / 3; grid-row: auto; }
    .hp-card-full { grid-column: 1 / -1; }
  }

  @media (max-width: 600px) {
    .hp-wrap { padding: 36px 20px 48px 20px; }
    .hp-title { font-size: 36px; letter-spacing: -1.2px; line-height: 1.1; }
    .hp-subtitle { font-size: 14px; }
    .hp-grid {
      grid-template-columns: 1fr;
    }
    .hp-card-hero { min-height: auto; }
    .hp-card-tr, .hp-card-br { grid-column: 1 / -1; }
  }
`;

export default function HomePage({ onNavigate }: HomePageProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  const pageBg = isLight ? '#F8F7F9' : '#0A0A0A';

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      {/* Neon ambient blobs — fixed behind everything */}
      <div className="hp-neon" style={{ background: pageBg, transition: 'background 0.3s ease' }}>
        <div className={`hp-neon-blob hp-blob-1 ${isLight ? 'light' : 'dark'}`} style={{ background: palette.accent }} />
        <div className={`hp-neon-blob hp-blob-2 ${isLight ? 'light' : 'dark'}`} style={{ background: isLight ? '#6366F1' : '#A78BFA' }} />
        <div className={`hp-neon-blob hp-blob-3 ${isLight ? 'light' : 'dark'}`} style={{ background: isLight ? '#EC4899' : '#F472B6' }} />
      </div>

      {/* Scrollable content */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100vw', height: '100vh', overflow: 'auto',
      }}>
      <div className="hp-wrap">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ marginBottom: 48 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '8px 20px', borderRadius: 9999, marginBottom: 24,
            background: palette.accent,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.3px' }}>
              Product Platform
            </span>
          </div>

          <h1
            className="hp-title"
            style={{ color: palette.textPrimary, transition: 'color 0.3s ease' }}
          >
            Design, simulate,<br />
            and ship negotiation<br />
            flows
          </h1>

          <p
            className="hp-subtitle"
            style={{ color: palette.textSecondary, transition: 'color 0.3s ease' }}
          >
            Explore prototypes, manage experiments, and track product
            performance — all from one place.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="hp-grid">
          <BentoCard
            feature={FEATURES[1]}
            onNavigate={onNavigate}
            palette={palette}
            isLight={isLight}
            delay={0.1}
            className="hp-card-hero"
            variant="hero"
          />
          <BentoCard
            feature={FEATURES[0]}
            onNavigate={onNavigate}
            palette={palette}
            isLight={isLight}
            delay={0.18}
            className="hp-card-tr"
          />
          <BentoCard
            feature={FEATURES[2]}
            onNavigate={onNavigate}
            palette={palette}
            isLight={isLight}
            delay={0.26}
            className="hp-card-br"
          />
          <BentoCard
            feature={FEATURES[3]}
            onNavigate={onNavigate}
            palette={palette}
            isLight={isLight}
            delay={0.34}
            className="hp-card-full"
            variant="wide"
          />
        </div>
      </div>
      </div>
    </>
  );
}

/* ───────── Bento Card ───────── */

type Palette = ReturnType<typeof useTheme>['palette'];

function BentoCard({
  feature, onNavigate, palette, isLight, delay, className, variant,
}: {
  feature: (typeof FEATURES)[number];
  onNavigate: (path: string) => void;
  palette: Palette;
  isLight: boolean;
  delay: number;
  className?: string;
  variant?: 'hero' | 'wide';
}) {
  const Icon = feature.icon;
  const isHero = variant === 'hero';
  const isWide = variant === 'wide';

  const cardBg = isHero
    ? `linear-gradient(145deg, ${palette.accent}, ${palette.accent}DD)`
    : isLight ? '#FFFFFF' : '#151515';
  const textColor = isHero ? '#FFFFFF' : palette.textPrimary;
  const subtitleColor = isHero ? 'rgba(255,255,255,0.75)' : palette.textSecondary;
  const iconBg = isHero
    ? 'rgba(255,255,255,0.18)'
    : feature.ready
      ? palette.accentSubtle
      : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)');
  const iconColor = isHero ? '#FFFFFF' : (feature.ready ? palette.accent : palette.textSecondary);
  const borderColor = isHero ? 'transparent' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)');
  const hoverBorderColor = isHero ? 'transparent' : (isLight ? 'rgba(130,10,209,0.2)' : 'rgba(163,94,235,0.25)');

  return (
    <motion.button
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onNavigate(feature.path)}
      style={{
        background: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 20,
        padding: isHero ? '36px 32px' : (isWide ? '24px 28px' : '24px'),
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: isWide ? 'row' : 'column',
        gap: isWide ? 24 : 16,
        alignItems: isWide ? 'center' : 'flex-start',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
        boxShadow: isHero
          ? `0 12px 40px ${palette.accent}35`
          : (isLight ? '0 1px 3px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.2)'),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverBorderColor;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = isHero
          ? `0 18px 50px ${palette.accent}45`
          : (isLight
            ? '0 12px 36px rgba(130,10,209,0.1), 0 1px 2px rgba(0,0,0,0.04)'
            : '0 12px 36px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)');
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderColor;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isHero
          ? `0 12px 40px ${palette.accent}35`
          : (isLight ? '0 1px 3px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.2)');
      }}
    >
      {/* Icon */}
      <div style={{
        width: isHero ? 56 : 44, height: isHero ? 56 : 44,
        borderRadius: isHero ? 16 : 12,
        background: iconBg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.3s ease',
      }}>
        <Icon size={isHero ? 26 : 20} strokeWidth={1.6} style={{ color: iconColor, transition: 'color 0.3s ease' } as React.CSSProperties} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isHero ? 10 : 6, flexWrap: 'wrap' }}>
          <h3 style={{
            fontSize: isHero ? 24 : 16, fontWeight: 650,
            letterSpacing: isHero ? '-0.5px' : '-0.2px',
            color: textColor, margin: 0, transition: 'color 0.3s ease',
          }}>
            {feature.title}
          </h3>
          {!isHero && (
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 5,
              background: feature.ready ? (isLight ? palette.accentSubtle : `${palette.accent}20`) : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
              color: feature.ready ? palette.accent : palette.textSecondary,
              whiteSpace: 'nowrap',
            }}>
              {feature.ready ? 'Available' : 'Soon'}
            </span>
          )}
        </div>
        <p style={{
          fontSize: isHero ? 15 : 13, lineHeight: 1.5,
          color: subtitleColor, margin: 0, transition: 'color 0.3s ease',
          maxWidth: isHero ? 380 : undefined,
        }}>
          {feature.subtitle}
        </p>
      </div>

      {/* Arrow */}
      {(feature.ready || isHero) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: isWide ? 0 : (isHero ? 8 : 0),
          ...(isWide ? {} : { paddingTop: isHero ? 0 : 4 }),
        }}>
          <span style={{
            fontSize: isHero ? 14 : 12, fontWeight: 600,
            color: isHero ? 'rgba(255,255,255,0.9)' : palette.accent,
          }}>
            {isHero ? 'Explore' : 'Open'}
          </span>
          <ArrowRight size={isHero ? 16 : 13} strokeWidth={2} style={{
            color: isHero ? 'rgba(255,255,255,0.9)' : palette.accent,
          } as React.CSSProperties} />
        </div>
      )}
    </motion.button>
  );
}
