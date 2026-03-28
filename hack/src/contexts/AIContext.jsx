import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { sendToAI, generateSelectionPrompt, prepareContext } from '../services/aiService';

const AIContext = createContext();

export function AIProvider({ children }) {
  // Per-file chat rooms: { fileName: [messages] }
  const [chatRooms, setChatRooms] = useState({});

  // Currently active chat room (file)
  const [activeRoom, setActiveRoom] = useState(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Selection cooldown tracking
  const lastSelectionTime = useRef(0);
  const SELECTION_COOLDOWN = 2000; // 2 seconds

  /**
   * Get chat messages for a specific file
   */
  const getChatRoom = useCallback((fileName) => {
    return chatRooms[fileName] || [];
  }, [chatRooms]);

  /**
   * Create or switch to a chat room for a file
   */
  const openChatRoom = useCallback((fileName) => {
    setActiveRoom(fileName);

    // Initialize chat room if it doesn't exist
    if (!chatRooms[fileName]) {
      setChatRooms((prev) => ({
        ...prev,
        [fileName]: [
          {
            role: 'ai',
            content: `Hello! I'm here to help you with **${fileName}**. You can ask me questions, or select code to get automatic suggestions.`,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    }
  }, [chatRooms]);

  /**
   * Add a message to the current active chat room
   */
  const addMessage = useCallback((message) => {
    if (!activeRoom) return;

    setChatRooms((prev) => ({
      ...prev,
      [activeRoom]: [
        ...(prev[activeRoom] || []),
        {
          ...message,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  }, [activeRoom]);

  /**
   * Send a user message and get AI response
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
      addMessage(userMsg);

      try {
        // Get conversation history
        const history = chatRooms[activeRoom] || [];
        const messages = history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        messages.push({ role: 'user', content: userMessage });

        // Send to AI
        const aiResponse = await sendToAI(messages, context);

        // Add AI response
        const aiMsg = {
          role: 'ai',
          content: aiResponse,
          timestamp: new Date().toISOString(),
        };
        addMessage(aiMsg);
      } catch (error) {
        console.error('Error sending message to AI:', error);
        addMessage({
          role: 'ai',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [activeRoom, chatRooms, addMessage]
  );

  /**
   * Handle code selection with cooldown
   */
  const handleCodeSelection = useCallback(
    async (selectedText, fileName, fileContent) => {
      const now = Date.now();

      // Check cooldown
      if (now - lastSelectionTime.current < SELECTION_COOLDOWN) {
        return;
      }

      // Update cooldown timer
      lastSelectionTime.current = now;

      // Don't process empty or very short selections
      if (!selectedText || selectedText.trim().length < 10) {
        return;
      }

      // Generate automatic prompt
      const autoPrompt = generateSelectionPrompt(selectedText, fileName, fileContent);

      // Prepare context
      const context = prepareContext(fileName, fileContent, selectedText);

      // Send to AI
      await sendMessage(autoPrompt, context);
    },
    [sendMessage]
  );

  /**
   * Clear chat history for a specific file
   */
  const clearChatRoom = useCallback((fileName) => {
    setChatRooms((prev) => {
      const updated = { ...prev };
      delete updated[fileName];
      return updated;
    });

    // If this was the active room, clear active state
    if (activeRoom === fileName) {
      setActiveRoom(null);
    }
  }, [activeRoom]);

  /**
   * Clear all chat history
   */
  const clearAllChatRooms = useCallback(() => {
    setChatRooms({});
    setActiveRoom(null);
  }, []);

  const value = {
    chatRooms,
    activeRoom,
    isLoading,
    getChatRoom,
    openChatRoom,
    sendMessage,
    handleCodeSelection,
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
