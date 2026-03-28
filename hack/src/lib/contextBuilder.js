/**
 * contextBuilder.js
 * Builds project-level context from the loaded file tree to give the AI
 * situational awareness of the whole codebase, not just the selected file.
 */

const SKIP_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'mp3', 'mp4', 'pdf', 'zip']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__']);
const MAX_CONTEXT_CHARS = 12000; // stay well within token limits
const MAX_FILE_PREVIEW = 400;    // chars per file in the summary

/**
 * Walk a file tree and collect all file paths + content.
 * File tree shape: { name: { type: 'file'|'folder', content, children } }
 */
function walkTree(tree, path = '') {
  const results = [];
  if (!tree || typeof tree !== 'object') return results;

  for (const [name, node] of Object.entries(tree)) {
    if (SKIP_DIRS.has(name)) continue;

    const fullPath = path ? `${path}/${name}` : name;

    if (node.type === 'file') {
      const ext = name.split('.').pop()?.toLowerCase();
      if (!SKIP_EXTENSIONS.has(ext)) {
        results.push({ path: fullPath, content: node.content || '' });
      }
    } else if (node.type === 'folder' && node.children) {
      results.push(...walkTree(node.children, fullPath));
    }
  }

  return results;
}

/**
 * Build a condensed project context string for the AI system prompt.
 * Includes file tree overview + first N chars of each file.
 *
 * @param {Object} fileTree - The loaded file tree from EditorContext
 * @param {string} activeFile - Currently open file path (gets more context budget)
 * @returns {string} A project summary string
 */
export function buildProjectContext(fileTree, activeFile = null) {
  if (!fileTree || Object.keys(fileTree).length === 0) return null;

  const files = walkTree(fileTree);
  if (files.length === 0) return null;

  // File tree listing
  const fileList = files.map(f => `  ${f.path}`).join('\n');
  let context = `Project contains ${files.length} file(s):\n${fileList}\n\n`;

  // File previews — active file gets skipped here (it's already in fileContext)
  let chars = context.length;
  const previews = [];

  for (const file of files) {
    if (file.path === activeFile) continue;
    if (chars >= MAX_CONTEXT_CHARS) break;
    if (!file.content.trim()) continue;

    const preview = file.content.length > MAX_FILE_PREVIEW
      ? file.content.slice(0, MAX_FILE_PREVIEW) + '…'
      : file.content;

    const entry = `### ${file.path}\n\`\`\`\n${preview}\n\`\`\`\n`;
    chars += entry.length;
    previews.push(entry);
  }

  if (previews.length > 0) {
    context += 'File previews:\n\n' + previews.join('\n');
  }

  return context;
}

/**
 * Build the full context object for an AI call.
 * Combines active file content + project-wide summary.
 *
 * @param {string} fileName - Active file name/path
 * @param {string} fileContent - Full content of the active file
 * @param {string|null} selectedText - Currently selected code
 * @param {Object|null} fileTree - Full project file tree
 * @returns {Object} context object for AIContext.sendMessage
 */
export function buildContext(fileName, fileContent, selectedText = null, fileTree = null) {
  return {
    fileName,
    fileContent: fileContent?.slice(0, 10000) || '',
    selectedText,
    projectContext: fileTree ? buildProjectContext(fileTree, fileName) : null,
  };
}
