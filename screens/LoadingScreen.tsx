/**
 * LoadingScreen — multi-step loading animation (React Native / Expo Go).
 *
 * Pixel-perfect port of Figma frames Loading 1 (10883:14556) through
 * Loading 7 (10883:14642). The screen is a sequence of motions used as a
 * transition between steps of a flow.
 *
 * Anatomy (from Figma):
 *   ┌──────────────────────────────────┐
 *   │  × (close)                       │  ← TopBar leading close (left)
 *   │                                  │
 *   │                                  │  ← Transition Container (flex:1, clip)
 *   │                                  │
 *   │  Calculating installments (10%)  │  ← previous title, faded
 *   │  Preparing your fresh start      │  ← current title, 100% black
 *   │  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬                │  ← Progress indicator (4px)
 *   │                                  │  ← 80px bottom padding
 *   └──────────────────────────────────┘
 *
 * Motion per step transition:
 *   • Progress bar fills from current → next fraction in 700ms (ease-in-out).
 *     Starts at 10% on mount, reaches 100% on the final "Done!" step.
 *   • Title Stack slides up from +SECTION_HEIGHT → 0 (stacking feel): the
 *     new section is revealed below the viewport, then the whole stack rises
 *     as if pushed from below.
 *   • Previous title fades 100% → 10%; new title fades 0% → 100%.
 *
 * Layout strategy:
 *   Only render sections with index ≤ stepIndex. The stack grows from bottom
 *   upward as steps advance — matching how each Figma frame shows a
 *   progressively taller stack.
 *
 * Parametrization:
 *   - `steps`          – rich per-step override with optional duration.
 *   - `variant`        – 'twoStep' | 'threeStep' (or kebab-case variant ids).
 *   - `stepDurationMs` – default hold time per step (fallback for steps[n]).
 *   - `onDone`         – fired after the last step has held its full duration.
 *                        When omitted, the screen stays on the final "Done"
 *                        state indefinitely — intentional for preview contexts
 *                        where an external control (e.g. the Web sidebar's
 *                        Replay button, or re-entering the screen from the
 *                        Expo Building Blocks list) restarts the animation.
 *   - `onClose`        – fired when the user taps the close (X) icon.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Box,
  CloseIcon,
  NText,
  TopBar,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import LinearProgressBar from '../components/primitives/LinearProgressBar';

export type LoadingStep = {
  title: string;
  /** Hold duration for this step (ms). Falls back to `stepDurationMs`. */
  durationMs?: number;
};

export type LoadingVariant = 'twoStep' | 'threeStep';

/**
 * Normalize a variant id coming from `SCREEN_CONTENT_VARIANTS` (kebab-case,
 * e.g. 'three-step') or a direct i18n key (camelCase, e.g. 'threeStep') into
 * the canonical i18n key used to pick copy.
 */
function normalizeVariant(v: string | undefined): LoadingVariant {
  if (v === 'twoStep' || v === 'two-step') return 'twoStep';
  if (v === 'threeStep' || v === 'three-step') return 'threeStep';
  return 'threeStep';
}

export type LoadingScreenProps = {
  locale?: Locale;
  /** Full per-step override. When provided, `variant` is ignored. */
  steps?: LoadingStep[];
  /**
   * Picks copy from i18n when `steps` is not provided.
   * Accepts both `'twoStep' | 'threeStep'` (canonical) and the kebab-case
   * variant ids used in SCREEN_CONTENT_VARIANTS (`'two-step'`, `'three-step'`).
   */
  variant?: LoadingVariant | 'two-step' | 'three-step' | string;
  /** Default hold time per step, used when a step has no explicit duration. */
  stepDurationMs?: number;
  /** Fires after the last step has held its full duration. */
  onDone?: () => void;
  /** Fires when the user taps the close (X) icon. */
  onClose?: () => void;
};

/** Figma specs (titleLarge = NuSansDisplay-Medium 36 / 1.1). */
const TITLE_FONT_SIZE = 36;
const TITLE_LINE_HEIGHT = 40; // 36 * 1.1 rounded to whole px
const TITLE_LETTER_SPACING = -1.08; // -3% of 36px
const CONTENT_BOTTOM_OFFSET = 80;
const CONTENT_GAP = 24;
const TITLE_SECTION_PADDING = 24;
const TITLE_STACK_MAX_WIDTH = 375;
const TITLE_INNER_WIDTH = 327;
const PROGRESS_WIDTH = 327;
const DEFAULT_STEP_DURATION_MS = 1400;
const TITLE_TRANSITION_MS = 550;
const PROGRESS_ANIM_MS = 700;
/*
 * Bezier curve matching the web's framer-motion ease. `ease-out-expo`-like,
 * with a lazy decel tail — lands softly instead of hitting a wall.
 */
const STACKING_EASE = Easing.bezier(0.22, 1, 0.36, 1);
/*
 * Estimated section height used as the stack's initial push offset when a
 * new step is revealed. Covers the common case of 2-line titles
 * (padding 24 + 2 × line 40 + padding 24 ≈ 128). Shorter titles (e.g.
 * "Done!") will push slightly more than strictly needed — this is imperceptible
 * given the 450ms ease-out curve and produces a confident "stack rising" feel.
 */
const ESTIMATED_SECTION_HEIGHT = 128;

export default function LoadingScreen({
  locale = 'pt-BR',
  steps: stepsOverride,
  variant,
  stepDurationMs = DEFAULT_STEP_DURATION_MS,
  onDone,
  onClose,
}: LoadingScreenProps) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const loadingCopy = t.loading;

  const normalizedVariant = normalizeVariant(variant);

  /*
   * Resolve the step list. Memoized so opacity/translate refs don't get
   * re-initialized on every render.
   */
  const steps: LoadingStep[] = useMemo(() => {
    if (stepsOverride && stepsOverride.length > 0) return stepsOverride;
    return loadingCopy[normalizedVariant];
  }, [stepsOverride, normalizedVariant, loadingCopy]);

  const [stepIndex, setStepIndex] = useState(0);

  /*
   * One Animated.Value per step for opacity. Stored in a ref so mutations
   * don't trigger renders and the values persist across re-renders.
   * Step 0 starts fully visible (opacity 1) — no entry animation on first
   * mount; all later steps start invisible (opacity 0) and fade in on advance.
   *
   * `stackY` translates the entire Title Stack. When a new step is revealed,
   * we snap it to +SECTION_HEIGHT (so the stack *looks like* it hasn't grown
   * yet, with the new item tucked just below the viewport) and then animate
   * it back to 0 — this produces the "rising, pushing-up" stacking motion.
   *
   * `stepsRef` tracks the last `steps` identity so we can detect changes
   * (including same-length swaps) and rebuild the animated values.
   */
  const stepsRef = useRef(steps);
  const opacities = useRef<Animated.Value[]>([]);
  const stackY = useRef(new Animated.Value(0)).current;

  if (opacities.current.length !== steps.length || stepsRef.current !== steps) {
    stepsRef.current = steps;
    opacities.current = steps.map((_, i) => new Animated.Value(i === 0 ? 1 : 0));
    stackY.setValue(0);
  }

  /* When the step list changes (e.g. Use Case swap), restart from step 0. */
  useEffect(() => {
    setStepIndex(0);
  }, [steps]);

  /*
   * Step lifecycle, driven off `stepIndex`:
   *   Hold for the current step's duration, then:
   *     • Not last → perform the stacking motion (see inline notes below).
   *     • Last → hold for one more full duration, then fire onDone.
   */
  useEffect(() => {
    const hold = steps[stepIndex]?.durationMs ?? stepDurationMs;
    const isLast = stepIndex >= steps.length - 1;

    if (isLast) {
      /*
       * Last step held for its full duration, now hand off to `onDone` if
       * one was provided (Use Case flows that chain Loading → next screen).
       * Without `onDone`, the screen stays on the final "Done" state — an
       * external control is expected to remount it for a replay.
       */
      if (!onDone) return;
      const done = setTimeout(onDone, hold);
      return () => clearTimeout(done);
    }

    const advance = setTimeout(() => {
      const nextIndex = stepIndex + 1;

      /*
       * Stacking motion:
       *   1. Snap the stack translateY to +SECTION_HEIGHT before revealing the
       *      new step. Visually the stack stays where it was — the new item
       *      (about to be rendered) is tucked in the clipped area below.
       *   2. Reveal the new step (render tree gains one section).
       *   3. Animate the stack translateY back to 0 — the stack "rises" as if
       *      the new item is pushing it up from below.
       *   4. In parallel, fade the previous current to 10% and the new current
       *      to 100%.
       */
      stackY.setValue(ESTIMATED_SECTION_HEIGHT);
      setStepIndex(nextIndex);

      /*
       * Slight stagger: the stack-rise leads, the opacity crossfade trails
       * 80ms behind. This mimics a real-world "inertia" feel — the new item
       * is already halfway up before the previous one starts to fade out,
       * which reads as continuous motion instead of a snap.
       */
      Animated.parallel([
        Animated.timing(stackY, {
          toValue: 0,
          duration: TITLE_TRANSITION_MS,
          easing: STACKING_EASE,
          useNativeDriver: true,
        }),
        Animated.timing(opacities.current[stepIndex], {
          toValue: 0.1,
          duration: TITLE_TRANSITION_MS - 80,
          delay: 80,
          easing: STACKING_EASE,
          useNativeDriver: true,
        }),
        Animated.timing(opacities.current[nextIndex], {
          toValue: 1,
          duration: TITLE_TRANSITION_MS - 80,
          delay: 80,
          easing: STACKING_EASE,
          useNativeDriver: true,
        }),
      ]).start();
    }, hold);

    return () => clearTimeout(advance);
  }, [stepIndex, steps, stepDurationMs, onDone, stackY]);

  const handleClose = useCallback(() => onClose?.(), [onClose]);

  /*
   * Progress curve: starts at 10% on mount (matching the Figma "already in
   * motion" feel of Loading 1), fills linearly to 100% on the final step.
   *
   *   3-step → [10%, 55%, 100%]
   *   2-step → [10%, 100%]
   *
   * If there's only a single step we jump straight to 100% (nothing to animate).
   */
  const progress =
    steps.length <= 1
      ? 1
      : 0.1 + (stepIndex / (steps.length - 1)) * 0.9;

  /*
   * Only render sections that are "revealed" (index ≤ stepIndex). The stack
   * grows from the bottom upward as steps advance, matching the Figma frames
   * Loading 1 (1 section), Loading 3 (2 sections), Loading 7 (3 sections).
   */
  const visibleSteps = steps.slice(0, stepIndex + 1);

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="dark" />

      {/*
       * NuDS TopBar has a "fake" iOS status bar (11:08 / Status) baked in by
       * default and a placeholder "Screen Title" when no title prop is
       * passed. Both clash with the native device status bar and the Figma
       * design for this screen — so we suppress them explicitly here.
       */}
      <TopBar
        variant="default"
        title=""
        showStatusBar={false}
        show1stAction={false}
        leading={onClose ? <CloseIcon size={24} color={theme.color.content.primary} /> : undefined}
        leadingAccessibilityLabel={loadingCopy.close}
        onPressLeading={onClose ? handleClose : undefined}
      />

      <View style={s.transitionContainer}>
        <View style={s.content}>
          <Animated.View
            style={[
              s.titleStack,
              { transform: [{ translateY: stackY }] },
            ]}
          >
            {visibleSteps.map((step, i) => (
              <Animated.View
                key={`step-${i}`}
                style={[
                  s.titleSection,
                  { opacity: opacities.current[i] },
                ]}
              >
                <NText
                  variant="titleLarge"
                  style={[
                    s.titleText,
                    { color: theme.color.content.primary },
                  ]}
                >
                  {step.title}
                </NText>
              </Animated.View>
            ))}
          </Animated.View>

          <View style={s.progressWrap}>
            <LinearProgressBar
              progress={progress}
              width={PROGRESS_WIDTH}
              height={4}
              radius={8}
              durationMs={PROGRESS_ANIM_MS}
            />
          </View>
        </View>
      </View>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 34,
  },
  transitionContainer: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  content: {
    position: 'absolute',
    bottom: CONTENT_BOTTOM_OFFSET,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    gap: CONTENT_GAP,
  },
  titleStack: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  titleSection: {
    paddingHorizontal: TITLE_SECTION_PADDING,
    paddingVertical: TITLE_SECTION_PADDING,
    width: TITLE_STACK_MAX_WIDTH,
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
  titleText: {
    width: TITLE_INNER_WIDTH,
    fontSize: TITLE_FONT_SIZE,
    lineHeight: TITLE_LINE_HEIGHT,
    letterSpacing: TITLE_LETTER_SPACING,
    fontWeight: '500',
  },
  progressWrap: {
    alignSelf: 'center',
    width: PROGRESS_WIDTH,
  },
});
