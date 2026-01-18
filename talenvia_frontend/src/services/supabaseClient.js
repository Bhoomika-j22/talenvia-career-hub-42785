import { createClient } from "@supabase/supabase-js";
import { getEnv, getEnvDebugSnapshot } from "../config/env";

/**
 * Supabase client bootstrap for the Talenvia frontend.
 *
 * Key requirements:
 * - Initialize client only when both URL and anon key exist
 * - Provide a clear "isSupabaseConfigured" flag
 * - Avoid leaking secrets; only masked info may be logged
 * - Work in CRA (process.env build-time) and optionally in runtime-injected env (window.__ENV)
 */

let supabase = null;
let didWarnMissing = false;

function getConfig() {
  const env = getEnv();
  return {
    supabaseUrl: env.supabaseUrl,
    supabaseKey: env.supabaseKey,
    isSupabaseConfigured: !!env.isSupabaseConfigured
  };
}

function ensureSupabaseInitialized() {
  const { supabaseUrl, supabaseKey, isSupabaseConfigured } = getConfig();

  if (!isSupabaseConfigured) {
    if (!didWarnMissing) {
      didWarnMissing = true;
      // Helpful warning for debugging; does not expose secrets.
      // eslint-disable-next-line no-console
      console.warn("[Supabase] Not configured. Missing SUPABASE_URL/SUPABASE_KEY (or REACT_APP_SUPABASE_*).");
      // eslint-disable-next-line no-console
      console.warn("[Supabase] Env debug snapshot:", getEnvDebugSnapshot());
    }
    supabase = null;
    return null;
  }

  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }

  return supabase;
}

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns a configured Supabase client instance, or null if env vars are missing. */
  return ensureSupabaseInitialized();
}

// PUBLIC_INTERFACE
export function isSupabaseConfigured() {
  /** Returns true if Supabase env vars were detected (without creating a client). */
  return getConfig().isSupabaseConfigured;
}

// PUBLIC_INTERFACE
export function logSupabaseEnvDebug() {
  /**
   * Logs a masked env detection snapshot to help debug configuration issues.
   * Does NOT expose secrets in logs.
   */
  // eslint-disable-next-line no-console
  console.info("[Supabase] Env debug snapshot:", getEnvDebugSnapshot());
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
  const client = ensureSupabaseInitialized();
  if (!client) {
    return {
      ok: false,
      error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY (or REACT_APP_SUPABASE_URL/KEY)."
    };
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, sessionExists: !!data?.session };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
