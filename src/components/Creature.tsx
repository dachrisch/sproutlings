import type { Species } from '../types';

interface CreatureSVGProps {
  species: Species;
  sparkle?: boolean;
  hat?: string | null;
  size?: number;
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
        <circle key="body" cx="50" cy="60" r="20" fill={fill} />,
        <path key="leaf_l" d="M46,42 Q30,25 44,38" fill={`hsl(${hue + 30}, 60%, 50%)`} />,
        <path key="leaf_r" d="M54,42 Q70,25 56,38" fill={`hsl(${hue + 30}, 60%, 50%)`} />,
      );
      return { path: <g>{base}</g>, faceY: 58 };
    }
    case 'horned': {
      base.push(
        <path key="horn_l" d="M35,38 L22,18 L40,34" fill={darker} />,
        <path key="horn_r" d="M65,38 L78,18 L60,34" fill={darker} />,
        <circle key="body" cx="50" cy="58" r="22" fill={fill} />,
      );
      return { path: <g>{base}</g>, faceY: 56 };
    }
    case 'spiky': {
      const spikes: JSX.Element[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = 50 + 20 * Math.cos(angle);
        const y1 = 56 + 20 * Math.sin(angle);
        const x2 = 50 + 30 * Math.cos(angle - 0.2);
        const y2 = 56 + 30 * Math.sin(angle - 0.2);
        const x3 = 50 + 30 * Math.cos(angle + 0.2);
        const y3 = 56 + 30 * Math.sin(angle + 0.2);
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
      return { path: <g>{base}</g>, faceY: 54 };
    }
    case 'tall': {
      base.push(
        <ellipse key="body" cx="50" cy="52" rx="22" ry="30" fill={fill} />,
        <ellipse key="crown" cx="50" cy="22" rx="10" ry="6" fill={darker} />,
      );
      return { path: <g>{base}</g>, faceY: 52 };
    }
    case 'cloud': {
      base.push(
        <circle key="c1" cx="36" cy="58" r="16" fill={fill} />,
        <circle key="c2" cx="64" cy="58" r="16" fill={fill} />,
        <circle key="c3" cx="50" cy="48" r="18" fill={lighter} />,
        <circle key="c4" cx="38" cy="46" r="12" fill={lighter} />,
        <circle key="c5" cx="62" cy="46" r="12" fill={lighter} />,
      );
      return { path: <g>{base}</g>, faceY: 56 };
    }
    case 'stone': {
      base.push(
        <path key="body" d="M28,60 Q25,40 38,32 Q50,26 62,32 Q75,40 72,60 Q70,74 50,76 Q30,74 28,60Z" fill={fill} />,
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
      <text x="78" y="20" fontSize="14" fill="white" textAnchor="middle">✦</text>
      <text x="22" y="18" fontSize="10" fill="white" textAnchor="middle">✦</text>
      <text x="85" y="80" fontSize="8" fill="white" textAnchor="middle">✦</text>
    </g>
  );
}

function HatOverlay({ hat }: { hat: string }) {
  switch (hat) {
    case 'crown':
      return (
        <g>
          <path d="M38,28 L36,16 L44,22 L50,12 L56,22 L64,16 L62,28Z" fill="#f5b342" stroke="#d4942f" strokeWidth="1" />
          <rect x="37" y="28" width="26" height="4" rx="2" fill="#f5b342" />
        </g>
      );
    case 'flower':
      return (
        <g>
          <circle cx="50" cy="22" r="8" fill="#ff69b4" />
          <circle cx="50" cy="22" r="3" fill="#ffd700" />
          <line x1="50" y1="30" x2="50" y2="38" stroke="#4a9f4a" strokeWidth="2" />
        </g>
      );
    case 'bow':
      return (
        <g>
          <polygon points="42,32 30,24 30,40" fill="#ff6b9d" />
          <polygon points="58,32 70,24 70,40" fill="#ff6b9d" />
          <circle cx="50" cy="32" r="4" fill="#ff4081" />
        </g>
      );
    case 'tophat':
      return (
        <g>
          <rect x="36" y="18" width="28" height="20" rx="2" fill="#2c2c2c" />
          <rect x="32" y="36" width="36" height="4" rx="2" fill="#2c2c2c" />
        </g>
      );
    case 'ribbon':
      return (
        <g>
          <path d="M30,36 Q50,28 70,36" fill="none" stroke="#ff69b4" strokeWidth="3" />
          <polygon points="50,36 46,44 54,44" fill="#ff69b4" />
        </g>
      );
    default:
      return null;
  }
}

export function CreatureSVG({ species, sparkle, hat, size = 64 }: CreatureSVGProps) {
  const hue = sparkle ? (species.hue + 30) % 360 : species.hue;
  const sparkleSpecies = sparkle ? { ...species, hue } : species;
  const { path, faceY } = bodyPath(sparkleSpecies.shape, hue);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {path}
      <Face y={faceY} />
      {sparkle && <SparkleOverlay />}
      {hat && <HatOverlay hat={hat} />}
    </svg>
  );
}
