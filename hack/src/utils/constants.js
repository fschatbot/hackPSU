// Sharp Neo Theme - Stock UI inspired
export const THEMES = {
  neo: {
    name: "Neo",
    bg: "#0a0e14",
    panel: "#13171f",
    panelAlt: "#0d1117",
    border: "#1f2937",
    accent: "#3b82f6",
    accentDim: "rgba(59,130,246,0.1)",
    accentGlow: "rgba(59,130,246,0.3)",
    text: "#e5e7eb",
    textDim: "#6b7280",
    textBright: "#f9fafb",
    danger: "#ef4444",
    warning: "#f59e0b",
    info: "#06b6d4",
    success: "#10b981",
    syntax: {
      keyword: "#3b82f6",
      string: "#10b981",
      comment: "#6b7280",
      number: "#f59e0b",
      fn: "#06b6d4",
      tag: "#ef4444",
      type: "#a78bfa",
    },
  },
};

export const FONTS = ["JetBrains Mono", "Fira Code", "Source Code Pro", "Cascadia Code"];

export const DEFAULT_THEME = "neo";
export const DEFAULT_FONT_SIZE = 13;
export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 20;

export const DEFAULT_EXPERIENCE_LEVEL = 3; // Average
export const MIN_EXPERIENCE_LEVEL = 1;
export const MAX_EXPERIENCE_LEVEL = 5;

export const EXPERIENCE_LEVELS = {
  1: { label: "No Experience", description: "Brand new to coding" },
  2: { label: "Beginner", description: "Learning the basics" },
  3: { label: "Average", description: "Comfortable with code" },
  4: { label: "Advanced", description: "Strong understanding" },
  5: { label: "Expert", description: "Professional level" },
};

export const AI_MODES = {
  debug: { label: "Debug", icon: "🐛", description: "Find and fix issues" },
  explain: { label: "Explain", icon: "📖", description: "Understand the code" },
  teach: { label: "Teach", icon: "🎓", description: "Learn concepts" },
};

export const MIN_PANEL_WIDTH = 200;
export const MAX_PANEL_PERCENT = 40;
export const DEFAULT_LEFT_PANEL_WIDTH = 260;
export const DEFAULT_RIGHT_PANEL_WIDTH = 350;

export const FILE_ICONS_COLORS = {
  jsx: "#61dafb",
  js: "#f7df1e",
  ts: "#3178c6",
  tsx: "#3178c6",
  css: "#264de4",
  scss: "#c6538c",
  json: "#a8b9cc",
  md: "#ffffff",
  py: "#3776ab",
  html: "#e34c26",
  jpg: "#059669",
  jpeg: "#059669",
  png: "#059669",
  gif: "#059669",
  svg: "#059669",
  webp: "#059669",
  mp3: "#8b5cf6",
  mp4: "#8b5cf6",
  wav: "#8b5cf6",
  pdf: "#dc2626",
  zip: "#f59e0b",
  txt: "#9ca3af",
};

export const SUPPORTED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'];
export const SUPPORTED_AUDIO_TYPES = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
export const SUPPORTED_VIDEO_TYPES = ['mp4', 'webm', 'ogv', 'mov'];
export const SUPPORTED_DOCUMENT_TYPES = ['pdf'];

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
    },
  },
  "README.md": {
    type: "file",
    lang: "md",
    content: `# My Project

A modern web application built with React.

## Features

- Fast HMR with Vite
- React 18 with Suspense
- TypeScript support
`,
  },
};
