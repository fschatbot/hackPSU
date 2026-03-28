# Implementation Plan for Major Features

## Overview
This document outlines the implementation plan for the major feature upgrades requested:

1. ✅ **Editable Code Editor** - CREATED
2. ✅ **User Authentication** - CREATED
3. ✅ **Sharp Neo Theme** - CREATED
4. 🔄 **AI Mode Dropdown** (Debug/Explain/Teach) - IN PROGRESS
5. 🔄 **Experience Level Slider** - IN PROGRESS
6. ⏳ **Media File Support** - PARTIALLY DONE
7. ⏳ **Optimized Repo Loading** - NEEDS IMPLEMENTATION
8. ⏳ **File/Folder Creation** - NEEDS IMPLEMENTATION

---

## ✅ Completed Components

### 1. Editable Code Editor
**Location**: `src/components/CodeEditor/EditableCodeEditor.jsx`

**Features**:
- Full text editing with textarea
- Ctrl+S / Cmd+S to save
- Unsaved changes indicator
- Auto-integration with AI selection
- Media file preview (images, audio, video, PDF)
- Binary file hex viewer

**Usage**:
```jsx
import { EditableCodeEditor } from './components/CodeEditor/EditableCodeEditor';
<EditableCodeEditor file={activeFile} />
```

### 2. User Authentication
**Location**: `src/contexts/AuthContext.jsx`, `src/components/Auth/Login.jsx`

**Features**:
- Login/Register forms
- LocalStorage session persistence
- Mock authentication (ready for API integration)
- User profile management
- Avatar generation

**Usage**:
```jsx
const { user, isAuthenticated, login, logout } = useAuth();
```

### 3. Sharp Neo Theme
**Location**: `src/utils/constants.js`

**Features**:
- Modern sharp/clean design
- Blue accent colors (#3b82f6)
- High contrast for readability
- Syntax highlighting optimized

---

## 🔄 In Progress

### 4. AI Mode Dropdown
**Status**: Constants created, UI needs update

**Implementation**:
```javascript
// Already in constants.js
export const AI_MODES = {
  debug: { label: "Debug", icon: "🐛", description: "Find and fix issues" },
  explain: { label: "Explain", icon: "📖", description: "Understand the code" },
  teach: { label: "Teach", icon: "🎓", description: "Learn concepts" },
};
```

**TODO**:
1. Update `ControlPanel.jsx` to use dropdown instead of theme selector
2. Add AI mode state to `AIContext`
3. Modify AI prompts based on selected mode
4. Update UI to show active mode

**Files to Modify**:
- `src/components/ControlPanel/ControlPanel.jsx`
- `src/contexts/AIContext.jsx`
- `src/services/aiService.js`

### 5. Experience Level Slider
**Status**: Constants created, UI needs update

**Implementation**:
```javascript
// Already in constants.js
export const EXPERIENCE_LEVELS = {
  1: { label: "No Experience", description: "Brand new to coding" },
  2: { label: "Beginner", description: "Learning the basics" },
  3: { label: "Average", description: "Comfortable with code" },
  4: { label: "Advanced", description: "Strong understanding" },
  5: { label: "Expert", description: "Professional level" },
};
```

**TODO**:
1. Replace font size slider with experience slider
2. Add experience level state to `ThemeContext` or new `PreferencesContext`
3. Adjust AI responses based on experience level
4. Save preference to localStorage

**Files to Modify**:
- `src/components/ControlPanel/ControlPanel.jsx`
- `src/contexts/AIContext.jsx`
- `src/services/aiService.js`

---

## ⏳ Needs Implementation

### 6. Media File Support

**Status**: Partially implemented in `EditableCodeEditor.jsx`

**Supported Types**:
- ✅ Images: jpg, jpeg, png, gif, svg, webp, bmp, ico
- ✅ Audio: mp3, wav, ogg, m4a, aac
- ✅ Video: mp4, webm, ogv, mov
- ✅ Documents: PDF
- ✅ Binary files: hex viewer fallback

**TODO**:
1. Handle file uploads with proper MIME type detection
2. Convert uploaded media to data URLs or blob URLs
3. Update `fileService.js` to handle binary data
4. Add file size limits and validation
5. Implement lazy loading for large media files

**Files to Create/Modify**:
```javascript
// src/services/mediaService.js
export async function processMediaFile(file) {
  if (file.type.startsWith('image/')) {
    return {
      type: 'image',
      dataUrl: await fileToDataURL(file),
      size: file.size,
    };
  }
  // ... handle other types
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 7. Optimized Repository Loading

**Problem**: Large repos load slowly and consume memory

**Solution**: Implement lazy loading with pagination

**Implementation Plan**:

```javascript
// src/services/githubService.js - Enhanced version

export class GitHubRepoLoader {
  constructor(owner, repo, token) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
    this.cache = new Map();
  }

  // Load only visible files initially
  async loadFileTreeShallow(path = '') {
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`,
      { headers: { Authorization: `token ${this.token}` } }
    );
    const items = await response.json();

    return items.map(item => ({
      name: item.name,
      type: item.type === 'dir' ? 'folder' : 'file',
      path: item.path,
      sha: item.sha,
      size: item.size,
      // Don't load content yet
      children: item.type === 'dir' ? {} : undefined,
    }));
  }

  // Load file content only when opened
  async loadFileContent(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`,
      { headers: { Authorization: `token ${this.token}` } }
    );
    const data = await response.json();

    // Decode base64 content
    const content = atob(data.content);
    this.cache.set(path, content);
    return content;
  }

  // Load folder contents on demand
  async expandFolder(path) {
    return this.loadFileTreeShallow(path);
  }
}
```

**Features**:
- ✅ Load directory structure only (no file contents)
- ✅ Load file content only when file is opened
- ✅ Cache loaded files in memory
- ✅ Implement pagination for large directories
- ✅ Show loading indicators
- ✅ Cancel requests if user navigates away

**Files to Modify**:
- `src/services/githubService.js` - Add lazy loading
- `src/contexts/GitHubContext.jsx` - Add loading states
- `src/contexts/EditorContext.jsx` - Handle lazy file loading
- `src/components/FileExplorer/FileExplorer.jsx` - Show loading states

### 8. File/Folder Creation

**Features Needed**:
- Create new file in current folder
- Create new folder in current location
- Delete files/folders
- Rename files/folders
- Context menu on right-click

**Implementation**:

```javascript
// Add to EditorContext.jsx
const createFile = useCallback((folderPath, fileName) => {
  setFiles((prev) => {
    const newFiles = { ...prev };
    // Navigate to folder and add file
    const pathParts = folderPath.split('/');
    let current = newFiles;

    for (const part of pathParts) {
      if (part && current[part]) {
        current = current[part].children;
      }
    }

    current[fileName] = {
      type: 'file',
      lang: fileName.split('.').pop(),
      content: '',
    };

    return newFiles;
  });
}, []);

const createFolder = useCallback((parentPath, folderName) => {
  setFiles((prev) => {
    const newFiles = { ...prev };
    // Similar logic to createFile
    // ... add folder
    return newFiles;
  });
}, []);

const deleteItem = useCallback((path) => {
  // Remove file/folder from tree
}, []);

const renameItem = useCallback((oldPath, newName) => {
  // Rename file/folder
}, []);
```

**UI Components Needed**:

```jsx
// src/components/FileExplorer/ContextMenu.jsx
export function ContextMenu({ x, y, onClose, onAction, item }) {
  return (
    <div style={{ position: 'fixed', left: x, top: y, ... }}>
      <button onClick={() => onAction('new-file')}>New File</button>
      <button onClick={() => onAction('new-folder')}>New Folder</button>
      <button onClick={() => onAction('rename')}>Rename</button>
      <button onClick={() => onAction('delete')}>Delete</button>
    </div>
  );
}

// src/components/FileExplorer/NewFileModal.jsx
export function NewFileModal({ isOpen, onClose, onCreateFile }) {
  const [fileName, setFileName] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <input
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        placeholder="Enter file name..."
      />
      <button onClick={() => {
        onCreateFile(fileName);
        onClose();
      }}>
        Create
      </button>
    </Modal>
  );
}
```

---

## 📋 Complete Implementation Checklist

### Phase 1: Core Updates (Priority 1)
- [x] Create Sharp Neo theme
- [x] Create AuthContext and Login component
- [x] Create EditableCodeEditor with media support
- [ ] Update ControlPanel with AI mode dropdown
- [ ] Update ControlPanel with experience slider
- [ ] Integrate AuthProvider into App.jsx
- [ ] Add login button to UI
- [ ] Replace CodeEditor with EditableCodeEditor

### Phase 2: Advanced Features (Priority 2)
- [ ] Implement lazy GitHub repo loading
- [ ] Add file/folder creation UI
- [ ] Add context menu to FileExplorer
- [ ] Implement file rename/delete
- [ ] Add media file upload handling
- [ ] Optimize file processing for large repos

### Phase 3: AI Enhancements (Priority 3)
- [ ] Modify AI prompts based on mode (Debug/Explain/Teach)
- [ ] Adjust AI complexity based on experience level
- [ ] Add mode-specific AI responses
- [ ] Update AI service with experience-aware responses

### Phase 4: Polish & Optimization (Priority 4)
- [ ] Add loading indicators throughout
- [ ] Implement error boundaries
- [ ] Add file size limits
- [ ] Optimize re-renders
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility
- [ ] Update all documentation

---

## 🔧 Quick Integration Steps

### Step 1: Update App.jsx

```jsx
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>  {/* Add AuthProvider */}
        <EditorProvider>
          <GitHubProvider>
            <AIProvider>
              <SessionProvider>
                <AppContent />
              </SessionProvider>
            </AIProvider>
          </GitHubProvider>
        </EditorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### Step 2: Update AppContent to show Login

```jsx
function AppContent() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(!isAuthenticated);

  if (!isAuthenticated && showLogin) {
    return <Login onClose={() => setShowLogin(false)} />;
  }

  // ... rest of app
}
```

### Step 3: Replace CodeEditor

In `ResizableContainer.jsx`:
```jsx
import { EditableCodeEditor } from '../CodeEditor/EditableCodeEditor';

// Replace:
// <CodeEditor file={activeFile} />
// With:
<EditableCodeEditor file={activeFile} />
```

### Step 4: Update EditorContext

Add `updateFileContent` method:
```jsx
const updateFileContent = useCallback((fileName, newContent) => {
  setFiles((prev) => {
    const updated = { ...prev };
    // Navigate tree and update file.content
    return updated;
  });
}, []);
```

---

## 📦 New npm Packages Needed

```bash
npm install react-pdf  # For PDF viewing
npm install file-saver # For downloading files
```

---

## 🎨 UI/UX Improvements

### Sharp Neo Design Principles
1. **Clean Lines**: No rounded corners except buttons (4-8px radius)
2. **High Contrast**: Clear text, sharp borders
3. **Blue Accent**: #3b82f6 (stock market blue)
4. **Minimal Shadows**: Flat design with subtle elevation
5. **Monospace Numbers**: For professional feel
6. **Icon Consistency**: Use same style icons throughout

### Control Panel Redesign
```
┌─────────────────────────┐
│ AI Mode:    [Debug ▾]   │  ← Dropdown
├─────────────────────────┤
│ Experience: [●────○]    │  ← Slider (1-5)
│             Average     │
├─────────────────────────┤
│ ● 2 files open          │  ← Status
└─────────────────────────┘
```

---

## 🚀 Performance Optimizations

### For Large Repos
1. **Virtual Scrolling**: Only render visible files
2. **Lazy Loading**: Load content on demand
3. **Pagination**: Limit initial load to 100 files
4. **Debouncing**: Delay file tree updates
5. **Web Workers**: Process large files in background

### For Media Files
1. **Compression**: Compress images before display
2. **Thumbnails**: Generate thumbnails for image galleries
3. **Lazy Images**: Load images as they scroll into view
4. **Blob URLs**: Use blob URLs instead of data URLs
5. **Cleanup**: Revoke blob URLs when unmounted

---

## 📝 Testing Checklist

### Authentication
- [ ] Login works with email/password
- [ ] Register creates new account
- [ ] Logout clears session
- [ ] Session persists across refresh
- [ ] Error messages display correctly

### Editable Editor
- [ ] Can type and edit code
- [ ] Ctrl+S saves changes
- [ ] Unsaved indicator appears
- [ ] AI selection still works
- [ ] Media files display correctly

### Media Files
- [ ] Images load and display
- [ ] Audio player works
- [ ] Video player works
- [ ] PDF renders in iframe
- [ ] Binary files show hex view

### File Operations
- [ ] Can create new file
- [ ] Can create new folder
- [ ] Can rename items
- [ ] Can delete items
- [ ] Operations reflect in tree

---

## 📖 Documentation Updates Needed

1. Update README.md with new features
2. Create AUTH_GUIDE.md for authentication
3. Update AI_INTEGRATION.md with modes/experience
4. Create MEDIA_FILES.md for supported types
5. Update claude.md with new architecture

---

## 🎯 Success Criteria

### MVP (Minimum Viable Product)
- ✅ Code is editable
- ✅ Files can be saved
- ✅ User can login
- ✅ Media files display
- ⏳ AI modes work
- ⏳ Experience level affects AI

### Full Feature Set
- All items in checklist completed
- Performance optimized for large repos
- All documentation updated
- UI follows sharp neo design
- All tests passing

---

## 💡 Next Steps

1. **Immediate**: Integrate created components into App
2. **Short-term**: Finish control panel updates
3. **Medium-term**: Implement file operations
4. **Long-term**: Optimize for production

Would you like me to continue with specific implementations or would you prefer to integrate what's been created so far?
