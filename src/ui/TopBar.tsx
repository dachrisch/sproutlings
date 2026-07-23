import { useState } from 'react';
import { useGameStore } from '../state/store';
import type { Tab, CreatureDef } from '../types';
import creaturesData from '../data/creatures.json';

const tabs: { id: Tab; label: string }[] = [
  { id: 'biomes', label: 'Explore' },
  { id: 'care', label: 'Care' },
  { id: 'party', label: 'Party' },
  { id: 'collection', label: 'Dex' },
];

export function TopBar() {
  const tab = useGameStore(s => s.tab);
  const setTab = useGameStore(s => s.setTab);
  const balls = useGameStore(s => s.balls);
  const caughtIds = useGameStore(s => s.caughtIds);
  const party = useGameStore(s => s.party);
  const [showSettings, setShowSettings] = useState(false);

  const totalSpecies = (creaturesData as CreatureDef[]).length;
  const healAll = useGameStore(s => s.healAll);

  return (
    <header className="topbar">
      <div className="topbar-stats">
        <span className="stat">🎯 {balls}</span>
        <span className="stat">🐾 {party.length}</span>
        <span className="stat">📋 {caughtIds.length}/{totalSpecies}</span>
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
          <button
            className="action-btn"
            onClick={() => { healAll(); setShowSettings(false); }}
            type="button"
          >
            Heal All
          </button>
        </div>
      )}

      <nav className="topbar-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
