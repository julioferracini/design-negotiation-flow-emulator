import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface PlaceholderPageProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
}

export default function PlaceholderPage({ icon: Icon, title, subtitle }: PlaceholderPageProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  const pageBg = isLight ? '#FAFAFA' : '#0A0A0A';

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: pageBg,
      transition: 'background 0.3s ease',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 400,
          padding: '0 32px',
          gap: 20,
        }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: palette.accentSubtle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.3s ease',
          }}
        >
          <Icon
            size={30}
            strokeWidth={1.5}
            style={{ color: palette.accent, transition: 'color 0.3s ease' }}
          />
        </motion.div>

        <div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: palette.textPrimary,
            margin: '0 0 8px',
            transition: 'color 0.3s ease',
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: palette.textSecondary,
            margin: 0,
            transition: 'color 0.3s ease',
          }}>
            {subtitle}
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 16px',
          borderRadius: 9999,
          background: palette.accentSubtle,
          transition: 'background 0.3s ease',
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: palette.accent,
          }} />
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: palette.accent,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
          }}>
            Coming Soon
          </span>
        </div>
      </motion.div>
    </div>
  );
}
