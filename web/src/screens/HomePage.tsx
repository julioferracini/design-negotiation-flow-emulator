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

export default function HomePage({ onNavigate }: HomePageProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  const pageBg = isLight ? '#F8F7F9' : '#0A0A0A';

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'auto',
      background: pageBg, transition: 'background 0.3s ease',
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '60px 40px 80px 72px' }}>

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
            background: isLight ? palette.accentSubtle : `${palette.accent}18`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: palette.accent, letterSpacing: '0.3px' }}>
              Product Platform
            </span>
          </div>

          <h1 style={{
            fontSize: 56, fontWeight: 400, letterSpacing: '-2px', lineHeight: 1.06,
            color: palette.textPrimary, margin: '0 0 18px', maxWidth: 640,
            transition: 'color 0.3s ease',
          }}>
            Design, simulate{isLight ? ',' : ','}<br />
            and ship negotiation<br />
            flows
          </h1>

          <p style={{
            fontSize: 16, lineHeight: 1.6, color: palette.textSecondary,
            maxWidth: 440, margin: 0, transition: 'color 0.3s ease',
          }}>
            Explore prototypes, manage experiments, and track product
            performance — all from one place.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'auto auto',
          gap: 16,
        }}>
          {/* Flow Management — hero card spanning 7 cols */}
          <BentoCard
            feature={FEATURES[1]}
            onNavigate={onNavigate}
            palette={palette}
            isLight={isLight}
            delay={0.1}
            style={{
              gridColumn: '1 / 8',
              gridRow: '1 / 3',
              minHeight: 320,
            }}
            variant="hero"
          />

          {/* Glossary — top-right */}
          <BentoCard
            feature={FEATURES[0]}
            onNavigate={onNavigate}
            palette={palette}
            isLight={isLight}
            delay={0.18}
            style={{ gridColumn: '8 / 13', gridRow: '1 / 2' }}
          />

          {/* Emulator — bottom-right */}
          <BentoCard
            feature={FEATURES[2]}
            onNavigate={onNavigate}
            palette={palette}
            isLight={isLight}
            delay={0.26}
            style={{ gridColumn: '8 / 13', gridRow: '2 / 3' }}
          />

          {/* Analytics — full-width bottom */}
          <BentoCard
            feature={FEATURES[3]}
            onNavigate={onNavigate}
            palette={palette}
            isLight={isLight}
            delay={0.34}
            style={{ gridColumn: '1 / 13' }}
            variant="wide"
          />
        </div>
      </div>
    </div>
  );
}

/* ───────── Bento Card ───────── */

type Palette = ReturnType<typeof useTheme>['palette'];

function BentoCard({
  feature, onNavigate, palette, isLight, delay, style, variant,
}: {
  feature: (typeof FEATURES)[number];
  onNavigate: (path: string) => void;
  palette: Palette;
  isLight: boolean;
  delay: number;
  style?: React.CSSProperties;
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onNavigate(feature.path)}
      style={{
        ...style,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isHero ? 10 : 6 }}>
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
