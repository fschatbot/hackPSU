import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export function Login({ onClose }) {
  const { login, register } = useAuth();
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isLogin
      ? await login(email, password)
      : await register(email, password, name);

    setLoading(false);

    if (result.success) {
      onClose?.();
    } else {
      setError(result.error || 'Authentication failed');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 40,
          maxWidth: 400,
          width: '90%',
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${theme.accent}20`,
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 24,
            fontWeight: 700,
            color: theme.textBright,
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ margin: 0, marginBottom: 32, color: theme.textDim, fontSize: 14 }}>
          {isLogin ? 'Sign in to continue coding' : 'Start your coding journey'}
        </p>

        {error && (
          <div
            style={{
              padding: 12,
              background: `${theme.danger}20`,
              border: `1px solid ${theme.danger}`,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 13,
              color: theme.danger,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.text,
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  color: theme.text,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = theme.accent)}
                onBlur={(e) => (e.target.style.borderColor = theme.border)}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 600,
                color: theme.text,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                color: theme.text,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = theme.accent)}
              onBlur={(e) => (e.target.style.borderColor = theme.border)}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 600,
                color: theme.text,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                color: theme.text,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = theme.accent)}
              onBlur={(e) => (e.target.style.borderColor = theme.border)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? theme.border : theme.accent,
              border: 'none',
              borderRadius: 8,
              color: theme.bg,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{
                background: 'none',
                border: 'none',
                color: theme.accent,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
