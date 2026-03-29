import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEditor } from '../../contexts/EditorContext';

export function SearchPanel({ onClose }) {
  const { theme } = useTheme();
  const { files, openFile, flattenFiles } = useEditor();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback((q) => {
    if (!q.trim() || !files) { setResults([]); return; }

    const flat = flattenFiles(files);
    const term = q.toLowerCase();
    const matches = [];

    for (const [name, node] of Object.entries(flat)) {
      if (!node.content) continue;

      const lines = node.content.split('\n');
      const fileMatches = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(term)) {
          fileMatches.push({ line: i + 1, text: lines[i].trim() });
          if (fileMatches.length >= 5) break; // max 5 matches per file
        }
      }

      if (fileMatches.length > 0 || name.toLowerCase().includes(term)) {
        matches.push({ name, node, matches: fileMatches });
      }

      if (matches.length >= 20) break; // max 20 files
    }

    setResults(matches);
  }, [files, flattenFiles]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: theme.panel, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5.5" stroke={theme.textDim} strokeWidth="1.5" />
          <path d="M11 11l3.5 3.5" stroke={theme.textDim} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in files..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: theme.text, fontSize: 13, fontFamily: "'Geist Mono', monospace",
          }}
        />
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: theme.textDim,
            cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px',
          }}
        >x</button>
      </div>

      {/* Results count */}
      {query.trim() && (
        <div style={{ padding: '6px 12px', fontSize: 11, color: theme.textDim, borderBottom: `1px solid ${theme.border}` }}>
          {totalMatches} match{totalMatches !== 1 ? 'es' : ''} in {results.length} file{results.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Results */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {results.map((result) => (
          <div key={result.name}>
            {/* File name */}
            <div
              style={{
                padding: '6px 12px',
                fontSize: 12, fontWeight: 600,
                color: theme.accent,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.1s',
              }}
              onClick={() => { openFile(result.name, result.node); onClose(); }}
              onMouseEnter={(e) => e.currentTarget.style.background = `${theme.accent}10`}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ opacity: 0.6, fontSize: 11 }}>📄</span>
              {result.name}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: theme.textDim, fontWeight: 400 }}>
                {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {/* Line matches */}
            {result.matches.map((match, i) => (
              <div
                key={i}
                style={{
                  padding: '3px 12px 3px 30px',
                  fontSize: 12,
                  fontFamily: "'Geist Mono', monospace",
                  color: theme.text,
                  cursor: 'pointer',
                  display: 'flex', gap: 8,
                  transition: 'background 0.1s',
                }}
                onClick={() => { openFile(result.name, result.node); onClose(); }}
                onMouseEnter={(e) => e.currentTarget.style.background = `${theme.accent}08`}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ color: theme.textDim, fontSize: 11, minWidth: 28, textAlign: 'right' }}>
                  {match.line}
                </span>
                <span style={{
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {highlightMatch(match.text, query, theme)}
                </span>
              </div>
            ))}
          </div>
        ))}

        {query.trim() && results.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: theme.textDim, fontSize: 13 }}>
            No results found
          </div>
        )}
      </div>
    </div>
  );
}

function highlightMatch(text, query, theme) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: `${theme.accent}30`, color: theme.accent, borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}
