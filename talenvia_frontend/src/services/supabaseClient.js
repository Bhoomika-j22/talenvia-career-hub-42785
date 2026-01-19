/**
 * Supabase client for Talenvia frontend.
 *
 * Uses CRA env vars:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 *
 * IMPORTANT:
 * - This scaffold does not include authentication.
 * - Calls may fail if RLS is enabled without permissive policies.
 */

import { createClient } from "@supabase/supabase-js";
import { getEnv, isValidUrl } from "../config/env";

const env = getEnv();
const supabaseUrl = env?.supabaseUrl;
const supabaseKey = env?.supabaseKey;

const hasAnySupabaseEnv = Boolean(
  (typeof supabaseUrl === "string" && supabaseUrl.trim().length > 0) ||
    (typeof supabaseKey === "string" && supabaseKey.trim().length > 0)
);

// PUBLIC_INTERFACE
export const isSupabaseConfigured =
  isValidUrl(supabaseUrl) && typeof supabaseKey === "string" && supabaseKey.trim().length > 0;
/** True when Supabase env vars are present and look valid. */

// PUBLIC_INTERFACE
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;
/** Supabase client instance, or null when not configured. */

// PUBLIC_INTERFACE
export async function supabasePing() {
  /**
   * Performs a lightweight request to confirm Supabase connectivity.
   * Returns: { ok: boolean, error?: string }
   */
  if (!isSupabaseConfigured || !supabase) {
    // Only show "missing" when URL+KEY are truly not provided at all.
    // If one is present but invalid/missing, it's more likely a config mistake.
    const msg = hasAnySupabaseEnv
      ? "Supabase is not configured correctly (invalid or incomplete Supabase URL/KEY)."
      : "Supabase is not configured (missing Supabase URL/KEY).";
    return { ok: false, error: msg };
  }

  try {
    // A small request that doesn't depend on app tables.
    // `select 1` isn't supported directly; we can attempt to list schemas via PostgREST is not allowed.
    // Instead, do a minimal query on a table that should exist; if it doesn't, we return the error for clarity.
    const { error } = await supabase.from("profiles").select("profile_key").limit(1);
    if (error) return { ok: false, error: error.message || "Supabase ping failed." };
    return { ok: true };
  } catch (e) {
    const msg = e?.message ? String(e.message) : "Supabase ping failed.";
    return { ok: false, error: msg };
  }
}
