import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TopBar,
  NText,
  Badge,
  Button,
  CloseIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import {
  getUseCaseForLocale,
  getOffersForTab,
  getTabData,
} from '../config/useCases';
import type { OfferConfig, TabConfig } from '../config/useCases';
import { formatCurrency, interpolate } from '../config/formatters';
import type { Translations } from '../i18n/types';

type OfferHubStrings = Translations['offerHub'];

function ohLookup(oh: OfferHubStrings, key: string): string {
  return (oh as Record<string, unknown>)[key] as string ?? key;
}

/* ─────────── Pulse Badge ─────────── */
function PulseBadge({ text }: { text: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [scale]);
  return (
    <Animated.View style={[styles.discountBadge, { transform: [{ scale }] }]}>
      <Badge label={text} color="success" />
    </Animated.View>
  );
}

/* ─────────── Segmented Control ─────────── */
const SEG_PAD = 2;

function SegmentedControl({ tabs, activeIndex, onSelect }: {
  tabs: { key: string; label: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const theme = useNuDSTheme();
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const tabW = width > 0 ? (width - SEG_PAD * 2) / tabs.length : 0;

  useEffect(() => {
    if (width === 0) return;
    Animated.spring(indicatorX, { toValue: activeIndex * tabW, tension: 300, friction: 30, useNativeDriver: true }).start();
  }, [activeIndex, width, indicatorX, tabW]);

  return (
    <View
      style={[styles.segOuter, { backgroundColor: theme.color.background.secondary }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Animated.View style={[styles.segIndicator, {
          width: tabW,
          transform: [{ translateX: indicatorX }],
          backgroundColor: theme.color.background.primary,
          borderColor: theme.color.border.secondary,
          shadowColor: theme.color.content.primary,
        }]} />
      )}
      {tabs.map((tab, i) => (
        <TouchableOpacity key={tab.key} style={styles.segTab} onPress={() => onSelect(i)} activeOpacity={0.7}>
          <NText
            variant="labelXSmallStrong"
            color={i === activeIndex ? theme.color.main : theme.color.content.secondary}
          >
            {tab.label}
          </NText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ─────────── Animated Offer Card ─────────── */
function AnimatedOfferCard({ offer, oh, fmtAmount, delay }: {
  offer: OfferConfig;
  oh: OfferHubStrings;
  fmtAmount: (v: number) => string;
  delay: number;
}) {
  const theme = useNuDSTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, tension: 180, friction: 22, useNativeDriver: true }),
    ]).start();
  }, []);

  const hl = offer.highlighted;
  const title = ohLookup(oh, offer.titleKey);
  const badgeText = offer.badge ? ohLookup(oh, offer.badge) : null;
  const paymentLabel = interpolate(ohLookup(oh, offer.paymentLabelKey), { amount: fmtAmount(offer.paymentValue) });
  const benefit = interpolate(ohLookup(oh, offer.benefitKey), { amount: fmtAmount(offer.benefitValue) });
  const ctaText = ohLookup(oh, offer.ctaKey);

  return (
    <Animated.View style={[styles.cardOuter, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.card, {
        backgroundColor: hl ? `${theme.color.main}10` : theme.color.background.primary,
        borderColor: hl ? theme.color.main : theme.color.border.primary,
      }]}>
        <View style={styles.cardTop}>
          {badgeText && (
            <View style={{ marginBottom: 8 }}>
              <Badge label={badgeText} color={offer.badgeType === 'green' ? 'success' : 'accent'} />
            </View>
          )}
          <NText variant="titleXSmall" style={{ marginBottom: 8 }}>{title}</NText>
          <NText variant="labelXSmallDefault" tone="secondary" style={{ marginBottom: 4 }}>{paymentLabel}</NText>
          <NText variant="labelXSmallStrong" tone="positive">{benefit}</NText>
        </View>
        <View style={styles.cardBottom}>
          <Button
            label={ctaText}
            variant={hl ? 'primary' : 'secondary'}
            expanded
            compact
            onPress={() => {}}
          />
        </View>
      </View>
    </Animated.View>
  );
}

/* ─────────── Offer Hub Screen ─────────── */
export default function OfferHubScreen({ locale = 'pt-BR', onClose }: { locale?: Locale; onClose?: () => void }) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const oh = t.offerHub;
  const tabs = oh.tabs;

  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);

  const [activeTab, setActiveTab] = useState(0);
  const [displayedTab, setDisplayedTab] = useState(0);
  const isInitial = useRef(true);
  const cardsFade = useRef(new Animated.Value(1)).current;
  const valSlide = useRef(new Animated.Value(0)).current;
  const valOpacity = useRef(new Animated.Value(1)).current;

  const tabKey = tabs[displayedTab].key;
  const tabData: TabConfig | undefined = getTabData(useCase, tabKey);
  const offers = getOffersForTab(useCase, tabKey);

  const switchTab = useCallback((index: number) => {
    if (index === activeTab) return;
    setActiveTab(index);
    Animated.parallel([
      Animated.timing(cardsFade, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(valSlide, { toValue: -30, duration: 180, useNativeDriver: true }),
      Animated.timing(valOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setDisplayedTab(index));
  }, [activeTab, cardsFade, valSlide, valOpacity]);

  useEffect(() => {
    if (isInitial.current) { isInitial.current = false; return; }
    cardsFade.setValue(1);
    valSlide.setValue(30);
    valOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(valSlide, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }),
      Animated.timing(valOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [displayedTab]);

  const discountBadgeText = tabData
    ? interpolate(oh.discount, { amount: fmtAmount(tabData.discountValue) })
    : '';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />

      <View style={[styles.header, { backgroundColor: theme.color.background.primary }]}>
        <TopBar
          title={oh.title}
          variant="modal"
          show1stAction={false}
          show2ndAction={false}
          leading={<CloseIcon size={24} color={theme.color.content.secondary} />}
          onPressLeading={onClose}
        />
        <View style={{ paddingHorizontal: 20 }}>
          <SegmentedControl tabs={tabs} activeIndex={activeTab} onSelect={switchTab} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceWrap}>
          <NText variant="subtitleSmallDefault" tone="secondary">{oh.totalLabel}</NText>
          {tabData && (
            <View style={styles.valueClip}>
              <Animated.View style={{ opacity: valOpacity, transform: [{ translateY: valSlide }], alignItems: 'center' }}>
                <NText variant="labelXSmallDefault" tone="secondary">
                  {oh.fromPrefix}{' '}
                  <NText variant="labelXSmallDefault" tone="secondary" style={{ textDecorationLine: 'line-through' }}>
                    {fmtAmount(tabData.originalTotal)}
                  </NText>{' '}
                  {oh.toSuffix}
                </NText>
                <View style={{ paddingVertical: 7 }}>
                  <NText variant="titleLarge">
                    {fmtAmount(tabData.discountedTotal)}
                  </NText>
                </View>
              </Animated.View>
            </View>
          )}
          {discountBadgeText ? <PulseBadge text={discountBadgeText} /> : null}
        </View>

        <Animated.View style={{ opacity: cardsFade }}>
          {offers.map((offer, i) => (
            <AnimatedOfferCard key={`${tabKey}-${offer.id}`} offer={offer} oh={oh} fmtAmount={fmtAmount} delay={i * 100} />
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingBottom: 12,
    zIndex: 10,
  },
  segOuter: {
    flexDirection: 'row',
    borderRadius: 64,
    height: 48,
    padding: SEG_PAD,
  },
  segIndicator: {
    position: 'absolute',
    top: SEG_PAD,
    bottom: SEG_PAD,
    left: SEG_PAD,
    borderRadius: 999,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 0,
      },
      android: { elevation: 2 },
    }),
  },
  segTab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 44, zIndex: 1 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingBottom: 16 },
  balanceWrap: { paddingTop: 16, paddingBottom: 24, alignItems: 'center' },
  valueClip: { overflow: 'hidden', width: '100%', maxWidth: 335 },
  discountBadge: { alignSelf: 'center', marginTop: 8 },
  cardOuter: { alignSelf: 'stretch', marginHorizontal: 0, marginBottom: 16 },
  card: { borderRadius: 24, borderWidth: 0.5, overflow: 'hidden' },
  cardTop: { padding: 20, paddingBottom: 16 },
  cardBottom: { paddingHorizontal: 12, paddingBottom: 12 },
});
