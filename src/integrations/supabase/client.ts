import { createClient } from "@supabase/supabase-js";

// Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,          // <-- Required for reloads
    autoRefreshToken: true,        // <-- Required for app reopen
    detectSessionInUrl: true,      // <-- Required for password reset links
    storage: window.localStorage,  // <-- Required for Vite/PWA
  },
});