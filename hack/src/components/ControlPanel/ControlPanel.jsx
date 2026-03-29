import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export function ControlPanel() {
  const { leftFontSize, setLeftFontSize, theme } = useTheme();

  const sizeBtn = (label, onClick) => (
    <button
      onClick={onClick}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme.panelAlt,
        border: `1px solid ${theme.border}`,
        borderRadius: 7,
        color: theme.textDim,
        fontSize: 15, lineHeight: 1,
        cursor: 'pointer',
        transition: 'all 0.12s',
        fontFamily: "'Inter', system-ui, sans-serif",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.accent;
        e.currentTarget.style.color = theme.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border;
        e.currentTarget.style.color = theme.textDim;
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      padding: '14px 14px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      flex: 1,
      overflowY: 'auto',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* Brand */}
      <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${theme.borderFaint || theme.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.textBright, letterSpacing: '-0.01em' }}>
          CodeLens
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
          Select code to analyze it
        </div>
      </div>

      {/* Explorer font size */}
      <div>
        <div style={{
          fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: theme.textMuted, marginBottom: 8,
        }}>
          Text size
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {sizeBtn('−', () => setLeftFontSize(leftFontSize - 1))}
          <span style={{
            flex: 1, textAlign: 'center',
            fontSize: 12, color: theme.textDim,
            fontFamily: "'Geist Mono', monospace",
          }}>
            {leftFontSize}px
          </span>
          {sizeBtn('+', () => setLeftFontSize(leftFontSize + 1))}
        </div>
      </div>

    </div>
  );
}
