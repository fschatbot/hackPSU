import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useEditor } from '../../contexts/EditorContext';
import { buildContext } from '../../lib/contextBuilder';
import { MarkdownRenderer } from './MarkdownRenderer';

const MODE_INFO = {
  explain:  { label: 'Explain',  color: null,       desc: 'Understanding the code' },
  teaching: { label: 'Teach',    color: '#b89af5',  desc: 'Concepts & ideas behind it' },
  debug:    { label: 'Review',   color: '#fb923c',  desc: 'Bugs & issues' },
  teachback:{ label: 'Quiz',     color: '#5eead4',  desc: 'Testing your understanding' },
};

export function AIChatroom() {
  const { theme, chatFontSize, setChatFontSize } = useTheme();
  const { activeTab, activeFile, files } = useEditor();
  const {
    activeRoom, activeFile: activeChatFile, getChatRoom, sendMessage, triggerTeachBack,
    isLoading, openChatRoom, activeMode, analysisMode, pendingSelection, clearPendingSelection,
  } = useAI();

  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (activeTab) openChatRoom(activeTab);
  }, [activeTab, openChatRoom]);

  const messages = useMemo(() => activeRoom ? getChatRoom(activeRoom) : [], [activeRoom, getChatRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getContext = () => {
    const base = buildContext(activeTab, activeFile?.content, null, files);
    // In manual mode, inject the saved selection as selectedText
    if (analysisMode === 'manual' && pendingSelection) {
      return { ...base, selectedText: pendingSelection.text };
    }
    return base;
  };

  const handleSend = async () => {
    if (!input.trim() || !activeRoom || isLoading) return;
    const msg = input.trim();
    setInput('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    await sendMessage(msg, getContext());
    if (analysisMode === 'manual') clearPendingSelection();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const lastAiMsg = [...messages].reverse().find(
    (m) => m.role === 'ai' && !m.streaming && !m.isError && m.content.length > 50
  );
  const showTeachBack = lastAiMsg && activeMode !== 'teachback' && !isLoading;

  const modeInfo = MODE_INFO[activeMode] || MODE_INFO.explain;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: "'Inter', system-ui, sans-serif",
      background: theme.panel,
    }}>

      {/* Header */}
      <div style={{
        padding: '0 14px',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0, height: 38,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeChatFile ? (
            <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.textBright, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeChatFile}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: theme.textMuted }}>No file open</div>
          )}
        </div>
        <div style={{
          padding: '3px 9px',
          borderRadius: 20,
          background: theme.accentDim,
          border: `1px solid ${theme.accent}30`,
          fontSize: 11, fontWeight: 600,
          color: modeInfo.color || theme.accent,
          flexShrink: 0,
        }}>
          {modeInfo.label}
        </div>
        {/* Font size controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, borderLeft: `1px solid ${theme.border}`, paddingLeft: 8 }}>
          {[['−', -1], ['+', 1]].map(([lbl, delta]) => (
            <button
              key={lbl}
              onClick={() => setChatFontSize(chatFontSize + delta)}
              style={{
                width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                borderRadius: 5,
                color: theme.textDim, fontSize: 13, lineHeight: 1,
                cursor: 'pointer', transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textDim; }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16, fontSize: chatFontSize }}>

        {messages.length === 0 && !activeChatFile ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 12, textAlign: 'center', padding: 24,
          }}>
            <div style={{ fontSize: 32 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Open a file to get started</div>
            <div style={{ fontSize: 12.5, color: theme.textMuted, lineHeight: 1.5 }}>
              Select any code in the editor and CodeLens will explain it — at your level.
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isAI = msg.role === 'ai';
            const msgMode = msg.mode ? MODE_INFO[msg.mode] : null;

            return (
              <div key={i} style={{ display: 'flex', gap: 10, animation: 'fadeUp 0.25s ease' }}>

                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, minWidth: 28,
                  borderRadius: isAI ? 8 : '50%',
                  background: isAI ? theme.accentDim : `${theme.accent}18`,
                  border: `1px solid ${isAI ? theme.accent + '50' : theme.accent + '30'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0, marginTop: 1,
                }}>
                  {isAI ? '✦' : '→'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Mode badge on AI messages */}
                  {isAI && msgMode && (
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: msgMode.color || theme.accent,
                      marginBottom: 4, opacity: 0.8,
                    }}>
                      {msgMode.label}
                    </div>
                  )}

                  {/* Message content */}
                  <div style={{ padding: '2px 0' }}>
                    {isAI && !msg.isError
                      ? <MarkdownRenderer content={msg.content} />
                      : (
                        <div style={{
                          fontSize: 'inherit', lineHeight: 1.65,
                          color: msg.isError ? theme.danger : theme.text,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {msg.content}
                        </div>
                      )
                    }
                    {msg.streaming && (
                      <span style={{
                        display: 'inline-block', width: 2, height: '1em',
                        background: theme.accent, marginLeft: 3,
                        verticalAlign: 'text-bottom',
                        animation: 'pulse 1s infinite',
                      }} />
                    )}
                  </div>

                  {/* Timestamp */}
                  {msg.timestamp && !msg.streaming && (
                    <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, opacity: 0.6 }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Teach-back button */}
        {showTeachBack && (
          <div style={{ paddingLeft: 38 }}>
            <button
              onClick={() => triggerTeachBack(getContext())}
              style={{
                fontSize: 12, fontWeight: 600,
                color: theme.success || '#5eead4',
                background: `${theme.success || '#5eead4'}12`,
                border: `1px solid ${theme.success || '#5eead4'}30`,
                borderRadius: 8, padding: '6px 14px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.target.style.background = `${theme.success || '#5eead4'}20`; }}
              onMouseLeave={(e) => { e.target.style.background = `${theme.success || '#5eead4'}12`; }}
            >
              ✏️ Test my understanding
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {/* Pending selection pill */}
        {analysisMode === 'manual' && pendingSelection && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', marginBottom: 8,
            background: theme.accentDim,
            border: `1px solid ${theme.accent}40`,
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 11, color: theme.accent, flexShrink: 0 }}>⌥ code attached</span>
            <span style={{
              flex: 1, fontSize: 11, color: theme.textDim,
              fontFamily: "'Geist Mono', monospace",
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {pendingSelection.text.slice(0, 60)}{pendingSelection.text.length > 60 ? '…' : ''}
            </span>
            <button
              onClick={clearPendingSelection}
              style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
            >×</button>
          </div>
        )}

        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: theme.panelAlt,
          border: `1px solid ${theme.border}`,
          borderRadius: 12, padding: '6px 6px 6px 12px',
          transition: 'border-color 0.15s',
        }}
          onFocusCapture={(e) => e.currentTarget.style.borderColor = theme.accent}
          onBlurCapture={(e) => e.currentTarget.style.borderColor = theme.border}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeRoom ? 'Ask anything… (Enter to send)' : 'Open a file first'}
            disabled={!activeRoom || isLoading}
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: theme.text, fontSize: 13, lineHeight: 1.55,
              resize: 'none', maxHeight: 120, overflowY: 'auto',
              padding: '5px 0',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !activeRoom || isLoading}
            style={{
              width: 32, height: 32, flexShrink: 0,
              background: input.trim() && activeRoom && !isLoading ? theme.accent : theme.border,
              border: 'none', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && activeRoom && !isLoading ? 'pointer' : 'not-allowed',
              opacity: input.trim() && activeRoom && !isLoading ? 1 : 0.4,
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 7h11M7.5 2.5L12 7l-4.5 4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {activeRoom && (
          <div style={{ marginTop: 6, fontSize: 10.5, color: theme.textMuted, textAlign: 'center' }}>
            Select code in the editor · Shift+Enter for new line
          </div>
        )}
      </div>

    </div>
  );
}
