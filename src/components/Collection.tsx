import { useGameStore } from '../store/gameStore';
import { SPECIES } from '../data/species';
import { CreatureSVG } from './Creature';

export function Collection() {
  const dex = useGameStore((s) => s.dex);
  const found = Object.values(dex).filter((e) => e.normal).length;
  const total = SPECIES.length;
  const pct = Math.round((found / total) * 100);

  return (
    <section className="view collection-view">
      <h2 className="section-title">Collection</h2>
      <div className="dex-progress-bar">
        <div className="dex-progress-fill" style={{ width: `${pct}%` }} />
        <span className="dex-progress-text">{found} / {total}</span>
      </div>
      {found === total && (
        <p className="dex-complete">You found them all! ⭐</p>
      )}
      <div className="dex-grid">
        {SPECIES.map((species) => {
          const entry = dex[species.id];
          const discovered = !!entry?.normal;
          return (
            <div key={species.id} className={`dex-cell ${discovered ? 'discovered' : 'unknown'}`}>
              {discovered ? (
                <CreatureSVG species={species} sparkle={false} size={52} />
              ) : (
                <div className="dex-silhouette">
                  <svg width="40" height="40" viewBox="0 0 100 100">
                    <circle cx="50" cy="55" r="24" fill="#d0ccc4" />
                    <circle cx="38" cy="52" r="5" fill="#c4bfb6" />
                    <circle cx="62" cy="52" r="5" fill="#c4bfb6" />
                  </svg>
                </div>
              )}
              <span className="dex-name">{discovered ? species.name : '???'}</span>
              {discovered && (
                <span className={`dex-rarity ${species.rarity}`}>{species.rarity}</span>
              )}
              {entry?.sparkle && <span className="dex-sparkle-badge">✨</span>}
              {discovered && !entry?.sparkle && <span className="dex-sparkle-empty" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
