import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Animated, Dimensions, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NuDSThemeProvider, loadNuDSFonts } from '@nubank/nuds-vibecode-react-native';
import { lightTheme, darkTheme } from '@nubank/nuds-vibecode-theme';
import { ThemeModeContext } from './config/ThemeModeContext';
import type { ThemeMode, ThemeSegment, ThemeModeCtx } from './config/ThemeModeContext';
import type { Locale } from './i18n';
import PasswordGate from './screens/PasswordGateScreen';
import HomeScreen from './screens/HomeScreen';
import ConfigScreen from './screens/ConfigScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';
import ConditionsScreen from './screens/ConditionsScreen';
import InstallmentListModal from './screens/InstallmentListModal';
import OfferHubScreen from './screens/OfferHubScreen';
import SimulationScreen from './screens/SimulationScreen';
import SummaryScreen, { type SummaryDynamicData } from './screens/SummaryScreen';
import InstallmentValueScreen from './screens/InstallmentValueScreen';
import NuDSCheckScreen from './screens/NuDSCheckScreen';
const { width: SW } = Dimensions.get('window');

type Screen =
  | { name: 'home' }
  | { name: 'emulator' }
  | { name: 'glossary' }
  | { name: 'analytics' }
  | { name: 'flow-management' }
  | { name: 'conditions'; locale: Locale }
  | { name: 'offerHub'; locale: Locale }
  | { name: 'simulation'; locale: Locale }
  | { name: 'summary'; locale: Locale; dynamicData?: SummaryDynamicData }
  | { name: 'installmentValue'; locale: Locale }
  | { name: 'nudsCheck' };

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [themeSegment, setThemeSegment] = useState<ThemeSegment>('standard');
  const themeModeValue = useMemo<ThemeModeCtx>(() => ({
    mode: themeMode,
    toggle: () => setThemeMode((m) => (m === 'light' ? 'dark' : 'light')),
    segment: themeSegment,
    setSegment: setThemeSegment,
  }), [themeMode, themeSegment]);

  const SEGMENT_ACCENTS: Record<ThemeSegment, { light: string; dark: string; lightFb: string; darkFb: string; lightAccent: string; darkAccent: string }> = {
    standard: { light: '#820AD1', dark: '#5A1D8C', lightFb: '#610F9B', darkFb: '#8132C5', lightAccent: '#9436E1', darkAccent: '#8132C5' },
    uv: { light: '#3E1874', dark: '#3D1E6F', lightFb: '#2A1050', darkFb: '#4E268D', lightAccent: '#53209C', darkAccent: '#4E268D' },
    pj: { light: '#714F8F', dark: '#643D7C', lightFb: '#652590', darkFb: '#785296', lightAccent: '#886A9E', darkAccent: '#785296' },
  };

  const segmentOverride = useMemo(() => {
    if (themeSegment === 'standard') return undefined;
    const base = themeMode === 'light' ? lightTheme : darkTheme;
    const acc = SEGMENT_ACCENTS[themeSegment];
    const main = themeMode === 'light' ? acc.light : acc.dark;
    const fb = themeMode === 'light' ? acc.lightFb : acc.darkFb;
    const accent = themeMode === 'light' ? acc.lightAccent : acc.darkAccent;
    return {
      ...base,
      color: {
        ...base.color,
        main,
        mainFeedback: fb,
        accent,
        accentFeedback: fb,
        border: { ...base.color.border, focus: main },
      },
    };
  }, [themeSegment, themeMode]);
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadNuDSFonts().then(() => setFontsLoaded(true));
  }, []);

  const navigateTo = useCallback(
    (next: Screen) => {
      setPrevScreen(screen);
      setScreen(next);
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start(() => setPrevScreen(null));
    },
    [screen, slideAnim],
  );

  const goBack = useCallback(
    (target: Screen) => {
      setPrevScreen(screen);
      setScreen(target);
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setPrevScreen(null));
    },
    [screen, slideAnim],
  );

  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleNavigate = useCallback(
    (screenId: string, locale: Locale) => {
      switch (screenId) {
        case 'offerHub':
          navigateTo({ name: 'offerHub', locale });
          break;
        case 'suggestedConditions':
          navigateTo({ name: 'conditions', locale });
          break;
        case 'simulation':
          navigateTo({ name: 'simulation', locale });
          break;
        case 'summary':
          navigateTo({ name: 'summary', locale });
          break;
        case 'installmentValue':
          navigateTo({ name: 'installmentValue', locale });
          break;
        default:
          break;
      }
    },
    [navigateTo],
  );

  const handleSectionNavigate = useCallback(
    (section: 'emulator' | 'glossary' | 'flow-management' | 'analytics') => {
      navigateTo({ name: section });
    },
    [navigateTo],
  );

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#820ad1" />
        </View>
      </SafeAreaProvider>
    );
  }

  const renderScreen = (s: Screen) => {
    switch (s.name) {
      case 'home':
        return (
          <HomeScreen onNavigate={handleSectionNavigate} />
        );

      case 'emulator':
        return (
          <ConfigScreen
            onNavigate={handleNavigate}
            onNuDSCheck={() => navigateTo({ name: 'nudsCheck' })}
            onBack={() => goBack({ name: 'home' })}
          />
        );

      case 'glossary':
        return (
          <PlaceholderScreen
            icon="book"
            title="Glossary"
            subtitle="Comprehensive reference of business terms, domain definitions, and regulatory concepts will be available here."
            onBack={() => goBack({ name: 'home' })}
          />
        );

      case 'flow-management':
        return (
          <PlaceholderScreen
            icon="git"
            title="Flow Management"
            subtitle="Version control, active experiments, and advanced admin tools will be available here soon."
            onBack={() => goBack({ name: 'home' })}
          />
        );

      case 'analytics':
        return (
          <PlaceholderScreen
            icon="chart"
            title="Analytics"
            subtitle="Product performance dashboards and experiment tracking are being built. Stay tuned for real-time insights."
            onBack={() => goBack({ name: 'home' })}
          />
        );

      case 'conditions':
        return (
          <View style={{ flex: 1 }}>
            <ConditionsScreen
              locale={s.locale}
              onBack={() => goBack({ name: 'emulator' })}
              onMoreOptions={openModal}
            />
            <InstallmentListModal
              locale={s.locale}
              visible={showModal}
              onClose={closeModal}
            />
          </View>
        );

      case 'offerHub':
        return (
          <OfferHubScreen
            locale={s.locale}
            onClose={() => goBack({ name: 'emulator' })}
          />
        );

      case 'simulation':
        return (
          <SimulationScreen
            locale={s.locale}
            onBack={() => goBack({ name: 'emulator' })}
            onContinue={(result) => navigateTo({
              name: 'summary',
              locale: s.locale,
              dynamicData: {
                installments: result.installments,
                monthlyPayment: result.monthlyPayment,
                total: result.total,
                savings: result.savings,
                downpayment: result.downpayment ?? 0,
                totalInterest: result.totalInterest ?? 0,
                effectiveRate: result.effectiveRate ?? 0,
              },
            })}
          />
        );

      case 'summary':
        return (
          <SummaryScreen
            locale={s.locale}
            onBack={() => goBack({ name: 'emulator' })}
            dynamicData={s.dynamicData}
          />
        );

      case 'installmentValue':
        return (
          <InstallmentValueScreen
            locale={s.locale}
            onBack={() => goBack({ name: 'emulator' })}
          />
        );

      case 'nudsCheck':
        return (
          <NuDSCheckScreen
            onBack={() => goBack({ name: 'emulator' })}
          />
        );

      default:
        return null;
    }
  };

  const isForward =
    prevScreen &&
    getDepth(screen.name) > getDepth(prevScreen.name);

  const isBack =
    prevScreen &&
    getDepth(screen.name) < getDepth(prevScreen.name);

  if (prevScreen && (isForward || isBack)) {
    const fgTranslateX = isForward
      ? slideAnim.interpolate({ inputRange: [0, 1], outputRange: [SW, 0] })
      : slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-SW, 0] });

    const bgTranslateX = isForward
      ? slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -SW * 0.3] })
      : slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SW * 0.3] });

    const bgOpacity = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.7],
    });

    return (
      <SafeAreaProvider>
        <ThemeModeContext.Provider value={themeModeValue}>
          <NuDSThemeProvider mode={themeMode} themeOverride={segmentOverride as any}>
            <PasswordGate>
              <Animated.View
                style={{
                  ...absPosition,
                  transform: [{ translateX: bgTranslateX }],
                  opacity: bgOpacity,
                }}
              >
                {renderScreen(prevScreen)}
              </Animated.View>
              <Animated.View
                style={{
                  ...absPosition,
                  transform: [{ translateX: fgTranslateX }],
                }}
              >
                {renderScreen(screen)}
              </Animated.View>
            </PasswordGate>
          </NuDSThemeProvider>
        </ThemeModeContext.Provider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeModeContext.Provider value={themeModeValue}>
        <NuDSThemeProvider mode={themeMode} themeOverride={segmentOverride as any}>
          <PasswordGate>
            {renderScreen(screen)}
          </PasswordGate>
        </NuDSThemeProvider>
      </ThemeModeContext.Provider>
    </SafeAreaProvider>
  );
}

function getDepth(name: string): number {
  switch (name) {
    case 'home': return 0;
    case 'emulator':
    case 'glossary':
    case 'analytics':
    case 'flow-management':
      return 1;
    case 'conditions':
    case 'offerHub':
    case 'simulation':
    case 'summary':
    case 'installmentValue':
    case 'nudsCheck':
      return 2;
    default: return 0;
  }
}

const absPosition = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
