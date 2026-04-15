import { transitionPresets, type Direction, type TransitionType } from './presets';

export { transitionPresets, type Direction, type TransitionType };

export function getTransitionProps(screen: string, direction: Direction) {
  const presetName = getScreenTransition(screen);
  const preset = transitionPresets[presetName];

  return {
    key: screen,
    custom: preset.usesDirection ? direction : undefined,
    variants: preset.variants,
    initial: 'enter' as const,
    animate: 'center' as const,
    exit: 'exit' as const,
    transition: preset.transition,
  };
}

function getScreenTransition(screen: string): TransitionType {
  const map: Record<string, TransitionType> = {
    flowSelector: 'fade',
    languageSelector: 'fade',
    offerHub: 'slide',
    inputValue: 'slide',
    simulation: 'slide',
    suggested: 'slide',
    dueDate: 'slide',
    summary: 'slide',
    terms: 'slide',
    pin: 'fade',
    loading: 'fade',
    feedback: 'fade',
    flowConfig: 'slide',
  };
  return map[screen] ?? 'slide';
}
