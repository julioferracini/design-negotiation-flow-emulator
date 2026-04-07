/**
 * App — Web entry point with platform-level routing.
 *
 * Top-level routes:
 *   /                              -> Home (hero + feature blocks)
 *   /emulator                      -> SplitScreen emulator (ParameterPanel + Prototype)
 *   /emulator/{pl}/{uc}/{screen}   -> Deep prototype routes
 *   /analytics                     -> Placeholder
 *   /flow-management               -> Placeholder
 *   /glossary                      -> Placeholder
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SplitScreen from './components/layout/SplitScreen';
import Sidebar, { type SectionId } from './components/layout/Sidebar';
import HamburgerButton from './components/layout/HamburgerButton';
import { getTransitionProps, transitionPresets, type Direction } from './transitions';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PrototypeNavigationProvider } from './context/PrototypeNavigationContext';
import { usePrototypeLocation } from './hooks/usePrototypeLocation';
import { parseProtoLocale } from './lib/protoLocale';
import OfferHubScreen from './screens/OfferHubScreen';
import SuggestedConditionsScreen from './screens/SuggestedConditionsScreen';
import SimulationScreen from './screens/SimulationScreen';
import SummaryScreen from './screens/SummaryScreen';
import InstallmentValueScreen from './screens/InstallmentValueScreen';
import HomePage from './screens/HomePage';
import PlaceholderPage from './screens/PlaceholderPage';
import { BarChart3, GitBranch, BookOpen } from 'lucide-react';
import type { Locale } from '../../i18n/types';

type ScreenType = 'placeholder' | 'offerHub' | 'suggested' | 'simulation' | 'summary' | 'installmentValue';

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
  if (normalized === 'installment-value') return 'installmentValue';
  return 'placeholder';
}

function resolveSection(pathname: string): SectionId {
  const first = pathname.split('/').filter(Boolean)[0];
  if (first === 'emulator') return 'emulator';
  if (first === 'analytics') return 'analytics';
  if (first === 'flow-management') return 'flow-management';
  if (first === 'glossary') return 'glossary';
  return 'home';
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell() {
  const { pathname, search, navigate } = usePrototypeLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const section = resolveSection(pathname);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

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

      {section === 'home' && (
        <HomePage onNavigate={handleNavigate} />
      )}
      {section === 'emulator' && (
        <EmulatorSection pathname={pathname} search={search} navigate={navigate} />
      )}
      {section === 'analytics' && (
        <PlaceholderPage
          icon={BarChart3}
          title="Analytics"
          subtitle="Product performance dashboards and experiment tracking are being built. Stay tuned for real-time insights."
        />
      )}
      {section === 'flow-management' && (
        <PlaceholderPage
          icon={GitBranch}
          title="Flow Management"
          subtitle="Version control, active experiments, and advanced admin tools will be available here soon."
        />
      )}
      {section === 'glossary' && (
        <PlaceholderPage
          icon={BookOpen}
          title="Glossary"
          subtitle="A comprehensive reference of business terms, domain definitions, and regulatory concepts is on its way."
        />
      )}
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

  const prevScreenRef = useRef(currentScreen);
  const isLocaleSwitch = prevScreenRef.current === currentScreen;
  useEffect(() => { prevScreenRef.current = currentScreen; });

  const handleCloseOfferHub = () => {
    navigate('/emulator');
  };

  const motionKey = `${currentScreen}-${locale}`;

  function pick(screen: string) {
    if (isLocaleSwitch) {
      return { variants: localeFadeVariants, transition: localeFadeTransition, custom: undefined };
    }
    const p = getTransitionProps(screen, direction);
    return { variants: p.variants, transition: p.transition, custom: direction };
  }

  return (
    <PrototypeNavigationProvider navigate={navigate}>
      <SplitScreen onGoHome={() => navigate('/')}>
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
              <OfferHubScreen locale={locale} onClose={handleCloseOfferHub} />
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
              <SimulationScreen locale={locale} onBack={() => navigate('/emulator')} />
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
              <SummaryScreen locale={locale} onBack={() => navigate('/emulator')} />
            </motion.div>
          ) : currentScreen === 'installmentValue' ? (
            <motion.div
              key={motionKey}
              custom={pick('installmentValue').custom}
              variants={pick('installmentValue').variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pick('installmentValue').transition}
              className="absolute inset-0 flex flex-col"
              style={{ background: 'var(--proto-bg, transparent)' }}
            >
              <InstallmentValueScreen locale={locale} onBack={() => navigate('/emulator')} />
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
