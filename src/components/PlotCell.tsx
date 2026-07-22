import { useEffect, useState } from 'react';
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
  const waterPlot = useGameStore((s) => s.waterPlot);
  const hatchPlot = useGameStore((s) => s.hatchPlot);
  const seeds = useGameStore((s) => s.seeds);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (plot.state !== 'growing') return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [plot.state, plot.id]);

  const handleTap = () => {
    if (plot.state === 'empty') {
      const ok = plantSeed(plot.id);
      if (!ok && seeds === 0) {
        useGameStore.setState({ notification: 'No seeds left! Buy some in the shop.' });
      }
    } else if (plot.state === 'growing') {
      const ok = waterPlot(plot.id);
      if (!ok) {
        useGameStore.setState({ notification: 'Watering on cooldown — wait a moment!' });
      }
    } else if (plot.state === 'ready') {
      const result = hatchPlot(plot.id);
      if (result) {
        const sparkleTag = result.sparkle ? '✨ Sparkle ' : '';
        const newTag = result.isNewNormal ? ' New discovery! ' : '';
        const bonusTag = result.bonus > 0 ? ` +${result.bonus} coins` : '';
        useGameStore.setState({
          notification: `You hatched ${sparkleTag}${result.speciesName}!${newTag}${bonusTag}`,
        });
      }
    }
  };

  const progress =
    plot.state === 'growing' && plot.plantedAt && plot.growMs
      ? Math.min((now - plot.plantedAt) / plot.growMs, 1)
      : 0;

  const remaining =
    plot.state === 'growing' && plot.plantedAt && plot.growMs
      ? Math.max(plot.growMs - (now - plot.plantedAt), 0)
      : 0;

  return (
    <button className={`plot plot-${plot.state}`} onClick={handleTap} type="button">
      {plot.state === 'empty' && (
        <div className="plot-inner">
          <span className="plot-icon">+</span>
          <span className="plot-label">Plant</span>
        </div>
      )}
      {plot.state === 'growing' && (
        <div className="plot-inner">
          <div className="progress-ring">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#e8e0d4" strokeWidth="4" />
              <circle
                cx="24" cy="24" r="20"
                fill="none" stroke="#6abf69" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress)}`}
                transform="rotate(-90 24 24)"
                strokeLinecap="round"
              />
            </svg>
            <span className="progress-pct">{Math.floor(progress * 100)}%</span>
          </div>
          <span className="plot-label">{formatTime(remaining)}</span>
        </div>
      )}
      {plot.state === 'ready' && (
        <div className="plot-inner plot-egg">
          <svg width="40" height="48" viewBox="0 0 40 48">
            <ellipse cx="20" cy="26" rx="14" ry="18" fill="#f5dbb1" stroke="#e8c89a" strokeWidth="2" />
            <ellipse cx="20" cy="20" rx="10" ry="12" fill="#fce4c8" />
            <circle cx="15" cy="22" r="2" fill="#333" />
            <circle cx="25" cy="22" r="2" fill="#333" />
            <path d="M17,28 Q20,32 23,28" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="plot-label">Hatch!</span>
        </div>
      )}
    </button>
  );
}
