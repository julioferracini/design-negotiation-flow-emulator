/**
 * Terms & Conditions — Web prototype.
 *
 * NuDS-first: tokens via nuds/ adapter, components from web/src/nuds/.
 * Dual-platform: matches Expo screens/TermsScreen.tsx.
 */

import { useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { NText, Button, TopBar } from '../nuds';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import { useScreenLoading } from '../hooks/useScreenLoading';
import { ListShimmer } from '../components/ScreenShimmer';

function ArrowBack({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M6.2 6.67 12.87 0l1.18 1.18-6.08 6.08 6.08 6.07-1.18 1.18L6.2 7.85a.83.83 0 0 1 0-1.18Z" fill={color} transform="translate(5.955, 2.744)" />
    </svg>
  );
}

export default function TermsScreen({
  locale,
  onBack,
  onConfirm,
}: {
  locale: Locale;
  onBack?: () => void;
  onConfirm?: () => void;
}) {
  const { nuds } = useTheme();
  const t = nuds;
  const { loading } = useScreenLoading();
  const tr = getTranslations(locale).terms;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || hasScrolledToBottom) return;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (isAtBottom) setHasScrolledToBottom(true);
  };

  if (loading) {
    return (
      <div className="nf-proto" style={{ background: t.color.background.screen, color: t.color.content.primary, width: '100%', height: '100%' }}>
        <ListShimmer rows={8} t={t} />
      </div>
    );
  }

  return (
    <div
      className="nf-proto"
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: t.color.background.screen, color: t.color.content.primary,
        transition: 'background 0.3s, color 0.3s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* TopBar */}
      <div className="nf-proto__safe-top" style={{ paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0 }}>
        <TopBar
          title={tr.title}
          variant="default"
          leading={onBack ? <ArrowBack color={t.color.content.primary} /> : undefined}
          onPressLeading={onBack}
          theme={t}
        />
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="nf-proto__scroll"
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: `${t.spacing[2]}px ${t.spacing[6]}px ${t.spacing[10]}px`,
        }}
      >
        {/* Heading */}
        <NText variant="titleMedium" theme={t} as="h1" style={{ margin: `0 0 ${t.spacing[2]}px` }}>
          {tr.heading}
        </NText>

        {/* Body subtitle */}
        <NText
          variant="subtitleMediumDefault"
          tone="secondary"
          theme={t}
          as="p"
          style={{ margin: `0 0 ${t.spacing[6]}px` }}
        >
          {tr.bodySubtitle}
        </NText>

        {/* Paragraphs */}
        {tr.paragraphs.map((para, i) => (
          <NText
            key={i}
            variant={para.bold ? 'labelMediumStrong' : 'subtitleSmallDefault'}
            tone={para.bold ? 'primary' : 'secondary'}
            theme={t}
            as="p"
            style={{ margin: `0 0 ${para.bold ? t.spacing[3] : t.spacing[2]}px` }}
          >
            {para.text}
          </NText>
        ))}

        <div style={{ height: t.spacing[10] }} />

        <NText
          variant="labelXSmallDefault"
          tone="secondary"
          theme={t}
          as="p"
          style={{ margin: 0, textAlign: 'center' }}
        >
          {tr.readAll}
        </NText>

        <div style={{ height: 80 }} />
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: `${t.spacing[4]}px ${t.spacing[5]}px ${t.spacing[6]}px`,
          background: `${t.color.background.screen}F0`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'background 0.3s',
        }}
      >
        <Button
          label={tr.confirmButton}
          variant="primary"
          expanded
          theme={t}
          disabled={!hasScrolledToBottom}
          onClick={onConfirm}
        />
      </div>
    </div>
  );
}
