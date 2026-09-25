import React, { useState } from 'react';
import { useAuth, ADMIN_PASSWORD } from '../context/AuthContext';
import { ArrowRight, AlertCircle, CheckCircle2, User, Mail, Lock } from 'lucide-react';
import { AuraLogo } from './AuraLogo';

interface LoginModalProps {
  isOpen: boolean;
  onShowToast?: (msg: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onShowToast,
}) => {
  const { login, register, resetPassword, loginAdmin } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signin') {
      const cleanId = identifier.trim().toLowerCase();
      const cleanPass = password.trim();

      if (!cleanId || !cleanPass) {
        setError('Please enter your username/email and password.');
        return;
      }

      // Direct admin login shortcut
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

      const res = login(cleanId, cleanPass);
      if (res.success) {
        onShowToast?.(`Welcome back, ${identifier.trim()}!`);
      } else {
        setError(res.error || 'Invalid credentials.');
      }
    } else if (mode === 'signup') {
      if (!identifier.trim() || !email.trim() || !password.trim()) {
        setError('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await register(
          identifier.trim(),
          name.trim() || identifier.trim(),
          email.trim(),
          password.trim()
        );
        if (res.success) {
          onShowToast?.(`Account created successfully! Welcome, ${name || identifier}.`);
        } else {
          setError(res.error || 'Registration failed.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during registration.');
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'reset') {
      if (!identifier.trim() || !password.trim()) {
        setError('Username/email and new password are required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await resetPassword(identifier.trim(), password.trim());
        if (res.success) {
          setSuccess('Password updated successfully! You can now sign in.');
          setMode('signin');
          onShowToast?.('Password updated successfully.');
        } else {
          setError(res.error || 'Password reset failed.');
        }
      } catch (err: any) {
        setError(err.message || 'Error resetting password.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141413] animate-in fade-in duration-200">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-6 px-4">
        {/* Aura Brand Emblem & Title */}
        <div className="flex flex-col items-center space-y-3">
          <AuraLogo size={48} />
          <div>
            <h1 className="text-3xl font-medium text-[#EDEDEB] tracking-tight font-sans">
              Welcome to Aura
            </h1>
            <p className="text-sm text-[#A0A09D] font-normal mt-1">
              Unified multi-provider AI workspace
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="w-full bg-[#1B1B1A] border border-[#2D2D2B] rounded-3xl p-6 sm:p-8 shadow-2xl text-left">
          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-[#242423] p-1 mb-6 border border-[#333331]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                mode === 'signin' ? 'bg-[#31312F] text-white shadow-xs' : 'text-[#8E8E8B] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                mode === 'signup' ? 'bg-[#31312F] text-white shadow-xs' : 'text-[#8E8E8B] hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                mode === 'reset' ? 'bg-[#31312F] text-white shadow-xs' : 'text-[#8E8E8B] hover:text-white'
              }`}
            >
              Reset Key
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Username / ID */}
            <div>
              <label className="block text-xs font-medium text-[#A0A09D] mb-1.5">
                {mode === 'signup' ? 'Choose Username' : 'Username or Email'}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder={mode === 'signup' ? 'e.g. AlexMorgan' : 'Type username or email'}
                className="w-full px-4 py-2.5 rounded-xl bg-[#242423] border border-[#363634] text-[#EDEDEB] placeholder-[#6E6E6B] text-sm focus:outline-none focus:border-[#E07A5F] transition"
                required
                autoFocus
              />
            </div>

            {/* Signup extra fields */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#A0A09D] mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#242423] border border-[#363634] text-[#EDEDEB] placeholder-[#6E6E6B] text-sm focus:outline-none focus:border-[#E07A5F] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A0A09D] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#242423] border border-[#363634] text-[#EDEDEB] placeholder-[#6E6E6B] text-sm focus:outline-none focus:border-[#E07A5F] transition"
                    required
                  />
                </div>
              </>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-[#A0A09D] mb-1.5">
                {mode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                className="w-full px-4 py-2.5 rounded-xl bg-[#242423] border border-[#363634] text-[#EDEDEB] placeholder-[#6E6E6B] text-sm focus:outline-none focus:border-[#E07A5F] transition font-mono"
                required
              />
            </div>

            {/* Confirm Password (for signup and reset) */}
            {(mode === 'signup' || mode === 'reset') && (
              <div>
                <label className="block text-xs font-medium text-[#A0A09D] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#242423] border border-[#363634] text-[#EDEDEB] placeholder-[#6E6E6B] text-sm focus:outline-none focus:border-[#E07A5F] transition font-mono"
                  required
                />
              </div>
            )}

            {/* Success notice */}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Error notice */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#E07A5F] hover:bg-[#D3684B] text-white text-sm font-semibold transition cursor-pointer shadow-md text-center block mt-3 disabled:opacity-50"
            >
              {submitting
                ? 'Processing...'
                : mode === 'signin'
                ? 'Sign In to Aura'
                : mode === 'signup'
                ? 'Create Aura Account'
                : 'Update Password'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/admin');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="text-[11px] text-[#787875] hover:text-[#E07A5F] transition cursor-pointer"
              >
                Go to Administrator Portal (/admin) →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
