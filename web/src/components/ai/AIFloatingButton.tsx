import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AIFloatingButtonProps {
  open: boolean;
  onClick: () => void;
}

export default function AIFloatingButton({ open, onClick }: AIFloatingButtonProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  const glassBg = isLight ? 'rgba(255,255,255,0.82)' : 'rgba(22,22,22,0.82)';
  const borderColor = `${palette.accent}40`;

  return (
    <motion.button
      onClick={onClick}
      animate={open ? { y: 0 } : { y: [0, -3, 0] }}
      transition={open ? { duration: 0.2 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={open ? undefined : 'ai-fab-glow'}
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 997,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: `1.5px solid ${borderColor}`,
        background: glassBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        '--neon-color': `${palette.accent}18`,
        '--neon-color-hi': `${palette.accent}28`,
      } as React.CSSProperties}
    >
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} strokeWidth={2} color={palette.accent} />
          </motion.div>
        ) : (
          <motion.div
            key="sparkle"
            initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Sparkles size={18} strokeWidth={1.8} color={palette.accent} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
