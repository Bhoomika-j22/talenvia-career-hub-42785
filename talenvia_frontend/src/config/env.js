/**
 * Bundler-agnostic, browser-safe environment accessor for Talenvia.
 *
 * Primary goal: avoid any unguarded runtime reference to `process` in the browser
 * (or `import.meta` in toolchains that don't support it).
 *
 * Supported env providers (checked in this order):
 *  1) window.__ENV.* (runtime-injected)
 *  2) guarded process.env.* (CRA build-time or polyfilled env)
 *  3) import.meta.env.* (Vite-style) via guarded access
 */

function normalizeString(value) {
  if (value == null) return undefined;
  const v = String(value).trim();
  return v.length ? v : undefined;
}

function firstNonEmpty(...values) {
  for (const v of values) {
    const n = normalizeString(v);
    if (n) return n;
  }
  return undefined;
}

// PUBLIC_INTERFACE
export function isValidUrl(value) {
  /** Returns true if value is a valid http/https URL. */
  const v = normalizeString(value);
  if (!v) return false;

  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Safely retrieves import.meta.env in a way that doesn't crash non-Vite toolchains.
 * We must not directly reference `import.meta` in CRA because it can break parsing.
 */
function getImportMetaEnvSafe() {
  try {
    // eslint-disable-next-line no-new-func
    return Function(
      "try { return (typeof import !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : undefined; } catch (e) { return undefined; }"
    )();
  } catch {
    return undefined;
  }
}

function getProcessEnvSafe() {
  try {
    // `process` may not exist in the browser unless polyfilled.
    if (typeof process !== "undefined" && process && process.env) return process.env;
  } catch {
    // ignore
  }
  return undefined;
}

function getWindowEnvSafe() {
  try {
    // Some deployments inject runtime vars via window.__ENV
    if (typeof window !== "undefined" && window && window.__ENV) return window.__ENV;
  } catch {
    // ignore
  }
  return undefined;
}

// PUBLIC_INTERFACE
export function getEnv() {
  /**
   * Returns normalized env values used by the app.
   *
   * This function is safe to call in supported toolchains (CRA/Vite) and also
   * supports runtime-injected window.__ENV.
   */
  const win = getWindowEnvSafe();
  const proc = getProcessEnvSafe();
  const meta = getImportMetaEnvSafe();

  // Helper to resolve the same variable across providers + common prefix variants.
  // Order: window.__ENV -> process.env -> import.meta.env
  const getAny = (baseName) =>
    firstNonEmpty(
      // window.__ENV supports multiple variants
      win?.[baseName],
      win?.[`REACT_APP_${baseName}`],
      win?.[`VITE_${baseName}`],

      // process.env supports multiple variants
      proc?.[baseName],
      proc?.[`REACT_APP_${baseName}`],
      proc?.[`VITE_${baseName}`],

      // import.meta.env supports multiple variants
      meta?.[baseName],
      meta?.[`REACT_APP_${baseName}`],
      meta?.[`VITE_${baseName}`]
    );

  return {
    apiBase: firstNonEmpty(win?.API_BASE, proc?.REACT_APP_API_BASE, meta?.VITE_API_BASE),
    backendUrl: firstNonEmpty(win?.BACKEND_URL, proc?.REACT_APP_BACKEND_URL, meta?.VITE_BACKEND_URL),
    frontendUrl: firstNonEmpty(win?.FRONTEND_URL, proc?.REACT_APP_FRONTEND_URL, meta?.VITE_FRONTEND_URL),
    wsUrl: firstNonEmpty(win?.WS_URL, proc?.REACT_APP_WS_URL, meta?.VITE_WS_URL),
    nodeEnv: firstNonEmpty(win?.NODE_ENV, proc?.REACT_APP_NODE_ENV, proc?.NODE_ENV, meta?.MODE),
    logLevel: firstNonEmpty(win?.LOG_LEVEL, proc?.REACT_APP_LOG_LEVEL, meta?.VITE_LOG_LEVEL),
    healthcheckPath: firstNonEmpty(win?.HEALTHCHECK_PATH, proc?.REACT_APP_HEALTHCHECK_PATH, meta?.VITE_HEALTHCHECK_PATH),
    featureFlags: firstNonEmpty(win?.FEATURE_FLAGS, proc?.REACT_APP_FEATURE_FLAGS, meta?.VITE_FEATURE_FLAGS),
    experimentsEnabled: firstNonEmpty(
      win?.EXPERIMENTS_ENABLED,
      proc?.REACT_APP_EXPERIMENTS_ENABLED,
      meta?.VITE_EXPERIMENTS_ENABLED
    ),

    // Supabase (support SUPABASE_*, REACT_APP_SUPABASE_*, VITE_SUPABASE_*)
    supabaseUrl: getAny("SUPABASE_URL"),
    supabaseKey: getAny("SUPABASE_KEY")
  };
}
