/**
 * FeedbackScreen — "One last step to finish" success screen.
 *
 * Pixel port of Figma node 10883:14767 (Debt Resolution / Feedback).
 *
 * Anatomy:
 *   • Full-bleed purple (#BAB8FF) background with a tulip illustration
 *     (assets/feedback/background.png) covering the safe area.
 *   • TopBar with a Close (X) leading icon on a light-on-dark badge.
 *   • Bottom card (white, rounded 24px) containing:
 *       – 84×84 Flag illustration
 *       – Title "One last step to finish" (titleMedium 28px / 1.2)
 *       – Description "Your plan is ready. Secure these conditions…"
 *       – Primary CTA "Make first payment"
 *       – Secondary CTA "Do it later"
 *
 * Motion (on mount):
 *   • Background illustration: continuous "breathing" — scales 1 → 1.04 and
 *     drifts ±4px vertically in a slow 9s loop. Native driver.
 *   • Bottom card: slides up +120 → 0 and fades 0 → 1 with an ease-out-expo
 *     curve (450ms, 120ms delay) so it feels like it docks into place.
 *   • Inner content: staggered fade+rise (flag → title → description →
 *     primary → secondary) at 80ms cadence starting 260ms after mount.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Button,
  CloseIcon,
  NText,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import FlagIllustration from '../components/primitives/FlagIllustration';

const BACKGROUND_COLOR = '#BAB8FF';
const CARD_ENTRY_OFFSET = 120;
const CARD_ENTRY_MS = 450;
const CARD_ENTRY_DELAY = 120;
const CONTENT_STAGGER_MS = 80;
const CONTENT_START_DELAY = 260;
const CONTENT_RISE_OFFSET = 16;
const CONTENT_FADE_MS = 360;
const BG_BREATHE_MS = 9000;
const EASE_OUT_EXPO = Easing.bezier(0.22, 1, 0.36, 1);

export type FeedbackScreenProps = {
  locale?: Locale;
  onMakePayment?: () => void;
  onDoLater?: () => void;
  /**
   * Close (X) handler. Optional — when omitted the TopBar is still rendered
   * so the layout matches Figma, but the icon is not interactive.
   */
  onClose?: () => void;
};

export default function FeedbackScreen({
  locale = 'pt-BR',
  onMakePayment,
  onDoLater,
  onClose,
}: FeedbackScreenProps) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const fb = t.feedback;

  /* ── Motion values ─────────────────────────────────────────────────── */

  /* Card entry: translateY + opacity, driven together by a single 0→1 */
  const cardAnim = useRef(new Animated.Value(0)).current;

  /*
   * Inner content: one Animated.Value per section so we can stagger them
   * independently (flag, title, description, primary button, secondary
   * button).
   */
  const contentAnims = useRef(
    [0, 0, 0, 0, 0].map(() => new Animated.Value(0)),
  ).current;

  /* Background breathing: looped 0→1→0 feeding scale + translateY. */
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /* Card entry after a tiny delay so the screen transition can settle. */
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: CARD_ENTRY_MS,
      delay: CARD_ENTRY_DELAY,
      easing: EASE_OUT_EXPO,
      useNativeDriver: true,
    }).start();

    /* Staggered content reveal. */
    Animated.stagger(
      CONTENT_STAGGER_MS,
      contentAnims.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: CONTENT_FADE_MS,
          delay: CONTENT_START_DELAY,
          easing: EASE_OUT_EXPO,
          useNativeDriver: true,
        }),
      ),
    ).start();

    /*
     * Background loop: ping-pong 0↔1 forever. sin-like easing gives an
     * organic, non-mechanical drift.
     */
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: BG_BREATHE_MS / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: BG_BREATHE_MS / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [cardAnim, contentAnims, bgAnim]);

  /* ── Derived interpolations ────────────────────────────────────────── */

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CARD_ENTRY_OFFSET, 0],
  });
  const cardOpacity = cardAnim;

  const bgScale = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const bgTranslateY = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 4],
  });

  /* Helper to animate one staggered content row. */
  const rowStyle = (index: number) => ({
    opacity: contentAnims[index],
    transform: [
      {
        translateY: contentAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [CONTENT_RISE_OFFSET, 0],
        }),
      },
    ],
  });

  return (
    <View style={[s.screen, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar style="dark" />

      {/* Background illustration with subtle continuous motion. */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ scale: bgScale }, { translateY: bgTranslateY }],
          },
        ]}
      >
        <ImageBackground
          source={require('../assets/feedback/background.png')}
          resizeMode="cover"
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* TopBar (close X). Sits above the illustration. */}
      <View style={s.topBar} pointerEvents="box-none">
        {onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
            hitSlop={12}
            style={({ pressed }) => [
              s.closeButton,
              pressed && { opacity: 0.75 },
            ]}
          >
            <CloseIcon size={20} color={theme.color.content.primary} />
          </Pressable>
        ) : null}
      </View>

      {/* Bottom card. */}
      <Animated.View
        style={[
          s.cardWrap,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }],
          },
        ]}
      >
        <View
          style={[
            s.card,
            { backgroundColor: theme.color.background.primary },
          ]}
        >
          <Animated.View style={[s.flagWrap, rowStyle(0)]}>
            <FlagIllustration size={84} />
          </Animated.View>

          <View style={s.textGroup}>
            <Animated.View style={rowStyle(1)}>
              <NText
                variant="titleMedium"
                style={[s.title, { color: theme.color.content.primary }]}
              >
                {fb.headline1}
                {'\n'}
                {fb.headline2}
              </NText>
            </Animated.View>

            <Animated.View style={rowStyle(2)}>
              <NText
                variant="paragraphMediumDefault"
                tone="secondary"
                style={s.description}
              >
                {fb.body1}
                {'\n'}
                {fb.body2}
              </NText>
            </Animated.View>
          </View>

          <View style={s.ctaGroup}>
            <Animated.View style={rowStyle(3)}>
              <Button
                label={fb.makePayment}
                variant="primary"
                expanded
                onPress={onMakePayment}
              />
            </Animated.View>

            <Animated.View style={rowStyle(4)}>
              <Button
                label={fb.doLater}
                variant="secondary"
                expanded
                onPress={onDoLater}
              />
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 34,
    left: 16,
    right: 16,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    /* Subtle shadow so the icon reads against the illustration. */
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  cardWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 32 : 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    gap: 24,
    /* Elevation/Level 1 from Figma tokens. */
    shadowColor: '#E5E0E8',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 0,
    elevation: 1,
  },
  flagWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  /* Title + Description group — Figma spacing.x2 (8px) between items. */
  textGroup: {
    width: '100%',
    gap: 8,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.84,
  },
  description: {
    textAlign: 'center',
  },
  /* Primary + Secondary CTAs — Figma spacing.x2 (8px) between buttons. */
  ctaGroup: {
    width: '100%',
    gap: 8,
  },
});
