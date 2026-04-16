import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  TopBar,
  NText,
  Badge,
  Button,
  Box,
  ArrowBackIcon,
  CheckmarkIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import { getUseCaseForLocale } from '../config/useCases';
import { formatCurrency, interpolate } from '../config/formatters';
import { useEmulatorConfig } from '../config/EmulatorConfigContext';
import { useThemeMode } from '../config/ThemeModeContext';

type OptionType = 'fixed' | 'flexible';

function FixedIcon({ size, color }: { size: number; color: string }) {
  const r = size * 0.15;
  const gap = size * 0.32;
  const cx1 = size / 2 - gap / 2;
  const cx2 = size / 2 + gap / 2;
  const cy1 = size / 2 - gap / 2;
  const cy2 = size / 2 + gap / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx1} cy={cy1} r={r} fill={color} />
      <Circle cx={cx2} cy={cy1} r={r} fill={color} />
      <Circle cx={cx1} cy={cy2} r={r} fill={color} />
      <Circle cx={cx2} cy={cy2} r={r} fill={color} />
    </Svg>
  );
}

function FlexibleIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 8C5.5 6.067 7.067 4.5 9 4.5c1.933 0 3.5 1.567 3.5 3.5S10.933 11.5 9 11.5M18.5 16c0 1.933-1.567 3.5-3.5 3.5s-3.5-1.567-3.5-3.5 1.567-3.5 3.5-3.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M12.5 8c1.38 0 2.5-.5 3.5-1.5M5.5 16c0-1 1.12-3.5 3-3.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PulseBadge({ text }: { text: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale]);
  return (
    <Animated.View style={{ alignSelf: 'center', transform: [{ scale }] }}>
      <Badge label={text} color="success" />
    </Animated.View>
  );
}

export default function EligibilityScreen({
  locale = 'pt-BR',
  onClose,
  onSelectFixed,
  onSelectFlexible,
}: {
  locale?: Locale;
  onClose?: () => void;
  onSelectFixed?: () => void;
  onSelectFlexible?: () => void;
}) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const t = useTranslation(locale);
  const el = t.eligibility;

  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);

  const { debtOverrides, effectiveRules } = useEmulatorConfig();
  const totalDebt = debtOverrides.cardBalance + debtOverrides.loanBalance;
  const discountPercent = effectiveRules.offer1DiscountPercent;
  const discountAmount = totalDebt * discountPercent;
  const discountedTotal = totalDebt - discountAmount;

  const [selectedOption, setSelectedOption] = useState<OptionType>('fixed');
  const benefitsFade = useRef(new Animated.Value(1)).current;
  const cardEntrance1 = useRef(new Animated.Value(0)).current;
  const cardEntrance2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(cardEntrance1, { toValue: 1, tension: 180, friction: 20, useNativeDriver: true }),
      Animated.spring(cardEntrance2, { toValue: 1, tension: 180, friction: 20, useNativeDriver: true }),
    ]).start();
  }, []);

  const switchOption = (opt: OptionType) => {
    if (opt === selectedOption) return;
    Animated.timing(benefitsFade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      LayoutAnimation.configureNext({
        duration: 200,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      setSelectedOption(opt);
      Animated.spring(benefitsFade, { toValue: 1, tension: 180, friction: 20, useNativeDriver: true }).start();
    });
  };

  const activeData = selectedOption === 'fixed' ? el.fixedOption : el.flexibleOption;

  const handleCTA = () => {
    if (selectedOption === 'fixed') {
      onSelectFixed?.();
    } else {
      onSelectFlexible?.();
    }
  };

  const renderCard = (option: OptionType) => {
    const isSelected = selectedOption === option;
    const data = option === 'fixed' ? el.fixedOption : el.flexibleOption;
    const IconComponent = option === 'fixed' ? FixedIcon : FlexibleIcon;

    const iconColor = isSelected
      ? theme.color.main
      : theme.color.content.secondary;
    const iconBg = isSelected
      ? theme.color.surface.accent
      : theme.color.background.secondary;

    return (
      <TouchableOpacity
        key={option}
        style={[
          {
            aspectRatio: 1,
            borderRadius: theme.radius.lg,
            borderColor: isSelected ? theme.color.main : theme.color.border.secondary,
            borderWidth: isSelected ? 2 : 1,
            backgroundColor: isSelected
              ? theme.color.surface.accentSubtle
              : theme.color.background.primary,
            padding: theme.spacing[4],
            justifyContent: 'space-between',
            ...theme.elevation.level1,
            shadowColor: theme.color.content.primary,
          },
        ]}
        activeOpacity={0.8}
        onPress={() => switchOption(option)}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.radius.full,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={20} color={iconColor} />
        </View>

        <View>
          <NText
            variant="subtitleMediumStrong"
            color={isSelected ? theme.color.main : undefined}
          >
            {data.title}
          </NText>

          <NText
            variant="labelSmallDefault"
            tone={isSelected ? undefined : 'secondary'}
            color={isSelected ? theme.color.main : undefined}
            style={{ marginTop: theme.spacing[1] }}
          >
            {data.subtitle}
          </NText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      <TopBar
        title={el.title}
        variant="default"
        showStatusBar={false}
        leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
        onPressLeading={onClose}
        show1stAction={false}
        show2ndAction={false}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance */}
        <View style={{ alignItems: 'center', paddingTop: theme.spacing[4] }}>
          <NText variant="subtitleSmallDefault" tone="secondary">
            {el.totalBalanceLabel}
          </NText>

          <View style={{ alignItems: 'center' }}>
            <NText variant="labelXSmallDefault" tone="secondary">
              {el.fromPrefix}{' '}
              <NText
                variant="labelXSmallDefault"
                tone="secondary"
                style={{ textDecorationLine: 'line-through' }}
              >
                {fmtAmount(totalDebt)}
              </NText>{' '}
              {el.toSuffix}
            </NText>
          </View>

          <NText variant="titleLarge">
            {fmtAmount(discountedTotal)}
          </NText>

          <PulseBadge
            text={interpolate(el.discountBadge, { amount: fmtAmount(discountAmount) })}
          />
        </View>

        {/* Question */}
        <NText
          variant="titleXSmall"
          style={{
            textAlign: 'center',
            marginTop: theme.spacing[6],
            marginBottom: theme.spacing[3],
          }}
        >
          {el.question}
        </NText>

        {/* Option Cards — 2x1 row */}
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[3],
            paddingHorizontal: theme.spacing[4],
            marginBottom: theme.spacing[4],
          }}
        >
          <Animated.View style={{ flex: 1, opacity: cardEntrance1, transform: [{ translateY: cardEntrance1.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: cardEntrance1.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }}>
            {renderCard('fixed')}
          </Animated.View>
          <Animated.View style={{ flex: 1, opacity: cardEntrance2, transform: [{ translateY: cardEntrance2.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: cardEntrance2.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }}>
            {renderCard('flexible')}
          </Animated.View>
        </View>

        {/* Benefits List */}
        <Animated.View style={{ opacity: benefitsFade, transform: [{ translateY: benefitsFade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
          {activeData.benefits.map((benefit, i) => (
            <React.Fragment key={`${selectedOption}-${i}`}>
              {i > 0 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.color.border.secondary,
                  }}
                />
              )}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: theme.spacing[4],
                  paddingHorizontal: theme.spacing[5],
                  gap: theme.spacing[4],
                }}
              >
                <CheckmarkIcon size={20} color={theme.color.content.secondary} />
                <NText variant="labelSmallDefault" style={{ flex: 1 }}>
                  {benefit}
                </NText>
              </View>
            </React.Fragment>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.color.background.primary,
          borderTopWidth: 1,
          borderTopColor: theme.color.border.secondary,
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[4],
          paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing[4],
        }}
      >
        <Button
          label={activeData.cta}
          variant="primary"
          expanded
          onPress={handleCTA}
        />
      </View>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 34,
  },
  scroll: {
    flex: 1,
  },
});
