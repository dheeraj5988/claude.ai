import React from 'react';
import { X, Users, Sparkles } from 'lucide-react';

interface CoworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoworkModal: React.FC<CoworkModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#1F1F1E] border border-[#363634] rounded-2xl w-full max-w-sm shadow-2xl p-5 text-center relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-[#8E8E8B] hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6" />
        </div>

        <h3 className="font-semibold text-base text-[#E6E6E3] mb-1.5 flex items-center justify-center gap-1.5">
          <span>Cowork Mode</span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
            Upcoming
          </span>
        </h3>

        <p className="text-xs text-[#9E9E9C] leading-relaxed mb-5">
          This feature is not available here now. Stay tuned for real-time collaborative pairing, shared workspace canvases, and multi-agent assistance!
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-[#2E2E2D] hover:bg-[#383837] active:scale-98 text-sm font-medium text-[#E6E6E3] transition border border-[#3A3A38]"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
