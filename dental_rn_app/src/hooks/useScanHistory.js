import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import * as scanService from '../services/scanService';

export function useScanHistory() {
  const [scanHistory, setScanHistory] = useState([]);
  const [loadingScans, setLoadingScans] = useState(false);

  const loadScanHistory = useCallback(async () => {
    try {
      setLoadingScans(true);
      const { user } = await authService.getCurrentUser();
      const { data, error } = await scanService.getScansByUser(user?.id || null);
      if (!error && data) {
        setScanHistory(data);
      }
    } catch (e) {
      console.warn('Error fetching scan history:', e.message);
    } finally {
      setLoadingScans(false);
    }
  }, []);

  useEffect(() => {
    loadScanHistory();
  }, [loadScanHistory]);

  return { scanHistory, loadingScans, loadScanHistory };
}
