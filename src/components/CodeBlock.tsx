import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy, ExternalLink, Play, Code2 } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import { Artifact } from '../types';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  onOpenInCanvas?: (artifact: Partial<Artifact>) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'text',
  filename,
  onOpenInCanvas,
}) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const cleanLang = (language || 'text').toLowerCase();
  const displayTitle = filename || `${cleanLang.toUpperCase()}`;
  const lines = code.trim().split('\n');

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  const isExecutable =
    cleanLang === 'html' ||
    cleanLang === 'svg' ||
    cleanLang === 'javascript' ||
    cleanLang === 'js' ||
    (filename && (filename.endsWith('.html') || filename.endsWith('.svg')));

  const handleOpenCanvas = () => {
    if (onOpenInCanvas) {
      onOpenInCanvas({
        title: displayTitle,
        filename: filename || `code.${cleanLang === 'html' ? 'html' : cleanLang === 'svg' ? 'svg' : 'js'}`,
        language: cleanLang,
        code,
        type: isExecutable ? (cleanLang === 'svg' ? 'svg' : 'web-app') : 'code',
      });
    }
  };

  // Map prism language name
  const prismGrammar =
    cleanLang === 'js'
      ? 'javascript'
      : cleanLang === 'ts'
      ? 'typescript'
      : cleanLang === 'py'
      ? 'python'
      : cleanLang === 'html' || cleanLang === 'xml' || cleanLang === 'svg'
      ? 'markup'
      : Prism.languages[cleanLang]
      ? cleanLang
      : 'text';

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-stone-700/60 bg-[#151517] text-stone-100 shadow-lg text-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#1C1C1F] border-b border-stone-800 text-stone-400 select-none">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono font-medium text-stone-200">{displayTitle}</span>
          <span className="text-[10px] text-stone-500">({lines.length} lines)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenInCanvas && (
            <button
              onClick={handleOpenCanvas}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition shadow-xs"
              title="Open and run in interactive Artifact Canvas"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in Canvas</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-stone-300 hover:text-white hover:bg-stone-800 transition"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="p-3.5 overflow-x-auto font-mono text-[12px] leading-relaxed max-h-[500px]">
        <pre className="m-0 p-0 bg-transparent">
          <code ref={codeRef} className={`language-${prismGrammar}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};
