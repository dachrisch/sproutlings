import { useMemo } from 'react';
import type { MonsterType } from '../../types';
import type { MoveDef } from '../../types';
import movesData from '../../data/moves.json';

const TYPE_COLORS: Record<MonsterType, string> = {
  fire: '#ff6b35',
  water: '#4a9fff',
  grass: '#6abf69',
  stone: '#c4956a',
};

interface MoveGridProps {
  moves: string[];
  onSelect: (moveId: string) => void;
  disabled?: boolean;
}

export function MoveGrid({ moves: moveIds, onSelect, disabled }: MoveGridProps) {
  const moveData = useMemo(
    () =>
      moveIds
        .map(id => (movesData as MoveDef[]).find(m => m.id === id))
        .filter((m): m is MoveDef => m != null),
    [moveIds],
  );

  if (moveData.length === 0) {
    return (
      <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#7a6e6a', padding: 8 }}>
        No moves available
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        width: '100%',
      }}
    >
      {moveData.map(move => (
        <button
          key={move.id}
          onClick={() => onSelect(move.id)}
          disabled={disabled}
          style={{
            padding: '14px 8px',
            border: `3px solid ${TYPE_COLORS[move.type]}`,
            borderRadius: 12,
            background: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            minHeight: 44,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'inherit',
            color: '#3a2e2a',
          }}
        >
          <span>{move.name}</span>
          <span
            style={{
              fontSize: '0.65rem',
              color: TYPE_COLORS[move.type],
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {move.type} · {move.power}
          </span>
        </button>
      ))}
    </div>
  );
}
