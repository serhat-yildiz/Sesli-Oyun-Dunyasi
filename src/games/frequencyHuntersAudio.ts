/**
 * Frekans Avcıları Ses Motoru (Frequency Hunters Audio Synthesizer)
 * Referans tonu ve oyuncu tonunu iki ayrı kanalda veya stereo olarak çalar.
 * Fiziksel 'akustik vuru' (beating) olgusunu gerçek zamanlı üretir.
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
   * Çift Frekans Üretecini Başlat
   * Sol kulaklık: Referans ses
   * Sağ kulaklık: Oyuncunun kontrol ettiği ses
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

      this.refGain.gain.setValueAtTime(0.25, now);

      if (this.refPanner) {
        this.refPanner.pan.setValueAtTime(-0.6, now); // Sol kulak ağırlıklı
        this.refOsc.connect(this.refGain);
        this.refGain.connect(this.refPanner);
        this.refPanner.connect(this.masterGain);
      } else {
        this.refOsc.connect(this.refGain);
        this.refGain.connect(this.masterGain);
      }

      // 2. Oyuncu Osilatörü (Sağ Kulak)
      this.playerOsc = this.ctx.createOscillator();
      this.playerGain = this.ctx.createGain();
      this.playerPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      this.playerOsc.type = 'sine';
      this.playerOsc.frequency.setValueAtTime(currentFreq, now);

      this.playerGain.gain.setValueAtTime(0.25, now);

      if (this.playerPanner) {
        this.playerPanner.pan.setValueAtTime(0.6, now); // Sağ kulak ağırlıklı
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

  /**
   * Oyuncunun Frekansını Güncelle
   */
  setPlayerFrequency(freq: number) {
    if (this.playerOsc && this.isRunning) {
      this.playerOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);
    }
  }

  /**
   * Sadece Referans Sesini Dinlet (Solo)
   */
  playReferenceSolo(targetFreq: number) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  /**
   * Frekans Kilitlendiğinde Başarı Rezonans Akoru
   */
  playLockSuccess(baseFreq: number) {
    const now = this.ctx.currentTime;
    // Mükemmel Beşli ve Oktav akoru
    const harmonicNotes = [baseFreq, baseFreq * 1.5, baseFreq * 2];

    harmonicNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.3, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.5);
    });
  }

  /**
   * Yanlış Frekans Kilitlendiğinde Hata Uyarısı (Buzzer)
   */
  playMistake() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.3);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Tüm 5 Seviye Tamamlandığında Büyük Zafer Senfonisi
   */
  playGrandVictory() {
    const now = this.ctx.currentTime;
    const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C E G C E G
    arpeggio.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.3, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 1.25);
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
