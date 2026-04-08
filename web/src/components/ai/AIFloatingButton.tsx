import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';

interface AIFloatingButtonProps {
  open: boolean;
  onClick: () => void;
}

export default function AIFloatingButton({ open, onClick }: AIFloatingButtonProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  return (
    <motion.button
      onClick={onClick}
      animate={open ? { y: 0 } : { y: [0, -3, 0] }}
      transition={open ? { duration: 0.2 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      className={open ? undefined : 'ai-fab-glow'}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 997,
        width: 46,
        height: 46,
        borderRadius: '50%',
        border: `1px solid ${isLight ? 'rgba(200,180,240,0.4)' : 'rgba(180,140,255,0.2)'}`,
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        overflow: 'visible',
      }}
    >
      {/* Orb background */}
      <div
        style={{
          position: 'absolute',
          inset: 3,
          borderRadius: '50%',
          background: isLight
            ? 'radial-gradient(circle at 35% 35%, #c8e0ff, #d8b4fe 40%, #f0abfc 65%, #e0c3fc 90%)'
            : 'radial-gradient(circle at 35% 35%, #4a6cf7, #7c3aed 40%, #a855f7 65%, #6366f1 90%)',
          opacity: isLight ? 0.55 : 0.5,
          filter: 'blur(1px)',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Rotating shimmer highlight */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 3,
          borderRadius: '50%',
          background: isLight
            ? 'conic-gradient(from 0deg, transparent 0%, rgba(165,215,255,0.4) 25%, transparent 50%, rgba(240,171,252,0.3) 75%, transparent 100%)'
            : 'conic-gradient(from 0deg, transparent 0%, rgba(99,102,241,0.3) 25%, transparent 50%, rgba(168,85,247,0.25) 75%, transparent 100%)',
          filter: 'blur(2px)',
        }}
      />

      {/* Glass inner surface */}
      <div
        style={{
          position: 'absolute',
          inset: 5,
          borderRadius: '50%',
          background: isLight
            ? 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 60%, transparent 100%)'
            : 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 60%, transparent 100%)',
        }}
      />

      {/* Icon layer */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="ai-fab-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4F7DF7" />
            </linearGradient>
          </defs>
        </svg>

        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="url(#ai-fab-grad)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </motion.div>
          ) : (
            <motion.div
              key="sparkle"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#ai-fab-grad)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
                <path d="M5 3v4" />
                <path d="M3 5h4" />
                <path d="M19 17v4" />
                <path d="M17 19h4" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
