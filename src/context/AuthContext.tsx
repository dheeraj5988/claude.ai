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
  createdAt: number;
  lastActiveAt?: number;
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

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  liveUsers: LiveSessionInfo[];
  isAdmin: boolean;
  activeLogo: AppLogo;
  setActiveLogo: (logo: AppLogo) => void;
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
            // First time seed default account into cloud database
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

  // 3. Real-time synchronization of active logo from Cloud Database (Firestore)
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
            const data = docSnap.data() as LiveSessionInfo;
            // Only count sessions active within the last 2 minutes
            if (data && data.lastActiveAt && now - data.lastActiveAt < 120000) {
              map[data.sessionId || docSnap.id] = data;
            }
          });
          setLiveSessions(map);
        },
        err => {
          console.warn('Firestore live sessions fallback:', err.message);
        }
      );

      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, []);

  const setActiveLogo = (logo: AppLogo) => {
    setActiveLogoState(logo);
    try {
      localStorage.setItem(ACTIVE_LOGO_KEY, JSON.stringify(logo));
      // Sync to cloud database so all users across the world see the new logo
      setDoc(doc(db, 'settings', 'app'), {
        activeLogo: logo,
        updatedAt: Date.now(),
      }).catch(err => console.warn('Could not sync logo to Firestore:', err));
    } catch {
      // ignore
    }
  };

  // Save current active user locally
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
      // Update in cloud database
      setDoc(doc(db, 'users', found.id), updatedUser, { merge: true }).catch(() => {});
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      deleteDoc(doc(db, 'sessions', SESSION_ID)).catch(() => {});
    }
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

  const addUser = async (
    userData: Omit<UserAccount, 'createdAt' | 'lastActiveAt'>
  ): Promise<boolean> => {
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

    // Update local state immediately
    setUsers(prev => [newUser, ...prev]);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([newUser, ...users]));

    // Persist to Cloud Database (Firestore)
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (err) {
      console.warn('Persisting user to Firestore error:', err);
    }
    return true;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
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
