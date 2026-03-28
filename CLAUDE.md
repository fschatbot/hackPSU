# CodeLens — CLAUDE.md

## What This Project Is
An interactive code understanding tool. Drop any code or project, select any chunk, and explore it through 4 different AI-powered modes. Everything adapts to an experience slider (beginner → expert).

**Pitch:** "CodeLens turns any codebase into a conversation — understand it at your level, catch what's broken, then prove you actually got it."

---

## Team Split
- **Teammate** — UI/frontend (React components, layout, styling)
- **You (Parag)** — AI integration, prompt engine, logic, wiring everything together

---

## Tech Stack
| Layer | Tool | Notes |
|---|---|---|
| Frontend | React (JavaScript, no TypeScript) | Teammate's domain |
| AI | Gemini API | Free, no card needed — aistudio.google.com |
| Syntax display | Custom-built | No Monaco, no third-party editors |
| Deploy | TBD | Vercel recommended |

**Env var:** `VITE_GEMINI_API_KEY` in `.env`

---

## Input Methods (all supported)
1. Paste raw code
2. Upload a file
3. Upload a ZIP (whole project)
4. GitHub URL

---

## The 4 Modes

### 1. Explain Mode
- User selects any code (line → function → whole file)
- AI explains it **in project context**: what it does, what it references, what depends on it, why it exists here
- Not just "what does this line do" — full situational awareness

### 2. Teaching Mode
- Goes beyond the code itself
- Explains the CS concepts the code is using
- References relevant research papers or foundational ideas where applicable
- Actually teaches you the underlying theory, not just the surface

### 3. Debug / Review Mode
- Same selection, different lens
- AI flags: bugs, edge cases, security holes, performance issues
- Presented inline like a senior dev doing a PR review

### 4. Teach-back Mode
- Unlocks after any of the above modes
- AI generates 2–3 quiz questions based on what was just explained
- User answers, AI grades and gives feedback
- Closes the learning loop

---

## The Experience Slider
- A 0–100 value the user sets once
- Every single mode adapts its language, depth, and assumptions to this value
- 0 = explain like I'm 5, 100 = talk to me like a senior engineer
- This is the feature that ties everything together — same 4 modes feel totally different at each end

---

## Architecture Overview

```
User selects code
       |
       v
Selection + file context + full project context
       |
       v
AI Engine (src/lib/ai.js)
  - Takes: { selectedCode, fileContext, projectContext, mode, experienceLevel }
  - Returns: streamed response
       |
       v
React hook (src/hooks/useCodeLens.js)
  - Exposes: run(), result, quiz, isLoading
  - Teammate calls this from UI components
       |
       v
Side panel renders streamed result
  - Teach-back button appears after any explanation
```

---

## Files Owned by You (AI/Logic side)
- `src/lib/ai.js` — core AI engine, all prompts, all 4 modes, streaming
- `src/hooks/useCodeLens.js` — React hook that wraps the engine for the UI
- `src/lib/contextBuilder.js` — builds project-level context from uploaded files/ZIP/GitHub
- `.env` — API key lives here (never commit this)

---

## Files Owned by Teammate (UI side)
- All components, layout, styling
- The code display area + selection logic
- The experience slider component
- Mode toggle buttons
- Side panel for results

---

## Current Repo State
- `sha256.py` — unrelated file, ignore
- No React project scaffolded yet as of conversation start
- Teammate working on UI in parallel

---

## Key Decisions Made
- No Monaco editor — custom-built code display
- Gemini API over Claude (free tier, no card)
- JavaScript not TypeScript
- Experience slider is universal — applies to ALL modes, not per-mode setting
- Teaching mode includes research paper references where relevant (makes it stand out)

---

## What Still Needs to Be Done
- [ ] React project scaffolded (`create-react-app` or Vite)
- [ ] `.env` set up with Gemini key
- [ ] `src/lib/ai.js` — AI engine written
- [ ] `src/hooks/useCodeLens.js` — React hook written
- [ ] `src/lib/contextBuilder.js` — project context builder written
- [ ] GitHub URL fetching logic
- [ ] ZIP unpacking logic
- [ ] Teammate UI wired to the hook
- [ ] Streaming responses working end-to-end
- [ ] Teach-back quiz UI
- [ ] Deploy to Vercel

---

## Notes for Claude
- Always write JavaScript, not TypeScript
- Gemini API, not Claude/OpenAI
- The experience slider value (0–100) must be passed into every AI call — never hardcode a level
- The AI engine should be modular — each mode is its own prompt function, not a giant if/else
- Keep the hook simple — teammate should be able to use it without understanding the AI logic
- Streaming is important — responses should flow in live, not appear all at once
- Don't over-engineer context building — good enough for a hackathon beats perfect
