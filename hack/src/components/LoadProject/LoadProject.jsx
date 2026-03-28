import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEditor } from '../../contexts/EditorContext';
import { useGitHub } from '../../contexts/GitHubContext';
import { processUploadedFiles, extractZipFile } from '../../services/fileService';
import { SAMPLE_FILES } from '../../utils/constants';

const INPUT_METHODS = [
  { id: 'sample', icon: '✦', label: 'Try a sample', desc: 'Jump in with example code — no setup needed' },
  { id: 'upload', icon: '↑', label: 'Upload files', desc: 'Drop in files or a whole folder from your computer' },
  { id: 'zip',    icon: '⊞', label: 'Upload ZIP', desc: 'Got a .zip? Drag it in and we\'ll unpack it for you' },
  { id: 'url',    icon: '⌁', label: 'GitHub URL', desc: 'Paste any public GitHub repo link' },
];

export function LoadProject({ onProjectLoaded }) {
  const { theme } = useTheme();
  const { loadFiles } = useEditor();
  const { isAuthenticated, authenticate, repositories, fetchRepositories, loadRepositoryAsProject, loadFromUrl } = useGitHub();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const zipInputRef = useRef(null);

  const handleLoadSample = () => {
    setLoading(true);
    setTimeout(() => {
      loadFiles(SAMPLE_FILES);
      setLoading(false);
      onProjectLoaded?.();
    }, 500);
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const fileTree = await processUploadedFiles(files);
      loadFiles(fileTree);
      onProjectLoaded?.();
    } catch (err) {
      setError('Failed to process uploaded files: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleZipUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fileTree = await extractZipFile(file);
      if (!fileTree || Object.keys(fileTree).length === 0) {
        setError('ZIP appears to be empty or contains only binary files.');
        return;
      }
      loadFiles(fileTree);
      onProjectLoaded?.();
    } catch (err) {
      setError('Failed to extract ZIP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlLoad = async () => {
    if (!githubUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const fileTree = await loadFromUrl(githubUrl.trim());
      if (!fileTree || Object.keys(fileTree).length === 0) {
        setError('No files found. Make sure the repo is public.');
        return;
      }
      loadFiles(fileTree);
      onProjectLoaded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubAuth = async () => {
    const token = prompt('Enter your GitHub Personal Access Token:');
    if (token) {
      setLoading(true);
      try {
        await authenticate(token);
        await fetchRepositories();
      } catch (err) {
        setError('Failed to authenticate with GitHub: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLoadGitHubRepo = async () => {
    if (!selectedRepo) return;
    setLoading(true);
    setError(null);
    try {
      const fileTree = await loadRepositoryAsProject(selectedRepo.owner.login, selectedRepo.name);
      if (fileTree) {
        loadFiles(fileTree);
        onProjectLoaded?.();
      } else {
        setError('Failed to load repository');
      }
    } catch (err) {
      setError('Failed to load GitHub repository: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const btnPrimary = {
    width: '100%',
    padding: '13px 24px',
    background: `linear-gradient(135deg, ${theme.accent}, #818cf8)`,
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
    letterSpacing: '0.01em',
  };

  const btnSecondary = {
    flex: 1,
    padding: '13px 16px',
    background: theme.panelAlt,
    border: `1.5px solid ${theme.border}`,
    borderRadius: 12,
    color: theme.text,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: theme.panelAlt,
    border: `1.5px solid ${theme.border}`,
    borderRadius: 12,
    color: theme.text,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    marginBottom: 12,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'IBM Plex Sans', system-ui, sans-serif",
      color: theme.text,
      padding: 16,
    }}>

      {/* Soft radial glow behind the card */}
      <div style={{
        position: 'fixed',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 400,
        background: `radial-gradient(ellipse, ${theme.accentGlow} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 560,
        width: '100%',
        background: theme.panel,
        border: `1.5px solid ${theme.border}`,
        borderRadius: 20,
        padding: '40px 36px',
        position: 'relative',
        boxShadow: `0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px ${theme.border}`,
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 16,
            background: theme.accentDim,
            border: `1.5px solid ${theme.accent}40`,
            fontSize: 24,
            marginBottom: 16,
          }}>
            🔍
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: theme.textBright,
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}>
            CodeLens
          </div>
          <div style={{ fontSize: 15, color: theme.textDim, lineHeight: 1.5 }}>
            Drop in any code and understand it instantly —<br />
            at your level, in your words.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: `${theme.danger}15`,
            border: `1px solid ${theme.danger}50`,
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 13,
            color: theme.danger,
          }}>
            {error}
          </div>
        )}

        {/* Method cards — shown when no mode selected */}
        {!mode && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {INPUT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => m.id === 'sample' ? handleLoadSample() : setMode(m.id)}
                disabled={loading}
                style={{
                  padding: '18px 16px',
                  background: theme.panelAlt,
                  border: `1.5px solid ${theme.border}`,
                  borderRadius: 14,
                  color: theme.text,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.accent;
                  e.currentTarget.style.background = theme.accentDim;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.background = theme.panelAlt;
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 8, color: theme.accent }}>{m.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.textBright, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: theme.textDim, lineHeight: 1.4 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Upload files panel */}
        {mode === 'upload' && (
          <div>
            <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}>← back</button>
            <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 16 }}>Choose files or an entire folder.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => folderInputRef.current?.click()} disabled={loading} style={btnPrimary}>
                {loading ? 'Loading…' : 'Upload Folder'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={btnSecondary}>
                Upload Files
              </button>
            </div>
            <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
            <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
          </div>
        )}

        {/* ZIP panel */}
        {mode === 'zip' && (
          <div>
            <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}>← back</button>
            <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 16 }}>Upload a .zip — we'll unpack it automatically.</p>
            <button onClick={() => zipInputRef.current?.click()} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Extracting…' : 'Choose ZIP file'}
            </button>
            <input ref={zipInputRef} type="file" accept=".zip" onChange={handleZipUpload} style={{ display: 'none' }} />
          </div>
        )}

        {/* GitHub URL panel */}
        {mode === 'url' && (
          <div>
            <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}>← back</button>
            <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 16 }}>Works with any public GitHub repo.</p>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
              placeholder="https://github.com/owner/repo"
              disabled={loading}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = theme.accent)}
              onBlur={(e) => (e.target.style.borderColor = theme.border)}
            />
            <button
              onClick={handleUrlLoad}
              disabled={loading || !githubUrl.trim()}
              style={{ ...btnPrimary, opacity: loading || !githubUrl.trim() ? 0.5 : 1 }}
            >
              {loading ? 'Loading repo…' : 'Load Repo'}
            </button>
          </div>
        )}

        {/* GitHub OAuth panel */}
        {mode === 'github' && (
          <div>
            <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}>← back</button>
            {!isAuthenticated ? (
              <>
                <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 16 }}>Connect GitHub to browse your repos.</p>
                <button onClick={handleGitHubAuth} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Connecting…' : 'Connect GitHub'}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 16 }}>Pick a repo to explore:</p>
                <select
                  value={selectedRepo?.id || ''}
                  onChange={(e) => setSelectedRepo(repositories.find((r) => r.id === parseInt(e.target.value)))}
                  style={{ ...inputStyle, marginBottom: 16 }}
                >
                  <option value="">Select a repository…</option>
                  {repositories.map((repo) => (
                    <option key={repo.id} value={repo.id}>{repo.full_name}</option>
                  ))}
                </select>
                <button onClick={handleLoadGitHubRepo} disabled={loading || !selectedRepo} style={{ ...btnPrimary, opacity: loading || !selectedRepo ? 0.5 : 1 }}>
                  {loading ? 'Loading…' : 'Load Repository'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        {!mode && (
          <p style={{ textAlign: 'center', fontSize: 12, color: theme.textDim, marginTop: 24, marginBottom: 0 }}>
            Nothing to install. Runs entirely in your browser.
          </p>
        )}
      </div>
    </div>
  );
}
