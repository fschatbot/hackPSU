import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('code_editor_user');
    const storedToken = localStorage.getItem('code_editor_token');

    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('code_editor_user');
        localStorage.removeItem('code_editor_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock authentication - replace with real auth
      if (email && password) {
        const mockUser = {
          id: Date.now().toString(),
          email,
          name: email.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          createdAt: new Date().toISOString(),
        };

        const mockToken = btoa(`${email}:${Date.now()}`);

        localStorage.setItem('code_editor_user', JSON.stringify(mockUser));
        localStorage.setItem('code_editor_token', mockToken);

        setUser(mockUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true, user: mockUser };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock registration
      const mockUser = {
        id: Date.now().toString(),
        email,
        name: name || email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        createdAt: new Date().toISOString(),
      };

      const mockToken = btoa(`${email}:${Date.now()}`);

      localStorage.setItem('code_editor_user', JSON.stringify(mockUser));
      localStorage.setItem('code_editor_token', mockToken);

      setUser(mockUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true, user: mockUser };
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

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
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
