import {createClient, SupabaseClient} from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const hasValidPlaceholder =
  !supabaseUrl ||
  supabaseUrl.includes('YOUR_PROJECT_REF') ||
  !supabaseAnonKey ||
  supabaseAnonKey.includes('YOUR_SUPABASE');

export const isSupabaseConfigured = Boolean(!hasValidPlaceholder && supabaseUrl.startsWith('http'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
