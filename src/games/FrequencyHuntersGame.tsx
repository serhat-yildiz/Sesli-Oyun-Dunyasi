'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useAnnouncer } from '@/context/AnnouncerContext';
import { FrequencyHuntersAudioEngine } from './frequencyHuntersAudio';
import { FREQUENCY_LEVELS, FrequencyLevel } from './frequencyHuntersLogic';

export default function FrequencyHuntersGame() {
  const { initAudio, stopAudio, audioCtxRef, masterGainRef } = useAudio();
  const { announce } = useAnnouncer();

  const [gameState, setGameState] = useState<'idle' | 'running' | 'paused' | 'won'>('idle');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [playerFreq, setPlayerFreq] = useState(115);
  const [lastAnnouncement, setLastAnnouncement] = useState('Akustik Kubbe frekansları karıştı. Başlamak için butona basın.');

  const engineRef = useRef<FrequencyHuntersAudioEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLevel: FrequencyLevel = FREQUENCY_LEVELS[currentLevelIndex];

  // Ses motorunu hazırla
  useEffect(() => {
    if (audioCtxRef.current && masterGainRef.current && !engineRef.current) {
      engineRef.current = new FrequencyHuntersAudioEngine(
        audioCtxRef.current,
        masterGainRef.current
      );
    }
  }, [audioCtxRef, masterGainRef]);

  // Seviye başladığında osilatörleri kur
  const startLevel = useCallback((levelIdx: number) => {
    const lvl = FREQUENCY_LEVELS[levelIdx];
    setCurrentLevelIndex(levelIdx);
    setPlayerFreq(lvl.initialFrequency);

    if (engineRef.current) {
      engineRef.current.startFrequencyTuning(lvl.targetFrequency, lvl.initialFrequency);
    }

    const msg = `Seviye ${lvl.levelNumber}: ${lvl.name}. Sol kulakta referans, sağ kulakta senin sesin çalıyor. İki ses arasındaki dalgalanmayı sıfırlamak için Yukarı ve Aşağı Ok tuşlarıyla akort et. Rapor için P tuşuna bas.`;
    setLastAnnouncement(msg);
    announce(msg, 'assertive');
  }, [announce]);

  // Frekansı Değiştir
  const changeFrequency = useCallback((delta: number) => {
    setPlayerFreq((prev) => {
      const nextFreq = Math.max(50, Math.min(1500, prev + delta));
      engineRef.current?.setPlayerFrequency(nextFreq);

      const diff = Math.abs(nextFreq - currentLevel.targetFrequency);
      let feedback = '';
      if (diff <= currentLevel.tolerance) {
        feedback = 'Mükemmel! Dalgalanma tamamen durdu, rezonans kilitlenmeye hazır! Boşluk tuşuna bas.';
      } else if (diff < 5) {
        feedback = 'Çok yakın! Dalgalanma oldukça yavaşladı.';
      } else if (nextFreq < currentLevel.targetFrequency) {
        feedback = `Frekans: ${nextFreq} Hertz. Ses pes kaldı, biraz daha tizleştirmelisin.`;
      } else {
        feedback = `Frekans: ${nextFreq} Hertz. Ses tiz kaldı, biraz daha pesleştirmelisin.`;
      }

      setLastAnnouncement(`Frekans: ${nextFreq} Hz. ${feedback}`);
      announce(feedback, 'polite');
      return nextFreq;
    });
  }, [currentLevel, announce]);

  // Frekans Analiz / İpucu Raporu (P tuşu)
  const reportFrequency = useCallback(() => {
    const diff = currentLevel.targetFrequency - playerFreq;
    let analysis = '';

    if (Math.abs(diff) <= currentLevel.tolerance) {
      analysis = 'Frekanslar birebir eşitlendi! Vuru sesi sıfırlandı. Kilitlemek için Boşluk tuşuna bas.';
    } else if (diff > 0) {
      analysis = `Mevcut frekansın ${playerFreq} Hertz. Hedef referans sesinden ${Math.round(diff)} Hertz daha pes (alçak) durumdasın. Yukarı Ok tuşuyla tizleştir.`;
    } else {
      analysis = `Mevcut frekansın ${playerFreq} Hertz. Hedef referans sesinden ${Math.round(Math.abs(diff))} Hertz daha tiz (yüksek) durumdasın. Aşağı Ok tuşuyla pesleştir.`;
    }

    setLastAnnouncement(analysis);
    announce(analysis, 'assertive');
  }, [currentLevel, playerFreq, announce]);

  // Referans Sesini Tek Başına Dinle (R tuşu)
  const listenReferenceSolo = useCallback(() => {
    engineRef.current?.playReferenceSolo(currentLevel.targetFrequency);
    const msg = `Hedef referans tonu solo olarak çalınıyor: ${currentLevel.targetFrequency} Hertz.`;
    setLastAnnouncement(msg);
    announce(msg, 'polite');
  }, [currentLevel, announce]);

  // Frekansı Onayla / Kilitle (Boşluk)
  const handleLockFrequency = useCallback(() => {
    const diff = Math.abs(playerFreq - currentLevel.targetFrequency);

    if (diff <= currentLevel.tolerance) {
      // Başarılı Kilit!
      engineRef.current?.playLockSuccess(currentLevel.targetFrequency);

      if (currentLevelIndex < FREQUENCY_LEVELS.length - 1) {
        const nextIdx = currentLevelIndex + 1;
        const successMsg = `Tebrikler! ${currentLevel.name} başarıyla kilitlendi. Bir sonraki seviyeye geçiliyor...`;
        setLastAnnouncement(successMsg);
        announce(successMsg, 'assertive');

        setTimeout(() => {
          startLevel(nextIdx);
        }, 1500);
      } else {
        // Tüm 5 Seviye Bitti!
        setGameState('won');
        engineRef.current?.playGrandVictory();
        engineRef.current?.stopTuning();
        const winMsg = 'Harika! 5 frekans modülünün tamamını mükemmel bir armoniyle eşitledin. Akustik Kubbe kurtarıldı! Kazandın!';
        setLastAnnouncement(winMsg);
        announce(winMsg, 'assertive');
      }
    } else {
      // Hatalı kilit
      engineRef.current?.playMistake();
      const errorMsg = 'Frekans henüz tam kilitlenmedi! İki ses arasında vuru titreşimi devam ediyor. Tekrar ayarla.';
      setLastAnnouncement(errorMsg);
      announce(errorMsg, 'assertive');
    }
  }, [playerFreq, currentLevel, currentLevelIndex, startLevel, announce]);

  // Oyunu Başlat
  const handleStartGame = async () => {
    const success = await initAudio();
    if (success) {
      if (audioCtxRef.current && masterGainRef.current) {
        engineRef.current = new FrequencyHuntersAudioEngine(
          audioCtxRef.current,
          masterGainRef.current
        );
      }

      setGameState('running');
      startLevel(0);

      setTimeout(() => {
        containerRef.current?.focus();
      }, 100);
    }
  };

  // Klavye Dinleyicisi
  useEffect(() => {
    if (gameState !== 'running') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setGameState('paused');
        engineRef.current?.stopTuning();
        announce('Oyun duraklatıldı.', 'assertive');
        return;
      }

      const keyUpper = e.key.toUpperCase();

      if (e.key === 'ArrowUp' || keyUpper === 'W') {
        e.preventDefault();
        changeFrequency(+5);
      } else if (e.key === 'ArrowDown' || keyUpper === 'S') {
        e.preventDefault();
        changeFrequency(-5);
      } else if (e.key === 'ArrowRight' || keyUpper === 'D') {
        e.preventDefault();
        changeFrequency(+1); // Hassas mikro ayar
      } else if (e.key === 'ArrowLeft' || keyUpper === 'A') {
        e.preventDefault();
        changeFrequency(-1); // Hassas mikro ayar
      } else if (keyUpper === 'P') {
        e.preventDefault();
        reportFrequency();
      } else if (keyUpper === 'R') {
        e.preventDefault();
        listenReferenceSolo();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleLockFrequency();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, changeFrequency, reportFrequency, listenReferenceSolo, handleLockFrequency, announce]);

  return (
    <section
      aria-label="Frekans Avcıları Oyun Sahnesi"
      style={{
        marginTop: '2rem',
        padding: '1.75rem',
        border: '3px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Akustik Frekans Laboratuvarı</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Modül: {currentLevelIndex + 1} / {FREQUENCY_LEVELS.length} ({currentLevel.name}) | Frekansınız: {playerFreq} Hz
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {gameState === 'idle' || gameState === 'won' ? (
            <button
              type="button"
              onClick={handleStartGame}
              className="btn btn-primary"
              aria-label="Frekans Avcıları oyununu ve çift kanal ses osilatörünü başlat"
            >
              ▶ {gameState === 'idle' ? 'Oyunu Başlat' : 'Yeniden Oyna'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (gameState === 'running') {
                    setGameState('paused');
                    engineRef.current?.stopTuning();
                    announce('Oyun duraklatıldı.', 'assertive');
                  } else {
                    setGameState('running');
                    engineRef.current?.startFrequencyTuning(currentLevel.targetFrequency, playerFreq);
                    announce('Oyun devam ediyor.', 'assertive');
                  }
                }}
                className="btn btn-secondary"
                aria-pressed={gameState === 'paused'}
              >
                {gameState === 'paused' ? '▶ Devam Et' : '⏸ Duraklat (Escape)'}
              </button>
              <button
                type="button"
                onClick={listenReferenceSolo}
                className="btn btn-secondary"
                aria-label="Sadece referans frekansı dinle (Kısayol R)"
              >
                🎵 Referansı Dinle (R)
              </button>
              <button
                type="button"
                onClick={reportFrequency}
                className="btn btn-secondary"
                aria-label="Frekans farkını ve ipucunu seslendir (Kısayol P)"
              >
                📊 Analiz Raporu (P)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGameState('idle');
                  stopAudio();
                  engineRef.current?.cleanup();
                  announce('Oyundan çıkıldı.', 'polite');
                }}
                className="btn btn-secondary"
                style={{ borderColor: '#ef4444' }}
              >
                ⏹ Oyunu Bitir
              </button>
            </>
          )}
        </div>
      </div>

      {/* İnteraktif Oyun Sahnesi */}
      <div
        ref={containerRef}
        tabIndex={gameState === 'running' ? 0 : -1}
        role="region"
        aria-label="Frekans Avcıları İnteraktif Akort Alanı"
        aria-live="polite"
        style={{
          minHeight: '260px',
          border: '2px dashed var(--border-color)',
          borderRadius: 'var(--border-radius)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: gameState === 'running' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        }}
      >
        {gameState === 'running' && (
          <div>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              📡 Frekans Eşitleme Aktif — Kulaklarınızı Odaklayın
            </p>
            <div
              style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '1rem',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                maxWidth: '650px',
                margin: '0 auto',
              }}
            >
              <p style={{ color: '#60a5fa', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                {lastAnnouncement}
              </p>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
              Tizleştir (+5 Hz): <kbd className="key-badge">Yukarı Ok</kbd> | Pesleştir (-5 Hz): <kbd className="key-badge">Aşağı Ok</kbd> | Hassas (+1 / -1 Hz): <kbd className="key-badge">Sağ / Sol Ok</kbd> | Kilitle: <kbd className="key-badge">Boşluk</kbd> | Analiz: <kbd className="key-badge">P</kbd>
            </p>
          </div>
        )}

        {gameState === 'paused' && (
          <div>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fde047', marginBottom: '0.5rem' }}>
              ⏸ Frekans Akordu Duraklatıldı
            </p>
            <p>Devam etmek için <kbd className="key-badge">Escape</kbd> tuşuna veya yukarıdaki &ldquo;Devam Et&rdquo; düğmesine basın.</p>
          </div>
        )}

        {gameState === 'won' && (
          <div>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginBottom: '0.5rem' }}>
              🎉 Tebrikler, Tüm Frekanslar Kilitlendi!
            </p>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              Akustik Kubbe&apos;nin 5 frekans modülünü hatasız akort ettin. Tüm ses arşivi kurtarıldı ve rezonans dengesi sağlandı!
            </p>
            <button type="button" onClick={handleStartGame} className="btn btn-primary">
              Yeniden Başlat
            </button>
          </div>
        )}

        {gameState === 'idle' && (
          <div>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              🎶 <strong>Frekans Avcıları: Akustik Rezonans</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Kulaklığınızı takın ve <strong>&ldquo;Oyunu Başlat&rdquo;</strong> düğmesine basın.
              Sol kulaktaki ses ile sağ kulaktaki ses arasındaki titreşimli dalgalanmayı sıfırlamaya çalışın.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
