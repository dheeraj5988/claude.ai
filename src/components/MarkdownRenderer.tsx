import React from 'react';
import { CodeBlock } from './CodeBlock';
import { Artifact } from '../types';
import { ExternalLink, Sparkles, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onOpenArtifact?: (artifact: Partial<Artifact>) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onOpenArtifact,
}) => {
  if (!content) return null;

  // Split content by code blocks: ```lang:filename ... ``` or ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_\-+]+)?(?::([a-zA-Z0-9_\-./]+))?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, lang = 'text', filename, code] = match;
    const matchIndex = match.index;

    // Text preceding the code block
    if (matchIndex > lastIndex) {
      const textChunk = content.slice(lastIndex, matchIndex);
      parts.push(renderTextChunk(textChunk, `text-${lastIndex}`, onOpenArtifact));
    }

    // Code block component
    parts.push(
      <CodeBlock
        key={`code-${matchIndex}`}
        code={code}
        language={lang}
        filename={filename}
        onOpenInCanvas={onOpenArtifact}
      />
    );

    lastIndex = matchIndex + fullMatch.length;
  }

  // Trailing text after last code block
  if (lastIndex < content.length) {
    const trailing = content.slice(lastIndex);
    parts.push(renderTextChunk(trailing, `text-${lastIndex}`, onOpenArtifact));
  }

  return <div className="space-y-2.5 text-stone-800 dark:text-stone-200 leading-relaxed text-sm md:text-[15px]">{parts}</div>;
};

function renderTextChunk(
  text: string,
  keyPrefix: string,
  onOpenArtifact?: (artifact: Partial<Artifact>) => void
): React.ReactNode {
  const paragraphs = text.split('\n\n');

  return (
    <div key={keyPrefix} className="space-y-3">
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Check for AntArtifact XML tags if raw in text
        if (trimmed.startsWith('<antArtifact')) {
          const titleMatch = trimmed.match(/title="([^"]+)"/);
          const title = titleMatch ? titleMatch[1] : 'Interactive Artifact';
          return (
            <div
              key={`ant-${pIdx}`}
              onClick={() => onOpenArtifact && onOpenArtifact({ title })}
              className="my-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-stone-900 dark:text-stone-100">{title}</div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">Click to open and run in Artifact Canvas</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          );
        }

        // Heading 1
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={`h1-${pIdx}`} className="text-xl md:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 pt-2 pb-1 border-b border-stone-200 dark:border-stone-800">
              {formatInlineStyles(trimmed.slice(2))}
            </h1>
          );
        }

        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={`h2-${pIdx}`} className="text-lg md:text-xl font-serif font-bold text-stone-900 dark:text-stone-100 pt-2 pb-1">
              {formatInlineStyles(trimmed.slice(3))}
            </h2>
          );
        }

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={`h3-${pIdx}`} className="text-base font-semibold text-stone-900 dark:text-stone-100 pt-1">
              {formatInlineStyles(trimmed.slice(4))}
            </h3>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={`bq-${pIdx}`} className="border-l-3 border-amber-500/70 pl-3.5 py-1 text-stone-600 dark:text-stone-400 italic text-sm my-2">
              {formatInlineStyles(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Bullet list
        if (trimmed.split('\n').every(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
          const items = trimmed.split('\n');
          return (
            <ul key={`ul-${pIdx}`} className="list-disc pl-5 space-y-1 text-stone-700 dark:text-stone-300">
              {items.map((it, itIdx) => (
                <li key={`li-${itIdx}`}>{formatInlineStyles(it.trim().replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        // Numbered list
        if (trimmed.split('\n').every(line => /^\d+\.\s+/.test(line.trim()))) {
          const items = trimmed.split('\n');
          return (
            <ol key={`ol-${pIdx}`} className="list-decimal pl-5 space-y-1 text-stone-700 dark:text-stone-300">
              {items.map((it, itIdx) => (
                <li key={`oli-${itIdx}`}>{formatInlineStyles(it.trim().replace(/^\d+\.\s+/, ''))}</li>
              ))}
            </ol>
          );
        }

        // Standard paragraph
        return (
          <p key={`p-${pIdx}`} className="whitespace-pre-line text-stone-700 dark:text-stone-300">
            {formatInlineStyles(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function formatInlineStyles(text: string): React.ReactNode {
  // Regex tokens: **bold**, *italic*, `code`, [link](url)
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-stone-900 dark:text-stone-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-stone-800 dark:text-stone-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-800 text-amber-700 dark:text-amber-400 font-mono text-[13px] border border-stone-300/60 dark:border-stone-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
