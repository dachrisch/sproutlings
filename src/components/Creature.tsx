import type { JSX } from 'react';
import type { Species } from '../types';

interface CreatureSVGProps {
  species: Species;
  sparkle?: boolean;
  hat?: string | null;
  size?: number;
  animate?: boolean;
}

function bodyPath(shape: string, hue: number): { path: JSX.Element; faceY: number } {
  const fill = `hsl(${hue}, 60%, 55%)`;
  const lighter = `hsl(${hue}, 55%, 70%)`;
  const darker = `hsl(${hue}, 60%, 40%)`;
  const base: JSX.Element[] = [];

  switch (shape) {
    case 'blob':
      base.push(<ellipse key="body" cx="50" cy="56" rx="30" ry="24" fill={fill} />);
      return { path: <g>{base}</g>, faceY: 54 };
    case 'round':
      base.push(<circle key="body" cx="50" cy="54" r="26" fill={fill} />);
      return { path: <g>{base}</g>, faceY: 52 };
    case 'eared': {
      base.push(
        <polygon key="ear_l" points="30,38 22,16 40,32" fill={lighter} />,
        <polygon key="ear_r" points="70,38 78,16 60,32" fill={lighter} />,
        <circle key="body" cx="50" cy="56" r="24" fill={fill} />,
      );
      return { path: <g>{base}</g>, faceY: 54 };
    }
    case 'mushroom': {
      base.push(
        <ellipse key="cap" cx="50" cy="42" rx="32" ry="16" fill={fill} />,
        <ellipse key="cap_l" cx="35" cy="42" rx="14" ry="12" fill={lighter} />,
        <ellipse key="body" cx="50" cy="66" rx="20" ry="18" fill={`hsl(${hue}, 40%, 45%)`} />,
      );
      return { path: <g>{base}</g>, faceY: 66 };
    }
    case 'sprout': {
      base.push(
        <circle key="body" cx="50" cy="62" r="20" fill={fill} />,
        <path key="stem" d="M50,44 Q50,28 54,24" fill="none" stroke={`hsl(${hue + 30}, 60%, 40%)`} strokeWidth="2" />,
        <ellipse key="leaf_l" cx="44" cy="32" rx="6" ry="3" fill={`hsl(${hue + 30}, 60%, 50%)`} transform="rotate(-30 44 32)" />,
        <ellipse key="leaf_r" cx="56" cy="34" rx="6" ry="3" fill={`hsl(${hue + 30}, 60%, 50%)`} transform="rotate(20 56 34)" />,
      );
      return { path: <g>{base}</g>, faceY: 60 };
    }
    case 'horned': {
      base.push(
        <path key="horn_l" d="M35,40 L20,18 L42,36" fill={darker} />,
        <path key="horn_r" d="M65,40 L80,18 L58,36" fill={darker} />,
        <circle key="body" cx="50" cy="58" r="24" fill={fill} />,
      );
      return { path: <g>{base}</g>, faceY: 56 };
    }
    case 'spiky': {
      const spikes: JSX.Element[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = 50 + 20 * Math.cos(angle);
        const y1 = 56 + 20 * Math.sin(angle);
        const x2 = 50 + 32 * Math.cos(angle - 0.25);
        const y2 = 56 + 32 * Math.sin(angle - 0.25);
        const x3 = 50 + 32 * Math.cos(angle + 0.25);
        const y3 = 56 + 32 * Math.sin(angle + 0.25);
        spikes.push(
          <polygon key={`spike_${i}`} points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill={darker} />,
        );
      }
      base.push(...spikes, <circle key="body" cx="50" cy="56" r="20" fill={fill} />);
      return { path: <g>{base}</g>, faceY: 54 };
    }
    case 'star': {
      const pts: string[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        pts.push(`${50 + 30 * Math.cos(outerAngle)},${56 + 30 * Math.sin(outerAngle)}`);
        pts.push(`${50 + 14 * Math.cos(innerAngle)},${56 + 14 * Math.sin(innerAngle)}`);
      }
      base.push(<polygon key="body" points={pts.join(' ')} fill={fill} />);
      return { path: <g>{base}</g>, faceY: 52 };
    }
    case 'tall': {
      base.push(
        <ellipse key="body" cx="50" cy="54" rx="24" ry="32" fill={fill} />,
        <polygon key="crown" points="38,26 50,14 62,26" fill={darker} />,
        <circle key="crown_jewel" cx="50" cy="22" r="3" fill="#f5b342" />,
      );
      return { path: <g>{base}</g>, faceY: 54 };
    }
    case 'cloud': {
      base.push(
        <circle key="c1" cx="34" cy="60" r="16" fill={fill} />,
        <circle key="c2" cx="66" cy="60" r="16" fill={fill} />,
        <circle key="c3" cx="50" cy="48" r="18" fill={lighter} />,
        <circle key="c4" cx="38" cy="44" r="12" fill={lighter} />,
        <circle key="c5" cx="62" cy="44" r="12" fill={lighter} />,
      );
      return { path: <g>{base}</g>, faceY: 56 };
    }
    case 'stone': {
      base.push(
        <path key="body" d="M28,60 Q25,38 38,30 Q50,24 62,30 Q75,38 72,60 Q70,76 50,78 Q30,76 28,60Z" fill={fill} />,
      );
      return { path: <g>{base}</g>, faceY: 58 };
    }
    default:
      return { path: <circle cx="50" cy="56" r="24" fill={fill} />, faceY: 54 };
  }
}

function Face({ y }: { y: number }) {
  return (
    <g>
      <circle cx="38" cy={y - 2} r="6" fill="white" />
      <circle cx="62" cy={y - 2} r="6" fill="white" />
      <circle cx="40" cy={y - 2} r="3" fill="#333" />
      <circle cx="64" cy={y - 2} r="3" fill="#333" />
      <ellipse cx="30" cy={y + 4} rx="5" ry="3" fill="#ff9999" opacity="0.5" />
      <ellipse cx="70" cy={y + 4} rx="5" ry="3" fill="#ff9999" opacity="0.5" />
      <path d={`M44,${y + 3} Q50,${y + 9} 56,${y + 3}`} fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function SparkleOverlay() {
  return (
    <g>
      <text x="80" y="22" fontSize="14" fill="white" textAnchor="middle" fontWeight="bold">✦</text>
      <text x="20" y="18" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">✦</text>
      <text x="88" y="82" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">✦</text>
      <text x="12" y="80" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">✦</text>
    </g>
  );
}

function HatOverlay({ hat }: { hat: string }) {
  switch (hat) {
    case 'crown':
      return (
        <g>
          <path d="M38,28 L36,14 L44,22 L50,10 L56,22 L64,14 L62,28Z" fill="#f5b342" stroke="#d4942f" strokeWidth="1" />
          <rect x="37" y="28" width="26" height="4" rx="2" fill="#f5b342" />
        </g>
      );
    case 'flower':
      return (
        <g>
          <circle cx="50" cy="20" r="9" fill="#ff69b4" />
          <circle cx="46" cy="17" r="5" fill="#ff99cc" />
          <circle cx="54" cy="17" r="5" fill="#ff99cc" />
          <circle cx="50" cy="20" r="3" fill="#ffd700" />
          <line x1="50" y1="29" x2="50" y2="38" stroke="#4a9f4a" strokeWidth="2" />
        </g>
      );
    case 'bow':
      return (
        <g>
          <polygon points="42,32 28,22 28,42" fill="#ff6b9d" />
          <polygon points="58,32 72,22 72,42" fill="#ff6b9d" />
          <circle cx="50" cy="32" r="5" fill="#ff4081" />
        </g>
      );
    case 'tophat':
      return (
        <g>
          <rect x="34" y="16" width="32" height="22" rx="3" fill="#2c2c2c" />
          <rect x="30" y="36" width="40" height="4" rx="2" fill="#2c2c2c" />
          <rect x="34" y="16" width="32" height="3" rx="1" fill="#444" />
        </g>
      );
    case 'ribbon':
      return (
        <g>
          <path d="M28,38 Q50,28 72,38" fill="none" stroke="#ff69b4" strokeWidth="3" />
          <polygon points="50,38 46,48 54,48" fill="#ff69b4" />
        </g>
      );
    default:
      return null;
  }
}

export function CreatureSVG({ species, sparkle, hat, size = 64, animate }: CreatureSVGProps) {
  const hue = sparkle ? (species.hue + 30) % 360 : species.hue;
  const sparkleSpecies = sparkle ? { ...species, hue } : species;
  const { path, faceY } = bodyPath(sparkleSpecies.shape, hue);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={animate ? 'creature-bob' : undefined}
    >
      {path}
      <Face y={faceY} />
      {sparkle && <SparkleOverlay />}
      {hat && <HatOverlay hat={hat} />}
    </svg>
  );
}
