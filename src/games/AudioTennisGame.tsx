'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useAnnouncer } from '@/context/AnnouncerContext';
import { AudioTennisAudioEngine } from './audioTennisAudio';
import { INITIAL_TENNIS_STATE, TennisMatchState, TennisZone, evaluateTiming } from './audioTennisLogic';

export default function AudioTennisGame() {
  const { initAudio, stopAudio, audioCtxRef, masterGainRef } = useAudio();
  const { announce } = useAnnouncer();

  const [gameState, setGameState] = useState<'idle' | 'rally' | 'paused' | 'won' | 'lost'>('idle');
  const [match, setMatch] = useState<TennisMatchState>(INITIAL_TENNIS_STATE);
  const [lastAnnouncement, setLastAnnouncement] = useState('Akustik Tenis Kortu. Başlamak için butona basın.');

  // Ref'ler ile state kapanış (closure) sorunlarını tamamen önleme
  const matchRef = useRef<TennisMatchState>(INITIAL_TENNIS_STATE);
  matchRef.current = match;

  const gameStateRef = useRef<'idle' | 'rally' | 'paused' | 'won' | 'lost'>('idle');
  gameStateRef.current = gameState;

  const engineRef = useRef<AudioTennisAudioEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Top ve yön referansları
  const ballStartTimeRef = useRef<number>(0);
  const ballDurationRef = useRef<number>(1500);
  const ballDirectionRef = useRef<'towards_player' | 'towards_opponent'>('towards_player');
  const ballActiveRef = useRef<boolean>(false);
  const bounceScheduledRef = useRef<boolean>(false);
  const incomingZoneRef = useRef<TennisZone>('center'); // 'left' | 'center' | 'right'

  // Servis timer referansı
  const serveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (gameStateRef.current !== 'rally') return;

    ballActiveRef.current = true;
    bounceScheduledRef.current = false;
    ballStartTimeRef.current = performance.now();
    ballDurationRef.current = matchRef.current.ballSpeedMs;

    // Rastgele yön seç (Sol, Orta, Sağ)
    const zones: TennisZone[] = ['left', 'center', 'right'];
    const chosenZone = zones[Math.floor(Math.random() * zones.length)];
    incomingZoneRef.current = chosenZone;

    const zonePan = chosenZone === 'left' ? -0.85 : chosenZone === 'right' ? 0.85 : 0.0;
    const zoneNameTr = chosenZone === 'left' ? 'SOL KÖŞEDEN' : chosenZone === 'right' ? 'SAĞ KÖŞEDEN' : 'ORTADAN';

    if (server === 'opponent') {
      ballDirectionRef.current = 'towards_player';
      engineRef.current?.playHit(zonePan, true, 'opponent', chosenZone);
      const msg = `Rakip servis attı! Top ${zoneNameTr} geliyor!`;
      setLastAnnouncement(msg);
      announce(msg, 'polite');
    } else {
      ballDirectionRef.current = 'towards_opponent';
      engineRef.current?.playHit(zonePan, true, 'good', chosenZone);
      const msg = `Servisi ${zoneNameTr} attın! Top rakibe gidiyor.`;
      setLastAnnouncement(msg);
      announce(msg, 'polite');
    }
  }, [announce]);

  // Sayı bittiğinde güvenli servis planlayıcı
  const scheduleNextServe = useCallback((server: 'player' | 'opponent', delayMs: number = 2000) => {
    if (serveTimeoutRef.current) clearTimeout(serveTimeoutRef.current);
    serveTimeoutRef.current = setTimeout(() => {
      if (gameStateRef.current === 'rally') {
        serveBall(server);
      }
    }, delayMs);
  }, [serveBall]);

  // Ana Animasyon / Oyun Döngüsü
  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      if (gameStateRef.current === 'rally' && ballActiveRef.current) {
        const elapsed = now - ballStartTimeRef.current;
        const progress = elapsed / ballDurationRef.current;
        const currentZone = incomingZoneRef.current;
        const zonePan = currentZone === 'left' ? -0.85 : currentZone === 'right' ? 0.85 : 0.0;

        // 1. Masa Sekmesi (%45)
        if (progress >= 0.45 && !bounceScheduledRef.current) {
          bounceScheduledRef.current = true;
          engineRef.current?.playHit(zonePan, false, 'good', currentZone);
        }

        // 2. Oyuncuya Doğru Gelirken Kaçırılma
        if (ballDirectionRef.current === 'towards_player') {
          if (progress > 1.25) {
            ballActiveRef.current = false;
            engineRef.current?.playWallHit();
            engineRef.current?.playPointScored(false);

            const nextOppScore = matchRef.current.opponentScore + 1;
            const isGameOver = nextOppScore >= matchRef.current.targetScore;

            if (isGameOver) {
              setGameState('lost');
              const msg = `Sayı rakibin! Maçı rakip ${nextOppScore} - ${matchRef.current.playerScore} kazandı. Yeniden oynamak için butona bas.`;
              setLastAnnouncement(msg);
              announce(msg, 'assertive');
            } else {
              const msg = `Topu kaçırdın! Sayı rakibin. Skor: Sen ${matchRef.current.playerScore}, Rakip ${nextOppScore}.`;
              setLastAnnouncement(msg);
              announce(msg, 'assertive');
              scheduleNextServe('opponent', 2000);
            }

            setMatch((prev) => ({
              ...prev,
              opponentScore: nextOppScore,
              rallyCount: 0,
              ballSpeedMs: 1500,
            }));
          }
        }

        // 3. Rakibe Doğru Giderken
        if (ballDirectionRef.current === 'towards_opponent') {
          if (progress >= 1.0) {
            // Rakip karşılama simülasyonu
            const opponentMissChance = matchRef.current.rallyCount > 5 ? 0.35 : 0.15;
            if (Math.random() < opponentMissChance) {
              // Rakip kaçırdı, oyuncu sayı kazandı!
              ballActiveRef.current = false;
              engineRef.current?.playWallHit();
              engineRef.current?.playPointScored(true);

              const nextPlayerScore = matchRef.current.playerScore + 1;
              const isGameOver = nextPlayerScore >= matchRef.current.targetScore;

              if (isGameOver) {
                setGameState('won');
                engineRef.current?.playMatchWon();
                const winMsg = `MUHTEŞEM! Maç Sayısı! Rakibi ${nextPlayerScore} - ${matchRef.current.opponentScore} mağlup ettin! Alkışlar senin için!`;
                setLastAnnouncement(winMsg);
                announce(winMsg, 'assertive');
              } else {
                const msg = `Müthiş vuruş! Sayı senin! Skor: Sen ${nextPlayerScore}, Rakip ${matchRef.current.opponentScore}.`;
                setLastAnnouncement(msg);
                announce(msg, 'assertive');
                scheduleNextServe('player', 2200);
              }

              setMatch((prev) => ({
                ...prev,
                playerScore: nextPlayerScore,
                rallyCount: 0,
                ballSpeedMs: 1500,
              }));
            } else {
              // Rakip karşıladı, yeni rastgele yön ile oyuncuya geri dönüyor!
              const zones: TennisZone[] = ['left', 'center', 'right'];
              const returnZone = zones[Math.floor(Math.random() * zones.length)];
              incomingZoneRef.current = returnZone;

              ballStartTimeRef.current = performance.now();
              ballDirectionRef.current = 'towards_player';
              bounceScheduledRef.current = false;

              const retPan = returnZone === 'left' ? -0.85 : returnZone === 'right' ? 0.85 : 0.0;
              engineRef.current?.playHit(retPan, true, 'opponent', returnZone);

              const retNameTr = returnZone === 'left' ? 'SOLA' : returnZone === 'right' ? 'SAĞA' : 'ORTAYA';
              const returnMsg = `Rakip sert karşıladı! Top ${retNameTr} geliyor!`;
              setLastAnnouncement(returnMsg);
              announce(returnMsg, 'polite');
            }
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (serveTimeoutRef.current) clearTimeout(serveTimeoutRef.current);
    };
  }, [announce, scheduleNextServe]);

  // Oyuncunun Vuruş Yapması ve Yön Kontrolü
  const handlePlayerHit = useCallback((playerAction: 'straight' | 'left' | 'right') => {
    if (gameStateRef.current !== 'rally' || !ballActiveRef.current) {
      engineRef.current?.playWhiff();
      announce('Top henüz gelmedi!', 'polite');
      return;
    }

    if (ballDirectionRef.current !== 'towards_player') {
      return; // Top zaten rakibe doğru gidiyor
    }

    const elapsed = performance.now() - ballStartTimeRef.current;
    const progress = elapsed / ballDurationRef.current;
    const timing = evaluateTiming(progress);

    // 1. Zamanlama Kontrolü
    if (timing === 'too_early') {
      engineRef.current?.playWhiff();
      announce('Çok erken salladın!', 'polite');
      return;
    }

    if (timing === 'miss' || timing === 'late') {
      engineRef.current?.playWhiff();
      announce('Geç kaldın!', 'polite');
      return;
    }

    // 2. YÖN DOĞRULAMA KONTROLÜ (Gelen Yöne Göre Doğru Tuş)
    // incomingZoneRef: 'left' -> Sol Ok, 'right' -> Sağ Ok, 'center' -> Boşluk (straight)
    const requiredAction =
      incomingZoneRef.current === 'left' ? 'left' : incomingZoneRef.current === 'right' ? 'right' : 'straight';

    if (playerAction !== requiredAction) {
      // YANLIŞ TUŞA BASILDI! Fileye takıldı / Dışarı gitti
      ballActiveRef.current = false;
      engineRef.current?.playNetFault();
      engineRef.current?.playPointScored(false);

      const nextOppScore = matchRef.current.opponentScore + 1;
      const isGameOver = nextOppScore >= matchRef.current.targetScore;

      const expectedText =
        incomingZoneRef.current === 'left'
          ? 'Sol Ok tuşuna basmalıydın'
          : incomingZoneRef.current === 'right'
          ? 'Sağ Ok tuşuna basmalıydın'
          : 'Boşluk tuşuna basmalıydın';

      if (isGameOver) {
        setGameState('lost');
        const msg = `Yanlış yön! ${expectedText}. Maçı rakip kazandı!`;
        setLastAnnouncement(msg);
        announce(msg, 'assertive');
      } else {
        const msg = `Hata! Top farklı yöndeydi, ${expectedText}! Sayı rakibin. Skor: Sen ${matchRef.current.playerScore}, Rakip ${nextOppScore}.`;
        setLastAnnouncement(msg);
        announce(msg, 'assertive');
        scheduleNextServe('opponent', 2200);
      }

      setMatch((prev) => ({
        ...prev,
        opponentScore: nextOppScore,
        rallyCount: 0,
        ballSpeedMs: 1500,
      }));
      return;
    }

    // 3. DOĞRU YÖN VE DOĞRU ZAMANLAMA -> Mükemmel Vuruş!
    const isPerfect = timing === 'perfect';
    engineRef.current?.playHit(0.5, true, isPerfect ? 'perfect' : 'good', incomingZoneRef.current);

    ballDirectionRef.current = 'towards_opponent';
    ballStartTimeRef.current = performance.now();
    bounceScheduledRef.current = false;

    // Hızı kademeli artır
    const newSpeed = Math.max(750, ballDurationRef.current - (isPerfect ? 130 : 70));
    ballDurationRef.current = newSpeed;

    const nextRally = matchRef.current.rallyCount + 1;
    const msg = isPerfect
      ? `DOĞRU KÖŞE VE MÜKEMMEL ŞUT! Ralli: ${nextRally}! Top fırtına gibi gidiyor!`
      : `Harika vuruş! Doğru yön! Ralli: ${nextRally}.`;
    setLastAnnouncement(msg);
    announce(msg, 'polite');

    setMatch((prev) => ({
      ...prev,
      rallyCount: nextRally,
      ballSpeedMs: newSpeed,
    }));
  }, [announce, scheduleNextServe]);

  // Skor Raporu (P tuşu)
  const reportScore = useCallback(() => {
    const report = `Mevcut Skor: Sen ${matchRef.current.playerScore}, Rakip ${matchRef.current.opponentScore}. Ralli: ${matchRef.current.rallyCount}. Hedef puan: ${matchRef.current.targetScore}.`;
    setLastAnnouncement(report);
    announce(report, 'assertive');
  }, [announce]);

  // Maçı Başlat
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
      setGameState('rally');

      const startMsg = 'Akustik Tenis Maçı Başladı! Top nereden geliyorsa oraya vur: Soldan geliyorsa Sol Ok, Sağdan geliyorsa Sağ Ok, Ortadan geliyorsa Boşluk tuşu! Yanlış tuş sayıyı kaybettirir.';
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'rally') return;

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
  }, [handlePlayerHit, reportScore, announce]);

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
          <h2 style={{ margin: 0 }}>Akustik Ses Kortu (Gelişmiş Refleks Modu)</h2>
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
              🎾 Maç Aktif — Topun Geldiği Yöne Dikkat Edin!
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
              Ortadan Geliyorsa: <kbd className="key-badge">Boşluk (Space)</kbd> | Soldan Geliyorsa: <kbd className="key-badge">Sol Ok</kbd> | Sağdan Geliyorsa: <kbd className="key-badge">Sağ Ok</kbd>
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
              🏆 Muazzam Şampiyonluk!
            </p>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              Bütün köşeleri kusursuz savundun, 5 puana ulaştın ve seyircilerin alkışları eşliğinde kupayı kaldırdın!
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
              Rakip ters köşelerle sayıları topladı. Topun sol ve sağ kulaktaki yönünü daha iyi dinleyip tekrar dene!
            </p>
            <button type="button" onClick={handleStartGame} className="btn btn-primary">
              Tekrar Oyna
            </button>
          </div>
        )}

        {gameState === 'idle' && (
          <div>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              🏓 <strong>Akustik Tenis: Gelişmiş Yön ve Refleks Kortu</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Kulaklığınızı takın ve <strong>&ldquo;Maçı Başlat&rdquo;</strong> düğmesine basın.
              Ses <strong>soldan geliyorsa Sol Ok</strong>, <strong>sağdan geliyorsa Sağ Ok</strong>, <strong>ortadan geliyorsa Boşluk</strong> tuşuna basın. Yanlış tuşa basarsanız top fileye takılır ve sayıyı kaybedersiniz!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
