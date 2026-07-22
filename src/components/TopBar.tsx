import { useGameStore } from '../store/gameStore';
import type { Tab } from '../types';

const tabs: { id: Tab; label: string }[] = [
  { id: 'garden',     label: 'Garden' },
  { id: 'collection', label: 'Collection' },
  { id: 'shop',       label: 'Shop' },
];

export function TopBar() {
  const coins = useGameStore((s) => s.coins);
  const seeds = useGameStore((s) => s.seeds);
  const dex = useGameStore((s) => s.dex);
  const tab = useGameStore((s) => s.tab);
  const setTab = useGameStore((s) => s.setTab);

  const found = Object.values(dex).filter((e) => e.normal).length;
  const total = 16;

  return (
    <header className="topbar">
      <div className="topbar-stats">
        <span className="stat">🪙 {Math.floor(coins)}</span>
        <span className="stat">🌱 {seeds}</span>
        <span className="stat">{found} / {total}</span>
      </div>
      <nav className="topbar-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
