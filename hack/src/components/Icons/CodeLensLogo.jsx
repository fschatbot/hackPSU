import React from 'react';

export function CodeLensLogo({ size = 32, color = '#5B8DEF' }) {
  return (
    <svg width={size} height={size} viewBox="140 210 400 260" xmlns="http://www.w3.org/2000/svg">
      <path fill="none" stroke={color} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" d="M248 260 L190 340 L248 420" />
      <path fill="none" stroke={color} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" d="M432 260 L490 340 L432 420" />
      <path fill={color} d="M340 268 C340 268 382 268 382 308 C382 340 362 352 350 368 L350 392 L330 392 L330 364 C330 364 348 350 358 334 C368 318 362 288 340 288 C318 288 312 308 312 308 L292 304 C292 304 298 268 340 268 Z" />
      <circle fill={color} cx="340" cy="416" r="13" />
    </svg>
  );
}
