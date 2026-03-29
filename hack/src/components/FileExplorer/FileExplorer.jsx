import React, { useState } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FileIcon } from '../Icons/FileIcon';
import { FolderIcon } from '../Icons/FolderIcon';
import { ChevronIcon } from '../Icons/ChevronIcon';

export function FileExplorer() {
  const { files, openFile, activeTab } = useEditor();
  const { theme, leftFontSize, setLeftFontSize } = useTheme();
  const [expanded, setExpanded] = useState({ src: true });

  const toggleFolder = (name) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const renderTree = (tree, depth = 0) => {
    if (!tree) return null;

    return Object.entries(tree).map(([name, node]) => {
      if (node.type === 'folder') {
        const isOpen = expanded[name];
        return (
          <div key={name}>
            <div
              onClick={() => toggleFolder(name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 8px',
                paddingLeft: 8 + depth * 16,
                cursor: 'pointer',
                color: theme.text,
                fontSize: 12.5,
                fontFamily: "'IBM Plex Mono', monospace",
                borderRadius: 4,
                transition: 'background 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.accentDim)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronIcon open={isOpen} />
              <FolderIcon open={isOpen} />
              <span style={{ fontWeight: 500 }}>{name}</span>
            </div>
            {isOpen && (
              <div style={{ animation: 'slideDown 0.15s ease' }}>
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      const isActive = activeTab === name;
      return (
        <div
          key={name}
          onClick={() => openFile(name, node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px',
            paddingLeft: 26 + depth * 16,
            cursor: 'pointer',
            color: isActive ? theme.accent : theme.text,
            background: isActive ? theme.accentDim : 'transparent',
            fontSize: leftFontSize,
            fontFamily: "'Geist Mono', monospace",
            borderRadius: 4,
            transition: 'all 0.15s',
            borderLeft: isActive ? `2px solid ${theme.accent}` : '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.background = theme.accentDim;
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.background = 'transparent';
          }}
        >
          <FileIcon lang={node.lang} />
          <span>{name}</span>
        </div>
      );
    });
  };

  const sizeBtn = (label, onClick) => (
    <button onClick={onClick} style={{
      width: 20, height: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: `1px solid ${theme.border}`,
      borderRadius: 4, color: theme.textDim, fontSize: 12, lineHeight: 1,
      cursor: 'pointer', transition: 'all 0.12s',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textDim; }}
    >{label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 8px 6px',
        borderBottom: `1px solid ${theme.border}`,
        marginBottom: 4, flexShrink: 0,
      }}>
        <span style={{
          flex: 1, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: theme.textMuted,
          fontFamily: "'Geist Mono', monospace",
        }}>Files</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {sizeBtn('−', () => setLeftFontSize(leftFontSize - 1))}
          <span style={{ fontSize: 10, color: theme.textDim, fontFamily: "'Geist Mono', monospace", minWidth: 22, textAlign: 'center' }}>
            {leftFontSize}
          </span>
          {sizeBtn('+', () => setLeftFontSize(leftFontSize + 1))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '2px 0' }}>
      {files ? renderTree(files) : (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: theme.textDim,
          fontSize: leftFontSize,
        }}>
          No files loaded
        </div>
      )}
      </div>
    </div>
  );
}
