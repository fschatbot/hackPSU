import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEditor } from '../../contexts/EditorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGitHub } from '../../contexts/GitHubContext';
import { processUploadedFiles, extractZipFile } from '../../services/fileService';
import { CodeLensLogo } from '../Icons/CodeLensLogo';
import { Login } from '../Auth/Login';
import { SAMPLE_FILES } from '../../utils/constants';

const FEATURES = [
  {
    icon: '📖',
    title: 'Explain',
    desc: 'Get plain-English explanations of any code, in context',
    color: '#00d4ff',
  },
  {
    icon: '🎓',
    title: 'Teach',
    desc: 'Learn the CS concepts and theory behind the code',
    color: '#a78bfa',
  },
  {
    icon: '🔍',
    title: 'Review',
    desc: 'Catch bugs, security issues, and performance problems',
    color: '#f97316',
  },
  {
    icon: '🧠',
    title: 'Quiz',
    desc: 'Test your understanding with interactive questions',
    color: '#34d399',
  },
];

const METHODS = [
  { id: 'sample', icon: '⚡', label: 'Try a quick example', action: true },
  { id: 'upload', icon: '📂', label: 'Upload files or folder' },
  { id: 'zip', icon: '📦', label: 'Upload a ZIP' },
  { id: 'url', icon: '🔗', label: 'GitHub URL' },
];

export function LoadProject({ onProjectLoaded }) {
  const { theme, setThemeName, setFontSize } = useTheme();
  const { loadFiles, openFile } = useEditor();
  const { user, isAuthenticated: isLoggedIn, listProjects, loadProject, deleteProject } = useAuth();
  const { isAuthenticated, authenticate, repositories, fetchRepositories, loadRepositoryAsProject, loadFromUrl } = useGitHub();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Fetch saved projects when logged in — auto-open the most recent one
  useEffect(() => {
    if (isLoggedIn) {
      setLoadingProjects(true);
      listProjects().then(async (projects) => {
        setSavedProjects(projects);
        setLoadingProjects(false);
        // Auto-load the most recent project right after login
        if (projects.length > 0) {
          const latest = projects[0]; // already sorted by updated_at DESC
          try {
            const project = await loadProject(latest.id);
            if (project?.files) {
              loadFiles(project.files);
              restoreSession(project);
              onProjectLoaded?.();
            }
          } catch (err) {
            console.error('Auto-load failed:', err);
          }
        }
      });
    } else {
      setSavedProjects([]);
    }
  }, [isLoggedIn, listProjects]);

  const restoreSession = (project) => {
    if (!project?.metadata) return;
    const { themeName, fontSize, openTabs, activeTab } = project.metadata;
    if (themeName) setThemeName(themeName);
    if (fontSize) setFontSize(fontSize);
    // Re-open tabs after a tick so files are loaded first
    if (openTabs?.length) {
      setTimeout(() => {
        openTabs.forEach((tab) => openFile(tab));
        if (activeTab) openFile(activeTab);
      }, 100);
    }
  };

  const handleLoadSavedProject = async (projectId) => {
    setLoading(true); setError(null);
    try {
      const project = await loadProject(projectId);
      if (project?.files) {
        loadFiles(project.files);
        restoreSession(project);
        onProjectLoaded?.();
      } else {
        setError('Could not load project.');
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteProject = async (projectId) => {
    await deleteProject(projectId);
    setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
  };
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

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files?.length) return;

    const first = files[0];
    if (first.name.endsWith('.zip')) {
      setLoading(true); setError(null);
      try {
        const tree = await extractZipFile(first);
        if (!tree || !Object.keys(tree).length) { setError('That ZIP looks empty.'); return; }
        loadFiles(tree); onProjectLoaded?.();
      } catch (err) { setError('Could not unpack ZIP: ' + err.message); }
      finally { setLoading(false); }
    } else {
      setLoading(true); setError(null);
      try { loadFiles(await processUploadedFiles(files)); onProjectLoaded?.(); }
      catch (err) { setError('Could not read those files: ' + err.message); }
      finally { setLoading(false); }
    }
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

  const s = {
    primary: {
      padding: '12px 24px',
      background: theme.accent,
      border: 'none', borderRadius: 10,
      color: '#000', fontSize: 14, fontWeight: 700,
      cursor: 'pointer', letterSpacing: '-0.01em',
      transition: 'opacity 0.15s',
    },
    ghost: {
      padding: '12px 24px',
      background: 'transparent',
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      color: theme.text, fontSize: 14, fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.15s',
    },
    input: {
      width: '100%', padding: '12px 14px',
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

  // ── Subpanels ──
  if (mode) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: theme.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: theme.text, padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <button style={s.back} onClick={() => { setMode(null); setError(null); }}>← Back</button>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: `${theme.danger}12`, border: `1px solid ${theme.danger}30`,
              fontSize: 13, color: theme.danger, marginBottom: 16,
            }}>{error}</div>
          )}

          {mode === 'upload' && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: theme.textBright, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Upload files
              </h2>
              <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 24, lineHeight: 1.6 }}>
                Choose individual files or open an entire folder.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ ...s.primary, flex: 1 }} disabled={loading} onClick={() => folderInputRef.current?.click()}>
                  {loading ? 'Loading...' : 'Open folder'}
                </button>
                <button style={{ ...s.ghost, flex: 1 }} disabled={loading} onClick={() => fileInputRef.current?.click()}>
                  Pick files
                </button>
              </div>
              <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
              <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
            </>
          )}

          {mode === 'zip' && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: theme.textBright, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Upload a ZIP
              </h2>
              <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 24, lineHeight: 1.6 }}>
                We'll extract it automatically. Works great with GitHub downloads.
              </p>
              <button style={{ ...s.primary, width: '100%', opacity: loading ? 0.5 : 1 }} disabled={loading} onClick={() => zipInputRef.current?.click()}>
                {loading ? 'Extracting...' : 'Choose ZIP file'}
              </button>
              <input ref={zipInputRef} type="file" accept=".zip" onChange={handleZipUpload} style={{ display: 'none' }} />
            </>
          )}

          {mode === 'url' && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: theme.textBright, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Load from GitHub
              </h2>
              <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 24, lineHeight: 1.6 }}>
                Paste any public GitHub repository URL.
              </p>
              <input
                type="text" value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
                placeholder="https://github.com/owner/repo"
                disabled={loading}
                style={{ ...s.input, marginBottom: 12 }}
                onFocus={(e) => (e.target.style.borderColor = theme.accent)}
                onBlur={(e) => (e.target.style.borderColor = theme.border)}
              />
              <button
                style={{ ...s.primary, width: '100%', opacity: loading || !githubUrl.trim() ? 0.4 : 1 }}
                disabled={loading || !githubUrl.trim()}
                onClick={handleUrlLoad}
              >
                {loading ? 'Loading...' : 'Load repository'}
              </button>
            </>
          )}

          {mode === 'github' && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: theme.textBright, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Browse your repos
              </h2>
              {!isAuthenticated ? (
                <>
                  <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 24, lineHeight: 1.6 }}>Connect GitHub to browse your repos.</p>
                  <button style={{ ...s.primary, width: '100%', opacity: loading ? 0.5 : 1 }} disabled={loading} onClick={handleGitHubAuth}>
                    {loading ? 'Connecting...' : 'Connect GitHub'}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 12, lineHeight: 1.6 }}>Choose a repository:</p>
                  <select
                    value={selectedRepo?.id || ''}
                    onChange={(e) => setSelectedRepo(repositories.find((r) => r.id === parseInt(e.target.value)))}
                    style={{ ...s.input, marginBottom: 12, fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    <option value="">Select a repository...</option>
                    {repositories.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                  </select>
                  <button style={{ ...s.primary, width: '100%', opacity: loading || !selectedRepo ? 0.4 : 1 }} disabled={loading || !selectedRepo} onClick={handleLoadGitHubRepo}>
                    {loading ? 'Loading...' : 'Load repository'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main landing page ──
  return (
    <div
      style={{
        width: '100vw', height: '100vh',
        background: theme.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: theme.text,
        overflow: 'auto',
        position: 'relative',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Glow effects */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 600,
        background: `radial-gradient(ellipse at center top, ${theme.accentGlow} 0%, transparent 60%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '20%',
        width: 600, height: 400,
        background: `radial-gradient(ellipse, ${theme.accent}08 0%, transparent 60%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Drag overlay */}
      {dragOver && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: `${theme.bg}ee`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `3px dashed ${theme.accent}`,
          borderRadius: 0,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.textBright }}>Drop files here</div>
            <div style={{ fontSize: 14, color: theme.textDim, marginTop: 8 }}>Files, folders, or ZIP archives</div>
          </div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>

        {/* Nav */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 0', borderBottom: `1px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CodeLensLogo size={32} color={theme.accent} />
            <span style={{ fontSize: 15, fontWeight: 700, color: theme.textBright }}>CodeLens</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a
              href="https://github.com/fschatbot/hackPSU"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '7px 14px', borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.textDim, fontSize: 13, fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textDim; }}
            >
              GitHub
            </a>
            {isLoggedIn ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 8,
                background: theme.accentDim,
                border: `1px solid ${theme.accent}20`,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: theme.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#000',
                }}>
                  {(user?.name || user?.email || '?')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.textBright }}>
                  {user?.name || user?.email?.split('@')[0]}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: 'none',
                  background: theme.accent,
                  color: '#000', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Sign in
              </button>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section style={{
          textAlign: 'center',
          padding: '80px 0 60px',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: theme.accentDim,
            border: `1px solid ${theme.accent}20`,
            fontSize: 12.5, fontWeight: 600, color: theme.accent,
            marginBottom: 28,
          }}>
            Built at HackPSU 2026
          </div>

          <h1 style={{
            fontSize: 52, fontWeight: 800,
            color: theme.textBright,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            margin: '0 0 20px',
          }}>
            Understand any codebase.
            <br />
            <span style={{ color: theme.accent }}>At your level.</span>
          </h1>

          <p style={{
            fontSize: 17, color: theme.textDim,
            lineHeight: 1.7, margin: '0 auto 40px',
            maxWidth: 540,
          }}>
            Drop in a project and explore it through AI-powered explanations,
            deep-dive teaching, instant code reviews, and interactive quizzes
            — all adapted to your experience level.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleLoadSample}
              disabled={loading}
              style={{
                padding: '14px 32px',
                background: theme.accent,
                border: 'none', borderRadius: 12,
                color: '#000', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: `0 0 30px ${theme.accent}30`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 40px ${theme.accent}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 30px ${theme.accent}30`; }}
            >
              {loading ? 'Loading...' : 'Try with sample code'}
            </button>
            <button
              onClick={() => setMode('url')}
              style={{
                padding: '14px 32px',
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                color: theme.textBright, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textBright; }}
            >
              Load from GitHub
            </button>
          </div>
        </section>

        {/* Saved projects for logged-in users */}
        {isLoggedIn && savedProjects.length > 0 && (
          <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 20px' }}>
            <h3 style={{
              fontSize: 16, fontWeight: 700, color: theme.textBright,
              marginBottom: 12, letterSpacing: '-0.01em',
            }}>
              Your Projects
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {savedProjects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    background: theme.panel,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${theme.accent}50`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: theme.accentDim,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>📁</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.textBright, marginBottom: 2 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: theme.textDim }}>
                      Last edited {new Date(p.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLoadSavedProject(p.id)}
                    disabled={loading}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: theme.accentDim,
                      border: `1px solid ${theme.accent}30`,
                      color: theme.accent, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = '#000'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = theme.accentDim; e.currentTarget.style.color = theme.accent; }}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    style={{
                      width: 28, height: 28,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent',
                      border: `1px solid ${theme.border}`,
                      borderRadius: 6,
                      color: theme.textDim, fontSize: 13,
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.danger; e.currentTarget.style.color = theme.danger; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textDim; }}
                    title="Delete project"
                  >×</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {isLoggedIn && loadingProjects && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span style={{
              display: 'inline-block', width: 20, height: 20,
              border: `2px solid ${theme.border}`,
              borderTopColor: theme.accent,
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }} />
          </div>
        )}

        {/* Feature cards */}
        <section style={{ padding: '20px 0 60px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  padding: '24px 20px',
                  background: theme.panel,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 14,
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = f.color + '50'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: f.color, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: theme.textDim, lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Upload section */}
        <section style={{
          padding: '40px 0 60px',
          borderTop: `1px solid ${theme.border}`,
        }}>
          <h2 style={{
            fontSize: 24, fontWeight: 700, color: theme.textBright,
            textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em',
          }}>
            Get started
          </h2>
          <p style={{
            fontSize: 14, color: theme.textDim, textAlign: 'center',
            marginBottom: 32,
          }}>
            Choose how you want to load your project
          </p>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, maxWidth: 480, margin: '0 auto 20px',
              background: `${theme.danger}12`, border: `1px solid ${theme.danger}30`,
              fontSize: 13, color: theme.danger,
            }}>{error}</div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            maxWidth: 640,
            margin: '0 auto',
          }}>
            {METHODS.map((m) => (
              <button
                key={m.id}
                disabled={loading}
                onClick={() => m.action ? handleLoadSample() : setMode(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px',
                  background: theme.panel,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  cursor: 'pointer', textAlign: 'left',
                  color: theme.textBright,
                  fontSize: 13.5, fontWeight: 600,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${theme.accent}50`;
                  e.currentTarget.style.background = theme.panelHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.background = theme.panel;
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          <p style={{
            textAlign: 'center', fontSize: 12.5,
            color: theme.textMuted || theme.textDim,
            marginTop: 24,
          }}>
            Or just drag and drop files anywhere on this page
          </p>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '24px 0',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8,
        }}>
          <CodeLensLogo size={16} color={theme.textMuted || theme.textDim} />
          <span style={{ fontSize: 12, color: theme.textMuted || theme.textDim }}>
            CodeLens — Built at HackPSU 2026
          </span>
        </footer>
      </div>

      {/* Login modal */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}

      {/* Hidden file inputs */}
      <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
      <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
      <input ref={zipInputRef} type="file" accept=".zip" onChange={handleZipUpload} style={{ display: 'none' }} />
    </div>
  );
}
