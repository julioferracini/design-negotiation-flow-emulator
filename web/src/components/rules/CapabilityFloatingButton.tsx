import { motion, AnimatePresence } from 'motion/react';
import { Boxes, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface CapabilityFloatingButtonProps {
  open: boolean;
  onClick: () => void;
}

/**
 * Floating button that opens the Capability Panel. Sits under the
 * existing RulesFloatingButton (which is at top: 70). Uses the same
 * pill/shadow chrome so the two controls read as a vertical cluster.
 */
export default function CapabilityFloatingButton({ open, onClick }: CapabilityFloatingButtonProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      aria-label={open ? 'Close capability panel' : 'Open capability panel'}
      style={{
        position: 'fixed',
        top: 122,
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
            <X size={15} strokeWidth={2.2} color={palette.textSecondary} />
          </motion.div>
        ) : (
          <motion.div
            key="matrix"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex' }}
          >
            <Boxes size={16} strokeWidth={1.8} color={palette.textPrimary} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
