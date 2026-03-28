import React from 'react';
import { FILE_ICONS_COLORS } from '../../utils/constants';

export function FileIcon({ lang, size = 14 }) {
  const color = FILE_ICONS_COLORS[lang] || "#888";

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M3 1h7l4 4v10H3V1z"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="1"
      />
      <path d="M10 1v4h4" stroke={color} strokeWidth="1" />
    </svg>
  );
}
