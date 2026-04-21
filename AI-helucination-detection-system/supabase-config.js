// ============================================================
// Nexa AI AHDS — Supabase Configuration
// ============================================================
// IMPORTANT: Replace these with your actual Supabase project values.
// Find them at: https://supabase.com/dashboard → Settings → API
// ============================================================

const SUPABASE_URL = 'https://qflgncvlytgthbtlakir.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rVXZS69LFCNmqIPuGVcVcQ_NzOzxA2D';

// Initialize Supabase client safely — wrap in try/catch so a bad key
// format never crashes downstream scripts and prevents form listeners.
let supabase;
try {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
} catch (err) {
  console.error('[AHDS] Supabase client failed to initialize:', err);
  supabase = null;
}

// Helper: check if Supabase is properly configured AND the client initialized
function isSupabaseConfigured() {
  return (
    supabase !== null &&
    SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co' &&
    SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY_HERE'
  );
}
