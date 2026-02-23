import { createClient } from '@supabase/supabase-js';

// ⚠️ Replace these with your Supabase project values!
// Find them at: Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://edhsqycbglkaqbzzhcmp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkaHNxeWNiZ2xrYXFienpoY21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDE4MjgsImV4cCI6MjA4NzQxNzgyOH0.A6hsg9v6F1XtL5OS0k9wAjLXbp9UKvc8sHDd3RPcfTA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
