import { useGameStore } from '../store/gameStore';
import { SPECIES } from '../data/species';
import { CreatureSVG } from './Creature';
import type { Shape } from '../types';

function Silhouette({ hue, shape }: { hue: number; shape: Shape }) {
  const muted = `hsl(${hue}, 15%, 75%)`;
  const darker = `hsl(${hue}, 15%, 60%)`;

  switch (shape) {
    case 'eared':
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <polygon points="30,38 22,16 40,32" fill={muted} />
          <polygon points="70,38 78,16 60,32" fill={muted} />
          <circle cx="50" cy="56" r="24" fill={muted} />
        </svg>
      );
    case 'mushroom':
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <ellipse cx="50" cy="42" rx="28" ry="14" fill={muted} />
          <ellipse cx="50" cy="66" rx="18" ry="16" fill={darker} />
        </svg>
      );
    case 'horned':
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <path d="M35,40 L20,18 L42,36" fill={darker} />
          <path d="M65,40 L80,18 L58,36" fill={darker} />
          <circle cx="50" cy="58" r="24" fill={muted} />
        </svg>
      );
    case 'spiky': {
      const pts: string[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        pts.push(`${50 + 28 * Math.cos(a)},${56 + 28 * Math.sin(a)}`);
      }
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <polygon points={pts.join(' ')} fill={muted} />
          <circle cx="50" cy="56" r="18" fill={darker} />
        </svg>
      );
    }
    case 'star': {
      const pts: string[] = [];
      for (let i = 0; i < 5; i++) {
        const outer = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const inner = outer + Math.PI / 5;
        pts.push(`${50 + 22 * Math.cos(outer)},${56 + 22 * Math.sin(outer)}`);
        pts.push(`${50 + 10 * Math.cos(inner)},${56 + 10 * Math.sin(inner)}`);
      }
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <polygon points={pts.join(' ')} fill={muted} />
        </svg>
      );
    }
    case 'tall':
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <ellipse cx="50" cy="54" rx="20" ry="28" fill={muted} />
          <polygon points="40,30 50,18 60,30" fill={darker} />
        </svg>
      );
    case 'cloud':
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <circle cx="36" cy="58" r="14" fill={muted} />
          <circle cx="64" cy="58" r="14" fill={muted} />
          <circle cx="50" cy="48" r="16" fill={muted} />
          <circle cx="40" cy="46" r="10" fill={darker} />
          <circle cx="60" cy="46" r="10" fill={darker} />
        </svg>
      );
    case 'stone':
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <path d="M30,58 Q28,42 38,34 Q50,28 62,34 Q72,42 70,58 Q68,72 50,74 Q32,72 30,58Z" fill={muted} />
        </svg>
      );
    case 'sprout':
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <circle cx="50" cy="62" r="18" fill={muted} />
          <ellipse cx="45" cy="36" rx="5" ry="3" fill={darker} transform="rotate(-30 45 36)" />
          <ellipse cx="55" cy="38" rx="5" ry="3" fill={darker} transform="rotate(20 55 38)" />
        </svg>
      );
    case 'blob':
    case 'round':
    default:
      return (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <circle cx="50" cy="55" r="24" fill={muted} />
        </svg>
      );
  }
}

export function Collection() {
  const dex = useGameStore((s) => s.dex);
  const found = Object.values(dex).filter((e) => e.normal).length;
  const total = SPECIES.length;
  const pct = Math.round((found / total) * 100);

  const sparklesFound = Object.values(dex).filter((e) => e.sparkle).length;

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
      <p className="dex-sparkle-count">✨ Sparkles found: {sparklesFound}</p>
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
                  <Silhouette hue={species.hue} shape={species.shape} />
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
