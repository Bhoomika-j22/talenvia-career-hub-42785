import { getFirebaseApp, isFirebaseConfigured } from "./firebaseClient";

/**
 * Profile persistence service:
 * - Prefers Firestore when Firebase is configured.
 * - Uses a stable, anonymous client id when Auth isn't present.
 * - Keeps a read-through localStorage cache for migration and offline-ish continuity.
 *
 * Firestore structure (user-scoped):
 * users/{uid}/profile/main
 * users/{uid}/skills/main
 * users/{uid}/professional_links/main
 */

const STORAGE_KEY = "talenvia.profile.v1";
const CLIENT_ID_KEY = "talenvia.client_uuid.v1";

// Keep this shape aligned with Profile.js UI state.
const DEFAULT_PROFILE = {
  photoDataUrl: "",
  fullName: "",
  phone: "",
  email: "",
  location: "",
  skills: [],
  skillDraft: "",
  linkedInUrl: "",
  githubUrl: ""
};

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readLocalCache() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeJsonParse(raw);
    if (!parsed) return null;

    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      skills: Array.isArray(parsed?.skills) ? parsed.skills : []
    };
  } catch {
    return null;
  }
}

function writeLocalCache(profile) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        photoDataUrl: profile.photoDataUrl,
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        location: profile.location,
        skills: profile.skills,
        linkedInUrl: profile.linkedInUrl,
        githubUrl: profile.githubUrl
      })
    );
  } catch {
    // cache is best-effort
  }
}

function generateUuidV4() {
  // Browser-friendly UUIDv4 (crypto when available; otherwise fallback).
  const cryptoObj = typeof crypto !== "undefined" ? crypto : null;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();

  const bytes = cryptoObj?.getRandomValues ? cryptoObj.getRandomValues(new Uint8Array(16)) : null;
  const b = bytes || Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));

  // Per RFC4122 v4
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;

  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Returns a stable user identifier.
 *
 * Notes:
 * - We *prefer* Firebase Auth's `currentUser.uid` when available, but we do not require auth.
 * - This function returns the stable anonymous id; auth uid is resolved separately in `getAuthUserIdIfAvailable`.
 */

// PUBLIC_INTERFACE
export function getStableUserId() {
  /** Returns a stable user identifier (anonymous client UUID persisted in localStorage when available). */
  // Use local persisted client UUID.
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const created = generateUuidV4();
    window.localStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    // As absolute last resort (no storage), generate an ephemeral id for this session.
    return `session_${generateUuidV4()}`;
  }
}

async function getAuthUserIdIfAvailable(app) {
  try {
    const authMod = await import("firebase/auth");
    const auth = authMod.getAuth(app);
    return auth?.currentUser?.uid || null;
  } catch {
    return null;
  }
}

async function getDb(app) {
  const fsMod = await import("firebase/firestore");
  return { db: fsMod.getFirestore(app), fsMod };
}

function normalizeFromFirestore(profileDoc, skillsDoc, linksDoc) {
  const profileData = profileDoc || {};
  const skillsData = skillsDoc || {};
  const linksData = linksDoc || {};

  return {
    ...DEFAULT_PROFILE,
    photoDataUrl: profileData.photoDataUrl || "",
    fullName: profileData.fullName || "",
    phone: profileData.phone || "",
    email: profileData.email || "",
    location: profileData.location || "",
    skills: Array.isArray(skillsData.skills) ? skillsData.skills : [],
    linkedInUrl: linksData.linkedInUrl || "",
    githubUrl: linksData.githubUrl || "",
    // never persist drafts; start blank
    skillDraft: ""
  };
}

// PUBLIC_INTERFACE
export async function loadProfile() {
  /**
   * Loads the user's profile from Firestore if configured, otherwise falls back to local cache.
   * Returns: { profile, source: "firestore"|"cache"|"default", userId }
   */
  const cached = readLocalCache();
  const userIdStable = getStableUserId();

  if (!isFirebaseConfigured()) {
    return { profile: cached || DEFAULT_PROFILE, source: cached ? "cache" : "default", userId: userIdStable };
  }

  const app = await getFirebaseApp();
  if (!app) {
    return { profile: cached || DEFAULT_PROFILE, source: cached ? "cache" : "default", userId: userIdStable };
  }

  const authUid = await getAuthUserIdIfAvailable(app);
  const uid = authUid || userIdStable;

  try {
    const { db, fsMod } = await getDb(app);
    const { doc, getDoc } = fsMod;

    const pRef = doc(db, "users", uid, "profile", "main");
    const sRef = doc(db, "users", uid, "skills", "main");
    const lRef = doc(db, "users", uid, "professional_links", "main");

    const [pSnap, sSnap, lSnap] = await Promise.all([getDoc(pRef), getDoc(sRef), getDoc(lRef)]);

    const next = normalizeFromFirestore(
      pSnap.exists() ? pSnap.data() : null,
      sSnap.exists() ? sSnap.data() : null,
      lSnap.exists() ? lSnap.data() : null
    );

    // Read-through cache (migration/offline convenience).
    writeLocalCache(next);

    // If Firestore empty but local cache exists, optionally seed Firestore on first load.
    // We keep this conservative: only seed when Firestore docs are all missing and cache has meaningful content.
    const firestoreEmpty = !pSnap.exists() && !sSnap.exists() && !lSnap.exists();
    const cacheHasAny =
      !!cached &&
      (cached.fullName ||
        cached.email ||
        cached.phone ||
        cached.location ||
        cached.photoDataUrl ||
        (cached.skills?.length || 0) > 0 ||
        cached.linkedInUrl ||
        cached.githubUrl);

    if (firestoreEmpty && cacheHasAny) {
      // Best-effort background seed; don't block the UI load.
      saveProfile(cached, { uidOverride: uid }).catch(() => {});
      return { profile: { ...cached, skillDraft: "" }, source: "cache", userId: uid };
    }

    return { profile: next, source: "firestore", userId: uid };
  } catch {
    // If Firestore read fails, fall back to cache
    return { profile: cached || DEFAULT_PROFILE, source: cached ? "cache" : "default", userId: uid };
  }
}

// PUBLIC_INTERFACE
export async function saveProfile(profile, { uidOverride } = {}) {
  /**
   * Upserts profile/skills/links into Firestore (when configured) and updates local cache (best-effort).
   * Returns: { ok: boolean, userId: string, error?: string }
   */
  const stable = getStableUserId();

  // Always update cache as a read-through convenience (allowed).
  writeLocalCache(profile);

  if (!isFirebaseConfigured()) {
    return { ok: false, userId: stable, error: "Firebase is not configured." };
  }

  const app = await getFirebaseApp();
  if (!app) {
    return { ok: false, userId: stable, error: "Firebase is not configured." };
  }

  const authUid = await getAuthUserIdIfAvailable(app);
  const uid = uidOverride || authUid || stable;

  try {
    const { db, fsMod } = await getDb(app);
    const { doc, setDoc, serverTimestamp } = fsMod;

    const profilePayload = {
      photoDataUrl: profile.photoDataUrl || "",
      fullName: profile.fullName || "",
      phone: profile.phone || "",
      email: profile.email || "",
      location: profile.location || "",
      updatedAt: serverTimestamp()
    };

    const skillsPayload = {
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      updatedAt: serverTimestamp()
    };

    const linksPayload = {
      linkedInUrl: profile.linkedInUrl || "",
      githubUrl: profile.githubUrl || "",
      updatedAt: serverTimestamp()
    };

    const pRef = doc(db, "users", uid, "profile", "main");
    const sRef = doc(db, "users", uid, "skills", "main");
    const lRef = doc(db, "users", uid, "professional_links", "main");

    await Promise.all([
      setDoc(pRef, profilePayload, { merge: true }),
      setDoc(sRef, skillsPayload, { merge: true }),
      setDoc(lRef, linksPayload, { merge: true })
    ]);

    return { ok: true, userId: uid };
  } catch (e) {
    const msg = e?.message ? String(e.message) : "Failed to save profile.";
    return { ok: false, userId: uid, error: msg };
  }
}
