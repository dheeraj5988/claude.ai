import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, ADMIN_PASSWORD, GeminiKeyAccount } from '../context/AuthContext';
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
  CheckCircle,
  Gauge,
  DollarSign,
  Power,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { ClaudeSunburst } from '../components/ClaudeSunburst';

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
    geminiSettings,
    updateGeminiSettings,
    addGeminiKeyAccount,
    removeGeminiKeyAccount,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'telemetry' | 'claude' | 'live' | 'branding' | 'cloud'>('users');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // System stats & telemetry state
  const [systemStats, setSystemStats] = useState<{
    totalRequests: number;
    totalErrors: number;
    rateLimitEvents: number;
    dailyUsageCount: number;
    monthlyUsageCount: number;
    maintenanceMode: boolean;
  }>({
    totalRequests: 0,
    totalErrors: 0,
    rateLimitEvents: 0,
    dailyUsageCount: 0,
    monthlyUsageCount: 0,
    maintenanceMode: false,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setSystemStats(data.stats);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMaintenance = async () => {
    const next = !systemStats.maintenanceMode;
    try {
      await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      setSystemStats(prev => ({ ...prev, maintenanceMode: next }));
      onShowToast?.(next ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
    } catch {
      onShowToast?.('Failed to toggle maintenance mode');
    }
  };

  // Claude API Key form state
  const [claudeKeyInput, setClaudeKeyInput] = useState(claudeSettings?.apiKey || '');
  const [claudeModelInput, setClaudeModelInput] = useState(claudeSettings?.model || 'claude-3-5-sonnet-20241022');
  const [claudeFirstCountInput, setClaudeFirstCountInput] = useState(claudeSettings?.firstMessagesCount ?? 2);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [claudeSaveSuccess, setClaudeSaveSuccess] = useState('');
  const [testingClaudeKey, setTestingClaudeKey] = useState(false);
  const [claudeTestResult, setClaudeTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Gemini API Key & Multi-Account Pool state
  const [geminiKeyInput, setGeminiKeyInput] = useState(geminiSettings?.apiKey || '');
  const [geminiModelInput, setGeminiModelInput] = useState(geminiSettings?.model || 'gemini-2.5-flash');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiSaveSuccess, setGeminiSaveSuccess] = useState('');
  const [testingGeminiKey, setTestingGeminiKey] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Pool form state
  const [newGeminiAccountName, setNewGeminiAccountName] = useState('');
  const [newGeminiAccountKey, setNewGeminiAccountKey] = useState('');
  const [showNewGeminiKey, setShowNewGeminiKey] = useState(false);
  const [testingPoolKeyId, setTestingPoolKeyId] = useState<string | null>(null);
  const [poolKeyTestResults, setPoolKeyTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Sync inputs with Firestore real-time updates
  useEffect(() => {
    if (claudeSettings) {
      setClaudeKeyInput(claudeSettings.apiKey || '');
      setClaudeModelInput(claudeSettings.model || 'claude-3-5-sonnet-20241022');
      setClaudeFirstCountInput(claudeSettings.firstMessagesCount ?? 2);
    }
  }, [claudeSettings]);

  useEffect(() => {
    if (geminiSettings) {
      setGeminiKeyInput(geminiSettings.apiKey || '');
      setGeminiModelInput(geminiSettings.model || 'gemini-2.5-flash');
    }
  }, [geminiSettings]);

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

    fetch('/api/admin/claude-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: claudeKeyInput.trim(),
        model: claudeModelInput,
        firstMessagesCount: Math.max(1, Number(claudeFirstCountInput) || 2),
      }),
    }).catch(() => {});

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

  const handleSaveGeminiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiSaveSuccess('');
    setGeminiTestResult(null);

    const ok = await updateGeminiSettings({
      apiKey: geminiKeyInput.trim(),
      model: geminiModelInput,
      enabled: true,
    });

    fetch('/api/admin/gemini-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: geminiKeyInput.trim(),
        apiKeys: geminiSettings.apiKeys.map(k => k.apiKey),
        model: geminiModelInput,
      }),
    }).catch(() => {});

    if (ok) {
      setGeminiSaveSuccess('Gemini API settings and multi-key pool saved & synced to Cloud Firestore!');
      onShowToast?.('Gemini API settings saved successfully');
      setTimeout(() => setGeminiSaveSuccess(''), 5000);
    } else {
      onShowToast?.('Failed to save Gemini settings to Firestore');
    }
  };

  const handleTestGeminiKey = async (overrideKey?: string) => {
    const keyToTest = (overrideKey || geminiKeyInput).trim();
    if (!keyToTest) {
      setGeminiTestResult({
        success: false,
        message: 'Please enter a Gemini API key first before testing.',
      });
      return;
    }

    setTestingGeminiKey(true);
    setGeminiTestResult(null);

    try {
      const res = await fetch('/api/test-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeminiTestResult({
          success: true,
          message: 'Google Gemini API Key is valid and connected!',
        });
        onShowToast?.('Gemini API key verified successfully');
      } else {
        setGeminiTestResult({
          success: false,
          message: data.error || 'Failed to authenticate with Google Gemini API. Please check the key.',
        });
      }
    } catch (err: any) {
      setGeminiTestResult({
        success: false,
        message: err.message || 'Connection failed to test Gemini API.',
      });
    } finally {
      setTestingGeminiKey(false);
    }
  };

  const handleAddGeminiAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGeminiAccountKey.trim()) return;

    const ok = await addGeminiKeyAccount(newGeminiAccountName.trim(), newGeminiAccountKey.trim());
    if (ok) {
      setNewGeminiAccountName('');
      setNewGeminiAccountKey('');
      onShowToast?.('New Gemini key account added to pool');
    } else {
      onShowToast?.('Failed to add Gemini account to pool');
    }
  };

  const handleTestPoolKey = async (account: GeminiKeyAccount) => {
    setTestingPoolKeyId(account.id);
    try {
      const res = await fetch('/api/test-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: account.apiKey }),
      });
      const data = await res.json();
      setPoolKeyTestResults(prev => ({
        ...prev,
        [account.id]: {
          success: Boolean(res.ok && data.success),
          message: res.ok && data.success ? 'Active & Valid' : (data.error || 'Connection Failed'),
        },
      }));
    } catch (err: any) {
      setPoolKeyTestResults(prev => ({
        ...prev,
        [account.id]: {
          success: false,
          message: err.message || 'Connection failed',
        },
      }));
    } finally {
      setTestingPoolKeyId(null);
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
          <ClaudeSunburst size={28} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-[#EDEDEB]">
                Claude Administrator Console
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Sync
              </span>
            </div>
            <p className="text-[11px] text-[#787875]">Multi-Provider & Cost Control Dashboard</p>
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

          {/* Usage & Cost Telemetry Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'telemetry'
                ? 'bg-[#252523] text-white border border-[#3A3A38]'
                : 'text-[#8E8E8B] hover:text-white hover:bg-[#1A1A19]'
            }`}
          >
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>Usage & Cost Safeguards</span>
          </button>

          {/* Claude API Tab */}
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
              AI Providers & Keys (Claude + Gemini Pool) {isClaudeKeyActive ? '●' : ''}
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
        {/* TAB: USAGE, LIMITS & COST SAFEGUARDS */}
        {/* ================================================================= */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            {/* System Status & Maintenance Toggle */}
            <div className="p-6 rounded-3xl bg-[#171716] border border-[#272725] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    systemStats.maintenanceMode
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#EDEDEB] flex items-center gap-2">
                    Application Status:
                    <span className={systemStats.maintenanceMode ? 'text-amber-400' : 'text-emerald-400'}>
                      {systemStats.maintenanceMode ? 'Maintenance Mode Active' : 'All Systems Operational'}
                    </span>
                  </h3>
                  <p className="text-xs text-[#8E8E8B]">
                    {systemStats.maintenanceMode
                      ? 'Chat generation is temporarily paused for regular users while maintenance is ongoing.'
                      : 'Chat routing and streaming endpoints are active with strict rate limiting enabled.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleMaintenance}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                  systemStats.maintenanceMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{systemStats.maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}</span>
              </button>
            </div>

            {/* Usage Telemetry Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#171716] border border-[#272725]">
                <div className="text-xs text-[#8E8E8B]">Daily Message Count</div>
                <div className="text-2xl font-bold text-white mt-1 font-mono">{systemStats.dailyUsageCount}</div>
                <div className="text-[11px] text-[#787875] mt-1">Daily Cap: 50 / user</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#171716] border border-[#272725]">
                <div className="text-xs text-[#8E8E8B]">Monthly Message Count</div>
                <div className="text-2xl font-bold text-white mt-1 font-mono">{systemStats.monthlyUsageCount}</div>
                <div className="text-[11px] text-[#787875] mt-1">Monthly Cap: 1,000 / user</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#171716] border border-[#272725]">
                <div className="text-xs text-[#8E8E8B]">Rate-Limit Events</div>
                <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{systemStats.rateLimitEvents}</div>
                <div className="text-[11px] text-[#787875] mt-1">Intercepted & throttled</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#171716] border border-[#272725]">
                <div className="text-xs text-[#8E8E8B]">Approximate API Cost</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                  ${(systemStats.totalRequests * 0.0028).toFixed(3)}
                </div>
                <div className="text-[11px] text-[#787875] mt-1">Based on token usage metrics</div>
              </div>
            </div>

            {/* Configured Limits Table */}
            <div className="p-6 rounded-3xl bg-[#171716] border border-[#272725] shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#E07A5F]" />
                <h3 className="text-sm font-semibold text-[#EDEDEB]">Enforced Cost & Abuse Safeguards</h3>
              </div>
              <p className="text-xs text-[#8E8E8B]">
                These rules are validated server-side in <code>server/limits.ts</code> to prevent runaway token expenditure.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#1E1E1D] border border-[#2E2E2C] flex items-center justify-between text-xs">
                  <span className="text-[#C4C4C2]">Daily Message Limit</span>
                  <span className="font-mono text-emerald-400 font-semibold">50 messages / day</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#1E1E1D] border border-[#2E2E2C] flex items-center justify-between text-xs">
                  <span className="text-[#C4C4C2]">Monthly Message Limit</span>
                  <span className="font-mono text-emerald-400 font-semibold">1,000 messages / month</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#1E1E1D] border border-[#2E2E2C] flex items-center justify-between text-xs">
                  <span className="text-[#C4C4C2]">Maximum Message Characters</span>
                  <span className="font-mono text-amber-400 font-semibold">20,000 characters</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#1E1E1D] border border-[#2E2E2C] flex items-center justify-between text-xs">
                  <span className="text-[#C4C4C2]">Maximum Conversation Context</span>
                  <span className="font-mono text-amber-400 font-semibold">40 messages</span>
                </div>
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

            {/* ============================================================= */}
            {/* GOOGLE GEMINI ENGINE & MULTI-ACCOUNT KEYS POOL */}
            {/* ============================================================= */}
            <div className="p-6 rounded-3xl bg-[#171716] border border-[#272725] shadow-lg space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#EDEDEB] flex items-center gap-2">
                      <span>Google Gemini Engine & Multi-Account Keys Pool</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        Turns 3+ Engine
                      </span>
                    </h3>
                    <p className="text-xs text-[#8E8E8B]">
                      Powers every turn after Claude completes turns 1 & 2. Gemini receives full conversational memory from prior Claude turns.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {(geminiSettings?.apiKeys?.length || 0) + (geminiKeyInput ? 1 : 0)} Key(s) in Pool
                  </span>
                </div>
              </div>

              {/* Primary Gemini Form */}
              <form onSubmit={handleSaveGeminiSettings} className="space-y-4 pt-1 border-t border-[#262624]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Key */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-[#A0A09D] font-medium">
                        Primary Gemini API Key (<code className="text-blue-400">AIzaSy...</code>)
                      </label>
                      <span className="text-[11px] text-[#787875]">
                        Free keys from{' '}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          aistudio.google.com
                        </a>
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type={showGeminiKey ? 'text' : 'password'}
                        value={geminiKeyInput}
                        onChange={e => {
                          setGeminiKeyInput(e.target.value);
                          setGeminiTestResult(null);
                        }}
                        placeholder="AIzaSy..."
                        className="w-full pl-4 pr-24 py-2.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey(!showGeminiKey)}
                          className="p-1 rounded-lg text-[#8E8E8B] hover:text-white hover:bg-[#282826] transition cursor-pointer"
                          title={showGeminiKey ? 'Hide key' : 'Show key'}
                        >
                          {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {geminiKeyInput && (
                          <button
                            type="button"
                            onClick={() => setGeminiKeyInput('')}
                            className="px-2 py-0.5 rounded text-[10px] text-[#8E8E8B] hover:text-rose-400 hover:bg-[#282826] transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gemini Model */}
                  <div>
                    <label className="block text-xs text-[#A0A09D] mb-1.5 font-medium">
                      Gemini Backend Model
                    </label>
                    <select
                      value={geminiModelInput}
                      onChange={e => setGeminiModelInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1F1F1E] border border-[#333330] text-[#EDEDEB] text-xs focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended Flagship - High Speed & Low Cost)</option>
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Latest Generation High Throughput)</option>
                      <option value="gemini-flash-latest">gemini-flash-latest (Auto-tracked Flash Candidate)</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Lightweight / Free Quota Saver)</option>
                    </select>
                  </div>

                  {/* Role Note */}
                  <div className="flex flex-col justify-end">
                    <p className="text-[11px] text-[#8E8E8B] bg-[#1E1E1D] p-2.5 rounded-xl border border-[#2E2E2C] leading-relaxed">
                      💡 <b>Stealth & Memory Continuity</b>: The user interface always displays the user’s selected Claude model (Sonnet, Opus, etc.). Behind the scenes, Gemini carries over the prior Claude conversation turns seamlessly.
                    </p>
                  </div>
                </div>

                {/* Primary Key Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#262624]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestGeminiKey()}
                      disabled={testingGeminiKey || !geminiKeyInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#242422] hover:bg-[#2F2F2C] text-[#C4C4C2] hover:text-white border border-[#383835] text-xs font-medium transition cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingGeminiKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          <span>Testing Gemini Connection...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-blue-400" />
                          <span>Test Primary Gemini Connection</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-blue-500/20 self-end sm:self-auto"
                  >
                    Save & Sync Gemini Settings
                  </button>
                </div>

                {/* Test Feedback */}
                {geminiTestResult && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                      geminiTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                    }`}
                  >
                    {geminiTestResult.success ? (
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    )}
                    <span>{geminiTestResult.message}</span>
                  </div>
                )}

                {geminiSaveSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{geminiSaveSuccess}</span>
                  </div>
                )}
              </form>

              {/* MULTI-ACCOUNT GEMINI KEYS POOL SECTION */}
              <div className="pt-4 border-t border-[#262624] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-[#EDEDEB] uppercase tracking-wider flex items-center gap-2">
                      <span>Multi-Account Gemini Keys Pool (Failover & Free Quota Multiplier)</span>
                    </h4>
                    <p className="text-[11px] text-[#8E8E8B] mt-0.5">
                      Add multiple free Gemini API keys from different Google accounts. If one key hits its minute or daily rate limit, the backend rotates automatically to the next key without failing the user.
                    </p>
                  </div>
                </div>

                {/* Add Key Form */}
                <form
                  onSubmit={handleAddGeminiAccount}
                  className="p-4 rounded-2xl bg-[#1C1C1A] border border-[#2E2E2C] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-[#A0A09D] mb-1 font-medium">
                      Account / Label Name
                    </label>
                    <input
                      type="text"
                      value={newGeminiAccountName}
                      onChange={e => setNewGeminiAccountName(e.target.value)}
                      placeholder="e.g. Account 2 (Personal), Work Tier"
                      className="w-full px-3 py-2 rounded-xl bg-[#242422] border border-[#383835] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[11px] text-[#A0A09D] mb-1 font-medium">
                      Gemini API Key (<code className="text-blue-400">AIzaSy...</code>) *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewGeminiKey ? 'text' : 'password'}
                        value={newGeminiAccountKey}
                        onChange={e => setNewGeminiAccountKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full pl-3 pr-10 py-2 rounded-xl bg-[#242422] border border-[#383835] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewGeminiKey(!showNewGeminiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E8E8B] hover:text-white"
                      >
                        {showNewGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={!newGeminiAccountKey.trim()}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Pool</span>
                    </button>
                  </div>
                </form>

                {/* Pool Keys Table */}
                {(geminiSettings?.apiKeys || []).length > 0 ? (
                  <div className="rounded-2xl border border-[#2E2E2C] overflow-hidden bg-[#1B1B1A]">
                    <div className="divide-y divide-[#282826]">
                      {geminiSettings.apiKeys.map((acc, idx) => {
                        const masked = acc.apiKey.length > 10
                          ? `${acc.apiKey.slice(0, 7)}...${acc.apiKey.slice(-4)}`
                          : '••••••••••••';
                        const testState = poolKeyTestResults[acc.id];
                        const isTestingThis = testingPoolKeyId === acc.id;

                        return (
                          <div
                            key={acc.id}
                            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#20201E] transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-[#262624] text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-[#333330]">
                                #{idx + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-[#EDEDEB] flex items-center gap-2">
                                  <span>{acc.name}</span>
                                  <span className="font-mono text-[11px] text-[#8E8E8B] bg-[#242422] px-2 py-0.5 rounded-md border border-[#30302E]">
                                    {masked}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#6E6E6B] mt-0.5">
                                  Added on {new Date(acc.addedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {testState && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                                    testState.success
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {testState.message}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleTestPoolKey(acc)}
                                disabled={isTestingThis}
                                className="px-2.5 py-1 rounded-lg bg-[#252524] hover:bg-[#2E2E2C] text-[#C4C4C2] hover:text-white border border-[#383835] text-[11px] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {isTestingThis ? (
                                  <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                                ) : (
                                  <Zap className="w-3 h-3 text-blue-400" />
                                )}
                                <span>Test Key</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => removeGeminiKeyAccount(acc.id)}
                                className="p-1.5 rounded-lg text-[#8E8E8B] hover:text-rose-400 hover:bg-[#2C2222] transition cursor-pointer"
                                title="Remove key from pool"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#1A1A19] border border-dashed border-[#30302E] text-center text-xs text-[#787875]">
                    No additional Gemini keys in the pool yet. Add extra free Gemini API keys above to ensure zero downtime when the primary key reaches its quota.
                  </div>
                )}
              </div>
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
