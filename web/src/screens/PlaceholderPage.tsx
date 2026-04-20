import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { NText, Badge } from '../nuds';

interface PlaceholderPageProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
  backgroundImage?: string;
}

export default function PlaceholderPage({ icon: Icon, title, subtitle, backgroundImage }: PlaceholderPageProps) {
  const { nuds, mode } = useTheme();
  const t = nuds;
  const isLight = mode === 'light';

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: t.color.background.screen,
      transition: 'background 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: isLight ? 0.18 : 0.12,
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
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
          padding: `0 ${t.spacing[8]}px`,
          gap: t.spacing[5],
        }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 72,
            height: 72,
            borderRadius: t.radius.xl,
            background: t.color.surface.accentSubtle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.3s ease',
          }}
        >
          <Icon
            size={30}
            strokeWidth={1.5}
            style={{ color: t.color.main, transition: 'color 0.3s ease' }}
          />
        </motion.div>

        <div>
          <NText variant="titleMedium" theme={t} as="h1" style={{ margin: `0 0 ${t.spacing[2]}px` }}>
            {title}
          </NText>
          <NText variant="paragraphSmallDefault" tone="secondary" theme={t} as="p" style={{ margin: 0 }}>
            {subtitle}
          </NText>
        </div>

        <Badge label="Coming Soon" color="accent" theme={t} />
      </motion.div>
    </div>
  );
}
