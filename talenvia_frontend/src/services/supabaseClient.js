/**
 * Legacy stub: Supabase has been removed from this frontend.
 *
 * This file remains only to avoid potential stale imports during incremental updates.
 * New code must not use it.
 */

// PUBLIC_INTERFACE
export const isSupabaseConfigured = false;
/** Supabase client is intentionally unavailable. */
// PUBLIC_INTERFACE
export const supabase = null;

// PUBLIC_INTERFACE
export async function supabasePing() {
  /**
   * Compatibility stub for previous implementations.
   * Returns a consistent "not configured" response.
   */
  return { ok: false, error: "Supabase has been removed from this frontend." };
}
