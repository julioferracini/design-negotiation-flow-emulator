/**
 * DevEmulatorFloatingButton — floating control that will (eventually) launch
 * the Dev Emulator. Currently WIP: click is disabled and a "Soon" tooltip
 * shows on hover. Sits below `CapabilityFloatingButton` to complete the
 * vertical cluster.
 *
 * When the Dev Emulator service ships, remove `disabled`, wire an `onClick`
 * handler from App.tsx and drop the WIP badge.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface DevEmulatorFloatingButtonProps {
  /** Reserved for future wiring — no-op while WIP. */
  onClick?: () => void;
}

export default function DevEmulatorFloatingButton({ onClick }: DevEmulatorFloatingButtonProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const [hover, setHover] = useState(false);

  const wipBadgeBg = isLight ? '#FFF2E3' : 'rgba(255,152,0,0.18)';
  const wipBadgeColor = isLight ? '#C85A00' : '#FFB74D';
  const wipBadgeBorder = isLight ? '#FFFFFF' : '#1a1a2e';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'fixed', top: 174, right: 16, zIndex: 996 }}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Dev Emulator — coming soon"
        aria-disabled="true"
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          border: `1px solid ${isLight ? 'rgba(120,120,140,0.25)' : 'rgba(255,255,255,0.12)'}`,
          background: isLight
            ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,240,255,0.8))'
            : 'linear-gradient(135deg, rgba(40,36,58,0.95), rgba(30,28,48,0.9))',
          cursor: 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          boxShadow: isLight
            ? '0 2px 8px rgba(0,0,0,0.08)'
            : '0 2px 12px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <Smartphone size={16} strokeWidth={1.8} color={palette.textPrimary} />

        {/* WIP dot — same visual language as RulesFloatingButton's notification dot,
            but in warm orange to signal "not ready yet" rather than "has content". */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 14, padding: '0 5px',
            borderRadius: 7,
            background: wipBadgeBg,
            color: wipBadgeColor,
            border: `2px solid ${wipBadgeBorder}`,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          WIP
        </span>
      </motion.button>

      {/* Tooltip — appears on hover, points at the button from the left. */}
      <AnimatePresence>
        {hover && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: '50%',
              right: 52,
              transform: 'translateY(-50%)',
              padding: '8px 12px',
              borderRadius: 10,
              background: isLight ? '#1F0230' : '#0E0416',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontWeight: 600 }}>Dev Emulator</span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(255,152,0,0.18)',
              color: '#FFB74D',
            }}>
              Soon
            </span>
            {/* Arrow */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: `6px solid ${isLight ? '#1F0230' : '#0E0416'}`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
