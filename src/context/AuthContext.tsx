import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppLogo, AVAILABLE_LOGOS } from '../logos';
import { db, validateFirestoreConnection } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';

export interface UserAccount {
  id: string; // e.g. "Aashish09"
  name: string; // e.g. "Aashish"
  email: string; // e.g. "ankitasharma19890507@gmail.com"
  password: string; // user password set by admin
  plan: 'Pro' | 'Free' | 'Max';
  role?: 'user' | 'admin';
  status?: 'active' | 'disabled';
  createdAt: number;
  lastActiveAt?: number;
}

export interface ClaudeSettings {
  apiKey: string; // Anthropic Claude API Key
  model: string; // e.g. "claude-3-5-sonnet-20241022"
  enabled: boolean;
  firstMessagesCount: number; // default: 2 (messages 1 & 2 handled by Claude, 3+ by Gemini)
}

export interface GeminiKeyAccount {
  id: string;
  name: string; // e.g. "Account 1", "Work Project", "Personal Key"
  apiKey: string;
  status: 'active' | 'quota_exhausted' | 'disabled';
  addedAt: number;
}

export interface GeminiSettings {
  apiKey: string; // Primary key fallback
  apiKeys: GeminiKeyAccount[]; // Multiple accounts pool
  model: string; // default "gemini-2.5-flash"
  enabled: boolean;
}

export interface LiveSessionInfo {
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  lastActiveAt: number;
  sessionId: string;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'Aashish09',
    name: 'Aashish',
    email: 'ankitasharma19890507@gmail.com',
    password: 'password123',
    plan: 'Pro',
    createdAt: Date.now() - 86400000 * 7,
    lastActiveAt: Date.now(),
  },
];

const DEFAULT_CLAUDE_SETTINGS: ClaudeSettings = {
  apiKey: '',
  model: 'claude-3-5-sonnet-20241022',
  enabled: true,
  firstMessagesCount: 2,
};

const DEFAULT_GEMINI_SETTINGS: GeminiSettings = {
  apiKey: '',
  apiKeys: [],
  model: 'gemini-2.5-flash',
  enabled: true,
};

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  liveUsers: LiveSessionInfo[];
  isAdmin: boolean;
  activeLogo: AppLogo;
  setActiveLogo: (logo: AppLogo) => void;
  claudeSettings: ClaudeSettings;
  updateClaudeSettings: (settings: Partial<ClaudeSettings>) => Promise<boolean>;
  geminiSettings: GeminiSettings;
  updateGeminiSettings: (settings: Partial<GeminiSettings>) => Promise<boolean>;
  addGeminiKeyAccount: (name: string, apiKey: string) => Promise<boolean>;
  removeGeminiKeyAccount: (id: string) => Promise<boolean>;
  login: (idOrEmail: string, pass: string) => boolean;
  logout: () => void;
  loginAdmin: (pass: string) => boolean;
  logoutAdmin: () => void;
  addUser: (user: Omit<UserAccount, 'createdAt' | 'lastActiveAt'>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUserPassword: (userId: string, newPass: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'claude_users_registry_v2';
const CURRENT_USER_KEY = 'claude_active_user_v2';
const ADMIN_AUTH_KEY = 'claude_admin_unlocked_v2';
const ACTIVE_LOGO_KEY = 'claude_app_logo_v1';
const SESSION_ID = 'ses_' + Math.random().toString(36).substring(2, 9);

export const ADMIN_PASSWORD = 'Dheeraj@10';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_USERS;
  });

  const [liveSessions, setLiveSessions] = useState<Record<string, LiveSessionInfo>>({});

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  });

  const [activeLogo, setActiveLogoState] = useState<AppLogo>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_LOGO_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // fallback
    }
    return AVAILABLE_LOGOS[0];
  });

  const [claudeSettings, setClaudeSettingsState] = useState<ClaudeSettings>(() => {
    try {
      const stored = localStorage.getItem('claude_api_settings_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_CLAUDE_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_CLAUDE_SETTINGS;
  });

  const [geminiSettings, setGeminiSettingsState] = useState<GeminiSettings>(() => {
    try {
      const stored = localStorage.getItem('gemini_api_settings_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_GEMINI_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_GEMINI_SETTINGS;
  });

  // 1. Initial Firestore connection probe
  useEffect(() => {
    validateFirestoreConnection();
  }, []);

  // 2. Real-time synchronization of users from Cloud Database (Firestore)
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'users'),
        snapshot => {
          if (!snapshot.empty) {
            const remoteUsers: UserAccount[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as UserAccount;
              if (data && data.id && data.password) {
                remoteUsers.push(data);
              }
            });
            if (remoteUsers.length > 0) {
              setUsers(remoteUsers);
              localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(remoteUsers));
            }
          } else {
            const defaultUser = DEFAULT_USERS[0];
            setDoc(doc(db, 'users', defaultUser.id), defaultUser).catch(() => {});
          }
        },
        err => {
          console.warn('Firestore users sync fallback to local storage:', err.message);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not subscribe to Firestore users:', e);
    }
  }, []);

  // 3. Real-time synchronization of active logo, Claude, and Gemini settings from Firestore
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        doc(db, 'settings', 'app'),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.activeLogo) {
              setActiveLogoState(data.activeLogo);
              localStorage.setItem(ACTIVE_LOGO_KEY, JSON.stringify(data.activeLogo));
            }
            if (data?.claudeSettings) {
              setClaudeSettingsState(data.claudeSettings);
              localStorage.setItem('claude_api_settings_v2', JSON.stringify(data.claudeSettings));
            }
            if (data?.geminiSettings) {
              setGeminiSettingsState(data.geminiSettings);
              localStorage.setItem('gemini_api_settings_v2', JSON.stringify(data.geminiSettings));
            }
          }
        },
        err => {
          console.warn('Firestore settings fallback:', err.message);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not subscribe to Firestore settings:', e);
    }
  }, []);

  // 4. Live Sessions tracking in Cloud Database
  useEffect(() => {
    if (!currentUser) return;

    const sessionRef = doc(db, 'sessions', SESSION_ID);

    const heartbeat = () => {
      const payload: LiveSessionInfo = {
        sessionId: SESSION_ID,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.id,
        userEmail: currentUser.email || `${currentUser.id}@example.com`,
        plan: currentUser.plan || 'Pro',
        lastActiveAt: Date.now(),
      };
      setDoc(sessionRef, payload).catch(() => {});
    };

    heartbeat();
    const interval = setInterval(heartbeat, 25000);

    return () => {
      clearInterval(interval);
      deleteDoc(sessionRef).catch(() => {});
    };
  }, [currentUser]);

  // 5. Listen to all live sessions in Cloud Database
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'sessions'),
        snapshot => {
          const map: Record<string, LiveSessionInfo> = {};
          const now = Date.now();
          snapshot.forEach(docSnap => {
            const info = docSnap.data() as LiveSessionInfo;
            if (info && info.userId && now - (info.lastActiveAt || 0) < 60000) {
              map[info.sessionId || docSnap.id] = info;
            }
          });
          setLiveSessions(map);
        },
        err => {
          console.warn('Live sessions sync fallback:', err.message);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Live sessions listener error:', e);
    }
  }, []);

  const login = (idOrEmail: string, pass: string): boolean => {
    const trimmedInput = idOrEmail.trim().toLowerCase();
    const user = users.find(
      u =>
        (u.id.toLowerCase() === trimmedInput || u.email.toLowerCase() === trimmedInput) &&
        u.password === pass
    );

    if (user) {
      const updatedUser: UserAccount = { ...user, lastActiveAt: Date.now() };
      setCurrentUser(updatedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    deleteDoc(doc(db, 'sessions', SESSION_ID)).catch(() => {});
  };

  const loginAdmin = (pass: string): boolean => {
    if (pass === ADMIN_PASSWORD) {
      setIsAdmin(true);
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  };

  const setActiveLogo = async (logo: AppLogo) => {
    setActiveLogoState(logo);
    localStorage.setItem(ACTIVE_LOGO_KEY, JSON.stringify(logo));
    try {
      await setDoc(doc(db, 'settings', 'app'), { activeLogo: logo }, { merge: true });
    } catch (e) {
      console.warn('Could not save logo to Firestore:', e);
    }
  };

  const addUser = async (userData: Omit<UserAccount, 'createdAt' | 'lastActiveAt'>): Promise<boolean> => {
    const exists = users.some(
      u =>
        u.id.toLowerCase() === userData.id.toLowerCase() ||
        u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (exists) return false;

    const newUser: UserAccount = {
      ...userData,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));

    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (err) {
      console.warn('Saving new user to Firestore error:', err);
    }

    return true;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    const nextUsers = users.filter(u => u.id !== userId);
    setUsers(nextUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));

    if (currentUser?.id === userId) {
      logout();
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.warn('Deleting user from Firestore error:', err);
    }

    return true;
  };

  const updateUserPassword = async (userId: string, newPass: string): Promise<boolean> => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, password: newPass } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, password: newPass } : null));
    }

    try {
      await updateDoc(doc(db, 'users', userId), { password: newPass });
    } catch (err) {
      console.warn('Updating user password in Firestore error:', err);
    }
    return true;
  };

  const updateClaudeSettings = async (settings: Partial<ClaudeSettings>): Promise<boolean> => {
    const merged = { ...claudeSettings, ...settings };
    setClaudeSettingsState(merged);
    localStorage.setItem('claude_api_settings_v2', JSON.stringify(merged));
    try {
      await setDoc(doc(db, 'settings', 'app'), { claudeSettings: merged }, { merge: true });
      return true;
    } catch (e) {
      console.warn('Could not save Claude settings to Firestore:', e);
      return false;
    }
  };

  const updateGeminiSettings = async (settings: Partial<GeminiSettings>): Promise<boolean> => {
    const merged = { ...geminiSettings, ...settings };
    setGeminiSettingsState(merged);
    localStorage.setItem('gemini_api_settings_v2', JSON.stringify(merged));
    try {
      await setDoc(doc(db, 'settings', 'app'), { geminiSettings: merged }, { merge: true });
      return true;
    } catch (e) {
      console.warn('Could not save Gemini settings to Firestore:', e);
      return false;
    }
  };

  const addGeminiKeyAccount = async (name: string, apiKey: string): Promise<boolean> => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) return false;

    const newAccount: GeminiKeyAccount = {
      id: `gem-acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || `Account ${geminiSettings.apiKeys.length + 1}`,
      apiKey: trimmedKey,
      status: 'active',
      addedAt: Date.now(),
    };

    const nextKeys = [...(geminiSettings.apiKeys || []), newAccount];
    const merged: GeminiSettings = {
      ...geminiSettings,
      apiKey: geminiSettings.apiKey || trimmedKey, // if primary empty, set primary
      apiKeys: nextKeys,
    };

    return updateGeminiSettings(merged);
  };

  const removeGeminiKeyAccount = async (id: string): Promise<boolean> => {
    const nextKeys = (geminiSettings.apiKeys || []).filter(k => k.id !== id);
    const nextPrimary = nextKeys.length > 0 ? nextKeys[0].apiKey : '';
    return updateGeminiSettings({
      apiKeys: nextKeys,
      apiKey: geminiSettings.apiKey === id ? nextPrimary : (geminiSettings.apiKey || nextPrimary),
    });
  };

  const liveUsersList = Object.values(liveSessions);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        liveUsers: liveUsersList,
        isAdmin,
        activeLogo,
        setActiveLogo,
        claudeSettings,
        updateClaudeSettings,
        geminiSettings,
        updateGeminiSettings,
        addGeminiKeyAccount,
        removeGeminiKeyAccount,
        login,
        logout,
        loginAdmin,
        logoutAdmin,
        addUser,
        deleteUser,
        updateUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
