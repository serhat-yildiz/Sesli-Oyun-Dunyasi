/**
 * Akustik Tenis Profesyonel Ses Motoru (High-Fidelity Audio Synthesizer)
 * - Fiziksel Masa & Raket Çarpması (Transient + Resonant Body)
 * - Havada Uçan Top Hışırtısı (Whoosh / Doppler stereo panner)
 * - Kenar vuruşu, net ve duvar akustiği
 */

export class AudioTennisAudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;

  constructor(ctx: AudioContext, masterGain: GainNode) {
    this.ctx = ctx;
    this.masterGain = masterGain;
  }

  /**
   * Gerçekçi Masa Tenisi Vuruşu (Transient Click + Tahta/Masa Rezonansı)
   * isPaddle: true -> Raket vuruşu (tok, esnek kauçuk), false -> Masa sekmesi (tiz plastik, sert masa)
   */
  playHit(pan: number, isPaddle: boolean, quality: 'perfect' | 'good' | 'opponent' = 'good') {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const clampedPan = Math.max(-1, Math.min(1, pan));

    const hitOutput = this.ctx.createGain();

    if (isPaddle) {
      // 1. Transient (Topun rakete ilk çarptığı mikro çıtlama)
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(quality === 'perfect' ? 850 : 650, now);
      clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.025);
      clickGain.gain.setValueAtTime(0.55, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      clickOsc.connect(clickGain);
      clickGain.connect(hitOutput);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);

      // 2. Body Resonance (Tahta raket gövdesinin rezonansı)
      const bodyOsc = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      bodyOsc.type = 'sine';
      const baseFreq = quality === 'perfect' ? 340 : quality === 'opponent' ? 260 : 300;
      bodyOsc.frequency.setValueAtTime(baseFreq, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(95, now + 0.09);
      bodyGain.gain.setValueAtTime(quality === 'perfect' ? 0.6 : 0.45, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(hitOutput);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.11);
    } else {
      // Masa Sekmesi (Hafif içi boş selüloit masa tenisi topu sekmesi)
      const bounceOsc = this.ctx.createOscillator();
      const bounceGain = this.ctx.createGain();
      bounceOsc.type = 'sine';
      bounceOsc.frequency.setValueAtTime(1100, now);
      bounceOsc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

      bounceGain.gain.setValueAtTime(0.4, now);
      bounceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      bounceOsc.connect(bounceGain);
      bounceGain.connect(hitOutput);
      bounceOsc.start(now);
      bounceOsc.stop(now + 0.06);

      // Masanın ahşap yankılanması (Düşük thump)
      const tableThump = this.ctx.createOscillator();
      const tableGain = this.ctx.createGain();
      tableThump.type = 'triangle';
      tableThump.frequency.setValueAtTime(180, now);
      tableThump.frequency.exponentialRampToValueAtTime(60, now + 0.07);
      tableGain.gain.setValueAtTime(0.3, now);
      tableGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      tableThump.connect(tableGain);
      tableGain.connect(hitOutput);
      tableThump.start(now);
      tableThump.stop(now + 0.075);
    }

    if (panner) {
      panner.pan.setValueAtTime(clampedPan, now);
      hitOutput.connect(panner);
      panner.connect(this.masterGain);
    } else {
      hitOutput.connect(this.masterGain);
    }
  }

  /**
   * Raketin Boşa Savrulması (Whoosh / Hava Sürtünmesi)
   */
  playWhiff() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /**
   * Topun Kaçırılıp Duvara Çarpması (Küt sesi)
   */
  playWallHit() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  /**
   * Puan Kazanıldığında Melodik Tını
   */
  playPointScored(isPlayer: boolean) {
    const now = this.ctx.currentTime;
    if (isPlayer) {
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C6
      chords.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.07);

        gain.gain.setValueAtTime(0.35, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.4);
      });
    } else {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.32);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.33);
    }
  }

  /**
   * Maç Kazanıldığında Kutlama Fanfarı
   */
  playMatchWon() {
    const now = this.ctx.currentTime;
    const fanfare = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
    fanfare.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.1);

      gain.gain.setValueAtTime(0.35, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.75);
    });
  }
}
