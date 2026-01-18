import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured, maskedDebug } from "../config/env";

/**
 * Supabase client bootstrap for the Talenvia frontend.
 *
 * Requirements implemented:
 * - Initialize client only when both URL and anon key exist (and URL is http/https)
 * - Provide a clear "isSupabaseConfigured" flag (boolean export)
 * - Avoid leaking secrets; only masked info may be logged and only in dev
 * - Work across CRA (process.env), Vite (import.meta.env), and runtime injected env (window.__ENV)
 *
 * IMPORTANT:
 * - This module must never reference `process` or `import.meta` unguarded at runtime.
 *   All environment detection is delegated to src/config/env.js which is browser-safe.
 */

let supabase = null;

// Initialize at module load so callers can use a stable singleton.
if (isSupabaseConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  // Tiny masked debug line (dev-only behavior is inside maskedDebug)
  maskedDebug("Supabase client initialized.");
} else {
  maskedDebug("Supabase client not initialized (missing/invalid config).");
}

export { supabase, isSupabaseConfigured };

// PUBLIC_INTERFACE
export async function supabasePing() {
  /**
   * Minimal "ping" helper for Supabase connectivity.
   *
   * We intentionally avoid assuming any tables exist. Instead we call auth.getSession(),
   * which is safe and works even for anonymous users (may return { session: null }).
   *
   * Returns:
   * - { ok: true, sessionExists: boolean }
   * - { ok: false, error: string } when not configured or on errors.
   */
  if (!supabase) {
    return {
      ok: false,
      error:
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY (or VITE_SUPABASE_URL/VITE_SUPABASE_KEY, or window.__ENV)."
    };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, sessionExists: !!data?.session };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
