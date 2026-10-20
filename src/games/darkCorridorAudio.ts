/**
 * Karanlık Koridor Profesyonel Korku Ses Motoru
 * - Nemli Taş Dehliz Yankısı (Simulated algorithmic reverb tail)
 * - Çift Katmanlı Organik Adımlar (Taş zemin çıtırtısı + topuk basışı)
 * - Varlık: Boğazdan Gelen Hırıltı & Ciğer Soluması (Noise filter + Dual LFO)
 * - Bronz Anahtar: 3 Aşamalı Kristal Çınlama (Shimmering chime)
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
   * Nemli Dehliz Adım Sesi
   * hitWall: true -> Soğuk taş duvara çarpma, false -> Taş zeminde yankılanan adım
   */
  playFootstep(hitWall: boolean = false) {
    const now = this.ctx.currentTime;

    if (hitWall) {
      // Duvara çarpma: Ağır, boğuk taş çarpması
      const thump = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thump.type = 'triangle';
      thump.frequency.setValueAtTime(140, now);
      thump.frequency.exponentialRampToValueAtTime(35, now + 0.2);

      thumpGain.gain.setValueAtTime(0.6, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      thump.connect(thumpGain);
      thumpGain.connect(this.masterGain);

      thump.start(now);
      thump.stop(now + 0.23);
    } else {
      // 1. Sert Taş Teması (Topuk vuruşu)
      const heel = this.ctx.createOscillator();
      const heelGain = this.ctx.createGain();
      heel.type = 'sine';
      heel.frequency.setValueAtTime(190, now);
      heel.frequency.exponentialRampToValueAtTime(65, now + 0.1);

      heelGain.gain.setValueAtTime(0.35, now);
      heelGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      heel.connect(heelGain);
      heelGain.connect(this.masterGain);
      heel.start(now);
      heel.stop(now + 0.11);

      // 2. Taş Koridorda Dağılan Yankı (Reverb tail)
      const echo = this.ctx.createOscillator();
      const echoGain = this.ctx.createGain();
      echo.type = 'triangle';
      echo.frequency.setValueAtTime(95, now + 0.04);
      echo.frequency.exponentialRampToValueAtTime(40, now + 0.28);

      echoGain.gain.setValueAtTime(0.0, now);
      echoGain.gain.setValueAtTime(0.18, now + 0.04);
      echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      echo.connect(echoGain);
      echoGain.connect(this.masterGain);
      echo.start(now + 0.04);
      echo.stop(now + 0.29);
    }
  }

  /**
   * 90 Derece Dönüşte Kumaş & Çevre Hışırtısı
   */
  playTurn(direction: 'left' | 'right') {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(direction === 'left' ? 280 : 230, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, now);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);

    if (panner) {
      panner.pan.setValueAtTime(direction === 'left' ? -0.75 : 0.75, now);
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gain.connect(this.masterGain);
    }

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /**
   * Bronz Anahtar Çınlaması (Shimmering Metallic Chime)
   */
  playKeyPing(pan: number, distance: number) {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const clampedPan = Math.max(-1, Math.min(1, pan));
    const volume = Math.max(0.06, 0.48 - distance * 0.09);

    // Üçlü metalik harmonik akor (880 Hz, 1320 Hz, 1760 Hz)
    [880, 1318.5, 1760].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + idx * 3, now);

      gain.gain.setValueAtTime(volume / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.8 + idx * 0.1);

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
      osc.stop(now + 0.95);
    });
  }

  /**
   * Anahtar Alındığında Gizemli Başarı Arpeji
   */
  playKeyCollected() {
    const now = this.ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C - E - G - C6 - E6
    arpeggio.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.35, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.55);
    });
  }

  /**
   * Varlık / Canavar Hırıltısı (Boğaz Rezonansı & Korkutucu LFO Titremesi)
   */
  playMonsterSound(pan: number, distance: number) {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const clampedPan = Math.max(-1, Math.min(1, pan));
    const volume = Math.max(0.12, 0.65 - distance * 0.11);

    // 1. Derin Ciğer Hırıltısı
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(58, now);
    osc.frequency.linearRampToValueAtTime(38, now + 0.85);

    // LFO ile göğüs kafesi titremesi
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(9.5, now);
    lfoGain.gain.setValueAtTime(32, now);
    lfo.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.85);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.85);

    osc.connect(filter);
    filter.connect(gain);

    if (panner) {
      panner.pan.setValueAtTime(clampedPan, now);
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gain.connect(this.masterGain);
    }

    lfo.start(now);
    osc.start(now);

    osc.stop(now + 0.9);
    lfo.stop(now + 0.9);
  }

  /**
   * Nefes Tutma (Fısıltı ve ciğer rahatlaması)
   */
  playHoldBreath() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.45);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  /**
   * Dinamik Nabız / Kalp Atışı (Sub-bass thump)
   */
  startHeartbeat(dangerLevel: 'low' | 'medium' | 'high') {
    this.stopHeartbeat();
    const intervalMs = dangerLevel === 'high' ? 420 : dangerLevel === 'medium' ? 680 : 1000;

    const beat = () => {
      const now = this.ctx.currentTime;
      // Duble atış: Lupp-Dupp
      [0, 0.12].forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 68 : 52, now + offset);
        osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.1);

        gain.gain.setValueAtTime(dangerLevel === 'high' ? 0.48 : 0.28, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + offset);
        osc.stop(now + offset + 0.11);
      });
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
   * Zafer / Dehlizden Kurtuluş Çanı
   */
  playVictorySound() {
    const now = this.ctx.currentTime;
    const victoryChords = [261.63, 329.63, 392.00, 523.25, 659.25];
    victoryChords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.35, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.14);
      osc.stop(now + 2.3);
    });
  }

  /**
   * Yakalanma / Jumpscare
   */
  playJumpscareLoss() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    subOsc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 1.4);

    subOsc.frequency.setValueAtTime(60, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 1.4);

    gain.gain.setValueAtTime(0.75, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 1.45);
    subOsc.stop(now + 1.45);
  }

  cleanup() {
    this.stopHeartbeat();
  }
}
