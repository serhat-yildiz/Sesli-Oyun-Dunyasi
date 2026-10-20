'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSettings } from './SettingsContext';

type Politeness = 'polite' | 'assertive';

interface AnnouncerContextType {
  announce: (text: string, politeness?: Politeness) => void;
  clear: () => void;
  politeMessage: string;
  assertiveMessage: string;
}

const AnnouncerContext = createContext<AnnouncerContextType | undefined>(undefined);

export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [politeMessage, setPoliteMessage] = useState<string>('');
  const [assertiveMessage, setAssertiveMessage] = useState<string>('');

  const announce = useCallback((text: string, politeness: Politeness = 'polite') => {
    // 1. Ekran okuyucular için aria-live güncellemesi
    if (politeness === 'assertive') {
      setAssertiveMessage('');
      setTimeout(() => {
        setAssertiveMessage(text);
      }, 50);
    } else {
      setPoliteMessage('');
      setTimeout(() => {
        setPoliteMessage(text);
      }, 50);
    }

    // 2. Ekran okuyucusu açık olmayan kullanıcılar için Dahili Sesli Okuyucu (TTS)
    if (settings.ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Önceki cümleyi kes
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        utterance.rate = settings.speechRate || 1.0;
        utterance.volume = Math.max(0, Math.min(1, settings.volume / 100));

        // Türkçe ses varsa seç
        const voices = window.speechSynthesis.getVoices();
        const trVoice = voices.find(v => v.lang.startsWith('tr'));
        if (trVoice) {
          utterance.voice = trVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Dahili TTS okunamadı:', e);
      }
    }
  }, [settings.ttsEnabled, settings.speechRate, settings.volume]);

  const clear = useCallback(() => {
    setPoliteMessage('');
    setAssertiveMessage('');
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce, clear, politeMessage, assertiveMessage }}>
      {children}
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer() {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error('useAnnouncer, AnnouncerProvider içinde kullanılmalıdır.');
  }
  return context;
}
