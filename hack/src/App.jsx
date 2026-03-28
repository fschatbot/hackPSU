import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { EditorProvider } from './contexts/EditorContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { GitHubProvider } from './contexts/GitHubContext';
import { AIProvider } from './contexts/AIContext';
import { AuthProvider } from './contexts/AuthContext';
import { ResizableContainer } from './components/Layout/ResizableContainer';
import { LoadProject } from './components/LoadProject/LoadProject';
import { useEditor } from './contexts/EditorContext';
import { useTheme } from './contexts/ThemeContext';
import 'highlight.js/styles/atom-one-dark.css';

function AppContent() {
  const { files, loadFiles } = useEditor();
  const { loadSession } = useSession();
  const { theme } = useTheme();
  const [showLoadProject, setShowLoadProject] = useState(true);

  useEffect(() => {
    // Try to restore previous session on mount
    const session = loadSession();
    if (session?.files) {
      loadFiles(session.files);
      setShowLoadProject(false);
    }
  }, [loadSession, loadFiles]);

  const handleProjectLoaded = () => {
    setShowLoadProject(false);
  };

  if (showLoadProject && !files) {
    return <LoadProject onProjectLoaded={handleProjectLoaded} />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          overflow: hidden;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: ${theme.border};
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${theme.textDim};
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }

        input::placeholder,
        textarea::placeholder {
          color: ${theme.textDim};
        }

        /* Override highlight.js colors to match theme */
        .hljs {
          background: transparent !important;
          color: ${theme.text} !important;
        }

        .hljs-keyword,
        .hljs-selector-tag,
        .hljs-title,
        .hljs-section,
        .hljs-doctag,
        .hljs-name,
        .hljs-strong {
          color: ${theme.syntax?.keyword || '#c678dd'} !important;
          font-weight: 600;
        }

        .hljs-string,
        .hljs-title,
        .hljs-section,
        .hljs-attr,
        .hljs-template-tag,
        .hljs-template-variable,
        .hljs-type,
        .hljs-addition {
          color: ${theme.syntax?.string || '#98c379'} !important;
        }

        .hljs-comment,
        .hljs-quote,
        .hljs-deletion,
        .hljs-meta {
          color: ${theme.syntax?.comment || '#5c6370'} !important;
          font-style: italic;
        }

        .hljs-number,
        .hljs-regexp,
        .hljs-literal,
        .hljs-variable,
        .hljs-template-variable,
        .hljs-link {
          color: ${theme.syntax?.number || '#d19a66'} !important;
        }

        .hljs-built_in,
        .hljs-builtin-name,
        .hljs-function {
          color: ${theme.syntax?.fn || '#61afef'} !important;
        }

        .hljs-tag,
        .hljs-selector-id,
        .hljs-selector-class,
        .hljs-selector-attr,
        .hljs-selector-pseudo {
          color: ${theme.syntax?.tag || '#e06c75'} !important;
        }

        .hljs-class .hljs-title,
        .hljs-type {
          color: ${theme.syntax?.type || '#e5c07b'} !important;
        }

        select {
          cursor: pointer;
        }

        button {
          font-family: inherit;
        }
      `}</style>
      <ResizableContainer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EditorProvider>
          <GitHubProvider>
            <AIProvider>
              <SessionProvider>
                <AppContent />
              </SessionProvider>
            </AIProvider>
          </GitHubProvider>
        </EditorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
