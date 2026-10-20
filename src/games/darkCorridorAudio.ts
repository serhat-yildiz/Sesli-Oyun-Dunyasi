/**
 * Karanlık Koridor Ses Motoru (Dark Corridor Audio Synthesizer)
 * Harici dosya yüklemesi gerektirmeden Web Audio API osilatörleri,
 * gürültü filtreleri (noise buffer) ve stereo panner düğümleriyle
 * zengin 3D atmosfer sesleri üretir.
 */

export class DarkCorridorSoundEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(ctx: AudioContext, masterGain: GainNode) {
    this.ctx = ctx;
    this.masterGain = masterGain;
  }

  /**
   * Adım Sesi (Footstep with Echo/Reverb simulation)
   * Önü boşsa ferah bir yankı, duvara çarparsa tok bir çarpma sesi üretir.
   */
  playFootstep(hitWall: boolean = false) {
    const now = this.ctx.currentTime;

    if (hitWall) {
      // Duvara çarpma: tok, düşük frekanslı çarpma sesi
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      // Normal adım: taş zeminde topuk sesi ve hafif yankılanma
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.13);
    }
  }

  /**
   * Dönüş Hışırtısı (Turn swoosh)
   * Oyuncu sağa veya sola 90 derece döndüğünde hafif hava süzülmesi
   */
  playTurn(direction: 'left' | 'right') {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(direction === 'left' ? 320 : 260, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    if (panner) {
      panner.pan.setValueAtTime(direction === 'left' ? -0.7 : 0.7, now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      osc.connect(gain);
      gain.connect(this.masterGain);
    }

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Anahtar Parıltısı / Çınlaması (Key chime - Stereo Panned)
   * Oyuncunun anahtara olan yönü ve mesafesine göre stereo pan ve ses yüksekliği ayarlanır.
   * pan: -1 (tam sol) ile +1 (tam sağ) arası
   * distance: 0 (aynı kare) ile 4 (uzak) arası
   */
  playKeyPing(pan: number, distance: number) {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const clampedPan = Math.max(-1, Math.min(1, pan));

    // Mesafe arttıkça ses zayıflar
    const volume = Math.max(0.08, 0.45 - distance * 0.09);

    // Bronz çınlama akoru (iki tiz osilatör ile metalik titreşim)
    [880, 1320].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + idx * 4, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      if (panner) {
        panner.pan.setValueAtTime(clampedPan, now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start(now);
      osc.stop(now + 0.65);
    });
  }

  /**
   * Anahtar Alma Başarısı (Key Collected Jingle)
   */
  playKeyCollected() {
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpej
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.4, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.45);
    });
  }

  /**
   * Canavar Hırıltısı (Monster Growl - Stereo Panned)
   * canavarın yönüne göre düşük frekanslı testere dişi ve modülasyon
   */
  playMonsterSound(pan: number, distance: number) {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const clampedPan = Math.max(-1, Math.min(1, pan));
    const volume = Math.max(0.1, 0.6 - distance * 0.12);

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now); // Çok derin pes hırıltı
    osc.frequency.linearRampToValueAtTime(45, now + 0.8);

    // Titreme (tremolo) efekti için LFO
    lfo.frequency.setValueAtTime(8, now);
    lfoGain.gain.setValueAtTime(25, now);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    if (panner) {
      panner.pan.setValueAtTime(clampedPan, now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      osc.connect(gain);
      gain.connect(this.masterGain);
    }

    lfo.start(now);
    osc.start(now);

    osc.stop(now + 0.85);
    lfo.stop(now + 0.85);
  }

  /**
   * Nefes Tutma / Çömelme Sesi (Crouch / Hold Breath)
   */
  playHoldBreath() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.4);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  /**
   * Kalp Atışı Döngüsü (Nabız - Tehlike arttıkça hızlanır)
   */
  startHeartbeat(dangerLevel: 'low' | 'medium' | 'high') {
    this.stopHeartbeat();
    const intervalMs = dangerLevel === 'high' ? 450 : dangerLevel === 'medium' ? 700 : 1000;

    const beat = () => {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      gain.gain.setValueAtTime(dangerLevel === 'high' ? 0.45 : 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.13);
    };

    beat();
    this.heartbeatInterval = setInterval(beat, intervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Zafer / Çıkış Kapısı Açılma Sesi
   */
  playVictorySound() {
    const now = this.ctx.currentTime;
    const chords = [261.63, 329.63, 392.00, 523.25]; // C majör
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.3, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.15);
      osc.stop(now + 1.9);
    });
  }

  /**
   * Yakalanma / Yenilgi Sesi
   */
  playJumpscareLoss() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 1.2);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  cleanup() {
    this.stopHeartbeat();
  }
}
