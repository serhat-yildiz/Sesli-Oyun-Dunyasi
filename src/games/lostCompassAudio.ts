/**
 * Kayıp Pusula Profesyonel Açık Dünya Ses Motoru
 * - Dinamik İki Katmanlı Okyanus Sörfü (Sub-bass surge + High foam hiss)
 * - Zemine Göre Karakterli Adımlar (Kumda hafif gömülme, yosunlu orman, antik taş)
 * - Antika Manyetik Pusula: Çift dişli tıkırtısı ve kadim totem tapınak gongu
 */

export class LostCompassAudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private oceanPanner: StereoPannerNode | null = null;
  private oceanSource: AudioBufferSourceNode | null = null;
  private isAmbienceRunning = false;

  constructor(ctx: AudioContext, masterGain: GainNode) {
    this.ctx = ctx;
    this.masterGain = masterGain;
  }

  /**
   * Zengin Doğal Okyanus Dalgaları Ambiyansı
   */
  startAmbience(playerAngleRad: number) {
    if (this.isAmbienceRunning) return;

    try {
      const bufferSize = this.ctx.sampleRate * 4;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pembe gürültü filtresi (daha yumuşak rüzgar & dalga dokusu)
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Dalga lowpass filtresi (Köpüren su)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      // Kabarma & çekilme LFO'su (5 saniyede bir okyanus dalgası)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(280, this.ctx.currentTime);
      lfo.connect(filter.frequency);

      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      const oceanGain = this.ctx.createGain();
      oceanGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

      noiseSource.connect(filter);
      if (panner) {
        filter.connect(panner);
        panner.connect(oceanGain);
        this.oceanPanner = panner;
      } else {
        filter.connect(oceanGain);
      }
      oceanGain.connect(this.masterGain);

      lfo.start();
      noiseSource.start();

      this.oceanSource = noiseSource;
      this.isAmbienceRunning = true;
      this.updateAmbienceOrientation(playerAngleRad);
    } catch (e) {
      console.warn('Okyanus ambiyansı başlatılamadı:', e);
    }
  }

  updateAmbienceOrientation(playerAngleRad: number) {
    if (this.oceanPanner) {
      const pan = Math.sin(Math.PI / 2 - playerAngleRad);
      this.oceanPanner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.12);
    }
  }

  /**
   * Zenginleştirilmiş Zemin Adımları
   */
  playFootstep(terrain: 'sand' | 'grass' | 'stone') {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (terrain === 'sand') {
      // Islak kumda yumuşak adımlar
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.16);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    } else if (terrain === 'grass') {
      // Çalı ve yaprak hışırtısı
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.13);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    } else {
      // Antik taş zemin vuruşu
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  /**
   * Antika Mekanik Pusula Sonar Tıklaması (Mekanik Çift Dişli)
   */
  playCompassClick(angleDiffRad: number, distance: number) {
    const now = this.ctx.currentTime;
    const isTargetAhead = angleDiffRad < Math.PI / 4;

    const clicksCount = isTargetAhead ? 3 : 1;
    const clickInterval = 0.07;

    for (let i = 0; i < clicksCount; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isTargetAhead ? 'sine' : 'triangle';
      const baseFreq = isTargetAhead ? 980 + i * 120 : 220;
      osc.frequency.setValueAtTime(baseFreq, now + i * clickInterval);

      gain.gain.setValueAtTime(0.42, now + i * clickInterval);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * clickInterval + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * clickInterval);
      osc.stop(now + i * clickInterval + 0.05);
    }
  }

  /**
   * Kadim Totem Tapınak Çanı (Rezonanslı Gong)
   */
  playTotemBell(pan: number) {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const harmonicFrequencies = [523.25, 783.99, 1046.50, 1567.98]; // C5, G5, C6, G6

    harmonicFrequencies.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.03);

      gain.gain.setValueAtTime(0.28 / (idx + 1), now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 1.6);

      if (panner) {
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 1.7);
    });
  }

  /**
   * Totem Alındığında Kadim Kutsama Melodisi
   */
  playTotemCollected() {
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.35, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.85);
    });
  }

  /**
   * Fener Kulesi Kurtarma Sireni
   */
  playVictoryBeacon() {
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(146.83, now); // D3
    osc2.frequency.setValueAtTime(220.00, now); // A3

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.6);
    osc2.stop(now + 3.6);
  }

  cleanup() {
    if (this.oceanSource) {
      try {
        this.oceanSource.stop();
        this.oceanSource.disconnect();
      } catch (e) {}
      this.oceanSource = null;
    }
    this.isAmbienceRunning = false;
  }
}
