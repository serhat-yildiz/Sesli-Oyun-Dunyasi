import type { Metadata } from 'next';
import './globals.css';
import SkipLink from '@/components/SkipLink';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveAnnouncer from '@/components/LiveAnnouncer';
import PageFocusManager from '@/components/PageFocusManager';
import { SettingsProvider } from '@/context/SettingsContext';
import { AnnouncerProvider } from '@/context/AnnouncerContext';
import { AudioProvider } from '@/context/AudioContext';

export const metadata: Metadata = {
  title: {
    default: 'Sesli Oyun Dünyası | Görme Engellilere Özel Ses Tabanlı Oyun Platformu',
    template: '%s | Sesli Oyun Dünyası',
  },
  description: 'Görme engelli kullanıcılar için klavye ve ekran okuyucu odaklı, erişilebilir Türkçe sesli oyun platformu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <SettingsProvider>
          <AnnouncerProvider>
            <AudioProvider>
              {/* Sayfa başına atlama bağlantısı (Skip link) */}
              <SkipLink />

              {/* Ekran okuyucu dinamik duyuru bileşeni (aria-live) */}
              <LiveAnnouncer />

              {/* SPA sayfa geçişlerinde odak ve başlık duyuru yöneticisi */}
              <PageFocusManager />

              {/* Landmark: header ve nav */}
              <Navbar />

              {/* Landmark: main */}
              <main id="main-content" className="site-main site-container" tabIndex={-1}>
                {children}
              </main>

              {/* Landmark: footer */}
              <Footer />
            </AudioProvider>
          </AnnouncerProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
