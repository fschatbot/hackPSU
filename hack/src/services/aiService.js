// AI Service for handling LLM API calls

const AI_API_ENDPOINT = process.env.REACT_APP_AI_API_ENDPOINT || 'http://localhost:3001/api/chat';

/**
 * Send a message to the AI engine
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} context - Additional context (file content, selection, etc.)
 * @returns {Promise<string>} AI response
 */
export async function sendToAI(messages, context = {}) {
  try {
    const response = await fetch(AI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message || data.response || 'No response from AI';
  } catch (error) {
    console.error('AI Service Error:', error);
    // Fallback to mock response if API is unavailable
    return getMockResponse(messages, context);
  }
}

/**
 * Stream response from AI (for real-time chat)
 * @param {Array} messages - Array of message objects
 * @param {Object} context - Additional context
 * @param {Function} onChunk - Callback for each chunk
 * @returns {Promise<void>}
 */
export async function streamAIResponse(messages, context, onChunk) {
  try {
    const response = await fetch(AI_API_ENDPOINT + '/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  } catch (error) {
    console.error('AI Streaming Error:', error);
    // Fallback to mock response
    const mockResponse = getMockResponse(messages, context);
    for (const char of mockResponse) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      onChunk(char);
    }
  }
}

/**
 * Generate automatic prompt based on code selection
 * @param {string} selectedText - The highlighted code
 * @param {string} fileName - Name of the file
 * @param {string} fileContent - Full file content for context
 * @returns {string} Generated prompt
 */
export function generateSelectionPrompt(selectedText, fileName, fileContent) {
  // Analyze the selected text to determine intent
  const isFunction = /function\s+\w+|const\s+\w+\s*=\s*\(.*\)\s*=>/.test(selectedText);
  const isClass = /class\s+\w+/.test(selectedText);
  const isImport = /import\s+.*from/.test(selectedText);
  const isComment = /\/\/|\/\*|\*\//.test(selectedText);
  const hasError = /error|throw|catch|exception/i.test(selectedText);
  const isLoop = /for\s*\(|while\s*\(|\.map\(|\.forEach\(/.test(selectedText);
  const isConditional = /if\s*\(|else|switch|case/.test(selectedText);

  let prompt = '';

  if (isFunction) {
    prompt = `Explain this function and suggest improvements:\n\n${selectedText}`;
  } else if (isClass) {
    prompt = `Analyze this class structure and suggest best practices:\n\n${selectedText}`;
  } else if (isImport) {
    prompt = `What does this import do and are there better alternatives?\n\n${selectedText}`;
  } else if (isComment) {
    prompt = `Is this comment clear? Suggest improvements:\n\n${selectedText}`;
  } else if (hasError) {
    prompt = `Help me debug this error handling code:\n\n${selectedText}`;
  } else if (isLoop) {
    prompt = `Review this loop for performance and correctness:\n\n${selectedText}`;
  } else if (isConditional) {
    prompt = `Can this conditional logic be simplified?\n\n${selectedText}`;
  } else {
    prompt = `Explain what this code does:\n\n${selectedText}`;
  }

  return prompt;
}

/**
 * Mock AI responses for development/fallback
 */
const MOCK_RESPONSES = {
  function: [
    "This function looks good! Consider adding JSDoc comments for better documentation. You might also want to add error handling for edge cases.",
    "The logic here is sound. One suggestion: you could extract the complex condition into a separate helper function to improve readability.",
    "Great use of async/await! Make sure to handle promise rejections with try-catch blocks to prevent unhandled errors.",
  ],
  class: [
    "Nice class structure! Consider using private fields (#fieldName) for better encapsulation if you're using ES2022+.",
    "The class looks well-organized. You might want to add getters/setters for controlled access to properties.",
  ],
  import: [
    "This import is fine. If you're concerned about bundle size, consider using named imports instead of default imports when possible.",
    "That library is good, but you might also consider [alternative] which has better TypeScript support.",
  ],
  error: [
    "For error handling, consider creating custom error classes that extend Error for more specific error types.",
    "Make sure to log errors appropriately and provide meaningful error messages to users.",
  ],
  loop: [
    "This loop works, but for better performance with large arrays, consider using array methods like .filter() or .reduce().",
    "The iteration looks correct. Just be careful about modifying the array while iterating over it.",
  ],
  conditional: [
    "You could simplify this with a ternary operator: `condition ? valueA : valueB`",
    "Consider using early returns to reduce nesting and improve readability.",
  ],
  general: [
    "This code looks clean and follows good practices. Nice work!",
    "I notice this pattern. Have you considered using [design pattern] here?",
    "The logic is correct. For better maintainability, consider adding comments explaining the 'why' behind complex decisions.",
  ],
};

function getMockResponse(messages, context) {
  const lastMessage = messages[messages.length - 1]?.content || '';

  // Determine response type based on context
  let responsePool = MOCK_RESPONSES.general;

  if (context.selectedText) {
    const text = context.selectedText;
    if (/function\s+\w+|const\s+\w+\s*=\s*\(.*\)\s*=>/.test(text)) {
      responsePool = MOCK_RESPONSES.function;
    } else if (/class\s+\w+/.test(text)) {
      responsePool = MOCK_RESPONSES.class;
    } else if (/import\s+.*from/.test(text)) {
      responsePool = MOCK_RESPONSES.import;
    } else if (/error|throw|catch|exception/i.test(text)) {
      responsePool = MOCK_RESPONSES.error;
    } else if (/for\s*\(|while\s*\(|\.map\(|\.forEach\(/.test(text)) {
      responsePool = MOCK_RESPONSES.loop;
    } else if (/if\s*\(|else|switch|case/.test(text)) {
      responsePool = MOCK_RESPONSES.conditional;
    }
  }

  // Return random response from pool
  return responsePool[Math.floor(Math.random() * responsePool.length)];
}

/**
 * Prepare context object for AI
 * @param {string} fileName - Current file name
 * @param {string} fileContent - Full file content
 * @param {string} selectedText - Highlighted text (if any)
 * @param {Array} openFiles - List of open files
 * @returns {Object} Context object
 */
export function prepareContext(fileName, fileContent, selectedText = null, openFiles = []) {
  return {
    fileName,
    fileContent: fileContent?.substring(0, 10000), // Limit context size
    selectedText,
    openFiles: openFiles.map((f) => f.name),
    timestamp: new Date().toISOString(),
  };
}
