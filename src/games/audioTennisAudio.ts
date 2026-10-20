/**
 * Akustik Tenis Profesyonel Ses Motoru
 * - Seyirci Tezahürat ve Alkışı (Gerçekçi gürültü sentezleyici + çığlık/alkış akoru)
 * - Yönlü Top Uçuşu: Sol köşe, Orta, Sağ köşe
 * - Fileye Çarpma / Yanlış Tuş Hatası
 */

export class AudioTennisAudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;

  constructor(ctx: AudioContext, masterGain: GainNode) {
    this.ctx = ctx;
    this.masterGain = masterGain;
  }

  /**
   * Topun Masaya Sekmesi veya Raket Vuruşu
   * targetZone: 'left' (Sol: -0.85) | 'center' (Merkez: 0.0) | 'right' (Sağ: +0.85)
   */
  playHit(
    pan: number,
    isPaddle: boolean,
    quality: 'perfect' | 'good' | 'opponent' = 'good',
    targetZone: 'left' | 'center' | 'right' = 'center'
  ) {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    // Yön pan ayarlaması
    let calculatedPan = pan;
    if (isPaddle) {
      calculatedPan = targetZone === 'left' ? -0.8 : targetZone === 'right' ? 0.8 : 0.0;
    }

    const hitOutput = this.ctx.createGain();

    if (isPaddle) {
      // 1. Transient Click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(quality === 'perfect' ? 880 : 660, now);
      clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.025);
      clickGain.gain.setValueAtTime(0.55, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      clickOsc.connect(clickGain);
      clickGain.connect(hitOutput);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);

      // 2. Body Resonance
      const bodyOsc = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      bodyOsc.type = 'sine';
      const baseFreq = quality === 'perfect' ? 360 : 300;
      bodyOsc.frequency.setValueAtTime(baseFreq, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(95, now + 0.09);
      bodyGain.gain.setValueAtTime(quality === 'perfect' ? 0.6 : 0.45, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(hitOutput);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.11);
    } else {
      // Masa Sekmesi
      const bounceOsc = this.ctx.createOscillator();
      const bounceGain = this.ctx.createGain();
      bounceOsc.type = 'sine';
      bounceOsc.frequency.setValueAtTime(targetZone === 'left' ? 1000 : targetZone === 'right' ? 1200 : 1100, now);
      bounceOsc.frequency.exponentialRampToValueAtTime(340, now + 0.05);

      bounceGain.gain.setValueAtTime(0.4, now);
      bounceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      bounceOsc.connect(bounceGain);
      bounceGain.connect(hitOutput);
      bounceOsc.start(now);
      bounceOsc.stop(now + 0.06);

      // Ahşap masa thump
      const tableThump = this.ctx.createOscillator();
      const tableGain = this.ctx.createGain();
      tableThump.type = 'triangle';
      tableThump.frequency.setValueAtTime(170, now);
      tableThump.frequency.exponentialRampToValueAtTime(60, now + 0.07);
      tableGain.gain.setValueAtTime(0.3, now);
      tableGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      tableThump.connect(tableGain);
      tableGain.connect(hitOutput);
      tableThump.start(now);
      tableThump.stop(now + 0.075);
    }

    if (panner) {
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, calculatedPan)), now);
      hitOutput.connect(panner);
      panner.connect(this.masterGain);
    } else {
      hitOutput.connect(this.masterGain);
    }
  }

  /**
   * Yanlış Tuşa Basma / Ağa Takılma Sesi (Buzzer & File Vuruşu)
   */
  playNetFault() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.28);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.29);
  }

  /**
   * Boşa Sallama Sesi (Whiff)
   */
  playWhiff() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.16);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  /**
   * Kaçırılıp Duvara Çarpma Sesi
   */
  playWallHit() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  /**
   * Gerçekçi Seyirci Tezahürat ve Alkışı (Crowd Cheers & Applause)
   */
  playCrowdApplause() {
    const now = this.ctx.currentTime;
    try {
      // 1. Alkış Pıtırtıları (Filtered noise)
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(1.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noiseSource.start(now);
      noiseSource.stop(now + 1.45);

      // 2. Seyirci Sevinç Çığlığı (Melodik harmonik yükselme)
      const cheerChords = [440, 554.37, 659.25];
      cheerChords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.1);
        osc.frequency.linearRampToValueAtTime(freq * 1.15, now + 0.6);

        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.18, now + 0.2);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 1.25);
      });
    } catch (e) {
      console.warn('Alkış efekti çalınamadı:', e);
    }
  }

  /**
   * Puan Kazanıldığında Çalan Tını
   */
  playPointScored(isPlayer: boolean) {
    const now = this.ctx.currentTime;
    if (isPlayer) {
      this.playCrowdApplause(); // Seyirci alkışı
      const chords = [523.25, 659.25, 783.99, 1046.50];
      chords.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.07);

        gain.gain.setValueAtTime(0.3, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.45);
      });
    } else {
      // Rakip puanı
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.35);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.36);
    }
  }

  /**
   * Maç Zaferi
   */
  playMatchWon() {
    this.playCrowdApplause();
    const now = this.ctx.currentTime;
    const fanfare = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
    fanfare.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.1);

      gain.gain.setValueAtTime(0.35, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.85);
    });
  }
}
