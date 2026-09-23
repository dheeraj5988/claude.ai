import React from 'react';

interface ClaudeSunburstProps {
  className?: string;
  size?: number;
}

export const ClaudeSunburst: React.FC<ClaudeSunburstProps> = ({
  className = 'w-7 h-7',
  size = 28,
}) => {
  // Generate 16 radiating spokes for Claude's exact coral asterisk
  const spokes = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 22.5 * Math.PI) / 180;
    const innerRadius = 3.6;
    const outerRadius = 9.8;
    const x1 = +(12 + innerRadius * Math.cos(angle)).toFixed(2);
    const y1 = +(12 + innerRadius * Math.sin(angle)).toFixed(2);
    const x2 = +(12 + outerRadius * Math.cos(angle)).toFixed(2);
    const y2 = +(12 + outerRadius * Math.sin(angle)).toFixed(2);
    return { x1, y1, x2, y2 };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {spokes.map((s, idx) => (
        <line
          key={idx}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="#DE7959"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
};
