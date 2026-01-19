import { getEnv } from "../config/env";

/**
 * Firebase client initializer for the Talenvia frontend.
 *
 * NOTE:
 * - This file intentionally does not change application behavior.
 * - It is safe to import; it will only initialize Firebase when `getFirebaseApp()` is called.
 * - Future features (Auth/Storage/Analytics) should use this module.
 */

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function buildFirebaseConfigFromEnv(env) {
  // Firebase config keys follow the Web SDK naming.
  return {
    apiKey: env.firebaseApiKey,
    authDomain: env.firebaseAuthDomain,
    projectId: env.firebaseProjectId,
    storageBucket: env.firebaseStorageBucket,
    messagingSenderId: env.firebaseMessagingSenderId,
    appId: env.firebaseAppId,
    measurementId: env.firebaseMeasurementId
  };
}

function isFirebaseConfigComplete(cfg) {
  // These are the minimum keys required for most Firebase Web SDK usage.
  return (
    isNonEmptyString(cfg.apiKey) &&
    isNonEmptyString(cfg.authDomain) &&
    isNonEmptyString(cfg.projectId) &&
    isNonEmptyString(cfg.appId)
  );
}

let _app = null;
let _firebaseModule = null;

// PUBLIC_INTERFACE
export function getFirebaseConfig() {
  /** Returns the Firebase web app configuration derived from environment variables. */
  const env = getEnv();
  return buildFirebaseConfigFromEnv(env);
}

// PUBLIC_INTERFACE
export function isFirebaseConfigured() {
  /** True if required Firebase env vars are present. */
  const cfg = getFirebaseConfig();
  return isFirebaseConfigComplete(cfg);
}

// PUBLIC_INTERFACE
export async function getFirebaseApp() {
  /**
   * Lazily initializes and returns the Firebase App singleton.
   *
   * Returns:
   * - Firebase App instance when configured
   * - null when Firebase env vars are missing/incomplete
   */
  if (_app) return _app;

  const cfg = getFirebaseConfig();
  if (!isFirebaseConfigComplete(cfg)) return null;

  // Dynamic import keeps bundle impact low and avoids changing app behavior until used.
  if (!_firebaseModule) {
    _firebaseModule = await import("firebase/app");
  }

  const { initializeApp, getApps } = _firebaseModule;

  // Reuse existing app if already initialized elsewhere.
  const apps = getApps();
  _app = apps.length ? apps[0] : initializeApp(cfg);

  return _app;
}
