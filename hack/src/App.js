import { useState, useRef, useEffect, useCallback } from "react";

const THEMES = {
  obsidian: {
    name: "Obsidian",
    bg: "#0a0a0f",
    panel: "#101018",
    panelAlt: "#0d0d14",
    border: "#1a1a2e",
    accent: "#00d4aa",
    accentDim: "rgba(0,212,170,0.12)",
    accentGlow: "rgba(0,212,170,0.25)",
    text: "#c8c8d4",
    textDim: "#5a5a72",
    textBright: "#eeeef4",
    danger: "#ff4d6a",
    warning: "#ffaa2c",
    info: "#4da6ff",
    syntax: {
      keyword: "#c678dd",
      string: "#98c379",
      comment: "#5c6370",
      number: "#d19a66",
      fn: "#61afef",
      tag: "#e06c75",
      type: "#e5c07b",
    },
  },
  aurora: {
    name: "Aurora",
    bg: "#08080e",
    panel: "#0e0e18",
    panelAlt: "#0b0b14",
    border: "#1c1c34",
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.12)",
    accentGlow: "rgba(167,139,250,0.25)",
    text: "#c4c4d8",
    textDim: "#55557a",
    textBright: "#eaeaf6",
    danger: "#f472b6",
    warning: "#fbbf24",
    info: "#60a5fa",
    syntax: {
      keyword: "#c084fc",
      string: "#86efac",
      comment: "#475569",
      number: "#fdba74",
      fn: "#7dd3fc",
      tag: "#fda4af",
      type: "#fde68a",
    },
  },
  ember: {
    name: "Ember",
    bg: "#0f0a08",
    panel: "#160f0c",
    panelAlt: "#120c0a",
    border: "#2e1a14",
    accent: "#f97316",
    accentDim: "rgba(249,115,22,0.12)",
    accentGlow: "rgba(249,115,22,0.25)",
    text: "#d4c8c0",
    textDim: "#72605a",
    textBright: "#f4eee8",
    danger: "#ef4444",
    warning: "#eab308",
    info: "#38bdf8",
    syntax: {
      keyword: "#fb923c",
      string: "#a3e635",
      comment: "#57534e",
      number: "#fcd34d",
      fn: "#5eead4",
      tag: "#fca5a5",
      type: "#fdba74",
    },
  },
};

const FONTS = ["JetBrains Mono", "Fira Code", "Source Code Pro"];

const SAMPLE_FILES = {
  "src": {
    type: "folder",
    children: {
      "App.jsx": {
        type: "file",
        lang: "jsx",
        content: `import React from 'react';
import { ThemeProvider } from './context/Theme';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';

export default function App() {
  const [user, setUser] = React.useState(null);
  
  // Initialize authentication
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchUser(token).then(setUser);
    }
  }, []);

  return (
    <ThemeProvider>
      <div className="app-container">
        <Sidebar user={user} />
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}`,
      },
      "index.js": {
        type: "file",
        lang: "js",
        content: `import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);

// Hot module replacement
if (module.hot) {
  module.hot.accept();
}`,
      },
      "utils.ts": {
        type: "file",
        lang: "ts",
        content: `export interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => 
        setTimeout(r, 1000 * Math.pow(2, i))
      );
    }
  }
  throw new Error('Max retries exceeded');
}`,
      },
      "styles.css": {
        type: "file",
        lang: "css",
        content: `:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #101018;
  --text-primary: #eeeef4;
  --accent: #00d4aa;
  --radius: 8px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}`,
      },
    },
  },
  "package.json": {
    type: "file",
    lang: "json",
    content: `{
  "name": "my-project",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
  },
  "README.md": {
    type: "file",
    lang: "md",
    content: `# My Project

A modern web application built with React and Vite.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Fast HMR with Vite
- React 18 with Suspense
- TypeScript support
- CSS Modules
`,
  },
};

function syntaxHighlight(code, lang, syntax) {
  const lines = code.split("\n");
  return lines.map((line) => {
    let highlighted = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    highlighted = highlighted.replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
      `<span style="color:${syntax.comment};font-style:italic">$1</span>`
    );
    highlighted = highlighted.replace(
      /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|extends|default|async|await|try|catch|throw|new|typeof|interface|type|enum)\b/g,
      `<span style="color:${syntax.keyword};font-weight:600">$1</span>`
    );
    highlighted = highlighted.replace(
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
      `<span style="color:${syntax.string}">$1</span>`
    );
    highlighted = highlighted.replace(
      /\b(\d+\.?\d*)\b/g,
      `<span style="color:${syntax.number}">$1</span>`
    );
    highlighted = highlighted.replace(
      /\b([A-Z][a-zA-Z0-9]*)\b/g,
      `<span style="color:${syntax.type}">$1</span>`
    );
    return highlighted;
  });
}

function FileIcon({ lang, size = 14 }) {
  const colors = {
    jsx: "#61dafb",
    js: "#f7df1e",
    ts: "#3178c6",
    css: "#264de4",
    json: "#a8b9cc",
    md: "#ffffff",
  };
  const c = colors[lang] || "#888";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 1h7l4 4v10H3V1z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1" />
      <path d="M10 1v4h4" stroke={c} strokeWidth="1" />
    </svg>
  );
}

function FolderIcon({ open, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {open ? (
        <>
          <path d="M1 4h5l2-2h7v2H8L6 6H1V4z" fill="#e8a838" fillOpacity="0.3" />
          <path d="M1 6h14l-2 9H3L1 6z" fill="#e8a838" fillOpacity="0.5" stroke="#e8a838" strokeWidth="0.7" />
        </>
      ) : (
        <path d="M1 3h5l2 2h7v10H1V3z" fill="#e8a838" fillOpacity="0.4" stroke="#e8a838" strokeWidth="0.7" />
      )}
    </svg>
  );
}

function ChevronIcon({ open, size = 10 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      style={{
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.15s ease",
      }}
    >
      <path d="M3 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function FileExplorer({ files, onFileSelect, activeFile, theme }) {
  const [expanded, setExpanded] = useState({ src: true });

  const toggleFolder = (name) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const renderTree = (tree, depth = 0) => {
    return Object.entries(tree).map(([name, node]) => {
      if (node.type === "folder") {
        const isOpen = expanded[name];
        return (
          <div key={name}>
            <div
              onClick={() => toggleFolder(name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 8px",
                paddingLeft: 8 + depth * 16,
                cursor: "pointer",
                color: theme.text,
                fontSize: 12.5,
                fontFamily: "'IBM Plex Mono', monospace",
                borderRadius: 4,
                transition: "background 0.15s",
                userSelect: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.accentDim)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <ChevronIcon open={isOpen} />
              <FolderIcon open={isOpen} />
              <span style={{ fontWeight: 500 }}>{name}</span>
            </div>
            {isOpen && (
              <div style={{ animation: "slideDown 0.15s ease" }}>
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }
      const isActive = activeFile === name;
      return (
        <div
          key={name}
          onClick={() => onFileSelect(name, node)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 8px",
            paddingLeft: 26 + depth * 16,
            cursor: "pointer",
            color: isActive ? theme.accent : theme.text,
            background: isActive ? theme.accentDim : "transparent",
            fontSize: 12.5,
            fontFamily: "'IBM Plex Mono', monospace",
            borderRadius: 4,
            transition: "all 0.15s",
            borderLeft: isActive ? `2px solid ${theme.accent}` : "2px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.background = theme.accentDim;
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.background = "transparent";
          }}
        >
          <FileIcon lang={node.lang} />
          <span>{name}</span>
        </div>
      );
    });
  };

  return <div style={{ padding: "4px 0" }}>{renderTree(files)}</div>;
}

function CodeEditor({ file, theme, fontSize }) {
  const lines = file ? syntaxHighlight(file.content, file.lang, theme.syntax) : [];
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: "auto",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: fontSize,
        lineHeight: 1.7,
        padding: "16px 0",
        counterReset: "line",
      }}
    >
      {lines.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            flexDirection: "column",
            gap: 12,
            color: theme.textDim,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="6" y="8" width="36" height="32" rx="4" stroke={theme.textDim} strokeWidth="1.5" fill="none" />
            <path d="M18 20l-6 4 6 4M30 20l6 4-6 4M26 16l-4 16" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 13 }}>Select a file to start editing</span>
        </div>
      ) : (
        lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              minHeight: fontSize * 1.7,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${theme.accent}05`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span
              style={{
                display: "inline-block",
                width: 52,
                minWidth: 52,
                textAlign: "right",
                paddingRight: 16,
                color: theme.textDim,
                fontSize: fontSize - 1,
                userSelect: "none",
                opacity: 0.6,
              }}
            >
              {i + 1}
            </span>
            <span
              style={{ flex: 1, paddingRight: 16, whiteSpace: "pre" }}
              dangerouslySetInnerHTML={{ __html: line || " " }}
            />
          </div>
        ))
      )}
    </div>
  );
}

function AIChatroom({ theme }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! I'm your AI coding assistant. Ask me anything about your project — I can help debug, refactor, or explain code.",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const AI_RESPONSES = [
    "I can see a potential issue there. The `useEffect` hook is missing a dependency — try adding `user` to the dependency array to prevent stale closures.",
    "Great question! The `debounce` utility in `utils.ts` uses generics to preserve the original function's type signature. This ensures type safety when wrapping callbacks.",
    "For better performance, consider using `React.memo()` on the `Dashboard` component since it receives stable props. This prevents unnecessary re-renders.",
    "That CSS approach works, but you could simplify it with a CSS Grid `subgrid` — it propagates the parent's track sizing to children without manual alignment.",
    "The `fetchWithRetry` function implements exponential backoff (`1000 * 2^i`ms). You might want to add jitter to prevent thundering herd problems in production.",
    "Looking at your project structure, I'd recommend co-locating test files next to their source modules rather than a separate `__tests__` directory. It scales better.",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const reply = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    }, 600 + Math.random() * 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              animation: "fadeUp 0.3s ease",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                minWidth: 28,
                borderRadius: msg.role === "ai" ? 8 : "50%",
                background: msg.role === "ai" ? theme.accentDim : `${theme.info}20`,
                border: `1px solid ${msg.role === "ai" ? theme.accent : theme.info}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: msg.role === "ai" ? theme.accent : theme.info,
                fontWeight: 700,
                fontFamily: "'IBM Plex Mono', monospace",
                marginTop: 2,
              }}
            >
              {msg.role === "ai" ? "λ" : "U"}
            </div>
            <div
              style={{
                fontSize: 12.5,
                lineHeight: 1.6,
                color: theme.text,
                fontFamily: "'IBM Plex Sans', sans-serif",
                padding: "6px 0",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div
        style={{
          padding: 10,
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            background: theme.bg,
            borderRadius: 10,
            border: `1px solid ${theme.border}`,
            padding: 4,
            transition: "border-color 0.2s",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask anything..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: theme.text,
              fontSize: 12.5,
              fontFamily: "'IBM Plex Sans', sans-serif",
              padding: "8px 10px",
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              background: input.trim() ? theme.accent : theme.border,
              border: "none",
              borderRadius: 8,
              width: 34,
              height: 34,
              cursor: input.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              opacity: input.trim() ? 1 : 0.4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M9 3l5 5-5 5" stroke={theme.bg} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [themeName, setThemeName] = useState("obsidian");
  const [fontSize, setFontSize] = useState(13);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

  const theme = THEMES[themeName];

  const flatFiles = useCallback(() => {
    const flat = {};
    const walk = (tree) => {
      Object.entries(tree).forEach(([name, node]) => {
        if (node.type === "file") flat[name] = node;
        else if (node.children) walk(node.children);
      });
    };
    walk(SAMPLE_FILES);
    return flat;
  }, []);

  const handleFileSelect = (name, node) => {
    if (!openTabs.includes(name)) {
      setOpenTabs((prev) => [...prev, name]);
    }
    setActiveTab(name);
    setActiveFile(node);
  };

  const closeTab = (e, name) => {
    e.stopPropagation();
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== name);
      if (activeTab === name) {
        const newActive = next[next.length - 1] || null;
        setActiveTab(newActive);
        setActiveFile(newActive ? flatFiles()[newActive] : null);
      }
      return next;
    });
  };

  const panelHeader = (title, icon) => (
    <div
      style={{
        padding: "10px 14px",
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: theme.textDim,
        fontFamily: "'IBM Plex Mono', monospace",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: `linear-gradient(180deg, ${theme.accent}04 0%, transparent 100%)`,
      }}
    >
      <span style={{ color: theme.accent, fontSize: 13 }}>{icon}</span>
      {title}
    </div>
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: theme.bg,
        display: "grid",
        gridTemplateColumns: "260px 1fr 300px",
        gridTemplateRows: "1fr 1fr",
        gap: 1,
        fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
        color: theme.text,
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme.textDim}; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; max-height:0; } to { opacity:1; max-height:500px; } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
        input::placeholder { color: ${theme.textDim}; }
      `}</style>

      {/* TOP LEFT — Control Room */}
      <div
        style={{
          background: theme.panel,
          borderRight: `1px solid ${theme.border}`,
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {panelHeader("Control Room", "◈")}
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          {/* Theme Dropdown */}
          <div>
            <label
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: theme.textDim,
                fontFamily: "'IBM Plex Mono', monospace",
                display: "block",
                marginBottom: 8,
              }}
            >
              Theme
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                style={{
                  width: "100%",
                  background: theme.bg,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 13,
                  fontFamily: "'IBM Plex Mono', monospace",
                  cursor: "pointer",
                  outline: "none",
                  appearance: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = theme.accent)}
                onBlur={(e) => (e.target.style.borderColor = theme.border)}
              >
                {Object.entries(THEMES).map(([key, t]) => (
                  <option key={key} value={key}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: theme.textDim,
                }}
              >
                ▾
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {Object.entries(THEMES).map(([key, t]) => (
                <div
                  key={key}
                  onClick={() => setThemeName(key)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: t.accent,
                    border: themeName === key ? `2px solid ${theme.textBright}` : `2px solid transparent`,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: themeName === key ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Font Size Slider */}
          <div>
            <label
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: theme.textDim,
                fontFamily: "'IBM Plex Mono', monospace",
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span>Font Size</span>
              <span style={{ color: theme.accent, fontWeight: 700 }}>{fontSize}px</span>
            </label>
            <input
              type="range"
              min="10"
              max="20"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                width: "100%",
                height: 4,
                appearance: "none",
                background: `linear-gradient(to right, ${theme.accent} ${((fontSize - 10) / 10) * 100}%, ${theme.border} ${((fontSize - 10) / 10) * 100}%)`,
                borderRadius: 2,
                outline: "none",
                cursor: "pointer",
                accentColor: theme.accent,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: theme.textDim,
                marginTop: 4,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          {/* Status indicator */}
          <div
            style={{
              marginTop: "auto",
              padding: "10px 12px",
              background: theme.accentDim,
              borderRadius: 8,
              border: `1px solid ${theme.accent}20`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: theme.accent,
                boxShadow: `0 0 8px ${theme.accentGlow}`,
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: theme.accent,
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 500,
              }}
            >
              {openTabs.length} file{openTabs.length !== 1 ? "s" : ""} open
            </span>
          </div>
        </div>
      </div>

      {/* CENTER — Code Editor (spans 2 rows) */}
      <div
        style={{
          gridRow: "1 / 3",
          gridColumn: "2",
          background: theme.panelAlt,
          borderRight: `1px solid ${theme.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: `1px solid ${theme.border}`,
            background: theme.panel,
            minHeight: 38,
            overflow: "auto hidden",
          }}
        >
          {openTabs.length === 0 ? (
            <span
              style={{
                padding: "0 14px",
                fontSize: 11.5,
                color: theme.textDim,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              No files open
            </span>
          ) : (
            openTabs.map((tab) => {
              const f = flatFiles()[tab];
              const isActive = tab === activeTab;
              return (
                <div
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setActiveFile(f);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "0 14px",
                    height: 38,
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: isActive ? theme.textBright : theme.textDim,
                    background: isActive ? theme.panelAlt : "transparent",
                    borderBottom: isActive ? `2px solid ${theme.accent}` : "2px solid transparent",
                    borderRight: `1px solid ${theme.border}`,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = theme.accentDim;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <FileIcon lang={f?.lang} size={13} />
                  {tab}
                  <span
                    onClick={(e) => closeTab(e, tab)}
                    style={{
                      marginLeft: 4,
                      width: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 4,
                      fontSize: 14,
                      lineHeight: 1,
                      color: theme.textDim,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.danger + "30";
                      e.currentTarget.style.color = theme.danger;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = theme.textDim;
                    }}
                  >
                    ×
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Breadcrumb */}
        {activeFile && (
          <div
            style={{
              padding: "6px 16px",
              fontSize: 11,
              color: theme.textDim,
              fontFamily: "'IBM Plex Mono', monospace",
              borderBottom: `1px solid ${theme.border}05`,
              display: "flex",
              gap: 4,
            }}
          >
            <span>src</span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: theme.text }}>{activeTab}</span>
            <span style={{ marginLeft: "auto", color: theme.accent, opacity: 0.5 }}>
              {activeFile?.lang?.toUpperCase()}
            </span>
          </div>
        )}

        <CodeEditor file={activeFile} theme={theme} fontSize={fontSize} />

        {/* Status Bar */}
        <div
          style={{
            padding: "5px 14px",
            borderTop: `1px solid ${theme.border}`,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10.5,
            color: theme.textDim,
            fontFamily: "'IBM Plex Mono', monospace",
            background: theme.panel,
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <span>
              {activeFile ? `${activeFile.content.split("\n").length} lines` : "—"}
            </span>
            <span>UTF-8</span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span>{activeFile?.lang?.toUpperCase() || "—"}</span>
            <span>Spaces: 2</span>
          </div>
        </div>
      </div>

      {/* RIGHT — AI Chatroom (spans 2 rows) */}
      <div
        style={{
          gridRow: "1 / 3",
          gridColumn: "3",
          background: theme.panel,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {panelHeader("AI Assistant", "λ")}
        <AIChatroom theme={theme} />
      </div>

      {/* BOTTOM LEFT — File Explorer */}
      <div
        style={{
          background: theme.panel,
          borderRight: `1px solid ${theme.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {panelHeader("Explorer", "⊞")}
        <div style={{ flex: 1, overflow: "auto", padding: "4px 6px" }}>
          <FileExplorer
            files={SAMPLE_FILES}
            onFileSelect={handleFileSelect}
            activeFile={activeTab}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}