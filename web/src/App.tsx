/**
 * App — Web entry point with platform-level routing.
 *
 * Top-level routes:
 *   /                              -> Home (hero + feature blocks)
 *   /emulator                      -> SplitScreen emulator (ParameterPanel + Prototype)
 *   /emulator/{pl}/{uc}/{screen}   -> Deep prototype routes
 *   /experience-architecture       -> Experience Architecture (use case map + capability matrix)
 *   /flow-management               -> Placeholder (coming soon)
 *   /project-timeline              -> Project Timeline (Jira status + changelog)
 *   /glossary                      -> Glossary
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PasswordGate from './components/PasswordGate';
import SplitScreen from './components/layout/SplitScreen';
import Sidebar, { type SectionId } from './components/layout/Sidebar';
import HamburgerButton from './components/layout/HamburgerButton';
import AIFloatingButton from './components/ai/AIFloatingButton';
import AIChatPanel from './components/ai/AIChatPanel';
import RulesFloatingButton from './components/rules/RulesFloatingButton';
import RulesPanel from './components/rules/RulesPanel';
import { EmulatorConfigProvider, useEmulatorConfig } from './context/EmulatorConfigContext';
import type { ConfigAction } from './components/ai/aiWizard';
import { getTransitionProps, transitionPresets, type Direction } from './transitions';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PrototypeNavigationProvider } from './context/PrototypeNavigationContext';
import { usePrototypeLocation } from './hooks/usePrototypeLocation';
import { parseProtoLocale } from './lib/protoLocale';
import OfferHubScreen from './screens/OfferHubScreen';
import SuggestedConditionsScreen from './screens/SuggestedConditionsScreen';
import SimulationScreen from './screens/SimulationScreen';
import SummaryScreen, { type SummaryDynamicData } from './screens/SummaryScreen';
import InputValueScreen from './screens/InputValueScreen';
import DueDateScreen, { type DueDateVariant } from './screens/DueDateScreen';
import TermsScreen from './screens/TermsScreen';
import EligibilityScreen from './screens/EligibilityScreen';
import HomePage from './screens/HomePage';
import PlaceholderPage from './screens/PlaceholderPage';
import GlossaryPage from './screens/GlossaryPage';
import ExperienceArchitecturePage from './screens/ExperienceArchitecturePage';
import ProjectTimelinePage from './screens/ProjectTimelinePage';
import { GitBranch } from 'lucide-react';
import type { Locale } from '@shared/i18n';

type ScreenType = 'placeholder' | 'offerHub' | 'suggested' | 'simulation' | 'summary' | 'inputValue' | 'dueDate' | 'terms' | 'eligibility';

type IsolatedRoute = {
  productLine: string;
  useCaseId: string;
  screen: string;
  lang: string;
  path: string;
};

function parseIsolatedRoute(pathname: string, search: string): IsolatedRoute | null {
  let stripped = pathname;
  if (stripped.startsWith('/emulator')) {
    stripped = stripped.slice('/emulator'.length) || '/';
  }

  const parts = stripped.split('/').filter(Boolean);
  if (parts.length < 3) return null;

  const [productLine, useCaseId, screen] = parts;
  const lang = new URLSearchParams(search).get('lang') ?? 'pt-BR';
  return {
    productLine,
    useCaseId,
    screen,
    lang,
    path: `${pathname}${search || `?lang=${lang}`}`,
  };
}

function resolveScreenType(screenSlug: string): ScreenType {
  const normalized = screenSlug.toLowerCase().replace(/_/g, '-');
  if (normalized === 'offer-hub') return 'offerHub';
  if (normalized === 'suggested-conditions') return 'suggested';
  if (normalized === 'simulation') return 'simulation';
  if (normalized === 'summary') return 'summary';
  if (normalized === 'input-value') return 'inputValue';
  if (normalized === 'installment-value') return 'inputValue';
  if (normalized === 'due-date') return 'dueDate';
  if (normalized === 'terms-and-conditions' || normalized === 'terms') return 'terms';
  if (normalized === 'eligibility') return 'eligibility';
  return 'placeholder';
}

function resolveSection(pathname: string): SectionId {
  const first = pathname.split('/').filter(Boolean)[0];
  if (first === 'emulator') return 'emulator';
  if (first === 'experience-architecture') return 'experience-architecture';
  if (first === 'flow-management') return 'flow-management';
  if (first === 'project-timeline') return 'project-timeline';
  if (first === 'glossary') return 'glossary';
  return 'home';
}

export default function App() {
  return (
    <ThemeProvider>
      <EmulatorConfigProvider>
        <PasswordGate>
          <AppShell />
        </PasswordGate>
      </EmulatorConfigProvider>
    </ThemeProvider>
  );
}

const sectionTransition = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
};

function AppShell() {
  const { pathname, search, navigate } = usePrototypeLocation();
  const config = useEmulatorConfig();
  const { setMode, setSegment } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const section = resolveSection(pathname);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const applyEmulatorActions = useCallback((actions: ConfigAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'setLocale': config.setLocale(action.value); break;
        case 'setProductLine': config.setProductLine(action.value); break;
        case 'setUseCase': config.setUseCase(action.value); break;
        case 'toggleScreen': config.updateScreen(action.screen, { enabled: action.enabled }); break;
        case 'setFlowOption': config.updateFlowOption(action.key, action.value); break;
        case 'startFlow': config.startFlow(navigate); break;
        case 'setThemeMode': setMode(action.value); break;
        case 'setSegment': setSegment(action.value); break;
      }
    }
  }, [config, navigate, setMode, setSegment]);

  return (
    <>
      <HamburgerButton
        open={sidebarOpen}
        onClick={() => setSidebarOpen((prev) => !prev)}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={section}
        onNavigate={handleNavigate}
      />

      {section !== 'home' && section !== 'project-timeline' && (
        <>
          <AIFloatingButton open={chatOpen} onClick={() => setChatOpen((v) => !v)} />
          {section === 'emulator' && (
            <RulesFloatingButton open={rulesOpen} onClick={() => setRulesOpen((v) => !v)} />
          )}
        </>
      )}
      <AIChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        section={section}
        onNavigate={handleNavigate}
        applyEmulatorActions={applyEmulatorActions}
      />
      <RulesPanel open={rulesOpen} onClose={() => setRulesOpen(false)} />

      <AnimatePresence mode="wait">
        {section === 'home' && (
          <motion.div key="home" {...sectionTransition} style={{ position: 'absolute', inset: 0 }}>
            <HomePage onNavigate={handleNavigate} />
          </motion.div>
        )}
        {section === 'emulator' && (
          <motion.div key="emulator" {...sectionTransition} style={{ position: 'absolute', inset: 0 }}>
            <EmulatorSection pathname={pathname} search={search} navigate={navigate} />
          </motion.div>
        )}
        {section === 'experience-architecture' && (
          <motion.div key="experience-architecture" {...sectionTransition} style={{ position: 'absolute', inset: 0 }}>
            <ExperienceArchitecturePage onNavigate={handleNavigate} />
          </motion.div>
        )}
        {section === 'flow-management' && (
          <motion.div key="flow-management" {...sectionTransition} style={{ position: 'absolute', inset: 0 }}>
            <PlaceholderPage
              icon={GitBranch}
              title="Flow Management"
              subtitle="Version control, active experiments, and advanced admin tools will be available here soon."
            />
          </motion.div>
        )}
        {section === 'project-timeline' && (
          <motion.div key="project-timeline" {...sectionTransition} style={{ position: 'absolute', inset: 0 }}>
            <ProjectTimelinePage />
          </motion.div>
        )}
        {section === 'glossary' && (
          <motion.div key="glossary" {...sectionTransition} style={{ position: 'absolute', inset: 0 }}>
            <GlossaryPage />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Emulator Section (existing SplitScreen logic) ---------- */

const localeFadeVariants = {
  enter: { opacity: 0, scale: 0.985 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.985 },
};
const localeFadeTransition = { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as number[] };

function EmulatorSection({
  pathname,
  search,
  navigate,
}: {
  pathname: string;
  search: string;
  navigate: (url: string) => void;
}) {
  const isolatedRoute = parseIsolatedRoute(pathname, search);
  const direction: Direction = 'forward';

  const resolved = isolatedRoute ? resolveScreenType(isolatedRoute.screen) : 'placeholder';
  const currentScreen: ScreenType = resolved;

  const locale: Locale = isolatedRoute
    ? parseProtoLocale(isolatedRoute.lang)
    : 'pt-BR';

  const [prevScreen, setPrevScreen] = useState(currentScreen);
  const isLocaleSwitch = prevScreen === currentScreen;
  if (prevScreen !== currentScreen) {
    setPrevScreen(currentScreen);
  }

  const { prototypeRefreshKey } = useEmulatorConfig();
  const [lastSimData, setLastSimData] = useState<SummaryDynamicData | undefined>(undefined);

  const handleCloseOfferHub = () => {
    navigate('/emulator');
  };

  const variantParam = new URLSearchParams(search).get('variant') ?? 'default';
  const motionKey = `${currentScreen}-${locale}-${variantParam}-${prototypeRefreshKey}`;

  function pick(screen: string) {
    if (isLocaleSwitch) {
      return { variants: localeFadeVariants, transition: localeFadeTransition, custom: undefined };
    }
    const p = getTransitionProps(screen, direction);
    return { variants: p.variants, transition: p.transition, custom: direction };
  }

  return (
    <PrototypeNavigationProvider navigate={navigate}>
      <SplitScreen>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {currentScreen === 'offerHub' ? (
            <motion.div
              key={motionKey}
              custom={pick('offerHub').custom}
              variants={pick('offerHub').variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pick('offerHub').transition}
              className="absolute inset-0 flex flex-col"
              style={{ background: 'var(--proto-bg, transparent)' }}
            >
              <OfferHubScreen locale={locale} onClose={handleCloseOfferHub} variant={new URLSearchParams(search).get('variant') ?? undefined} />
            </motion.div>
          ) : currentScreen === 'suggested' ? (
            <motion.div
              key={motionKey}
              custom={pick('suggested').custom}
              variants={pick('suggested').variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pick('suggested').transition}
              className="absolute inset-0 flex flex-col"
              style={{ background: 'var(--proto-bg, transparent)' }}
            >
              <SuggestedConditionsScreen locale={locale} onBack={() => navigate('/emulator')} />
            </motion.div>
          ) : currentScreen === 'simulation' ? (
            <motion.div
              key={motionKey}
              custom={pick('simulation').custom}
              variants={pick('simulation').variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pick('simulation').transition}
              className="absolute inset-0 flex flex-col"
              style={{ background: 'var(--proto-bg, transparent)' }}
            >
              <SimulationScreen locale={locale} onBack={() => navigate('/emulator')} variant={new URLSearchParams(search).get('variant') ?? undefined} onContinue={(result) => {
                setLastSimData({
                  installments: result.installments,
                  monthlyPayment: result.monthlyPayment,
                  total: result.total,
                  savings: result.savings,
                  downpayment: result.downpayment ?? 0,
                  totalInterest: result.totalInterest ?? 0,
                  effectiveRate: result.effectiveRate ?? 0,
                });
                navigate('/emulator');
              }} />
            </motion.div>
          ) : currentScreen === 'summary' ? (
            <motion.div
              key={motionKey}
              custom={pick('summary').custom}
              variants={pick('summary').variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pick('summary').transition}
              className="absolute inset-0 flex flex-col"
              style={{ background: 'var(--proto-bg, transparent)' }}
            >
              <SummaryScreen locale={locale} onBack={() => navigate('/emulator')} dynamicData={lastSimData} />
            </motion.div>
          ) : currentScreen === 'inputValue' ? (
            <motion.div
              key={motionKey}
              custom={pick('inputValue').custom}
              variants={pick('inputValue').variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pick('inputValue').transition}
              className="absolute inset-0 flex flex-col"
              style={{ background: 'var(--proto-bg, transparent)' }}
            >
              <InputValueScreen locale={locale} onBack={() => navigate('/emulator')} variant={new URLSearchParams(search).get('variant') ?? undefined} />
            </motion.div>
          ) : currentScreen === 'dueDate' ? (
            <motion.div
              key={motionKey}
              custom={pick('dueDate').custom}
              variants={pick('dueDate').variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pick('dueDate').transition}
              className="absolute inset-0 flex flex-col"
              style={{ background: 'var(--proto-bg, transparent)' }}
            >
              <DueDateScreen
                locale={locale}
                onBack={() => navigate('/emulator')}
                onContinue={() => navigate('/emulator')}
                variant={(new URLSearchParams(search).get('variant') ?? undefined) as DueDateVariant | undefined}
                dynamicData={lastSimData ? {
                  installments: lastSimData.installments,
                  monthlyPayment: lastSimData.monthlyPayment,
                  savings: lastSimData.savings,
                  total: lastSimData.total,
                  downpayment: lastSimData.downpayment,
                } : undefined}
              />
            </motion.div>
          ) : currentScreen === 'terms' ? (
            <motion.div
              key={motionKey}
              custom={pick('terms').custom}
              variants={pick('terms').variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pick('terms').transition}
              className="absolute inset-0 flex flex-col"
              style={{ background: 'var(--proto-bg, transparent)' }}
            >
              <TermsScreen locale={locale} onBack={() => navigate('/emulator')} onConfirm={() => navigate('/emulator')} />
            </motion.div>
          ) : currentScreen === 'eligibility' ? (
            <motion.div
              key={motionKey}
              custom={pick('eligibility').custom}
              variants={pick('eligibility').variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pick('eligibility').transition}
              className="absolute inset-0 flex flex-col"
              style={{ background: 'var(--proto-bg, transparent)' }}
            >
              <EligibilityScreen locale={locale} onClose={() => navigate('/emulator')} onSelectFixed={() => navigate('/emulator')} onSelectFlexible={() => navigate('/emulator')} />
            </motion.div>
          ) : (
            <motion.div
              key={motionKey}
              custom={undefined}
              variants={transitionPresets.fade.variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transitionPresets.fade.transition}
              className="absolute inset-0 bg-white flex flex-col"
            >
              <IdleScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </SplitScreen>
    </PrototypeNavigationProvider>
  );
}

function IdleScreen() {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '0 40px',
        textAlign: 'center',
        background: isLight ? '#fff' : palette.background,
        transition: 'background 0.3s ease',
      }}
    >
      <motion.div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 260 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.15 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: palette.accentSubtle,
            transition: 'background 0.3s ease',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </motion.div>

        <div>
          <h2 style={{
            fontSize: 20, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.3px',
            color: palette.textPrimary, margin: 0, transition: 'color 0.3s ease',
          }}>
            Ready to preview
          </h2>
          <p style={{
            fontSize: 13, lineHeight: 1.5, color: palette.textSecondary, margin: '8px 0 0', transition: 'color 0.3s ease',
          }}>
            Configure a Use Case and hit Start Flow, or pick a Screen Template to preview.
          </p>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          borderRadius: 9999, background: palette.accentSubtle, transition: 'background 0.3s ease',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: palette.accent }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: palette.accent, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            Idle
          </span>
        </div>
      </motion.div>
    </div>
  );
}
