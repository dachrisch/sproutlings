import { useGameStore } from '../store/gameStore';
import { SPECIES_MAP } from '../data/species';
import { CreatureSVG } from './Creature';
import { Minigame } from './Minigame';
import {
  NURSERY_SLOTS, FEED_AMOUNT, PLAY_AMOUNT,
  TRAIN_COOLDOWN_MS,
} from '../constants';
import type { Stat, OwnedCreature } from '../types';

const STAT_ICON: Record<Stat, string> = {
  vigor: '💪',
  zip: '⚡',
  bond: '❤️',
};
const STAT_LABEL: Record<Stat, string> = {
  vigor: 'Vigor',
  zip: 'Zip',
  bond: 'Bond',
};
function FullnessBar({ value }: { value: number }) {
  return (
    <div className="need-bar">
      <span className="need-label">🍽️</span>
      <div className="need-track">
        <div className="need-fill fullness-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="need-value">{value}</span>
    </div>
  );
}

function EnergyBar({ value }: { value: number }) {
  return (
    <div className="need-bar">
      <span className="need-label">🔋</span>
      <div className="need-track">
        <div className="need-fill energy-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="need-value">{value}</span>
    </div>
  );
}

function StatRow({ label, icon, value }: { label: string; icon: string; value: number }) {
  return (
    <div className="stat-row">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function CooldownTimer({ lastTime }: { lastTime?: number }) {
  if (!lastTime) return null;
  const now = Date.now();
  const remaining = TRAIN_COOLDOWN_MS - (now - lastTime);
  if (remaining <= 0) return null;
  const secs = Math.ceil(remaining / 1000);
  if (secs > 120) return <span className="cooldown-badge">{Math.ceil(secs / 60)}m</span>;
  return <span className="cooldown-badge">{secs}s</span>;
}

function NurseryCreatureCard({ uid }: { uid: string }) {
  const creature = useGameStore((s) => s.creatures.find((c) => c.uid === uid));
  const inventory = useGameStore((s) => s.inventory);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const feed = useGameStore((s) => s.feed);
  const play = useGameStore((s) => s.play);
  const canTrain = useGameStore((s) => s.canTrain);
  const startMinigame = useGameStore((s) => s.startMinigame);
  const spar = useGameStore((s) => s.spar);
  const moveToReserve = useGameStore((s) => s.moveToReserve);

  if (!creature) return null;
  const species = SPECIES_MAP[creature.speciesId];
  if (!species) return null;

  const stats: Stat[] = ['vigor', 'zip', 'bond'];
  const now = Date.now();

  return (
    <div className={`nursery-card ${creature.stage}`}>
      <div className="nursery-card-header">
        <CreatureSVG
          species={species}
          sparkle={creature.sparkle}
          hat={creature.hat}
          size={56}
          animate={!reducedMotion}
          stage={creature.stage}
          track={creature.track ?? undefined}
        />
        <div className="nursery-card-info">
          <span className="nursery-card-name">
            {species.name}
            {creature.sparkle && ' ✨'}
          </span>
          <span className="nursery-card-stage">
            {creature.stage.charAt(0).toUpperCase() + creature.stage.slice(1)}
            {creature.track ? ` · ${species.forms[creature.track]?.label ?? creature.track}` : ''}
          </span>
        </div>
        <button
          className="nursery-reserve-btn"
          onClick={() => moveToReserve(creature.uid)}
          type="button"
          title="Move to Reserve"
        >
          📦
        </button>
      </div>

      <div className="nursery-needs">
        <FullnessBar value={creature.fullness} />
        <EnergyBar value={creature.energy} />
      </div>

      <div className="nursery-stats">
        {stats.map((stat) => (
          <StatRow
            key={stat}
            label={STAT_LABEL[stat]}
            icon={STAT_ICON[stat]}
            value={creature.stats[stat]}
          />
        ))}
      </div>

      <div className="nursery-actions">
        <div className="nursery-care-actions">
          <button
            className="care-btn feed-btn"
            onClick={() => feed(creature.uid)}
            disabled={inventory.food < 1 || creature.fullness >= 100}
            type="button"
            title={`Feed (+${FEED_AMOUNT} Fullness)`}
          >
            🍽️ Feed
          </button>
          <button
            className="care-btn play-btn"
            onClick={() => play(creature.uid)}
            disabled={inventory.toys < 1 || creature.energy >= 100}
            type="button"
            title={`Play (+${PLAY_AMOUNT} Energy)`}
          >
            🧸 Play
          </button>
        </div>
        {creature.stage !== 'adult' && (
          <div className="nursery-train-actions">
            {stats.map((stat) => {
              const check = canTrain(creature.uid, stat);
              const lastTime = creature.cooldowns[stat];
              const hasCooldown = lastTime && (now - lastTime) < TRAIN_COOLDOWN_MS;
              return (
                <button
                  key={stat}
                  className={`train-btn train-${stat}`}
                  onClick={() => startMinigame(creature.uid, stat)}
                  disabled={!check.ok}
                  type="button"
                  title={check.reason ?? `Train ${STAT_LABEL[stat]}`}
                >
                  {STAT_ICON[stat]} {STAT_LABEL[stat]}
                  {hasCooldown && <CooldownTimer lastTime={lastTime} />}
                </button>
              );
            })}
            {(creature.stats.vigor > 0 || creature.stats.zip > 0) && (
              <div className="spar-row">
                {(['vigor', 'zip'] as Stat[]).map((stat) => {
                  const check = canTrain(creature.uid, stat);
                  const lastTime = creature.cooldowns[stat];
                  const hasCooldown = lastTime && (now - lastTime) < TRAIN_COOLDOWN_MS;
                  return (
                    <button
                      key={`spar-${stat}`}
                      className="spar-btn"
                      onClick={() => spar(creature.uid, stat)}
                      disabled={!check.ok || creature.energy < 20}
                      type="button"
                      title={`Spar (${STAT_LABEL[stat]})`}
                    >
                      ⚔️ Spar {STAT_LABEL[stat]}
                      {hasCooldown && <CooldownTimer lastTime={lastTime} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Nursery() {
  const creatures = useGameStore((s) => s.creatures);
  const minigame = useGameStore((s) => s.minigame);

  const nurseryCreatures = creatures.filter((c) => c.location === 'nursery');
  const reserveCreatures = creatures.filter((c) => c.location === 'reserve');
  const emptySlots = NURSERY_SLOTS - nurseryCreatures.length;

  return (
    <section className="view nursery-view">
      <h2 className="section-title">Nursery</h2>
      <p className="nursery-subtitle">
        Raise your creatures by feeding, playing, and training them.
      </p>

      <div className="nursery-slots">
        {nurseryCreatures.map((c) => (
          <NurseryCreatureCard key={c.uid} uid={c.uid} />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className="nursery-slot-empty">
            <span className="nursery-slot-empty-icon">🥚</span>
            <span className="nursery-slot-empty-text">Empty slot</span>
          </div>
        ))}
      </div>

      {reserveCreatures.length > 0 && (
        <ReservePanel creatures={reserveCreatures} />
      )}

      {minigame && <Minigame uid={minigame.uid} stat={minigame.stat} />}
    </section>
  );
}

function ReservePanel({ creatures }: { creatures: OwnedCreature[] }) {
  const moveToNursery = useGameStore((s) => s.moveToNursery);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const nurseryCount = useGameStore((s) => s.creatures.filter((c) => c.location === 'nursery').length);
  const slotsFull = nurseryCount >= NURSERY_SLOTS;

  return (
    <div className="reserve-panel">
      <h3 className="reserve-title">Reserve ({creatures.length})</h3>
      <p className="reserve-hint">Tap a creature to swap it into the Nursery.</p>
      <div className="reserve-grid">
        {creatures.map((c) => {
          const species = SPECIES_MAP[c.speciesId];
          if (!species) return null;
          return (
            <button
              key={c.uid}
              className="reserve-card"
              onClick={() => {
                if (!slotsFull) moveToNursery(c.uid);
              }}
              disabled={slotsFull}
              type="button"
              title={slotsFull ? 'Nursery is full — move one out first' : 'Move to Nursery'}
            >
              <CreatureSVG
                species={species}
                sparkle={c.sparkle}
                hat={c.hat}
                size={44}
                animate={!reducedMotion}
                stage={c.stage}
                track={c.track ?? undefined}
              />
              <span className="reserve-name">{species.name}</span>
              <span className="reserve-stage">
                {c.stage.charAt(0).toUpperCase() + c.stage.slice(1)}
                {c.track ? ` · ${species.forms[c.track]?.label ?? c.track}` : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
