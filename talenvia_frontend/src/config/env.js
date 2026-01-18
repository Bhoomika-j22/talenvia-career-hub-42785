/**
 * Centralized environment accessor.
 *
 * Why this exists:
 * - CRA exposes env vars at build time via process.env (and only REACT_APP_* by default).
 * - Some deployments inject runtime env via window.__ENV.
 * - Some toolchains use import.meta.env (Vite).
 *
 * This helper reads in a defensive order and normalizes values.
 *
 * Supabase:
 * - We support both SUPABASE_URL/SUPABASE_KEY and REACT_APP_SUPABASE_URL/REACT_APP_SUPABASE_KEY
 *   to avoid "configured but not detected" scenarios in CRA deployments.
 */

// PUBLIC_INTERFACE
export function readEnvVar(name) {
  /** Reads an env var from process.env, import.meta.env (when available), or window.__ENV (runtime-injected). */
  try {
    // 1) CRA / Node-style build-time env
    if (typeof process !== "undefined" && process?.env && process.env[name] != null) {
      return process.env[name];
    }

    // 2) Vite-style env (best-effort; guarded to avoid syntax/runtime issues in CRA)
    // eslint-disable-next-line no-new-func
    const importMetaEnv = Function(
      "try { return typeof import !== 'undefined' && import.meta && import.meta.env ? import.meta.env : undefined; } catch (e) { return undefined; }"
    )();
    if (importMetaEnv && importMetaEnv[name] != null) {
      return importMetaEnv[name];
    }

    // 3) Runtime-injected env (e.g. index.html sets window.__ENV = {...})
    if (typeof window !== "undefined" && window.__ENV && window.__ENV[name] != null) {
      return window.__ENV[name];
    }
  } catch {
    // ignore and fall through
  }

  return undefined;
}

function normalizeString(value) {
  if (value == null) return undefined;
  const v = String(value).trim();
  return v.length ? v : undefined;
}

// PUBLIC_INTERFACE
export function getSupabaseEnv() {
  /** Returns normalized Supabase env values and a configuration flag. */
  const supabaseUrl =
    normalizeString(readEnvVar("SUPABASE_URL")) || normalizeString(readEnvVar("REACT_APP_SUPABASE_URL"));

  const supabaseKey =
    normalizeString(readEnvVar("SUPABASE_KEY")) || normalizeString(readEnvVar("REACT_APP_SUPABASE_KEY"));

  return {
    supabaseUrl,
    supabaseKey,
    isSupabaseConfigured: !!(supabaseUrl && supabaseKey)
  };
}

// PUBLIC_INTERFACE
export function getEnv() {
  /** Returns normalized env values used by the app. */
  const { supabaseUrl, supabaseKey, isSupabaseConfigured } = getSupabaseEnv();

  return {
    apiBase: normalizeString(readEnvVar("REACT_APP_API_BASE")),
    backendUrl: normalizeString(readEnvVar("REACT_APP_BACKEND_URL")),
    frontendUrl: normalizeString(readEnvVar("REACT_APP_FRONTEND_URL")),
    wsUrl: normalizeString(readEnvVar("REACT_APP_WS_URL")),
    nodeEnv: normalizeString(readEnvVar("REACT_APP_NODE_ENV")),
    logLevel: normalizeString(readEnvVar("REACT_APP_LOG_LEVEL")),
    healthcheckPath: normalizeString(readEnvVar("REACT_APP_HEALTHCHECK_PATH")),
    featureFlags: normalizeString(readEnvVar("REACT_APP_FEATURE_FLAGS")),
    experimentsEnabled: normalizeString(readEnvVar("REACT_APP_EXPERIMENTS_ENABLED")),

    // Supabase (supports both prefixed and non-prefixed).
    supabaseUrl,
    supabaseKey,
    isSupabaseConfigured
  };
}

// PUBLIC_INTERFACE
export function getEnvDebugSnapshot() {
  /**
   * Returns a safe-to-log snapshot of env detection (never returns the full Supabase key).
   * Intended for debugging "Supabase is not configured" false negatives.
   */
  const { supabaseUrl, supabaseKey, isSupabaseConfigured } = getSupabaseEnv();
  const maskedKey =
    supabaseKey && supabaseKey.length >= 8 ? `${supabaseKey.slice(0, 4)}…${supabaseKey.slice(-4)}` : undefined;

  return {
    isSupabaseConfigured,
    supabaseUrlPresent: !!supabaseUrl,
    supabaseKeyPresent: !!supabaseKey,
    supabaseUrlSample: supabaseUrl ? `${supabaseUrl.slice(0, 16)}…` : undefined,
    supabaseKeyMasked: maskedKey,
    sourceHints: {
      hasProcessEnv: typeof process !== "undefined" && !!process?.env,
      hasWindowEnv: typeof window !== "undefined" && !!window?.__ENV
    }
  };
}
