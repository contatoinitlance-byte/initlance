import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase configuration: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined.');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
}

const getSafeOAuthRedirectPath = (next, fallback = '/marketplace') => {
  if (!next) return fallback;

  const normalized = next.startsWith('/') ? next : `/${next}`;
  if (normalized.startsWith('//') || normalized.includes('://')) return fallback;
  if (
    normalized.startsWith('/login') ||
    normalized.startsWith('/register') ||
    normalized.startsWith('/auth/callback')
  ) {
    return fallback;
  }

  return normalized;
};

export const hasSupabaseOAuthHash = () => {
  if (typeof window === 'undefined') return false;

  const hash = window.location.hash?.replace(/^#/, '');
  if (!hash) return false;

  const params = new URLSearchParams(hash);
  return params.has('access_token') || params.has('refresh_token') || params.has('error');
};

export const consumeSupabaseOAuthHash = async (fallbackRedirect = '/marketplace') => {
  if (!supabase || typeof window === 'undefined' || !hasSupabaseOAuthHash()) {
    return { handled: false };
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  const nextPath = getSafeOAuthRedirectPath(searchParams.get('next'), fallbackRedirect);

  try {
    const authError = hashParams.get('error_description') || hashParams.get('error');
    if (authError) {
      throw new Error(authError);
    }

    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) throw error;
    }

    window.history.replaceState({}, document.title, nextPath);
    return { handled: true, redirectTo: nextPath };
  } catch (error) {
    window.history.replaceState({}, document.title, '/login');
    return { handled: true, error };
  }
};

export default supabase;
