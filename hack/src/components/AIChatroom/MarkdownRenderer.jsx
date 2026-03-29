import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import hljs from 'highlight.js';

/**
 * Rich markdown renderer — handles headings, bold, italic, inline code,
 * fenced code blocks with syntax highlighting + copy button, bullet/numbered lists,
 * blockquotes, horizontal rules, tables, and severity badges.
 */
export function MarkdownRenderer({ content }) {
  const { theme } = useTheme();

  const codeBlockOuter = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    margin: '10px 0',
    overflow: 'hidden',
  };

  const codeBlockHeader = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 12px',
    background: `${theme.border}40`,
    borderBottom: `1px solid ${theme.border}`,
    fontSize: 11,
    fontFamily: "'Geist Mono', monospace",
  };

  const codeBlockBody = {
    padding: '12px 14px',
    fontFamily: "'Geist Mono', monospace",
    fontSize: 12,
    color: theme.text,
    overflowX: 'auto',
    lineHeight: 1.65,
    whiteSpace: 'pre',
  };

  const inlineCode = {
    background: `${theme.accent}12`,
    border: `1px solid ${theme.accent}20`,
    borderRadius: 4,
    padding: '1.5px 6px',
    fontFamily: "'Geist Mono', monospace",
    fontSize: '0.85em',
    color: theme.accent,
  };

  const blockquoteStyle = {
    borderLeft: `3px solid ${theme.accent}60`,
    margin: '8px 0',
    padding: '6px 14px',
    background: `${theme.accent}08`,
    borderRadius: '0 6px 6px 0',
    color: theme.textDim,
    fontStyle: 'italic',
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

  // Render inline markdown
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
        parts.push(<code key={`c${key}-${i++}`} style={inlineCode}>{m[1].slice(1, -1)}</code>);
      } else if (m[2]) {
        parts.push(<strong key={`b${key}-${i++}`} style={{ color: theme.textBright }}>{renderInline(m[3], `b${key}-${i}`)}</strong>);
      } else if (m[4]) {
        parts.push(<em key={`i${key}-${i++}`}>{renderInline(m[5], `i${key}-${i}`)}</em>);
      }
      last = m.index + m[0].length;
    }

    if (last < text.length) {
      parts.push(<span key={`t${key}-end`}>{text.slice(last)}</span>);
    }

    return parts;
  }

  // Detect severity badges (CRITICAL, WARNING, SUGGESTION)
  function renderSeverityBadge(text) {
    const badges = {
      'CRITICAL': { bg: `${theme.danger}18`, color: theme.danger, border: `${theme.danger}30` },
      'WARNING': { bg: `${theme.warning}18`, color: theme.warning, border: `${theme.warning}30` },
      'SUGGESTION': { bg: `${theme.accent}12`, color: theme.accent, border: `${theme.accent}25` },
      'BUG': { bg: `${theme.danger}18`, color: theme.danger, border: `${theme.danger}30` },
      'PERFORMANCE': { bg: `${theme.orange}18`, color: theme.orange, border: `${theme.orange}30` },
      'SECURITY': { bg: `${theme.danger}18`, color: theme.danger, border: `${theme.danger}30` },
    };

    for (const [label, style] of Object.entries(badges)) {
      if (text.includes(label)) {
        return text.replace(label, '').replace(/^[:\s-]+/, '');
      }
    }
    return null;
  }

  function getSeverityBadge(text) {
    const badges = {
      'CRITICAL': { bg: `${theme.danger}18`, color: theme.danger, border: `${theme.danger}30` },
      'WARNING': { bg: `${theme.warning}18`, color: theme.warning, border: `${theme.warning}30` },
      'SUGGESTION': { bg: `${theme.accent}12`, color: theme.accent, border: `${theme.accent}25` },
      'BUG': { bg: `${theme.danger}18`, color: theme.danger, border: `${theme.danger}30` },
      'PERFORMANCE': { bg: `${theme.orange}18`, color: theme.orange, border: `${theme.orange}30` },
      'SECURITY': { bg: `${theme.danger}18`, color: theme.danger, border: `${theme.danger}30` },
    };

    for (const [label, style] of Object.entries(badges)) {
      if (text.toUpperCase().includes(label)) {
        return { label, ...style };
      }
    }
    return null;
  }

  // Render a text block
  function renderTextBlock(text, blockIdx) {
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.trim() === '') {
        elements.push(<div key={`sp-${blockIdx}-${i}`} style={{ height: 8 }} />);
        i++;
        continue;
      }

      // Headings
      const h3 = line.match(/^### (.+)/);
      const h2 = line.match(/^## (.+)/);
      const h1 = line.match(/^# (.+)/);
      if (h1) {
        elements.push(
          <div key={`h1-${blockIdx}-${i}`} style={{
            fontSize: 16, fontWeight: 700, color: theme.accent,
            margin: '14px 0 6px',
            paddingBottom: 6,
            borderBottom: `1px solid ${theme.border}`,
          }}>
            {renderInline(h1[1], `h1-${i}`)}
          </div>
        );
        i++; continue;
      }
      if (h2) {
        elements.push(
          <div key={`h2-${blockIdx}-${i}`} style={{
            fontSize: 14, fontWeight: 700, color: theme.accent,
            margin: '12px 0 4px',
          }}>
            {renderInline(h2[1], `h2-${i}`)}
          </div>
        );
        i++; continue;
      }
      if (h3) {
        elements.push(
          <div key={`h3-${blockIdx}-${i}`} style={{
            fontSize: 13, fontWeight: 700, color: theme.textBright,
            margin: '8px 0 3px',
          }}>
            {renderInline(h3[1], `h3-${i}`)}
          </div>
        );
        i++; continue;
      }

      // Horizontal rule
      if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
        elements.push(<hr key={`hr-${blockIdx}-${i}`} style={{ border: 'none', borderTop: `1px solid ${theme.border}`, margin: '12px 0' }} />);
        i++; continue;
      }

      // Blockquote
      if (line.match(/^> /)) {
        const quoteLines = [];
        while (i < lines.length && lines[i].match(/^> /)) {
          quoteLines.push(lines[i].slice(2));
          i++;
        }
        elements.push(
          <div key={`bq-${blockIdx}-${i}`} style={blockquoteStyle}>
            {quoteLines.map((ql, qi) => (
              <div key={qi} style={{ lineHeight: 1.6 }}>{renderInline(ql, `bq-${qi}`)}</div>
            ))}
          </div>
        );
        continue;
      }

      // Bullet list
      if (line.match(/^[*-] /)) {
        const listItems = [];
        while (i < lines.length && lines[i].match(/^[*-] /)) {
          const itemText = lines[i].slice(2);
          const badge = getSeverityBadge(itemText);
          listItems.push(
            <li key={`li-${i}`} style={{
              marginBottom: 6, paddingLeft: 4, lineHeight: 1.6,
            }}>
              {badge && (
                <span style={{
                  display: 'inline-block',
                  padding: '1px 7px', borderRadius: 4, marginRight: 6,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                  background: badge.bg, color: badge.color,
                  border: `1px solid ${badge.border}`,
                  verticalAlign: 'middle',
                }}>
                  {badge.label}
                </span>
              )}
              {renderInline(badge ? renderSeverityBadge(itemText) || itemText : itemText, `li-${i}`)}
            </li>
          );
          i++;
        }
        elements.push(
          <ul key={`ul-${blockIdx}-${i}`} style={{
            paddingLeft: 20, margin: '6px 0',
            listStyle: 'none',
          }}>
            {listItems.map((item, idx) => (
              React.cloneElement(item, {
                style: {
                  ...item.props.style,
                  position: 'relative',
                  paddingLeft: 14,
                },
                children: [
                  <span key="bullet" style={{
                    position: 'absolute', left: 0, top: 9,
                    width: 5, height: 5, borderRadius: '50%',
                    background: theme.accent,
                    opacity: 0.6,
                  }} />,
                  ...React.Children.toArray(item.props.children),
                ],
              })
            ))}
          </ul>
        );
        continue;
      }

      // Numbered list
      if (line.match(/^\d+\. /)) {
        const listItems = [];
        let num = 1;
        while (i < lines.length && lines[i].match(/^\d+\. /)) {
          listItems.push(
            <li key={`oli-${i}`} style={{
              marginBottom: 6, paddingLeft: 4, lineHeight: 1.6,
              counterIncrement: 'item',
            }}>
              <span style={{
                color: theme.accent, fontWeight: 700,
                fontSize: '0.9em', marginRight: 6,
                fontFamily: "'Geist Mono', monospace",
              }}>{num}.</span>
              {renderInline(lines[i].replace(/^\d+\. /, ''), `oli-${i}`)}
            </li>
          );
          num++;
          i++;
        }
        elements.push(
          <div key={`ol-${blockIdx}-${i}`} style={{ margin: '6px 0', paddingLeft: 6 }}>
            {listItems}
          </div>
        );
        continue;
      }

      // Table
      if (line.includes('|') && i + 1 < lines.length && lines[i + 1]?.match(/^\|[\s-:|]+\|$/)) {
        const headerCells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        i += 2; // skip header + separator
        const rows = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
          rows.push(lines[i].split('|').filter(c => c.trim()).map(c => c.trim()));
          i++;
        }
        elements.push(
          <div key={`tbl-${blockIdx}-${i}`} style={{ overflowX: 'auto', margin: '8px 0' }}>
            <table style={{
              borderCollapse: 'collapse', width: '100%',
              fontSize: 12.5, fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              <thead>
                <tr>
                  {headerCells.map((cell, ci) => (
                    <th key={ci} style={{
                      padding: '8px 12px', textAlign: 'left',
                      borderBottom: `2px solid ${theme.accent}40`,
                      color: theme.accent, fontWeight: 700, fontSize: 11.5,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{renderInline(cell, `th-${ci}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}
                    style={{ background: ri % 2 === 0 ? 'transparent' : `${theme.border}20` }}
                  >
                    {row.map((cell, ci) => (
                      <td key={ci} style={{
                        padding: '7px 12px',
                        borderBottom: `1px solid ${theme.border}`,
                        color: theme.text,
                      }}>{renderInline(cell, `td-${ri}-${ci}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Normal paragraph
      elements.push(
        <div key={`p-${blockIdx}-${i}`} style={{ lineHeight: 1.7, marginBottom: 2 }}>
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
          return <CodeBlock key={idx} lang={block.lang} code={block.content} theme={theme}
            outerStyle={codeBlockOuter} headerStyle={codeBlockHeader} bodyStyle={codeBlockBody} />;
        }
        return <span key={idx}>{renderTextBlock(block.content, idx)}</span>;
      })}
    </div>
  );
}

/** Code block with syntax highlighting + copy button */
function CodeBlock({ lang, code, theme, outerStyle, headerStyle, bodyStyle }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let highlighted = code;
  try {
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(code, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }
  } catch {}

  return (
    <div style={outerStyle}>
      <div style={headerStyle}>
        <span style={{ color: theme.textDim, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none', border: 'none',
            color: copied ? theme.success : theme.textDim,
            fontSize: 11, fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Geist Mono', monospace",
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = theme.accent; }}
          onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = theme.textDim; }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div style={bodyStyle} dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  );
}
