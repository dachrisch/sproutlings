import { useGameStore } from '../state/store';
import { Sprite } from './components/Sprite';
import { HpBar } from './components/HpBar';
import creaturesData from '../data/creatures.json';
import type { CreatureDef } from '../types';

const creatures = creaturesData as CreatureDef[];

export function PartyScreen() {
  const party = useGameStore(s => s.party);
  const healAll = useGameStore(s => s.healAll);
  const setTab = useGameStore(s => s.setTab);

  if (party.length === 0) {
    return (
      <div className="view" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>
          Empty party
        </div>
        <div style={{ fontSize: '0.85rem', color: '#7a6e6a' }}>
          Explore biomes to find and catch creatures!
        </div>
        <button
          className="action-btn"
          style={{ marginTop: 16 }}
          onClick={() => setTab('biomes')}
          type="button"
        >
          Explore
        </button>
      </div>
    );
  }

  return (
    <div className="view party-view">
      <div className="section-title">Your Party</div>
      <div className="party-list">
        {party.map((creature, idx) => {
          const def = creatures.find(c => c.id === creature.creatureId);
          const hpPct = creature.maxHp > 0 ? creature.currentHp / creature.maxHp : 0;

          return (
            <div key={`${creature.creatureId}-${idx}`} className="party-card">
              <Sprite
                creatureId={creature.creatureId}
                variant="face"
                size={48}
              />
              <div className="party-info">
                <div className="party-name-row">
                  <span className="party-nickname">{creature.nickname}</span>
                  <span className="party-level">Lv.{creature.level}</span>
                </div>
                <div className="party-species">{def?.name ?? creature.creatureId}</div>
                <div className="party-stats">
                  <span className="party-stat">ATK {creature.atk}</span>
                  <span className="party-stat">DEF {creature.def}</span>
                  <span className="party-stat">SPD {creature.spd}</span>
                </div>
                <HpBar
                  current={creature.currentHp}
                  max={creature.maxHp}
                  creatureType={def?.type ?? 'stone'}
                />
                {hpPct <= 0 && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e74c3c' }}>
                    Fainted
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {party.some(c => c.currentHp < c.maxHp) && (
        <button
          className="action-btn"
          style={{ width: '100%', marginTop: 12, padding: 14 }}
          onClick={healAll}
          type="button"
        >
          Heal All
        </button>
      )}
    </div>
  );
}
