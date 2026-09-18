'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  isLoggedIn: boolean;
}

interface AuthContextType {
  user: AuthUser;
  login: (userData: Partial<AuthUser>) => void;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showSignupModal: boolean;
  setShowSignupModal: (show: boolean) => void;
  showCreateTeamModal: boolean;
  setShowCreateTeamModal: (show: boolean) => void;
}

// Preset Users for quick switching / testing
export const PRESET_USERS: AuthUser[] = [
  {
    id: 'u-naveen',
    name: 'Naveen',
    email: 'naveen@omniqr.online',
    role: 'ADMIN',
    avatar: 'NV',
    isLoggedIn: true,
  },
  {
    id: 'u-owner',
    name: 'Alex Rivera',
    email: 'alex@acme.io',
    role: 'OWNER',
    avatar: 'AR',
    isLoggedIn: true,
  },
  {
    id: 'u-member',
    name: 'David Miller',
    email: 'david@acme.io',
    role: 'MEMBER',
    avatar: 'DM',
    isLoggedIn: true,
  },
];

const defaultUser: AuthUser = PRESET_USERS[0]; // Default to Naveen (Admin)

const AuthContext = createContext<AuthContextType>({
  user: defaultUser,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
  showLoginModal: false,
  setShowLoginModal: () => {},
  showSignupModal: false,
  setShowSignupModal: () => {},
  showCreateTeamModal: false,
  setShowCreateTeamModal: () => {},
});

const AUTH_STORAGE_KEY = 'omni_auth_user_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(defaultUser);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } catch {
      setUser(defaultUser);
    }
  }, []);

  const login = (userData: Partial<AuthUser>) => {
    const updated: AuthUser = {
      id: userData.id || 'u-' + Date.now(),
      name: userData.name || 'Naveen',
      email: userData.email || 'naveen@omniqr.online',
      role: userData.role || 'ADMIN',
      avatar: (userData.name || 'Naveen').substring(0, 2).toUpperCase(),
      isLoggedIn: true,
    };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  const logout = () => {
    const loggedOutUser: AuthUser = {
      ...user,
      isLoggedIn: false,
    };
    setUser(loggedOutUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedOutUser));
  };

  const switchRole = (newRole: UserRole) => {
    const updated: AuthUser = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchRole,
        showLoginModal,
        setShowLoginModal,
        showSignupModal,
        setShowSignupModal,
        showCreateTeamModal,
        setShowCreateTeamModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
