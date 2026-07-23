import type { MonsterType } from '../../types';

const TYPE_COLORS: Record<MonsterType, string> = {
  fire: '#ff6b35',
  water: '#4a9fff',
  grass: '#6abf69',
  stone: '#c4956a',
};

interface HpBarProps {
  current: number;
  max: number;
  creatureType: MonsterType;
  label?: string;
  showNumbers?: boolean;
}

export function HpBar({ current, max, creatureType, label, showNumbers = true }: HpBarProps) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const barColor = pct > 50 ? '#6abf69' : pct > 25 ? '#f5b342' : '#e74c3c';

  return (
    <div style={{ width: '100%' }}>
      {(label || showNumbers) && (
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: 4,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{label ?? ''}</span>
          {showNumbers && (
            <span style={{ color: '#7a6e6a' }}>
              {current}/{max}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: 12,
          background: '#f0ece6',
          borderRadius: 6,
          overflow: 'hidden',
          border: `2px solid ${TYPE_COLORS[creatureType]}44`,
        }}
      >
        <div
          style={{
            width: `${Math.max(0, pct)}%`,
            height: '100%',
            background: barColor,
            borderRadius: 6,
            transition: 'width 0.3s ease',
            minWidth: 0,
          }}
        />
      </div>
    </div>
  );
}
