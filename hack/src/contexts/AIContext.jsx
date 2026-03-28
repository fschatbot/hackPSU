import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { streamGeminiResponse, generateSelectionPrompt, prepareContext } from '../services/aiService';

const AIContext = createContext();

export function AIProvider({ children }) {
  // Per-file chat rooms: { fileName: [messages] }
  const [chatRooms, setChatRooms] = useState({});

  // Currently active chat room (file)
  const [activeRoom, setActiveRoom] = useState(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Active mode: 'explain' | 'teaching' | 'debug' | 'teachback'
  const [activeMode, setActiveMode] = useState('explain');

  // Experience level: 0-100
  const [experienceLevel, setExperienceLevel] = useState(50);

  // Selection cooldown tracking
  const lastSelectionTime = useRef(0);
  const SELECTION_COOLDOWN = 2000;

  const getChatRoom = useCallback((fileName) => {
    return chatRooms[fileName] || [];
  }, [chatRooms]);

  const openChatRoom = useCallback((fileName) => {
    setActiveRoom(fileName);

    setChatRooms((prev) => {
      if (!prev[fileName]) {
        return {
          ...prev,
          [fileName]: [
            {
              role: 'ai',
              content: `Ready to help with ${fileName}. Select any code to analyze it, or ask me anything.`,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return prev;
    });
  }, []);

  /**
   * Core send function — uses streaming, updates message in-place as chunks arrive.
   */
  const sendMessage = useCallback(
    async (userMessage, context = {}) => {
      if (!activeRoom) return;

      setIsLoading(true);

      // Add user message
      const userMsg = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };

      // Add streaming placeholder for AI response
      const aiMsgId = Date.now();
      const aiPlaceholder = {
        role: 'ai',
        content: '',
        timestamp: new Date().toISOString(),
        id: aiMsgId,
        streaming: true,
        mode: activeMode,
      };

      // Capture history from state at time of adding messages
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
        projectContext: context.openFiles?.join(', ') || null,
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
   * Handle code selection — auto-triggers in whatever mode is active.
   */
  const handleCodeSelection = useCallback(
    async (selectedText, fileName, fileContent) => {
      const now = Date.now();
      if (now - lastSelectionTime.current < SELECTION_COOLDOWN) return;
      lastSelectionTime.current = now;

      if (!selectedText || selectedText.trim().length < 10) return;

      // teachback mode shouldn't auto-trigger on selection
      if (activeMode === 'teachback') return;

      const autoPrompt = generateSelectionPrompt(selectedText, fileName, fileContent, activeMode);
      const context = prepareContext(fileName, fileContent, selectedText);
      await sendMessage(autoPrompt, context);
    },
    [sendMessage, activeMode]
  );

  /**
   * Trigger teach-back quiz on the last AI response in the current room.
   */
  const triggerTeachBack = useCallback(
    async (context = {}) => {
      if (!activeRoom) return;
      const prevMode = activeMode;
      setActiveMode('teachback');

      const prompt = 'Quiz me on what was just explained.';
      await sendMessage(prompt, context);

      setActiveMode(prevMode);
    },
    [activeRoom, activeMode, sendMessage]
  );

  const clearChatRoom = useCallback((fileName) => {
    setChatRooms((prev) => {
      const updated = { ...prev };
      delete updated[fileName];
      return updated;
    });
    if (activeRoom === fileName) setActiveRoom(null);
  }, [activeRoom]);

  const clearAllChatRooms = useCallback(() => {
    setChatRooms({});
    setActiveRoom(null);
  }, []);

  const value = {
    chatRooms,
    activeRoom,
    isLoading,
    activeMode,
    setActiveMode,
    experienceLevel,
    setExperienceLevel,
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
