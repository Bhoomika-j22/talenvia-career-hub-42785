import { createClient } from "@supabase/supabase-js";
import { getEnv } from "../config/env";

/**
 * Supabase client bootstrap for the Talenvia frontend.
 *
 * This module intentionally:
 * - reads configuration from process.env
 * - does not hardcode any secrets
 * - provides a small helper surface area for pages/services to import
 *
 * Project requirement:
 * - Use SUPABASE_URL and SUPABASE_KEY (no REACT_APP_ prefix).
 */

const env = getEnv();

const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseKey;

/**
 * Create the Supabase client only if configuration is present.
 * This keeps the UI usable even when Supabase is not configured.
 */
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns a configured Supabase client instance, or null if env vars are missing. */
  return supabase;
}

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
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY."
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
