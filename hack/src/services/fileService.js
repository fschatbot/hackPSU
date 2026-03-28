// Service for handling file uploads and processing

export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

export function detectLanguage(filename) {
  const ext = getFileExtension(filename);
  const langMap = {
    js: 'js',
    jsx: 'jsx',
    ts: 'ts',
    tsx: 'tsx',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'md',
    py: 'py',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
  };
  return langMap[ext] || ext;
}

export async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function createFileNode(name, content) {
  return {
    type: 'file',
    lang: detectLanguage(name),
    content,
  };
}

export function createFolderNode() {
  return {
    type: 'folder',
    children: {},
  };
}

export function buildFileTree(files) {
  const tree = {};

  for (const file of files) {
    const pathParts = file.webkitRelativePath
      ? file.webkitRelativePath.split('/')
      : [file.name];

    let current = tree;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;

      if (isLast) {
        // It's a file
        current[part] = {
          type: 'file',
          lang: detectLanguage(part),
          content: file._content || '',
          _file: file,
        };
      } else {
        // It's a folder
        if (!current[part]) {
          current[part] = createFolderNode();
        }
        current = current[part].children;
      }
    }
  }

  return tree;
}

export async function processUploadedFiles(fileList) {
  const files = Array.from(fileList);

  // Read all file contents
  await Promise.all(
    files.map(async (file) => {
      try {
        const content = await readFileAsText(file);
        file._content = content;
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
        file._content = '';
      }
    })
  );

  return buildFileTree(files);
}

export async function extractZipFile(zipFile) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(zipFile);
  const tree = {};

  await Promise.all(
    Object.entries(zip.files).map(async ([relativePath, zipEntry]) => {
      if (zipEntry.dir) return;

      // Skip macOS metadata and hidden files
      if (relativePath.includes('__MACOSX') || relativePath.includes('/.')) return;

      let content = '';
      try {
        content = await zipEntry.async('string');
      } catch {
        return; // skip binary files
      }

      const parts = relativePath.split('/').filter(Boolean);
      // Strip top-level folder if all files share one (common in GitHub ZIPs)
      const effectiveParts = parts;

      let current = tree;
      for (let i = 0; i < effectiveParts.length; i++) {
        const part = effectiveParts[i];
        const isLast = i === effectiveParts.length - 1;
        if (isLast) {
          current[part] = { type: 'file', lang: detectLanguage(part), content };
        } else {
          if (!current[part]) current[part] = createFolderNode();
          current = current[part].children;
        }
      }
    })
  );

  return tree;
}

export function flattenFileTree(tree) {
  const files = [];

  function walk(node, path = '') {
    if (!node) return;

    Object.entries(node).forEach(([name, item]) => {
      const fullPath = path ? `${path}/${name}` : name;

      if (item.type === 'file') {
        files.push({
          name,
          path: fullPath,
          lang: item.lang,
          content: item.content,
        });
      } else if (item.type === 'folder' && item.children) {
        walk(item.children, fullPath);
      }
    });
  }

  walk(tree);
  return files;
}
