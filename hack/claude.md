# Web-Based SPA Editor with AI - Context Document

## Project Overview
This is a web-based Single Page Application (SPA) code editor with integrated AI assistance. The editor provides a modern IDE-like experience in the browser with real-time code viewing, syntax highlighting, and AI-powered coding assistance.

## Key Features

### 1. Code Editor
- Multi-file tab management
- Syntax highlighting for multiple languages (JS, JSX, TS, CSS, JSON, MD)
- Line numbers and hover effects
- File explorer with folder tree navigation
- Breadcrumb navigation

### 2. AI Assistant
- Real-time chat interface
- Context-aware code suggestions
- Code explanation and debugging help
- Located in right panel for easy access

### 3. Resizable Panels
- All sections are user-resizable
- Drag handles between panels
- Layouts persist across sessions
- Minimum/maximum size constraints

### 4. Project Loading
- **GitHub Integration**: Connect GitHub account and load repositories
- **Zip Upload**: Upload project as zip file and extract
- **Session Persistence**: Last session automatically restored on load
- Storage options: Browser localStorage or server-side

### 5. Customization
- Theme selection (Obsidian, Aurora, Ember)
- Font size adjustment
- Customizable color schemes
- Font family selection

## Application Architecture

### Layout Structure
```
┌─────────────┬──────────────────┬─────────────┐
│  Control    │   Code Editor    │   AI        │
│  Room       │   (Tabs + Code)  │   Assistant │
│  (Settings) │                  │   (Chat)    │
├─────────────┤                  │             │
│   File      │                  │             │
│   Explorer  │                  │             │
│   (Tree)    │                  │             │
└─────────────┴──────────────────┴─────────────┘
```

### Component Hierarchy
```
App
├── SessionProvider (restore last session)
├── ThemeProvider (theme state)
├── EditorProvider (file/tab state)
├── GitHubProvider (GitHub integration)
└── Layout
    ├── LoadProject (initial screen if no session)
    ├── ResizableContainer
    │   ├── ControlPanel (themes, settings)
    │   ├── FileExplorer (file tree)
    │   ├── CodeEditor (main editor)
    │   └── AIChatroom (AI assistant)
    └── StatusBar
```

## Context Providers

### 1. ThemeContext (`contexts/ThemeContext.js`)
- Current theme state (obsidian/aurora/ember)
- Font size state
- Theme switching functions
- Theme persistence

### 2. EditorContext (`contexts/EditorContext.js`)
- Open tabs state
- Active file state
- File content state
- Tab management (open, close, switch)
- File operations

### 3. SessionContext (`contexts/SessionContext.js`)
- Session loading/saving
- Last opened files
- Layout preferences
- Panel sizes
- Auto-save functionality

### 4. GitHubContext (`contexts/GitHubContext.js`)
- GitHub authentication state
- Repository loading
- File fetching from GitHub
- OAuth integration

## Services

### 1. SessionService (`services/sessionService.js`)
- Load session from localStorage/server
- Save session state
- Clear session
- Export/import session

### 2. GitHubService (`services/githubService.js`)
- Authenticate with GitHub
- List repositories
- Fetch repository contents
- Parse file tree from GitHub

### 3. FileService (`services/fileService.js`)
- Read uploaded files
- Extract zip archives
- Parse file structures
- Convert to internal format

### 4. SyntaxService (`services/syntaxService.js`)
- Syntax highlighting logic
- Language detection
- Token parsing

## Component Details

### Core Components

#### `components/Layout/ResizableContainer.jsx`
- Main layout container with resizable panels
- Drag handles between sections
- Min/max width constraints
- Persist sizes to session

#### `components/ControlPanel/ControlPanel.jsx`
- Theme selector dropdown
- Font size slider
- Settings panel
- Status indicators

#### `components/FileExplorer/FileExplorer.jsx`
- Recursive file tree rendering
- Folder expand/collapse
- File icons by type
- File selection handling

#### `components/CodeEditor/CodeEditor.jsx`
- Main code display area
- Line numbers
- Syntax highlighting
- Tab bar
- Breadcrumb navigation
- Status bar

#### `components/AIChatroom/AIChatroom.jsx`
- Chat message list
- Input field
- AI response rendering
- Message history

#### `components/LoadProject/LoadProject.jsx`
- Initial project load screen
- GitHub repo selector
- File upload area
- Session restore option

### Utility Components

#### `components/Tabs/TabBar.jsx`
- Tab list rendering
- Active tab highlighting
- Close buttons
- Tab switching

#### `components/Icons/FileIcon.jsx`
- File type icons
- Color coding by language

#### `components/Icons/FolderIcon.jsx`
- Folder open/closed states
- Animated transitions

## State Management

### Global State (Contexts)
- Theme settings
- Open files and tabs
- Active file
- Session data
- GitHub authentication
- Panel sizes

### Local State (Components)
- Folder expanded states
- Chat messages
- Input values
- UI interactions

## Data Flow

### Project Loading Flow
1. User opens app
2. Check for saved session in localStorage
3. If session exists → restore state
4. If no session → show LoadProject screen
5. User selects: GitHub repo OR zip upload
6. Parse files into internal structure
7. Initialize editor with files
8. Save session

### File Selection Flow
1. User clicks file in explorer
2. Check if file already in tabs
3. If not → add to open tabs
4. Set as active tab
5. Load file content into editor
6. Update breadcrumb
7. Update status bar

### AI Interaction Flow
1. User types message in chat input
2. Add user message to chat history
3. Send message to AI service (mock/API)
4. Receive AI response
5. Add AI message to chat history
6. Scroll to bottom
7. Save chat to session

## File Structure
```
src/
├── components/
│   ├── AIChatroom/
│   │   ├── AIChatroom.jsx
│   │   └── ChatMessage.jsx
│   ├── CodeEditor/
│   │   ├── CodeEditor.jsx
│   │   ├── TabBar.jsx
│   │   └── StatusBar.jsx
│   ├── ControlPanel/
│   │   ├── ControlPanel.jsx
│   │   ├── ThemeSelector.jsx
│   │   └── FontSizeSlider.jsx
│   ├── FileExplorer/
│   │   ├── FileExplorer.jsx
│   │   ├── FileTree.jsx
│   │   └── FileTreeItem.jsx
│   ├── Icons/
│   │   ├── FileIcon.jsx
│   │   ├── FolderIcon.jsx
│   │   └── ChevronIcon.jsx
│   ├── Layout/
│   │   ├── ResizableContainer.jsx
│   │   ├── ResizeHandle.jsx
│   │   └── MainLayout.jsx
│   └── LoadProject/
│       ├── LoadProject.jsx
│       ├── GitHubLoader.jsx
│       └── FileUploader.jsx
├── contexts/
│   ├── ThemeContext.jsx
│   ├── EditorContext.jsx
│   ├── SessionContext.jsx
│   └── GitHubContext.jsx
├── services/
│   ├── sessionService.js
│   ├── githubService.js
│   ├── fileService.js
│   └── syntaxService.js
├── hooks/
│   ├── useResizable.js
│   ├── useSession.js
│   └── useLocalStorage.js
├── utils/
│   ├── constants.js (themes, fonts)
│   ├── fileHelpers.js
│   └── syntaxHighlight.js
├── types/
│   └── index.js (shared types/constants)
├── App.jsx
├── index.js
└── index.css
```

## Session Storage Schema
```javascript
{
  lastOpened: "2024-01-15T10:30:00Z",
  project: {
    source: "github" | "upload" | "sample",
    url: "https://github.com/user/repo", // if GitHub
    name: "project-name"
  },
  files: {
    // File tree structure
  },
  editor: {
    openTabs: ["App.jsx", "index.js"],
    activeTab: "App.jsx",
    tabOrder: ["App.jsx", "index.js"]
  },
  theme: {
    name: "obsidian",
    fontSize: 13
  },
  layout: {
    leftPanelWidth: 260,
    rightPanelWidth: 300,
    explorerHeight: "50%"
  },
  aiChat: {
    messages: [...]
  }
}
```

## Resizable Panel Implementation

### Features
- Horizontal resizing: Left sidebar, main editor, right sidebar
- Vertical resizing: Control panel and file explorer (left column)
- Minimum widths: 200px for sidebars, 400px for editor
- Maximum widths: 40% of viewport for sidebars
- Persist sizes to session storage
- Smooth drag interaction with visual feedback

### Implementation Notes
- Use CSS Grid with dynamic column/row templates
- Track mouse position during drag
- Update grid template on drag
- Prevent text selection during resize
- Add visual indicators (resize cursors, hover states)

## AI Integration Notes

### Current Implementation
- Mock AI responses (random from preset array)
- Simulated latency (600-1400ms)
- Chat history in local state

### Future Integration Points
- Replace mock with actual AI API calls
- Add code context to AI prompts
- Implement code insertion from AI suggestions
- Add streaming responses
- Error handling and retry logic

## GitHub Integration Notes

### Authentication
- Use GitHub OAuth App
- Redirect flow for auth
- Store access token securely
- Token refresh handling

### Repository Loading
- GitHub API v3/v4
- List user repositories
- Fetch file tree recursively
- Handle large repositories (pagination)
- Cache repository data

## Styling Approach
- CSS-in-JS (inline styles with theme variables)
- No external UI libraries (pure React)
- Responsive design principles
- Dark theme optimized
- Smooth animations and transitions

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used
- No IE11 support needed
- localStorage API required
- Zip extraction (JSZip library for future)

## Performance Considerations
- Virtual scrolling for large file lists
- Debounced resize handlers
- Memoized syntax highlighting
- Lazy loading of file contents
- Optimized re-renders with React.memo

## Future Enhancements
- Multi-cursor editing
- Search and replace
- Code formatting
- Linting integration
- Git operations
- Real-time collaboration
- Terminal integration
- Plugin system
