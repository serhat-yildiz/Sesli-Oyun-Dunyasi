'use client';

import React, { useState } from 'react';
import { useAnnouncer } from '@/context/AnnouncerContext';

export default function AboutContactPage() {
  const { announce } = useAnnouncer();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'oneri',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<{ [key: string]: string }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Lütfen adınızı ve soyadınızı belirtin.';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Lütfen geçerli bir e-posta adresi yazın.';
    }
    if (!formData.message.trim()) {
      errors.message = 'Lütfen mesajınızı veya önerinizi yazın.';
    }

    if (Object.keys(errors).length > 0) {
      setErrorDetails(errors);
      setStatus('error');
      announce('Formda eksik veya hatalı alanlar var. Lütfen hata mesajlarını kontrol edin.', 'assertive');
      // İlk hatalı alana odaklan
      const firstErrorKey = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorKey);
      el?.focus();
      return;
    }

    setErrorDetails({});
    setStatus('success');
    announce('Mesajınız başarıyla iletildi. En kısa sürede geri bildiriminiz incelenecektir.', 'assertive');
    setFormData({ name: '', email: '', topic: 'oneri', message: '' });
  };

  return (
    <div>
      <header>
        <h1>Hakkında ve İletişim</h1>
        <p style={{ fontSize: '1.15rem' }}>
          Sesli Oyun Dünyası, görsel engelleri ortadan kaldırarak işitsel algıya dayalı oyun deneyimini herkes için erişilebilir kılmayı hedefler.
        </p>
      </header>

      {/* Misyon ve Vizyon */}
      <section aria-labelledby="mission-heading" style={{ marginTop: '2.5rem' }}>
        <h2 id="mission-heading">Platformun Amacı</h2>
        <p>
          Çoğu modern video oyunu yüksek görsel grafiklere dayanır ve ekran okuyucu kullanan oyuncular için erişilemez durumdadır.
          Bu platform, hikaye anlatımı, ses tasarımı, çevresel rezonans ve spatial (3D) ses efektlerini oyunun merkezine alarak
          herkes için eşit bir eğlence alanı açmak üzere tasarlanmaktadır.
        </p>
        <p>
          Mimari olarak WCAG 2.2 Seviye AA kriterlerine sadık kalınarak klavye-odaklı gezinme, yüksek kontrast ve ekran okuyucu dostu aria-live sistemleri standart olarak inşa edilmiştir.
        </p>
      </section>

      {/* İletişim & Geri Bildirim Formu */}
      <section aria-labelledby="contact-form-heading" style={{ marginTop: '3rem' }}>
        <h2 id="contact-form-heading">Geri Bildirim ve İletişim Formu</h2>
        <p>
          Erişilebilirlik sorunları, oyun fikirleri veya iş birliği önerileriniz için bu formu kullanabilirsiniz.
        </p>

        {status === 'success' && (
          <div
            role="status"
            className="alert-box"
            style={{ backgroundColor: '#064e3b', borderColor: '#10b981', color: '#d1fae5', margin: '1.5rem 0' }}
          >
            <p><strong>✓ Teşekkür Ederiz:</strong> Mesajınız başarıyla iletildi. Geri bildiriminiz bizim için çok değerlidir.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ marginTop: '1.5rem' }} aria-label="İletişim Formu">
          {/* Ad Soyad */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Adınız ve Soyadınız <span aria-hidden="true" style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              aria-describedby={errorDetails.name ? 'name-error' : undefined}
              aria-invalid={!!errorDetails.name}
              className="form-input"
            />
            {errorDetails.name && (
              <p id="name-error" style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: '0.35rem', fontWeight: 'bold' }}>
                {errorDetails.name}
              </p>
            )}
          </div>

          {/* E-posta */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              E-posta Adresiniz <span aria-hidden="true" style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              aria-describedby={errorDetails.email ? 'email-error' : undefined}
              aria-invalid={!!errorDetails.email}
              className="form-input"
            />
            {errorDetails.email && (
              <p id="email-error" style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: '0.35rem', fontWeight: 'bold' }}>
                {errorDetails.email}
              </p>
            )}
          </div>

          {/* Konu */}
          <div className="form-group">
            <label htmlFor="topic" className="form-label">
              Konu Başlığı
            </label>
            <select
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              className="form-select"
            >
              <option value="oneri">Yeni Oyun veya Fikir Önerisi</option>
              <option value="erisebilirlik">Erişilebilirlik Hatası Bildirimi</option>
              <option value="genel">Genel Soru / Destek</option>
            </select>
          </div>

          {/* Mesaj */}
          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Mesajınız veya Detaylı Açıklama <span aria-hidden="true" style={{ color: '#f87171' }}>*</span>
            </label>
            <p id="message-hint" className="form-hint">
              Eğer bir erişilebilirlik hatası bildiriyorsanız kullandığınız ekran okuyucuyu (NVDA, JAWS vb.) belirtmeniz çözümü hızlandıracaktır.
            </p>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              value={formData.message}
              onChange={handleChange}
              aria-describedby={errorDetails.message ? 'message-error message-hint' : 'message-hint'}
              aria-invalid={!!errorDetails.message}
              className="form-textarea"
            />
            {errorDetails.message && (
              <p id="message-error" style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: '0.35rem', fontWeight: 'bold' }}>
                {errorDetails.message}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ minWidth: '200px' }}>
            Mesajı Gönder
          </button>
        </form>
      </section>
    </div>
  );
}
