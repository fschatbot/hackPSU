import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

// In production (Vercel) API is same-origin at /api.
// For local dev against the Express server set REACT_APP_API_URL=http://localhost:3001/api
const API_URL = process.env.REACT_APP_API_URL || '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token and restore session on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('code_editor_token');

      if (token) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            // Token is invalid or expired
            localStorage.removeItem('code_editor_token');
            localStorage.removeItem('code_editor_user');
          }
        } catch (error) {
          console.error('Failed to verify token:', error);
          localStorage.removeItem('code_editor_token');
          localStorage.removeItem('code_editor_user');
        }
      }

      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store JWT token and user data
      localStorage.setItem('code_editor_token', data.token);
      localStorage.setItem('code_editor_user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true, user: data.user };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name: name || email.split('@')[0] }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store JWT token and user data
      localStorage.setItem('code_editor_token', data.token);
      localStorage.setItem('code_editor_user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true, user: data.user };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('code_editor_user');
    localStorage.removeItem('code_editor_token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback((updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('code_editor_user', JSON.stringify(updatedUser));
  }, [user]);

  // ── Compression helpers ──

  const compressFiles = async (files) => {
    const json = JSON.stringify(files);
    const blob = new Blob([json]);
    const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
    const buf = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    return btoa(binary);
  };

  const decompressFiles = async (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes]);
    const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    return JSON.parse(text);
  };

  // ── Cloud project sync ──

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('code_editor_token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : null;
  }, []);

  const listProjects = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return [];
    try {
      const res = await fetch(`${API_URL}/projects`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return data.projects || [];
    } catch { return []; }
  }, [getAuthHeaders]);

  const saveProject = useCallback(async (name, files, projectId = null, metadata = null) => {
    const headers = getAuthHeaders();
    if (!headers) return null;
    try {
      const compressed = await compressFiles(files);
      const body = { name, files: compressed };
      if (metadata) body.metadata = metadata;

      if (projectId) {
        await fetch(`${API_URL}/projects/${projectId}`, {
          method: 'PUT', headers,
          body: JSON.stringify(body),
        });
        return projectId;
      } else {
        const res = await fetch(`${API_URL}/projects`, {
          method: 'POST', headers,
          body: JSON.stringify(body),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.project?.id || null;
      }
    } catch { return null; }
  }, [getAuthHeaders]);

  const loadProject = useCallback(async (projectId) => {
    const headers = getAuthHeaders();
    if (!headers) return null;
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      const project = data.project;
      if (!project) return null;

      // Decompress files blob (or parse raw JSON for legacy projects)
      if (typeof project.files === 'string') {
        try {
          project.files = await decompressFiles(project.files);
        } catch {
          // Fallback: might be raw JSON from before compression
          try { project.files = JSON.parse(project.files); } catch { project.files = {}; }
        }
      }

      return project;
    } catch { return null; }
  }, [getAuthHeaders]);

  const deleteProject = useCallback(async (projectId) => {
    const headers = getAuthHeaders();
    if (!headers) return false;
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`, { method: 'DELETE', headers });
      return res.ok;
    } catch { return false; }
  }, [getAuthHeaders]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    listProjects,
    saveProject,
    loadProject,
    deleteProject,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
