'use client';

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useSettings } from './SettingsContext';

interface AudioContextType {
  isInitialized: boolean;
  isPlaying: boolean;
  initAudio: () => Promise<boolean>;
  stopAudio: () => void;
  playToneFeedback: (frequency?: number, durationMs?: number) => void;
  audioCtxRef: React.MutableRefObject<AudioContext | null>;
  masterGainRef: React.MutableRefObject<GainNode | null>;
}

const AudioServiceContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Ses seviyesi değiştiğinde masterGain düğümünü güncelle
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const normalizedVolume = Math.max(0, Math.min(100, settings.volume)) / 100;
      masterGainRef.current.gain.setTargetAtTime(
        normalizedVolume,
        audioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [settings.volume]);

  /**
   * Web Audio API asla otomatik çalmaz.
   * Kullanıcı butona bastığında çağrılır.
   */
  const initAudio = useCallback(async (): Promise<boolean> => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          console.warn('Web Audio API bu tarayıcıda desteklenmiyor.');
          return false;
        }

        const ctx = new AudioContextClass();
        const gainNode = ctx.createGain();
        const normalizedVolume = Math.max(0, Math.min(100, settings.volume)) / 100;
        gainNode.gain.setValueAtTime(normalizedVolume, ctx.currentTime);
        gainNode.connect(ctx.destination);

        audioCtxRef.current = ctx;
        masterGainRef.current = gainNode;
      }

      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      setIsInitialized(true);
      setIsPlaying(true);
      return true;
    } catch (err) {
      console.error('AudioContext başlatılamadı:', err);
      return false;
    }
  }, [settings.volume]);

  const stopAudio = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend();
    }
    setIsPlaying(false);
  }, []);

  /**
   * Örnek erişilebilir sesli geri bildirim (kısa bip/ton - ekran okuyucu sesini ezmez)
   */
  const playToneFeedback = useCallback((frequency = 440, durationMs = 120) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      noteGain.gain.setValueAtTime(0.3, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(noteGain);
      noteGain.connect(masterGainRef.current);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn('Ton çalınamadı:', e);
    }
  }, []);

  return (
    <AudioServiceContext.Provider
      value={{
        isInitialized,
        isPlaying,
        initAudio,
        stopAudio,
        playToneFeedback,
        audioCtxRef,
        masterGainRef,
      }}
    >
      {children}
    </AudioServiceContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioServiceContext);
  if (!context) {
    throw new Error('useAudio, AudioProvider içinde kullanılmalıdır.');
  }
  return context;
}
