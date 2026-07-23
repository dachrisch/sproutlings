import { useGameStore } from '../state/store';
import biomesData from '../data/biomes.json';
import { BIOME_BOSS_WINS_REQUIRED } from '../constants';
import type { BiomeDef } from '../types';

const biomes = biomesData as BiomeDef[];

export function BiomeSelect() {
  const unlockedBiomes = useGameStore(s => s.unlockedBiomes);
  const startBattle = useGameStore(s => s.startBattle);
  const party = useGameStore(s => s.party);
  const bossWins = useGameStore(s => s.bossWins);

  if (party.length === 0) {
    return (
      <div className="view" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>
          No creatures!
        </div>
        <div style={{ fontSize: '0.85rem', color: '#7a6e6a' }}>
          Your party is empty. Start a new game.
        </div>
      </div>
    );
  }

  return (
    <div className="view biome-view">
      <div className="section-title">Choose a biome</div>
      <div style={{ fontSize: '0.85rem', color: '#7a6e6a', marginBottom: 16, fontWeight: 600 }}>
        Explore different areas to find wild creatures!
      </div>
      <div className="biome-list">
        {biomes.map(biome => {
          const unlocked = unlockedBiomes.includes(biome.id);
          const isBossReady = biome.boss && bossWins >= BIOME_BOSS_WINS_REQUIRED;

          return (
            <div
              key={biome.id}
              className={`biome-card ${!unlocked ? 'biome-locked' : ''} ${isBossReady ? 'biome-boss' : ''}`}
            >
              {!unlocked ? (
                <div className="biome-locked-icon">🔒</div>
              ) : (
                <>
                  <div className="biome-name">{biome.name}</div>
                  <div className="biome-level">
                    Lv.{biome.levelRange[0]}–{biome.levelRange[1]}
                  </div>
                  <div className="biome-encounters">
                    {biome.encounters.map(e => (
                      <span key={e.creature} className="biome-encounter-pill">
                        {e.creature}
                      </span>
                    ))}
                  </div>
                  <div className="biome-buttons">
                    <button
                      className="action-btn"
                      onClick={() => startBattle(biome.id, false)}
                      type="button"
                    >
                      Explore
                    </button>
                    {biome.boss && (
                      <button
                        className="action-btn boss-btn"
                        onClick={() => startBattle(biome.id, true)}
                        type="button"
                      >
                        Boss ({bossWins}/{BIOME_BOSS_WINS_REQUIRED})
                      </button>
                    )}
                  </div>
                </>
              )}
              {!unlocked && biome.unlockedBy && (
                <div className="biome-locked-text">
                  Defeat the {biomes.find(b => b.id === biome.unlockedBy)?.name ?? biome.unlockedBy} boss
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
