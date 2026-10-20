'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserSettings {
  volume: number; // 0 ile 100 arası
  speechRate: number; // 0.5 ile 2.0 arası
  difficulty: 'kolay' | 'orta' | 'zor';
  highContrast: boolean;
  largeText: boolean;
  ttsEnabled: boolean; // Ekran okuyucu kapalı olanlar için dahili sesli okuyucu
}

const DEFAULT_SETTINGS: UserSettings = {
  volume: 80,
  speechRate: 1.0,
  difficulty: 'orta',
  highContrast: false,
  largeText: false,
  ttsEnabled: true, // Test ve ekran okuyucusuz kullanıcılar için varsayılan açık
};

const STORAGE_KEY = 'oyun_platformu_ayarlar';

interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch (e) {
      console.warn('Ayarlar yüklenemedi, varsayılanlar kullanılacak.', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // HTML kök öğesine yüksek kontrast ve büyük metin sınıflarını/özniteliklerini uygula
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const root = document.documentElement;
      if (settings.highContrast) {
        root.setAttribute('data-high-contrast', 'true');
      } else {
        root.removeAttribute('data-high-contrast');
      }

      if (settings.largeText) {
        root.setAttribute('data-large-text', 'true');
      } else {
        root.removeAttribute('data-large-text');
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Ayarlar yerel depolamaya yazılamadı.', e);
    }
  }, [settings, isLoaded]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings, SettingsProvider içinde kullanılmalıdır.');
  }
  return context;
}
