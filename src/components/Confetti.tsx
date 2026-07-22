import { useEffect, useState } from 'react';

interface ConfettiProps {
  type: 'new' | 'sparkle' | 'complete';
  onDone: () => void;
}

const COLORS = ['#ff6b9d', '#f5b342', '#6abf69', '#7ec8e3', '#c9a0ff', '#ff8c42'];

export function Confetti({ type, onDone }: ConfettiProps) {
  const [particles] = useState(() => {
    const count = type === 'complete' ? 60 : 30;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      size: 6 + Math.random() * 8,
    }));
  });

  useEffect(() => {
    const timer = setTimeout(onDone, type === 'complete' ? 3500 : 2500);
    return () => clearTimeout(timer);
  }, [type, onDone]);

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
