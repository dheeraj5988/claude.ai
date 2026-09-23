import React, { useState } from 'react';
import { X, Code2, Check } from 'lucide-react';
import { Attachment } from '../types';

interface CodeSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAttachment: (att: Attachment) => void;
  onOpenInCanvas?: (code: string, language: string, filename: string) => void;
}

const COMMON_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript (.js)' },
  { id: 'typescript', name: 'TypeScript (.ts)' },
  { id: 'html', name: 'HTML / Web App (.html)' },
  { id: 'css', name: 'CSS (.css)' },
  { id: 'python', name: 'Python (.py)' },
  { id: 'json', name: 'JSON (.json)' },
  { id: 'sql', name: 'SQL (.sql)' },
  { id: 'bash', name: 'Bash / Shell (.sh)' },
  { id: 'markdown', name: 'Markdown (.md)' },
];

export const CodeSnippetModal: React.FC<CodeSnippetModalProps> = ({
  isOpen,
  onClose,
  onAddAttachment,
  onOpenInCanvas,
}) => {
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('');
  const [language, setLanguage] = useState('javascript');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const finalFilename = filename.trim() || `snippet.${language === 'html' ? 'html' : language === 'python' ? 'py' : 'js'}`;

    const attachment: Attachment = {
      id: `snippet-${Date.now()}`,
      name: finalFilename,
      language,
      content: code,
      type: 'code',
    };

    onAddAttachment(attachment);
    setCode('');
    setFilename('');
    onClose();
  };

  const handleSendToCanvas = () => {
    if (!code.trim()) return;
    const finalFilename = filename.trim() || `snippet.${language === 'html' ? 'html' : language === 'python' ? 'py' : 'js'}`;
    if (onOpenInCanvas) {
      onOpenInCanvas(code, language, finalFilename);
    }
    setCode('');
    setFilename('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1C1C1F] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                Attach Code Snippet
              </h3>
              <p className="text-xs text-stone-500">
                Paste code to send to dheeraj-claude or run in canvas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {COMMON_LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Filename (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. index.html or server.ts"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Code Content
            </label>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste your source code or script here..."
              rows={8}
              className="w-full p-3 font-mono text-xs bg-stone-100 dark:bg-[#141416] border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            {onOpenInCanvas && (
              <button
                type="button"
                onClick={handleSendToCanvas}
                disabled={!code.trim()}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-40"
              >
                Open directly in Artifact Canvas &rarr;
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!code.trim()}
                className="px-4 py-1.5 text-xs font-medium rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white shadow-sm transition"
              >
                Attach to Chat
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
