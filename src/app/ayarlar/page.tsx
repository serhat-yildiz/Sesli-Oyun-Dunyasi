'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAnnouncer } from '@/context/AnnouncerContext';
import { useAudio } from '@/context/AudioContext';

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { announce } = useAnnouncer();
  const { initAudio, playToneFeedback } = useAudio();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    updateSetting('volume', val);
  };

  const handleSpeechRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    updateSetting('speechRate', val);
    announce(`Anlatım hızı çarpanı ${val} kat olarak güncellendi.`, 'polite');
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'kolay' | 'orta' | 'zor';
    updateSetting('difficulty', val);
    announce(`Oyun zorluk seviyesi ${val} olarak ayarlandı.`, 'polite');
  };

  const handleHighContrastToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    updateSetting('highContrast', checked);
    announce(checked ? 'Yüksek kontrast modu etkinleştirildi.' : 'Yüksek kontrast modu kapatıldı.', 'polite');
  };

  const handleLargeTextToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    updateSetting('largeText', checked);
    announce(checked ? 'Büyük yazı modu etkinleştirildi.' : 'Büyük yazı modu kapatıldı.', 'polite');
  };

  const handleTestVolume = async () => {
    await initAudio();
    playToneFeedback(440, 250);
    announce(`Ses seviyesi yüzde ${settings.volume} olarak test edildi.`, 'polite');
  };

  const handleReset = () => {
    resetSettings();
    announce('Tüm ayarlar fabrika ayarlarına sıfırlandı.', 'polite');
  };

  return (
    <div>
      <header>
        <h1>Erişilebilirlik ve Ses Ayarları</h1>
        <p style={{ fontSize: '1.1rem' }}>
          Tercihleriniz otomatik olarak tarayıcınızın yerel hafızasına (localStorage) kaydedilir ve tüm sayfalarda geçerli olur.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          announce('Ayarlar başarıyla kaydedildi.', 'polite');
        }}
        aria-label="Platform Ayarları Formu"
        style={{ marginTop: '2rem' }}
      >
        {/* Ses Seviyesi */}
        <fieldset className="card form-group" style={{ marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 800, fontSize: '1.25rem', padding: '0 0.5rem', color: 'var(--text-main)' }}>
            Ses ve İşitsel Ayarlar
          </legend>

          <div style={{ marginTop: '1rem' }}>
            <label htmlFor="volume-slider" className="form-label">
              Ana Ses Seviyesi (Mevcut Değer: %{settings.volume})
            </label>
            <p id="volume-hint" className="form-hint">
              Oyun içi efektlerin ve arka plan seslerinin genel ses düzeyi (0 ile 100 arası).
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                value={settings.volume}
                onChange={handleVolumeChange}
                aria-describedby="volume-hint"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={settings.volume}
                aria-valuetext={`Yüzde ${settings.volume}`}
                style={{ flex: 1, minWidth: '200px', height: '2rem', cursor: 'pointer' }}
              />
              <button
                type="button"
                onClick={handleTestVolume}
                className="btn btn-secondary"
                aria-label={`Ses seviyesini test et, mevcut değer yüzde ${settings.volume}`}
              >
                🔊 Sesi Test Et
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <label htmlFor="speech-rate-select" className="form-label">
              Anlatım ve Metin Hızı Tercihi
            </label>
            <p id="speech-rate-hint" className="form-hint">
              İleride eklenebilecek sesli anlatımlı rehberler için tercih edilen konuşma temposu.
            </p>
            <select
              id="speech-rate-select"
              value={settings.speechRate}
              onChange={handleSpeechRateChange}
              aria-describedby="speech-rate-hint"
              className="form-select"
            >
              <option value="0.75">Yavaş (0.75x)</option>
              <option value="1.0">Normal (1.0x - Önerilen)</option>
              <option value="1.25">Hızlı (1.25x)</option>
              <option value="1.5">Çok Hızlı (1.5x)</option>
            </select>
          </div>
        </fieldset>

        {/* Oyun Deneyimi */}
        <fieldset className="card form-group" style={{ marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 800, fontSize: '1.25rem', padding: '0 0.5rem', color: 'var(--text-main)' }}>
            Oyun Zorluğu
          </legend>

          <div style={{ marginTop: '1rem' }}>
            <label htmlFor="difficulty-select" className="form-label">
              Varsayılan Oyun Zorluğu
            </label>
            <p id="difficulty-hint" className="form-hint">
              Sesli ipuçlarının tekrarlanma sıklığını ve tepki sürelerini belirler.
            </p>
            <select
              id="difficulty-select"
              value={settings.difficulty}
              onChange={handleDifficultyChange}
              aria-describedby="difficulty-hint"
              className="form-select"
            >
              <option value="kolay">Kolay — İpuçları sık tekrar eder, süre kısıtlaması geniştir</option>
              <option value="orta">Orta — Dengeli ses deneyimi (Standart)</option>
              <option value="zor">Zor — Minimum ipucu, yüksek dikkat gerektirir</option>
            </select>
          </div>
        </fieldset>

        {/* Görsel ve Kontrast Erişilebilirliği */}
        <fieldset className="card form-group" style={{ marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 800, fontSize: '1.25rem', padding: '0 0.5rem', color: 'var(--text-main)' }}>
            Görsel Tercihler (Az Gören Kullanıcılar İçin)
          </legend>

          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  id="high-contrast-toggle"
                  checked={settings.highContrast}
                  onChange={handleHighContrastToggle}
                  aria-describedby="high-contrast-hint"
                  className="form-checkbox"
                />
                <span>Yüksek Kontrast Modu</span>
              </label>
              <p id="high-contrast-hint" className="form-hint" style={{ marginLeft: '2.1rem' }}>
                Arka planı tamamen siyah yapar, yazı ve çerçeveleri saf sarı ve beyaz renklerle 7:1 (AAA) oranına yükseltir.
              </p>
            </div>

            <div>
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  id="large-text-toggle"
                  checked={settings.largeText}
                  onChange={handleLargeTextToggle}
                  aria-describedby="large-text-hint"
                  className="form-checkbox"
                />
                <span>Büyük Yazı Modu</span>
              </label>
              <p id="large-text-hint" className="form-hint" style={{ marginLeft: '2.1rem' }}>
                Platform genelindeki metin ve buton boyutlarını %25 oranında büyütür.
              </p>
            </div>

            <div>
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  id="tts-toggle"
                  checked={settings.ttsEnabled}
                  onChange={(e) => {
                    updateSetting('ttsEnabled', e.target.checked);
                    announce(e.target.checked ? 'Dahili sesli okuyucu açıldı.' : 'Dahili sesli okuyucu kapatıldı.', 'polite');
                  }}
                  aria-describedby="tts-hint"
                  className="form-checkbox"
                />
                <span>Dahili Sesli Asistan (Metin Okuma - TTS)</span>
              </label>
              <p id="tts-hint" className="form-hint" style={{ marginLeft: '2.1rem' }}>
                Ekran okuyucusu olmayan kullanıcılar için oyun duyurularını ve tuş eylemlerini tarayıcının Türkçe sesiyle doğrudan seslendirir.
              </p>
            </div>
          </div>
        </fieldset>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary">
            ✓ Ayarları Kaydet
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            aria-label="Tüm ayarları ilk haline sıfırla"
          >
            Varsayılana Sıfırla
          </button>
        </div>
      </form>
    </div>
  );
}
