import { useEffect, useMemo, useState } from 'react';

export type SpriteAnimationState = 'idle' | 'attack' | 'hit' | 'none';

interface SpriteProps {
  creatureId: string;
  variant: 'front' | 'back' | 'face';
  size?: number;
  className?: string;
  animate?: boolean;
  frame?: number;
  onFrameChange?: () => void;
  animationState?: SpriteAnimationState;
}

/** Deterministic per-creature phase offset so a group of sprites doesn't breathe in lockstep. */
function idlePhaseOffset(creatureId: string): number {
  let hash = 0;
  for (let i = 0; i < creatureId.length; i++) {
    hash = (hash * 31 + creatureId.charCodeAt(i)) % 2400;
  }
  return -(hash / 1000);
}

export function Sprite({
  creatureId,
  variant,
  size = 64,
  className,
  animate = false,
  frame = 0,
  onFrameChange,
  animationState = 'idle',
}: SpriteProps) {
  const [petted, setPetted] = useState(false);

  useEffect(() => {
    if (!animate || variant !== 'face') return;
    const t = setInterval(() => onFrameChange?.(), 800);
    return () => clearInterval(t);
  }, [animate, variant, onFrameChange]);

  const img = frame % 2 === 1 && variant === 'face'
    ? `${creatureId}_face2.png`
    : `${creatureId}_${variant}.png`;

  const idleDelay = useMemo(() => idlePhaseOffset(creatureId), [creatureId]);

  const animationClasses = animationState === 'none'
    ? []
    : animationState === 'idle'
      ? ['sprite-idle']
      : ['sprite-idle', `sprite-${animationState}`];

  // animation-delay values line up positionally with the animation-name list
  // declared for each class combo in index.css (idle first, reaction second).
  const animationDelay = animationState === 'none'
    ? undefined
    : animationState === 'idle'
      ? `${idleDelay}s`
      : `${idleDelay}s, 0s`;

  return (
    <div
      className={[className, ...animationClasses, petted ? 'sprite-pet' : ''].filter(Boolean).join(' ')}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(/assets/creatures/${img})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        opacity: variant === 'back' ? 0.9 : 1,
        animationDelay,
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'transform 0.15s',
      }}
      onAnimationEnd={() => setPetted(false)}
      onClick={() => setPetted(true)}
    />
  );
}
