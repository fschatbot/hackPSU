import React from 'react';

export function FolderIcon({ open, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {open ? (
        <>
          <path d="M1 4h5l2-2h7v2H8L6 6H1V4z" fill="#e8a838" fillOpacity="0.3" />
          <path
            d="M1 6h14l-2 9H3L1 6z"
            fill="#e8a838"
            fillOpacity="0.5"
            stroke="#e8a838"
            strokeWidth="0.7"
          />
        </>
      ) : (
        <path
          d="M1 3h5l2 2h7v10H1V3z"
          fill="#e8a838"
          fillOpacity="0.4"
          stroke="#e8a838"
          strokeWidth="0.7"
        />
      )}
    </svg>
  );
}
