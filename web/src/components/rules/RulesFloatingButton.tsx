import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { useEmulatorConfig } from '../../context/EmulatorConfigContext';

interface RulesFloatingButtonProps {
  open: boolean;
  onClick: () => void;
}

export default function RulesFloatingButton({ open, onClick }: RulesFloatingButtonProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const config = useEmulatorConfig();
  const hasOverrides = Object.keys(config.ruleOverrides).length > 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      style={{
        position: 'fixed',
        top: 70,
        right: 16,
        zIndex: 996,
        width: 42,
        height: 42,
        borderRadius: '50%',
        border: `1px solid ${isLight ? 'rgba(120,120,140,0.25)' : 'rgba(255,255,255,0.12)'}`,
        background: isLight
          ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,240,255,0.8))'
          : 'linear-gradient(135deg, rgba(40,36,58,0.95), rgba(30,28,48,0.9))',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        boxShadow: isLight
          ? '0 2px 8px rgba(0,0,0,0.08)'
          : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      {hasOverrides && (
        <div style={{
          position: 'absolute', top: -2, right: -2,
          width: 8, height: 8, borderRadius: 4,
          background: palette.accent,
          border: `2px solid ${isLight ? '#fff' : '#1a1a2e'}`,
        }} />
      )}

      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={palette.textSecondary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={palette.textPrimary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
