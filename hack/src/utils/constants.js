export const THEMES = {
  neo: {
    name: "Lens Dark",
    swatch: "#00d4ff",
    bg:         "#080810",
    panel:      "#0d0d1a",
    panelAlt:   "#080810",
    panelHover: "#12122a",
    border:     "#1a1a2e",
    borderFaint:"#111120",
    accent:     "#00d4ff",
    accentBright:"#33ddff",
    accentDim:  "rgba(0,212,255,0.08)",
    accentGlow: "rgba(0,212,255,0.2)",
    text:       "#c8d0e0",
    textDim:    "#4a5068",
    textMuted:  "#30334a",
    textBright: "#e8edf5",
    danger:  "#ff6b6b",
    warning: "#fbbf24",
    info:    "#38bdf8",
    success: "#34d399",
    purple:  "#a78bfa",
    orange:  "#f97316",
    green:   "#34d399",
    syntax: {
      keyword: "#a78bfa",
      string:  "#34d399",
      comment: "#2e3147",
      number:  "#fbbf24",
      fn:      "#67e8f9",
      tag:     "#ff6b6b",
      type:    "#c4b5fd",
    },
  },
  ember: {
    name: "Ember",
    swatch: "#f97316",
    bg:         "#0f0a08",
    panel:      "#160e0a",
    panelAlt:   "#0f0a08",
    panelHover: "#1f1208",
    border:     "#2a1a10",
    borderFaint:"#180e08",
    accent:     "#f97316",
    accentBright:"#fb923c",
    accentDim:  "rgba(249,115,22,0.08)",
    accentGlow: "rgba(249,115,22,0.2)",
    text:       "#e0d0c8",
    textDim:    "#604838",
    textMuted:  "#3a2818",
    textBright: "#f5ede8",
    danger:  "#ef4444",
    warning: "#fbbf24",
    info:    "#38bdf8",
    success: "#34d399",
    purple:  "#c084fc",
    orange:  "#f97316",
    green:   "#4ade80",
    syntax: {
      keyword: "#c084fc",
      string:  "#4ade80",
      comment: "#3a2818",
      number:  "#fbbf24",
      fn:      "#fb923c",
      tag:     "#ef4444",
      type:    "#e879f9",
    },
  },
  forest: {
    name: "Forest",
    swatch: "#34d399",
    bg:         "#080f0a",
    panel:      "#0c1410",
    panelAlt:   "#080f0a",
    panelHover: "#101d14",
    border:     "#162418",
    borderFaint:"#0e1810",
    accent:     "#34d399",
    accentBright:"#6ee7b7",
    accentDim:  "rgba(52,211,153,0.08)",
    accentGlow: "rgba(52,211,153,0.2)",
    text:       "#c8dcd0",
    textDim:    "#3a5844",
    textMuted:  "#243830",
    textBright: "#e8f5ed",
    danger:  "#f87171",
    warning: "#fbbf24",
    info:    "#38bdf8",
    success: "#34d399",
    purple:  "#a78bfa",
    orange:  "#fb923c",
    green:   "#34d399",
    syntax: {
      keyword: "#a78bfa",
      string:  "#6ee7b7",
      comment: "#243830",
      number:  "#fbbf24",
      fn:      "#67e8f9",
      tag:     "#f87171",
      type:    "#c4b5fd",
    },
  },
  slate: {
    name: "Slate",
    swatch: "#818cf8",
    bg:         "#0d0d14",
    panel:      "#13131e",
    panelAlt:   "#0d0d14",
    panelHover: "#1a1a28",
    border:     "#1e1e30",
    borderFaint:"#141420",
    accent:     "#818cf8",
    accentBright:"#a5b4fc",
    accentDim:  "rgba(129,140,248,0.08)",
    accentGlow: "rgba(129,140,248,0.2)",
    text:       "#cbd5e1",
    textDim:    "#404060",
    textMuted:  "#282840",
    textBright: "#e2e8f0",
    danger:  "#f87171",
    warning: "#fbbf24",
    info:    "#38bdf8",
    success: "#34d399",
    purple:  "#818cf8",
    orange:  "#fb923c",
    green:   "#34d399",
    syntax: {
      keyword: "#c084fc",
      string:  "#34d399",
      comment: "#282840",
      number:  "#fbbf24",
      fn:      "#818cf8",
      tag:     "#f87171",
      type:    "#a5b4fc",
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
