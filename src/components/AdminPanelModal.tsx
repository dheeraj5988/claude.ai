import React, { useState } from 'react';
import { useAuth, ADMIN_PASSWORD } from '../context/AuthContext';
import { AVAILABLE_LOGOS, AppLogo } from '../logos';
import { AppLogoIcon } from '../logos/AppLogoIcon';
import {
  Shield,
  X,
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
  Radio
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const {
    users,
    currentUser,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    addUser,
    deleteUser,
    activeLogo,
    setActiveLogo
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'live' | 'branding'>('users');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

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

  if (!isOpen) return null;

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(passwordInput.trim())) {
      setAuthError('');
      setPasswordInput('');
      onShowToast?.('Admin panel unlocked successfully');
    } else {
      setAuthError('Incorrect admin password. Please try again.');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newId.trim() || !newPassword.trim()) {
      setFormError('User ID and Password are required.');
      return;
    }

    const success = addUser({
      id: newId.trim(),
      name: newName.trim() || newId.trim(),
      email: newEmail.trim() || `${newId.trim().toLowerCase()}@example.com`,
      password: newPassword.trim(),
      plan: newPlan,
    });

    if (success) {
      setFormSuccess(`User "${newId.trim()}" created successfully!`);
      setNewId('');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      onShowToast?.(`User ${newId.trim()} added successfully`);
    } else {
      setFormError('A user with this ID or Email already exists.');
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
        onShowToast?.('Custom logo updated successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#1C1C1B] border border-[#343432] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2B2B2A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DE7959]/10 text-[#DE7959] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-[#EDEDEB]">Admin Control Panel</h2>
                <span className="text-[10px] bg-[#291B0B] text-[#D97706] border border-[#52330A] px-2 py-0.5 rounded-full font-mono">
                  /admin
                </span>
              </div>
              <p className="text-xs text-[#8E8E8B]">Manage user credentials, live users, and logos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={logoutAdmin}
                className="text-xs text-[#8E8E8B] hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-[#282827] transition"
              >
                Lock Admin
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#8E8E8B] hover:text-white hover:bg-[#282827] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!isAdmin ? (
            /* Admin Password Prompt */
            <form onSubmit={handleAdminAuth} className="max-w-md mx-auto py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#DE7959]/10 border border-[#DE7959]/20 mx-auto flex items-center justify-center text-[#DE7959]">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#EDEDEB]">Admin Authentication</h3>
                <p className="text-xs text-[#8E8E8B] mt-1">
                  Access protected: enter the master administrator password to manage user accounts, live sessions, and branding.
                </p>
              </div>

              {/* Master Credential Info Badge so the admin always knows their password */}
              <div className="p-3.5 rounded-2xl bg-[#252524] border border-[#3A3A38] text-left flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#A0A09D]">Admin Master Password:</div>
                  <div className="text-sm font-mono text-[#EDEDEB] font-semibold tracking-wider">
                    {ADMIN_PASSWORD}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordInput(ADMIN_PASSWORD);
                    setAuthError('');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#323230] hover:bg-[#3D3D3A] text-xs text-[#DE7959] border border-[#484845] transition cursor-pointer font-medium"
                >
                  Auto-fill Password
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Master Admin Password"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#242423] border border-[#3A3A38] text-[#EDEDEB] placeholder-[#6E6E6B] text-sm focus:outline-none focus:border-[#DE7959] transition"
                  autoFocus
                />
                {authError && <p className="text-xs text-rose-400">{authError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#DE7959] hover:bg-[#C9684A] text-white text-sm font-medium transition cursor-pointer shadow-md"
              >
                Unlock Admin Dashboard
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#8E8E8B] hover:text-[#EDEDEB] transition cursor-pointer pt-2 block mx-auto"
              >
                Return to Claude Chat
              </button>
            </form>
          ) : (
            /* Admin Unlocked - Tabs & Controls */
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-[#2C2C2A] pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-[#2E2E2D] text-white'
                      : 'text-[#8E8E8B] hover:text-white hover:bg-[#252524]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Users & Passwords ({users.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('live')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'live'
                      ? 'bg-[#2E2E2D] text-white'
                      : 'text-[#8E8E8B] hover:text-white hover:bg-[#252524]'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Users (1 Online)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('branding')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTab === 'branding'
                      ? 'bg-[#2E2E2D] text-white'
                      : 'text-[#8E8E8B] hover:text-white hover:bg-[#252524]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Logo & Branding</span>
                </button>
              </div>

              {/* TAB 1: USERS & PASSWORDS */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  {/* Create New User */}
                  <div className="p-4 rounded-2xl bg-[#222221] border border-[#343432]">
                    <div className="flex items-center gap-2 mb-3">
                      <UserPlus className="w-4 h-4 text-[#DE7959]" />
                      <h3 className="text-sm font-medium text-[#EDEDEB]">Create User ID & Password</h3>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-[#A0A09D] mb-1 font-medium">
                            User ID (Username) *
                          </label>
                          <input
                            type="text"
                            value={newId}
                            onChange={e => setNewId(e.target.value)}
                            placeholder="e.g. rahul123"
                            className="w-full px-3 py-2 rounded-xl bg-[#1C1C1B] border border-[#383836] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs focus:outline-none focus:border-[#DE7959]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-[#A0A09D] mb-1 font-medium">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full px-3 py-2 rounded-xl bg-[#1C1C1B] border border-[#383836] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs focus:outline-none focus:border-[#DE7959]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-[#A0A09D] mb-1 font-medium">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            placeholder="e.g. rahul@example.com"
                            className="w-full px-3 py-2 rounded-xl bg-[#1C1C1B] border border-[#383836] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs focus:outline-none focus:border-[#DE7959]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-[#A0A09D] mb-1 font-medium">
                            Password Set by Admin *
                          </label>
                          <input
                            type="text"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="e.g. Rahul@2026"
                            className="w-full px-3 py-2 rounded-xl bg-[#1C1C1B] border border-[#383836] text-[#EDEDEB] placeholder-[#6E6E6B] text-xs font-mono focus:outline-none focus:border-[#DE7959]"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-[#A0A09D]">Plan:</label>
                          <select
                            value={newPlan}
                            onChange={e => setNewPlan(e.target.value as any)}
                            className="px-2.5 py-1 rounded-lg bg-[#1C1C1B] border border-[#383836] text-[#EDEDEB] text-xs focus:outline-none focus:border-[#DE7959]"
                          >
                            <option value="Pro">Pro</option>
                            <option value="Max">Max</option>
                            <option value="Free">Free</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-[#DE7959] hover:bg-[#C9684A] text-white text-xs font-medium transition cursor-pointer shadow-xs"
                        >
                          Save & Add User
                        </button>
                      </div>

                      {formError && <p className="text-xs text-rose-400">{formError}</p>}
                      {formSuccess && <p className="text-xs text-emerald-400">{formSuccess}</p>}
                    </form>
                  </div>

                  {/* Registered Users List */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-[#A0A09D]">
                      Registered User Accounts ({users.length})
                    </h3>

                    {users.map(u => {
                      const isPassVisible = visiblePasswords[u.id] || false;
                      const isCopied = copiedId === u.id;

                      return (
                        <div
                          key={u.id}
                          className="p-3 rounded-2xl bg-[#222221] border border-[#323230] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[#EDEDEB]">{u.id}</span>
                              <span className="text-[#8E8E8B]">({u.name})</span>
                              <span className="px-1.5 py-0.5 rounded bg-[#2D2D2C] text-[#3B82F6] font-medium text-[10px]">
                                {u.plan}
                              </span>
                            </div>
                            <div className="text-[#8E8E8B]">{u.email}</div>
                            <div className="flex items-center gap-2 text-[#A0A09D]">
                              <span>Password:</span>
                              <span className="font-mono bg-[#1C1C1B] px-2 py-0.5 rounded text-[#EDEDEB]">
                                {isPassVisible ? u.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="text-[#8E8E8B] hover:text-white"
                                title={isPassVisible ? 'Hide' : 'Reveal'}
                              >
                                {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => copyCredentials(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#2A2A29] hover:bg-[#343432] text-[#C4C4C2] hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                              title="Copy credentials to share with user"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[11px] text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">Copy Credentials</span>
                                </>
                              )}
                            </button>

                            {users.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete user "${u.id}"?`)) {
                                    deleteUser(u.id);
                                    onShowToast?.(`Deleted user ${u.id}`);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-[#787875] hover:text-rose-400 hover:bg-[#2A2A29] transition cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE USERS MONITORING */}
              {activeTab === 'live' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#222221] border border-[#343432] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <h3 className="text-sm font-medium text-[#EDEDEB]">Live Connected Sessions</h3>
                      </div>
                      <span className="text-xs text-[#8E8E8B]">Real-time Status</span>
                    </div>

                    <div className="space-y-2 pt-2">
                      {currentUser ? (
                        <div className="p-3 rounded-xl bg-[#1C1C1B] border border-[#383836] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] flex items-center justify-center font-bold text-xs">
                              {currentUser.id.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-[#EDEDEB]">{currentUser.id}</span>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium">
                                  Active Now
                                </span>
                              </div>
                              <div className="text-xs text-[#8E8E8B]">{currentUser.email} · Plan: {currentUser.plan}</div>
                            </div>
                          </div>

                          <div className="text-right text-xs text-[#8E8E8B]">
                            <div>Session ID: #ses-{currentUser.id.toLowerCase()}</div>
                            <div className="text-[11px] text-[#A0A09D]">Current active device</div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-[#8E8E8B] italic">
                          No users are currently logged in.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LOGO & BRANDING SELECTION */}
              {activeTab === 'branding' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#222221] border border-[#343432] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-[#EDEDEB]">App Logo Selection</h3>
                        <p className="text-xs text-[#8E8E8B]">
                          Stored in separate logos folder (<code className="text-[#DE7959]">src/logos/</code>). Select or upload your custom logo.
                        </p>
                      </div>
                    </div>

                    {/* Logo selection gallery */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AVAILABLE_LOGOS.map(logo => {
                        const isSelected = activeLogo.id === logo.id;

                        return (
                          <div
                            key={logo.id}
                            onClick={() => {
                              setActiveLogo(logo);
                              onShowToast?.(`Logo updated to ${logo.name}`);
                            }}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#2A2A29] border-[#DE7959]'
                                : 'bg-[#1C1C1B] border-[#343432] hover:border-[#4E4E4B]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#252524] flex items-center justify-center border border-[#363634]">
                                <AppLogoIcon logo={logo} size={24} />
                              </div>
                              <div>
                                <div className="text-xs font-medium text-[#EDEDEB]">{logo.name}</div>
                                <div className="text-[11px] text-[#8E8E8B] capitalize">{logo.type}</div>
                              </div>
                            </div>

                            {isSelected && (
                              <Check className="w-4 h-4 text-[#DE7959] stroke-[2.5]" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Logo Upload */}
                    <div className="pt-2 border-t border-[#2E2E2C]">
                      <label className="block text-xs font-medium text-[#EDEDEB] mb-2">
                        Upload Custom Logo File (PNG, SVG, JPG)
                      </label>
                      <label className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-[#444442] hover:border-[#DE7959] bg-[#1C1C1B] hover:bg-[#222221] transition cursor-pointer text-xs text-[#C4C4C2]">
                        <Upload className="w-4 h-4 text-[#DE7959]" />
                        <span>Click to upload image file from your device</span>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
