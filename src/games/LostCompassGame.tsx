'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useAnnouncer } from '@/context/AnnouncerContext';
import { LostCompassAudioEngine } from './lostCompassAudio';
import {
  ISLAND_MAP,
  INITIAL_COMPASS_PLAYER_POS,
  INITIAL_TOTEMS,
  LIGHTHOUSE_POS,
  TotemStone,
  IslandPosition,
  getTerrainName,
} from './lostCompassLogic';
import {
  Direction,
  getNextPosition,
  rotateDirection,
  getDirectionTurkish,
  calculateRelativeSoundAngle,
} from './darkCorridorLogic';

export default function LostCompassGame() {
  const { initAudio, stopAudio, audioCtxRef, masterGainRef } = useAudio();
  const { announce } = useAnnouncer();

  const [gameState, setGameState] = useState<'idle' | 'running' | 'paused' | 'won'>('idle');
  const [playerPos, setPlayerPos] = useState<IslandPosition>(INITIAL_COMPASS_PLAYER_POS);
  const [playerDir, setPlayerDir] = useState<Direction>('north');
  const [totems, setTotems] = useState<TotemStone[]>(INITIAL_TOTEMS);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('Sisli Ada sahiline vurdun. Pusulanı eline al.');

  const audioEngineRef = useRef<LostCompassAudioEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ses motorunu hazırla
  useEffect(() => {
    if (audioCtxRef.current && masterGainRef.current && !audioEngineRef.current) {
      audioEngineRef.current = new LostCompassAudioEngine(
        audioCtxRef.current,
        masterGainRef.current
      );
    }
  }, [audioCtxRef, masterGainRef]);

  // Oyuncunun radyan cinsinden bakış açısı
  const getPlayerHeadingRad = (dir: Direction): number => {
    switch (dir) {
      case 'north':
        return -Math.PI / 2;
      case 'east':
        return 0;
      case 'south':
        return Math.PI / 2;
      case 'west':
        return Math.PI;
    }
  };

  // Akustik Pusulayı Çalıştır (P tuşu)
  const handleUseCompass = useCallback(() => {
    const uncollected = totems.filter(t => !t.collected);

    // Hedef: Henüz toplanmamış en yakın totem veya hepsi toplandıysa Deniz Feneri
    let targetPos: IslandPosition = LIGHTHOUSE_POS;
    let targetName = 'Fener Kulesi';

    if (uncollected.length > 0) {
      const nearest = uncollected.map(t => ({
        totem: t,
        ...calculateRelativeSoundAngle(playerPos, playerDir, { x: t.x, y: t.y })
      })).sort((a, b) => a.distance - b.distance)[0];

      targetPos = { x: nearest.totem.x, y: nearest.totem.y };
      targetName = nearest.totem.name;
    }

    const { pan, distance, relativeSide } = calculateRelativeSoundAngle(playerPos, playerDir, targetPos);

    // Açıyı pusula tıklamasına çevir
    const dx = targetPos.x - playerPos.x;
    const dy = targetPos.y - playerPos.y;
    const targetAngle = Math.atan2(dy, dx);
    const playerAngle = getPlayerHeadingRad(playerDir);
    let diff = Math.abs(targetAngle - playerAngle);
    while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);

    audioEngineRef.current?.playCompassClick(diff, distance);
    audioEngineRef.current?.playTotemBell(pan);

    const compassMsg = `Pusulanın manyetik iğnesi titriyor: ${targetName} ${relativeSide}, yaklaşık ${Math.round(distance)} adım uzakta.`;
    setLastAnnouncement(compassMsg);
    announce(compassMsg, 'assertive');
  }, [totems, playerPos, playerDir, announce]);

  // Çevre ve Konum Raporu (M veya R tuşu)
  const reportEnvironment = useCallback(() => {
    const tileCode = ISLAND_MAP[playerPos.y]?.[playerPos.x] || 'S';
    const terrain = getTerrainName(tileCode);
    const facing = getDirectionTurkish(playerDir);
    const remaining = totems.filter(t => !t.collected).length;

    const report = `Şu an ${terrain.name} üzerindesin. Yüzün ${facing} yönüne dönük. Bulunan totemler: ${4 - remaining} / 4. Pusulanı dinlemek için P tuşuna bas.`;
    setLastAnnouncement(report);
    announce(report, 'assertive');
  }, [playerPos, playerDir, totems, announce]);

  // Adım Atma
  const handleMove = useCallback((step: 'forward' | 'backward') => {
    const moveDir = step === 'forward' ? playerDir : rotateDirection(rotateDirection(playerDir, 'right'), 'right');
    const targetPos = getNextPosition(playerPos, moveDir);

    const tile = ISLAND_MAP[targetPos.y]?.[targetPos.x];

    if (!tile || tile === 'W') {
      // Deniz
      const msg = 'Önünde coşkun okyanus dalgaları var, daha fazla ilerleyemezsin.';
      setLastAnnouncement(msg);
      announce(msg, 'polite');
      return;
    }

    if (tile === 'C') {
      // Kayalık
      const msg = 'Yolunu aşılmaz sarp kaya blokları kesiyor.';
      setLastAnnouncement(msg);
      announce(msg, 'polite');
      return;
    }

    // Geçilebilir zemin
    const terrain = getTerrainName(tile);
    audioEngineRef.current?.playFootstep(terrain.type);
    setPlayerPos(targetPos);

    // Fener kulesine ulaşıldı mı?
    if (tile === 'L') {
      const remaining = totems.filter(t => !t.collected).length;
      if (remaining === 0) {
        setGameState('won');
        audioEngineRef.current?.playVictoryBeacon();
        const win = 'Muhteşem! 4 Kadim Totem Taşını deniz fenerinin sunağına yerleştirdin. Fenerin devasa ışığı sisi deldi ve işaret çanı çalmaya başladı! Kurtuldun!';
        setLastAnnouncement(win);
        announce(win, 'assertive');
        return;
      } else {
        const warn = `Fener Kulesi zirvesindesin fakat işaret ateşini yakmak için ${remaining} adet totem taşı daha bulmalısın!`;
        setLastAnnouncement(warn);
        announce(warn, 'assertive');
        return;
      }
    }

    // Totem karesinde miyiz?
    const onTotem = totems.find(t => !t.collected && t.x === targetPos.x && t.y === targetPos.y);
    if (onTotem) {
      audioEngineRef.current?.playTotemBell(0);
      const msg = `Yerde kadim bir parıltı var! ${onTotem.name} (${onTotem.element}) ayaklarının altında. Almak için Boşluk tuşuna bas.`;
      setLastAnnouncement(msg);
      announce(msg, 'assertive');
    } else {
      const msg = `${terrain.name} patikasında ilerledin.`;
      setLastAnnouncement(msg);
      announce(msg, 'polite');
    }
  }, [playerDir, playerPos, totems, announce]);

  // Dönüş Yapma
  const handleTurn = useCallback((turn: 'left' | 'right') => {
    const nextDir = rotateDirection(playerDir, turn);
    setPlayerDir(nextDir);

    const rad = getPlayerHeadingRad(nextDir);
    audioEngineRef.current?.updateAmbienceOrientation(rad);

    const msg = `${turn === 'left' ? 'Sola' : 'Sağa'} döndün. Artık yüzün ${getDirectionTurkish(nextDir)} yönüne bakıyor. Dalgaların ve rüzgarın yönü değişti.`;
    setLastAnnouncement(msg);
    announce(msg, 'polite');
  }, [playerDir, announce]);

  // Etkileşim (Boşluk)
  const handleInteract = useCallback(() => {
    const totemIndex = totems.findIndex(t => !t.collected && t.x === playerPos.x && t.y === playerPos.y);
    if (totemIndex !== -1) {
      const updated = [...totems];
      updated[totemIndex].collected = true;
      setTotems(updated);

      audioEngineRef.current?.playTotemCollected();
      const remaining = updated.filter(t => !t.collected).length;
      const msg = `${updated[totemIndex].name} çantanıza eklendi! Kalan totem: ${remaining}.`;
      setLastAnnouncement(msg);
      announce(msg, 'assertive');
      return;
    }

    // Fener kulesinde miyiz?
    if (ISLAND_MAP[playerPos.y]?.[playerPos.x] === 'L') {
      const remaining = totems.filter(t => !t.collected).length;
      if (remaining === 0) {
        handleMove('forward');
      } else {
        const msg = `Fener sunağında 4 taş yuvası var, ${remaining} tanesi boş.`;
        setLastAnnouncement(msg);
        announce(msg, 'assertive');
      }
      return;
    }

    const empty = 'Burada toplanacak bir totem taşı yok. Pusulayı kullanmak için P tuşuna bas.';
    setLastAnnouncement(empty);
    announce(empty, 'polite');
  }, [totems, playerPos, handleMove, announce]);

  // Oyunu Başlat
  const handleStartGame = async () => {
    const success = await initAudio();
    if (success) {
      if (audioCtxRef.current && masterGainRef.current) {
        audioEngineRef.current = new LostCompassAudioEngine(
          audioCtxRef.current,
          masterGainRef.current
        );
      }

      setGameState('running');
      setPlayerPos(INITIAL_COMPASS_PLAYER_POS);
      setPlayerDir('north');
      setTotems(INITIAL_TOTEMS.map(t => ({ ...t, collected: false })));

      const rad = getPlayerHeadingRad('north');
      audioEngineRef.current?.startAmbience(rad);

      const intro = 'Kayıp Pusula: Sisli Ada başladı! Kumsaldasın, arkanda okyanus dalgaları köpürüyor. Adadaki 4 kadim totemi bulup kuzeydeki fener kulesine ulaştır. Pusula için P, yürümek için W, dönmek için A ve D tuşlarını kullan.';
      setLastAnnouncement(intro);
      announce(intro, 'assertive');

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
        announce('Oyun duraklatıldı.', 'assertive');
        return;
      }

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
      } else if (keyUpper === 'P') {
        e.preventDefault();
        handleUseCompass();
      } else if (keyUpper === 'M' || keyUpper === 'R') {
        e.preventDefault();
        reportEnvironment();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleInteract();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, handleMove, handleTurn, handleUseCompass, reportEnvironment, handleInteract, announce]);

  const collectedCount = totems.filter(t => t.collected).length;

  return (
    <section
      aria-label="Kayıp Pusula Oyun Sahnesi"
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
          <h2 style={{ margin: 0 }}>Sisli Ada Keşif Sahnesi</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Toplanan Totemler: {collectedCount} / 4 | Yön: {getDirectionTurkish(playerDir)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {gameState === 'idle' || gameState === 'won' ? (
            <button
              type="button"
              onClick={handleStartGame}
              className="btn btn-primary"
              aria-label="Kayıp Pusula oyununu ve ada atmosferini başlat"
            >
              ▶ {gameState === 'idle' ? 'Oyunu Başlat' : 'Yeniden Keşfe Çık'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (gameState === 'running') {
                    setGameState('paused');
                    announce('Oyun duraklatıldı.', 'assertive');
                  } else {
                    setGameState('running');
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
                onClick={handleUseCompass}
                className="btn btn-secondary"
                aria-label="Pusulayı dinle ve en yakın totemin yönünü öğren (Kısayol P)"
              >
                🧭 Pusulayı Dinle (P)
              </button>
              <button
                type="button"
                onClick={reportEnvironment}
                className="btn btn-secondary"
                aria-label="Arazi ve çevre raporunu seslendir (Kısayol M veya R)"
              >
                🗺️ Çevre Raporu (M)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGameState('idle');
                  stopAudio();
                  audioEngineRef.current?.cleanup();
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
        aria-label="Kayıp Pusula İnteraktif Oyun Alanı"
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
          backgroundColor: gameState === 'running' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
        }}
      >
        {gameState === 'running' && (
          <div>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              🧭 Sisli Ada Keşfi Aktif — Doğayı Dinleyin
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
              <p style={{ color: '#34d399', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                {lastAnnouncement}
              </p>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
              İleri: <kbd className="key-badge">W</kbd> | Dönüş: <kbd className="key-badge">A</kbd> / <kbd className="key-badge">D</kbd> | Pusula: <kbd className="key-badge">P</kbd> | Totem Al: <kbd className="key-badge">Boşluk</kbd> | Rapor: <kbd className="key-badge">M</kbd>
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
              🏆 Sis Dağıldı, Kurtuldun!
            </p>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              4 kadim totemi fener kulesine dizdin. Fenerin devasa ışığı sis perdesini yardı ve uzaktaki kurtarma gemisi işaret sesini duydu!
            </p>
            <button type="button" onClick={handleStartGame} className="btn btn-primary">
              Yeniden Keşfe Çık
            </button>
          </div>
        )}

        {gameState === 'idle' && (
          <div>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              🏝️ <strong>Kayıp Pusula: Sisli Ada</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Kulaklığınızı takın ve <strong>&ldquo;Oyunu Başlat&rdquo;</strong> düğmesine basın.
              Okyanus dalgalarını arkanıza alarak pusulanızın sesini takip edin.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
