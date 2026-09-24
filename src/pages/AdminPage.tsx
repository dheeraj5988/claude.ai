import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, ADMIN_PASSWORD } from '../context/AuthContext';
import { AVAILABLE_LOGOS, AppLogo } from '../logos';
import { AppLogoIcon } from '../logos/AppLogoIcon';
import {
  Shield,
  UserPlus,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Users,
  Activity,
  Image as ImageIcon,
  Upload,
  ArrowLeft,
  ExternalLink,
  Lock,
  Search,
  Database,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  Sliders,
  CheckCircle
} from 'lucide-react';

interface AdminPageProps {
  onNavigateHome: () => void;
  onShowToast?: (msg: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onNavigateHome,
  onShowToast,
}) => {
  const {
    users,
    currentUser,
    liveUsers,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    addUser,
    deleteUser,
    activeLogo,
    setActiveLogo,
    claudeSettings,
    updateClaudeSettings,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'claude' | 'live' | 'branding' | 'cloud'>('users');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Claude API Key form state
  const [claudeKeyInput, setClaudeKeyInput] = useState(claudeSettings?.apiKey || '');
  const [claudeModelInput, setClaudeModelInput] = useState(claudeSettings?.model || 'claude-3-5-sonnet-20241022');
  const [claudeFirstCountInput, setClaudeFirstCountInput] = useState(claudeSettings?.firstMessagesCount ?? 2);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [claudeSaveSuccess, setClaudeSaveSuccess] = useState('');
  const [testingClaudeKey, setTestingClaudeKey] = useState(false);
  const [claudeTestResult, setClaudeTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync inputs with Firestore real-time updates
  useEffect(() => {
    if (claudeSettings) {
      setClaudeKeyInput(claudeSettings.apiKey || '');
      setClaudeModelInput(claudeSettings.model || 'claude-3-5-sonnet-20241022');
      setClaudeFirstCountInput(claudeSettings.firstMessagesCount ?? 2);
    }
  }, [claudeSettings]);

  // New user form state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPlan, setNewPlan] = useState<'Pro' | 'Free' | 'Max'>('Pro');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Password visibility toggle per user ID
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEnvKey, setCopiedEnvKey] = useState<string | null>(null);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(passwordInput.trim())) {
      setAuthError('');
      setPasswordInput('');
      onShowToast?.('Admin Portal unlocked successfully');
    } else {
      setAuthError('Incorrect master admin password. Please try again.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newId.trim() || !newPassword.trim()) {
      setFormError('User ID and Password are required.');
      return;
    }

    const success = await addUser({
      id: newId.trim(),
      name: newName.trim() || newId.trim(),
      email: newEmail.trim() || `${newId.trim().toLowerCase()}@example.com`,
      password: newPassword.trim(),
      plan: newPlan,
    });

    if (success) {
      setFormSuccess(`User "${newId.trim()}" created and synced to Cloud Firestore!`);
      setNewId('');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      onShowToast?.(`User ${newId.trim()} added successfully`);
    } else {
      setFormError('A user with this ID or Email already exists.');
    }
  };

  const handleSaveClaudeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaudeSaveSuccess('');
    setClaudeTestResult(null);

    const ok = await updateClaudeSettings({
      apiKey: claudeKeyInput.trim(),
      model: claudeModelInput,
      firstMessagesCount: Math.max(1, Number(claudeFirstCountInput) || 2),
      enabled: true,
    });

    if (ok) {
      setClaudeSaveSuccess('Claude API key and handover settings saved & synced to Cloud Firestore!');
      onShowToast?.('Claude API settings saved successfully');
      setTimeout(() => setClaudeSaveSuccess(''), 5000);
    } else {
      onShowToast?.('Failed to save settings to Firestore');
    }
  };

  const handleTestClaudeKey = async () => {
    const keyToTest = claudeKeyInput.trim();
    if (!keyToTest) {
      setClaudeTestResult({
        success: false,
        message: 'Please enter a Claude API key first before testing.',
      });
      return;
    }

    setTestingClaudeKey(true);
    setClaudeTestResult(null);

    try {
      const res = await fetch('/api/test-claude-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keyToTest,
          model: claudeModelInput,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaudeTestResult({
          success: true,
          message: 'Anthropic Claude API Key is valid and active!',
        });
        onShowToast?.('Claude API key verified successfully');
      } else {
        setClaudeTestResult({
          success: false,
          message: data.error || 'Failed to authenticate with Anthropic API. Please check your key.',
        });
      }
    } catch (err: any) {
      setClaudeTestResult({
        success: false,
        message: err.message || 'Connection failed to test Anthropic API.',
      });
    } finally {
      setTestingClaudeKey(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const copyCredentials = (user: typeof users[0]) => {
    const text = `User ID: ${user.id}\nEmail: ${user.email}\nPassword: ${user.password}\nPlan: ${user.plan}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast?.(`Credentials for ${user.id} copied to clipboard`);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEnvKey(keyName);
    setTimeout(() => setCopiedEnvKey(null), 2000);
    onShowToast?.(`Copied ${keyName} to clipboard`);
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const customLogo: AppLogo = {
          id: `custom-logo-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, '') || 'Custom Logo',
          type: 'custom-image',
          color: '#FFFFFF',
          customDataUrl: dataUrl,
        };
        setActiveLogo(customLogo);
        onShowToast?.('Custom logo updated and synced to Firestore');
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      u =>
        u.id.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.plan.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // =========================================================================
  // VIEW 1: FULL SCREEN ADMIN AUTHENTICATION WEBPAGE
  // =========================================================================
  if (!isAdmin) {
    return (
      <div className="min-h-screen w-full bg-[#111110] text-[#EDEDEB] flex flex-col justify-between selection:bg-[#DE7959]/30">
        {/* Navigation Bar */}
        <header className="w-full border-b border-[#232321] px-6 py-4 flex items-center justify-between bg-[#151514]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DE7959]/15 border border-[#DE7959]/30 flex items-center justify-center text-[#DE7959]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-[#EDEDEB]">
                  Claude Administration Portal
                </span>
                <span className="text-[10px] bg-[#291B0B] text-[#D97706] border border-[#52330A] px-2 py-0.5 rounded-full font-mono">
                  /admin
                </span>
              </div>
              <p className="text-[11px] text-[#787875]">Secure Operations Management System</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#20201F] hover:bg-[#2B2B29] text-xs text-[#C4C4C2] hover:text-white border border-[#30302E] transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Claude Chat</span>
          </button>
        </header>

        {/* Center Portal Login Card */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-[#181817] border border-[#2B2B29] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DE7959] to-transparent" />

            <div className="text-center space-y-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#DE7959]/10 border border-[#DE7959]/20 mx-auto flex items-center justify-center text-[#DE7959] shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-normal text-[#EDEDEB]">
                  Administrator Login
                </h1>
                <p className="text-xs text-[#8E8E8B] mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Enter master security credentials to access user accounts, Claude API handover, live sessions, branding, and cloud settings.
                </p>
              </div>
            </div>

            {/* Master Credentials Info Helper */}
            <div className="mb-6 p-4 rounded-2xl bg-[#20201F] border border-[#333330] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8E8E8B]">Master Admin Password:</div>
                <div className="text-sm font-mono text-[#EDEDEB] font-bold tracking-wider mt-0.5">
                  {ADMIN_PASSWORD}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordInput(ADMIN_PASSWORD);
                  setAuthError('');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#2B2B28] hover:bg-[#383834] text-xs text-[#DE7959] border border-[#484843] transition cursor-pointer font-medium"
              >
                Auto-fill
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A0A09D] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Enter master password"
                    className="w-full px-4 py-3 rounded-xl bg-[#20201F] border border-[#353533] text-[#EDEDEB] placeholder-[#6E6E6B] text-sm focus:outline-none focus:border-[#DE7959] transition"
                    autoFocus
                  />
                </div>
                {authError && <p className="text-xs text-rose-400 mt-2">{authError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-[#DE7959] hover:bg-[#C9684A] text-white text-sm font-semibold transition cursor-pointer shadow-lg shadow-[#DE7959]/20"
              >
                Access Admin Dashboard
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="text-xs text-[#787875] hover:text-[#C4C4C2] transition cursor-pointer"
                >
                  ← Go back to user chat page
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-4 px-6 border-t border-[#1F1F1D] text-center text-xs text-[#62625F]">
          Claude Operations Portal · Connected to Firebase Cloud Firestore DB · Version 2.0
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL DEDICATED ADMIN DASHBOARD WEBPAGE
  // =========================================================================
  const isClaudeKeyActive = Boolean(claudeSettings?.apiKey?.trim());

  return (
    <div className="min-h-screen w-full bg-[#111110] text-[#EDEDEB] flex flex-col selection:bg-[#DE7959]/30">
      {/* Top Main Navigation Bar */}
      <header className="w-full border-b border-[#232321] px-6 py-3.5 flex items-center justify-between bg-[#151514] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#DE7959]/15 border border-[#DE7959]/30 flex items-center justify-center text-[#DE7959]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-[#EDEDEB]">
                Claude Operations Console
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Sync
              </span>
            </div>
            <p className="text-[11px] text-[#787875]">Master Admin Control Panel</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#20201F] hover:bg-[#2A2A28] text-xs text-[#C4C4C2] hover:text-white border border-[#30302E] transition cursor-pointer"
            title="Open user chat in a new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Launch Chat App</span>
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#20201F] hover:bg-[#2A2A28] text-xs text-[#EDEDEB] hover:text-white border border-[#353533] transition cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logoutAdmin();
              onShowToast?.('Admin session locked');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition cursor-pointer"
            title="Lock administrator dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Registered Accounts */}
          <div className="p-5 rounded-2xl bg-[#171716] border border-[#272725] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8E8E8B] font-medium">Total Registered Users</div>
              <div className="text-2xl font-bold text-[#EDEDEB] mt-1 font-mono">
                {users.length}
              </div>
              <div className="text-[11px] text-[#787875] mt-1">Stored in Cloud Firestore</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Claude API Handover Status */}
          <div className="p-5 rounded-2xl bg-[#171716] border border-[#272725] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8E8E8B] font-medium">Claude API Handover</div>
              <div className="text-base font-bold mt-1 flex items-center gap-1.5">
                {isClaudeKeyActive ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active (Turns 1-{claudeSettings?.firstMessagesCount ?? 2})
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Gemini Emulation
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#787875] mt-1">
                {isClaudeKeyActive ? 'Turn 3+ switches to Gemini' : 'Setup Claude API key below'}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#DE7959]/15 border border-[#DE7959]/30 text-[#DE7959] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Live Active Users */}
          <div className="p-5 rounded-2xl bg-[#171716] border border-[#272725] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8E8E8B] font-medium">Online Live Sessions</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono flex items-center gap-2">
                {liveUsers.length}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-1">Real-time heartbeat sync</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Database Status */}
          <div className="p-5 rounded-2xl bg-[#171716] border border-[#272725] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8E8E8B] font-medium">Database Status</div>
              <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected</span>
              </div>
              <div className="text-[11px] text-[#787875] mt-1 truncate max-w-[160px]">
                Firebase Firestore
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 border-b border-[#262624] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'bg-[#252523] text-white border border-[#3A3A38]'
                : 'text-[#8E8E8B] hover:text-white hover:bg-[#1A1A19]'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>User Accounts & Passwords ({users.length})</span>
          </button>

          {/* New Claude API Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('claude')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'claude'
                ? 'bg-[#252523] text-white border border-[#3A3A38]'
                : 'text-[#8E8E8B] hover:text-white hover:bg-[#1A1A19]'
            }`}
          >
            <KeyRound className="w-4 h-4 text-[#DE7959]" />
            <span>
              Claude API & Handover {isClaudeKeyActive ? '●' : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'live'
                ? 'bg-[#252523] text-white border border-[#3A3A38]'
                : 'text-[#8E8E8B] hover:text-white hover:bg-[#1A1A19]'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Live Connected Users ({liveUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'branding'
                ? 'bg-[#252523] text-white border border-[#3A3A38]'
                : 'text-[#8E8E8B] hover:text-white hover:bg-[#1A1A19]'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-sky-400" />
            <span>Logos & Brand Identity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'cloud'
                ? 'bg-[#252523] text-white border border-[#3A3A38]'
                : 'text-[#8E8E8B] hover:text-white hover:bg-[#1A1A19]'
            }`}
          >
            <Server className="w-4 h-4 text-[#DE7959]" />
            <span>Vercel & Cloud Setup</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: USERS & PASSWORDS CRUD */}
        {/* ================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Create User Card */}
            <div className="p-6 rounded-3xl bg-[#171716] border border-[#272725] shadow-lg">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#DE7959]/15 text-[#DE7959] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#EDEDEB]">
                    Create New User Account
                  </h2>
                  <p className="text-xs text-[#8E8E8B]">
                    Credentials created here save instantly to Cloud Firestore and work across all devices.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-[#A0A09D] mb-1.5 font-medium">
                      Username / User ID *
                    </label>
                    <input
                      type="text"
                      value={newId}
                      onChange={e => setNewId(e.target.value)}
                      placeholder="e.g. rahul123"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs focus:outline-none focus:border-[#DE7959] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#A0A09D] mb-1.5 font-medium">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs focus:outline-none focus:border-[#DE7959] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#A0A09D] mb-1.5 font-medium">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="e.g. rahul@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs focus:outline-none focus:border-[#DE7959] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#A0A09D] mb-1.5 font-medium">
                      Password Set by Admin *
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="e.g. Rahul@2026"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs font-mono focus:outline-none focus:border-[#DE7959] transition"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[#A0A09D] font-medium">Subscription Plan Tier:</label>
                    <div className="flex items-center gap-2">
                      {(['Pro', 'Max', 'Free'] as const).map(tier => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setNewPlan(tier)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                            newPlan === tier
                              ? 'bg-[#3B82F6] text-white shadow-xs'
                              : 'bg-[#222220] text-[#8E8E8B] hover:text-white border border-[#30302E]'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#DE7959] hover:bg-[#C9684A] text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-[#DE7959]/20 self-end sm:self-auto"
                  >
                    Save & Create Account
                  </button>
                </div>

                {formError && <p className="text-xs text-rose-400 font-medium">{formError}</p>}
                {formSuccess && (
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{formSuccess}</span>
                  </p>
                )}
              </form>
            </div>

            {/* Registered Users Table / List */}
            <div className="p-6 rounded-3xl bg-[#171716] border border-[#272725] shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#EDEDEB]">
                    Registered User Accounts ({users.length})
                  </h3>
                  <p className="text-xs text-[#8E8E8B]">
                    Active user accounts able to log in to the Claude interface.
                  </p>
                </div>

                {/* Search box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#787875] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search users by name, id..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs focus:outline-none focus:border-[#DE7959] transition"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredUsers.map(u => {
                  const isPassVisible = visiblePasswords[u.id] || false;
                  const isCopied = copiedId === u.id;

                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl bg-[#1C1C1B] border border-[#2C2C2A] hover:border-[#383835] flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2A2A28] border border-[#383835] flex items-center justify-center font-bold text-sm text-[#3B82F6] shrink-0">
                          {u.id.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#EDEDEB]">{u.id}</span>
                            <span className="text-xs text-[#8E8E8B]">({u.name})</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#242C3D] text-[#60A5FA] border border-[#3B82F6]/30 font-medium text-[10px]">
                              {u.plan} Plan
                            </span>
                          </div>
                          <div className="text-xs text-[#8E8E8B]">{u.email}</div>
                          <div className="flex items-center gap-2 text-xs text-[#A0A09D]">
                            <span>Password:</span>
                            <span className="font-mono bg-[#161615] px-2.5 py-0.5 rounded-lg text-[#EDEDEB] border border-[#282826]">
                              {isPassVisible ? u.password : '••••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="text-[#8E8E8B] hover:text-white p-1 rounded hover:bg-[#252524] transition cursor-pointer"
                              title={isPassVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isPassVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => copyCredentials(u)}
                          className="px-3 py-1.5 rounded-xl bg-[#252524] hover:bg-[#30302E] text-[#C4C4C2] hover:text-white border border-[#363633] flex items-center gap-1.5 text-xs transition cursor-pointer"
                          title="Copy login details to send to user"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Credentials</span>
                            </>
                          )}
                        </button>

                        {users.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete user "${u.id}"? This will be permanently removed from Cloud Firestore.`)) {
                                deleteUser(u.id);
                                onShowToast?.(`Deleted user account: ${u.id}`);
                              }
                            }}
                            className="p-2 rounded-xl text-[#787875] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                            title="Delete this user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="py-10 text-center text-xs text-[#787875] italic">
                    No users matching &quot;{searchQuery}&quot; found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: CLAUDE API KEY & HANDOVER SETTINGS */}
        {/* ================================================================= */}
        {activeTab === 'claude' && (
          <div className="space-y-6">
            {/* Visual Architecture Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C1C1B] to-[#151514] border border-[#2B2B28] shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2.5 text-[#DE7959] mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Dual-Engine Handover Architecture
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[#EDEDEB]">
                First 2 Messages: Claude API &rarr; Turn 3+: Gemini Engine (Full Memory)
              </h2>
              <p className="text-xs text-[#8E8E8B] mt-1 max-w-3xl leading-relaxed">
                Provide your Anthropic Claude API Key below. When any user begins a chat, their <b>first 2 messages</b> are answered directly by the official Anthropic Claude API. From the <b>3rd message onwards</b>, Gemini takes over seamlessly. Gemini receives the full conversation history (all prior Claude responses) so it continues with complete memory.
                <b> In stealth mode</b>: nothing is shown to the user indicating when Gemini takes over.
              </p>

              {/* Visual Pipeline Flow */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#282826]">
                <div className="p-3.5 rounded-2xl bg-[#222220] border border-[#333330] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#DE7959]">Phase 1: First 2 Turns</span>
                    <span className="text-[10px] bg-[#DE7959]/15 text-[#DE7959] px-2 py-0.5 rounded-full font-mono">
                      Turns 1 - 2
                    </span>
                  </div>
                  <div className="text-xs text-[#EDEDEB] font-medium">Anthropic Claude API</div>
                  <p className="text-[11px] text-[#787875] leading-relaxed">
                    Executed using your configured Claude API Key. Delivers genuine Anthropic reasoning and tone.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#222220] border border-[#333330] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-400">Phase 2: Handover</span>
                    <span className="text-[10px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-mono">
                      Turn 3+
                    </span>
                  </div>
                  <div className="text-xs text-[#EDEDEB] font-medium">Gemini Engine with Full Context</div>
                  <p className="text-[11px] text-[#787875] leading-relaxed">
                    Gemini receives all previous Claude responses in its chat memory, continuing the work seamlessly without token burnout.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#222220] border border-[#333330] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">Phase 3: User View</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                      100% Stealth
                    </span>
                  </div>
                  <div className="text-xs text-[#EDEDEB] font-medium">Unified Claude Interface</div>
                  <p className="text-[11px] text-[#787875] leading-relaxed">
                    No backend engine badges or indicators are ever displayed to the user. To the user, they are chatting with Claude.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Configuration Form Card */}
            <div className="p-6 rounded-3xl bg-[#171716] border border-[#272725] shadow-lg space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#DE7959]/15 text-[#DE7959] flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#EDEDEB]">
                      Anthropic Claude API Credentials
                    </h3>
                    <p className="text-xs text-[#8E8E8B]">
                      Saves securely to Cloud Firestore and activates the first 2 messages handover.
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  {isClaudeKeyActive ? (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Claude API Active
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Key Not Configured
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveClaudeSettings} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Claude API Key Input */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-[#A0A09D] font-medium">
                        Anthropic Claude API Key (<code className="text-[#DE7959]">sk-ant-api...</code>)
                      </label>
                      <span className="text-[11px] text-[#787875]">
                        Get your key from{' '}
                        <a
                          href="https://console.anthropic.com/settings/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#DE7959] hover:underline"
                        >
                          console.anthropic.com
                        </a>
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type={showClaudeKey ? 'text' : 'password'}
                        value={claudeKeyInput}
                        onChange={e => {
                          setClaudeKeyInput(e.target.value);
                          setClaudeTestResult(null);
                        }}
                        placeholder="sk-ant-api03-..."
                        className="w-full pl-4 pr-24 py-2.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs font-mono focus:outline-none focus:border-[#DE7959] transition"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowClaudeKey(!showClaudeKey)}
                          className="p-1 rounded-lg text-[#8E8E8B] hover:text-white hover:bg-[#282826] transition cursor-pointer"
                          title={showClaudeKey ? 'Hide key' : 'Show key'}
                        >
                          {showClaudeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {claudeKeyInput && (
                          <button
                            type="button"
                            onClick={() => setClaudeKeyInput('')}
                            className="px-2 py-0.5 rounded text-[10px] text-[#8E8E8B] hover:text-rose-400 hover:bg-[#282826] transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Claude Model Choice */}
                  <div>
                    <label className="block text-xs text-[#A0A09D] mb-1.5 font-medium">
                      Anthropic Model for Initial Turns
                    </label>
                    <select
                      value={claudeModelInput}
                      onChange={e => setClaudeModelInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] text-xs focus:outline-none focus:border-[#DE7959] transition"
                    >
                      <option value="claude-3-5-sonnet-20241022">
                        claude-3-5-sonnet-20241022 (Recommended Flagship)
                      </option>
                      <option value="claude-3-5-haiku-20241022">
                        claude-3-5-haiku-20241022 (Fastest / Lightweight)
                      </option>
                      <option value="claude-3-opus-20240229">
                        claude-3-opus-20240229 (Opus Deep Reasoning)
                      </option>
                    </select>
                  </div>

                  {/* Initial Messages Threshold */}
                  <div>
                    <label className="block text-xs text-[#A0A09D] mb-1.5 font-medium">
                      Initial Messages Responded by Claude
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={claudeFirstCountInput}
                        onChange={e => setClaudeFirstCountInput(Number(e.target.value))}
                        className="w-24 px-3.5 py-2.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] text-xs font-mono focus:outline-none focus:border-[#DE7959] transition text-center"
                      />
                      <span className="text-xs text-[#8E8E8B]">
                        messages (Default: <b>2</b>). After this count, Gemini continues.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#262624]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestClaudeKey}
                      disabled={testingClaudeKey || !claudeKeyInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#242422] hover:bg-[#2F2F2C] text-[#C4C4C2] hover:text-white border border-[#383835] text-xs font-medium transition cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingClaudeKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#DE7959]" />
                          <span>Testing with Anthropic...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-[#DE7959]" />
                          <span>Test Claude Connection</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#DE7959] hover:bg-[#C9684A] text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-[#DE7959]/20 self-end sm:self-auto"
                  >
                    Save & Sync Claude API Settings
                  </button>
                </div>

                {/* Test Result Feedback */}
                {claudeTestResult && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                      claudeTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                    }`}
                  >
                    {claudeTestResult.success ? (
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    )}
                    <span>{claudeTestResult.message}</span>
                  </div>
                )}

                {/* Save Success Notice */}
                {claudeSaveSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{claudeSaveSuccess}</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: LIVE USERS MONITORING */}
        {/* ================================================================= */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#171716] border border-[#272725] shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-sm font-semibold text-[#EDEDEB]">
                      Live Online Sessions ({liveUsers.length})
                    </h3>
                  </div>
                  <p className="text-xs text-[#8E8E8B] mt-1">
                    Users currently connected to the application with active heartbeats.
                  </p>
                </div>

                <div className="text-xs text-[#8E8E8B] bg-[#1F1F1E] border border-[#30302E] px-3 py-1.5 rounded-xl">
                  Heartbeat interval: 15s
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {liveUsers.length > 0 ? (
                  liveUsers.map(session => (
                    <div
                      key={session.sessionId}
                      className="p-4 rounded-2xl bg-[#1C1C1B] border border-[#2D2D2B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {session.userId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#EDEDEB]">
                              {session.userId}
                            </span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                              Active Now
                            </span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                              {session.plan}
                            </span>
                          </div>
                          <div className="text-xs text-[#8E8E8B] mt-0.5">{session.userEmail}</div>
                        </div>
                      </div>

                      <div className="text-right text-xs text-[#8E8E8B]">
                        <div className="font-mono text-[#EDEDEB]">Session: #{session.sessionId}</div>
                        <div className="text-[11px] text-emerald-400/80 mt-0.5">
                          Last heartbeat: {Math.max(0, Math.round((Date.now() - session.lastActiveAt) / 1000))}s ago
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-[#787875] italic bg-[#151514] rounded-2xl border border-[#222220]">
                    No users are currently logged in. Once users sign in, their real-time session appears here automatically.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: LOGO & BRANDING SELECTION */}
        {/* ================================================================= */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#171716] border border-[#272725] shadow-lg space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[#EDEDEB]">
                  App Logo & Brand Identity
                </h3>
                <p className="text-xs text-[#8E8E8B] mt-1">
                  Choose a logo from the presets below or upload your custom logo file. The selected logo synchronizes instantly across all connected users via Firebase Firestore.
                </p>
              </div>

              {/* Logo Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_LOGOS.map(logo => {
                  const isSelected = activeLogo.id === logo.id;

                  return (
                    <div
                      key={logo.id}
                      onClick={() => {
                        setActiveLogo(logo);
                        onShowToast?.(`Logo changed to "${logo.name}"`);
                      }}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#242422] border-[#DE7959] shadow-md shadow-[#DE7959]/10'
                          : 'bg-[#1C1C1B] border-[#2C2C2A] hover:border-[#40403C]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[#252523] flex items-center justify-center border border-[#353532]">
                          <AppLogoIcon logo={logo} size={28} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#EDEDEB]">{logo.name}</div>
                          <div className="text-xs text-[#8E8E8B] capitalize">{logo.type}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#DE7959] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Upload Custom Logo */}
              <div className="pt-4 border-t border-[#262624]">
                <h4 className="text-xs font-semibold text-[#EDEDEB] mb-2">
                  Upload Custom Image Logo (PNG, SVG, JPG, WebP)
                </h4>
                <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-[#353532] hover:border-[#DE7959] bg-[#1A1A19] hover:bg-[#20201F] transition cursor-pointer text-center group">
                  <div className="w-12 h-12 rounded-2xl bg-[#282826] group-hover:bg-[#DE7959]/10 text-[#8E8E8B] group-hover:text-[#DE7959] flex items-center justify-center mb-3 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-[#EDEDEB]">
                    Click here to upload a custom logo from your computer
                  </span>
                  <span className="text-[11px] text-[#787875] mt-1">
                    Supports high-resolution images, transparent PNGs, or SVGs
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: VERCEL DEPLOYMENT & CLOUD SETTINGS */}
        {/* ================================================================= */}
        {activeTab === 'cloud' && (
          <div className="space-y-6">
            {/* Guide Card */}
            <div className="p-6 rounded-3xl bg-[#171716] border border-[#272725] shadow-lg space-y-5">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Deployment Guide
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#EDEDEB]">
                  How to Make AI Chat, Claude Handover, and Database Work on Vercel
                </h3>
                <p className="text-xs text-[#8E8E8B] mt-1 leading-relaxed">
                  Your project runs a Vercel Serverless Function (<code className="text-[#DE7959]">api/chat.ts</code>) with dual-engine handover support and rewrite routing (<code className="text-[#DE7959]">vercel.json</code>). Add your keys in Vercel to activate live chat worldwide.
                </p>
              </div>

              {/* 3 Step instructions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-[#2A2A28]">
                  <div className="w-7 h-7 rounded-lg bg-[#DE7959]/15 text-[#DE7959] font-bold text-xs flex items-center justify-center mb-2.5">
                    1
                  </div>
                  <div className="text-xs font-semibold text-[#EDEDEB]">Configure API Keys</div>
                  <p className="text-[11px] text-[#8E8E8B] mt-1 leading-relaxed">
                    Set your <b>GEMINI_API_KEY</b> and <b>ANTHROPIC_API_KEY</b> in Vercel environment variables or save Claude key directly in the <b>Claude API</b> tab above.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-[#2A2A28]">
                  <div className="w-7 h-7 rounded-lg bg-[#DE7959]/15 text-[#DE7959] font-bold text-xs flex items-center justify-center mb-2.5">
                    2
                  </div>
                  <div className="text-xs font-semibold text-[#EDEDEB]">Add Variables in Vercel</div>
                  <p className="text-[11px] text-[#8E8E8B] mt-1 leading-relaxed">
                    Go to your Vercel Project &rarr; <b>Settings</b> &rarr; <b>Environment Variables</b> and add the variables listed below.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-[#2A2A28]">
                  <div className="w-7 h-7 rounded-lg bg-[#DE7959]/15 text-[#DE7959] font-bold text-xs flex items-center justify-center mb-2.5">
                    3
                  </div>
                  <div className="text-xs font-semibold text-[#EDEDEB]">Redeploy on Vercel</div>
                  <p className="text-[11px] text-[#8E8E8B] mt-1 leading-relaxed">
                    Go to <b>Deployments</b> &rarr; Click <b>Redeploy</b> (or push any commit to GitHub). Both AI Chat and /admin will work 100%!
                  </p>
                </div>
              </div>

              {/* Copyable Environment Variables Table */}
              <div className="pt-4 border-t border-[#262624] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#EDEDEB]">
                    Vercel Environment Variables
                  </h4>
                  <span className="text-[11px] text-[#8E8E8B]">Click any button to copy</span>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      key: 'ANTHROPIC_API_KEY',
                      desc: 'Official Claude API for first 2 messages of every chat',
                      val: claudeSettings?.apiKey || 'sk-ant-api03-...',
                    },
                    {
                      key: 'GEMINI_API_KEY',
                      desc: 'Powers message 3+ handover responses seamlessly',
                      val: 'Paste your key from aistudio.google.com',
                      isKey: true,
                    },
                    {
                      key: 'VITE_FIREBASE_API_KEY',
                      desc: 'Cloud Firestore database connection',
                      val: 'AIzaSyDuG_MtC3-d16lJs9jAJcawp5GvnzSotSY',
                    },
                    {
                      key: 'VITE_FIREBASE_PROJECT_ID',
                      desc: 'GCP Project ID',
                      val: 'gen-lang-client-0445776809',
                    },
                    {
                      key: 'VITE_FIREBASE_DATABASE_ID',
                      desc: 'Specific Firestore Database ID',
                      val: 'ai-studio-dheerajclaude-6b7597bc-58fe-4ea2-96a3-6437a6ce8032',
                    },
                    {
                      key: 'VITE_FIREBASE_AUTH_DOMAIN',
                      desc: 'Authentication Domain',
                      val: 'gen-lang-client-0445776809.firebaseapp.com',
                    },
                    {
                      key: 'VITE_FIREBASE_STORAGE_BUCKET',
                      desc: 'Storage Bucket',
                      val: 'gen-lang-client-0445776809.firebasestorage.app',
                    },
                    {
                      key: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
                      desc: 'Messaging Sender ID',
                      val: '1048520060844',
                    },
                    {
                      key: 'VITE_FIREBASE_APP_ID',
                      desc: 'Firebase App ID',
                      val: '1:1048520060844:web:3c02ac3a3240330cc65409',
                    },
                  ].map(item => (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-[#1C1C1B] border border-[#2A2A28] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-semibold text-[#EDEDEB]">{item.key}</div>
                        <div className="text-[11px] text-[#787875]">{item.desc}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-[#141413] px-2.5 py-1 rounded text-[#8E8E8B] border border-[#252523] truncate max-w-[220px]">
                          {item.val}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.val, item.key)}
                          className="px-2.5 py-1 rounded-lg bg-[#252524] hover:bg-[#30302E] text-[#C4C4C2] hover:text-white border border-[#353533] flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedEnvKey === item.key ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
