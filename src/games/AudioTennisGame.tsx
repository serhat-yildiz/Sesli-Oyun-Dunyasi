'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useAnnouncer } from '@/context/AnnouncerContext';
import { AudioTennisAudioEngine } from './audioTennisAudio';
import { INITIAL_TENNIS_STATE, TennisMatchState, evaluateTiming } from './audioTennisLogic';

export default function AudioTennisGame() {
  const { initAudio, stopAudio, audioCtxRef, masterGainRef } = useAudio();
  const { announce } = useAnnouncer();

  const [gameState, setGameState] = useState<'idle' | 'serving' | 'rally' | 'paused' | 'won' | 'lost'>('idle');
  const [match, setMatch] = useState<TennisMatchState>(INITIAL_TENNIS_STATE);
  const [lastAnnouncement, setLastAnnouncement] = useState('Akustik Tenis Kortu. Başlamak için butona basın.');

  const engineRef = useRef<AudioTennisAudioEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Top animasyon ve zamanlama referansları
  const ballStartTimeRef = useRef<number>(0);
  const ballDurationRef = useRef<number>(1600);
  const ballDirectionRef = useRef<'towards_player' | 'towards_opponent'>('towards_player');
  const ballActiveRef = useRef<boolean>(false);
  const bounceScheduledRef = useRef<boolean>(false);

  // Ses motorunu hazırla
  useEffect(() => {
    if (audioCtxRef.current && masterGainRef.current && !engineRef.current) {
      engineRef.current = new AudioTennisAudioEngine(
        audioCtxRef.current,
        masterGainRef.current
      );
    }
  }, [audioCtxRef, masterGainRef]);

  // Yeni Servis Başlat
  const serveBall = useCallback((server: 'player' | 'opponent' = 'opponent') => {
    ballActiveRef.current = true;
    bounceScheduledRef.current = false;
    ballStartTimeRef.current = performance.now();
    ballDurationRef.current = match.ballSpeedMs;

    if (server === 'opponent') {
      ballDirectionRef.current = 'towards_player';
      engineRef.current?.playHit(-0.9, true, 'opponent');
      setLastAnnouncement('Rakip servis attı! Top sol kulaktan sana doğru yaklaşıyor.');
      announce('Rakip servis attı! Dinle.', 'polite');
    } else {
      ballDirectionRef.current = 'towards_opponent';
      engineRef.current?.playHit(0.9, true, 'good');
      setLastAnnouncement('Servisi attın! Top rakibe doğru gidiyor.');
      announce('Servisi attın!', 'polite');
    }

    setGameState('rally');
  }, [match.ballSpeedMs, announce]);

  // Oyun Döngüsü (Topun hareketi ve kaçırılma kontrolü)
  useEffect(() => {
    if (gameState !== 'rally') return;

    let animId: number;

    const loop = (now: number) => {
      if (!ballActiveRef.current) return;

      const elapsed = now - ballStartTimeRef.current;
      const progress = elapsed / ballDurationRef.current;

      // 1. Masa Sekmesi (Progress %45 civarında masada seker)
      if (progress >= 0.45 && !bounceScheduledRef.current) {
        bounceScheduledRef.current = true;
        const bouncePan = ballDirectionRef.current === 'towards_player' ? -0.1 : 0.1;
        engineRef.current?.playHit(bouncePan, false, 'good');
      }

      // 2. Oyuncuya Doğru Geliyorsa ve Kaçırıldıysa
      if (ballDirectionRef.current === 'towards_player') {
        if (progress > 1.25) {
          // Top kaçırıldı! Duvara çarptı
          ballActiveRef.current = false;
          engineRef.current?.playWallHit();
          engineRef.current?.playPointScored(false);

          const nextOppScore = match.opponentScore + 1;
          const isGameOver = nextOppScore >= match.targetScore;

          if (isGameOver) {
            setGameState('lost');
            const msg = `Sayı rakibin! Maçı rakip ${nextOppScore} - ${match.playerScore} kazandı. Yeniden oynamak için butona bas.`;
            setLastAnnouncement(msg);
            announce(msg, 'assertive');
          } else {
            const msg = `Kaçırdın! Sayı rakibin. Skor: Sen ${match.playerScore}, Rakip ${nextOppScore}.`;
            setLastAnnouncement(msg);
            announce(msg, 'assertive');
            setTimeout(() => {
              serveBall('opponent');
            }, 1800);
          }

          setMatch((prev) => ({
            ...prev,
            opponentScore: nextOppScore,
            rallyCount: 0,
            ballSpeedMs: 1600, // Hızı sıfırla
          }));
          return;
        }
      }

      // 3. Rakibe Doğru Gidiyorsa (Rakip vuruş simülasyonu)
      if (ballDirectionRef.current === 'towards_opponent') {
        if (progress >= 1.0) {
          // Rakip karşılar (küçük bir şansla rakip de kaçırabilir)
          const opponentMissChance = match.rallyCount > 6 ? 0.35 : 0.12;
          if (Math.random() < opponentMissChance) {
            // Rakip kaçırdı! Oyuncu sayı aldı
            ballActiveRef.current = false;
            engineRef.current?.playWallHit();
            engineRef.current?.playPointScored(true);

            const nextPlayerScore = match.playerScore + 1;
            const isGameOver = nextPlayerScore >= match.targetScore;

            if (isGameOver) {
              setGameState('won');
              engineRef.current?.playMatchWon();
              const winMsg = `Muazzam! Maç Sayısı! Rakibi ${nextPlayerScore} - ${match.opponentScore} mağlup ettin! Tebrikler!`;
              setLastAnnouncement(winMsg);
              announce(winMsg, 'assertive');
            } else {
              const msg = `Harika vuruş, rakip yetişemedi! Sayı senin! Skor: Sen ${nextPlayerScore}, Rakip ${match.opponentScore}.`;
              setLastAnnouncement(msg);
              announce(msg, 'assertive');
              setTimeout(() => {
                serveBall('player');
              }, 1800);
            }

            setMatch((prev) => ({
              ...prev,
              playerScore: nextPlayerScore,
              rallyCount: 0,
              ballSpeedMs: 1600,
            }));
            return;
          } else {
            // Rakip vurdu, top geri dönüyor
            ballStartTimeRef.current = performance.now();
            ballDirectionRef.current = 'towards_player';
            bounceScheduledRef.current = false;
            engineRef.current?.playHit(-0.85, true, 'opponent');
            setLastAnnouncement('Rakip sert karşıladı! Top sana doğru hızla geliyor!');
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, match.rallyCount, serveBall, announce]);

  // Oyuncunun Vuruş Yapması
  const handlePlayerHit = useCallback((type: 'straight' | 'left' | 'right' = 'straight') => {
    if (gameState !== 'rally' || !ballActiveRef.current) {
      engineRef.current?.playWhiff();
      announce('Boşa salladın, top henüz gelmedi!', 'polite');
      return;
    }

    if (ballDirectionRef.current !== 'towards_player') {
      return; // Top zaten rakibe doğru gidiyor
    }

    const elapsed = performance.now() - ballStartTimeRef.current;
    const progress = elapsed / ballDurationRef.current;
    const timing = evaluateTiming(progress);

    if (timing === 'too_early') {
      engineRef.current?.playWhiff();
      announce('Çok erken salladın!', 'polite');
      return;
    }

    if (timing === 'good' || timing === 'perfect') {
      // Başarılı vuruş! Top rakibe geri dönüyor
      const isPerfect = timing === 'perfect';
      const hitPan = type === 'left' ? 0.4 : type === 'right' ? 0.95 : 0.7;
      engineRef.current?.playHit(hitPan, true, isPerfect ? 'perfect' : 'good');

      ballDirectionRef.current = 'towards_opponent';
      ballStartTimeRef.current = performance.now();
      bounceScheduledRef.current = false;

      // Hızı kademeli olarak artır (Ralli temposu)
      const newSpeed = Math.max(800, ballDurationRef.current - (isPerfect ? 140 : 80));
      ballDurationRef.current = newSpeed;

      const nextRally = match.rallyCount + 1;
      const msg = isPerfect
        ? `MÜKEMMEL ŞUT! Ralli: ${nextRally}! Top fırtına gibi rakibe gidiyor.`
        : `İyi vuruş! Ralli: ${nextRally}.`;
      setLastAnnouncement(msg);
      announce(msg, 'polite');

      setMatch((prev) => ({
        ...prev,
        rallyCount: nextRally,
        ballSpeedMs: newSpeed,
      }));
    } else {
      // Geç vuruş / kaçırma
      engineRef.current?.playWhiff();
      announce('Geç kaldın!', 'polite');
    }
  }, [gameState, announce]);

  // Skor ve Durum Raporu (P tuşu)
  const reportScore = useCallback(() => {
    const report = `Mevcut Skor: Sen ${match.playerScore}, Rakip ${match.opponentScore}. Mevcut ralli: ${match.rallyCount}. Hedef puan: ${match.targetScore}. Vurmak için Boşluk tuşuna bas.`;
    setLastAnnouncement(report);
    announce(report, 'assertive');
  }, [match, announce]);

  // Oyunu Başlat
  const handleStartGame = async () => {
    const success = await initAudio();
    if (success) {
      if (audioCtxRef.current && masterGainRef.current) {
        engineRef.current = new AudioTennisAudioEngine(
          audioCtxRef.current,
          masterGainRef.current
        );
      }

      setMatch(INITIAL_TENNIS_STATE);
      const startMsg = 'Akustik Tenis Maçı Başladı! 5 puana ilk ulaşan kazanır. Sol kulaktan gelen top masada sekip sağ kulağına yaklaştığında Boşluk tuşu ile raket vur! Skor için P tuşuna bas.';
      setLastAnnouncement(startMsg);
      announce(startMsg, 'assertive');

      setTimeout(() => {
        containerRef.current?.focus();
        serveBall('opponent');
      }, 1000);
    }
  };

  // Klavye Dinleyicisi
  useEffect(() => {
    if (gameState !== 'rally') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setGameState('paused');
        ballActiveRef.current = false;
        announce('Oyun duraklatıldı.', 'assertive');
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        handlePlayerHit('straight');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePlayerHit('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePlayerHit('right');
      } else if (e.key.toUpperCase() === 'P' || e.key.toUpperCase() === 'R') {
        e.preventDefault();
        reportScore();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, handlePlayerHit, reportScore, announce]);

  return (
    <section
      aria-label="Akustik Tenis Oyun Sahnesi"
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
          <h2 style={{ margin: 0 }}>Akustik Ses Kortu</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Skor: Sen {match.playerScore} - {match.opponentScore} Rakip | Ralli: {match.rallyCount}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {gameState === 'idle' || gameState === 'won' || gameState === 'lost' ? (
            <button
              type="button"
              onClick={handleStartGame}
              className="btn btn-primary"
              aria-label="Akustik Tenis maçını ve 3D stereo kortu başlat"
            >
              ▶ {gameState === 'idle' ? 'Maçı Başlat' : 'Yeni Maç Oyna'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (gameState === 'rally') {
                    setGameState('paused');
                    ballActiveRef.current = false;
                    announce('Oyun duraklatıldı.', 'assertive');
                  } else {
                    setGameState('rally');
                    serveBall('opponent');
                    announce('Maç devam ediyor.', 'assertive');
                  }
                }}
                className="btn btn-secondary"
                aria-pressed={gameState === 'paused'}
              >
                {gameState === 'paused' ? '▶ Devam Et' : '⏸ Duraklat (Escape)'}
              </button>
              <button
                type="button"
                onClick={reportScore}
                className="btn btn-secondary"
                aria-label="Skor ve ralli durumunu seslendir (Kısayol P)"
              >
                📊 Skor Raporu (P)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGameState('idle');
                  ballActiveRef.current = false;
                  stopAudio();
                  announce('Maçtan çıkıldı.', 'polite');
                }}
                className="btn btn-secondary"
                style={{ borderColor: '#ef4444' }}
              >
                ⏹ Maçı Bitir
              </button>
            </>
          )}
        </div>
      </div>

      {/* İnteraktif Oyun Kortu */}
      <div
        ref={containerRef}
        tabIndex={gameState === 'rally' ? 0 : -1}
        role="region"
        aria-label="Akustik Tenis İnteraktif Kort Alanı"
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
          backgroundColor: gameState === 'rally' ? 'rgba(234, 179, 8, 0.05)' : 'transparent',
        }}
      >
        {gameState === 'rally' && (
          <div>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              🎾 Maç Aktif — Topun Yaklaşmasını Dinleyin!
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
              <p style={{ color: '#fde047', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                {lastAnnouncement}
              </p>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
              Düz Vuruş: <kbd className="key-badge">Boşluk (Space)</kbd> | Sol Köşe: <kbd className="key-badge">Sol Ok</kbd> | Sağ Köşe: <kbd className="key-badge">Sağ Ok</kbd> | Skor: <kbd className="key-badge">P</kbd>
            </p>
          </div>
        )}

        {gameState === 'paused' && (
          <div>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fde047', marginBottom: '0.5rem' }}>
              ⏸ Maç Duraklatıldı
            </p>
            <p>Devam etmek için <kbd className="key-badge">Escape</kbd> tuşuna veya yukarıdaki &ldquo;Devam Et&rdquo; düğmesine basın.</p>
          </div>
        )}

        {gameState === 'won' && (
          <div>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginBottom: '0.5rem' }}>
              🏆 Tebrikler, Maçı Sen Kazandın!
            </p>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              Olağanüstü refleksler! 5 puana ilk sen ulaştın ve şampiyonluk kupasını kaldırdın!
            </p>
            <button type="button" onClick={handleStartGame} className="btn btn-primary">
              Yeni Maç Başlat
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171', marginBottom: '0.5rem' }}>
              🎾 Maçı Rakip Kazandı!
            </p>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              Çok çekişmeli bir mücadeleydi! Zamanlamana biraz daha odaklanıp tekrar dene.
            </p>
            <button type="button" onClick={handleStartGame} className="btn btn-primary">
              Tekrar Oyna
            </button>
          </div>
        )}

        {gameState === 'idle' && (
          <div>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              🏓 <strong>Akustik Tenis: Ses Kortu</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Kulaklığınızı takın ve <strong>&ldquo;Maçı Başlat&rdquo;</strong> düğmesine basın.
              Sol kulaktan atılan top masada sekip sağ kulağınıza ulaştığında tam zamanında <kbd className="key-badge">Boşluk</kbd> tuşuna basın!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
