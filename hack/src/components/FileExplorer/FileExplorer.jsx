import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FileIcon } from '../Icons/FileIcon';
import { FolderIcon } from '../Icons/FolderIcon';
import { ChevronIcon } from '../Icons/ChevronIcon';

// ─── helpers ────────────────────────────────────────────────────────────────

function readFileAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

const BINARY_EXTS = new Set([
  'png','jpg','jpeg','gif','webp','svg','ico','bmp',
  'mp3','wav','ogg','flac','aac',
  'mp4','webm','mov','avi',
  'pdf','zip','woff','woff2','ttf','eot',
]);

function isBinaryExt(ext) {
  return BINARY_EXTS.has(ext.toLowerCase());
}

// ─── Context menu ────────────────────────────────────────────────────────────

function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000,
        background: '#1e1e2e',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        padding: '4px 0',
        minWidth: 160,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        fontFamily: "'Geist Mono', monospace",
        fontSize: 12,
      }}
    >
      {items.map((item, i) =>
        item === 'divider' ? (
          <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
        ) : (
          <div
            key={i}
            onClick={() => { item.action(); onClose(); }}
            style={{
              padding: '6px 14px',
              cursor: 'pointer',
              color: item.danger ? '#f38ba8' : '#cdd6f4',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {item.label}
          </div>
        )
      )}
    </div>
  );
}

// ─── Inline input (rename / new item) ────────────────────────────────────────

function InlineInput({ initialValue = '', onCommit, onCancel, style }) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) onCommit(trimmed);
    else onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') onCancel();
        e.stopPropagation();
      }}
      onBlur={commit}
      onClick={(e) => e.stopPropagation()}
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(139,92,246,0.6)',
        borderRadius: 3,
        color: '#cdd6f4',
        fontSize: 12,
        fontFamily: "'Geist Mono', monospace",
        padding: '1px 5px',
        outline: 'none',
        ...style,
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FileExplorer() {
  const { files, openFile, activeTab, createFile, createFolder, deleteItem, renameItem } = useEditor();
  const { theme, leftFontSize, setLeftFontSize } = useTheme();

  const [expanded, setExpanded] = useState({ src: true });
  const [contextMenu, setContextMenu] = useState(null); // { x, y, path, name, type }
  const [renaming, setRenaming] = useState(null);        // { path, oldName }
  const [creating, setCreating] = useState(null);        // { parentPath, itemType: 'file'|'folder' }
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const toggleFolder = (name) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // ── Drag-and-drop upload ──────────────────────────────────────────────────

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (isBinaryExt(ext)) {
        // Store as empty placeholder for binary files
        createFile('', file.name, '[binary file]');
      } else {
        const content = await readFileAsText(file);
        createFile('', file.name, content);
      }
    }
  };

  // ── Context menu builder ──────────────────────────────────────────────────

  const openContextMenu = (e, path, name, type) => {
    e.preventDefault();
    e.stopPropagation();
    const items = [];

    if (type === 'folder') {
      items.push({ label: 'New File', action: () => setCreating({ parentPath: path, itemType: 'file' }) });
      items.push({ label: 'New Folder', action: () => setCreating({ parentPath: path, itemType: 'folder' }) });
      items.push('divider');
    }

    items.push({ label: 'Rename', action: () => setRenaming({ path, oldName: name }) });
    items.push({ label: 'Delete', danger: true, action: () => deleteItem(path) });

    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  // ── Inline create commit ──────────────────────────────────────────────────

  const commitCreate = (name) => {
    if (!creating) return;
    const { parentPath, itemType } = creating;
    if (itemType === 'file') createFile(parentPath, name);
    else createFolder(parentPath, name);
    setCreating(null);
  };

  // ── Inline rename commit ──────────────────────────────────────────────────

  const commitRename = (newName) => {
    if (!renaming) return;
    renameItem(renaming.path, newName);
    setRenaming(null);
  };

  // ── Tree renderer ─────────────────────────────────────────────────────────

  const renderTree = (tree, depth = 0, parentPath = '') => {
    if (!tree) return null;

    const entries = Object.entries(tree);
    // Sort: folders first, then files, both alphabetically
    entries.sort(([aName, aNode], [bName, bNode]) => {
      if (aNode.type === bNode.type) return aName.localeCompare(bName);
      return aNode.type === 'folder' ? -1 : 1;
    });

    return entries.map(([name, node]) => {
      const path = parentPath ? `${parentPath}/${name}` : name;
      const isRenaming = renaming?.path === path;

      if (node.type === 'folder') {
        const isOpen = expanded[path] ?? expanded[name] ?? false;
        const isCreatingHere = creating?.parentPath === path;

        return (
          <div key={path}>
            <div
              onClick={() => toggleFolder(path)}
              onContextMenu={(e) => openContextMenu(e, path, name, 'folder')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                paddingLeft: 8 + depth * 14,
                cursor: 'pointer',
                color: theme.text,
                fontSize: leftFontSize,
                fontFamily: "'Geist Mono', monospace",
                borderRadius: 4,
                transition: 'background 0.12s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.accentDim)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronIcon open={isOpen} />
              <FolderIcon open={isOpen} />
              {isRenaming ? (
                <InlineInput
                  initialValue={name}
                  onCommit={commitRename}
                  onCancel={() => setRenaming(null)}
                />
              ) : (
                <span style={{ fontWeight: 500, flex: 1 }}>{name}</span>
              )}
            </div>

            {isOpen && (
              <div>
                {renderTree(node.children, depth + 1, path)}
                {/* Inline create inside this folder */}
                {isCreatingHere && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      paddingLeft: 8 + (depth + 1) * 14 + 18,
                    }}
                  >
                    {creating.itemType === 'folder' ? (
                      <FolderIcon open={false} />
                    ) : (
                      <FileIcon lang="" />
                    )}
                    <InlineInput
                      onCommit={commitCreate}
                      onCancel={() => setCreating(null)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // File node
      const isActive = activeTab === name;
      return (
        <div
          key={path}
          onClick={() => openFile(name, node)}
          onContextMenu={(e) => openContextMenu(e, path, name, 'file')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            paddingLeft: 26 + depth * 14,
            cursor: 'pointer',
            color: isActive ? theme.accent : theme.text,
            background: isActive ? theme.accentDim : 'transparent',
            fontSize: leftFontSize,
            fontFamily: "'Geist Mono', monospace",
            borderRadius: 4,
            transition: 'all 0.12s',
            borderLeft: isActive ? `2px solid ${theme.accent}` : '2px solid transparent',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = theme.accentDim; }}
          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
          <FileIcon lang={node.lang} />
          {isRenaming ? (
            <InlineInput
              initialValue={name}
              onCommit={commitRename}
              onCancel={() => setRenaming(null)}
            />
          ) : (
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </span>
          )}
        </div>
      );
    });
  };

  // ── Font size buttons ─────────────────────────────────────────────────────

  const sizeBtn = (label, onClick) => (
    <button
      onClick={onClick}
      style={{
        width: 20, height: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: `1px solid ${theme.border}`,
        borderRadius: 4, color: theme.textDim, fontSize: 12, lineHeight: 1,
        cursor: 'pointer', transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textDim; }}
    >
      {label}
    </button>
  );

  const iconBtn = (title, content, onClick) => (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 20, height: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: `1px solid ${theme.border}`,
        borderRadius: 4, color: theme.textDim, fontSize: 13, lineHeight: 1,
        cursor: 'pointer', transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textDim; }}
    >
      {content}
    </button>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 8px 6px',
        borderBottom: `1px solid ${theme.border}`,
        marginBottom: 4, flexShrink: 0, gap: 4,
      }}>
        <span style={{
          flex: 1, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: theme.textMuted,
          fontFamily: "'Geist Mono', monospace",
        }}>Files</span>

        {/* New file at root */}
        {iconBtn('New File', '＋', () => setCreating({ parentPath: '', itemType: 'file' }))}
        {/* New folder at root */}
        {iconBtn('New Folder', '▤', () => setCreating({ parentPath: '', itemType: 'folder' }))}

        <div style={{ width: 1, height: 14, background: theme.border, margin: '0 2px' }} />

        {sizeBtn('−', () => setLeftFontSize(leftFontSize - 1))}
        <span style={{ fontSize: 10, color: theme.textDim, fontFamily: "'Geist Mono', monospace", minWidth: 22, textAlign: 'center' }}>
          {leftFontSize}
        </span>
        {sizeBtn('+', () => setLeftFontSize(leftFontSize + 1))}
      </div>

      {/* File tree */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2px 0' }}>
        {files ? (
          <>
            {renderTree(files)}
            {/* Inline create at root level */}
            {creating && creating.parentPath === '' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', paddingLeft: 26 }}>
                {creating.itemType === 'folder' ? <FolderIcon open={false} /> : <FileIcon lang="" />}
                <InlineInput
                  onCommit={commitCreate}
                  onCancel={() => setCreating(null)}
                />
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: theme.textDim, fontSize: leftFontSize }}>
            No files loaded
          </div>
        )}
      </div>

      {/* Drag-over overlay */}
      {isDragOver && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(139,92,246,0.12)',
            border: '2px dashed rgba(139,92,246,0.6)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <div style={{
            textAlign: 'center',
            color: 'rgba(139,92,246,0.9)',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 12,
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>↓</div>
            Drop files to upload
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
