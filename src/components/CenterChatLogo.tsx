import React from 'react';

interface CenterChatLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Authentic Claude Terracotta Starburst designed specifically for the Center Chat Hero View.
 * Matches the user-provided organic 14-spoke hand-drawn asterisk.
 */
export const CenterChatLogo: React.FC<CenterChatLogoProps> = ({
  size = 38,
  className = '',
  color = '#D97757',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <g fill={color}>
        {/* Central Hub Core */}
        <polygon points="46,38 56,38 65,45 68,54 64,64 54,69 44,67 36,58 37,47 43,40" />

        {/* 1. Spoke ~11:00 (Top Left High, beveled tip) */}
        <polygon points="43,39 27,8 33,3 38,12 47,37" />

        {/* 2. Spoke ~12:20 (Top Center, tall, faceted tip) */}
        <polygon points="50,37 57,5 62,3 64,10 56,37" />

        {/* 3. Spoke ~1:30 (Upper Right, long reach) */}
        <polygon points="58,39 79,16 84,13 86,19 63,42" />

        {/* 4. Spoke ~2:30 (Upper Right East) */}
        <polygon points="64,44 94,39 98,43 93,48 66,49" />

        {/* 5. Spoke ~3:30 (Far Right East-South-East) */}
        <polygon points="67,51 97,59 96,65 91,66 65,58" />

        {/* 6. Spoke ~4:30 (Lower Right South-East) */}
        <polygon points="65,60 87,79 84,84 79,83 62,65" />

        {/* 7. Spoke ~5:30 (Bottom Right South-South-East) */}
        <polygon points="60,66 74,90 69,93 64,91 56,69" />

        {/* 8. Spoke ~6:15 (Bottom Center South, blunt tip) */}
        <polygon points="53,70 51,97 45,98 43,93 47,69" />

        {/* 9. Spoke ~7:00 (Bottom Left South-South-West) */}
        <polygon points="45,68 28,90 23,87 25,82 40,65" />

        {/* 10. Spoke ~8:00 (Lower Left South-West) */}
        <polygon points="39,63 15,75 12,71 14,66 36,58" />

        {/* 11. Spoke ~9:00 (Far Left West - Long horizontal arm) */}
        <polygon points="36,54 2,49 1,44 6,43 36,47" />

        {/* 12. Spoke ~9:45 (Upper Left West-North-West) */}
        <polygon points="37,46 11,28 14,24 19,25 39,41" />

        {/* 13. Spoke ~10:30 (Upper Left North-West) */}
        <polygon points="40,41 23,17 28,14 31,18 43,39" />
      </g>
    </svg>
  );
};
