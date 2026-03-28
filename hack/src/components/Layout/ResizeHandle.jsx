import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export function ResizeHandle({ onMouseDown, isVertical = false, isResizing = false }) {
  const { theme } = useTheme();

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'relative',
        cursor: isVertical ? 'ns-resize' : 'ew-resize',
        background: isResizing ? theme.accent : 'transparent',
        transition: 'background 0.2s',
        ...(isVertical
          ? {
              height: 4,
              width: '100%',
            }
          : {
              width: 4,
              height: '100%',
            }),
      }}
      onMouseEnter={(e) => {
        if (!isResizing) {
          e.currentTarget.style.background = theme.accentDim;
        }
      }}
      onMouseLeave={(e) => {
        if (!isResizing) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          ...(isVertical
            ? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 40,
                height: 3,
              }
            : {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 3,
                height: 40,
              }),
          background: isResizing ? theme.accent : theme.border,
          borderRadius: 2,
          transition: 'background 0.2s',
        }}
      />
    </div>
  );
}
