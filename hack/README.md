# CodeLens - AI-Powered Code Editor

A modern, web-based code editor with integrated AI assistance powered by Google Gemini, designed to help developers understand, debug, and learn from their code.

> Built for HackPSU 2024

## ✨ Features

### ✏️ Full Code Editing
- **Edit Any File**: Fully editable code editor with save functionality (Ctrl+S / Cmd+S)
- **Multi-language Support**: JavaScript, TypeScript, JSX, TSX, CSS, JSON, Markdown, Python, HTML, and more
- **Professional Syntax Highlighting**: Powered by highlight.js with theme-aware colors
- **Unsaved Changes Indicator**: Visual feedback for modified files
- **Tab Management**: Open multiple files with easy switching

### 🤖 AI Assistant (4 Specialized Modes)
- **Explain Mode** 📖: Understand what code does functionally with full context
- **Teaching Mode** 🎓: Learn underlying CS concepts, algorithms, and design patterns
- **Debug Mode** 🐛: Comprehensive code review with security and performance analysis
- **Quiz Mode** ❓: Test your understanding with AI-generated questions
- **Real-time Streaming**: Responses stream in real-time using Gemini 1.5 Flash
- **Per-File Chat Rooms**: Each file gets its own AI conversation history

### 🎯 Experience-Adaptive AI
- **Smart Adaptation**: AI responses automatically adjust to your skill level (0-100 scale)
- **Beginner-Friendly**: Simple analogies and explanations for newcomers
- **Expert Mode**: Technically precise responses for senior developers
- **Personalized Learning**: The more you use it, the better it understands your needs

### 🖼️ Media File Support
- **Images**: JPG, PNG, GIF, SVG, WebP, BMP, ICO with inline preview
- **Audio**: MP3, WAV, OGG, M4A, AAC with built-in player
- **Video**: MP4, WebM, OGV, MOV with video player
- **Documents**: PDF viewer with full document display
- **Binary Files**: Hex/Base64 viewer for unknown file types

### 🔐 User Authentication
- **Login & Register**: Email/password authentication
- **Session Persistence**: Stay logged in across sessions
- **Avatar Generation**: Auto-generated avatars via DiceBear API
- **Ready for Backend**: Mock authentication ready for real API integration

### 🎨 Sharp Neo Design
- **Professional UI**: Stock market-inspired design with sharp edges and clean lines
- **Dark Theme**: Optimized for extended coding sessions
- **Blue Accent**: Modern blue accent color (#3b82f6)
- **IBM Plex & JetBrains Mono**: Professional typography for code and UI

### 📐 Resizable Panels
- **Drag-to-Resize**: Customize layout with intuitive drag handles
- **Persistent Sizes**: Panel sizes saved across sessions
- **Vertical Split**: Adjust file explorer and control panel heights
- **Min/Max Constraints**: Smart resizing within usable bounds

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Gemini API key (get one at https://ai.google.dev/)

### Installation

\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd hack

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_GEMINI_API_KEY=your_api_key_here" > .env

# Start development server
npm start
\`\`\`

The app will open at `http://localhost:3000`

### First Time Setup

1. **Login**: Create an account (currently mock authentication)
2. **Load Project**: Choose GitHub repo, upload zip, or use sample
3. **Select File**: Click any file in the explorer to open it
4. **Choose AI Mode**: Select Explain/Teach/Debug/Quiz in Control Panel
5. **Set Experience Level**: Adjust slider to match your skill level (0-100)
6. **Select Code**: Highlight any code to trigger AI analysis
7. **Edit & Save**: Make changes and press Ctrl+S to save

## 🤖 AI Setup

### Gemini API Key (Required)

This app uses Google's Gemini 1.5 Flash model for AI assistance.

1. **Get API Key**: Visit https://ai.google.dev/ and create a free API key
2. **Add to .env**: Create a `.env` file in the project root:
   \`\`\`bash
   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
   \`\`\`
3. **Restart App**: Stop and restart the development server

**Important**: The Gemini API free tier has rate limits. For production use, consider upgrading to a paid plan.

## 📖 Usage Guide

### Editing Files

1. Click any file in the File Explorer
2. File opens in center panel as editable textarea
3. Make your changes
4. Press **Ctrl+S** (Windows/Linux) or **Cmd+S** (Mac) to save
5. Unsaved indicator disappears when saved

### Using AI Assistance

#### Auto-Trigger on Code Selection
1. Select any code in the editor (click and drag)
2. AI automatically analyzes based on active mode
3. Response streams in real-time in right panel

#### Manual Chat
1. Type your question in the chat input at bottom of AI panel
2. Press Enter or click Send
3. AI responds with full file context

#### Switching Modes
Click any mode button in Control Panel:
- **Explain**: Understanding what code does
- **Teach**: Learning concepts and patterns
- **Debug**: Finding issues and improvements
- **Quiz**: Testing your understanding

#### Adjusting Experience Level
- Drag slider from 0 (beginner) to 100 (expert)
- AI immediately adapts response complexity
- Lower levels = more analogies and explanations
- Higher levels = concise technical precision

#### Teach-Back Quiz
1. After AI explains code, click **"Quiz Me"** button
2. AI generates 2-3 understanding-based questions
3. Questions test comprehension, not memorization
4. Answers provided after each question

### Panel Resizing

- **Left Panel** (File Explorer + Control Panel):
  - Drag right edge to resize horizontally
  - Drag middle handle to adjust explorer/control split vertically

- **Right Panel** (AI Assistant):
  - Drag left edge to resize horizontally

- **Panel sizes persist** across sessions via localStorage

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)**: Original architecture documentation
- **[MAJOR_UPGRADE_COMPLETE.md](./MAJOR_UPGRADE_COMPLETE.md)**: Complete feature guide

## 🛠️ Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder with optimizations

## 🏗️ Project Structure

\`\`\`
hack/
├── public/
├── src/
│   ├── components/
│   │   ├── AIChatroom/
│   │   │   └── AIChatroom.jsx          # AI chat interface with streaming
│   │   ├── Auth/
│   │   │   └── Login.jsx               # Login/register modal
│   │   ├── CodeEditor/
│   │   │   ├── EditableCodeEditor.jsx  # Main editable editor with media support
│   │   │   ├── TabBar.jsx              # File tabs
│   │   │   └── StatusBar.jsx           # Bottom status bar
│   │   ├── ControlPanel/
│   │   │   └── ControlPanel.jsx        # AI mode selector & experience slider
│   │   ├── FileExplorer/
│   │   │   └── FileExplorer.jsx        # File tree navigation
│   │   ├── Icons/
│   │   │   └── [icon components]       # SVG icons (File, Folder, Chevron)
│   │   ├── Layout/
│   │   │   ├── ResizableContainer.jsx  # Main layout with auth check
│   │   │   └── ResizeHandle.jsx        # Draggable resize handles
│   │   └── LoadProject/
│   │       └── LoadProject.jsx         # GitHub/upload/sample project loader
│   ├── contexts/
│   │   ├── AIContext.jsx               # AI state, streaming, modes, experience
│   │   ├── AuthContext.jsx             # User authentication (mock)
│   │   ├── EditorContext.jsx           # File system, editing, CRUD operations
│   │   ├── GitHubContext.jsx           # GitHub integration
│   │   ├── SessionContext.jsx          # Session persistence
│   │   └── ThemeContext.jsx            # Neo theme management
│   ├── services/
│   │   ├── aiService.js                # Gemini API with SSE streaming
│   │   ├── fileService.js              # File upload handling
│   │   └── githubService.js            # GitHub API client
│   ├── utils/
│   │   ├── constants.js                # Neo theme, AI modes, experience levels
│   │   └── syntaxHighlight.js          # Language detection
│   ├── App.jsx                         # Root with provider hierarchy
│   └── index.js                        # Entry point
├── .env                                # API keys (REACT_APP_GEMINI_API_KEY)
├── package.json
└── README.md
\`\`\`

## 🔧 Technologies

- **React 19**: UI framework with hooks
- **Google Gemini 1.5 Flash**: AI model with streaming responses
- **Highlight.js**: Professional syntax highlighting (50+ languages)
- **Context API**: State management (no Redux)
- **localStorage**: Session and auth persistence
- **GitHub API**: Repository loading integration
- **DiceBear API**: Avatar generation
- **IBM Plex & JetBrains Mono**: Professional typography

## 🔐 Authentication

### Current Implementation (Mock)
- Email/password authentication stored in localStorage
- Session persistence across browser sessions
- Ready for backend API integration

### Backend Integration
To integrate with a real authentication backend, update `src/contexts/AuthContext.jsx`:

\`\`\`javascript
// Replace mock login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { user, token } = await response.json();
\`\`\`

Expected endpoints:
- `POST /api/auth/login` → `{ user: {...}, token: string }`
- `POST /api/auth/register` → `{ user: {...}, token: string }`
- `POST /api/auth/logout` → `{ success: boolean }`
- `GET /api/auth/me` → `{ user: {...} }`

## 🐛 Troubleshooting

### AI Not Responding
- **Check Gemini API key** in `.env` file
- **Verify API quota** - free tier has limits
- **Check browser console** for error messages
- **Restart the app** after adding/changing API key

### Files Not Loading from GitHub
- Verify repo is **public** (private repos need auth token)
- Check repo URL format: `https://github.com/username/repo`
- Large repos (1000+ files) may be slow (optimization pending)
- Check browser console for CORS or API errors

### Save Not Working (Ctrl+S)
- File must be a **text file** (not image/video)
- Look for "Unsaved changes" indicator at top
- Try pressing Ctrl+S again
- Check browser console for errors
- Verify file is open in active tab

### Panel Resize Not Working
- Click and **hold** on resize handle (thin bar between panels)
- Drag slowly and steadily
- Release mouse to set new size
- Clear localStorage if corrupted: `localStorage.clear()` in console

### Login Issues
- Currently uses **mock authentication** (any email/password works)
- Check localStorage is enabled in browser
- Try clearing site data and re-logging in

## 🔮 Known Limitations

1. **No Backend Persistence**: All data stored in browser localStorage (clears on data wipe)
2. **Large GitHub Repos**: No lazy loading or pagination for repos with 1000+ files
3. **No Collaboration**: Single-user only, no real-time collaboration features
4. **File Operations UI**: Create/delete/rename methods exist but no UI implemented
5. **Limited File Size**: Browser memory constraints for files >10MB
6. **Gemini Rate Limits**: Free tier API key has request/minute limits
7. **No Git Operations**: Can't commit, push, pull, or manage branches
8. **Mock Authentication**: No real user accounts, OAuth, or secure password storage

## 🛣️ Future Enhancements

### Short-Term (Next Release)
- [ ] File/folder creation UI (context menu + modals)
- [ ] Delete and rename file operations
- [ ] Lazy loading for large GitHub repositories
- [ ] File search/filter in explorer
- [ ] Settings panel with more customization

### Mid-Term
- [ ] Real backend API with persistent storage
- [ ] OAuth authentication (GitHub, Google)
- [ ] Git operations (commit, push, pull, diff)
- [ ] Multiple theme options
- [ ] Keyboard shortcuts panel
- [ ] File upload via drag-and-drop

### Long-Term
- [ ] Real-time collaboration (WebSockets)
- [ ] Integrated terminal
- [ ] Extension/plugin system
- [ ] Language Server Protocol (LSP) support
- [ ] Built-in debugger
- [ ] Mobile responsive design
- [ ] VS Code extension compatibility

## 🤝 Contributing

This project was built for **HackPSU 2024**. Contributions are welcome!

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Style
- Use **functional components** with hooks (no class components)
- Follow **ESLint** configuration
- Use **2-space indentation**
- Add **JSDoc comments** for complex functions
- Keep components **under 300 lines** when possible

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Highlight.js** for professional syntax highlighting
- **Google Gemini** for AI capabilities
- **DiceBear** for avatar generation
- **IBM Plex** and **JetBrains Mono** fonts
- HackPSU organizing team and participants

---

**Built with ❤️ for HackPSU 2024**
