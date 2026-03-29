import React from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FileIcon } from '../Icons/FileIcon';

export function TabBar() {
  const { openTabs, activeTab, closeTab, switchTab, flattenFiles, files } = useEditor();
  const { theme, codeFontSize, setCodeFontSize } = useTheme();

  const flatFiles = files ? flattenFiles(files) : {};

  const handleCloseTab = (e, name) => {
    e.stopPropagation();
    closeTab(name);
  };

  const sizeBtn = (label, onClick) => (
    <button
      onClick={onClick}
      style={{
        width: 24, height: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent',
        border: `1px solid ${theme.border}`,
        borderRadius: 5,
        color: theme.textDim,
        fontSize: 14, lineHeight: 1,
        cursor: 'pointer',
        transition: 'all 0.12s',
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.border}`,
        background: theme.panel,
        minHeight: 38,
        overflow: 'auto hidden',
      }}
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'auto hidden', alignItems: 'center' }}>
      {openTabs.length === 0 ? (
        <span
          style={{
            padding: '0 14px',
            fontSize: 11.5,
            color: theme.textDim,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          No files open
        </span>
      ) : (
        openTabs.map((tab) => {
          const f = flatFiles[tab];
          const isActive = tab === activeTab;
          return (
            <div
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '0 14px',
                height: 38,
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
                color: isActive ? theme.textBright : theme.textDim,
                background: isActive ? theme.panelAlt : 'transparent',
                borderBottom: isActive
                  ? `2px solid ${theme.accent}`
                  : '2px solid transparent',
                borderRight: `1px solid ${theme.border}`,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = theme.accentDim;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <FileIcon lang={f?.lang} size={13} />
              {tab}
              <span
                onClick={(e) => handleCloseTab(e, tab)}
                style={{
                  marginLeft: 4,
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  fontSize: 14,
                  lineHeight: 1,
                  color: theme.textDim,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.danger + '30';
                  e.currentTarget.style.color = theme.danger;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme.textDim;
                }}
              >
                ×
              </span>
            </div>
          );
        })
      )}
      </div>

      {/* Font size controls — pinned right */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 10px',
        flexShrink: 0,
        borderLeft: `1px solid ${theme.border}`,
        height: 38,
      }}>
        {sizeBtn('−', () => setCodeFontSize(codeFontSize - 1))}
        <span style={{
          fontSize: 10.5, color: theme.textDim,
          fontFamily: "'Geist Mono', monospace",
          minWidth: 28, textAlign: 'center',
        }}>
          {codeFontSize}
        </span>
        {sizeBtn('+', () => setCodeFontSize(codeFontSize + 1))}
      </div>
    </div>
  );
}
