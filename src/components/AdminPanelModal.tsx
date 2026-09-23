import React, { useState } from 'react';
import { useAuth, ADMIN_PASSWORD } from '../context/AuthContext';
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
  Users
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
    isAdmin,
    loginAdmin,
    logoutAdmin,
    addUser,
    deleteUser
  } = useAuth();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#1C1C1B] border border-[#343432] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2B2B2A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DE7959]/10 text-[#DE7959] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-medium text-[#EDEDEB]">Admin Control Panel</h2>
              <p className="text-xs text-[#8E8E8B]">Manage user IDs, passwords, and access plans</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={logoutAdmin}
                className="text-xs text-[#8E8E8B] hover:text-white px-2 py-1 rounded-lg hover:bg-[#282827] transition"
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
            <form onSubmit={handleAdminAuth} className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#282827] border border-[#383836] mx-auto flex items-center justify-center text-[#DE7959]">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-medium text-[#EDEDEB]">Enter Admin Password</h3>
                <p className="text-xs text-[#8E8E8B] mt-1">
                  Access is protected. Please enter the master password to manage users.
                </p>
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
            </form>
          ) : (
            /* Admin Unlocked - User Management */
            <div className="space-y-6">
              {/* 1. Add User Form */}
              <div className="p-4 rounded-2xl bg-[#222221] border border-[#343432]">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="w-4 h-4 text-[#DE7959]" />
                  <h3 className="text-sm font-medium text-[#EDEDEB]">Create New User Account</h3>
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
                        Password *
                      </label>
                      <input
                        type="text"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="e.g. SecretPass#1"
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

              {/* 2. Registered Users List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#8E8E8B]" />
                    <h3 className="text-sm font-medium text-[#EDEDEB]">
                      Registered User Accounts ({users.length})
                    </h3>
                  </div>
                </div>

                <div className="space-y-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
