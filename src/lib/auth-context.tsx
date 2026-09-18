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

// Preset Users empty for clean multi-tenant DB auth
export const PRESET_USERS: AuthUser[] = [];

const defaultLoggedOutUser: AuthUser = {
  id: '',
  name: '',
  email: '',
  role: 'MEMBER',
  avatar: '',
  isLoggedIn: false,
};

const AuthContext = createContext<AuthContextType>({
  user: defaultLoggedOutUser,
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
  const [user, setUser] = useState<AuthUser>(defaultLoggedOutUser);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  // Initialize and verify active session token with database /api/v1/auth/me
  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((res) => {
        if (res.authenticated && res.user) {
          const activeUser: AuthUser = {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role || 'ADMIN',
            avatar: (res.user.name || 'U').substring(0, 2).toUpperCase(),
            isLoggedIn: true,
          };
          setUser(activeUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));
        } else {
          setUser(defaultLoggedOutUser);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      })
      .catch(() => {
        setUser(defaultLoggedOutUser);
      });
  }, []);

  const login = (userData: Partial<AuthUser>) => {
    const updated: AuthUser = {
      id: userData.id || 'u-' + Date.now(),
      name: userData.name || 'User',
      email: userData.email || '',
      role: userData.role || 'ADMIN',
      avatar: (userData.name || 'U').substring(0, 2).toUpperCase(),
      isLoggedIn: true,
    };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  const logout = () => {
    fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(defaultLoggedOutUser);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
