/**
 * FeedbackScreen — "One last step to finish" success screen (Web).
 *
 * Web twin of screens/FeedbackScreen.tsx (React Native / Expo Go).
 * Pixel port of Figma node 10883:14767.
 *
 * Anatomy:
 *   • Full-bleed purple (#BAB8FF) background with a tulip illustration
 *     (public/brand/feedback-bg.png) covering the screen.
 *   • Close (X) button top-left on a light pill — sits above the illustration.
 *   • Bottom card (white, rounded 24px, elevation level 1):
 *       – 84×84 Flag illustration (inline SVG, same silhouette as RN version)
 *       – Title "One last / step to finish" (titleMedium 28/33.6, -3% tracking)
 *       – Description "Your plan is ready. Secure these conditions…"
 *       – Primary CTA "Make first payment"
 *       – Secondary CTA "Do it later"
 *
 * Motion (all via framer-motion, GPU-accelerated transforms only):
 *   • Background illustration: continuous "breathing" — scales 1 → 1.04 and
 *     drifts ±4px vertically in a slow 9s sinusoidal loop.
 *   • Bottom card: slides up +120 → 0 and fades 0 → 1 with an ease-out-expo
 *     curve (450ms, 120ms delay) so it feels like it docks into place.
 *   • Inner content: staggered fade+rise (flag → title → description →
 *     primary → secondary) at 80ms cadence starting 260ms after mount.
 */

import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { NText, Button } from '../nuds';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import FlagIllustration from '../components/primitives/FlagIllustration';

const BACKGROUND_COLOR = '#BAB8FF';
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
const CARD_ENTRY_OFFSET = 120;
const CONTENT_RISE_OFFSET = 16;
const CONTENT_START_DELAY = 0.26;
const CONTENT_STAGGER = 0.08;

export interface FeedbackScreenProps {
  locale: Locale;
  onMakePayment?: () => void;
  onDoLater?: () => void;
  onClose?: () => void;
}

function CloseIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function FeedbackScreen({
  locale,
  onMakePayment,
  onDoLater,
  onClose,
}: FeedbackScreenProps) {
  const { nuds } = useTheme();
  const tr = getTranslations(locale);
  const fb = tr.feedback;
  const base = import.meta.env.BASE_URL;

  /* Stagger helper — same delay model as the Expo version. */
  const row = (index: number) => ({
    initial: { opacity: 0, y: CONTENT_RISE_OFFSET },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.36,
      delay: CONTENT_START_DELAY + index * CONTENT_STAGGER,
      ease: EASE_OUT_EXPO,
    },
  });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: BACKGROUND_COLOR,
        overflow: 'hidden',
      }}
    >
      {/* Background illustration — subtle continuous breathing. */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${base}brand/feedback-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          pointerEvents: 'none',
          willChange: 'transform',
        }}
        animate={{
          scale: [1, 1.04, 1],
          y: [-4, 4, -4],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Close (X). */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={tr.common.close}
          style={{
            position: 'absolute',
            top: 54,
            left: 16,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: 18,
            border: 'none',
            background: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }}
        >
          <CloseIcon color={nuds.color.content.primary} />
        </button>
      )}

      {/* Bottom card. */}
      <motion.div
        initial={{ opacity: 0, y: CARD_ENTRY_OFFSET }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease: EASE_OUT_EXPO }}
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 32,
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            padding: 24,
            borderRadius: 24,
            background: nuds.color.background.primary,
            boxShadow: '0 1px 0 0 #E5E0E8',
          }}
        >
          <motion.div
            {...row(0)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <FlagIllustration size={84} />
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <motion.div {...row(1)}>
              <NText
                theme={nuds}
                variant="titleMedium"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  letterSpacing: '-0.03em',
                  whiteSpace: 'pre-line',
                }}
              >
                {`${fb.headline1}\n${fb.headline2}`}
              </NText>
            </motion.div>

            <motion.div {...row(2)}>
              <NText
                theme={nuds}
                variant="paragraphMediumDefault"
                tone="secondary"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  whiteSpace: 'pre-line',
                }}
              >
                {`${fb.body1}\n${fb.body2}`}
              </NText>
            </motion.div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <motion.div {...row(3)}>
              <Button
                theme={nuds}
                label={fb.makePayment}
                variant="primary"
                expanded
                onClick={onMakePayment}
              />
            </motion.div>
            <motion.div {...row(4)}>
              <Button
                theme={nuds}
                label={fb.doLater}
                variant="secondary"
                expanded
                onClick={onDoLater}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
