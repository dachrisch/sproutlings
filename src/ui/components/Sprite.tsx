import { useMemo } from 'react';
import type { MonsterType } from '../../types';
import type { CreatureDef } from '../../types';
import creatures from '../../data/creatures.json';

const TYPE_COLORS: Record<MonsterType, string> = {
  fire: '#ff6b35',
  water: '#4a9fff',
  grass: '#6abf69',
  stone: '#c4956a',
};

interface SpriteProps {
  creatureId: string;
  variant: 'front' | 'back' | 'face';
  size?: number;
  className?: string;
}

export function Sprite({ creatureId, variant, size = 64, className }: SpriteProps) {
  const creature = useMemo(
    () => (creatures as CreatureDef[]).find(c => c.id === creatureId),
    [creatureId],
  );

  const typeColor = creature ? TYPE_COLORS[creature.type] : '#999999';

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundImage: `url(/assets/creatures/${creatureId}_${variant}.png)`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        backgroundColor: typeColor,
        opacity: variant === 'back' ? 0.9 : 1,
        flexShrink: 0,
      }}
    />
  );
}
