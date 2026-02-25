import { createClient } from '@supabase/supabase-js';

// ⚠️ Replace these with your Supabase project values!
// Find them at: Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://DEIN_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'DEIN_ANON_KEY_HIER';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// AUTH HELPERS
// ============================================================

// Google Login
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) console.error('Google sign-in error:', error);
  return { data, error };
}

// Email Magic Link
export async function signInWithMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) console.error('Magic link error:', error);
  return { data, error };
}

// Sign Out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Sign out error:', error);
  return { error };
}

// Get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) console.error('Get session error:', error);
  return session;
}

// Listen to auth state changes
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => callback(event, session)
  );
  return subscription;
}

// ============================================================
// PROFILE HELPERS
// ============================================================

// Fetch profile for current user
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('Fetch profile error:', error);
  }
  return data;
}

// Update profile (onboarding or later edits)
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) console.error('Update profile error:', error);
  return { data, error };
}

// Fetch a profile by display_name (for lick attribution)
export async function fetchProfileByName(displayName) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, instrument, level')
    .eq('display_name', displayName)
    .single();
  if (error) return null;
  return data;
}
