export const THEMES = {
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

export const FONTS = ["JetBrains Mono", "Fira Code", "Source Code Pro"];

export const DEFAULT_THEME = "obsidian";
export const DEFAULT_FONT_SIZE = 13;
export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 20;

export const MIN_PANEL_WIDTH = 200;
export const MAX_PANEL_PERCENT = 40;
export const DEFAULT_LEFT_PANEL_WIDTH = 260;
export const DEFAULT_RIGHT_PANEL_WIDTH = 300;

export const FILE_ICONS_COLORS = {
  jsx: "#61dafb",
  js: "#f7df1e",
  ts: "#3178c6",
  css: "#264de4",
  json: "#a8b9cc",
  md: "#ffffff",
};

export const SAMPLE_FILES = {
  src: {
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
