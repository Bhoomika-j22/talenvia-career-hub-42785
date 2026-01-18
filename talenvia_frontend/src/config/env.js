/**
 * Bundler-agnostic, browser-safe environment accessor for Talenvia.
 *
 * Primary goal: avoid any unguarded runtime reference to `process` in the browser
 * (or `import.meta` in toolchains that don't support it).
 *
 * Supported env providers (in priority order for Supabase only):
 *  1) window.__ENV?.SUPABASE_URL / window.__ENV?.SUPABASE_KEY (runtime injected)
 *  2) import.meta.env.* (Vite-style)
 *  3) guarded process.env.* (Node/Cra build-time or polyfilled env)
 *
 * Notes:
 * - CRA normally only exposes REACT_APP_* variables; this app also supports
 *   SUPABASE_* and VITE_SUPABASE_* for compatibility with different pipelines.
 * - We NEVER log secrets. maskedDebug() logs only masked snapshots, and only in dev.
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

function getWindowEnvSafe() {
  try {
    if (typeof window !== "undefined" && window && window.__ENV) return window.__ENV;
  } catch {
    // ignore
  }
  return undefined;
}

function maskSecret(value) {
  const v = normalizeString(value);
  if (!v) return undefined;
  if (v.length <= 8) return "****";
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

function isDevLike() {
  // Prefer explicitly set NODE_ENV values; fall back to "localhost-ish" heuristics.
  const meta = getImportMetaEnvSafe();
  const env = getProcessEnvSafe();

  const nodeEnv =
    normalizeString(meta?.MODE) ||
    normalizeString(env?.NODE_ENV) ||
    normalizeString(env?.REACT_APP_NODE_ENV) ||
    normalizeString(env?.VITE_NODE_ENV);

  if (nodeEnv) return nodeEnv !== "production";

  try {
    return typeof window !== "undefined" && !!window?.location?.hostname?.includes("localhost");
  } catch {
    return false;
  }
}

function pickFirstSupabaseProvider() {
  const win = getWindowEnvSafe();
  const meta = getImportMetaEnvSafe();
  const proc = getProcessEnvSafe();

  // 1) window.__ENV
  const wUrl = normalizeString(win?.SUPABASE_URL);
  const wKey = normalizeString(win?.SUPABASE_KEY);
  if (wUrl || wKey) {
    return { SUPABASE_URL: wUrl, SUPABASE_KEY: wKey, source: "window.__ENV" };
  }

  // 2) import.meta.env (prefer VITE_* then non-prefixed)
  const vUrl = normalizeString(meta?.VITE_SUPABASE_URL) || normalizeString(meta?.SUPABASE_URL);
  const vKey = normalizeString(meta?.VITE_SUPABASE_KEY) || normalizeString(meta?.SUPABASE_KEY);
  if (vUrl || vKey) {
    return {
      SUPABASE_URL: vUrl,
      SUPABASE_KEY: vKey,
      source: normalizeString(meta?.VITE_SUPABASE_URL) || normalizeString(meta?.VITE_SUPABASE_KEY) ? "import.meta.env(VITE_*)" : "import.meta.env"
    };
  }

  // 3) guarded process.env (support CRA REACT_APP_* first, then SUPABASE_*, then VITE_*)
  const pUrl =
    normalizeString(proc?.REACT_APP_SUPABASE_URL) ||
    normalizeString(proc?.SUPABASE_URL) ||
    normalizeString(proc?.VITE_SUPABASE_URL);

  const pKey =
    normalizeString(proc?.REACT_APP_SUPABASE_KEY) ||
    normalizeString(proc?.SUPABASE_KEY) ||
    normalizeString(proc?.VITE_SUPABASE_KEY);

  if (pUrl || pKey) {
    return {
      SUPABASE_URL: pUrl,
      SUPABASE_KEY: pKey,
      source: "process.env"
    };
  }

  return { SUPABASE_URL: undefined, SUPABASE_KEY: undefined, source: "none" };
}

// PUBLIC_INTERFACE
export function getEnv() {
  /**
   * Returns normalized env values used by the app.
   *
   * This function is safe to call in any supported toolchain (CRA/Vite/runtime-injected).
   * For Supabase it uses the "first available provider" in the required priority order.
   */
  const proc = getProcessEnvSafe();
  const meta = getImportMetaEnvSafe();
  const supa = pickFirstSupabaseProvider();

  const SUPABASE_URL = normalizeString(supa.SUPABASE_URL);
  const SUPABASE_KEY = normalizeString(supa.SUPABASE_KEY);

  return {
    // Regular app config (best-effort: CRA-style first, then import.meta.env)
    apiBase: normalizeString(proc?.REACT_APP_API_BASE) || normalizeString(meta?.VITE_API_BASE),
    backendUrl: normalizeString(proc?.REACT_APP_BACKEND_URL) || normalizeString(meta?.VITE_BACKEND_URL),
    frontendUrl: normalizeString(proc?.REACT_APP_FRONTEND_URL) || normalizeString(meta?.VITE_FRONTEND_URL),
    wsUrl: normalizeString(proc?.REACT_APP_WS_URL) || normalizeString(meta?.VITE_WS_URL),
    nodeEnv:
      normalizeString(proc?.REACT_APP_NODE_ENV) ||
      normalizeString(proc?.NODE_ENV) ||
      normalizeString(meta?.MODE),
    logLevel: normalizeString(proc?.REACT_APP_LOG_LEVEL) || normalizeString(meta?.VITE_LOG_LEVEL),
    healthcheckPath: normalizeString(proc?.REACT_APP_HEALTHCHECK_PATH) || normalizeString(meta?.VITE_HEALTHCHECK_PATH),
    featureFlags: normalizeString(proc?.REACT_APP_FEATURE_FLAGS) || normalizeString(meta?.VITE_FEATURE_FLAGS),
    experimentsEnabled:
      normalizeString(proc?.REACT_APP_EXPERIMENTS_ENABLED) || normalizeString(meta?.VITE_EXPERIMENTS_ENABLED),

    // Supabase (normalized)
    SUPABASE_URL,
    SUPABASE_KEY,
    source: supa.source
  };
}

const _env = getEnv();

// PUBLIC_INTERFACE
export const SUPABASE_URL = _env.SUPABASE_URL;
/** Supabase anon/public key (never log). */
// PUBLIC_INTERFACE
export const SUPABASE_KEY = _env.SUPABASE_KEY;

// PUBLIC_INTERFACE
export const isSupabaseConfigured = Boolean(isValidUrl(SUPABASE_URL) && normalizeString(SUPABASE_KEY));

// PUBLIC_INTERFACE
export function maskedDebug(extraMessage) {
  /**
   * Logs a safe, single-line snapshot of env detection ONLY in development.
   * Never logs secrets; key is masked and URL is truncated.
   */
  if (!isDevLike()) return;

  const urlSample = SUPABASE_URL ? `${SUPABASE_URL.slice(0, 24)}…` : "—";
  const keyMasked = maskSecret(SUPABASE_KEY) || "—";
  const msg = extraMessage ? ` ${String(extraMessage)}` : "";

  // eslint-disable-next-line no-console
  console.debug(
    `[Env] supabaseConfigured=${isSupabaseConfigured} source=${_env.source} url=${urlSample} key=${keyMasked}${msg}`.trim()
  );
}
