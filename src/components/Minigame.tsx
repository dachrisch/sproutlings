import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { playCoin } from '../audio';
import type { Stat } from '../types';

const FILL_DURATION_MS = 2000;
const SWEET_SPOT_START = 0.4;
const SWEET_SPOT_END = 0.65;

const STAT_FLAVOR: Record<Stat, { emoji: string; verb: string }> = {
  vigor: { emoji: '💪', verb: 'Pull!' },
  zip: { emoji: '⚡', verb: 'Go!' },
  bond: { emoji: '❤️', verb: 'Cuddle!' },
};

export function Minigame({ uid, stat }: { uid: string; stat: Stat }) {
  const closeMinigame = useGameStore((s) => s.closeMinigame);
  const finishMinigame = useGameStore((s) => s.finishMinigame);
  const sound = useGameStore((s) => s.settings.sound);

  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'done'>('playing');
  const [result, setResult] = useState<'well-timed' | 'rough' | null>(null);
  const animRef = useRef<number>(0);
  const startTime = useRef(Date.now());
  const tapped = useRef(false);

  const flavor = STAT_FLAVOR[stat];

  useEffect(() => {
    startTime.current = Date.now();
    tapped.current = false;

    function animate() {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min(elapsed / FILL_DURATION_MS, 1);
      setProgress(pct);

      if (pct < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPhase('done');
        setResult('rough');
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [uid, stat]);

  const handleTap = useCallback(() => {
    if (tapped.current || phase === 'done') return;
    tapped.current = true;
    cancelAnimationFrame(animRef.current);

    setPhase('done');
    const wellTimed = progress >= SWEET_SPOT_START && progress <= SWEET_SPOT_END;
    setResult(wellTimed ? 'well-timed' : 'rough');
  }, [progress, phase]);

  useEffect(() => {
    if (phase === 'done' && result) {
      const timer = setTimeout(() => {
        const res = finishMinigame(uid, stat, result === 'well-timed');
        if (res && sound) playCoin();
        closeMinigame();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, result, uid, stat, finishMinigame, closeMinigame, sound]);

  const fillWidth = `${progress * 100}%`;
  const sweetLeft = `${SWEET_SPOT_START * 100}%`;
  const sweetWidth = `${(SWEET_SPOT_END - SWEET_SPOT_START) * 100}%`;

  return (
    <div className="minigame-overlay" onClick={phase === 'done' ? undefined : handleTap}>
      <div className="minigame-card">
        <h3 className="minigame-title">
          {flavor.emoji} {stat.charAt(0).toUpperCase() + stat.slice(1)}: {STAT_FLAVOR[stat].verb}
        </h3>

        <div className="minigame-gauge">
          <div className="gauge-track">
            <div className="gauge-sweet-spot" style={{ left: sweetLeft, width: sweetWidth }} />
            <div className="gauge-fill" style={{ width: fillWidth }} />
          </div>
        </div>

        <div className="minigame-status">
          {phase === 'playing' && <p className="minigame-prompt">Tap when the bar is in the sweet spot!</p>}
          {result === 'well-timed' && <p className="minigame-result result-great">Perfect timing! +8 XP</p>}
          {result === 'rough' && <p className="minigame-result result-ok">Good effort! +4 XP</p>}
        </div>

        {phase === 'playing' && (
          <button className="minigame-tap-btn" onClick={handleTap} type="button">
            {flavor.verb}
          </button>
        )}
      </div>
    </div>
  );
}
