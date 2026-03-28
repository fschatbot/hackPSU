import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEditor } from '../../contexts/EditorContext';
import { THEMES, MIN_FONT_SIZE, MAX_FONT_SIZE } from '../../utils/constants';

export function ControlPanel() {
  const { themeName, setThemeName, fontSize, setFontSize, theme } = useTheme();
  const { openTabs } = useEditor();

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
      {/* Theme Dropdown */}
      <div>
        <label
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: theme.textDim,
            fontFamily: "'IBM Plex Mono', monospace",
            display: 'block',
            marginBottom: 8,
          }}
        >
          Theme
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            style={{
              width: '100%',
              background: theme.bg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 13,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = theme.accent)}
            onBlur={(e) => (e.target.style.borderColor = theme.border)}
          >
            {Object.entries(THEMES).map(([key, t]) => (
              <option key={key} value={key}>
                {t.name}
              </option>
            ))}
          </select>
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: theme.textDim,
            }}
          >
            ▾
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {Object.entries(THEMES).map(([key, t]) => (
            <div
              key={key}
              onClick={() => setThemeName(key)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: t.accent,
                border:
                  themeName === key
                    ? `2px solid ${theme.textBright}`
                    : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: themeName === key ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {/* Font Size Slider */}
      <div>
        <label
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: theme.textDim,
            fontFamily: "'IBM Plex Mono', monospace",
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span>Font Size</span>
          <span style={{ color: theme.accent, fontWeight: 700 }}>{fontSize}px</span>
        </label>
        <input
          type="range"
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          style={{
            width: '100%',
            height: 4,
            appearance: 'none',
            background: `linear-gradient(to right, ${theme.accent} ${
              ((fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)) * 100
            }%, ${theme.border} ${
              ((fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)) * 100
            }%)`,
            borderRadius: 2,
            outline: 'none',
            cursor: 'pointer',
            accentColor: theme.accent,
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: theme.textDim,
            marginTop: 4,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          <span>{MIN_FONT_SIZE}</span>
          <span>{MAX_FONT_SIZE}</span>
        </div>
      </div>

      {/* Status indicator */}
      <div
        style={{
          marginTop: 'auto',
          padding: '10px 12px',
          background: theme.accentDim,
          borderRadius: 8,
          border: `1px solid ${theme.accent}20`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: theme.accent,
            boxShadow: `0 0 8px ${theme.accentGlow}`,
            animation: 'pulse 2s infinite',
          }}
        />
        <span
          style={{
            fontSize: 11,
            color: theme.accent,
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 500,
          }}
        >
          {openTabs.length} file{openTabs.length !== 1 ? 's' : ''} open
        </span>
      </div>
    </div>
  );
}
