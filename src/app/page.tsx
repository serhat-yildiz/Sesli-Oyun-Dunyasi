import React from 'react';
import Link from 'next/link';
import { getAllGames } from '@/games/registry';
import GameCard from '@/components/GameCard';

export const metadata = {
  title: 'Ana Sayfa - Sesli Oyun Dünyası',
};

export default function HomePage() {
  const games = getAllGames();

  return (
    <div>
      <section aria-labelledby="welcome-heading">
        <h1 id="welcome-heading">Sesli Oyun Dünyasına Hoş Geldiniz</h1>
        <p style={{ fontSize: '1.15rem' }}>
          Bu platform, görme engelli ve az gören oyuncular için ekran okuyucu (NVDA, JAWS, Narrator)
          ve klavye odaklı olarak sıfırdan tasarlandı. Görsellere bağımlı olmadan, yalnızca üç boyutlu
          ses ipuçları ve kulaklıklarınızla heyecan dolu maceralara atılabilirsiniz.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
          <Link href="/oyunlar" className="btn btn-primary">
            Tüm Oyunları İncele
          </Link>
          <Link href="/yardim" className="btn btn-secondary">
            Nasıl Kullanılır & Kısayollar
          </Link>
          <Link href="/ayarlar" className="btn btn-secondary">
            Ses ve Kontrast Ayarları
          </Link>
        </div>
      </section>

      <div className="alert-box" role="region" aria-label="Önemli Tavsiye">
        <p>
          <strong>🎧 En İyi Deneyim İçin Tavsiye:</strong> Oyunlarımızın ses tasarımı çift kulaklı stereo (binaural) ses algısına dayanır.
          Oyunları oynamadan önce bir stereo kulaklık takmanız ve sağ/sol yönlerini doğru yerleştirmeniz önerilir.
        </p>
      </div>

      <section aria-labelledby="featured-games-heading" style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 id="featured-games-heading" style={{ margin: 0 }}>Öne Çıkan Sesli Oyunlar</h2>
          <Link href="/oyunlar" style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>
            Tüm Oyunları Listele ({games.length}) &rarr;
          </Link>
        </div>
        <p style={{ marginTop: '0.5rem' }}>
          Geliştirme aşamasındaki ilk prototiplerimiz. Her bir oyunun dinamik sayfasına giderek tuş şemasını inceleyebilir ve test edebilirsiniz.
        </p>

        <div className="card-grid">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      <section aria-labelledby="accessibility-features-heading" style={{ marginTop: '3.5rem' }}>
        <h2 id="accessibility-features-heading">Temel Erişilebilirlik İlkelerimiz</h2>
        <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
          <li>
            <strong>Sıfır Fare Zorunluluğu:</strong> Platformdaki her bir sayfa ve oyun alanı yalnızca <kbd className="key-badge">Tab</kbd>, <kbd className="key-badge">Shift + Tab</kbd>, <kbd className="key-badge">Enter</kbd> ve <kbd className="key-badge">Boşluk</kbd> tuşlarıyla yönetilebilir.
          </li>
          <li>
            <strong>Çakışmayan Ekran Okuyucu Desteği:</strong> Kendi ses sentezleyicimizi zorla konuşturmak yerine tarayıcı ve ekran okuyucunuzun doğal aria-live sistemini kullanıyoruz.
          </li>
          <li>
            <strong>İzinsiz Ses Çalınmaz:</strong> Hiçbir sayfada otomatik açılan müzik ya da efekt yoktur; sesler sadece sizin onayınızla başlatılır.
          </li>
          <li>
            <strong>WCAG 2.2 AA Uyumu:</strong> Belirgin odak çerçeveleri, yüksek renk kontrastı, semantik başlık ağacı ve atlama bağlantısı standarttır.
          </li>
        </ul>
      </section>
    </div>
  );
}
