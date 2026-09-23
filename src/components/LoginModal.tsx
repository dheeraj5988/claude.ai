import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClaudeSunburst } from './ClaudeSunburst';
import { Shield, KeyRound, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenAdmin: () => void;
  onShowToast?: (msg: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onOpenAdmin,
  onShowToast,
}) => {
  const { login, users } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your User ID/Email and password');
      return;
    }

    if (login(identifier, password)) {
      onShowToast?.(`Welcome back, ${identifier}!`);
    } else {
      setError('Invalid User ID or Password. Please check with your administrator.');
    }
  };

  const handleQuickLogin = (u: typeof users[0]) => {
    if (login(u.id, u.password)) {
      onShowToast?.(`Logged in as ${u.name}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1C1C1B] border border-[#343432] rounded-3xl shadow-2xl p-6 sm:p-8 text-left space-y-6">
        {/* Header with Claude Sunburst */}
        <div className="flex flex-col items-center text-center space-y-3">
          <ClaudeSunburst size={36} />
          <div>
            <h2 className="font-serif text-2xl font-normal text-[#EDEDEB] tracking-tight">
              Sign in to Claude
            </h2>
            <p className="text-xs text-[#8E8E8B] mt-1">
              Enter the credentials assigned by your administrator
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#C4C4C2] mb-1.5">
              User ID or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => {
                setIdentifier(e.target.value);
                setError('');
              }}
              placeholder="e.g. Aashish09 or ankitasharma19890507@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#242423] border border-[#3A3A38] text-sm text-[#EDEDEB] placeholder-[#6E6E6B] focus:outline-none focus:border-[#DE7959] transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#C4C4C2] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#242423] border border-[#3A3A38] text-sm text-[#EDEDEB] placeholder-[#6E6E6B] focus:outline-none focus:border-[#DE7959] transition"
              required
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#DE7959] hover:bg-[#C9684A] text-white text-sm font-medium transition cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Login Helper if available */}
        {users.length > 0 && (
          <div className="pt-2 border-t border-[#2B2B2A]">
            <p className="text-[11px] text-[#787875] mb-2 text-center">
              Available accounts:
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="px-2.5 py-1 rounded-lg bg-[#252524] hover:bg-[#2F2F2D] text-xs text-[#C4C4C2] border border-[#383836] transition cursor-pointer"
                >
                  {u.id} ({u.plan})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Admin Portal Link */}
        <div className="pt-2 border-t border-[#2B2B2A] flex items-center justify-between text-xs text-[#8E8E8B]">
          <span className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#787875]" />
            <span>Administrator access</span>
          </span>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="text-[#DE7959] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
