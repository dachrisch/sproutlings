import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Plot } from '../types';

interface PlotCellProps {
  plot: Plot;
}

function formatTime(ms: number): string {
  if (ms < 1000) return '1s';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${sec % 60}s`;
}

export function PlotCell({ plot }: PlotCellProps) {
  const plantSeed = useGameStore((s) => s.plantSeed);
  const waterPlotAct = useGameStore((s) => s.waterPlot);
  const hatchFn = useGameStore((s) => s.hatchPlot);
  const seeds = useGameStore((s) => s.seeds);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);

  const [now, setNow] = useState(Date.now());
  const [burst, setBurst] = useState<'hatching' | 'watered' | null>(null);
  const [waterCooldown, setWaterCooldown] = useState(false);

  useEffect(() => {
    if (plot.state !== 'growing') return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [plot.state, plot.id]);

  useEffect(() => {
    if (plot.state === 'growing' && plot.wateredAt) {
      const remaining = plot.wateredAt + 10_000 - Date.now();
      if (remaining > 0) {
        setWaterCooldown(true);
        const id = setTimeout(() => setWaterCooldown(false), remaining);
        return () => clearTimeout(id);
      }
    }
    setWaterCooldown(false);
  }, [plot.state, plot.wateredAt, plot.id]);

  const handleTap = useCallback(() => {
    if (plot.state === 'empty') {
      const ok = plantSeed(plot.id);
      if (!ok && seeds === 0) {
        useGameStore.setState({ notification: 'No seeds left! Buy some in the shop.' });
      }
    } else if (plot.state === 'growing') {
      if (waterCooldown) {
        useGameStore.setState({ notification: 'Watering on cooldown — wait a moment!' });
        return;
      }
      const ok = waterPlotAct(plot.id);
      if (ok) {
        setBurst('watered');
        setTimeout(() => setBurst(null), 500);
      } else {
        useGameStore.setState({ notification: 'Watering on cooldown — wait a moment!' });
      }
    } else if (plot.state === 'ready') {
      setBurst('hatching');
      setTimeout(() => {
        setBurst(null);
        const result = hatchFn(plot.id);
        if (result) {
          const sparkleTag = result.sparkle ? '✨ Sparkle ' : '';
          const newTag = result.isNewNormal ? ' New discovery! +🪙' : '';
          const sparkleNewTag = result.isNewSparkle ? ' ✨ New Sparkle! +🪙' : '';
          useGameStore.setState({
            notification: `You got ${sparkleTag}${result.speciesName}!${newTag}${sparkleNewTag}`,
          });
        }
      }, reducedMotion ? 0 : 600);
    }
  }, [plot, plantSeed, waterPlotAct, hatchFn, seeds, waterCooldown, reducedMotion]);

  const progress =
    plot.state === 'growing' && plot.plantedAt && plot.growMs
      ? Math.min((now - plot.plantedAt) / plot.growMs, 1)
      : 0;

  const remaining =
    plot.state === 'growing' && plot.plantedAt && plot.growMs
      ? Math.max(plot.growMs - (now - plot.plantedAt), 0)
      : 0;

  if (burst === 'hatching') {
    return (
      <button className="plot plot-hatching" type="button">
        <div className="hatch-pop">
          <svg width="56" height="64" viewBox="0 0 40 48">
            <ellipse cx="20" cy="26" rx="14" ry="18" fill="#f5dbb1" stroke="#e8c89a" strokeWidth="2" />
            <ellipse cx="20" cy="20" rx="10" ry="12" fill="#fce4c8" />
          </svg>
          <div className="hatch-sparkles">
            <span className="hatch-star" style={{ top: '10%', left: '10%' }}>✦</span>
            <span className="hatch-star" style={{ top: '5%', right: '15%' }}>✦</span>
            <span className="hatch-star" style={{ bottom: '20%', left: '20%' }}>✦</span>
            <span className="hatch-star" style={{ bottom: '10%', right: '10%' }}>✦</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button className={`plot plot-${plot.state}`} onClick={handleTap} type="button">
      {burst === 'watered' && (
        <div className="water-splash">
          <svg width="60" height="50" viewBox="0 0 60 50">
            <circle cx="30" cy="30" r="4" fill="#7ec8e3" opacity="0.8" className="drop-1" />
            <circle cx="18" cy="22" r="3" fill="#7ec8e3" opacity="0.7" className="drop-2" />
            <circle cx="42" cy="20" r="3" fill="#7ec8e3" opacity="0.7" className="drop-3" />
            <circle cx="26" cy="16" r="2" fill="#7ec8e3" opacity="0.6" className="drop-4" />
            <circle cx="38" cy="28" r="2" fill="#7ec8e3" opacity="0.6" className="drop-5" />
          </svg>
        </div>
      )}
      {plot.state === 'empty' && (
        <div className="plot-inner">
          {seeds > 0 ? (
            <>
              <span className="plot-icon-soil">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <ellipse cx="20" cy="28" rx="16" ry="6" fill="#a67b55" />
                  <ellipse cx="20" cy="26" rx="14" ry="5" fill="#c4956a" />
                </svg>
              </span>
              <span className="plot-label">Tap to plant!</span>
            </>
          ) : (
            <>
              <span className="plot-icon">+</span>
              <span className="plot-label">No seeds</span>
            </>
          )}
        </div>
      )}
      {plot.state === 'growing' && burst !== 'watered' && (
        <div className="plot-inner">
          <div className="progress-ring">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="#d4cfc4" strokeWidth="4" />
              <circle
                cx="26" cy="26" r="22"
                fill="none" stroke="#6abf69" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress)}`}
                transform="rotate(-90 26 26)"
                strokeLinecap="round"
              />
            </svg>
            <div className="progress-inner">
              <span className="sprout-icon">🌱</span>
            </div>
          </div>
          <span className="plot-label">{formatTime(remaining)}</span>
          {waterCooldown && <span className="cooldown-hint">💧...</span>}
        </div>
      )}
      {plot.state === 'ready' && (
        <div className="plot-inner plot-egg">
          <svg width="46" height="54" viewBox="0 0 40 48">
            <ellipse cx="20" cy="26" rx="14" ry="18" fill="#f5dbb1" stroke="#e8c89a" strokeWidth="2" />
            <ellipse cx="20" cy="20" rx="10" ry="12" fill="#fce4c8" />
            <circle cx="15" cy="22" r="2.5" fill="#333" />
            <circle cx="25" cy="22" r="2.5" fill="#333" />
            <path d="M17,28 Q20,32 23,28" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="plot-label">Hatch!</span>
        </div>
      )}
    </button>
  );
}
