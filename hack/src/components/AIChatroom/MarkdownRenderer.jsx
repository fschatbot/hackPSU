import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Lightweight markdown renderer — handles the subset Gemini actually outputs:
 * headings, bold, italic, inline code, code blocks, bullet lists, numbered lists, horizontal rules.
 */
export function MarkdownRenderer({ content }) {
  const { theme } = useTheme();

  const codeBlock = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 6,
    padding: '10px 12px',
    fontFamily: "'Geist Mono', monospace",
    fontSize: 11.5,
    color: theme.text,
    overflowX: 'auto',
    margin: '8px 0',
    display: 'block',
    lineHeight: 1.6,
    whiteSpace: 'pre',
  };

  const inlineCode = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 3,
    padding: '1px 5px',
    fontFamily: "'Geist Mono', monospace",
    fontSize: '0.88em',
    color: theme.accent,
  };

  // Parse content into segments, handling fenced code blocks first
  function parseBlocks(text) {
    const blocks = [];
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      blocks.push({ type: 'code', lang: match[1], content: match[2].trimEnd() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      blocks.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return blocks;
  }

  // Render inline markdown (bold, italic, inline code) within a text string
  function renderInline(text, key) {
    const parts = [];
    const regex = /(`[^`]+`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
    let last = 0;
    let m;
    let i = 0;

    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) {
        parts.push(<span key={`t${key}-${i++}`}>{text.slice(last, m.index)}</span>);
      }
      if (m[1]) {
        // inline code
        parts.push(<code key={`c${key}-${i++}`} style={inlineCode}>{m[1].slice(1, -1)}</code>);
      } else if (m[2]) {
        // bold
        parts.push(<strong key={`b${key}-${i++}`} style={{ color: theme.textBright || theme.text }}>{m[3]}</strong>);
      } else if (m[4]) {
        // italic
        parts.push(<em key={`i${key}-${i++}`}>{m[5]}</em>);
      }
      last = m.index + m[0].length;
    }

    if (last < text.length) {
      parts.push(<span key={`t${key}-end`}>{text.slice(last)}</span>);
    }

    return parts;
  }

  // Render a text block (lines with headings, bullets, etc.)
  function renderTextBlock(text, blockIdx) {
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip empty lines (add spacing)
      if (line.trim() === '') {
        elements.push(<div key={`sp-${blockIdx}-${i}`} style={{ height: 6 }} />);
        i++;
        continue;
      }

      // Headings
      const h3 = line.match(/^### (.+)/);
      const h2 = line.match(/^## (.+)/);
      const h1 = line.match(/^# (.+)/);
      if (h1) {
        elements.push(
          <div key={`h1-${blockIdx}-${i}`} style={{ fontSize: 15, fontWeight: 700, color: theme.accent, margin: '10px 0 4px', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {renderInline(h1[1], `h1-${i}`)}
          </div>
        );
        i++; continue;
      }
      if (h2) {
        elements.push(
          <div key={`h2-${blockIdx}-${i}`} style={{ fontSize: 13.5, fontWeight: 700, color: theme.accent, margin: '8px 0 4px', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {renderInline(h2[1], `h2-${i}`)}
          </div>
        );
        i++; continue;
      }
      if (h3) {
        elements.push(
          <div key={`h3-${blockIdx}-${i}`} style={{ fontSize: 12.5, fontWeight: 700, color: theme.textBright || theme.text, margin: '6px 0 3px' }}>
            {renderInline(h3[1], `h3-${i}`)}
          </div>
        );
        i++; continue;
      }

      // Horizontal rule
      if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
        elements.push(<hr key={`hr-${blockIdx}-${i}`} style={{ border: 'none', borderTop: `1px solid ${theme.border}`, margin: '8px 0' }} />);
        i++; continue;
      }

      // Bullet list
      if (line.match(/^[\*\-] /)) {
        const listItems = [];
        while (i < lines.length && lines[i].match(/^[\*\-] /)) {
          listItems.push(
            <li key={`li-${i}`} style={{ marginBottom: 3, paddingLeft: 4 }}>
              {renderInline(lines[i].slice(2), `li-${i}`)}
            </li>
          );
          i++;
        }
        elements.push(
          <ul key={`ul-${blockIdx}-${i}`} style={{ paddingLeft: 18, margin: '4px 0', listStyle: 'disc' }}>
            {listItems}
          </ul>
        );
        continue;
      }

      // Numbered list
      if (line.match(/^\d+\. /)) {
        const listItems = [];
        while (i < lines.length && lines[i].match(/^\d+\. /)) {
          listItems.push(
            <li key={`oli-${i}`} style={{ marginBottom: 3, paddingLeft: 4 }}>
              {renderInline(lines[i].replace(/^\d+\. /, ''), `oli-${i}`)}
            </li>
          );
          i++;
        }
        elements.push(
          <ol key={`ol-${blockIdx}-${i}`} style={{ paddingLeft: 18, margin: '4px 0' }}>
            {listItems}
          </ol>
        );
        continue;
      }

      // Normal paragraph line
      elements.push(
        <div key={`p-${blockIdx}-${i}`} style={{ lineHeight: 1.65 }}>
          {renderInline(line, `p-${i}`)}
        </div>
      );
      i++;
    }

    return elements;
  }

  const blocks = parseBlocks(content);

  return (
    <div style={{ fontSize: 'inherit', color: theme.text, fontFamily: "'Inter', system-ui, sans-serif", wordBreak: 'break-word' }}>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <code key={idx} style={codeBlock}>{block.content}</code>;
        }
        return <span key={idx}>{renderTextBlock(block.content, idx)}</span>;
      })}
    </div>
  );
}
