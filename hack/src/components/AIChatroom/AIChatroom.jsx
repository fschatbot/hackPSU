import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useEditor } from '../../contexts/EditorContext';
import { prepareContext } from '../../services/aiService';

const MODE_LABELS = {
  explain: { label: 'Explain', color: null },
  teaching: { label: 'Teach', color: '#a78bfa' },
  debug: { label: 'Debug', color: '#f97316' },
  teachback: { label: 'Quiz', color: '#34d399' },
};

export function AIChatroom() {
  const { theme } = useTheme();
  const { activeTab, activeFile, openTabs, files, flattenFiles } = useEditor();
  const {
    activeRoom,
    getChatRoom,
    sendMessage,
    triggerTeachBack,
    isLoading,
    openChatRoom,
    activeMode,
  } = useAI();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  // Open chat room when file changes
  useEffect(() => {
    if (activeTab) {
      openChatRoom(activeTab);
    }
  }, [activeTab, openChatRoom]);

  const messages = useMemo(() => {
    return activeRoom ? getChatRoom(activeRoom) : [];
  }, [activeRoom, getChatRoom]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getContext = () => {
    const flatFiles = files ? flattenFiles(files) : {};
    return prepareContext(
      activeTab,
      activeFile?.content,
      null,
      openTabs.map((tab) => ({ name: tab, file: flatFiles[tab] }))
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !activeRoom || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    await sendMessage(userMessage, getContext());
  };

  const handleTeachBack = async () => {
    if (!activeRoom || isLoading) return;
    await triggerTeachBack(getContext());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Find the last non-streaming AI message (for teach-back button)
  const lastAiMsg = [...messages].reverse().find(
    (m) => m.role === 'ai' && !m.streaming && !m.isError && m.content.length > 50
  );
  const showTeachBack = lastAiMsg && activeMode !== 'teachback' && !isLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      {activeRoom && (
        <div
          style={{
            padding: '8px 12px',
            borderBottom: `1px solid ${theme.border}`,
            fontSize: 11,
            color: theme.textDim,
            fontFamily: "'IBM Plex Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: theme.accentDim,
          }}
        >
          <span style={{ color: theme.accent }}>●</span>
          <span style={{ color: theme.text, fontWeight: 600 }}>{activeRoom}</span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              background: `${theme.accent}20`,
              color: theme.accent,
              border: `1px solid ${theme.accent}40`,
              borderRadius: 4,
              padding: '1px 6px',
              fontWeight: 600,
            }}
          >
            {MODE_LABELS[activeMode]?.label || activeMode}
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.length === 0 && !activeRoom ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 12,
              color: theme.textDim,
              textAlign: 'center',
              padding: 20,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="18" stroke={theme.textDim} strokeWidth="1.5" />
              <path
                d="M16 22a2 2 0 104 0 2 2 0 00-4 0M28 22a2 2 0 104 0 2 2 0 00-4 0M16 30c2 4 8 4 16 0"
                stroke={theme.accent}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ fontSize: 13 }}>
              <div style={{ marginBottom: 4 }}>Open a file to start</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                Select code or ask anything
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const modeInfo = msg.mode ? MODE_LABELS[msg.mode] : null;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  animation: 'fadeUp 0.3s ease',
                  opacity: msg.isError ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    borderRadius: msg.role === 'ai' ? 8 : '50%',
                    background:
                      msg.role === 'ai'
                        ? theme.accentDim
                        : msg.isError
                        ? `${theme.danger}20`
                        : `${theme.info}20`,
                    border: `1px solid ${
                      msg.role === 'ai'
                        ? theme.accent
                        : msg.isError
                        ? theme.danger
                        : theme.info
                    }40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color:
                      msg.role === 'ai'
                        ? theme.accent
                        : msg.isError
                        ? theme.danger
                        : theme.info,
                    fontWeight: 700,
                    fontFamily: "'IBM Plex Mono', monospace",
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                >
                  {msg.role === 'ai' ? 'λ' : 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Mode badge on AI messages */}
                  {msg.role === 'ai' && modeInfo && (
                    <div
                      style={{
                        fontSize: 9,
                        color: modeInfo.color || theme.accent,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: 3,
                        opacity: 0.8,
                      }}
                    >
                      {modeInfo.label}
                    </div>
                  )}
                  <div
                    className="ai-message-content"
                    style={{
                      fontSize: 12.5,
                      lineHeight: 1.65,
                      color: theme.text,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      padding: '4px 0',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.role === 'ai' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          code: ({ node, inline, className, children, ...props }) => (
                            <code
                              className={className}
                              style={{
                                background: inline ? theme.accentDim : theme.panel,
                                padding: inline ? '2px 6px' : '8px 12px',
                                borderRadius: inline ? 4 : 8,
                                fontSize: inline ? '0.9em' : '0.85em',
                                fontFamily: "'JetBrains Mono', monospace",
                                display: inline ? 'inline' : 'block',
                                overflowX: 'auto',
                                border: `1px solid ${theme.border}`,
                                color: theme.text,
                              }}
                              {...props}
                            >
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre style={{ margin: '8px 0', overflow: 'auto' }}>
                              {children}
                            </pre>
                          ),
                          p: ({ children }) => (
                            <p style={{ margin: '8px 0' }}>{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol style={{ margin: '8px 0', paddingLeft: 20 }}>{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li style={{ margin: '4px 0' }}>{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote
                              style={{
                                borderLeft: `3px solid ${theme.accent}`,
                                paddingLeft: 12,
                                margin: '8px 0',
                                fontStyle: 'italic',
                                color: theme.textDim,
                              }}
                            >
                              {children}
                            </blockquote>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: theme.accent,
                                textDecoration: 'underline',
                              }}
                            >
                              {children}
                            </a>
                          ),
                          h1: ({ children }) => (
                            <h1 style={{ fontSize: '1.4em', margin: '12px 0 8px', fontWeight: 700 }}>
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 style={{ fontSize: '1.2em', margin: '10px 0 6px', fontWeight: 600 }}>
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 style={{ fontSize: '1.1em', margin: '8px 0 4px', fontWeight: 600 }}>
                              {children}
                            </h3>
                          ),
                          strong: ({ children }) => (
                            <strong style={{ fontWeight: 700, color: theme.textBright }}>
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em style={{ fontStyle: 'italic', color: theme.textDim }}>
                              {children}
                            </em>
                          ),
                          hr: () => (
                            <hr
                              style={{
                                border: 'none',
                                borderTop: `1px solid ${theme.border}`,
                                margin: '12px 0',
                              }}
                            />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}
                    {/* Blinking cursor while streaming */}
                    {msg.streaming && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 2,
                          height: '1em',
                          background: theme.accent,
                          marginLeft: 2,
                          verticalAlign: 'text-bottom',
                          animation: 'pulse 1s infinite',
                        }}
                      />
                    )}
                  </div>
                  {msg.timestamp && !msg.streaming && (
                    <div
                      style={{
                        fontSize: 9,
                        color: theme.textDim,
                        opacity: 0.5,
                        marginTop: 2,
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Teach-back button after AI explains something */}
        {showTeachBack && (
          <div style={{ paddingLeft: 38 }}>
            <button
              onClick={handleTeachBack}
              style={{
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                color: theme.accent,
                background: theme.accentDim,
                border: `1px solid ${theme.accent}40`,
                borderRadius: 6,
                padding: '5px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.target.style.borderColor = theme.accent)}
              onMouseLeave={(e) => (e.target.style.borderColor = `${theme.accent}40`)}
            >
              ? Test my understanding
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 10,
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: theme.bg,
            borderRadius: 10,
            border: `1px solid ${theme.border}`,
            padding: 4,
            transition: 'border-color 0.2s',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeRoom
                ? 'Ask anything... (Shift+Enter for new line)'
                : 'Open a file to chat'
            }
            disabled={!activeRoom || isLoading}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.text,
              fontSize: 12.5,
              fontFamily: "'IBM Plex Sans', sans-serif",
              padding: '8px 10px',
              resize: 'none',
              maxHeight: 120,
              overflowY: 'auto',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !activeRoom || isLoading}
            style={{
              background: input.trim() && !isLoading ? theme.accent : theme.border,
              border: 'none',
              borderRadius: 8,
              width: 34,
              height: 34,
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              opacity: input.trim() && !isLoading ? 1 : 0.4,
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8h12M9 3l5 5-5 5"
                stroke={theme.bg}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {activeRoom && (
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              color: theme.textDim,
              textAlign: 'center',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Select code to analyze · Mode: {MODE_LABELS[activeMode]?.label}
          </div>
        )}
      </div>
    </div>
  );
}
