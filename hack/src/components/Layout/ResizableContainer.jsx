import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ResizeHandle } from './ResizeHandle';
import { ControlPanel } from '../ControlPanel/ControlPanel';
import { FileExplorer } from '../FileExplorer/FileExplorer';
import { CodeEditor } from '../CodeEditor/CodeEditor';
import { TabBar } from '../CodeEditor/TabBar';
import { StatusBar } from '../CodeEditor/StatusBar';
import { AIChatroom } from '../AIChatroom/AIChatroom';
import { useEditor } from '../../contexts/EditorContext';
import { DEFAULT_LEFT_PANEL_WIDTH, DEFAULT_RIGHT_PANEL_WIDTH, MIN_PANEL_WIDTH, MAX_PANEL_PERCENT } from '../../utils/constants';

export function ResizableContainer() {
  const { theme } = useTheme();
  const { activeFile, activeTab } = useEditor();

  // Panel widths
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('leftPanelWidth');
    return saved ? parseInt(saved, 10) : DEFAULT_LEFT_PANEL_WIDTH;
  });

  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    const saved = localStorage.getItem('rightPanelWidth');
    return saved ? parseInt(saved, 10) : DEFAULT_RIGHT_PANEL_WIDTH;
  });

  const [explorerHeight, setExplorerHeight] = useState(() => {
    const saved = localStorage.getItem('explorerHeight');
    return saved ? parseInt(saved, 10) : 50; // percentage
  });

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingExplorer, setIsResizingExplorer] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('leftPanelWidth', leftPanelWidth.toString());
  }, [leftPanelWidth]);

  useEffect(() => {
    localStorage.setItem('rightPanelWidth', rightPanelWidth.toString());
  }, [rightPanelWidth]);

  useEffect(() => {
    localStorage.setItem('explorerHeight', explorerHeight.toString());
  }, [explorerHeight]);

  // Handle left panel resize
  const handleLeftResize = useCallback(
    (e) => {
      if (!isResizingLeft) return;
      const deltaX = e.movementX;
      setLeftPanelWidth((prev) => {
        const newWidth = prev + deltaX;
        const maxWidth = (window.innerWidth * MAX_PANEL_PERCENT) / 100;
        return Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxWidth));
      });
    },
    [isResizingLeft]
  );

  // Handle right panel resize
  const handleRightResize = useCallback(
    (e) => {
      if (!isResizingRight) return;
      const deltaX = -e.movementX;
      setRightPanelWidth((prev) => {
        const newWidth = prev + deltaX;
        const maxWidth = (window.innerWidth * MAX_PANEL_PERCENT) / 100;
        return Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxWidth));
      });
    },
    [isResizingRight]
  );

  // Handle explorer height resize
  const handleExplorerResize = useCallback(
    (e) => {
      if (!isResizingExplorer) return;
      const containerHeight = e.currentTarget.parentElement?.clientHeight || 600;
      const deltaY = e.movementY;
      setExplorerHeight((prev) => {
        const currentHeight = (prev / 100) * containerHeight;
        const newHeight = ((currentHeight + deltaY) / containerHeight) * 100;
        return Math.max(20, Math.min(newHeight, 80));
      });
    },
    [isResizingExplorer]
  );

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      handleLeftResize(e);
      handleRightResize(e);
      handleExplorerResize(e);
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      setIsResizingExplorer(false);
    };

    if (isResizingLeft || isResizingRight || isResizingExplorer) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isResizingExplorer ? 'ns-resize' : 'ew-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingLeft, isResizingRight, isResizingExplorer, handleLeftResize, handleRightResize, handleExplorerResize]);

  const panelHeader = (title, icon) => (
    <div
      style={{
        padding: '10px 14px',
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: theme.textDim,
        fontFamily: "'IBM Plex Mono', monospace",
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: `linear-gradient(180deg, ${theme.accent}04 0%, transparent 100%)`,
      }}
    >
      <span style={{ color: theme.accent, fontSize: 13 }}>{icon}</span>
      {title}
    </div>
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: theme.bg,
        display: 'flex',
        fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
        color: theme.text,
        overflow: 'hidden',
      }}
    >
      {/* Left Panel */}
      <div
        style={{
          width: leftPanelWidth,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${theme.border}`,
        }}
      >
        {/* Control Panel */}
        <div
          style={{
            height: `${100 - explorerHeight}%`,
            background: theme.panel,
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {panelHeader('Control Room', '◈')}
          <ControlPanel />
        </div>

        {/* Resize Handle */}
        <ResizeHandle
          onMouseDown={() => setIsResizingExplorer(true)}
          isVertical={true}
          isResizing={isResizingExplorer}
        />

        {/* File Explorer */}
        <div
          style={{
            height: `${explorerHeight}%`,
            background: theme.panel,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {panelHeader('Explorer', '⊞')}
          <div style={{ flex: 1, overflow: 'auto', padding: '4px 6px' }}>
            <FileExplorer />
          </div>
        </div>
      </div>

      {/* Left Resize Handle */}
      <ResizeHandle
        onMouseDown={() => setIsResizingLeft(true)}
        isResizing={isResizingLeft}
      />

      {/* Center Panel - Code Editor */}
      <div
        style={{
          flex: 1,
          background: theme.panelAlt,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TabBar />
        {activeFile && (
          <div
            style={{
              padding: '6px 16px',
              fontSize: 11,
              color: theme.textDim,
              fontFamily: "'IBM Plex Mono', monospace",
              borderBottom: `1px solid ${theme.border}05`,
              display: 'flex',
              gap: 4,
            }}
          >
            <span>src</span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: theme.text }}>{activeTab}</span>
            <span style={{ marginLeft: 'auto', color: theme.accent, opacity: 0.5 }}>
              {activeFile?.lang?.toUpperCase()}
            </span>
          </div>
        )}
        <CodeEditor file={activeFile} />
        <StatusBar />
      </div>

      {/* Right Resize Handle */}
      <ResizeHandle
        onMouseDown={() => setIsResizingRight(true)}
        isResizing={isResizingRight}
      />

      {/* Right Panel - AI Chatroom */}
      <div
        style={{
          width: rightPanelWidth,
          background: theme.panel,
          borderLeft: `1px solid ${theme.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {panelHeader('AI Assistant', 'λ')}
        <AIChatroom />
      </div>
    </div>
  );
}
