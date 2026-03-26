// supabase-config.js

const SUPABASE_URL = 'https://yttkrvducgxvfoousblw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZU4pS-xH46wzwPESHEjY9A_VO3bKPjA';

// Initialize the single Supabase client for interacting with your database
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
