import { motion } from 'motion/react';
import type { NuDSWebTheme } from '../nuds';

export function ShimmerBar({
  width, height, radius = 8, t,
}: {
  width: number | string;
  height: number;
  radius?: number;
  t: NuDSWebTheme;
}) {
  return (
    <motion.div
      animate={{ opacity: [0.25, 0.5, 0.25] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width, height, borderRadius: radius, background: t.color.border.secondary }}
    />
  );
}

export function CardShimmer({ t }: { t: NuDSWebTheme }) {
  return (
    <div style={{ flex: 1, padding: `${t.spacing[4]}px ${t.spacing[5]}px`, display: 'flex', flexDirection: 'column', gap: t.spacing[3] }}>
      <ShimmerBar width="40%" height={12} t={t} />
      <ShimmerBar width="70%" height={28} radius={t.radius.md} t={t} />
      <div style={{ height: t.spacing[4] }} />
      <ShimmerBar width="100%" height={160} radius={t.radius.lg} t={t} />
      <ShimmerBar width="100%" height={160} radius={t.radius.lg} t={t} />
      <div style={{ height: t.spacing[3] }} />
      <ShimmerBar width="100%" height={52} radius={t.radius.xl} t={t} />
    </div>
  );
}

export function GenericShimmer({ t }: { t: NuDSWebTheme }) {
  return (
    <div style={{ flex: 1, padding: `${t.spacing[5]}px ${t.spacing[5]}px`, display: 'flex', flexDirection: 'column', gap: t.spacing[3] }}>
      <ShimmerBar width="50%" height={14} t={t} />
      <ShimmerBar width="80%" height={24} radius={t.radius.md} t={t} />
      <ShimmerBar width="60%" height={14} t={t} />
      <div style={{ height: t.spacing[4] }} />
      <ShimmerBar width="100%" height={120} radius={t.radius.lg} t={t} />
      <ShimmerBar width="100%" height={120} radius={t.radius.lg} t={t} />
      <div style={{ height: t.spacing[4] }} />
      <div style={{ display: 'flex', gap: t.spacing[3] }}>
        <ShimmerBar width="50%" height={56} radius={t.radius.md} t={t} />
        <ShimmerBar width="50%" height={56} radius={t.radius.md} t={t} />
      </div>
      <ShimmerBar width="40%" height={14} t={t} />
      <ShimmerBar width="100%" height={80} radius={t.radius.md} t={t} />
    </div>
  );
}

export function ListShimmer({ rows = 5, t }: { rows?: number; t: NuDSWebTheme }) {
  return (
    <div style={{ flex: 1, padding: `${t.spacing[5]}px ${t.spacing[5]}px`, display: 'flex', flexDirection: 'column', gap: t.spacing[4] }}>
      <ShimmerBar width="50%" height={16} t={t} />
      <div style={{ height: t.spacing[3] }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: t.spacing[3] }}>
          <ShimmerBar width={40} height={40} radius={t.radius.md} t={t} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: t.spacing[1] }}>
            <ShimmerBar width="70%" height={14} t={t} />
            <ShimmerBar width="45%" height={10} t={t} />
          </div>
        </div>
      ))}
    </div>
  );
}
