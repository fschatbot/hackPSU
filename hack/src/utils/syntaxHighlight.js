export function syntaxHighlight(code, lang, syntax) {
  const lines = code.split("\n");
  return lines.map((line) => {
    let highlighted = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Comments
    highlighted = highlighted.replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
      `<span style="color:${syntax.comment};font-style:italic">$1</span>`
    );

    // Keywords
    highlighted = highlighted.replace(
      /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|extends|default|async|await|try|catch|throw|new|typeof|interface|type|enum)\b/g,
      `<span style="color:${syntax.keyword};font-weight:600">$1</span>`
    );

    // Strings
    highlighted = highlighted.replace(
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
      `<span style="color:${syntax.string}">$1</span>`
    );

    // Numbers
    highlighted = highlighted.replace(
      /\b(\d+\.?\d*)\b/g,
      `<span style="color:${syntax.number}">$1</span>`
    );

    // Types (capitalized words)
    highlighted = highlighted.replace(
      /\b([A-Z][a-zA-Z0-9]*)\b/g,
      `<span style="color:${syntax.type}">$1</span>`
    );

    return highlighted;
  });
}
