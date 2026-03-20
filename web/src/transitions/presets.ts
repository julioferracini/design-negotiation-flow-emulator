/**
 * Screen Transition Presets — Web (motion/react)
 *
 * Mirrors the Expo transition presets using Framer Motion's API.
 */

import type { Variants, Transition } from 'motion/react';

export type Direction = 'forward' | 'backward';

export interface TransitionPreset {
  variants: Variants;
  transition: Transition;
  usesDirection?: boolean;
}

const slideVariants: Variants = {
  enter: (direction: Direction) => ({
    x: direction === 'forward' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: Direction) => ({
    x: direction === 'forward' ? '-100%' : '100%',
    opacity: 0,
  }),
};

const slideTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const fadeTransition: Transition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1],
};

const modalPresentVariants: Variants = {
  enter: { y: '100%', opacity: 0.8, scale: 0.97 },
  center: { y: 0, opacity: 1, scale: 1 },
  exit: { y: '100%', opacity: 0.5, scale: 0.97 },
};

const modalPresentTransition: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 34,
  mass: 0.85,
};

const slideUpVariants: Variants = {
  enter: { y: '100%', opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: '-30%', opacity: 0 },
};

const slideUpTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.9,
};

const noneVariants: Variants = {
  enter: { opacity: 1 },
  center: { opacity: 1 },
  exit: { opacity: 1 },
};

const noneTransition: Transition = { duration: 0 };

export const transitionPresets = {
  slide: { variants: slideVariants, transition: slideTransition, usesDirection: true },
  fade: { variants: fadeVariants, transition: fadeTransition, usesDirection: false },
  modalPresent: { variants: modalPresentVariants, transition: modalPresentTransition, usesDirection: false },
  slideUp: { variants: slideUpVariants, transition: slideUpTransition, usesDirection: false },
  none: { variants: noneVariants, transition: noneTransition, usesDirection: false },
} as const;

export type TransitionType = keyof typeof transitionPresets;
