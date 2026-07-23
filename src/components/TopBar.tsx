import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SPECIES } from '../data/species';
import type { Tab } from '../types';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'zoo',         label: 'Zoo',         icon: '🏠' },
  { id: 'expeditions', label: 'Explore',  icon: '🗺️' },
  { id: 'collection',  label: 'Collection',   icon: '📋' },
  { id: 'shop',        label: 'Shop',         icon: '🏪' },
];

export function TopBar() {
  const coins = useGameStore((s) => s.coins);
  const creatures = useGameStore((s) => s.creatures);
  const dex = useGameStore((s) => s.dex);
  const tab = useGameStore((s) => s.tab);
  const setTab = useGameStore((s) => s.setTab);
  const sound = useGameStore((s) => s.settings.sound);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const toggleReducedMotion = useGameStore((s) => s.toggleReducedMotion);
  const resetGame = useGameStore((s) => s.resetGame);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const found = Object.values(dex).filter((e) => e.normal).length;
  const total = SPECIES.length;

  return (
    <header className="topbar">
      <div className="topbar-stats">
        <span className="stat">🪙 {Math.floor(coins)}</span>
        <span className="stat">🐾 {creatures.length}</span>
        <span className="stat">📋 {found}/{total}</span>
        <button
          className="settings-btn"
          onClick={() => { setShowSettings(!showSettings); setConfirmReset(false); }}
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
          <div className="setting-divider" />
          {confirmReset ? (
            <div className="setting-row reset-confirm">
              <span>Reset everything?</span>
              <button className="toggle reset-yes" onClick={() => { resetGame(); setConfirmReset(false); setShowSettings(false); }} type="button">Yes</button>
              <button className="toggle reset-no" onClick={() => setConfirmReset(false)} type="button">No</button>
            </div>
          ) : (
            <button className="setting-row reset-btn" onClick={() => setConfirmReset(true)} type="button">
              New game
            </button>
          )}
        </div>
      )}

      <nav className="topbar-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
