import React, { useState } from 'react';
import { X, Sliders, Check, Trash2, ShieldCheck, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customSystemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => void;
  onClearAllChats: () => void;
}

const PRESET_PERSONAS = [
  {
    id: 'default',
    title: 'Full-Stack Software Architect',
    desc: 'Balanced, pragmatic engineer producing complete, modular code with live interactive previews.',
    prompt: '',
  },
  {
    id: 'algorithms',
    title: 'Algorithm & Data Structure Specialist',
    desc: 'Focuses on time/space complexity analysis (Big-O), optimal algorithms, and step-by-step proofs.',
    prompt: 'You are an elite competitive programmer and computer science professor. When solving coding questions, always analyze time and space complexity with Big-O notation, explain the algorithmic invariants, and write modular, optimized code with edge case testing.',
  },
  {
    id: 'uiux',
    title: 'Creative Frontend & UI/UX Designer',
    desc: 'Crafts visually breathtaking, responsive web interfaces with micro-animations and typography.',
    prompt: 'You are an award-winning creative frontend engineer and UI/UX designer. When crafting web applications, always prioritize aesthetics, micro-interactions, cohesive warm color palettes, delightful sound effects, responsive layouts, and modern typography.',
  },
  {
    id: 'bughunter',
    title: 'Debug Detective & Code Reviewer',
    desc: 'Specializes in identifying race conditions, memory leaks, off-by-one errors, and clean refactoring.',
    prompt: 'You are a veteran principal systems engineer and code reviewer. Rigorously scrutinize all code for edge cases, null pointer exceptions, memory leaks, security vulnerabilities, and antipatterns. Always explain the root cause clearly before fixing.',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  customSystemPrompt,
  onSaveSystemPrompt,
  onClearAllChats,
}) => {
  const [prompt, setPrompt] = useState(customSystemPrompt);
  const [selectedPersona, setSelectedPersona] = useState('default');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleSelectPersona = (p: typeof PRESET_PERSONAS[0]) => {
    setSelectedPersona(p.id);
    setPrompt(p.prompt);
  };

  const handleSave = () => {
    onSaveSystemPrompt(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1C1C1F] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                Workspace Preferences
              </h3>
              <p className="text-xs text-stone-500">Customize dheeraj-claude system instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Persona selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Coding Persona Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PERSONAS.map(p => {
                const isSelected = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPersona(p)}
                    className={`p-3 text-left rounded-xl border transition text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-stone-900 dark:text-stone-100'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <div className="font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center justify-between">
                      <span>{p.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-[11px] opacity-80 line-clamp-2 leading-relaxed">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom System Prompt Textarea */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Custom Prompt Instructions (Optional)
            </label>
            <p className="text-xs text-stone-500 mb-2">
              Give dheeraj-claude specialized context about your project, coding conventions, or preferences.
            </p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Always write code using TypeScript with strict types and Tailwind CSS..."
              rows={4}
              className="w-full p-3 font-mono text-xs bg-stone-100 dark:bg-[#141416] border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
            />
          </div>

          {/* Clear history */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                  Clear All Chat Sessions
                </span>
                <span className="text-[11px] text-stone-500">
                  Permanently deletes all saved conversations and code history
                </span>
              </div>
              {confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onClearAllChats();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1 text-xs text-stone-400 hover:text-stone-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#18181A] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <Cpu className="w-3.5 h-3.5 text-amber-500" />
            <span>dheeraj-claude v3.7 • Gemini 3.8 Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-medium rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
