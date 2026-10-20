import React from 'react';
import Link from 'next/link';
import { GameDefinition } from '@/games/types';

interface GameCardProps {
  game: GameDefinition;
}

export default function GameCard({ game }: GameCardProps) {
  const getBadgeClass = (category: string) => {
    switch (category) {
      case 'Korku':
        return 'badge badge-korku';
      case 'Macera':
        return 'badge badge-macera';
      case 'Bulmaca':
        return 'badge badge-bulmaca';
      case 'Spor':
        return 'badge badge-spor';
      case 'Hikaye':
        return 'badge badge-hikaye';
      default:
        return 'badge';
    }
  };

  return (
    <article className="card" aria-labelledby={`game-title-${game.slug}`}>
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={getBadgeClass(game.category)}>
            {game.category}
          </span>
          {game.status === 'coming-soon' && (
            <span className="badge badge-soon">
              Yakında
            </span>
          )}
        </div>

        <h3 id={`game-title-${game.slug}`}>
          {game.title}
        </h3>

        <p>{game.shortDescription}</p>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <Link
          href={`/oyunlar/${game.slug}`}
          className="btn btn-secondary"
          style={{ width: '100%', textAlign: 'center' }}
          aria-label={`${game.title} oyununun detaylarını incele ve hazır ol`}
        >
          Detayları İncele & Oyna
        </Link>
      </div>
    </article>
  );
}
