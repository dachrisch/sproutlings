import { useGameStore } from '../store/gameStore';
import { PlotCell } from './PlotCell';
import { Meadow } from './Meadow';

export function Garden() {
  const plots = useGameStore((s) => s.plots);
  const creatures = useGameStore((s) => s.creatures);
  const hasPlanted = plots.some((p) => p.state !== 'empty');
  const hasCreatures = creatures.length > 0;

  return (
    <section className="view garden-view">
      <h2 className="section-title">Garden</h2>
      {!hasPlanted && !hasCreatures && (
        <div className="garden-welcome">
          <p>Welcome to your garden!</p>
          <p>Plant seeds and grow cute creatures.</p>
        </div>
      )}
      <div className="plots-grid">
        {plots.map((plot) => (
          <PlotCell key={plot.id} plot={plot} />
        ))}
      </div>
      <Meadow />
    </section>
  );
}
