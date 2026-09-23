import React, { useState } from 'react';
import { useAuth, ADMIN_PASSWORD } from '../context/AuthContext';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onShowToast?: (msg: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onShowToast,
}) => {
  const { login, loginAdmin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setError('Please enter your username/email and password.');
      return;
    }

    // Direct Administrator login shortcut from main screen
    if (
      (cleanId === 'admin' || cleanId === 'dheeraj' || cleanId.includes('admin')) &&
      cleanPass === ADMIN_PASSWORD
    ) {
      loginAdmin(cleanPass);
      window.history.pushState({}, '', '/admin');
      window.dispatchEvent(new Event('popstate'));
      onShowToast?.('Logged in as Administrator');
      return;
    }

    if (login(cleanId, cleanPass)) {
      onShowToast?.(`Welcome back, ${identifier.trim()}!`);
    } else {
      setError('Invalid username or password. Please use credentials set by your administrator.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141413] animate-in fade-in duration-200">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-8 px-4">
        {/* Title & Subtitle matching Screenshot 1 & 2 (NO LOGO in this screen) */}
        <div className="space-y-3">
          <h1 className="font-serif text-4xl sm:text-5xl text-[#EDEDEB] tracking-tight font-normal">
            Question what’s next
          </h1>
          <p className="font-serif text-base sm:text-lg text-[#C4C4C2] font-normal">
            Your thinking partner for big ambitions
          </p>
        </div>

        {/* Card Container matching Screenshot 1 & 2 */}
        <div className="w-full bg-[#1B1B1A] border border-[#2D2D2B] rounded-3xl p-6 sm:p-8 shadow-2xl text-left">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Username / Email */}
            <div>
              <label className="block text-xs font-medium text-[#A0A09D] mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder="Type your username or email"
                className="w-full px-4 py-3 rounded-xl bg-[#242423] border border-[#363634] text-[#EDEDEB] placeholder-[#6E6E6B] text-sm focus:outline-none focus:border-[#52524E] transition"
                required
                autoFocus
              />
            </div>

            {/* Field 2: Password set by admin */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#A0A09D]">
                  Password
                </label>
                <span className="text-[11px] text-[#787875]">
                  Set by admin
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password set by admin"
                className="w-full px-4 py-3 rounded-xl bg-[#242423] border border-[#363634] text-[#EDEDEB] placeholder-[#6E6E6B] text-sm focus:outline-none focus:border-[#52524E] transition font-mono"
                required
              />
            </div>

            {/* Error notice */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button matching Screenshot 1 & 2: Solid White pill button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-[#EAEAEA] text-[#141413] text-sm font-semibold transition cursor-pointer shadow-md text-center block mt-2"
            >
              Continue with credentials
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
