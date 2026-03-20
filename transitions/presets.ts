import { Dimensions } from 'react-native';

const { height: SH } = Dimensions.get('window');

export type TransitionPresetName =
  | 'none'
  | 'fade'
  | 'slideLeft'
  | 'slideUp'
  | 'pushIn';

type InterpolationConfig = {
  inputRange: number[];
  outputRange: number[] | string[];
};

export type TransitionConfig = {
  enterDuration: number;
  exitDuration: number;
  background: {
    scale: InterpolationConfig;
    translateY: InterpolationConfig;
    translateX: InterpolationConfig;
    opacity: InterpolationConfig;
    borderRadius: number;
  };
  foreground: {
    translateY: InterpolationConfig;
    translateX: InterpolationConfig;
    opacity: InterpolationConfig;
  };
};

export const PRESETS: Record<TransitionPresetName, TransitionConfig> = {
  none: {
    enterDuration: 0,
    exitDuration: 0,
    background: {
      scale: { inputRange: [0, 1], outputRange: [1, 1] },
      translateY: { inputRange: [0, 1], outputRange: [0, 0] },
      translateX: { inputRange: [0, 1], outputRange: [0, 0] },
      opacity: { inputRange: [0, 1], outputRange: [1, 1] },
      borderRadius: 0,
    },
    foreground: {
      translateY: { inputRange: [0, 1], outputRange: [0, 0] },
      translateX: { inputRange: [0, 1], outputRange: [0, 0] },
      opacity: { inputRange: [0, 1], outputRange: [0, 1] },
    },
  },

  fade: {
    enterDuration: 320,
    exitDuration: 260,
    background: {
      scale: { inputRange: [0, 1], outputRange: [1, 0.94] },
      translateY: { inputRange: [0, 1], outputRange: [0, 0] },
      translateX: { inputRange: [0, 1], outputRange: [0, 0] },
      opacity: { inputRange: [0, 1], outputRange: [1, 0.5] },
      borderRadius: 12,
    },
    foreground: {
      translateY: { inputRange: [0, 1], outputRange: [0, 0] },
      translateX: { inputRange: [0, 1], outputRange: [0, 0] },
      opacity: { inputRange: [0, 1], outputRange: [0, 1] },
    },
  },

  slideLeft: {
    enterDuration: 340,
    exitDuration: 280,
    background: {
      scale: { inputRange: [0, 1], outputRange: [1, 0.94] },
      translateY: { inputRange: [0, 1], outputRange: [0, 0] },
      translateX: { inputRange: [0, 1], outputRange: [0, -80] },
      opacity: { inputRange: [0, 1], outputRange: [1, 0.6] },
      borderRadius: 12,
    },
    foreground: {
      translateY: { inputRange: [0, 1], outputRange: [0, 0] },
      translateX: { inputRange: [0, 1], outputRange: [400, 0] },
      opacity: { inputRange: [0, 1], outputRange: [0.6, 1] },
    },
  },

  slideUp: {
    enterDuration: 380,
    exitDuration: 300,
    background: {
      scale: { inputRange: [0, 1], outputRange: [1, 0.94] },
      translateY: { inputRange: [0, 1], outputRange: [0, -20] },
      translateX: { inputRange: [0, 1], outputRange: [0, 0] },
      opacity: { inputRange: [0, 1], outputRange: [1, 0.5] },
      borderRadius: 12,
    },
    foreground: {
      translateY: { inputRange: [0, 1], outputRange: [SH, 0] },
      translateX: { inputRange: [0, 1], outputRange: [0, 0] },
      opacity: { inputRange: [0, 1], outputRange: [0.8, 1] },
    },
  },

  pushIn: {
    enterDuration: 380,
    exitDuration: 300,
    background: {
      scale: { inputRange: [0, 1], outputRange: [1, 0.92] },
      translateY: { inputRange: [0, 1], outputRange: [0, -24] },
      translateX: { inputRange: [0, 1], outputRange: [0, 0] },
      opacity: { inputRange: [0, 1], outputRange: [1, 0.4] },
      borderRadius: 16,
    },
    foreground: {
      translateY: { inputRange: [0, 1], outputRange: [SH, 0] },
      translateX: { inputRange: [0, 1], outputRange: [0, 0] },
      opacity: { inputRange: [0, 1], outputRange: [1, 1] },
    },
  },
};
