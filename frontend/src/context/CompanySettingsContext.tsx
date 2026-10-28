import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface CompanySettings {
  companyName: string;
  companyLogo: string | null; // base64 data URL or null
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
}

interface CompanySettingsContextType {
  settings: CompanySettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultSettings: CompanySettings = {
  companyName: 'Enterprise HRMS Portal',
  companyLogo: null,
  workStartTime: '09:00',
  workEndTime: '18:00',
  gracePeriodMinutes: 15,
};

const CompanySettingsContext = createContext<CompanySettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refresh: async () => {},
});

export const CompanySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success && res.data.data) {
        const d = res.data.data;
        setSettings({
          companyName: d.companyName || defaultSettings.companyName,
          companyLogo: d.companyLogo || null,
          workStartTime: d.workStartTime || defaultSettings.workStartTime,
          workEndTime: d.workEndTime || defaultSettings.workEndTime,
          gracePeriodMinutes: d.gracePeriodMinutes ?? defaultSettings.gracePeriodMinutes,
        });
      }
    } catch {
      // silently fall back to defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <CompanySettingsContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
      {children}
    </CompanySettingsContext.Provider>
  );
};

export const useCompanySettings = () => useContext(CompanySettingsContext);
