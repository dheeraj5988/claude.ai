import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Copy,
  Check,
  Download,
  ExternalLink,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Terminal,
  Code2,
  Eye,
  Maximize2,
  Minimize2,
  Sparkles,
  Bug,
  Palette,
  Zap,
  Moon
} from 'lucide-react';
import { Artifact, ConsoleEntry } from '../types';
import { generateSandboxHtml } from '../utils/codeRunner';
import Prism from 'prismjs';

interface ArtifactPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
  onUpdateCode: (artifactId: string, newCode: string) => void;
  onQuickPrompt: (prompt: string) => void;
  isOpen: boolean;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  artifact,
  onClose,
  onUpdateCode,
  onQuickPrompt,
  isOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'console'>('preview');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [consoleInput, setConsoleInput] = useState('');
  const [codeValue, setCodeValue] = useState(artifact?.code || '');
  const [refreshKey, setRefreshKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  // Sync code value when active artifact changes
  useEffect(() => {
    if (artifact) {
      setCodeValue(artifact.userEditedCode || artifact.code);
      setConsoleLogs([]);
    }
  }, [artifact?.id, artifact?.code, artifact?.userEditedCode]);

  // Listen for console logs dispatched from sandbox iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.source === 'dheeraj-claude-sandbox') {
        const newLog: ConsoleEntry = {
          id: `log-${Date.now()}-${Math.random()}`,
          type: event.data.type || 'log',
          content: event.data.content || '',
          timestamp: event.data.timestamp || new Date().toLocaleTimeString(),
        };
        setConsoleLogs(prev => [...prev.slice(-100), newLog]);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!isOpen || !artifact) return null;

  const currentCode = codeValue;
  const isPreviewable =
    artifact.type === 'web-app' ||
    artifact.type === 'svg' ||
    artifact.language === 'html' ||
    artifact.language === 'svg' ||
    artifact.language === 'javascript' ||
    artifact.language === 'js';

  // Copy code handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  // Download code as file
  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.filename || 'dheeraj-claude-artifact.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open in new browser tab
  const handleOpenExternal = () => {
    const html = generateSandboxHtml(currentCode, artifact.language);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  // Run user changes in code
  const handleRunChanges = () => {
    onUpdateCode(artifact.id, codeValue);
    setRefreshKey(prev => prev + 1);
    setActiveTab('preview');
  };

  // Execute console command
  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim() || !iframeRef.current?.contentWindow) return;

    try {
      const codeToRun = consoleInput;
      iframeRef.current.contentWindow.postMessage(
        { type: 'EXECUTE_EVAL', code: codeToRun },
        '*'
      );
      setConsoleLogs(prev => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          type: 'info',
          content: `> ${codeToRun}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setConsoleInput('');
    } catch (err: any) {
      setConsoleLogs(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          content: err.message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  // Pre-generate sandboxed html
  const sandboxHtml = generateSandboxHtml(currentCode, artifact.language);

  return (
    <aside
      className={`border-l border-stone-200 dark:border-stone-800 bg-[#FAF8F5] dark:bg-[#141416] flex flex-col z-30 transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50'
          : 'w-full lg:w-[50%] xl:w-[55%] h-full shrink-0'
      }`}
    >
      {/* Top Bar */}
      <div className="h-12 border-b border-stone-200 dark:border-stone-800 px-3 flex items-center justify-between bg-white dark:bg-[#18181A] select-none">
        {/* Left: Artifact info & Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            <span className="truncate max-w-[140px] md:max-w-[200px]">
              {artifact.title || artifact.filename}
            </span>
          </div>

          {/* View mode switcher */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg text-xs">
            {isPreviewable && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                activeTab === 'code'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>

            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                activeTab === 'console'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console</span>
              {consoleLogs.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {activeTab === 'preview' && (
            <div className="hidden sm:flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg text-stone-500">
              <button
                onClick={() => setViewportMode('desktop')}
                className={`p-1 rounded ${
                  viewportMode === 'desktop'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'hover:text-stone-800 dark:hover:text-stone-200'
                }`}
                title="Desktop view"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewportMode('tablet')}
                className={`p-1 rounded ${
                  viewportMode === 'tablet'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'hover:text-stone-800 dark:hover:text-stone-200'
                }`}
                title="Tablet view (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewportMode('mobile')}
                className={`p-1 rounded ${
                  viewportMode === 'mobile'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'hover:text-stone-800 dark:hover:text-stone-200'
                }`}
                title="Mobile view (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'preview' && (
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Refresh preview"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {isPreviewable && (
            <button
              onClick={handleOpenExternal}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Open full page in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-500 hover:bg-rose-500/10 transition"
            title="Close canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-stone-100 dark:bg-stone-950 flex flex-col">
        {/* Tab 1: Live Preview */}
        {activeTab === 'preview' && (
          <div className="flex-1 w-full h-full flex items-center justify-center p-2 md:p-3 overflow-auto bg-stone-900/10 dark:bg-black/40">
            <div
              className={`h-full transition-all duration-300 rounded-xl overflow-hidden shadow-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex flex-col ${
                viewportMode === 'mobile'
                  ? 'w-[375px]'
                  : viewportMode === 'tablet'
                  ? 'w-[768px]'
                  : 'w-full'
              }`}
            >
              <iframe
                key={refreshKey}
                ref={iframeRef}
                srcDoc={sandboxHtml}
                title="dheeraj-claude artifact preview"
                sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                className="w-full h-full border-none flex-1"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Code Editor */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col h-full bg-[#151517] text-stone-100">
            {/* Editor Action Header */}
            <div className="px-4 py-2 bg-[#1C1C1F] border-b border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400 font-mono">
                {artifact.filename} • {codeValue.split('\n').length} lines
              </span>
              <button
                onClick={handleRunChanges}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run & Update Preview</span>
              </button>
            </div>

            {/* Editable Text Area */}
            <div className="flex-1 relative font-mono text-[13px] leading-relaxed overflow-hidden">
              <textarea
                ref={codeEditorRef}
                value={codeValue}
                onChange={e => setCodeValue(e.target.value)}
                onKeyDown={e => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleRunChanges();
                  }
                }}
                spellCheck={false}
                className="w-full h-full p-4 bg-transparent text-stone-200 resize-none font-mono focus:outline-none selection:bg-amber-500/30 overflow-auto"
                placeholder="Write or edit code here... (Press Ctrl+Enter to run)"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Console Logs */}
        {activeTab === 'console' && (
          <div className="flex-1 flex flex-col h-full bg-[#0D0D0E] text-stone-300 font-mono text-xs">
            {/* Console Toolbar */}
            <div className="px-3 py-2 bg-[#171719] border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-400">
                <Terminal className="w-3.5 h-3.5 text-amber-500" />
                <span>Sandbox Output Console</span>
              </div>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded hover:bg-stone-800"
              >
                Clear
              </button>
            </div>

            {/* Logs List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-1.5 selection:bg-amber-500/30">
              {consoleLogs.length === 0 ? (
                <div className="text-stone-500 italic py-4 text-center">
                  No logs captured yet. Call console.log(...) in your preview to inspect outputs.
                </div>
              ) : (
                consoleLogs.map(log => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 py-1 px-2 rounded ${
                      log.type === 'error'
                        ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                        : log.type === 'warn'
                        ? 'bg-amber-950/40 text-amber-300 border-l-2 border-amber-500'
                        : 'text-stone-200'
                    }`}
                  >
                    <span className="text-[10px] text-stone-500 shrink-0 select-none">
                      [{log.timestamp}]
                    </span>
                    <pre className="whitespace-pre-wrap flex-1 m-0 font-mono text-xs">
                      {log.content}
                    </pre>
                  </div>
                ))
              )}
            </div>

            {/* Console command input */}
            <form
              onSubmit={handleConsoleSubmit}
              className="p-2 bg-[#141416] border-t border-stone-800 flex items-center gap-2"
            >
              <span className="text-amber-500 font-bold">&gt;</span>
              <input
                type="text"
                value={consoleInput}
                onChange={e => setConsoleInput(e.target.value)}
                placeholder="Run JavaScript expression in sandbox..."
                className="flex-1 bg-transparent text-stone-200 focus:outline-none font-mono text-xs"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px]"
              >
                Eval
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#18181A] flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-stone-400 font-medium shrink-0 ml-1">Iterate with dheeraj-claude:</span>

        <button
          onClick={() =>
            onQuickPrompt(`Please inspect this code for bugs, missing edge cases, or performance bottlenecks, and provide the revised version:\n\`\`\`${artifact.language}:${artifact.filename}\n${currentCode}\n\`\`\``)
          }
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-stone-600 dark:text-stone-300 shrink-0 transition"
        >
          <Bug className="w-3 h-3 text-rose-500" />
          <span>Fix bugs</span>
        </button>

        <button
          onClick={() =>
            onQuickPrompt(`Please redesign and polish the visual styling, typography, colors, and animations of this code to make it look exceptionally modern and sleek:\n\`\`\`${artifact.language}:${artifact.filename}\n${currentCode}\n\`\`\``)
          }
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-stone-600 dark:text-stone-300 shrink-0 transition"
        >
          <Palette className="w-3 h-3 text-amber-500" />
          <span>Polish UI</span>
        </button>

        <button
          onClick={() =>
            onQuickPrompt(`Add interactive dark mode support, smooth transitions, and keyboard shortcuts to this app:\n\`\`\`${artifact.language}:${artifact.filename}\n${currentCode}\n\`\`\``)
          }
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-stone-600 dark:text-stone-300 shrink-0 transition"
        >
          <Moon className="w-3 h-3 text-indigo-400" />
          <span>Add Dark Mode</span>
        </button>

        <button
          onClick={() =>
            onQuickPrompt(`Add more advanced features and power-user capabilities to this app:\n\`\`\`${artifact.language}:${artifact.filename}\n${currentCode}\n\`\`\``)
          }
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-stone-600 dark:text-stone-300 shrink-0 transition"
        >
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>Add Features</span>
        </button>
      </div>
    </aside>
  );
};
