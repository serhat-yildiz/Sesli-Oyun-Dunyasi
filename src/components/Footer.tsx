import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-container">
        <p>
          <strong>Sesli Oyun Dünyası</strong> — Görme engelli oyuncular için erişilebilir, klavye ve ekran okuyucu dostu ses tabanlı oyun platformu.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          WCAG 2.2 Seviye AA standartlarına uyumlu olarak tasarlanmıştır. NVDA, JAWS ve Windows Narrator ile tam uyumludur.
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <Link href="/yardim" style={{ color: 'var(--text-main)', textDecoration: 'underline' }}>
            Yardım ve Ekran Okuyucu Kılavuzu
          </Link>
          <Link href="/ayarlar" style={{ color: 'var(--text-main)', textDecoration: 'underline' }}>
            Erişilebilirlik ve Ses Ayarları
          </Link>
          <Link href="/hakkinda-iletisim" style={{ color: 'var(--text-main)', textDecoration: 'underline' }}>
            Geri Bildirim Bildir
          </Link>
        </div>
      </div>
    </footer>
  );
}
