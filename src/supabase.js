import { createClient } from '@supabase/supabase-js';

// ⚠️ Replace these with your Supabase project values!
// Find them at: Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://DEIN_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'DEIN_ANON_KEY_HIER';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
