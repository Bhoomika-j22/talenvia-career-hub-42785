/**
 * Centralized environment accessor.
 * CRA only exposes env vars prefixed with REACT_APP_.
 */

// PUBLIC_INTERFACE
export function getEnv() {
  /** Returns normalized env values used by the app. */
  return {
    apiBase: process.env.REACT_APP_API_BASE,
    backendUrl: process.env.REACT_APP_BACKEND_URL,
    frontendUrl: process.env.REACT_APP_FRONTEND_URL,
    wsUrl: process.env.REACT_APP_WS_URL,
    nodeEnv: process.env.REACT_APP_NODE_ENV,
    logLevel: process.env.REACT_APP_LOG_LEVEL,
    healthcheckPath: process.env.REACT_APP_HEALTHCHECK_PATH,
    featureFlags: process.env.REACT_APP_FEATURE_FLAGS,
    experimentsEnabled: process.env.REACT_APP_EXPERIMENTS_ENABLED,

    // Note: CRA typically exposes only REACT_APP_* env vars at build time.
    // This project may have custom env injection; we read SUPABASE_* as requested.
    // Values can be undefined in local/dev (UI should still run).
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY
  };
}
