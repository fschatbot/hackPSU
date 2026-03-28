import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useEditor } from '../../contexts/EditorContext';
import { prepareContext } from '../../services/aiService';

export function AIChatroom() {
  const { theme } = useTheme();
  const { activeTab, activeFile, openTabs, files, flattenFiles } = useEditor();
  const { activeRoom, getChatRoom, sendMessage, isLoading, openChatRoom } = useAI();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  // Open chat room when file changes
  useEffect(() => {
    if (activeTab) {
      openChatRoom(activeTab);
    }
  }, [activeTab, openChatRoom]);

  // Get messages for current room
  const messages = activeRoom ? getChatRoom(activeRoom) : [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeRoom || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Prepare context
    const flatFiles = files ? flattenFiles(files) : {};
    const context = prepareContext(
      activeTab,
      activeFile?.content,
      null,
      openTabs.map((tab) => ({ name: tab, file: flatFiles[tab] }))
    );

    // Send message
    await sendMessage(userMessage, context);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header showing current file */}
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
          <span>Chatting about:</span>
          <span style={{ color: theme.text, fontWeight: 600 }}>{activeRoom}</span>
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
              <div style={{ marginBottom: 4 }}>Open a file to start chatting</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                Select code to get automatic AI suggestions
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
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
                }}
              >
                {msg.role === 'ai' ? 'λ' : 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: theme.text,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    padding: '6px 0',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
                {msg.timestamp && (
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
          ))
        )}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              animation: 'fadeUp 0.3s ease',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                minWidth: 28,
                borderRadius: 8,
                background: theme.accentDim,
                border: `1px solid ${theme.accent}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: theme.accent,
                fontWeight: 700,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              λ
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: theme.textDim,
                fontFamily: "'IBM Plex Sans', sans-serif",
                padding: '6px 0',
              }}
            >
              <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
            </div>
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
              // Auto-resize textarea
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
            💡 Tip: Select code to get automatic AI suggestions
          </div>
        )}
      </div>
    </div>
  );
}
