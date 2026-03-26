// supabase-config.js

const SUPABASE_URL = 'https://yttkrvducgxvfoousblw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZU4pS-xH46wzwPESHEjY9A_VO3bKPjA';

// The Supabase CDN automatically injects a global "supabase" object.
// We just re-assign it to the fully instantiated client so the rest of the app can use it smoothly!
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
