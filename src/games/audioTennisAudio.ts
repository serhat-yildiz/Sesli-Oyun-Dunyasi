/**
 * Akustik Tenis Ses Motoru (Audio Tennis Synthesizer)
 * Masa tenisi vuruş sesleri, stereo falso efektleri,
 * ağa takılma, duvar çarpması ve seyirci alkışı simülasyonu.
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
   * pan: -1 (tam sol - rakip) ile +1 (tam sağ - oyuncu)
   * isPaddle: Raket vuruşu mu yoksa masa sekmesi mi
   * quality: 'perfect' | 'good' | 'opponent'
   */
  playHit(pan: number, isPaddle: boolean, quality: 'perfect' | 'good' | 'opponent' = 'good') {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isPaddle) {
      // Raket vurusu: tok ve rezonansli kauçuk/tahta sesi
      const baseFreq = quality === 'perfect' ? 620 : 480;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      gain.gain.setValueAtTime(quality === 'perfect' ? 0.45 : 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    } else {
      // Masada sekme: tiz plastik top sesi
      osc.type = 'sine';
      osc.frequency.setValueAtTime(quality === 'opponent' ? 520 : 700, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    }

    if (panner) {
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      osc.connect(gain);
      gain.connect(this.masterGain);
    }

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * Boşa Sallama Sesi (Whiff / Miss Swing)
   */
  playWhiff() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Topun Kaçırılıp Duvara Çarpması (Wall Hit / Miss)
   */
  playWallHit() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Sayı Kazanıldığında Alkış / Başarı Efekti
   */
  playPointScored(isPlayer: boolean) {
    const now = this.ctx.currentTime;
    if (isPlayer) {
      // Oyuncu puanı: Sevinçli çan arpeji
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.08);

        gain.gain.setValueAtTime(0.3, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.45);
      });
    } else {
      // Rakip puanı: Düşük üzgün ton
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.36);
    }
  }

  /**
   * Maç Kazanıldığında Zafer Senfonisi
   */
  playMatchWon() {
    const now = this.ctx.currentTime;
    const chords = [392.00, 523.25, 659.25, 783.99, 1046.50];
    chords.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.12);

      gain.gain.setValueAtTime(0.35, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.85);
    });
  }
}
