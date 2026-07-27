import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL_KEY = '@dentalai/apiUrl';
const CONFIDENCE_KEY = '@dentalai/confidenceThreshold';

// Native has no sane default clinician-facing endpoint — leave it unconfigured
// rather than shipping someone's personal LAN IP. Web gets a best-effort
// local-dev convenience default that's still overridable in Settings.
function getDefaultApiUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:5000/predict`;
  }
  return '';
}

export function useSettings() {
  const [apiUrl, setApiUrlState] = useState(getDefaultApiUrl());
  const [confidenceThreshold, setConfidenceThresholdState] = useState(85);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedApiUrl, storedThreshold] = await Promise.all([
          AsyncStorage.getItem(API_URL_KEY),
          AsyncStorage.getItem(CONFIDENCE_KEY),
        ]);
        if (storedApiUrl !== null) setApiUrlState(storedApiUrl);
        if (storedThreshold !== null) {
          const parsed = Number(storedThreshold);
          if (!Number.isNaN(parsed)) setConfidenceThresholdState(parsed);
        }
      } catch (e) {
        console.warn('Failed to load settings from storage:', e.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setApiUrl = useCallback((value) => {
    setApiUrlState(value);
    AsyncStorage.setItem(API_URL_KEY, value).catch((e) => console.warn('Failed to persist apiUrl:', e.message));
  }, []);

  const setConfidenceThreshold = useCallback((value) => {
    setConfidenceThresholdState(value);
    AsyncStorage.setItem(CONFIDENCE_KEY, String(value)).catch((e) => console.warn('Failed to persist confidenceThreshold:', e.message));
  }, []);

  return { apiUrl, setApiUrl, confidenceThreshold, setConfidenceThreshold, loaded };
}
