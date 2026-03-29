<p align="center">
  <img src="hack/public/logo512.png" alt="CodeLens" width="120" />
</p>

<h1 align="center">CodeLens</h1>

<p align="center">
  <strong>Understand any codebase — at your level.</strong>
</p>

<p align="center">
  <a href="https://hack-psu.vercel.app/">Live Demo</a> · Built at HackPSU 2026
</p>

---

## What is CodeLens?

CodeLens is an AI-powered code understanding tool. Drop in any project — upload files, a ZIP, or paste a GitHub URL — select any piece of code, and explore it through four different modes. An experience slider adapts every response from beginner-friendly to senior-engineer terse.

## Modes

| Mode | What it does |
|------|-------------|
| **Explain** | Plain-English explanation of what the code does, what it references, and why it exists in context |
| **Teach** | Goes beyond the code — teaches the CS concepts, design patterns, and foundational ideas behind it |
| **Review** | Senior-dev code review — flags bugs, edge cases, security holes, and performance issues |
| **Quiz** | Interactive quiz that tests your understanding with one question at a time, grades your answers |

## Features

- **Experience Slider** — 0 to 100, every mode adapts its language and depth
- **4 Input Methods** — upload files/folders, ZIP, GitHub URL, or try with sample code
- **Drag & Drop** — drop files anywhere on the landing page
- **Per-Mode Chat History** — each file + mode combo gets its own isolated conversation
- **Manual Mode** — select code, then type your own question about it
- **Cloud Sync** — sign in to save projects and access them from any device
- **Guest Mode** — no login required, everything works out of the box
- **4 Themes** — Lens Dark, Ember, Forest, Slate
- **Custom Logo** — `<?>` because that's what we're all about

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | React (JavaScript) |
| AI | Gemini 2.5 Flash |
| Syntax | highlight.js |
| Auth | JWT + SQLite |
| Backend | Express |
| Deploy | Vercel |

## Getting Started

```bash
# Clone
git clone https://github.com/fschatbot/hackPSU.git
cd hackPSU/hack

# Install
npm install

# Set up environment
cp .env.example .env
# Add your Gemini API key: REACT_APP_GEMINI_API_KEY=your_key_here

# Run
npm start
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/).

To run the backend (for auth/cloud save):

```bash
cd server
npm install
node index.js
```


