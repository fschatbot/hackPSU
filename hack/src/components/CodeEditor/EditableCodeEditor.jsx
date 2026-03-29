import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useEditor } from '../../contexts/EditorContext';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import { SUPPORTED_IMAGE_TYPES, SUPPORTED_AUDIO_TYPES, SUPPORTED_VIDEO_TYPES, SUPPORTED_DOCUMENT_TYPES } from '../../utils/constants';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('python', python);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('tsx', typescript);
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

export function EditableCodeEditor({ file }) {
  const { theme, codeFontSize: fontSize } = useTheme();
  const { handleCodeSelection } = useAI();
  const { activeTab, updateFileContent } = useEditor();
  const textareaRef = useRef(null);
  const [content, setContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');
  const selectionTimeoutRef = useRef(null);

  // Check if file is a text file
  const isTextFile = useCallback(() => {
    if (!file) return false;
    const ext = file.lang?.toLowerCase();
    const allMediaTypes = [
      ...SUPPORTED_IMAGE_TYPES,
      ...SUPPORTED_AUDIO_TYPES,
      ...SUPPORTED_VIDEO_TYPES,
      ...SUPPORTED_DOCUMENT_TYPES,
    ];
    return !allMediaTypes.includes(ext);
  }, [file]);

  // Initialize content and highlight
  useEffect(() => {
    if (file && isTextFile()) {
      const newContent = file.content || '';
      setContent(newContent);
      setHasUnsavedChanges(false);

      // Highlight the code
      try {
        const language = LANGUAGE_MAP[file.lang] || file.lang || 'javascript';
        const result = hljs.highlight(newContent, { language });
        setHighlightedCode(result.value);
      } catch (error) {
        console.error('Syntax highlighting error:', error);
        // Fallback to plain text with HTML escaping
        setHighlightedCode(
          newContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
        );
      }
    }
  }, [file, isTextFile]);

  // Handle content changes
  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasUnsavedChanges(true);

    // Re-highlight the code on change
    try {
      const language = LANGUAGE_MAP[file?.lang] || file?.lang || 'javascript';
      const result = hljs.highlight(newContent, { language });
      setHighlightedCode(result.value);
    } catch (error) {
      console.error('Syntax highlighting error:', error);
      setHighlightedCode(
        newContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      );
    }
  };

  // Save file
  const handleSave = useCallback(() => {
    if (hasUnsavedChanges && activeTab) {
      updateFileContent(activeTab, content);
      setHasUnsavedChanges(false);
    }
  }, [hasUnsavedChanges, activeTab, content, updateFileContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S / Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Handle text selection for AI
  const handleSelection = () => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    selectionTimeoutRef.current = setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const selectedText = textarea.value.substring(
        textarea.selectionStart,
        textarea.selectionEnd
      ).trim();

      if (selectedText && selectedText.length > 10 && file && activeTab) {
        handleCodeSelection(selectedText, activeTab, content);
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

  // Handle no file selected
  if (!file) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.textDim,
          fontSize: 14,
          fontFamily: "'Geist Mono', monospace",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📄</div>
          <div>No file selected</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            Select a file from the explorer to start editing
          </div>
        </div>
      </div>
    );
  }

  // Render media files
  if (!isTextFile()) {
    const ext = file?.lang?.toLowerCase();

    if (SUPPORTED_IMAGE_TYPES.includes(ext)) {
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src={file.url || file.dataUrl || `data:image/${ext};base64,${file.content}`}
              alt={activeTab}
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            />
            <div style={{ marginTop: 16, color: theme.textDim, fontSize: 13 }}>
              {activeTab}
            </div>
          </div>
        </div>
      );
    }

    if (SUPPORTED_AUDIO_TYPES.includes(ext)) {
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🎵</div>
          <div style={{ marginBottom: 20, color: theme.text, fontSize: 16, fontWeight: 600 }}>{activeTab}</div>
          <audio controls style={{ maxWidth: '100%' }} src={file.url || file.dataUrl}>
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    if (SUPPORTED_VIDEO_TYPES.includes(ext)) {
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video controls style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} src={file.url || file.dataUrl}>
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    if (SUPPORTED_DOCUMENT_TYPES.includes(ext)) {
      return (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <iframe
            src={file.url || file.dataUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={activeTab}
          />
        </div>
      );
    }

    // Binary file fallback
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <div style={{ color: theme.text, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{activeTab}</div>
          <div style={{ color: theme.textDim, fontSize: 13, marginBottom: 20 }}>Binary file - Not editable</div>
        </div>
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 12, color: theme.textDim, overflowX: 'auto', maxHeight: '60vh' }}>
          <div style={{ marginBottom: 8, color: theme.accent }}>Binary Content (Base64):</div>
          <div style={{ wordBreak: 'break-all' }}>{file.content?.substring(0, 1000)}...</div>
        </div>
      </div>
    );
  }

  // Text editor with syntax highlighting
  const lines = highlightedCode ? highlightedCode.split('\n') : [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {hasUnsavedChanges && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 16,
            zIndex: 10,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: theme.warning, fontFamily: "'Geist Mono', monospace" }}>
            Unsaved changes
          </span>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 12px',
              background: theme.accent,
              border: 'none',
              borderRadius: 6,
              color: theme.bg,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Geist Mono', monospace",
            }}
          >
            Save (Ctrl+S)
          </button>
        </div>
      )}

      {/* Hybrid editor: highlighted code display + transparent textarea overlay */}
      <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
        {/* Highlighted code display (background) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            fontFamily: "'Geist Mono', monospace",
            fontSize: fontSize,
            lineHeight: 1.7,
            padding: '16px 0',
            pointerEvents: 'none',
            counterReset: 'line',
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                minHeight: fontSize * 1.7,
              }}
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
          ))}
        </div>

        {/* Transparent textarea overlay (foreground) */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
          spellCheck={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            padding: '16px',
            paddingLeft: '60px',
            fontFamily: "'Geist Mono', monospace",
            fontSize: fontSize,
            lineHeight: 1.7,
            color: 'transparent',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            tabSize: 2,
            caretColor: theme.text,
            WebkitTextFillColor: 'transparent',
          }}
        />
      </div>
    </div>
  );
}
