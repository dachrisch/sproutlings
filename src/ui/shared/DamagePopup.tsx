import { useEffect, useRef } from 'react';

interface DamagePopupProps {
  amount: number;
  effectiveness?: number;
  x: number;
  y: number;
  onDone: () => void;
}

export function DamagePopup({ amount, effectiveness, x, y, onDone }: DamagePopupProps) {
  const timerRef = useRef<number>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(onDone, 1200);
    return () => clearTimeout(timerRef.current);
  }, [onDone]);

  const effectivenessText =
    effectiveness != null
      ? effectiveness > 1
        ? 'Super effective!'
        : effectiveness < 1
          ? 'Not very effective...'
          : ''
      : '';

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 10,
        animation: 'damage-float 1.2s ease-out forwards',
      }}
    >
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: effectiveness != null && effectiveness > 1 ? '#ff6b35' : '#ffffff',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        -{amount}
      </div>
      {effectivenessText && (
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: effectiveness != null && effectiveness > 1 ? '#ff6b35' : '#7ec8e3',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            textAlign: 'center',
            marginTop: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {effectivenessText}
        </div>
      )}
    </div>
  );
}
