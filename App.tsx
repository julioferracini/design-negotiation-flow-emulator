import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Animated, Dimensions, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NuDSThemeProvider, loadNuDSFonts } from '@nubank/nuds-vibecode-react-native';
import { ThemeModeContext } from './config/ThemeModeContext';
import type { ThemeMode, ThemeModeCtx } from './config/ThemeModeContext';
import type { Locale } from './i18n';
import StartScreen from './screens/StartScreen';
import ConditionsScreen from './screens/ConditionsScreen';
import InstallmentListModal from './screens/InstallmentListModal';
import OfferHubScreen from './screens/OfferHubScreen';
import NuDSCheckScreen from './screens/NuDSCheckScreen';
const { width: SW } = Dimensions.get('window');

type Screen =
  | { name: 'home' }
  | { name: 'conditions'; locale: Locale }
  | { name: 'offerHub'; locale: Locale }
  | { name: 'nudsCheck' };

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const themeModeValue = useMemo<ThemeModeCtx>(() => ({
    mode: themeMode,
    toggle: () => setThemeMode((m) => (m === 'light' ? 'dark' : 'light')),
  }), [themeMode]);
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
        default:
          break;
      }
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
          <StartScreen
            onNavigate={handleNavigate}
            onNuDSCheck={() => navigateTo({ name: 'nudsCheck' })}
          />
        );

      case 'conditions':
        return (
          <View style={{ flex: 1 }}>
            <ConditionsScreen
              locale={s.locale}
              onBack={() => goBack({ name: 'home' })}
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
            onClose={() => goBack({ name: 'home' })}
          />
        );

      case 'nudsCheck':
        return (
          <NuDSCheckScreen
            onBack={() => goBack({ name: 'home' })}
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
          <NuDSThemeProvider mode={themeMode}>
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
          </NuDSThemeProvider>
        </ThemeModeContext.Provider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeModeContext.Provider value={themeModeValue}>
        <NuDSThemeProvider mode={themeMode}>
          {renderScreen(screen)}
        </NuDSThemeProvider>
      </ThemeModeContext.Provider>
    </SafeAreaProvider>
  );
}

function getDepth(name: string): number {
  switch (name) {
    case 'home': return 0;
    case 'conditions':
    case 'offerHub':
    case 'nudsCheck':
      return 1;
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
