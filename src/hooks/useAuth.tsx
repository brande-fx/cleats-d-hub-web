import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {isSupabaseConfigured, supabase} from '../services/supabaseClient';
import {AdminProfile} from '../types';

const PREVIEW_ADMIN_SESSION_KEY = 'calcite_preview_admin_session';

interface AuthContextValue {
  admin: AdminProfile | null;
  loading: boolean;
  isPreviewMode: boolean;
  signIn: (email: string, password: string) => Promise<{ok: boolean; error?: string}>;
  enterPreviewAdmin: (email?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isPreviewMode = !isSupabaseConfigured;

  const verifyAdminProfile = useCallback(async (userId: string): Promise<AdminProfile | null> => {
    if (!supabase) return null;
    const {data, error} = await supabase
      .from('admin_profiles')
      .select('user_id, email, full_name, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;
    if (data.role !== 'admin' && data.role !== 'super_admin') return null;
    return data as AdminProfile;
  }, []);

  useEffect(() => {
    let active = true;

    async function initAuth() {
      if (!isSupabaseConfigured || !supabase) {
        const savedPreview = sessionStorage.getItem(PREVIEW_ADMIN_SESSION_KEY);
        if (savedPreview && active) {
          try {
            setAdmin(JSON.parse(savedPreview) as AdminProfile);
          } catch {
            sessionStorage.removeItem(PREVIEW_ADMIN_SESSION_KEY);
          }
        }
        if (active) setLoading(false);
        return;
      }

      const {data} = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user && active) {
        const profile = await verifyAdminProfile(user.id);
        setAdmin(profile);
      }
      if (active) setLoading(false);
    }

    void initAuth();

    if (isSupabaseConfigured && supabase) {
      const {data: listener} = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!session?.user) {
          setAdmin(null);
          return;
        }
        const profile = await verifyAdminProfile(session.user.id);
        setAdmin(profile);
      });
      return () => {
        active = false;
        listener.subscription.unsubscribe();
      };
    }

    return () => {
      active = false;
    };
  }, [verifyAdminProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ok: boolean; error?: string}> => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          ok: false,
          error:
            'Supabase credentials are not configured in this environment. Use Local Preview Access below or configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        };
      }

      const {data, error} = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        return {ok: false, error: error?.message || 'Invalid login credentials.'};
      }

      const profile = await verifyAdminProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        return {
          ok: false,
          error:
            'Your account is authenticated, but not authorized in admin_profiles. Contact your store owner.',
        };
      }

      setAdmin(profile);
      return {ok: true};
    },
    [verifyAdminProfile]
  );

  const enterPreviewAdmin = useCallback((email = 'admin@calcitefootwear.com') => {
    if (isSupabaseConfigured) return;
    const previewProfile: AdminProfile = {
      user_id: 'preview-admin',
      email: email.trim() || 'admin@calcitefootwear.com',
      full_name: 'Store Administrator (Preview)',
      role: 'super_admin',
      is_active: true,
    };
    sessionStorage.setItem(PREVIEW_ADMIN_SESSION_KEY, JSON.stringify(previewProfile));
    setAdmin(previewProfile);
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      sessionStorage.removeItem(PREVIEW_ADMIN_SESSION_KEY);
    }
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{admin, loading, isPreviewMode, signIn, enterPreviewAdmin, signOut}}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
