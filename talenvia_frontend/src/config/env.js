/**
 * Bundler-agnostic, browser-safe environment accessor for Talenvia.
 *
 * Primary goal: avoid any unguarded runtime reference to `process` in the browser
 * (or `import.meta` in toolchains that don't support it).
 *
 * Supported env providers:
 *  1) import.meta.env.* (Vite-style) via guarded access
 *  2) guarded process.env.* (CRA build-time or polyfilled env)
 */

function normalizeString(value) {
  if (value == null) return undefined;
  const v = String(value).trim();
  return v.length ? v : undefined;
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

// PUBLIC_INTERFACE
export function getEnv() {
  /**
   * Returns normalized env values used by the app.
   *
   * This function is safe to call in supported toolchains (CRA/Vite).
   */
  const proc = getProcessEnvSafe();
  const meta = getImportMetaEnvSafe();

  return {
    apiBase: normalizeString(proc?.REACT_APP_API_BASE) || normalizeString(meta?.VITE_API_BASE),
    backendUrl: normalizeString(proc?.REACT_APP_BACKEND_URL) || normalizeString(meta?.VITE_BACKEND_URL),
    frontendUrl: normalizeString(proc?.REACT_APP_FRONTEND_URL) || normalizeString(meta?.VITE_FRONTEND_URL),
    wsUrl: normalizeString(proc?.REACT_APP_WS_URL) || normalizeString(meta?.VITE_WS_URL),
    nodeEnv: normalizeString(proc?.REACT_APP_NODE_ENV) || normalizeString(proc?.NODE_ENV) || normalizeString(meta?.MODE),
    logLevel: normalizeString(proc?.REACT_APP_LOG_LEVEL) || normalizeString(meta?.VITE_LOG_LEVEL),
    healthcheckPath: normalizeString(proc?.REACT_APP_HEALTHCHECK_PATH) || normalizeString(meta?.VITE_HEALTHCHECK_PATH),
    featureFlags: normalizeString(proc?.REACT_APP_FEATURE_FLAGS) || normalizeString(meta?.VITE_FEATURE_FLAGS),
    experimentsEnabled:
      normalizeString(proc?.REACT_APP_EXPERIMENTS_ENABLED) || normalizeString(meta?.VITE_EXPERIMENTS_ENABLED)
  };
}
