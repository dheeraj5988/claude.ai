import React, { useState } from 'react';
import { X, Sliders, Check, Trash2, Sun, Moon, Laptop, UserX, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customSystemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => void;
  onClearAllChats: () => void;
  theme?: 'dark' | 'light' | 'system';
  onSelectTheme?: (theme: 'dark' | 'light' | 'system') => void;
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
  theme = 'dark',
  onSelectTheme,
}) => {
  const { currentUser, deleteAccount } = useAuth();
  const [prompt, setPrompt] = useState(customSystemPrompt);
  const [selectedPersona, setSelectedPersona] = useState('default');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  if (!isOpen) return null;

  const handleSelectPersona = (p: typeof PRESET_PERSONAS[0]) => {
    setSelectedPersona(p.id);
    setPrompt(p.prompt);
  };

  const handleSave = () => {
    onSaveSystemPrompt(prompt);
    onClose();
  };

  const handleDeleteAccount = async () => {
    if (currentUser?.id) {
      await deleteAccount(currentUser.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#1C1C1F] border border-[#2D2D30] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-[#EDEDEB]">
        {/* Header */}
        <div className="p-4 border-b border-[#2D2D30] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-[#E07A5F] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">
                Workspace Preferences
              </h3>
              <p className="text-xs text-[#9B9B97]">Customize Aura system instructions, theme & account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8E8E8B] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#C4C4C2] uppercase tracking-wider mb-2">
              Appearance & Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSelectTheme?.('dark')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[#E07A5F] bg-[#E07A5F]/10 text-white'
                    : 'border-[#2D2D30] bg-[#222225] text-[#9B9B97] hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTheme?.('light')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition cursor-pointer ${
                  theme === 'light'
                    ? 'border-[#E07A5F] bg-[#E07A5F]/10 text-white'
                    : 'border-[#2D2D30] bg-[#222225] text-[#9B9B97] hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTheme?.('system')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition cursor-pointer ${
                  theme === 'system'
                    ? 'border-[#E07A5F] bg-[#E07A5F]/10 text-white'
                    : 'border-[#2D2D30] bg-[#222225] text-[#9B9B97] hover:text-white'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Persona selector */}
          <div>
            <label className="block text-xs font-semibold text-[#C4C4C2] uppercase tracking-wider mb-2">
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
                        ? 'border-[#E07A5F] bg-[#E07A5F]/10 text-white'
                        : 'border-[#2D2D30] bg-[#222225] hover:bg-[#28282B] text-[#9B9B97]'
                    }`}
                  >
                    <div className="font-semibold text-white mb-1 flex items-center justify-between">
                      <span>{p.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#E07A5F]" />}
                    </div>
                    <p className="text-[11px] opacity-80 line-clamp-2 leading-relaxed">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom System Prompt Textarea */}
          <div>
            <label className="block text-xs font-semibold text-[#C4C4C2] uppercase tracking-wider mb-1">
              Custom Prompt Instructions (Optional)
            </label>
            <p className="text-xs text-[#8E8E8B] mb-2">
              Give Aura specialized context about your project, coding conventions, or preferences.
            </p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Always write code using TypeScript with strict types and Tailwind CSS..."
              rows={4}
              className="w-full p-3 font-mono text-xs bg-[#151517] border border-[#2D2D30] rounded-xl text-white focus:outline-none focus:border-[#E07A5F] resize-none leading-relaxed"
            />
          </div>

          {/* Clear history */}
          <div className="pt-3 border-t border-[#2D2D30] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-white block">
                Clear All Conversations
              </span>
              <span className="text-[11px] text-[#787875]">
                Permanently wipes all conversation history from your workspace
              </span>
            </div>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1 text-xs text-[#8E8E8B] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearAllChats();
                    setConfirmClear(false);
                    onClose();
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium"
                >
                  Confirm Wipe
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3A3A3E] hover:border-rose-500/50 hover:text-rose-400 text-[#8E8E8B] rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Account Deletion Flow */}
          {currentUser && (
            <div className="pt-3 border-t border-[#2D2D30] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-rose-400 block">
                  Delete Account ({currentUser.id})
                </span>
                <span className="text-[11px] text-[#787875]">
                  Remove your profile and data permanently from the system
                </span>
              </div>
              {confirmDeleteAccount ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAccount(false)}
                    className="px-2.5 py-1 text-xs text-[#8E8E8B] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium"
                  >
                    Confirm Deletion
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAccount(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2D2D30] bg-[#171719] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-[#8E8E8B] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#D3684B] text-white text-xs font-semibold transition shadow-md"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
