import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppLogo, AVAILABLE_LOGOS } from '../logos';

export interface UserAccount {
  id: string; // e.g. "Aashish09"
  name: string; // e.g. "Aashish"
  email: string; // e.g. "ankitasharma19890507@gmail.com"
  password: string; // user password set by admin
  plan: 'Pro' | 'Free' | 'Max';
  createdAt: number;
  lastActiveAt?: number;
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

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  isAdmin: boolean;
  activeLogo: AppLogo;
  setActiveLogo: (logo: AppLogo) => void;
  login: (idOrEmail: string, pass: string) => boolean;
  logout: () => void;
  loginAdmin: (pass: string) => boolean;
  logoutAdmin: () => void;
  addUser: (user: Omit<UserAccount, 'createdAt' | 'lastActiveAt'>) => boolean;
  deleteUser: (userId: string) => boolean;
  updateUserPassword: (userId: string, newPass: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'claude_users_registry_v2';
const CURRENT_USER_KEY = 'claude_active_user_v2';
const ADMIN_AUTH_KEY = 'claude_admin_unlocked_v2';
const ACTIVE_LOGO_KEY = 'claude_app_logo_v1';

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

  // FIRST TIME OPENING: Prompt for login details (start as null if not already authenticated)
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
    // Explicit requirement: "while first time opening the website it should ask the details of login"
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

  const setActiveLogo = (logo: AppLogo) => {
    setActiveLogoState(logo);
    try {
      localStorage.setItem(ACTIVE_LOGO_KEY, JSON.stringify(logo));
    } catch {
      // ignore
    }
  };

  // Save users registry
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // ignore storage errors
    }
  }, [users]);

  // Save current active user
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  const login = (idOrEmail: string, pass: string): boolean => {
    const cleanId = idOrEmail.trim().toLowerCase();
    const found = users.find(
      u =>
        (u.id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
        u.password === pass
    );

    if (found) {
      const updatedUser = { ...found, lastActiveAt: Date.now() };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => (u.id === found.id ? updatedUser : u)));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
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

  const addUser = (userData: Omit<UserAccount, 'createdAt' | 'lastActiveAt'>): boolean => {
    const exists = users.some(
      u => u.id.toLowerCase() === userData.id.toLowerCase() || u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (exists) return false;

    const newUser: UserAccount = {
      ...userData,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    setUsers(prev => [newUser, ...prev]);
    return true;
  };

  const deleteUser = (userId: string): boolean => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    return true;
  };

  const updateUserPassword = (userId: string, newPass: string): boolean => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, password: newPass } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, password: newPass } : null));
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin,
        activeLogo,
        setActiveLogo,
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
