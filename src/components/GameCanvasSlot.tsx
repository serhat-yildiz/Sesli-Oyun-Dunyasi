'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GameDefinition } from '@/games/types';
import { useAudio } from '@/context/AudioContext';
import { useAnnouncer } from '@/context/AnnouncerContext';

interface GameCanvasSlotProps {
  game: GameDefinition;
}

export default function GameCanvasSlot({ game }: GameCanvasSlotProps) {
  const { isPlaying, initAudio, stopAudio, playToneFeedback } = useAudio();
  const { announce } = useAnnouncer();
  const [isPaused, setIsPaused] = useState(false);
  const [lastAction, setLastAction] = useState<string>('Oyun başlatılmayı bekliyor.');
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Klavye olaylarını dinle (Oyun içi tuşlar ve Escape çıkış/duraklatma)
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape ile duraklat / devam ettir
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsPaused(prev => {
          const nextState = !prev;
          if (nextState) {
            announce('Oyun duraklatıldı. Devam etmek için tekrar Escape tuşuna basın veya Çıkış düğmesini kullanın.', 'assertive');
            playToneFeedback(300, 200);
          } else {
            announce('Oyun devam ediyor.', 'assertive');
            playToneFeedback(600, 200);
          }
          return nextState;
        });
        return;
      }

      // Duraklatılmışsa oyun içi tuşları işleme
      if (isPaused) return;

      // Belirli oyun tuşlarını simüle et ve ekran okuyucuya veya ses motoruna bildir
      const upperKey = e.key.toUpperCase();
      let recognizedAction = '';

      if (['W', 'ARROWUP'].includes(upperKey)) {
        recognizedAction = 'İleri adım atıldı';
        playToneFeedback(523.25, 80); // C5
      } else if (['S', 'ARROWDOWN'].includes(upperKey)) {
        recognizedAction = 'Geri adım atıldı';
        playToneFeedback(392.00, 80); // G4
      } else if (['A', 'ARROWLEFT'].includes(upperKey)) {
        recognizedAction = 'Sola dönüldü';
        playToneFeedback(440.00, 80); // A4
      } else if (['D', 'ARROWRIGHT'].includes(upperKey)) {
        recognizedAction = 'Sağa dönüldü';
        playToneFeedback(493.88, 80); // B4
      } else if (e.key === ' ') {
        e.preventDefault();
        recognizedAction = 'Etkileşim gerçekleştirildi (Kapı/Eşya)';
        playToneFeedback(659.25, 120); // E5
      }

      if (recognizedAction) {
        setLastAction(recognizedAction);
        announce(recognizedAction, 'polite');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, isPaused, announce, playToneFeedback]);

  const handleStartGame = async () => {
    const success = await initAudio();
    if (success) {
      setIsPaused(false);
      setLastAction('Oyun oturumu başladı. Kulaklıklarınızı dinleyin.');
      announce(`${game.title} oyunu başlatıldı! Ses motoru devrede. Duraklatmak veya çıkmak için Escape tuşuna basabilirsiniz.`, 'assertive');
      playToneFeedback(587.33, 200);

      // Klavyeyi doğrudan oyun alanına odakla
      setTimeout(() => {
        gameAreaRef.current?.focus();
      }, 100);
    } else {
      announce('Ses motoru başlatılamadı. Lütfen tarayıcınızın ses izinlerini kontrol edin.', 'assertive');
    }
  };

  const handleStopGame = () => {
    stopAudio();
    setIsPaused(false);
    setLastAction('Oyun sonlandırıldı.');
    announce('Oyun durduruldu ve ses oturumu kapatıldı.', 'polite');
  };

  return (
    <section
      aria-label={`${game.title} Oyun Alanı`}
      style={{
        marginTop: '2rem',
        padding: '1.5rem',
        border: '3px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Oyun Kontrolü ve Çalışma Alanı</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!isPlaying ? (
            <button
              type="button"
              onClick={handleStartGame}
              className="btn btn-primary"
              aria-label={`${game.title} oyununu ve ses motorunu başlat`}
            >
              ▶ Oyunu Başlat
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsPaused(p => !p)}
                className="btn btn-secondary"
                aria-pressed={isPaused}
              >
                {isPaused ? '▶ Devam Et' : '⏸ Duraklat (Escape)'}
              </button>
              <button
                type="button"
                onClick={handleStopGame}
                className="btn btn-secondary"
                style={{ borderColor: '#ef4444' }}
              >
                ⏹ Oyundan Çık
              </button>
            </>
          )}
        </div>
      </div>

      {/* Oyun Alanı Yuvası - Odaklanabilir İnteraktif Yuva */}
      <div
        ref={gameAreaRef}
        tabIndex={isPlaying ? 0 : -1}
        role="region"
        aria-label={`${game.title} etkileşimli oyun sahnesi`}
        aria-live="polite"
        style={{
          minHeight: '220px',
          border: '2px dashed var(--border-color)',
          borderRadius: 'var(--border-radius)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: isPlaying ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
          position: 'relative',
        }}
      >
        {isPlaying ? (
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              {isPaused ? '⏸ Oyun Duraklatıldı' : '🎮 Oyun Aktif — Girişler Dinleniyor'}
            </p>
            <p style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>
              Son Durum / Eylem: {lastAction}
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              Tuşlara basarak (W, A, S, D, Ok Tuşları, Boşluk) sesli geri bildirimi test edebilirsiniz.
              Çıkmak veya duraklatmak için <kbd className="key-badge">Escape</kbd> tuşuna basın.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              [Oyun Bileşen Yuvası: {game.componentId || 'GenelOyunBileseni'}]
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Oyun motoru beklemede. Başlamak için yukarıdaki <strong>&ldquo;Oyunu Başlat&rdquo;</strong> düğmesine basın.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Tarayıcı politikaları ve ekran okuyucu uyumu gereği ses otomatik olarak başlatılmaz.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
