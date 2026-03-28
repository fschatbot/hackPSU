import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEditor } from '../../contexts/EditorContext';
import { useGitHub } from '../../contexts/GitHubContext';
import { processUploadedFiles, extractZipFile } from '../../services/fileService';
import { SAMPLE_FILES } from '../../utils/constants';

export function LoadProject({ onProjectLoaded }) {
  const { theme } = useTheme();
  const { loadFiles } = useEditor();
  const { isAuthenticated, authenticate, repositories, fetchRepositories, loadRepositoryAsProject, loadFromUrl } = useGitHub();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('sample'); // 'sample', 'upload', 'zip', 'github', 'url'
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
    // For demo purposes, we'll use a mock token
    // In production, this would be a proper OAuth flow
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

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
        color: theme.text,
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: '90%',
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 32,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: theme.accent,
              marginBottom: 8,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Code Editor
          </div>
          <div style={{ fontSize: 14, color: theme.textDim }}>
            Load a project to get started
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              background: `${theme.danger}20`,
              border: `1px solid ${theme.danger}`,
              borderRadius: 8,
              marginBottom: 24,
              fontSize: 13,
              color: theme.danger,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['sample', 'upload', 'zip', 'url', 'github'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: mode === m ? theme.accentDim : theme.bg,
                border: `1px solid ${mode === m ? theme.accent : theme.border}`,
                borderRadius: 8,
                color: mode === m ? theme.accent : theme.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === 'sample' && (
          <div>
            <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 16 }}>
              Load a sample project to explore the editor features.
            </p>
            <button
              onClick={handleLoadSample}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: theme.accent,
                border: 'none',
                borderRadius: 8,
                color: theme.bg,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Loading...' : 'Load Sample Project'}
            </button>
          </div>
        )}

        {mode === 'upload' && (
          <div>
            <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 16 }}>
              Upload files or a folder from your computer.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => folderInputRef.current?.click()}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: theme.accent,
                  border: 'none',
                  borderRadius: 8,
                  color: theme.bg,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Loading...' : 'Upload Folder'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: theme.panelAlt,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  color: theme.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                Upload Files
              </button>
            </div>
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {mode === 'zip' && (
          <div>
            <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 16 }}>
              Upload a .zip file of your project (e.g. downloaded from GitHub).
            </p>
            <button
              onClick={() => zipInputRef.current?.click()}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: theme.accent,
                border: 'none',
                borderRadius: 8,
                color: theme.bg,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Extracting...' : 'Upload ZIP'}
            </button>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              onChange={handleZipUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {mode === 'url' && (
          <div>
            <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 16 }}>
              Load any public GitHub repo by URL.
            </p>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
              placeholder="https://github.com/owner/repo"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                color: theme.text,
                fontSize: 13,
                fontFamily: "'IBM Plex Mono', monospace",
                outline: 'none',
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = theme.accent)}
              onBlur={(e) => (e.target.style.borderColor = theme.border)}
            />
            <button
              onClick={handleUrlLoad}
              disabled={loading || !githubUrl.trim()}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: theme.accent,
                border: 'none',
                borderRadius: 8,
                color: theme.bg,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !githubUrl.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !githubUrl.trim() ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Loading repo...' : 'Load Repo'}
            </button>
          </div>
        )}

        {mode === 'github' && (
          <div>
            {!isAuthenticated ? (
              <>
                <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 16 }}>
                  Connect your GitHub account to load repositories.
                </p>
                <button
                  onClick={handleGitHubAuth}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: theme.accent,
                    border: 'none',
                    borderRadius: 8,
                    color: theme.bg,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Connecting...' : 'Connect GitHub'}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 16 }}>
                  Select a repository to load:
                </p>
                <select
                  value={selectedRepo?.id || ''}
                  onChange={(e) => {
                    const repo = repositories.find((r) => r.id === parseInt(e.target.value));
                    setSelectedRepo(repo);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    color: theme.text,
                    fontSize: 13,
                    marginBottom: 16,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  <option value="">Select a repository...</option>
                  {repositories.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.full_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLoadGitHubRepo}
                  disabled={loading || !selectedRepo}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: theme.accent,
                    border: 'none',
                    borderRadius: 8,
                    color: theme.bg,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading || !selectedRepo ? 'not-allowed' : 'pointer',
                    opacity: loading || !selectedRepo ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Loading...' : 'Load Repository'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
