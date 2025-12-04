import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { supabase } from './integrations/supabase/client'; // Direct import for debugging

// 🔧 TEMP FIX for blank reloads in Dyad preview or Vite dev
if (import.meta.env.DEV) {
  try {
    localStorage.clear();
    sessionStorage.clear();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
      });
    }
  } catch (err) {
    console.warn("Cache clear failed:", err);
  }
}

// Debugging environment variables directly in main.tsx
console.log("main.tsx: VITE_SUPABASE_URL =", import.meta.env.VITE_SUPABASE_URL);
console.log("main.tsx: VITE_SUPABASE_ANON_KEY =", import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log("main.tsx: Supabase client object (should not be undefined):", supabase);


createRoot(document.getElementById("root")!).render(<App />);