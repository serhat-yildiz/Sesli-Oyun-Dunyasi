import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllGames, getGameBySlug } from '@/games/registry';
import GameCanvasSlot from '@/components/GameCanvasSlot';
import DarkCorridorGame from '@/games/DarkCorridorGame';
import LostCompassGame from '@/games/LostCompassGame';
import FrequencyHuntersGame from '@/games/FrequencyHuntersGame';
import AudioTennisGame from '@/games/AudioTennisGame';

interface GamePageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const games = getAllGames();
  return games.map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({ params }: GamePageProps) {
  const { slug } = params;
  const game = getGameBySlug(slug);

  if (!game) {
    return {
      title: 'Oyun Bulunamadı',
    };
  }

  return {
    title: `${game.title} (${game.category}) - Sesli Oyun Dünyası`,
    description: game.shortDescription,
  };
}

export default async function GameDetailPage({ params }: GamePageProps) {
  const { slug } = params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/oyunlar" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
          &larr; Oyunlar Listesine Geri Dön
        </Link>
      </div>

      <header>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span className="badge">{game.category}</span>
          <span className="badge badge-soon">Geliştirme Aşamasında / İskelet</span>
        </div>
        <h1>{game.title}</h1>
        <p style={{ fontSize: '1.15rem' }}>{game.shortDescription}</p>
      </header>

      {/* Kulaklık Önerisi Uyarısı */}
      {game.recommendedHeadphones && (
        <div className="alert-box" role="region" aria-label="Donanım Gereksinimi">
          <p>
            <strong>🎧 Kulaklık Önerilir:</strong> {game.title} oyunu, sağ ve sol kulaktan gelen 3D ses konumlandırması üzerine kuruludur.
            En iyi tecrübe ve seslerin yönünü doğru kestirebilmek için stereo kulaklık kullanmanız önemle rica olunur.
          </p>
        </div>
      )}

      {/* Korku / İçerik Uyarısı */}
      {game.contentWarnings && game.contentWarnings.length > 0 && (
        <div
          role="region"
          aria-label="İçerik Uyarısı"
          style={{
            backgroundColor: '#450a0a',
            border: '2px solid #ef4444',
            color: '#fee2e2',
            padding: '1.25rem',
            borderRadius: 'var(--border-radius)',
            margin: '1.5rem 0',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#fca5a5' }}>
            ⚠️ İçerik Uyarısı
          </h2>
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {game.contentWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Nasıl Oynanır Bölümü */}
      <section aria-labelledby="how-to-play-heading" style={{ marginTop: '2.5rem' }}>
        <h2 id="how-to-play-heading">Nasıl Oynanır?</h2>
        <ol style={{ paddingLeft: '1.25rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
          {game.howToPlay.map((step, idx) => (
            <li key={idx} style={{ marginBottom: '0.4rem' }}>{step}</li>
          ))}
        </ol>
      </section>

      {/* Kontroller / Tuş Listesi Tablosu */}
      <section aria-labelledby="controls-heading" style={{ marginTop: '2.5rem' }}>
        <h2 id="controls-heading">Tuş Kontrolleri</h2>
        <p>Aşağıdaki tuşlar oyun oturumu aktif olduğunda doğrudan klavyenizden dinlenir:</p>
        <table className="key-table" aria-label={`${game.title} klavye kontrol tuşları`}>
          <thead>
            <tr>
              <th scope="col" style={{ width: '40%' }}>Tuş</th>
              <th scope="col">Gerçekleştirdiği Eylem</th>
            </tr>
          </thead>
          <tbody>
            {game.keyBindings.map((kb, idx) => (
              <tr key={idx}>
                <td>
                  <kbd className="key-badge">{kb.key}</kbd>
                </td>
                <td>{kb.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Oyun Alanı ve Başlatma Yuvası (Escape altyapısı ve ses entegrasyonuyla) */}
      {game.slug === 'karanlik-koridor' ? (
        <DarkCorridorGame />
      ) : game.slug === 'kayip-pusula' ? (
        <LostCompassGame />
      ) : game.slug === 'frekans-avcilari' ? (
        <FrequencyHuntersGame />
      ) : game.slug === 'akustik-tenis' ? (
        <AudioTennisGame />
      ) : (
        <GameCanvasSlot game={game} />
      )}
    </div>
  );
}
