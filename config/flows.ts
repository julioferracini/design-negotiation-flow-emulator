import type { Locale } from '../i18n';
import type { TransitionPresetName } from '../transitions/presets';

export type FlowStep = {
  screen: string;
  transition?: TransitionPresetName;
};

export type Flow = {
  id: string;
  name: string;
  description: string;
  locale: Locale;
  /** Which use case from config/useCases.ts powers this flow's data */
  useCaseId: string;
  steps: FlowStep[];
};

/**
 * Define your experiment flows here.
 *
 * Each flow is a named sequence of screens the user will walk through.
 * Switch the ACTIVE_FLOW_ID to run a different experiment.
 */
export const FLOWS: Record<string, Flow> = {
  defaultPT: {
    id: 'defaultPT',
    name: 'Default Flow (Portuguese)',
    description: 'Standard debt resolution flow in Portuguese.',
    locale: 'pt-BR',
    useCaseId: 'debtResolutionBR',
    steps: [
      { screen: 'start', transition: 'none' },
      { screen: 'suggestedConditions', transition: 'fade' },
      { screen: 'installmentList', transition: 'pushIn' },
    ],
  },

  defaultEN: {
    id: 'defaultEN',
    name: 'Default Flow (English)',
    description: 'Standard debt resolution flow in English.',
    locale: 'en-US',
    useCaseId: 'debtResolutionUS',
    steps: [
      { screen: 'start', transition: 'none' },
      { screen: 'suggestedConditions', transition: 'fade' },
      { screen: 'installmentList', transition: 'pushIn' },
    ],
  },

  experimentSlide: {
    id: 'experimentSlide',
    name: 'Slide Experiment (Spanish)',
    description: 'Tests slideLeft transitions instead of fade for screen navigation.',
    locale: 'es-MX',
    useCaseId: 'debtResolutionMX',
    steps: [
      { screen: 'start', transition: 'none' },
      { screen: 'suggestedConditions', transition: 'slideLeft' },
      { screen: 'installmentList', transition: 'slideUp' },
    ],
  },
};

/**
 * Change this value to switch the active experiment flow.
 * The App reads this to determine which screens and transitions to use.
 */
export const ACTIVE_FLOW_ID = 'defaultPT';

export function getActiveFlow(): Flow {
  return FLOWS[ACTIVE_FLOW_ID] ?? FLOWS.defaultPT;
}

export function getFlowById(id: string): Flow | undefined {
  return FLOWS[id];
}
