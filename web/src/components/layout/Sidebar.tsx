import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Boxes, Clock, GitBranch, BookOpen, X, SplitSquareHorizontal } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const PLATFORM_VERSION = 'v1.0.0';
const PLATFORM_DESCRIPTION = 'A unified platform for designing, simulating, and shipping negotiation flows across all Nubank product lines. Built to give product, design, and engineering teams full visibility over the experience architecture.';
const PLATFORM_AUTHOR = 'Julio Ferracini — Design & Product';

export type SectionId = 'home' | 'emulator' | 'experience-architecture' | 'flow-management' | 'project-timeline' | 'glossary' | 'screen-compare';

interface MenuItem {
  id: SectionId;
  path: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'emulator',
    path: '/emulator',
    icon: Monitor,
    title: 'Emulator',
    subtitle: 'Use case prototypes with financial and regulatory parameters',
  },
  {
    id: 'screen-compare',
    path: '/screen-compare',
    icon: SplitSquareHorizontal,
    title: 'Screen Compare',
    subtitle: 'Side-by-side comparison of Figma designs and live platform screens',
  },
  {
    id: 'flow-management',
    path: '/flow-management',
    icon: GitBranch,
    title: 'Flow Management',
    subtitle: 'Advanced version control and active experiments',
  },
  {
    id: 'glossary',
    path: '/glossary',
    icon: BookOpen,
    title: 'Glossary',
    subtitle: 'Business terms and domain definitions',
  },
  {
    id: 'experience-architecture',
    path: '/experience-architecture',
    icon: Boxes,
    title: 'Experience Architecture',
    subtitle: 'Use case map and capability matrix',
  },
];

const TIMELINE_ITEM: MenuItem = {
  id: 'project-timeline',
  path: '/project-timeline',
  icon: Clock,
  title: 'Project Timeline',
  subtitle: 'Development progress and changelog',
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activeSection: SectionId;
  onNavigate: (path: string) => void;
}

export default function Sidebar({ open, onClose, activeSection, onNavigate }: SidebarProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open, onClose]);

  const sidebarBg = isLight ? '#FFFFFF' : '#111111';
  const headerBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const hoverBg = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
  const activeBg = isLight ? palette.accentSubtle : `${palette.accent}18`;
  const versionColor = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Sidebar Panel */}
          <motion.nav
            key="sidebar-panel"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 320,
              zIndex: 999,
              background: sidebarBg,
              boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px 24px 20px',
              borderBottom: `1px solid ${headerBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <button
                onClick={() => {
                  onNavigate('/');
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: palette.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <img src={`${import.meta.env.BASE_URL}nu-logo.svg`} alt="Nu" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: palette.textPrimary,
                    margin: 0,
                    lineHeight: 1.2,
                    letterSpacing: '-0.2px',
                  }}>
                    Negotiation Flow
                  </h2>
                  <span style={{
                    fontSize: 11,
                    color: palette.textSecondary,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}>
                    Platform
                  </span>
                </div>
              </button>

              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: palette.textSecondary,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Menu Items */}
            <div style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
              {MENU_ITEMS.map((item, i) => {
                const isActive = activeSection === item.id;
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i, duration: 0.25, ease: 'easeOut' }}
                    onClick={() => {
                      onNavigate(item.path);
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: 'none',
                      background: isActive ? activeBg : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: isActive ? palette.accent : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.2s ease',
                    }}>
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                        style={{
                          color: isActive ? '#fff' : palette.textSecondary,
                          transition: 'color 0.2s ease',
                        } as React.CSSProperties}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isActive ? palette.accent : palette.textPrimary,
                        lineHeight: 1.3,
                        letterSpacing: '-0.1px',
                        transition: 'color 0.2s ease',
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: palette.textSecondary,
                        lineHeight: 1.4,
                        marginTop: 2,
                      }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Project Timeline — pinned above footer */}
            {(() => {
              const isActive = activeSection === TIMELINE_ITEM.id;
              const TlIcon = TIMELINE_ITEM.icon;
              return (
                <div style={{ padding: '0 12px 4px', flexShrink: 0 }}>
                  <div style={{ height: 1, background: headerBorder, marginBottom: 8 }} />
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.25 }}
                    onClick={() => { onNavigate(TIMELINE_ITEM.path); onClose(); }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: 'none',
                      background: isActive ? activeBg : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = hoverBg; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: isActive ? palette.accent : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'background 0.2s ease',
                    }}>
                      <TlIcon size={18} strokeWidth={1.8} style={{ color: isActive ? '#fff' : palette.textSecondary, transition: 'color 0.2s ease' } as React.CSSProperties} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: isActive ? palette.accent : palette.textPrimary,
                        lineHeight: 1.3, letterSpacing: '-0.1px',
                        transition: 'color 0.2s ease',
                      }}>
                        {TIMELINE_ITEM.title}
                      </div>
                      <div style={{ fontSize: 12, color: palette.textSecondary, lineHeight: 1.4, marginTop: 2 }}>
                        {TIMELINE_ITEM.subtitle}
                      </div>
                    </div>
                  </motion.button>
                </div>
              );
            })()}

            {/* Footer — clickable */}
            <button
              onClick={() => setAboutOpen(true)}
              style={{
                width: '100%',
                padding: '16px 24px 20px',
                borderTop: `1px solid ${headerBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                borderTopStyle: 'solid',
                borderTopWidth: 1,
                borderTopColor: headerBorder,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 11, color: versionColor, fontWeight: 500 }}>
                Negotiation Flow Platform
              </span>
              <span style={{
                fontSize: 11,
                color: versionColor,
                fontFamily: 'monospace',
                fontWeight: 500,
              }}>
                {PLATFORM_VERSION}
              </span>
            </button>
          </motion.nav>

          {/* About Modal */}
          <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} palette={palette} isLight={isLight} />
        </>
      )}
    </AnimatePresence>
  );
}

function AboutModal({ open, onClose, palette, isLight }: {
  open: boolean; onClose: () => void;
  palette: ReturnType<typeof useTheme>['palette']; isLight: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const cardBg = isLight ? '#FFFFFF' : '#161618';
  const borderCol = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const dimText = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)';

  const GIT_REPO = 'https://github.com/julioferracini/design-negotiation-flow-emulator';
  const NUDS_REPO = 'https://github.com/nubank/nuds';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="about-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            key="about-panel"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(460px, 90vw)',
              maxHeight: '85vh',
              background: cardBg,
              borderRadius: 24,
              border: `1px solid ${borderCol}`,
              boxShadow: isLight
                ? '0 24px 64px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)'
                : '0 24px 64px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Decorative header band */}
            <div style={{
              height: 6,
              background: `linear-gradient(90deg, ${palette.accent}, #4F46E5, ${palette.accent})`,
            }} />

            <div style={{ padding: '28px 28px 24px' }}>
              {/* Logo + version */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: palette.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <img
                    src={`${import.meta.env.BASE_URL}nu-logo.svg`}
                    alt="Nu"
                    width={20}
                    height={20}
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
                <div>
                  <h3 style={{
                    margin: 0, fontSize: 18, fontWeight: 700,
                    letterSpacing: '-0.3px', color: palette.textPrimary,
                  }}>
                    Negotiation Flow Platform
                  </h3>
                  <span style={{
                    fontSize: 12, fontFamily: 'monospace', fontWeight: 600,
                    color: palette.accent,
                  }}>
                    {PLATFORM_VERSION}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p style={{
                margin: '0 0 20px', fontSize: 14, lineHeight: 1.65,
                color: palette.textSecondary,
              }}>
                {PLATFORM_DESCRIPTION}
              </p>

              {/* Divider */}
              <div style={{
                height: 1, margin: '0 0 16px',
                background: `linear-gradient(90deg, transparent, ${borderCol}, transparent)`,
              }} />

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  👤
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: palette.textPrimary }}>
                    {PLATFORM_AUTHOR}
                  </div>
                  <div style={{ fontSize: 11, color: dimText }}>Creator & Maintainer</div>
                </div>
              </div>

              {/* Meta row */}
              <div style={{
                display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24,
              }}>
                {[
                  { label: 'Stack', value: 'React + TypeScript + NuDS V3' },
                  { label: 'Prototype', value: 'Expo Go + Web Vite' },
                  { label: 'NuDS', value: '@nubank/nuds-vibecode v0.4.1' },
                ].map((meta) => (
                  <div key={meta.label} style={{
                    flex: '1 1 auto',
                    padding: '10px 14px', borderRadius: 12,
                    background: isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${borderCol}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: dimText, marginBottom: 3 }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}>
                      {meta.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Repo links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <a href={GIT_REPO} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  borderRadius: 12, background: isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${borderCol}`, textDecoration: 'none',
                }}>
                  <svg width="18" height="18" viewBox="0 0 16 16" fill={palette.textSecondary}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}>Project Repo</div>
                    <div style={{ fontSize: 9, color: dimText }}>design-negotiation-flow-emulator</div>
                  </div>
                </a>
                <a href={NUDS_REPO} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  borderRadius: 12, background: isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${borderCol}`, textDecoration: 'none',
                }}>
                  <svg width="18" height="18" viewBox="0 0 16 16" fill={palette.accent}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: palette.accent }}>NuDS Design System</div>
                    <div style={{ fontSize: 9, color: dimText }}>nubank/nuds · Official DS repo</div>
                  </div>
                </a>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  border: `1px solid ${borderCol}`,
                  background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)',
                  color: palette.textSecondary, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)')}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { MENU_ITEMS };
