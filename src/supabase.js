import { createClient } from '@supabase/supabase-js';
2
3// ⚠️ Replace these with your Supabase project values!
4// Find them at: Supabase Dashboard → Settings → API
5const SUPABASE_URL = 'https://edhsqycbglkaqbzzhcmp.supabase.co';
6const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkaHNxeWNiZ2xrYXFienpoY21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDE4MjgsImV4cCI6MjA4NzQxNzgyOH0.A6hsg9v6F1XtL5OS0k9wAjLXbp9UKvc8sHDd3RPcfTA';
7
8export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
9
10// ============================================================
11// AUTH HELPERS
12// ============================================================
13
14// Google Login
15export async function signInWithGoogle() {
16  const { data, error } = await supabase.auth.signInWithOAuth({
17    provider: 'google',
18    options: {
19      redirectTo: window.location.origin,
20    },
21  });
22  if (error) console.error('Google sign-in error:', error);
23  return { data, error };
24}
25
26// Email Magic Link
27export async function signInWithMagicLink(email) {
28  const { data, error } = await supabase.auth.signInWithOtp({
29    email,
30    options: {
31      emailRedirectTo: window.location.origin,
32    },
33  });
34  if (error) console.error('Magic link error:', error);
35  return { data, error };
36}
37
38// Sign Out
39export async function signOut() {
40  const { error } = await supabase.auth.signOut();
41  if (error) console.error('Sign out error:', error);
42  return { error };
43}
44
45// Get current session
46export async function getSession() {
47  const { data: { session }, error } = await supabase.auth.getSession();
48  if (error) console.error('Get session error:', error);
49  return session;
50}
51
52// Listen to auth state changes
53export function onAuthStateChange(callback) {
54  const { data: { subscription } } = supabase.auth.onAuthStateChange(
55    (event, session) => callback(event, session)
56  );
57  return subscription;
58}
59
60// ============================================================
61// PROFILE HELPERS
62// ============================================================
63
64// Fetch profile for current user
65export async function fetchProfile(userId) {
66  const { data, error } = await supabase
67    .from('profiles')
68    .select('*')
69    .eq('id', userId)
70    .single();
71  if (error && error.code !== 'PGRST116') {
72    console.error('Fetch profile error:', error);
73  }
74  return data;
75}
76
77// Update profile (onboarding or later edits)
78export async function updateProfile(userId, updates) {
79  const { data, error } = await supabase
80    .from('profiles')
81    .update(updates)
82    .eq('id', userId)
83    .select()
84    .single();
85  if (error) console.error('Update profile error:', error);
86  return { data, error };
87}
88
89// Fetch a profile by display_name (for lick attribution)
90export async function fetchProfileByName(displayName) {
91  const { data, error } = await supabase
92    .from('profiles')
93    .select('id, display_name, avatar_url, instrument, level')
94    .eq('display_name', displayName)
95    .single();
96  if (error) return null;
97  return data;
98}
99
