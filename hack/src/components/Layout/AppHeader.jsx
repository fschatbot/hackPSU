import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { useEditor } from '../../contexts/EditorContext';
import { useGitHub } from '../../contexts/GitHubContext';
import { processUploadedFiles, extractZipFile } from '../../services/fileService';
import { Settings } from '../Settings/Settings';
import { CodeLensLogo } from '../Icons/CodeLensLogo';

const MODES = [
  { id: 'explain',  label: 'Explain', color: null },
  { id: 'teaching', label: 'Teach',   color: '#a78bfa' },
  { id: 'debug',    label: 'Review',  color: '#f97316' },
  { id: 'teachback',label: 'Quiz',    color: '#34d399' },
];

const LEVEL_DESC = [
  { max: 20,  text: "Just starting out" },
  { max: 40,  text: "Know some basics" },
  { max: 60,  text: "Comfortable with code" },
  { max: 80,  text: "Strong fundamentals" },
  { max: 101, text: "Senior engineer" },
];

function getLevelDesc(level) {
  return LEVEL_DESC.find((l) => level < l.max)?.text || LEVEL_DESC[LEVEL_DESC.length - 1].text;
}

export function AppHeader() {
  const { theme } = useTheme();
  const { activeMode, setActiveMode, experienceLevel, setExperienceLevel } = useAI();
  const { loadFiles, resetProject } = useEditor();
  const { loadFromUrl } = useGitHub();
  const [showSettings, setShowSettings] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef(null);
  const folderRef = useRef(null);
  const zipRef = useRef(null);

  const handleFiles = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setIsLoading(true); setLoadError(null);
    try { loadFiles(await processUploadedFiles(files)); setShowNewProject(false); }
    catch (err) { setLoadError(err.message); }
    finally { setIsLoading(false); e.target.value = ''; }
  };

  const handleZip = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true); setLoadError(null);
    try {
      const tree = await extractZipFile(file);
      if (!tree || !Object.keys(tree).length) { setLoadError('ZIP looks empty.'); return; }
      loadFiles(tree); setShowNewProject(false);
    } catch (err) { setLoadError(err.message); }
    finally { setIsLoading(false); e.target.value = ''; }
  };

  const handleGitHub = async () => {
    if (!githubUrl.trim()) return;
    setIsLoading(true); setLoadError(null);
    try {
      const tree = await loadFromUrl(githubUrl.trim());
      if (!tree || !Object.keys(tree).length) { setLoadError('No files found. Is it public?'); return; }
      loadFiles(tree); setShowNewProject(false); setGithubUrl('');
    } catch (err) { setLoadError(err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 24,
      background: theme.panel,
      borderBottom: `1px solid ${theme.border}`,
      flexShrink: 0,
      fontFamily: "'Inter', system-ui, sans-serif",
      zIndex: 10,
    }}>

      {/* Wordmark — click to go home */}
      <button
        onClick={resetProject}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
        title="Back to home"
      >
        <CodeLensLogo size={36} color={theme.accent} />
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: theme.textBright,
          letterSpacing: '-0.01em',
        }}>
          CodeLens
        </span>
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: theme.border, flexShrink: 0 }} />

      {/* Mode tabs */}
      <div
        data-tutorial="mode-buttons"
        style={{
          display: 'flex',
          gap: 4,
          background: theme.panelAlt,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: 3,
          flexShrink: 0,
        }}>
        {MODES.map((m) => {
          const active = activeMode === m.id;
          const color = m.color || theme.accent;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              style={{
                padding: '4px 14px',
                borderRadius: 7,
                border: 'none',
                background: active ? (m.color ? `${m.color}18` : theme.accentDim) : 'transparent',
                color: active ? color : theme.textDim,
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: active ? `1px solid ${color}30` : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: theme.border, flexShrink: 0 }} />

      {/* Experience slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, maxWidth: 380 }}>
        <span style={{ fontSize: 11, color: theme.textDim, flexShrink: 0 }}>🌱</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <input
            type="range" min={0} max={100}
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(Number(e.target.value))}
            style={{
              width: '100%', height: 3,
              appearance: 'none',
              background: `linear-gradient(to right, ${theme.accent} ${experienceLevel}%, ${theme.border} ${experienceLevel}%)`,
              borderRadius: 2, outline: 'none', cursor: 'pointer',
              accentColor: theme.accent,
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: theme.textDim, flexShrink: 0 }}>⚡</span>
        <span style={{
          fontSize: 11.5, color: theme.accent,
          maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {getLevelDesc(experienceLevel)}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: theme.border, flexShrink: 0 }} />

      {/* New project */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => { setShowNewProject(p => !p); setLoadError(null); }}
          style={{
            height: 28,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0 10px',
            background: showNewProject ? theme.accentDim : 'transparent',
            border: `1px solid ${showNewProject ? theme.accent + '40' : theme.border}`,
            borderRadius: 7,
            color: showNewProject ? theme.accent : theme.textDim,
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { if (!showNewProject) { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}}
          onMouseLeave={(e) => { if (!showNewProject) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textDim; }}}
          title="Load a new project"
        >
          + New Project
        </button>

        {showNewProject && (
          <>
            {/* Backdrop */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setShowNewProject(false)}
            />
            {/* Dropdown */}
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 300, padding: 12,
              background: theme.panel,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              boxShadow: `0 12px 40px rgba(0,0,0,0.5)`,
              zIndex: 100,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.textBright, marginBottom: 10 }}>
                Open Project
              </div>

              {loadError && (
                <div style={{
                  padding: '8px 10px', borderRadius: 8, marginBottom: 10,
                  background: `${theme.danger}12`, border: `1px solid ${theme.danger}30`,
                  fontSize: 12, color: theme.danger,
                }}>{loadError}</div>
              )}

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: 'Open folder', icon: '📂', onClick: () => folderRef.current?.click() },
                  { label: 'Open files', icon: '📄', onClick: () => fileRef.current?.click() },
                  { label: 'Open ZIP', icon: '📦', onClick: () => zipRef.current?.click() },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    disabled={isLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px',
                      background: 'transparent',
                      border: 'none', borderRadius: 8,
                      color: theme.text, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.panelHover || theme.panelAlt; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: theme.border, margin: '8px 0' }} />

              {/* GitHub URL */}
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.textDim, marginBottom: 6 }}>
                GitHub URL
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGitHub()}
                  placeholder="owner/repo or full URL"
                  disabled={isLoading}
                  style={{
                    flex: 1, padding: '7px 10px',
                    background: theme.panelAlt,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 7,
                    color: theme.text, fontSize: 12,
                    outline: 'none', fontFamily: "'Geist Mono', monospace",
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = theme.accent)}
                  onBlur={(e) => (e.target.style.borderColor = theme.border)}
                />
                <button
                  onClick={handleGitHub}
                  disabled={isLoading || !githubUrl.trim()}
                  style={{
                    padding: '7px 12px', borderRadius: 7, border: 'none',
                    background: theme.accent,
                    color: '#000', fontSize: 12, fontWeight: 600,
                    cursor: isLoading || !githubUrl.trim() ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !githubUrl.trim() ? 0.4 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {isLoading ? '...' : 'Go'}
                </button>
              </div>

              {/* Hidden inputs */}
              <input ref={folderRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFiles} style={{ display: 'none' }} />
              <input ref={fileRef} type="file" multiple onChange={handleFiles} style={{ display: 'none' }} />
              <input ref={zipRef} type="file" accept=".zip" onChange={handleZip} style={{ display: 'none' }} />
            </div>
          </>
        )}
      </div>

      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        style={{
          width: 30, height: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent',
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          color: theme.textDim, fontSize: 15,
          cursor: 'pointer', flexShrink: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textDim; }}
        title="Settings"
      >
        ⚙
      </button>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
