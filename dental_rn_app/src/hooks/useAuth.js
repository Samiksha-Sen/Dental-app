import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    authService.getSession().then(({ session: restoredSession }) => {
      if (!mounted) return;
      setSession(restoredSession);
      setUser(restoredSession?.user || null);
      setLoading(false);
    });

    const subscription = authService.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession || null);
      setUser(newSession?.user || null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const result = await authService.signIn(email, password);
    if (result.session) {
      setSession(result.session);
      setUser(result.user);
    }
    return result;
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    const result = await authService.signUp(email, password, fullName);
    if (result.session) {
      setSession(result.session);
      setUser(result.user);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    const result = await authService.signOut();
    setSession(null);
    setUser(null);
    return result;
  }, []);

  const value = { session, user, loading, signIn, signUp, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
