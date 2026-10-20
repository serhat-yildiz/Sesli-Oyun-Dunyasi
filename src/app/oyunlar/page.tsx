import React from 'react';
import { getAllGames } from '@/games/registry';
import GameCard from '@/components/GameCard';

export const metadata = {
  title: 'Oyunlar - Sesli Oyun Dünyası',
};

export default function GamesListPage() {
  const games = getAllGames();

  return (
    <div>
      <header>
        <h1>Oyun Kütüphanesi</h1>
        <p style={{ fontSize: '1.1rem' }}>
          Platformda bulunan tüm sesli oyunların kataloğu. Şu anda mevcut 3 prototip oyunumuz bulunmaktadır.
          Tüm oyunlar geliştirme aşamasında olup &ldquo;Yakında&rdquo; olarak listelenmiştir. Detaylarına girip kontrollerini ve nasıl oynandığını inceleyebilirsiniz.
        </p>
      </header>

      <section aria-labelledby="all-games-heading" style={{ marginTop: '2rem' }}>
        <h2 id="all-games-heading" className="sr-only">Mevcut Oyunlar Listesi</h2>
        <div className="card-grid">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      <section aria-labelledby="game-categories-heading" style={{ marginTop: '3.5rem' }}>
        <h2 id="game-categories-heading">Oyun Türleri Hakkında</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          <div className="card">
            <h3 style={{ color: '#f87171' }}>Korku ve Gerilim</h3>
            <p>
              Yalnızca seslere güvenerek karanlık ortamlarda hayatta kalmaya çalıştığınız, kalp atışlarınızı hızlandıracak oyunlar.
            </p>
          </div>
          <div className="card">
            <h3 style={{ color: '#34d399' }}>Macera ve Keşif</h3>
            <p>
              Çevre seslerini dinleyerek rotanızı belirlediğiniz, yeni dünyaları ses haritalarıyla keşfettiğiniz interaktif hikayeler.
            </p>
          </div>
          <div className="card">
            <h3 style={{ color: '#60a5fa' }}>Bulmaca ve Zeka</h3>
            <p>
              Müzik notaları, frekans dalgaları ve akustik desenleri eşleştirerek mantık yürüttüğünüz bulmacalar.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
