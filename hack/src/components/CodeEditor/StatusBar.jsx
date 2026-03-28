import React from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { useTheme } from '../../contexts/ThemeContext';

export function StatusBar() {
  const { activeFile } = useEditor();
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: '5px 14px',
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10.5,
        color: theme.textDim,
        fontFamily: "'IBM Plex Mono', monospace",
        background: theme.panel,
      }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <span>
          {activeFile ? `${activeFile.content.split('\n').length} lines` : '—'}
        </span>
        <span>UTF-8</span>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <span>{activeFile?.lang?.toUpperCase() || '—'}</span>
        <span>Spaces: 2</span>
      </div>
    </div>
  );
}
