import { useState } from 'react';
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
  const sound = useGameStore((s) => s.settings.sound);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const toggleReducedMotion = useGameStore((s) => s.toggleReducedMotion);
  const [showSettings, setShowSettings] = useState(false);

  const found = Object.values(dex).filter((e) => e.normal).length;
  const total = 16;

  return (
    <header className="topbar">
      <div className="topbar-stats">
        <span className="stat">🪙 {Math.floor(coins)}</span>
        <span className="stat">🌱 {seeds}</span>
        <span className="stat">📋 {found}/{total}</span>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          type="button"
          aria-label="Settings"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <label className="setting-row">
            <span>Sound</span>
            <button
              className={`toggle ${sound ? 'on' : 'off'}`}
              onClick={toggleSound}
              type="button"
            >
              {sound ? 'ON' : 'OFF'}
            </button>
          </label>
          <label className="setting-row">
            <span>Gentle mode</span>
            <button
              className={`toggle ${reducedMotion ? 'on' : 'off'}`}
              onClick={toggleReducedMotion}
              type="button"
            >
              {reducedMotion ? 'ON' : 'OFF'}
            </button>
          </label>
        </div>
      )}

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
