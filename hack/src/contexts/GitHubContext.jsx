import React, { createContext, useContext, useState, useCallback } from 'react';

const GitHubContext = createContext();

export function GitHubProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [repositories, setRepositories] = useState([]);

  const authenticate = useCallback(async (token) => {
    // TODO: Implement actual GitHub OAuth flow
    // For now, this is a placeholder
    setAccessToken(token);
    setIsAuthenticated(true);

    // Mock user fetch
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }, []);

  const fetchRepositories = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100', {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      });
      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
        return repos;
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    }
    return [];
  }, [accessToken]);

  const fetchRepositoryContents = useCallback(async (owner, repo, path = '') => {
    if (!accessToken) return null;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch repository contents:', error);
    }
    return null;
  }, [accessToken]);

  const loadRepositoryAsProject = useCallback(async (owner, repo) => {
    // Fetch the entire repository structure
    const contents = await fetchRepositoryContents(owner, repo);
    if (!contents) return null;

    // Convert GitHub API response to our file structure
    const convertToFileTree = async (items) => {
      const tree = {};
      for (const item of items) {
        if (item.type === 'dir') {
          const subContents = await fetchRepositoryContents(owner, repo, item.path);
          if (subContents) {
            tree[item.name] = {
              type: 'folder',
              children: await convertToFileTree(subContents),
            };
          }
        } else if (item.type === 'file') {
          // Fetch file content
          const fileResponse = await fetch(item.download_url);
          const content = await fileResponse.text();
          const extension = item.name.split('.').pop();
          tree[item.name] = {
            type: 'file',
            lang: extension,
            content,
          };
        }
      }
      return tree;
    };

    return await convertToFileTree(contents);
  }, [fetchRepositoryContents]);

  /**
   * Load a public GitHub repo from a URL (no auth required).
   * Uses the git trees API to get all paths, then fetches files via raw.githubusercontent.com.
   * No file cap — loads everything that passes the filter.
   */
  const loadFromUrl = useCallback(async (repoUrl) => {
    // Parse owner/repo from URL like https://github.com/owner/repo or owner/repo
    const match = repoUrl.trim().match(/(?:github\.com\/)?([^/]+)\/([^/\s?#]+)/);
    if (!match) throw new Error('Invalid GitHub URL. Use https://github.com/owner/repo');

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    const headers = accessToken ? { Authorization: `token ${accessToken}` } : {};

    // Get default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      if (repoRes.status === 404) throw new Error(`Repo not found: ${owner}/${repo}`);
      throw new Error(`GitHub API error: ${repoRes.status}`);
    }
    const repoData = await repoRes.json();
    const branch = repoData.default_branch;

    // Get full file tree in one call
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    );
    if (!treeRes.ok) throw new Error('Failed to fetch file tree');
    const treeData = await treeRes.json();

    const SKIP_DIRS = new Set([
      'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
      '.venv', 'venv', 'vendor', 'coverage', '.tox', '.cache',
    ]);
    const SKIP_EXT = new Set([
      'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'bmp',
      'woff', 'woff2', 'ttf', 'eot',
      'mp3', 'mp4', 'wav', 'ogg',
      'pdf', 'zip', 'tar', 'gz',
      'lock', 'map',
      'min.js', 'min.css',
      'pyc', 'class', 'o', 'so', 'dylib', 'exe', 'dll',
    ]);
    const MAX_SIZE = 300000;

    const textFiles = treeData.tree.filter(item => {
      if (item.type !== 'blob') return false;
      if (item.size > MAX_SIZE) return false;
      const parts = item.path.split('/');
      if (parts.some(p => SKIP_DIRS.has(p) || (p.startsWith('.') && p !== '.'))) return false;
      const ext = item.path.split('.').pop()?.toLowerCase();
      if (SKIP_EXT.has(ext)) return false;
      return true;
    });

    // Fetch ALL files in batches of 50
    const BATCH_SIZE = 50;
    const fileContents = [];

    for (let i = 0; i < textFiles.length; i += BATCH_SIZE) {
      const batch = textFiles.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (item) => {
          try {
            const res = await fetch(
              `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
            );
            if (!res.ok) return null;
            const content = await res.text();
            return { path: item.path, content };
          } catch {
            return null;
          }
        })
      );
      fileContents.push(...results);
    }

    // Build file tree
    const tree = {};
    for (const file of fileContents) {
      if (!file) continue;
      const parts = file.path.split('/');
      let node = tree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        if (isLast) {
          const ext = part.split('.').pop()?.toLowerCase() || '';
          node[part] = { type: 'file', lang: ext, content: file.content };
        } else {
          if (!node[part]) node[part] = { type: 'folder', children: {} };
          node = node[part].children;
        }
      }
    }

    return tree;
  }, [accessToken]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setRepositories([]);
  }, []);

  const value = {
    isAuthenticated,
    accessToken,
    user,
    repositories,
    authenticate,
    fetchRepositories,
    fetchRepositoryContents,
    loadRepositoryAsProject,
    loadFromUrl,
    logout,
  };

  return <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>;
}

export function useGitHub() {
  const context = useContext(GitHubContext);
  if (!context) {
    throw new Error('useGitHub must be used within GitHubProvider');
  }
  return context;
}
