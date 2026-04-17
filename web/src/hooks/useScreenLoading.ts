import { useState, useEffect } from 'react';
import { useEmulatorConfig } from '../context/EmulatorConfigContext';

const MIN_VISIBLE_MS = 400;

export function useScreenLoading(overrideMs?: number) {
  const { simulatedLatencyMs } = useEmulatorConfig();
  const delay = Math.max(MIN_VISIBLE_MS, overrideMs ?? simulatedLatencyMs);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return { loading };
}
