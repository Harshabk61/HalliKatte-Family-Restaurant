import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

interface AdminProfile {
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  adminProfile: AdminProfile | null;
  adminError: string | null;
  getToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const verifyAdmin = async (currentUser: User | null) => {
    if (!currentUser) {
      setAdminProfile(null);
      setAdminError(null);
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/admin/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminProfile(data);
        setAdminError(null);
      } else {
        const err = await res.json().catch(() => ({}));
        setAdminProfile(null);
        setAdminError(
          err.error ||
            'Your Google account does not have HalliKatte administrator access.',
        );
      }
    } catch {
      setAdminProfile(null);
      setAdminError('Unable to verify administrator session.');
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      await verifyAdmin(nextUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    setAdminError(null);
    const cred = await signInWithPopup(auth, googleAuthProvider);
    await verifyAdmin(cred.user);
  };

  const logout = async () => {
    await signOut(auth);
    setAdminProfile(null);
    setAdminError(null);
  };

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  };

  const refreshAdminStatus = async () => {
    await verifyAdmin(auth.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        adminProfile,
        adminError,
        getToken,
        signInWithGoogle,
        logout,
        refreshAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
