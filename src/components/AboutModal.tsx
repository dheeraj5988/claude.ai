import React from 'react';
import { X, Cpu, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';
import { AuraLogo } from './AuraLogo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#1C1C1A] border border-[#30302E] shadow-2xl p-6 text-[#EDEDEB] space-y-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2B2B28]">
          <div className="flex items-center gap-3">
            <AuraLogo size={32} />
            <div>
              <h2 id="about-dialog-title" className="text-lg font-medium text-white tracking-tight">
                About Aura
              </h2>
              <p className="text-xs text-[#9B9B97]">Unified Multi-Provider AI Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E8E8B] hover:text-white hover:bg-[#282826] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Statement & Transparency */}
        <div className="space-y-4 text-sm text-[#C8C8C4] leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[#242422] border border-[#353532] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#E07A5F] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white text-xs uppercase tracking-wider mb-1">
                Multi-Provider AI Architecture
              </h3>
              <p className="text-xs text-[#AEAEA9]">
                Aura is an independent AI conversational workspace powered by a secure, multi-provider intelligent routing layer behind one unified interface. The application connects to multiple frontier AI providers to optimize performance, depth of reasoning, and resilience.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#E07A5F]" />
              Dual-Engine Routing Architecture
            </h4>
            <p className="text-xs text-[#9E9E99]">
              To deliver optimal coding precision, nuanced reasoning, and high-throughput execution, the backend securely distributes conversational turns across leading frontier models:
            </p>
            <ul className="mt-2.5 space-y-2 text-xs">
              <li className="flex items-center gap-2.5 p-2 rounded-lg bg-[#222220]">
                <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white">Initial Turns (Messages 1 & 2):</span>
                  <span className="text-[#A5A5A0]"> Routed to Anthropic frontier models for nuanced conceptual kickoff, architecture formulation, and design precision.</span>
                </div>
              </li>
              <li className="flex items-center gap-2.5 p-2 rounded-lg bg-[#222220]">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white">Subsequent Turns (Message 3+):</span>
                  <span className="text-[#A5A5A0]"> Transitioned to Google Gemini with complete conversational context preserved for high-speed iterative expansion.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-[#222220] border border-[#2D2D2B] text-xs text-[#9E9E99] space-y-1.5">
            <div className="font-medium text-white">Privacy & Independent Identity Notice</div>
            <p>
              Aura is an independent application and is not affiliated with or endorsed by Anthropic or OpenAI. Model routing occurs strictly on the secure backend server without exposing private user data or API credentials to frontend JavaScript.
            </p>
          </div>

          <div className="pt-2 border-t border-[#2B2B28] flex items-center justify-between text-xs text-[#8E8E8B]">
            <span>Version 2.0.0 (Production)</span>
            <span className="flex items-center gap-1 text-[#E07A5F]">
              <Sparkles className="w-3.5 h-3.5" /> Multi-Provider Architecture
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#D3684B] text-white text-xs font-medium transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
