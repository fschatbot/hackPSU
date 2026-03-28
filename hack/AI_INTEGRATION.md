# AI Integration Guide

## Overview
The editor now features a sophisticated AI engine with per-file chat rooms and automatic code analysis via text selection.

## Key Features

### 1. Per-File Chat Rooms
- Each file gets its own dedicated AI chat room
- Chat history is maintained separately for each file
- When you switch files, the chat automatically switches to that file's room
- Chat messages include timestamps

### 2. Automatic Context Injection
- **Text Selection**: When you highlight code (minimum 10 characters), it automatically sends to AI
- **Cooldown**: 2-second cooldown prevents spam from rapid selections
- **Debouncing**: 500ms delay after selection stops before processing
- **Smart Prompts**: AI generates contextual prompts based on what you selected:
  - Functions → Code review and improvement suggestions
  - Classes → Architecture and best practices
  - Imports → Alternatives and optimization
  - Errors → Debugging help
  - Loops → Performance analysis
  - Conditionals → Simplification suggestions

### 3. Highlight.js Integration
- Professional syntax highlighting for all major languages
- Theme-aware: Highlight colors adapt to your selected theme
- Languages supported: JavaScript, TypeScript, JSX, TSX, CSS, JSON, Markdown, Python, HTML
- Fallback to plain text if language not recognized

## Architecture

### AIContext
**Location**: `src/contexts/AIContext.jsx`

Manages:
- `chatRooms`: Object mapping `fileName → [messages]`
- `activeRoom`: Currently active chat room (file name)
- `isLoading`: AI response loading state
- Selection cooldown tracking

**Key Methods**:
```javascript
const {
  getChatRoom,        // Get messages for a file
  openChatRoom,       // Switch to file's chat room
  sendMessage,        // Send user message to AI
  handleCodeSelection, // Process selected code
  clearChatRoom,      // Clear specific file's chat
  clearAllChatRooms   // Clear all chat history
} = useAI();
```

### AIService
**Location**: `src/services/aiService.js`

**Functions**:

#### `sendToAI(messages, context)`
Sends messages to AI API endpoint with context
```javascript
const response = await sendToAI(
  [
    { role: 'user', content: 'Explain this function' },
  ],
  {
    fileName: 'App.jsx',
    fileContent: '...',
    selectedText: 'function example() {...}',
    openFiles: ['App.jsx', 'index.jsx']
  }
);
```

#### `streamAIResponse(messages, context, onChunk)`
For streaming AI responses (real-time)
```javascript
await streamAIResponse(messages, context, (chunk) => {
  console.log('Received chunk:', chunk);
});
```

#### `generateSelectionPrompt(selectedText, fileName, fileContent)`
Generates smart prompts based on selected code
```javascript
const prompt = generateSelectionPrompt(
  'function hello() { return "world"; }',
  'utils.js',
  fullFileContent
);
// Returns: "Explain this function and suggest improvements: ..."
```

#### `prepareContext(fileName, fileContent, selectedText, openFiles)`
Prepares context object for AI
```javascript
const context = prepareContext(
  'App.jsx',
  fileContent,
  selectedCode,
  openFiles
);
```

## How It Works

### File Opening Flow
1. User opens a file
2. `EditorContext` sets `activeTab`
3. `AIChatroom` detects tab change
4. `AIContext.openChatRoom(fileName)` is called
5. If chat room doesn't exist, creates it with welcome message
6. Chat UI displays messages for that file

### Text Selection Flow
1. User selects code in editor (mouseup/keyup events)
2. Debounce timer starts (500ms)
3. After 500ms, selection is processed
4. Check cooldown (must be >2s since last selection)
5. Generate automatic prompt based on code analysis
6. Prepare context (file name, content, selection)
7. Send to AI via `handleCodeSelection`
8. AI response appears in chat

### Message Sending Flow
1. User types message in chat input
2. Press Enter (Shift+Enter for new line)
3. Add user message to chat room
4. Prepare context with current file info
5. Send to AI API
6. Display loading indicator
7. Add AI response to chat room
8. Auto-scroll to bottom

## API Integration

### Setting Up Backend
1. Create a backend server at the endpoint specified in `.env`
2. Implement POST endpoint `/api/chat`
3. Expected request format:
```javascript
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "ai", "content": "..." }
  ],
  "context": {
    "fileName": "App.jsx",
    "fileContent": "...",
    "selectedText": "...",
    "openFiles": ["App.jsx", "index.jsx"],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

4. Expected response format:
```javascript
{
  "message": "AI response here..."
}
// OR
{
  "response": "AI response here..."
}
```

### Example Backend (Node.js/Express)
```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body;

  // Call your AI provider (OpenAI, Anthropic, etc.)
  const aiResponse = await callYourAIProvider(messages, context);

  res.json({ message: aiResponse });
});

app.listen(3001, () => console.log('AI API running on :3001'));
```

### Mock Mode
If no backend is configured, the app automatically falls back to mock responses. This is perfect for:
- Development without AI API
- Demo purposes
- Testing UI functionality

Mock responses are context-aware and provide realistic suggestions based on code patterns.

## Configuration

### Environment Variables
Create `.env` file:
```bash
REACT_APP_AI_API_ENDPOINT=http://localhost:3001/api/chat
```

Or set to production API:
```bash
REACT_APP_AI_API_ENDPOINT=https://your-api.com/ai/chat
```

### Customizing Cooldowns
Edit `src/contexts/AIContext.jsx`:
```javascript
const SELECTION_COOLDOWN = 2000; // Change to your preferred cooldown (ms)
```

Edit `src/components/CodeEditor/CodeEditor.jsx`:
```javascript
selectionTimeoutRef.current = setTimeout(() => {
  // ... selection processing
}, 500); // Change debounce delay (ms)
```

### Customizing Prompts
Edit `src/services/aiService.js` → `generateSelectionPrompt()`:
```javascript
if (isFunction) {
  prompt = `Your custom prompt for functions:\n\n${selectedText}`;
}
```

### Adding More Languages
Edit `src/components/CodeEditor/CodeEditor.jsx`:
```javascript
import rust from 'highlight.js/lib/languages/rust';
hljs.registerLanguage('rust', rust);

const LANGUAGE_MAP = {
  // ... existing
  rs: 'rust',
  rust: 'rust',
};
```

## Usage Examples

### Example 1: Get Function Explanation
1. Open `utils.js`
2. Select a function
3. Wait 500ms
4. AI automatically analyzes and responds in chat
5. Continue conversation or select more code

### Example 2: Debug Error Handling
1. Open file with error handling code
2. Select try-catch block
3. AI provides debugging suggestions
4. Ask follow-up questions in chat

### Example 3: Multi-File Context
1. Open multiple related files
2. Switch between files
3. Each file maintains its own chat history
4. AI has context of all open files

## Best Practices

### For Users
1. **Select meaningful code**: Minimum 10 characters, complete statements
2. **Wait for cooldown**: Don't rapidly select/deselect
3. **Ask specific questions**: More context = better responses
4. **Use file-specific chats**: Keep conversations organized per file

### For Developers
1. **Rate limit API calls**: Prevent abuse with backend rate limiting
2. **Cache responses**: Store common queries to reduce API costs
3. **Limit context size**: Currently limits to 10,000 characters
4. **Handle errors gracefully**: Always provide fallback responses
5. **Monitor API usage**: Track costs and optimize prompts

## Streaming Responses (Advanced)

To enable streaming:
1. Implement `/api/chat/stream` endpoint with Server-Sent Events
2. Update `AIChatroom` to use `streamAIResponse`
3. Display chunks as they arrive

Example:
```javascript
let fullResponse = '';
await streamAIResponse(messages, context, (chunk) => {
  fullResponse += chunk;
  updateMessageInUI(messageId, fullResponse);
});
```

## Security Considerations

### API Keys
- **Never** commit API keys to git
- Use environment variables
- Implement backend proxy for API calls
- Rotate keys regularly

### User Input
- Validate and sanitize all inputs
- Limit message length
- Rate limit requests per user
- Prevent prompt injection attacks

### Context Data
- Be careful with sensitive code
- Implement user consent for code sharing
- Allow users to disable auto-selection
- Provide opt-out for AI features

## Troubleshooting

### AI Not Responding
1. Check console for errors
2. Verify `REACT_APP_AI_API_ENDPOINT` is set
3. Test backend endpoint with curl
4. Check CORS settings on backend
5. Verify mock responses work (no endpoint)

### Selection Not Triggering
1. Check cooldown hasn't been triggered recently
2. Select at least 10 characters
3. Wait 500ms after selection
4. Check browser console for errors

### Chat Room Not Switching
1. Ensure file is actually opened (check activeTab)
2. Clear chat rooms and try again
3. Check console for context errors

### Syntax Highlighting Issues
1. Verify language is registered in CodeEditor
2. Check file extension mapping
3. Try fallback mode (plain text)
4. Verify highlight.js CSS is loaded

## Performance Tips

1. **Debounce aggressively**: Increase timeout for slower networks
2. **Limit context**: Don't send entire 10MB file
3. **Cache highlights**: Memoize highlighted code
4. **Lazy load languages**: Only load languages you need
5. **Virtual scrolling**: For large files (future enhancement)

## Future Enhancements

- [ ] Code suggestions inline (like GitHub Copilot)
- [ ] Voice input for chat
- [ ] Code diff preview before applying AI suggestions
- [ ] Multi-file refactoring
- [ ] AI-powered code search
- [ ] Collaborative AI sessions
- [ ] Custom AI model selection
- [ ] Offline AI mode (local model)

## API Providers

### OpenAI
```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: messages,
});
return response.choices[0].message.content;
```

### Anthropic Claude
```javascript
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  messages: messages,
});
return response.content[0].text;
```

### Local LLM (Ollama)
```javascript
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'codellama',
    prompt: messages[messages.length - 1].content,
  }),
});
```

## Support

For issues or questions:
1. Check console logs
2. Review this documentation
3. Check `claude.md` for architecture details
4. File issue on GitHub (if applicable)

## License

MIT (or your license)
