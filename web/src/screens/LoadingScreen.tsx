/**
 * LoadingScreen — multi-step loading animation (Web).
 *
 * Web twin of screens/LoadingScreen.tsx (React Native / Expo Go).
 * Pixel-perfect port of Figma frames Loading 1 (10883:14556) and Loading 7
 * (10883:14642).
 *
 * Motion per step transition:
 *   • Progress bar fills from (i/n) → ((i+1)/n) in 700ms (ease-in-out).
 *   • Current title fades 100% → 10% in 350ms.
 *   • New title rises 12px and fades 0% → 100% in 350ms.
 *   • Previously-faded titles hold at 0% (clipped by overflow:hidden).
 *
 * Parametrization:
 *   - `steps`          – full override (rich per-step config with durations)
 *   - `variant`        – 'twoStep' | 'threeStep' (picks from i18n)
 *   - `stepDurationMs` – default hold time for steps without explicit duration
 *   - `onDone`         – fired after the last step has held its full duration.
 *                        When omitted, the screen stays on the final "Done"
 *                        state indefinitely. In the emulator preview context
 *                        an external control (the sidebar Replay button)
 *                        remounts this component to restart the animation.
 *   - `onClose`        – fired when the user taps the close (X) icon
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { TopBar } from '../nuds';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import LinearProgressBar from '../components/primitives/LinearProgressBar';

export type LoadingStep = {
  title: string;
  /** Hold duration for this step (ms). Falls back to `stepDurationMs`. */
  durationMs?: number;
};

export type LoadingVariant = 'twoStep' | 'threeStep';

/**
 * Normalize a variant id coming from `SCREEN_CONTENT_VARIANTS` (kebab-case)
 * or a direct i18n key (camelCase) into the canonical i18n key.
 */
function normalizeVariant(v: string | undefined): LoadingVariant {
  if (v === 'twoStep' || v === 'two-step') return 'twoStep';
  if (v === 'threeStep' || v === 'three-step') return 'threeStep';
  return 'threeStep';
}

export interface LoadingScreenProps {
  locale: Locale;
  /** Full per-step override. When provided, `variant` is ignored. */
  steps?: LoadingStep[];
  /**
   * Picks copy from i18n when `steps` is not provided.
   * Accepts `'twoStep' | 'threeStep'` or the kebab-case variant ids
   * (`'two-step'`, `'three-step'`) used in SCREEN_CONTENT_VARIANTS.
   */
  variant?: LoadingVariant | 'two-step' | 'three-step' | string;
  /** Default hold time per step, used when a step has no explicit duration. */
  stepDurationMs?: number;
  /** Fires after the last step has held its full duration. */
  onDone?: () => void;
  /** Fires when the user taps the close (X) icon. */
  onClose?: () => void;
}

/** Figma specs (Graphik Medium 36 / line-height 1.1 / -3%). */
const TITLE_FONT_SIZE = 36;
const TITLE_LINE_HEIGHT = 1.1;
const TITLE_LETTER_SPACING = '-0.03em';
const CONTENT_BOTTOM_OFFSET = 80;
const CONTENT_GAP = 24;
const TITLE_SECTION_PADDING = 24;
const TITLE_STACK_MAX_WIDTH = 375;
const TITLE_INNER_WIDTH = 327;
const PROGRESS_WIDTH = 327;
const DEFAULT_STEP_DURATION_MS = 1400;
const TITLE_TRANSITION_MS = 450;
const PROGRESS_ANIM_MS = 700;
/*
 * Estimated section height used as the stack's initial push offset when a
 * new step is revealed. Covers the common case of 2-line titles
 * (padding 24 + 2 × line 40 + padding 24 ≈ 128). Shorter titles will push
 * slightly more than strictly needed — imperceptible given the 450ms ease-out.
 */
const ESTIMATED_SECTION_HEIGHT = 128;

/** Close icon — matches the outlined/navigation/close glyph from NuDS. */
function CloseIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoadingScreen({
  locale,
  steps: stepsOverride,
  variant = 'threeStep',
  stepDurationMs = DEFAULT_STEP_DURATION_MS,
  onDone,
  onClose,
}: LoadingScreenProps) {
  const { nuds } = useTheme();
  const tr = useMemo(() => getTranslations(locale).loading, [locale]);

  const normalizedVariant = normalizeVariant(variant);
  const steps: LoadingStep[] = useMemo(() => {
    if (stepsOverride && stepsOverride.length > 0) return stepsOverride;
    return tr[normalizedVariant];
  }, [stepsOverride, normalizedVariant, tr]);

  const [stepIndex, setStepIndex] = useState(0);

  /* Reset if the step list changes at runtime (e.g. Use Case swap). */
  useEffect(() => {
    setStepIndex(0);
  }, [steps]);

  /*
   * Step lifecycle:
   *   • Hold the current step for its duration.
   *   • If not last: advance the index — framer-motion replays the
   *     stacking transition via the `key={stepIndex}` trick on the stack.
   *   • If last: hold the full duration, then either fire onDone OR stay on
   *     the final state (preview context — sidebar Replay remounts us).
   */
  useEffect(() => {
    const hold = steps[stepIndex]?.durationMs ?? stepDurationMs;
    const isLast = stepIndex >= steps.length - 1;

    if (isLast) {
      if (!onDone) return;
      const done = setTimeout(onDone, hold);
      return () => clearTimeout(done);
    }

    const advance = setTimeout(() => setStepIndex((i) => i + 1), hold);
    return () => clearTimeout(advance);
  }, [stepIndex, steps, stepDurationMs, onDone]);

  /*
   * Progress curve: starts at 10% on mount (matching the Figma "already in
   * motion" feel of Loading 1), fills linearly to 100% on the final step.
   *   3-step → [10%, 55%, 100%]
   *   2-step → [10%, 100%]
   * If there's only a single step we jump straight to 100%.
   */
  const progress =
    steps.length <= 1 ? 1 : 0.1 + (stepIndex / (steps.length - 1)) * 0.9;

  /*
   * Render every step up to the current one (i ≤ stepIndex). The stack grows
   * from the bottom upward as steps advance — matching the Figma frames
   * Loading 1 / 3 / 5 / 7 which show progressively taller stacks. Older items
   * sit at the top (opacity 0), previous step sits above current (opacity 10%),
   * current sits at the bottom (opacity 100%).
   */
  const visibleSteps = steps.slice(0, stepIndex + 1);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: nuds.color.background.primary,
      }}
    >
      <TopBar
        theme={nuds}
        leading={onClose ? <CloseIcon color={nuds.color.content.primary} /> : undefined}
        onPressLeading={onClose}
      />

      <div
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: CONTENT_BOTTOM_OFFSET,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: CONTENT_GAP,
          }}
        >
          <div
            style={{
              alignSelf: 'stretch',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/*
             * The stack container animates translateY from +SECTION_HEIGHT → 0
             * on each step advance. This produces the "rising, pushing-up"
             * stacking motion: the new item enters clipped just below the
             * viewport, then the whole stack rises into place as if the new
             * section pushed the existing ones up from below.
             *
             * `key={stepIndex}` restarts the animation on every advance, so
             * each new reveal triggers the slide-up from +SECTION_HEIGHT.
             */}
            <motion.div
              key={stepIndex}
              initial={{ y: ESTIMATED_SECTION_HEIGHT }}
              animate={{ y: 0 }}
              transition={{ duration: TITLE_TRANSITION_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {visibleSteps.map((step, i) => {
                const isCurrent = i === stepIndex;
                const isPrevious = i === stepIndex - 1;
                const targetOpacity = isCurrent ? 1 : isPrevious ? 0.1 : 0;
                return (
                  <motion.div
                    key={`step-${i}`}
                    initial={{ opacity: i === 0 ? 1 : 0 }}
                    animate={{ opacity: targetOpacity }}
                    transition={{ duration: TITLE_TRANSITION_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      padding: TITLE_SECTION_PADDING,
                      width: TITLE_STACK_MAX_WIDTH,
                      alignSelf: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    <p
                      style={{
                        width: TITLE_INNER_WIDTH,
                        margin: 0,
                        fontFamily: nuds.typography.titleLarge.fontFamily,
                        fontSize: TITLE_FONT_SIZE,
                        lineHeight: TITLE_LINE_HEIGHT,
                        letterSpacing: TITLE_LETTER_SPACING,
                        fontWeight: 500,
                        color: nuds.color.content.primary,
                        fontFeatureSettings: "'ss05' 1",
                      }}
                    >
                      {step.title}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <div style={{ alignSelf: 'center', width: PROGRESS_WIDTH }}>
            <LinearProgressBar
              progress={progress}
              width={PROGRESS_WIDTH}
              height={4}
              radius={8}
              durationMs={PROGRESS_ANIM_MS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
