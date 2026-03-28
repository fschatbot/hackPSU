import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useEditor } from '../../contexts/EditorContext';
import hljs from 'highlight.js/lib/core';

// Import specific languages to keep bundle size small
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml'; // for HTML/JSX

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('python', python);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('jsx', javascript); // Use JS for JSX
hljs.registerLanguage('tsx', typescript); // Use TS for TSX
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('md', markdown);

const LANGUAGE_MAP = {
  jsx: 'javascript',
  js: 'javascript',
  tsx: 'typescript',
  ts: 'typescript',
  css: 'css',
  scss: 'css',
  json: 'json',
  md: 'markdown',
  py: 'python',
  html: 'xml',
};

export function CodeEditor({ file }) {
  const { theme, fontSize } = useTheme();
  const { handleCodeSelection } = useAI();
  const { activeTab } = useEditor();
  const containerRef = useRef(null);
  const [highlightedCode, setHighlightedCode] = useState('');
  const selectionTimeoutRef = useRef(null);

  // Highlight code when file changes
  useEffect(() => {
    if (!file || !file.content) {
      setHighlightedCode('');
      return;
    }

    try {
      const language = LANGUAGE_MAP[file.lang] || file.lang || 'javascript';
      const result = hljs.highlight(file.content, { language });
      setHighlightedCode(result.value);
    } catch (error) {
      console.error('Syntax highlighting error:', error);
      // Fallback to plain text
      setHighlightedCode(
        file.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      );
    }
  }, [file]);

  // Handle text selection
  const handleSelection = () => {
    // Clear any existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Debounce selection handling
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 10 && file && activeTab) {
        // Call AI handler with selection
        handleCodeSelection(selectedText, activeTab, file.content);
      }
    }, 500); // Wait 500ms after user stops selecting
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add selection listener
    container.addEventListener('mouseup', handleSelection);
    container.addEventListener('keyup', handleSelection);

    return () => {
      container.removeEventListener('mouseup', handleSelection);
      container.removeEventListener('keyup', handleSelection);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [file, activeTab, handleCodeSelection]);

  const lines = highlightedCode ? highlightedCode.split('\n') : [];

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'auto',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: fontSize,
        lineHeight: 1.7,
        padding: '16px 0',
        counterReset: 'line',
        userSelect: 'text',
        cursor: 'text',
      }}
    >
      {lines.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: 12,
            color: theme.textDim,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect
              x="6"
              y="8"
              width="36"
              height="32"
              rx="4"
              stroke={theme.textDim}
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M18 20l-6 4 6 4M30 20l6 4-6 4M26 16l-4 16"
              stroke={theme.accent}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span style={{ fontSize: 13 }}>Select a file to start editing</span>
        </div>
      ) : (
        lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              minHeight: fontSize * 1.7,
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${theme.accent}05`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span
              style={{
                display: 'inline-block',
                width: 52,
                minWidth: 52,
                textAlign: 'right',
                paddingRight: 16,
                color: theme.textDim,
                fontSize: fontSize - 1,
                userSelect: 'none',
                opacity: 0.6,
              }}
            >
              {i + 1}
            </span>
            <span
              className="hljs"
              style={{ flex: 1, paddingRight: 16, whiteSpace: 'pre' }}
              dangerouslySetInnerHTML={{ __html: line || ' ' }}
            />
          </div>
        ))
      )}
    </div>
  );
}
