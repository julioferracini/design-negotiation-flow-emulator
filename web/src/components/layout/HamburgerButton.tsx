import { motion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';

interface HamburgerButtonProps {
  open: boolean;
  onClick: () => void;
}

export default function HamburgerButton({ open, onClick }: HamburgerButtonProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  const lineColor = palette.textPrimary;
  const hoverBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';

  return (
    <motion.button
      onClick={onClick}
      initial={false}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      style={{
        position: 'fixed',
        top: 18,
        left: 18,
        zIndex: 997,
        width: 40,
        height: 40,
        borderRadius: 10,
        border: 'none',
        background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(22,22,22,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: isLight
          ? '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)'
          : '0 1px 4px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        padding: 0,
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(22,22,22,0.85)')}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        {/* Top line */}
        <motion.line
          x1="4" x2="16"
          y1="6" y2="6"
          stroke={lineColor}
          strokeWidth={1.6}
          strokeLinecap="round"
          initial={{ y1: 6, y2: 6, rotate: 0 }}
          animate={open
            ? { y1: 10, y2: 10, rotate: 45 }
            : { y1: 6, y2: 6, rotate: 0 }
          }
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformOrigin: '10px 10px' }}
        />
        {/* Middle line */}
        <motion.line
          x1="4" x2="16"
          y1="10" y2="10"
          stroke={lineColor}
          strokeWidth={1.6}
          strokeLinecap="round"
          animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.2 }}
          style={{ transformOrigin: '10px 10px' }}
        />
        {/* Bottom line */}
        <motion.line
          x1="4" x2="16"
          y1="14" y2="14"
          stroke={lineColor}
          strokeWidth={1.6}
          strokeLinecap="round"
          initial={{ y1: 14, y2: 14, rotate: 0 }}
          animate={open
            ? { y1: 10, y2: 10, rotate: -45 }
            : { y1: 14, y2: 14, rotate: 0 }
          }
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformOrigin: '10px 10px' }}
        />
      </svg>
    </motion.button>
  );
}
