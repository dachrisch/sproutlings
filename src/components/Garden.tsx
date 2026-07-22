import { useGameStore } from '../store/gameStore';
import { PlotCell } from './PlotCell';
import { Meadow } from './Meadow';

export function Garden() {
  const plots = useGameStore((s) => s.plots);

  return (
    <section className="view garden-view">
      <h2 className="section-title">Garden</h2>
      <div className="plots-grid">
        {plots.map((plot) => (
          <PlotCell key={plot.id} plot={plot} />
        ))}
      </div>
      <Meadow />
    </section>
  );
}
