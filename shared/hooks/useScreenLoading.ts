import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useEmulatorConfig } from '../../config/EmulatorConfigContext';

const MIN_VISIBLE_MS = 400;

export function useScreenLoading(overrideMs?: number) {
  const { simulatedLatencyMs } = useEmulatorConfig();
  const delay = Math.max(MIN_VISIBLE_MS, overrideMs ?? simulatedLatencyMs);

  const [loading, setLoading] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity]);

  return { loading, contentOpacity: opacity };
}
