'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useAnnouncer } from '@/context/AnnouncerContext';
import { DarkCorridorSoundEngine } from './darkCorridorAudio';
import {
  LABYRINTH_MAP,
  INITIAL_PLAYER_POS,
  INITIAL_KEYS,
  INITIAL_MONSTER_POS,
  Position,
  Direction,
  KeyItem,
  getNextPosition,
  rotateDirection,
  getDirectionTurkish,
  calculateRelativeSoundAngle,
} from './darkCorridorLogic';

export default function DarkCorridorGame() {
  const { isPlaying, initAudio, stopAudio, audioCtxRef, masterGainRef } = useAudio();
  const { announce } = useAnnouncer();

  // Oyun Durumları
  const [gameState, setGameState] = useState<'idle' | 'running' | 'paused' | 'won' | 'lost'>('idle');
  const [playerPos, setPlayerPos] = useState<Position>(INITIAL_PLAYER_POS);
  const [playerDir, setPlayerDir] = useState<Direction>('north');
  const [keys, setKeys] = useState<KeyItem[]>(INITIAL_KEYS);
  const [monsterPos, setMonsterPos] = useState<Position>(INITIAL_MONSTER_POS);
  const [isCrouched, setIsCrouched] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('Karanlık Dehliz. Başlamak için butona basın.');

  const soundEngineRef = useRef<DarkCorridorSoundEngine | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const monsterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ses motorunu hazırla
  useEffect(() => {
    if (audioCtxRef.current && masterGainRef.current && !soundEngineRef.current) {
      soundEngineRef.current = new DarkCorridorSoundEngine(
        audioCtxRef.current,
        masterGainRef.current
      );
    }
  }, [audioCtxRef, masterGainRef]);

  // Canavarın devriye mantığı
  useEffect(() => {
    if (gameState !== 'running') {
      if (monsterTimerRef.current) clearInterval(monsterTimerRef.current);
      soundEngineRef.current?.stopHeartbeat();
      return;
    }

    monsterTimerRef.current = setInterval(() => {
      setMonsterPos((currentMonsterPos) => {
        // Canavar oyuncuya doğru 1 kare yaklaşmaya çalışır
        const dx = playerPos.x - currentMonsterPos.x;
        const dy = playerPos.y - currentMonsterPos.y;

        const nextX = currentMonsterPos.x + (dx !== 0 ? Math.sign(dx) : 0);
        const nextY = currentMonsterPos.y + (dy !== 0 ? Math.sign(dy) : 0);

        let finalX = currentMonsterPos.x;
        let finalY = currentMonsterPos.y;

        // Duvara çarpmıyorsa ilerle
        if (LABYRINTH_MAP[currentMonsterPos.y]?.[nextX] === 0) {
          finalX = nextX;
        } else if (LABYRINTH_MAP[nextY]?.[currentMonsterPos.x] === 0) {
          finalY = nextY;
        }

        const newPos = { x: finalX, y: finalY };
        const { pan, distance, relativeSide } = calculateRelativeSoundAngle(playerPos, playerDir, newPos);

        // Canavarın sesini ve oyuncunun kalp atışını güncelle
        if (soundEngineRef.current) {
          soundEngineRef.current.playMonsterSound(pan, distance);
          if (distance <= 1.5) {
            soundEngineRef.current.startHeartbeat('high');
          } else if (distance <= 3) {
            soundEngineRef.current.startHeartbeat('medium');
          } else {
            soundEngineRef.current.startHeartbeat('low');
          }
        }

        // Oyuncuyla aynı kareye gelirse kontrol et
        if (newPos.x === playerPos.x && newPos.y === playerPos.y) {
          if (!isCrouched) {
            // Yakalandı!
            setGameState('lost');
            soundEngineRef.current?.playJumpscareLoss();
            soundEngineRef.current?.stopHeartbeat();
            announce('Varlık seni yakaladı! Soğuk nefesini ensende hissettin. Yenildin! Tekrar denemek için Boşluk tuşuna bas.', 'assertive');
          } else {
            announce('Varlık tam yanından geçti fakat nefesini tuttuğun için seni fark etmedi!', 'assertive');
          }
        } else if (distance <= 2) {
          announce(`Dikkat! Hırıltı çok yakınında, ${relativeSide}!`, 'polite');
        }

        return newPos;
      });
    }, 4500); // Her 4.5 saniyede bir canavar hamle yapar

    return () => {
      if (monsterTimerRef.current) clearInterval(monsterTimerRef.current);
    };
  }, [gameState, playerPos, playerDir, isCrouched, announce]);

  // Çevre Raporu (R tuşu)
  const reportSurroundings = useCallback(() => {
    const uncollectedKeys = keys.filter(k => !k.collected);
    const facing = getDirectionTurkish(playerDir);

    let keyInfo = '';
    if (uncollectedKeys.length > 0) {
      // En yakın anahtarı bul
      const nearest = uncollectedKeys.map(k => ({
        key: k,
        ...calculateRelativeSoundAngle(playerPos, playerDir, { x: k.x, y: k.y })
      })).sort((a, b) => a.distance - b.distance)[0];

      keyInfo = `En yakın anahtar ${nearest.relativeSide}, yaklaşık ${Math.round(nearest.distance)} adım mesafede.`;
      soundEngineRef.current?.playKeyPing(nearest.pan, nearest.distance);
    } else {
      const exitPos = { x: 3, y: 0 };
      const exitSound = calculateRelativeSoundAngle(playerPos, playerDir, exitPos);
      keyInfo = `Tüm anahtarlar toplandı! Demir çıkış kapısı ${exitSound.relativeSide}!`;
    }

    const { relativeSide: monsterSide, distance: mDist } = calculateRelativeSoundAngle(playerPos, playerDir, monsterPos);

    const report = `Yüzün ${facing} yönüne dönük. Kalan anahtar sayısı: ${uncollectedKeys.length}. ${keyInfo} Varlığın hırıltısı ${monsterSide} duyuluyor.`;
    setLastAnnouncement(report);
    announce(report, 'assertive');
  }, [keys, playerPos, playerDir, monsterPos, announce]);

  // Adım Atma
  const handleMove = useCallback((step: 'forward' | 'backward') => {
    const moveDir = step === 'forward' ? playerDir : rotateDirection(rotateDirection(playerDir, 'right'), 'right');
    const targetPos = getNextPosition(playerPos, moveDir);

    const targetTile = LABYRINTH_MAP[targetPos.y]?.[targetPos.x];

    if (targetTile === 1 || targetTile === undefined) {
      // Duvar
      soundEngineRef.current?.playFootstep(true);
      const msg = step === 'forward' ? 'Önünde soğuk taş duvar var, ilerleyemezsin.' : 'Arkanda duvar var.';
      setLastAnnouncement(msg);
      announce(msg, 'polite');
      return;
    }

    if (targetTile === 2) {
      // Çıkış kapısı
      const uncollected = keys.filter(k => !k.collected).length;
      if (uncollected > 0) {
        soundEngineRef.current?.playFootstep(true);
        const msg = `Demir çıkış kapısındasın fakat kilitli! Açmak için ${uncollected} anahtara daha ihtiyacın var.`;
        setLastAnnouncement(msg);
        announce(msg, 'assertive');
        return;
      } else {
        // KAZANDI!
        setGameState('won');
        soundEngineRef.current?.playVictorySound();
        soundEngineRef.current?.stopHeartbeat();
        const winMsg = 'Tebrikler! 3 bronz anahtarla devasa demir kapıyı açtın ve temiz havaya, gün ışığına kavuştun! Kazandın!';
        setLastAnnouncement(winMsg);
        announce(winMsg, 'assertive');
        return;
      }
    }

    // Normal boş koridor
    soundEngineRef.current?.playFootstep(false);
    setPlayerPos(targetPos);

    // Anahtar var mı kontrol et
    const foundKey = keys.find(k => !k.collected && k.x === targetPos.x && k.y === targetPos.y);
    if (foundKey) {
      soundEngineRef.current?.playKeyPing(0, 0);
      const msg = 'Ayağına sert bir cisim çarptı! Yerde bronz bir anahtar var. Almak için Boşluk tuşuna bas.';
      setLastAnnouncement(msg);
      announce(msg, 'assertive');
    } else {
      // En yakın anahtara göre ping çal
      const uncollected = keys.filter(k => !k.collected);
      if (uncollected.length > 0) {
        const nearest = uncollected.map(k => ({
          key: k,
          ...calculateRelativeSoundAngle(targetPos, playerDir, { x: k.x, y: k.y })
        })).sort((a, b) => a.distance - b.distance)[0];

        soundEngineRef.current?.playKeyPing(nearest.pan, nearest.distance);
      }
    }
  }, [playerDir, playerPos, keys, announce]);

  // Dönüş Yapma
  const handleTurn = useCallback((turn: 'left' | 'right') => {
    const nextDir = rotateDirection(playerDir, turn);
    setPlayerDir(nextDir);
    soundEngineRef.current?.playTurn(turn);
    const msg = `${turn === 'left' ? 'Sola' : 'Sağa'} döndün. Artık yüzün ${getDirectionTurkish(nextDir)} tarafına bakıyor.`;
    setLastAnnouncement(msg);
    announce(msg, 'polite');

    // Dönüş sonrası en yakın anahtarın stereo yönünü çınlat
    const uncollected = keys.filter(k => !k.collected);
    if (uncollected.length > 0) {
      const nearest = uncollected.map(k => ({
        key: k,
        ...calculateRelativeSoundAngle(playerPos, nextDir, { x: k.x, y: k.y })
      })).sort((a, b) => a.distance - b.distance)[0];
      soundEngineRef.current?.playKeyPing(nearest.pan, nearest.distance);
    }
  }, [playerDir, playerPos, keys, announce]);

  // Etkileşim (Boşluk)
  const handleInteract = useCallback(() => {
    // Bulunduğumuz karede anahtar var mı?
    const keyIndex = keys.findIndex(k => !k.collected && k.x === playerPos.x && k.y === playerPos.y);
    if (keyIndex !== -1) {
      const updatedKeys = [...keys];
      updatedKeys[keyIndex].collected = true;
      setKeys(updatedKeys);

      soundEngineRef.current?.playKeyCollected();
      const remaining = updatedKeys.filter(k => !k.collected).length;
      const msg = `Bronz anahtarı cebine attın! Kalan anahtar sayısı: ${remaining}.`;
      setLastAnnouncement(msg);
      announce(msg, 'assertive');
      return;
    }

    // Önümüzdeki kare kapı mı?
    const forwardPos = getNextPosition(playerPos, playerDir);
    if (LABYRINTH_MAP[forwardPos.y]?.[forwardPos.x] === 2) {
      const remaining = keys.filter(k => !k.collected).length;
      if (remaining === 0) {
        handleMove('forward');
      } else {
        const msg = `Demir kapıyı yokladın. 3 kilit yuvası var, ${remaining} anahtar eksik!`;
        setLastAnnouncement(msg);
        announce(msg, 'assertive');
      }
      return;
    }

    const emptyMsg = 'Burada etkileşime geçilecek bir nesne yok.';
    setLastAnnouncement(emptyMsg);
    announce(emptyMsg, 'polite');
  }, [keys, playerPos, playerDir, handleMove, announce]);

  // Oyunu Başlat
  const handleStartGame = async () => {
    const success = await initAudio();
    if (success) {
      if (audioCtxRef.current && masterGainRef.current) {
        soundEngineRef.current = new DarkCorridorSoundEngine(
          audioCtxRef.current,
          masterGainRef.current
        );
      }
      setGameState('running');
      setPlayerPos(INITIAL_PLAYER_POS);
      setPlayerDir('north');
      setKeys(INITIAL_KEYS.map(k => ({ ...k, collected: false })));
      setMonsterPos(INITIAL_MONSTER_POS);
      setIsCrouched(false);

      soundEngineRef.current?.startHeartbeat('low');
      const startMsg = 'Karanlık Koridor başladı! Zifiri karanlıktasın. 3 bronz anahtarı bulup çıkış kapısına ulaşmalısın. İlerlemek için W, dönmek için A ve D tuşlarını kullan. Çevre raporu için R tuşuna bas.';
      setLastAnnouncement(startMsg);
      announce(startMsg, 'assertive');

      setTimeout(() => {
        gameContainerRef.current?.focus();
      }, 100);
    }
  };

  // Klavye Dinleyicisi
  useEffect(() => {
    if (gameState !== 'running') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape ile Duraklat
      if (e.key === 'Escape') {
        e.preventDefault();
        setGameState('paused');
        soundEngineRef.current?.stopHeartbeat();
        announce('Oyun duraklatıldı. Devam etmek için Escape tuşuna veya Devam Et düğmesine basın.', 'assertive');
        return;
      }

      // Tuş kontrolleri
      const keyUpper = e.key.toUpperCase();

      if (['W', 'ARROWUP'].includes(keyUpper)) {
        e.preventDefault();
        handleMove('forward');
      } else if (['S', 'ARROWDOWN'].includes(keyUpper)) {
        e.preventDefault();
        handleMove('backward');
      } else if (['A', 'ARROWLEFT'].includes(keyUpper)) {
        e.preventDefault();
        handleTurn('left');
      } else if (['D', 'ARROWRIGHT'].includes(keyUpper)) {
        e.preventDefault();
        handleTurn('right');
      } else if (keyUpper === 'C') {
        e.preventDefault();
        setIsCrouched(prev => {
          const nextVal = !prev;
          soundEngineRef.current?.playHoldBreath();
          announce(nextVal ? 'Çömelerek nefesini tuttun, sessizleşti.' : 'Ayağa kalktın.', 'polite');
          return nextVal;
        });
      } else if (e.key === ' ') {
        e.preventDefault();
        handleInteract();
      } else if (keyUpper === 'R') {
        e.preventDefault();
        reportSurroundings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, handleMove, handleTurn, handleInteract, reportSurroundings, announce]);

  const remainingKeys = keys.filter(k => !k.collected).length;

  return (
    <section
      aria-label="Karanlık Koridor Oyun Sahnesi"
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
          <h2 style={{ margin: 0 }}>Oyun Kontrol Sahnesi</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Toplanan Anahtar: {3 - remainingKeys} / 3 | Bakış Yönü: {getDirectionTurkish(playerDir)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {gameState === 'idle' || gameState === 'won' || gameState === 'lost' ? (
            <button
              type="button"
              onClick={handleStartGame}
              className="btn btn-primary"
              aria-label="Karanlık Koridor oyununu ve 3D ses motorunu başlat"
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
                    soundEngineRef.current?.stopHeartbeat();
                    announce('Oyun duraklatıldı.', 'assertive');
                  } else {
                    setGameState('running');
                    soundEngineRef.current?.startHeartbeat('medium');
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
                onClick={reportSurroundings}
                className="btn btn-secondary"
                aria-label="Çevre seslerini dinle ve yön durum raporu al (Kısayol R)"
              >
                👂 Çevre Raporu (R)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGameState('idle');
                  stopAudio();
                  soundEngineRef.current?.cleanup();
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

      {/* Oyun Alanı Odak Kutusu */}
      <div
        ref={gameContainerRef}
        tabIndex={gameState === 'running' ? 0 : -1}
        role="region"
        aria-label="Karanlık Koridor İnteraktif Oyun Alanı"
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
          backgroundColor: gameState === 'running' ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
        }}
      >
        {gameState === 'running' && (
          <div>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              🎮 Oyun Aktif — Kulaklıklarınızı Dinleyin
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
              <p style={{ color: 'var(--primary-accent)', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                {lastAnnouncement}
              </p>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
              İleri: <kbd className="key-badge">W</kbd> | Dönüş: <kbd className="key-badge">A</kbd> / <kbd className="key-badge">D</kbd> | Anahtar Al: <kbd className="key-badge">Boşluk</kbd> | Çömel/Nefes Tut: <kbd className="key-badge">C</kbd> | Rapor: <kbd className="key-badge">R</kbd>
            </p>
          </div>
        )}

        {gameState === 'paused' && (
          <div>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fde047', marginBottom: '0.5rem' }}>
              ⏸ Oyun Duraklatıldı
            </p>
            <p>Devam etmek için <kbd className="key-badge">Escape</kbd> tuşuna veya yukarıdaki &ldquo;Devam Et&rdquo; düğmesine basın.</p>
          </div>
        )}

        {gameState === 'won' && (
          <div>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginBottom: '0.5rem' }}>
              🏆 Tebrikler, Kurtuldun!
            </p>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              Karanlık dehlizlerin tüm sırlarını çözdün, 3 bronz anahtarla demir kapıyı açtın ve yüzeye çıkmayı başardın!
            </p>
            <button type="button" onClick={handleStartGame} className="btn btn-primary">
              Tekrar Oyna
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171', marginBottom: '0.5rem' }}>
              💀 Yakalandın!
            </p>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              Varlık sesini duydu ve seni karanlığın içine çekti. Pes etme, kulaklarını daha dikkatli dinleyip tekrar dene!
            </p>
            <button type="button" onClick={handleStartGame} className="btn btn-primary">
              Tekrar Dene
            </button>
          </div>
        )}

        {gameState === 'idle' && (
          <div>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              🎧 <strong>Karanlık Koridor: Zihnin Yankıları</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Oyun alanı hazır. Başlamak için yukarıdaki <strong>&ldquo;Oyunu Başlat&rdquo;</strong> düğmesine basın veya klavyenizle alana odaklanın.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
