import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { playCoin, playDiscovery } from '../audio';
import { EXPEDITION_COST } from '../constants';
import type { ExpeditionSlot } from '../types';

function formatTime(ms: number): string {
  if (ms < 1000) return '1s';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${sec % 60}s`;
}

function ExpeditionSlotCard({ slot }: { slot: ExpeditionSlot }) {
  const startExpedition = useGameStore((s) => s.startExpedition);
  const collectExpedition = useGameStore((s) => s.collectExpedition);
  const coins = useGameStore((s) => s.coins);
  const sound = useGameStore((s) => s.settings.sound);

  const [now, setNow] = useState(Date.now());
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    if (slot.state !== 'exploring') return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [slot.state, slot.id]);

  const handleTap = useCallback(() => {
    if (slot.state === 'idle') {
      startExpedition(slot.id);
    } else if (slot.state === 'returned' && !collecting) {
      setCollecting(true);
      setTimeout(() => {
        const result = collectExpedition(slot.id);
        if (result) {
          if (result.bonus > 0) {
            if (sound) playDiscovery();
            if (sound) setTimeout(() => playCoin(), 300);
          } else if (sound) playCoin();
          const sparkleTag = result.sparkle ? '✨ Sparkle ' : '';
          const newTag = result.isNewNormal ? ' New discovery! +🪙' : '';
          const sparkleNewTag = result.isNewSparkle ? ' ✨ New Sparkle! +🪙' : '';
          useGameStore.setState({
            notification: `Expedition found ${sparkleTag}${result.speciesName}!${newTag}${sparkleNewTag} +${result.treasure}🪙 treasure`,
          });
        }
        setCollecting(false);
      }, 600);
    }
  }, [slot, startExpedition, collectExpedition, collecting, sound]);

  const progress = slot.state === 'exploring' && slot.startedAt && slot.durationMs
    ? Math.min((now - slot.startedAt) / slot.durationMs, 1)
    : 0;

  const remaining = slot.state === 'exploring' && slot.startedAt && slot.durationMs
    ? Math.max(slot.durationMs - (now - slot.startedAt), 0)
    : 0;

  if (collecting) {
    return (
      <div className="expedition-slot expedition-collecting">
        <div className="expedition-glow" />
        <div className="expedition-icon-large">🎒</div>
        <span className="expedition-label">Unpacking...</span>
      </div>
    );
  }

  return (
    <div className={`expedition-slot expedition-${slot.state}`}>
      {slot.state === 'idle' && (
        <button className="expedition-inner" onClick={handleTap} disabled={coins < EXPEDITION_COST} type="button">
          <span className="expedition-icon">🗺️</span>
          <span className="expedition-label">Start Expedition</span>
          <span className="expedition-cost">{EXPEDITION_COST}🪙</span>
          {coins < EXPEDITION_COST && <span className="expedition-nocoins">Not enough coins</span>}
        </button>
      )}
      {slot.state === 'exploring' && (
        <div className="expedition-inner">
          <div className="expedition-exploring-icon">
            <span className="expedition-icon">🧭</span>
          </div>
          <div className="expedition-progress-track">
            <div className="expedition-progress-fill" style={{ width: `${progress * 100}%` }} />
            <div className="expedition-marker" style={{ left: `${progress * 100}%` }}>
              🐾
            </div>
          </div>
          <span className="expedition-label">{formatTime(remaining)}</span>
        </div>
      )}
      {slot.state === 'returned' && (
        <button className="expedition-inner expedition-returned-btn" onClick={handleTap} type="button">
          <span className="expedition-icon expedition-bounce">🎁</span>
          <span className="expedition-label">Collect Discovery!</span>
        </button>
      )}
    </div>
  );
}

export function ExpeditionPost() {
  const slots = useGameStore((s) => s.expeditionSlots);
  const slotCount = useGameStore((s) => s.slotCount);

  return (
    <section className="view expedition-view">
      <h2 className="section-title">Expedition Post</h2>
      <p className="expedition-subtitle">
        Send expeditions to discover new creatures! Each expedition brings back a creature and treasure.
      </p>
      <div className="expedition-slots">
        {slots.map((slot) => (
          <ExpeditionSlotCard key={slot.id} slot={slot} />
        ))}
      </div>
      {slotCount > 0 && (
        <p className="expedition-cap">{slotCount} / 6 slots</p>
      )}
    </section>
  );
}
