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
