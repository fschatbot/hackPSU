import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEditor } from '../../contexts/EditorContext';
import { useGitHub } from '../../contexts/GitHubContext';
import { processUploadedFiles, extractZipFile } from '../../services/fileService';
import { CodeLensLogo } from '../Icons/CodeLensLogo';
import { SAMPLE_FILES } from '../../utils/constants';

const METHODS = [
  {
    id: 'sample',
    icon: '⚡',
    label: 'Try a quick example',
    desc: 'Jump straight in — no files needed',
    action: true,
  },
  {
    id: 'upload',
    icon: '📂',
    label: 'Upload files or a folder',
    desc: 'Open a project from your computer',
  },
  {
    id: 'zip',
    icon: '📦',
    label: 'Upload a ZIP',
    desc: 'Drop in a zipped project',
  },
  {
    id: 'url',
    icon: '🔗',
    label: 'GitHub URL',
    desc: 'Load any public repository',
  },
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
    setTimeout(() => { loadFiles(SAMPLE_FILES); setLoading(false); onProjectLoaded?.(); }, 500);
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setLoading(true); setError(null);
    try { loadFiles(await processUploadedFiles(files)); onProjectLoaded?.(); }
    catch (err) { setError('Could not read those files: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleZipUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const tree = await extractZipFile(file);
      if (!tree || !Object.keys(tree).length) { setError('That ZIP looks empty or has only binary files.'); return; }
      loadFiles(tree); onProjectLoaded?.();
    } catch (err) { setError('Could not unpack ZIP: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleUrlLoad = async () => {
    if (!githubUrl.trim()) return;
    setLoading(true); setError(null);
    try {
      const tree = await loadFromUrl(githubUrl.trim());
      if (!tree || !Object.keys(tree).length) { setError("Couldn't find any files. Is the repo public?"); return; }
      loadFiles(tree); onProjectLoaded?.();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleGitHubAuth = async () => {
    const token = prompt('Paste your GitHub Personal Access Token:');
    if (!token) return;
    setLoading(true);
    try { await authenticate(token); await fetchRepositories(); }
    catch (err) { setError('GitHub auth failed: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleLoadGitHubRepo = async () => {
    if (!selectedRepo) return;
    setLoading(true); setError(null);
    try {
      const tree = await loadRepositoryAsProject(selectedRepo.owner.login, selectedRepo.name);
      if (tree) { loadFiles(tree); onProjectLoaded?.(); }
      else setError('Could not load that repository.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const btn = {
    primary: {
      width: '100%', padding: '12px 20px',
      background: theme.accent,
      border: 'none', borderRadius: 10,
      color: '#000', fontSize: 14, fontWeight: 700,
      cursor: 'pointer', letterSpacing: '-0.01em',
    },
    ghost: {
      padding: '12px 20px',
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      color: theme.text, fontSize: 14, fontWeight: 500,
      cursor: 'pointer',
    },
    input: {
      width: '100%', padding: '11px 14px',
      background: theme.panelAlt,
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      color: theme.text, fontSize: 13.5,
      outline: 'none', boxSizing: 'border-box',
      fontFamily: "'Geist Mono', monospace",
      transition: 'border-color 0.15s',
    },
    back: {
      background: 'none', border: 'none',
      color: theme.textDim, fontSize: 13,
      cursor: 'pointer', padding: '0 0 20px',
      display: 'flex', alignItems: 'center', gap: 6,
    },
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: theme.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: theme.text,
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 500,
        background: `radial-gradient(ellipse, ${theme.accentGlow} 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 480,
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Hero */}
        {!mode && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, marginBottom: 20,
              }}>
                <CodeLensLogo size={48} color={theme.accent} />
                <span style={{
                  fontSize: 18, fontWeight: 700,
                  color: theme.textBright,
                  letterSpacing: '-0.01em',
                }}>
                  CodeLens
                </span>
              </div>
              <h1 style={{
                fontSize: 36, fontWeight: 800,
                color: theme.textBright,
                letterSpacing: '-0.03em', lineHeight: 1.15,
                margin: '0 0 16px',
              }}>
                Drop any code.<br />Understand everything.
              </h1>
              <p style={{
                fontSize: 15, color: theme.textDim,
                lineHeight: 1.65, margin: 0,
              }}>
                Select a piece of code and get a plain-English explanation,
                a deep-dive into the theory behind it, or an instant bug review.
                All at your level.
              </p>
            </div>

            {/* Method cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {METHODS.map((m, i) => (
                <button
                  key={m.id}
                  disabled={loading}
                  onClick={() => m.action ? handleLoadSample() : setMode(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    background: theme.panel,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    cursor: 'pointer', textAlign: 'left',
                    color: theme.text,
                    transition: 'border-color 0.15s, background 0.15s',
                    animation: `fadeUp 0.4s ease ${i * 0.07}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${theme.accent}50`;
                    e.currentTarget.style.background = theme.panelHover || '#12122a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.background = theme.panel;
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{m.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.textBright, marginBottom: 2 }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textDim }}>
                      {m.desc}
                    </div>
                  </div>
                  <span style={{ color: theme.textDim, fontSize: 18, flexShrink: 0, lineHeight: 1 }}>›</span>
                </button>
              ))}
            </div>

            {loading && (
              <p style={{ textAlign: 'center', fontSize: 13, color: theme.textDim }}>Loading…</p>
            )}

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: `${theme.danger}12`,
                border: `1px solid ${theme.danger}30`,
                fontSize: 13, color: theme.danger, marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: 12, color: theme.textMuted || theme.textDim, marginTop: 4 }}>
              Runs entirely in your browser · Nothing to install
            </p>
          </>
        )}

        {/* ── Subpanels ── */}

        {mode === 'upload' && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <button style={btn.back} onClick={() => { setMode(null); setError(null); }}>← Back</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textBright, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Upload files
            </h2>
            <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 20, lineHeight: 1.6 }}>
              Choose individual files or open an entire folder.
            </p>
            {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${theme.danger}12`, border: `1px solid ${theme.danger}30`, fontSize: 13, color: theme.danger, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...btn.primary, flex: 1 }} disabled={loading} onClick={() => folderInputRef.current?.click()}>
                {loading ? 'Loading…' : 'Open folder'}
              </button>
              <button style={{ ...btn.ghost, flex: 1 }} disabled={loading} onClick={() => fileInputRef.current?.click()}>
                Pick files
              </button>
            </div>
            <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
            <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
          </div>
        )}

        {mode === 'zip' && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <button style={btn.back} onClick={() => { setMode(null); setError(null); }}>← Back</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textBright, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Upload a ZIP
            </h2>
            <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 20, lineHeight: 1.6 }}>
              We'll extract it automatically. Works great with GitHub downloads.
            </p>
            {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${theme.danger}12`, border: `1px solid ${theme.danger}30`, fontSize: 13, color: theme.danger, marginBottom: 16 }}>{error}</div>}
            <button style={{ ...btn.primary, opacity: loading ? 0.5 : 1 }} disabled={loading} onClick={() => zipInputRef.current?.click()}>
              {loading ? 'Extracting…' : 'Choose ZIP file'}
            </button>
            <input ref={zipInputRef} type="file" accept=".zip" onChange={handleZipUpload} style={{ display: 'none' }} />
          </div>
        )}

        {mode === 'url' && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <button style={btn.back} onClick={() => { setMode(null); setError(null); }}>← Back</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textBright, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Load from GitHub
            </h2>
            <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 20, lineHeight: 1.6 }}>
              Paste any public GitHub repository URL.
            </p>
            {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${theme.danger}12`, border: `1px solid ${theme.danger}30`, fontSize: 13, color: theme.danger, marginBottom: 16 }}>{error}</div>}
            <input
              type="text" value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
              placeholder="https://github.com/owner/repo"
              disabled={loading}
              style={{ ...btn.input, marginBottom: 12 }}
              onFocus={(e) => (e.target.style.borderColor = theme.accent)}
              onBlur={(e) => (e.target.style.borderColor = theme.border)}
            />
            <button
              style={{ ...btn.primary, opacity: loading || !githubUrl.trim() ? 0.4 : 1 }}
              disabled={loading || !githubUrl.trim()}
              onClick={handleUrlLoad}
            >
              {loading ? 'Loading…' : 'Load repository'}
            </button>
          </div>
        )}

        {mode === 'github' && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <button style={btn.back} onClick={() => { setMode(null); setError(null); }}>← Back</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textBright, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Browse your repos
            </h2>
            {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${theme.danger}12`, border: `1px solid ${theme.danger}30`, fontSize: 13, color: theme.danger, marginBottom: 16 }}>{error}</div>}
            {!isAuthenticated ? (
              <>
                <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 20, lineHeight: 1.6 }}>Connect GitHub to browse your repos.</p>
                <button style={{ ...btn.primary, opacity: loading ? 0.5 : 1 }} disabled={loading} onClick={handleGitHubAuth}>
                  {loading ? 'Connecting…' : 'Connect GitHub'}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 12, lineHeight: 1.6 }}>Choose a repository:</p>
                <select
                  value={selectedRepo?.id || ''}
                  onChange={(e) => setSelectedRepo(repositories.find((r) => r.id === parseInt(e.target.value)))}
                  style={{ ...btn.input, marginBottom: 12, fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  <option value="">Select a repository…</option>
                  {repositories.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                </select>
                <button style={{ ...btn.primary, opacity: loading || !selectedRepo ? 0.4 : 1 }} disabled={loading || !selectedRepo} onClick={handleLoadGitHubRepo}>
                  {loading ? 'Loading…' : 'Load repository'}
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
