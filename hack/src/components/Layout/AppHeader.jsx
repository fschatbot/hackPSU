import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { Settings } from '../Settings/Settings';

const MODES = [
  { id: 'explain',  label: 'Explain', color: null },
  { id: 'teaching', label: 'Teach',   color: '#a78bfa' },
  { id: 'debug',    label: 'Review',  color: '#f97316' },
  { id: 'teachback',label: 'Quiz',    color: '#34d399' },
];

const LEVEL_DESC = [
  { max: 20,  text: "Just starting out" },
  { max: 40,  text: "Know some basics" },
  { max: 60,  text: "Comfortable with code" },
  { max: 80,  text: "Strong fundamentals" },
  { max: 101, text: "Senior engineer" },
];

function getLevelDesc(level) {
  return LEVEL_DESC.find((l) => level < l.max)?.text || LEVEL_DESC[LEVEL_DESC.length - 1].text;
}

export function AppHeader() {
  const { theme } = useTheme();
  const { activeMode, setActiveMode, experienceLevel, setExperienceLevel } = useAI();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 24,
      background: theme.panel,
      borderBottom: `1px solid ${theme.border}`,
      flexShrink: 0,
      fontFamily: "'Inter', system-ui, sans-serif",
      zIndex: 10,
    }}>

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        <span style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 13, fontWeight: 600,
          color: theme.accent,
          letterSpacing: '-0.02em',
        }}>
          &lt;/&gt;
        </span>
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: theme.textBright,
          letterSpacing: '-0.01em',
        }}>
          CodeLens
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: theme.border, flexShrink: 0 }} />

      {/* Mode tabs */}
      <div
        data-tutorial="mode-buttons"
        style={{
          display: 'flex',
          gap: 4,
          background: theme.panelAlt,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: 3,
          flexShrink: 0,
        }}>
        {MODES.map((m) => {
          const active = activeMode === m.id;
          const color = m.color || theme.accent;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              style={{
                padding: '4px 14px',
                borderRadius: 7,
                border: 'none',
                background: active ? (m.color ? `${m.color}18` : theme.accentDim) : 'transparent',
                color: active ? color : theme.textDim,
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: active ? `1px solid ${color}30` : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: theme.border, flexShrink: 0 }} />

      {/* Experience slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, maxWidth: 380 }}>
        <span style={{ fontSize: 11, color: theme.textDim, flexShrink: 0 }}>🌱</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <input
            type="range" min={0} max={100}
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(Number(e.target.value))}
            style={{
              width: '100%', height: 3,
              appearance: 'none',
              background: `linear-gradient(to right, ${theme.accent} ${experienceLevel}%, ${theme.border} ${experienceLevel}%)`,
              borderRadius: 2, outline: 'none', cursor: 'pointer',
              accentColor: theme.accent,
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: theme.textDim, flexShrink: 0 }}>⚡</span>
        <span style={{
          fontSize: 11.5, color: theme.accent,
          maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {getLevelDesc(experienceLevel)}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: theme.border, flexShrink: 0 }} />

      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        style={{
          width: 30, height: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent',
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          color: theme.textDim, fontSize: 15,
          cursor: 'pointer', flexShrink: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textDim; }}
        title="Settings"
      >
        ⚙
      </button>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
