import React, { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { Animated, Dimensions, ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NuDSThemeProvider, loadNuDSFonts } from '@nubank/nuds-vibecode-react-native';
import { lightTheme, darkTheme } from '@nubank/nuds-vibecode-theme';
import { ThemeModeContext } from './config/ThemeModeContext';
import type { ThemeMode, ThemeSegment, ThemeModeCtx } from './config/ThemeModeContext';
import { EmulatorConfigProvider } from './config/EmulatorConfigContext';
import type { Locale } from './i18n';
import PasswordGate from './screens/PasswordGateScreen';
import HomeScreen from './screens/HomeScreen';
import ConfigScreen from './screens/ConfigScreen';
import GlossaryScreen from './screens/GlossaryScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';
import ConditionsScreen from './screens/ConditionsScreen';
import InstallmentListModal from './screens/InstallmentListModal';
import OfferHubScreen from './screens/OfferHubScreen';
import SimulationScreen from './screens/SimulationScreen';
import SummaryScreen, { type SummaryDynamicData } from './screens/SummaryScreen';
import InputValueScreen from './screens/InputValueScreen';
import NuDSCheckScreen from './screens/NuDSCheckScreen';
import TermsScreen from './screens/TermsScreen';
import PinCodeSheet from './screens/PinCodeSheet';
import LoadingScreen from './screens/LoadingScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import DueDateScreen, { type DueDateDynamicData } from './screens/DueDateScreen';
import EligibilityScreen from './screens/EligibilityScreen';
import BuildingBlocksScreen from './screens/BuildingBlocksScreen';
import AdvancedSettingsScreen from './screens/AdvancedSettingsScreen';

const { width: SW } = Dimensions.get('window');

type Screen =
  | { name: 'home' }
  | { name: 'emulator' }
  | { name: 'buildingBlocks' }
  | { name: 'advancedSettings' }
  | { name: 'glossary' }
  | { name: 'flow-management' }
  | { name: 'conditions'; locale: Locale }
  | { name: 'eligibility'; locale: Locale }
  | { name: 'offerHub'; locale: Locale }
  | { name: 'simulation'; locale: Locale; variant?: string }
  | { name: 'summary'; locale: Locale; dynamicData?: SummaryDynamicData }
  | { name: 'inputValue'; locale: Locale; variant?: string }
  | { name: 'nudsCheck' }
  | { name: 'dueDate'; locale: Locale; dynamicData?: DueDateDynamicData; variant?: string }
  | { name: 'terms'; locale: Locale }
  | { name: 'pin'; locale: Locale }
  | { name: 'loading'; locale: Locale; variant?: string }
  | { name: 'feedback'; locale: Locale };

type TaggedScreen = Screen & { _key: number };

type NavState = {
  current: TaggedScreen;
  outgoing: TaggedScreen | null;
  direction: 'forward' | 'back' | null;
};

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

  /* ── Navigation state ── */
  const navCounter = useRef(0);
  const [nav, setNav] = useState<NavState>({
    current: { name: 'home', _key: 0 },
    outgoing: null,
    direction: null,
  });

  const anim = useRef(new Animated.Value(1)).current;
  const busy = useRef(false);

  const navigateTo = useCallback((next: Screen) => {
    if (busy.current) return;
    busy.current = true;
    navCounter.current += 1;
    const tagged = { ...next, _key: navCounter.current } as TaggedScreen;
    setNav((prev) => ({
      current: tagged,
      outgoing: prev.current,
      direction: 'forward',
    }));
  }, []);

  const goBack = useCallback((target: Screen) => {
    if (busy.current) return;
    busy.current = true;
    navCounter.current += 1;
    const tagged = { ...target, _key: navCounter.current } as TaggedScreen;
    setNav((prev) => ({
      current: tagged,
      outgoing: prev.current,
      direction: 'back',
    }));
  }, []);

  useLayoutEffect(() => {
    if (!nav.outgoing || !nav.direction) return;

    anim.setValue(0);

    Animated.timing(anim, {
      toValue: 1,
      duration: nav.direction === 'forward' ? 300 : 250,
      useNativeDriver: true,
    }).start(() => {
      busy.current = false;
      setNav((prev) => ({ current: prev.current, outgoing: null, direction: null }));
    });
  }, [nav.outgoing, nav.direction, anim]);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadNuDSFonts().then(() => setFontsLoaded(true));
  }, []);

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const handleNavigate = useCallback(
    (screenId: string, locale: Locale, variant?: string) => {
      switch (screenId) {
        case 'eligibility': navigateTo({ name: 'eligibility', locale }); break;
        case 'offerHub': navigateTo({ name: 'offerHub', locale }); break;
        case 'suggestedConditions': navigateTo({ name: 'conditions', locale }); break;
        case 'simulation': navigateTo({ name: 'simulation', locale, variant }); break;
        case 'summary': navigateTo({ name: 'summary', locale }); break;
        case 'inputValue': navigateTo({ name: 'inputValue', locale, variant }); break;
        case 'dueDate': navigateTo({ name: 'dueDate', locale, variant }); break;
        case 'terms': navigateTo({ name: 'terms', locale }); break;
        case 'pin': navigateTo({ name: 'pin', locale }); break;
        case 'loading': navigateTo({ name: 'loading', locale, variant }); break;
        case 'feedback': navigateTo({ name: 'feedback', locale }); break;
      }
    },
    [navigateTo],
  );

  const handleSectionNavigate = useCallback(
    (section: 'emulator' | 'glossary' | 'flow-management') => navigateTo({ name: section }),
    [navigateTo],
  );

  const goToNuDSCheck = useCallback(() => navigateTo({ name: 'nudsCheck' }), [navigateTo]);
  const goToBuildingBlocks = useCallback(() => navigateTo({ name: 'buildingBlocks' }), [navigateTo]);
  const goToAdvancedSettings = useCallback(() => navigateTo({ name: 'advancedSettings' }), [navigateTo]);
  const backToHome = useCallback(() => goBack({ name: 'home' }), [goBack]);
  const backToEmulator = useCallback(() => goBack({ name: 'emulator' }), [goBack]);
  const backToBuildingBlocks = useCallback(() => goBack({ name: 'buildingBlocks' }), [goBack]);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#820ad1" />
        </View>
      </SafeAreaProvider>
    );
  }

  const renderScreen = (s: TaggedScreen) => {
    let inner: React.ReactNode = null;
    switch (s.name) {
      case 'home':
        inner = <HomeScreen onNavigate={handleSectionNavigate} />;
        break;
      case 'emulator':
        inner = (
          <ConfigScreen
            onNavigate={handleNavigate}
            onNuDSCheck={goToNuDSCheck}
            onBack={backToHome}
            onBuildingBlocks={goToBuildingBlocks}
            onAdvancedSettings={goToAdvancedSettings}
          />
        );
        break;
      case 'buildingBlocks':
        inner = <BuildingBlocksScreen onNavigate={handleNavigate} onBack={backToEmulator} />;
        break;
      case 'advancedSettings':
        inner = <AdvancedSettingsScreen onBack={backToEmulator} />;
        break;
      case 'glossary':
        inner = <GlossaryScreen onBack={backToHome} />;
        break;
      case 'flow-management':
        inner = (
          <PlaceholderScreen
            icon="git"
            title="Flow Management"
            subtitle="Version control, active experiments, and advanced admin tools will be available here soon."
            onBack={backToHome}
          />
        );
        break;
      case 'conditions':
        inner = (
          <View style={{ flex: 1 }}>
            <ConditionsScreen locale={s.locale} onBack={backToEmulator} onMoreOptions={openModal} />
            <InstallmentListModal locale={s.locale} visible={showModal} onClose={closeModal} />
          </View>
        );
        break;
      case 'eligibility':
        inner = (
          <EligibilityScreen
            locale={s.locale}
            onClose={backToEmulator}
            onSelectFixed={() => navigateTo({ name: 'simulation', locale: s.locale })}
            onSelectFlexible={() => navigateTo({ name: 'simulation', locale: s.locale })}
          />
        );
        break;
      case 'offerHub':
        inner = <OfferHubScreen locale={s.locale} onClose={backToEmulator} />;
        break;
      case 'simulation':
        inner = (
          <SimulationScreen
            locale={s.locale}
            variant={s.variant}
            onBack={backToEmulator}
            onContinue={(result) => navigateTo({
              name: 'summary', locale: s.locale,
              dynamicData: {
                installments: result.installments, monthlyPayment: result.monthlyPayment,
                total: result.total, savings: result.savings,
                downpayment: result.downpayment ?? 0, totalInterest: result.totalInterest ?? 0,
                effectiveRate: result.effectiveRate ?? 0,
              },
            })}
          />
        );
        break;
      case 'summary':
        inner = <SummaryScreen locale={s.locale} onBack={backToEmulator} dynamicData={s.dynamicData} />;
        break;
      case 'inputValue':
        inner = <InputValueScreen locale={s.locale} onBack={backToEmulator} variant={s.variant} />;
        break;
      case 'nudsCheck':
        inner = <NuDSCheckScreen onBack={backToEmulator} />;
        break;
      case 'dueDate':
        inner = (
          <DueDateScreen locale={s.locale} dynamicData={s.dynamicData} variant={s.variant as any}
            onBack={backToEmulator} onContinue={() => navigateTo({ name: 'terms', locale: s.locale })} />
        );
        break;
      case 'terms':
        inner = (
          <TermsScreen
            locale={s.locale}
            onBack={backToEmulator}
            onConfirm={backToEmulator}
          />
        );
        break;
      case 'pin':
        /* PIN is a neutral, reusable BottomSheet. Building Blocks is a screen
         * previewer (like the web): onClose AND onSuccess both return to the
         * emulator. Any flow that wants to gate on `pinEnabled` mounts this
         * sheet inline and wires its own onSuccess callback. */
        inner = (
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <PinCodeSheet
              visible
              locale={s.locale}
              onClose={backToEmulator}
              onSuccess={backToEmulator}
            />
          </View>
        );
        break;
      case 'loading':
        /*
         * Building Blocks preview: don't pass `onDone` — the screen will
         * hold on the final step forever, and tapping the X returns the
         * viewer to the Building Blocks list (not all the way back to the
         * emulator home). Use Case flows that chain Loading → next screen
         * should provide their own onDone when embedding this component.
         */
        inner = (
          <LoadingScreen
            locale={s.locale}
            variant={s.variant}
            onClose={backToBuildingBlocks}
          />
        );
        break;
      case 'feedback':
        inner = (
          <FeedbackScreen
            locale={s.locale}
            onMakePayment={backToHome}
            onDoLater={backToHome}
            onClose={backToEmulator}
          />
        );
        break;
    }
    return <View key={s._key} style={{ flex: 1 }}>{inner}</View>;
  };

  /* ── Build animated layers ── */
  let content: React.ReactNode;

  if (nav.outgoing && nav.direction) {
    const isForward = nav.direction === 'forward';

    const enterFrom = isForward ? SW : -SW * 0.3;
    const enterTo = 0;
    const exitFrom = 0;
    const exitTo = isForward ? -SW * 0.3 : SW;

    const currentX = anim.interpolate({ inputRange: [0, 1], outputRange: [enterFrom, enterTo] });
    const outgoingX = anim.interpolate({ inputRange: [0, 1], outputRange: [exitFrom, exitTo] });
    const outgoingOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });

    content = (
      <>
        <Animated.View style={[styles.layer, { transform: [{ translateX: outgoingX }], opacity: outgoingOpacity }]}>
          {renderScreen(nav.outgoing)}
        </Animated.View>
        <Animated.View style={[styles.layer, { transform: [{ translateX: currentX }] }]}>
          {renderScreen(nav.current)}
        </Animated.View>
      </>
    );
  } else {
    content = renderScreen(nav.current);
  }

  return (
    <SafeAreaProvider>
      <ThemeModeContext.Provider value={themeModeValue}>
        <NuDSThemeProvider mode={themeMode} themeOverride={segmentOverride as any}>
          <PasswordGate>
            <EmulatorConfigProvider>
              {content}
            </EmulatorConfigProvider>
          </PasswordGate>
        </NuDSThemeProvider>
      </ThemeModeContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject },
});
