'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { AccountProfile } from '@/lib/account';
import { createClient } from '@/lib/supabase/client';

type AuthContextValue = {
  user: User | null;
  profile: AccountProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string, username?: string) => Promise<string>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function emailAuthMessage(error: { code?: string; message: string }) {
  const normalized = `${error.code ?? ''} ${error.message}`.toLowerCase();
  if (
    normalized.includes('over_email_send_rate_limit') ||
    normalized.includes('rate limit') ||
    normalized.includes('rate_limit')
  ) {
    return new Error(
      'Email delivery is temporarily busy. Please wait a few minutes and try once, or use Google or GitHub sign-in when available.',
    );
  }
  if (
    normalized.includes('email_address_not_authorized') ||
    normalized.includes('not authorized')
  ) {
    return new Error(
      'This email cannot receive sign-in links from the current mail service. Please use Google or GitHub sign-in when available.',
    );
  }
  return error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (nextUser: User | null) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', nextUser.id)
        .single();
      setProfile((data as AccountProfile | null) ?? null);
      setLoading(false);
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await loadProfile(data.user);
  }, [loadProfile, supabase]);

  useEffect(() => {
    window.setTimeout(() => void refreshProfile(), 0);
    const { data } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        window.setTimeout(() => void loadProfile(session?.user ?? null), 0);
      },
    );
    return () => data.subscription.unsubscribe();
  }, [loadProfile, refreshProfile, supabase]);

  const signInWithEmail = useCallback(
    async (email: string, username?: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: username ? { username } : undefined,
        },
      });
      if (error) throw emailAuthMessage(error);
      return 'Check your email for a secure sign-in link.';
    },
    [supabase],
  );

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github') => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (user) {
      await supabase.rpc('log_activity', {
        p_event_type: 'signed_out',
        p_inspection_id: null,
        p_event_data: {},
      });
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase, user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
      signInWithEmail,
      signInWithOAuth,
      signOut,
    }),
    [
      loading,
      profile,
      refreshProfile,
      signInWithEmail,
      signInWithOAuth,
      signOut,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
