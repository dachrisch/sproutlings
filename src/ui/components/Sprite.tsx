import { useState, useEffect, useMemo } from 'react';
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
  animate?: boolean;
  frame?: number;
  onFrameChange?: () => void;
}

export function Sprite({ creatureId, variant, size = 64, className, animate = false, frame = 0, onFrameChange }: SpriteProps) {
  const creature = useMemo(
    () => (creatures as CreatureDef[]).find(c => c.id === creatureId),
    [creatureId],
  );

  const [petted, setPetted] = useState(false);

  useEffect(() => {
    if (!animate || variant !== 'face') return;
    const t = setInterval(() => onFrameChange?.(), 800);
    return () => clearInterval(t);
  }, [animate, variant, onFrameChange]);

  const typeColor = creature ? TYPE_COLORS[creature.type] : '#999999';
  const img = frame % 2 === 1 && variant === 'face'
    ? `${creatureId}_face2.png`
    : `${creatureId}_${variant}.png`;

  return (
    <div
      className={[className, animate ? 'sprite-bob' : '', petted ? 'sprite-pet' : ''].filter(Boolean).join(' ')}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundImage: `url(/assets/creatures/${img})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        backgroundColor: typeColor,
        opacity: variant === 'back' ? 0.9 : 1,
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'transform 0.15s',
      }}
      onAnimationEnd={() => setPetted(false)}
      onClick={() => setPetted(true)}
    />
  );
}
