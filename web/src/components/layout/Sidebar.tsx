import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Boxes, Clock, GitBranch, BookOpen, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const PLATFORM_VERSION = 'v1.0.0';

export type SectionId = 'home' | 'emulator' | 'experience-architecture' | 'flow-management' | 'project-timeline' | 'glossary';

interface MenuItem {
  id: SectionId;
  path: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  subtitle: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'glossary',
    path: '/glossary',
    icon: BookOpen,
    title: 'Glossary',
    subtitle: 'Business terms and domain definitions',
  },
  {
    id: 'flow-management',
    path: '/flow-management',
    icon: GitBranch,
    title: 'Flow Management',
    subtitle: 'Version control and active experiments',
  },
  {
    id: 'emulator',
    path: '/emulator',
    icon: Monitor,
    title: 'Emulator',
    subtitle: 'Use case prototypes with financial and regulatory parameters',
  },
  {
    id: 'experience-architecture',
    path: '/experience-architecture',
    icon: Boxes,
    title: 'Experience Architecture',
    subtitle: 'Use case map and capability matrix',
  },
  {
    id: 'project-timeline',
    path: '/project-timeline',
    icon: Clock,
    title: 'Project Timeline',
    subtitle: 'Development progress and changelog',
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activeSection: SectionId;
  onNavigate: (path: string) => void;
}

export default function Sidebar({ open, onClose, activeSection, onNavigate }: SidebarProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

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

            {/* Footer */}
            <div style={{
              padding: '16px 24px 20px',
              borderTop: `1px solid ${headerBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
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
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

export { MENU_ITEMS };
