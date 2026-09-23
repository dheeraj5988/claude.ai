import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

interface ThinkingBoxProps {
  thought: string;
  isThinking?: boolean;
  durationSeconds?: number;
}

export const ThinkingBox: React.FC<ThinkingBoxProps> = ({
  thought,
  isThinking = false,
  durationSeconds,
}) => {
  const [isOpen, setIsOpen] = useState(isThinking);

  if (!thought && !isThinking) return null;

  return (
    <div className="mb-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/60 overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition select-none"
      >
        <div className="flex items-center gap-2">
          {isThinking ? (
            <div className="relative flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping absolute" />
            </div>
          ) : (
            <Brain className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
          )}

          <span>
            {isThinking
              ? 'Thinking through architecture and code...'
              : `Thought for ${durationSeconds || 3} seconds`}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-70">
          <span className="text-[11px]">{isOpen ? 'Hide' : 'Show reasoning'}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-800 text-xs font-mono leading-relaxed text-stone-600 dark:text-stone-400 bg-white/40 dark:bg-stone-950/40 max-h-80 overflow-y-auto whitespace-pre-wrap selection:bg-amber-500/20">
          {thought || 'Analyzing request, evaluating algorithms, and structuring code response...'}
        </div>
      )}
    </div>
  );
};
