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

  const pageBg = isLight ? '#FAFAFA' : '#0A0A0A';
  const cardBg = isLight ? '#FFFFFF' : '#141414';
  const cardBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const cardHoverBorder = isLight ? 'rgba(130,10,209,0.2)' : 'rgba(163,94,235,0.25)';
  const cardHoverShadow = isLight
    ? '0 8px 32px rgba(130,10,209,0.08), 0 1px 2px rgba(0,0,0,0.04)'
    : '0 8px 32px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)';
  const badgeBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
  const badgeReadyBg = isLight ? palette.accentSubtle : `${palette.accent}20`;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'auto',
      background: pageBg,
      transition: 'background 0.3s ease',
    }}>
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '80px 32px 60px',
      }}>
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}CC)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 28px',
              boxShadow: `0 8px 24px ${palette.accent}30`,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 16V4a2 2 0 0 1 2-2h11" />
              <path d="M5 14H4a2 2 0 1 0 0 4h1" />
              <path d="M22 18H11a2 2 0 1 0 0 4h11V6H11a2 2 0 0 0-2 2v12" />
            </svg>
          </motion.div>

          <h1 style={{
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: '-0.8px',
            lineHeight: 1.15,
            color: palette.textPrimary,
            margin: '0 0 16px',
            transition: 'color 0.3s ease',
          }}>
            Negotiation Flow Platform
          </h1>

          <p style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: palette.textSecondary,
            maxWidth: 520,
            margin: '0 auto',
            transition: 'color 0.3s ease',
          }}>
            Design, simulate, and manage the complete negotiation experience.
            Explore prototypes, track performance, and iterate faster.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
        }}>
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;

            return (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={() => onNavigate(feature.path)}
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 16,
                  padding: '28px 24px 24px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                  boxShadow: isLight
                    ? '0 1px 3px rgba(0,0,0,0.04)'
                    : '0 1px 3px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cardHoverBorder;
                  e.currentTarget.style.boxShadow = cardHoverShadow;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = cardBorder;
                  e.currentTarget.style.boxShadow = isLight
                    ? '0 1px 3px rgba(0,0,0,0.04)'
                    : '0 1px 3px rgba(0,0,0,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: feature.ready ? palette.accentSubtle : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.3s ease',
                  }}>
                    <Icon
                      size={20}
                      strokeWidth={1.7}
                      style={{
                        color: feature.ready ? palette.accent : palette.textSecondary,
                        transition: 'color 0.3s ease',
                      } as React.CSSProperties}
                    />
                  </div>

                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: feature.ready ? badgeReadyBg : badgeBg,
                    color: feature.ready ? palette.accent : palette.textSecondary,
                  }}>
                    {feature.ready ? 'Available' : 'Coming soon'}
                  </span>
                </div>

                <div>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 650,
                    color: palette.textPrimary,
                    margin: '0 0 6px',
                    letterSpacing: '-0.2px',
                    transition: 'color 0.3s ease',
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: palette.textSecondary,
                    margin: 0,
                    transition: 'color 0.3s ease',
                  }}>
                    {feature.subtitle}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 'auto',
                  paddingTop: 4,
                }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: feature.ready ? palette.accent : palette.textSecondary,
                    transition: 'color 0.3s ease',
                  }}>
                    {feature.ready ? 'Open' : 'Learn more'}
                  </span>
                  <ArrowRight
                    size={13}
                    strokeWidth={2}
                    style={{
                      color: feature.ready ? palette.accent : palette.textSecondary,
                      transition: 'color 0.3s ease',
                    } as React.CSSProperties}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
