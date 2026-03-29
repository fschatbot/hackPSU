import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { streamGeminiResponse, generateSelectionPrompt, prepareContext } from '../services/aiService';

const AIContext = createContext();

export function AIProvider({ children }) {
  // Chat rooms keyed by "filename::mode" — each file+mode combo has its own history
  const [chatRooms, setChatRooms] = useState({});

  // Active file name (display only)
  const [activeFile, setActiveFile] = useState(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Active mode: 'explain' | 'teaching' | 'debug' | 'teachback'
  const [activeMode, setActiveMode] = useState('explain');

  // Experience level: 0-100
  const [experienceLevel, setExperienceLevel] = useState(50);

  // Analysis mode: 'auto' = selection triggers AI, 'manual' = user types their own question
  const [analysisMode, setAnalysisModeRaw] = useState(() => {
    return localStorage.getItem('analysisMode') || 'auto';
  });

  const setAnalysisMode = (v) => {
    setAnalysisModeRaw(v);
    localStorage.setItem('analysisMode', v);
  };

  // In manual mode, stores the last selected code snippet so it survives focus changes
  const [pendingSelection, setPendingSelection] = useState(null);

  // Selection cooldown tracking
  const lastSelectionTime = useRef(0);
  const SELECTION_COOLDOWN = 2000;

  // Derived room key — every file+mode pair gets its own history
  const activeRoom = useMemo(
    () => (activeFile && activeMode ? `${activeFile}::${activeMode}` : null),
    [activeFile, activeMode]
  );

  const getChatRoom = useCallback((roomKey) => {
    return chatRooms[roomKey] || [];
  }, [chatRooms]);

  const openChatRoom = useCallback((fileName) => {
    setActiveFile(fileName);
    // Rooms are initialized lazily on first message — no greeting needed
  }, []);

  /**
   * Core send function — streams response, updates message in-place.
   */
  const sendMessage = useCallback(
    async (userMessage, context = {}) => {
      if (!activeRoom) return;

      setIsLoading(true);

      const userMsg = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };

      const aiMsgId = Date.now();
      const aiPlaceholder = {
        role: 'ai',
        content: '',
        timestamp: new Date().toISOString(),
        id: aiMsgId,
        streaming: true,
        mode: activeMode,
      };

      let historyForApi = [];

      setChatRooms((prev) => {
        const currentHistory = prev[activeRoom] || [];
        historyForApi = currentHistory.map((m) => ({ role: m.role, content: m.content }));
        return {
          ...prev,
          [activeRoom]: [...currentHistory, userMsg, aiPlaceholder],
        };
      });

      let fullResponse = '';
      const roomKey = activeRoom;

      await streamGeminiResponse({
        userMessage,
        selectedCode: context.selectedText || null,
        fileContext: context.fileContent || null,
        projectContext: context.projectContext || context.openFiles?.join(', ') || null,
        mode: activeMode,
        experienceLevel,
        chatHistory: historyForApi,
        onChunk: (chunk) => {
          fullResponse += chunk;
          setChatRooms((prev) => {
            const room = prev[roomKey] || [];
            return {
              ...prev,
              [roomKey]: room.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: fullResponse } : msg
              ),
            };
          });
        },
        onDone: () => {
          setChatRooms((prev) => {
            const room = prev[roomKey] || [];
            return {
              ...prev,
              [roomKey]: room.map((msg) =>
                msg.id === aiMsgId ? { ...msg, streaming: false } : msg
              ),
            };
          });
          setIsLoading(false);
        },
        onError: (err) => {
          setChatRooms((prev) => {
            const room = prev[roomKey] || [];
            return {
              ...prev,
              [roomKey]: room.map((msg) =>
                msg.id === aiMsgId
                  ? { ...msg, content: `Error: ${err}`, streaming: false, isError: true }
                  : msg
              ),
            };
          });
          setIsLoading(false);
        },
      });
    },
    [activeRoom, activeMode, experienceLevel]
  );

  /**
   * Handle code selection — only fires in auto mode.
   */
  const handleCodeSelection = useCallback(
    async (selectedText, fileName, fileContent) => {
      if (!selectedText || selectedText.trim().length < 10) return;

      if (analysisMode === 'manual') {
        // In manual mode: save selection so it survives focus loss, don't auto-send
        setPendingSelection({ text: selectedText, fileName, fileContent });
        return;
      }

      // Auto mode below
      const now = Date.now();
      if (now - lastSelectionTime.current < SELECTION_COOLDOWN) return;
      lastSelectionTime.current = now;

      if (activeMode === 'teachback') return;

      const autoPrompt = generateSelectionPrompt(selectedText, fileName, fileContent, activeMode);
      const context = prepareContext(fileName, fileContent, selectedText);
      await sendMessage(autoPrompt, context);
    },
    [sendMessage, activeMode, analysisMode]
  );

  /**
   * Trigger teach-back quiz — switches to teachback mode room and back.
   */
  const triggerTeachBack = useCallback(
    async (context = {}) => {
      if (!activeFile) return;
      const prevMode = activeMode;
      setActiveMode('teachback');

      const prompt = 'Quiz me on what was just explained.';
      await sendMessage(prompt, context);

      setActiveMode(prevMode);
    },
    [activeFile, activeMode, sendMessage]
  );

  const clearChatRoom = useCallback((fileName) => {
    setChatRooms((prev) => {
      const updated = { ...prev };
      // Clear all mode rooms for this file
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`${fileName}::`)) delete updated[key];
      });
      return updated;
    });
    if (activeFile === fileName) setActiveFile(null);
  }, [activeFile]);

  const clearAllChatRooms = useCallback(() => {
    setChatRooms({});
    setActiveFile(null);
  }, []);

  const value = {
    chatRooms,
    activeRoom,
    activeFile,
    isLoading,
    activeMode,
    setActiveMode,
    experienceLevel,
    setExperienceLevel,
    analysisMode,
    setAnalysisMode,
    pendingSelection,
    clearPendingSelection: () => setPendingSelection(null),
    getChatRoom,
    openChatRoom,
    sendMessage,
    handleCodeSelection,
    triggerTeachBack,
    clearChatRoom,
    clearAllChatRooms,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}
