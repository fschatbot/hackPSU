// AI Service — Gemini API with streaming + 4 modes

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

function getExperienceLabel(level) {
  if (level < 20) return 'a complete beginner with no programming background — use simple analogies, avoid jargon';
  if (level < 40) return 'a beginner who knows some basics — explain terms but keep it approachable';
  if (level < 60) return 'an intermediate developer — you can use standard terminology';
  if (level < 80) return 'an experienced developer — be concise, assume solid fundamentals';
  return 'a senior engineer with deep expertise — be direct and technically precise, skip basics entirely';
}

function buildSystemPrompt(mode, experienceLevel, fileContext, projectContext) {
  const expLabel = getExperienceLabel(experienceLevel);
  const base = `You are CodeLens, an expert code understanding assistant. The user is ${expLabel}. Adapt your language, depth, and examples to match their level exactly.`;

  const contextBlock = fileContext
    ? `\n\nFull file context (for reference):\n\`\`\`\n${fileContext.substring(0, 8000)}\n\`\`\``
    : '';

  const projectBlock = projectContext
    ? `\n\nOther open files in this project: ${projectContext}`
    : '';

  switch (mode) {
    case 'explain':
      return `${base}

Mode: EXPLAIN
Explain the selected code in the context of the whole file and project. Cover:
- What it does (functionally)
- What it references or depends on
- What other code depends on it
- Why it exists here (its role in the bigger picture)
Be clear and contextual. Don't just describe syntax — explain purpose.${contextBlock}${projectBlock}`;

    case 'teaching':
      return `${base}

Mode: TEACHING
Go beyond the code itself. Your job is to teach the underlying ideas:
- What CS concepts, algorithms, or design patterns is this code using?
- What are those concepts? Explain them clearly at the user's level.
- Where do these ideas come from? Reference foundational papers, algorithms, or ideas where relevant (e.g. "this is memoization, formalized by Michie in 1968", "this pattern is from Gang of Four").
- Why is this approach used here instead of alternatives?
Teach the "why" and the "what", not just the "how".${contextBlock}${projectBlock}`;

    case 'debug':
      return `${base}

Mode: DEBUG / CODE REVIEW
You are a senior developer doing a thorough code review. Analyze the selected code and identify issues. For each finding include:
- Severity: CRITICAL / WARNING / SUGGESTION
- What the problem is
- Why it matters
- How to fix it

Categories to check: correctness bugs, edge cases, security vulnerabilities, performance problems, error handling gaps, and code quality issues.
Be specific and actionable. If the code is clean, say so and explain why.${contextBlock}${projectBlock}`;

    case 'teachback':
      return `${base}

Mode: TEACH-BACK QUIZ
Generate exactly 2-3 quiz questions to test whether the user understood the code that was just explained. Rules:
- Questions must test understanding, not just recall
- Vary question types (e.g. "what would happen if...", "why does this use X instead of Y", "what's wrong with...")
- Format as a numbered list
- After each question, on a new line write "Answer:" followed by a concise correct answer
Keep questions focused on the selected code and directly relevant to understanding it.${contextBlock}${projectBlock}`;

    default:
      return `${base}${contextBlock}${projectBlock}`;
  }
}

/**
 * Stream a response from Gemini API.
 *
 * @param {Object} params
 * @param {string} params.userMessage - The user's current message
 * @param {string|null} params.selectedCode - Selected code (if any)
 * @param {string|null} params.fileContext - Full file content for context
 * @param {string|null} params.projectContext - Other open files (comma-separated names)
 * @param {string} params.mode - 'explain' | 'teaching' | 'debug' | 'teachback'
 * @param {number} params.experienceLevel - 0-100
 * @param {Array} params.chatHistory - Previous messages [{role: 'user'|'ai', content: string}]
 * @param {Function} params.onChunk - Called with each text chunk as it arrives
 * @param {Function} params.onDone - Called when stream completes
 * @param {Function} params.onError - Called with error message on failure
 */
export async function streamGeminiResponse({
  userMessage,
  selectedCode = null,
  fileContext = null,
  projectContext = null,
  mode = 'explain',
  experienceLevel = 50,
  chatHistory = [],
  onChunk,
  onDone,
  onError,
}) {
  if (!GEMINI_API_KEY) {
    onError?.('No Gemini API key found. Add REACT_APP_GEMINI_API_KEY to your .env file.');
    return;
  }

  const systemPrompt = buildSystemPrompt(mode, experienceLevel, fileContext, projectContext);

  // Embed selected code into the user message if present
  const currentUserText = selectedCode
    ? `${userMessage}\n\nSelected code:\n\`\`\`\n${selectedCode}\n\`\`\``
    : userMessage;

  // Build contents array: history + current user message
  const contents = [
    ...chatHistory.map((msg) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: currentUserText }],
    },
  ];

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) onChunk?.(text);
          } catch {
            // skip malformed chunks
          }
        }
      }
    }

    onDone?.();
  } catch (err) {
    console.error('Gemini streaming error:', err);
    onError?.(err.message);
  }
}

/**
 * Prepare context object for AI calls (used by AIContext and CodeEditor)
 */
export function prepareContext(fileName, fileContent, selectedText = null, openFiles = []) {
  return {
    fileName,
    fileContent: fileContent?.substring(0, 10000),
    selectedText,
    openFiles: openFiles.map((f) => (typeof f === 'string' ? f : f.name)),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate an auto-prompt for code selection based on active mode.
 * The mode system prompt handles the actual behavior — this just sets the user message.
 */
export function generateSelectionPrompt(selectedText, fileName, fileContent, mode = 'explain') {
  const prompts = {
    explain: 'Please explain this selected code in context of the project.',
    teaching: 'Teach me about the concepts and ideas behind this selected code.',
    debug: 'Review this selected code for bugs, issues, and improvements.',
    teachback: 'Generate quiz questions about this selected code.',
  };
  return prompts[mode] || prompts.explain;
}
