import { useGameStore } from '../state/store';
import creaturesData from '../data/creatures.json';
import type { CreatureDef } from '../types';
import { Sprite } from './components/Sprite';

const creatures = creaturesData as CreatureDef[];

export function CollectionScreen() {
  const caughtIds = useGameStore(s => s.caughtIds);
  const seenIds = useGameStore(s => s.seenIds);

  const total = creatures.length;
  const caught = caughtIds.length;

  const typeColors: Record<string, string> = {
    fire: '#ff6b35',
    water: '#4a9fff',
    grass: '#6abf69',
    stone: '#c4956a',
  };

  return (
    <div className="view collection-view">
      <div className="section-title">Collection</div>
      <div className="dex-progress-bar">
        <div
          className="dex-progress-fill"
          style={{ width: `${(caught / total) * 100}%` }}
        />
        <div className="dex-progress-text">{caught} / {total}</div>
      </div>

      <div className="dex-grid">
        {creatures.map(c => {
          const discovered = caughtIds.includes(c.id);
          const seen = seenIds.includes(c.id);

          return (
            <div
              key={c.id}
              className={`dex-cell ${discovered ? 'discovered' : seen ? 'seen' : 'unknown'}`}
            >
              <div
                className="dex-silhouette"
                style={{
                  background: discovered
                    ? `${typeColors[c.type]}22`
                    : seen
                    ? '#e8e4dc'
                    : '#f0ece6',
                  border: `2px solid ${discovered ? typeColors[c.type] : '#d4cfc4'}`,
                }}
              >
                {discovered && (
                  <Sprite creatureId={c.id} variant="face" size={48} />
                )}
                {!discovered && seen && (
                  <span style={{ fontSize: '1.2rem', opacity: 0.4 }}>?</span>
                )}
                {!discovered && !seen && (
                  <span style={{ fontSize: '1.2rem', opacity: 0.2 }}>?</span>
                )}
              </div>
              <div className="dex-name">
                {discovered ? c.name : '???'}
              </div>
              <div className="dex-rarity" style={{
                background: discovered ? '#d4edda' : '#e8e4dc',
                color: discovered ? '#155724' : '#7a6e6a',
              }}>
                {c.rarity}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
