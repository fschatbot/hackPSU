import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useAuth } from '../../contexts/AuthContext';
import { THEMES } from '../../utils/constants';
import { Login } from '../Auth/Login';

export function Settings({ onClose }) {
  const { theme, themeName, setThemeName } = useTheme();
  const { analysisMode, setAnalysisMode } = useAI();
  const { isAuthenticated, user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const section = {
    marginBottom: 28,
  };

  const label = {
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: theme.textMuted,
    marginBottom: 10,
    display: 'block',
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  const card = (active, onClick, children) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 12px',
        background: active ? theme.accentDim : theme.panelAlt,
        border: `1px solid ${active ? theme.accent + '60' : theme.border}`,
        borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        color: theme.text, transition: 'all 0.12s',
        fontFamily: "'Inter', system-ui, sans-serif",
        outline: active ? `1px solid ${theme.accent}30` : 'none',
        marginBottom: 6,
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = `${theme.accent}40`; }}}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = theme.border; }}}
    >
      {children}
    </button>
  );

  if (showLogin) {
    return <Login onClose={() => { setShowLogin(false); onClose?.(); }} />;
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: '28px 28px 24px',
          width: 420,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${theme.accent}15`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.textBright, letterSpacing: '-0.01em' }}>
              Settings
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              color: theme.textDim, fontSize: 16,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Account */}
        <div style={section}>
          <span style={label}>Account</span>
          {isAuthenticated ? (
            <div style={{
              padding: '12px 14px',
              background: theme.panelAlt,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.textBright, marginBottom: 2 }}>
                {user?.name || user?.email || 'Logged in'}
              </div>
              <div style={{ fontSize: 11.5, color: theme.textDim, marginBottom: 12 }}>
                {user?.email}
              </div>
              <button
                onClick={() => { logout(); onClose?.(); }}
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  border: `1px solid ${theme.danger}50`,
                  borderRadius: 8,
                  color: theme.danger,
                  fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div style={{
              padding: '14px',
              background: theme.panelAlt,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.textBright, marginBottom: 4 }}>
                You're in guest mode
              </div>
              <div style={{ fontSize: 12, color: theme.textDim, lineHeight: 1.55, marginBottom: 14 }}>
                Sign in to sync your chat history across devices and pick up where you left off.
              </div>
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  padding: '8px 16px',
                  background: theme.accent,
                  border: 'none',
                  borderRadius: 8,
                  color: '#000',
                  fontSize: 12.5, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sign in / Create account
              </button>
            </div>
          )}
        </div>

        {/* Analysis mode */}
        <div style={section}>
          <span style={label}>When I select code…</span>
          {card(analysisMode === 'auto', () => setAnalysisMode('auto'),
            <>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.accentDim, border: `1px solid ${theme.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⚡</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: analysisMode === 'auto' ? theme.accentBright : theme.textBright }}>Analyze automatically</div>
                <div style={{ fontSize: 11.5, color: theme.textDim, marginTop: 2 }}>AI responds the moment you highlight code</div>
              </div>
            </>
          )}
          {card(analysisMode === 'manual', () => setAnalysisMode('manual'),
            <>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${theme.purple}15`, border: `1px solid ${theme.purple}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✍️</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: analysisMode === 'manual' ? theme.accentBright : theme.textBright }}>Let me ask my own question</div>
                <div style={{ fontSize: 11.5, color: theme.textDim, marginTop: 2 }}>Select code, then type what you want to know</div>
              </div>
            </>
          )}
        </div>

        {/* Theme */}
        <div style={section}>
          <span style={label}>Theme</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(THEMES).map(([key, t]) => {
              const active = themeName === key;
              return (
                <button
                  key={key}
                  onClick={() => setThemeName(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: active ? theme.accentDim : theme.panelAlt,
                    border: `1px solid ${active ? theme.accent + '60' : theme.border}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.12s',
                    outline: active ? `1px solid ${theme.accent}30` : 'none',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = `${theme.accent}40`; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = theme.border; }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: t.swatch,
                    boxShadow: active ? `0 0 8px ${t.swatch}80` : 'none',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? theme.accentBright : theme.textBright }}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
