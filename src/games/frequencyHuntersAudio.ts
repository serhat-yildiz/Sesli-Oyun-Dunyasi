/**
 * Frekans Avcıları Profesyonel Akustik Ses Motoru
 * - Sıcak Analog Sentezleyici Tonları (Harmonic enrichment + Soft attack envelope)
 * - Saf Akustik Vuru (Beating): Sol kulak referans, sağ kulak oyuncu
 * - Kristal Rezonans Kilitleme Akoru (Celesta / Glass Chimes)
 */

export class FrequencyHuntersAudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;

  private refOsc: OscillatorNode | null = null;
  private refGain: GainNode | null = null;
  private refPanner: StereoPannerNode | null = null;

  private playerOsc: OscillatorNode | null = null;
  private playerGain: GainNode | null = null;
  private playerPanner: StereoPannerNode | null = null;

  private isRunning = false;

  constructor(ctx: AudioContext, masterGain: GainNode) {
    this.ctx = ctx;
    this.masterGain = masterGain;
  }

  /**
   * Çift Ton Akort Motoru (Sol: Referans, Sağ: Oyuncu)
   */
  startFrequencyTuning(targetFreq: number, currentFreq: number) {
    this.stopTuning();

    try {
      const now = this.ctx.currentTime;

      // 1. Referans Osilatörü (Sol Kulak)
      this.refOsc = this.ctx.createOscillator();
      this.refGain = this.ctx.createGain();
      this.refPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      this.refOsc.type = 'sine';
      this.refOsc.frequency.setValueAtTime(targetFreq, now);

      // Yumuşak Attack Zarfı (Kulak tırmalamayan yumuşak açılış)
      this.refGain.gain.setValueAtTime(0, now);
      this.refGain.gain.linearRampToValueAtTime(0.24, now + 0.15);

      if (this.refPanner) {
        this.refPanner.pan.setValueAtTime(-0.65, now);
        this.refOsc.connect(this.refGain);
        this.refGain.connect(this.refPanner);
        this.refPanner.connect(this.masterGain);
      } else {
        this.refOsc.connect(this.refGain);
        this.refGain.connect(this.masterGain);
      }

      // 2. Oyuncu Osilatörü (Sağ Kulak - Sıcak Triangle/Sine melez ton)
      this.playerOsc = this.ctx.createOscillator();
      this.playerGain = this.ctx.createGain();
      this.playerPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      this.playerOsc.type = 'triangle';
      this.playerOsc.frequency.setValueAtTime(currentFreq, now);

      this.playerGain.gain.setValueAtTime(0, now);
      this.playerGain.gain.linearRampToValueAtTime(0.22, now + 0.15);

      if (this.playerPanner) {
        this.playerPanner.pan.setValueAtTime(0.65, now);
        this.playerOsc.connect(this.playerGain);
        this.playerGain.connect(this.playerPanner);
        this.playerPanner.connect(this.masterGain);
      } else {
        this.playerOsc.connect(this.playerGain);
        this.playerGain.connect(this.masterGain);
      }

      this.refOsc.start(now);
      this.playerOsc.start(now);
      this.isRunning = true;
    } catch (e) {
      console.warn('Frekans osilatörleri başlatılamadı:', e);
    }
  }

  setPlayerFrequency(freq: number) {
    if (this.playerOsc && this.isRunning) {
      this.playerOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.04);
    }
  }

  /**
   * Referans Frekansı Solo Dinleme (Kristal Tını)
   */
  playReferenceSolo(targetFreq: number) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.38, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.45);
  }

  /**
   * Frekans Kilitlendiğinde Kristal Rezonans Armonisi
   */
  playLockSuccess(baseFreq: number) {
    const now = this.ctx.currentTime;
    // Mükemmel Beşli, Oktav ve Majör Üçlü harmonik parlama
    const harmonicNotes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];

    harmonicNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.32 / (idx + 1), now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.06 + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 1.9);
    });
  }

  /**
   * Hatalı Kilit Uyarısı
   */
  playMistake() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * 5 Modülün Tamamı Çözüldüğünde Görkemli Senfoni
   */
  playGrandVictory() {
    const now = this.ctx.currentTime;
    const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
    arpeggio.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.35, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.7);
    });
  }

  stopTuning() {
    if (this.refOsc) {
      try {
        this.refOsc.stop();
        this.refOsc.disconnect();
      } catch (e) {}
      this.refOsc = null;
    }
    if (this.playerOsc) {
      try {
        this.playerOsc.stop();
        this.playerOsc.disconnect();
      } catch (e) {}
      this.playerOsc = null;
    }
    this.isRunning = false;
  }

  cleanup() {
    this.stopTuning();
  }
}
