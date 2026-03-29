import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ResizeHandle } from './ResizeHandle';
import { FileExplorer } from '../FileExplorer/FileExplorer';
import { EditableCodeEditor } from '../CodeEditor/EditableCodeEditor';
import { TabBar } from '../CodeEditor/TabBar';
import { StatusBar } from '../CodeEditor/StatusBar';
import { AIChatroom } from '../AIChatroom/AIChatroom';
import { AppHeader } from './AppHeader';
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

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('leftPanelWidth', leftPanelWidth.toString());
  }, [leftPanelWidth]);

  useEffect(() => {
    localStorage.setItem('rightPanelWidth', rightPanelWidth.toString());
  }, [rightPanelWidth]);

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

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      handleLeftResize(e);
      handleRightResize(e);
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingLeft, isResizingRight, handleLeftResize, handleRightResize]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: theme.bg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: theme.text,
        overflow: 'hidden',
      }}
    >
      <AppHeader />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left Panel — File Explorer only */}
      <div
        style={{
          width: leftPanelWidth,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${theme.border}`,
          background: theme.panel,
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 6px' }}>
          <FileExplorer />
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
              fontFamily: "'Geist Mono', monospace",
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
        <EditableCodeEditor file={activeFile} />
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
        <AIChatroom />
      </div>
      </div>
    </div>
  );
}
