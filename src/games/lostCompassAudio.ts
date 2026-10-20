/**
 * Kayıp Pusula Ses Motoru (Lost Compass Audio Synthesizer)
 * Açık dünya ada atmosferi: Okyanus dalgaları, rüzgar uğultusu,
 * mekanik pusula sonar tıklamaları, totem çanları ve zemin sesleri.
 */

export class LostCompassAudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private oceanGain: GainNode | null = null;
  private oceanPanner: StereoPannerNode | null = null;
  private oceanSource: AudioBufferSourceNode | null = null;
  private isAmbienceRunning = false;

  constructor(ctx: AudioContext, masterGain: GainNode) {
    this.ctx = ctx;
    this.masterGain = masterGain;
  }

  /**
   * Sürekli Arka Plan Doğa Atmosferi (Beyaz Gürültü Filtreleme ile Okyanus Dalgası)
   */
  startAmbience(playerAngleRad: number) {
    if (this.isAmbienceRunning) return;

    try {
      // 3 saniyelik pembe/beyaz gürültü buffer'ı oluştur
      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.1;
        b2 = 0.85 * b2 + white * 0.2;
        output[i] = (b0 + b1 + b2) * 0.3;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Dalga filtresi (Lowpass Filter - kabarip cekilen dalgalar)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);

      // Dalga LFO modülatörü (4 saniyede bir kabarıp çekilen dalgalar)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.25, this.ctx.currentTime); // 4 saniye
      lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
      lfo.connect(filter.frequency);

      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);

      whiteNoise.connect(filter);
      if (panner) {
        filter.connect(panner);
        panner.connect(gainNode);
        this.oceanPanner = panner;
      } else {
        filter.connect(gainNode);
      }
      gainNode.connect(this.masterGain);

      lfo.start();
      whiteNoise.start();

      this.oceanGain = gainNode;
      this.oceanSource = whiteNoise;
      this.isAmbienceRunning = true;

      this.updateAmbienceOrientation(playerAngleRad);
    } catch (e) {
      console.warn('Ambience başlatılamadı:', e);
    }
  }

  /**
   * Oyuncunun baktığı yöne göre okyanus dalgalarının stereo yönünü güncelle
   */
  updateAmbienceOrientation(playerAngleRad: number) {
    if (this.oceanPanner) {
      // Okyanus güneyde (y = +1) kabul edilirse
      const pan = Math.sin(Math.PI / 2 - playerAngleRad);
      this.oceanPanner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.1);
    }
  }

  /**
   * Adım Sesi (Zemine Göre: Kum, Çimen, Taş)
   */
  playFootstep(terrain: 'sand' | 'grass' | 'stone') {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (terrain === 'sand') {
      // Yumuşak kum sesi (düşük frekanslı hafif poflama)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    } else if (terrain === 'grass') {
      // Çimen / çalı hışırtısı
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    } else {
      // Taş / Tapınak zemini
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Akustik Pusula Tıklaması (Sonar / Compass Click)
   * Oyuncu hedefe doğru bakıyorsa tiz ve hızlı tıklar, ters bakıyorsa boğuk ve tek tıklar.
   * angleDifference: 0 (tam hedef) ile PI (tam ters)
   */
  playCompassClick(angleDiffRad: number, distance: number) {
    const now = this.ctx.currentTime;
    const isTargetAhead = angleDiffRad < Math.PI / 4;

    const baseFreq = isTargetAhead ? 900 : 250;
    const clicksCount = isTargetAhead ? 3 : 1;
    const clickInterval = 0.08;

    for (let i = 0; i < clicksCount; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isTargetAhead ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq + i * 150, now + i * clickInterval);

      gain.gain.setValueAtTime(0.4, now + i * clickInterval);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * clickInterval + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * clickInterval);
      osc.stop(now + i * clickInterval + 0.06);
    }
  }

  /**
   * Totem Taşı Işıma ve Çan Sesi (Totem Bell)
   */
  playTotemBell(pan: number) {
    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const freqs = [659.25, 987.77, 1318.51]; // E5, B5, E6 parlak çan akoru

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);

      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 1.2);

      if (panner) {
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 1.3);
    });
  }

  /**
   * Totem Taşı Alındığında Başarı Tınısı
   */
  playTotemCollected() {
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A majör
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.35, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.65);
    });
  }

  /**
   * Fener Kulesi Zafer Çanı (Rescue Horn / Bells)
   */
  playVictoryBeacon() {
    const now = this.ctx.currentTime;
    // Derin deniz feneri sireni / borusu
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(146.83, now); // D3
    osc2.frequency.setValueAtTime(220.00, now); // A3

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.1);
    osc2.stop(now + 3.1);
  }

  cleanup() {
    if (this.oceanSource) {
      try {
        this.oceanSource.stop();
        this.oceanSource.disconnect();
      } catch (e) {
        // Zaten durmuş olabilir
      }
      this.oceanSource = null;
    }
    this.isAmbienceRunning = false;
  }
}
