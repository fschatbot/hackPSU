import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
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

  // Track the last selection so mode switches can re-trigger analysis
  const lastSelection = useRef(null);

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
    lastSelection.current = null; // Clear stale selection from previous file
  }, []);

  /**
   * Core send function — streams response, updates message in-place.
   */
  const sendMessage = useCallback(
    async (userMessage, context = {}, { overrideRoom, overrideMode } = {}) => {
      const targetRoom = overrideRoom || activeRoom;
      const targetMode = overrideMode || activeMode;
      if (!targetRoom) return;

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
        mode: targetMode,
      };

      let historyForApi = [];

      setChatRooms((prev) => {
        const currentHistory = prev[targetRoom] || [];
        historyForApi = currentHistory.map((m) => ({ role: m.role, content: m.content }));
        return {
          ...prev,
          [targetRoom]: [...currentHistory, userMsg, aiPlaceholder],
        };
      });

      let fullResponse = '';
      const roomKey = targetRoom;

      await streamGeminiResponse({
        userMessage,
        selectedCode: context.selectedText || null,
        fileContext: context.fileContent || null,
        projectContext: context.projectContext || context.openFiles?.join(', ') || null,
        mode: targetMode,
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

      // Save the selection so mode switches can re-trigger
      lastSelection.current = { text: selectedText, fileName, fileContent };

      if (activeMode === 'teachback') return;

      const autoPrompt = generateSelectionPrompt(selectedText, fileName, fileContent, activeMode);
      const context = prepareContext(fileName, fileContent, selectedText);
      await sendMessage(autoPrompt, context);
    },
    [sendMessage, activeMode, analysisMode]
  );

  /**
   * Trigger teach-back quiz — switches to quiz mode and kicks off the first question.
   */
  const triggerTeachBack = useCallback(
    async (context = {}) => {
      if (!activeFile) return;
      const quizRoom = `${activeFile}::teachback`;
      setActiveMode('teachback');

      const prompt = 'Quiz me on what was just explained. Start with one question.';
      await sendMessage(prompt, context, { overrideRoom: quizRoom, overrideMode: 'teachback' });
    },
    [activeFile, sendMessage]
  );

  // Re-trigger analysis when the mode changes (if there's a selection and we're in auto mode)
  const prevModeRef = useRef(activeMode);
  const chatRoomsRef = useRef(chatRooms);
  chatRoomsRef.current = chatRooms;

  useEffect(() => {
    if (prevModeRef.current === activeMode) return;
    prevModeRef.current = activeMode;

    if (analysisMode !== 'auto') return;
    if (activeMode === 'teachback') return;
    if (!lastSelection.current) return;

    const { text, fileName, fileContent } = lastSelection.current;
    const roomKey = `${fileName}::${activeMode}`;
    // Don't re-analyze if this room already has messages
    if (chatRoomsRef.current[roomKey] && chatRoomsRef.current[roomKey].length > 0) return;

    const autoPrompt = generateSelectionPrompt(text, fileName, fileContent, activeMode);
    const context = prepareContext(fileName, fileContent, text);
    sendMessage(autoPrompt, context);
  }, [activeMode, analysisMode, sendMessage]);

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

  // Welcome message — injected when a project is first loaded
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const hasWelcomedRef = useRef(false);

  const welcomeProject = useCallback((fileTree) => {
    if (!fileTree || hasWelcomedRef.current) return;
    hasWelcomedRef.current = true;

    // Gather file info for a smart greeting
    const fileNames = [];
    const walk = (tree) => {
      Object.entries(tree).forEach(([name, node]) => {
        if (node.type === 'file') fileNames.push(name);
        else if (node.children) walk(node.children);
      });
    };
    walk(fileTree);

    const exts = {};
    fileNames.forEach(f => {
      const ext = f.split('.').pop()?.toLowerCase();
      if (ext) exts[ext] = (exts[ext] || 0) + 1;
    });

    const topLangs = Object.entries(exts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([ext]) => ext);

    const langLabel = {
      js: 'JavaScript', jsx: 'React', ts: 'TypeScript', tsx: 'React/TS',
      py: 'Python', java: 'Java', go: 'Go', rs: 'Rust', rb: 'Ruby',
      css: 'CSS', html: 'HTML', json: 'JSON', md: 'Markdown',
      cpp: 'C++', c: 'C', php: 'PHP', swift: 'Swift', kt: 'Kotlin',
    };

    const langs = topLangs.map(e => langLabel[e] || e.toUpperCase()).join(', ');
    const count = fileNames.length;

    setWelcomeMessage({
      role: 'ai',
      content: `Hey! I just loaded **${count} file${count !== 1 ? 's' : ''}** — looks like a ${langs} project.\n\nHere's how I can help:\n- **Select any code** in the editor and I'll explain it instantly\n- Switch modes up top: **Explain** · **Teach** · **Review** · **Quiz**\n- Use the experience slider to set your level\n\nOpen a file from the sidebar to get started — or ask me anything!`,
      timestamp: new Date().toISOString(),
      mode: 'explain',
      isWelcome: true,
    });
  }, []);

  const resetWelcome = useCallback(() => {
    hasWelcomedRef.current = false;
    setWelcomeMessage(null);
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
    welcomeMessage,
    welcomeProject,
    resetWelcome,
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
