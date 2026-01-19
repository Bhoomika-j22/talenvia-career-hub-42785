/**
 * Profile persistence service (localStorage-only).
 *
 * This scaffold stores the profile locally in the browser.
 * The API shape matches what the Profile page expects:
 * - loadProfile() -> { profile }
 * - saveProfile(profile) -> { ok: boolean, error?: string }
 */

const STORAGE_KEY = "talenvia.profile.v1";

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

function normalizeLoadedProfile(parsed) {
  return {
    ...DEFAULT_PROFILE,
    ...(parsed || {}),
    skills: Array.isArray(parsed?.skills) ? parsed.skills : [],
    // Drafts are UI-only; always start clean on load.
    skillDraft: ""
  };
}

// PUBLIC_INTERFACE
export async function loadProfile() {
  /**
   * Loads the user's profile from localStorage (best-effort).
   * Returns: { profile }
   */
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { profile: DEFAULT_PROFILE };

    const parsed = safeJsonParse(raw);
    if (!parsed) return { profile: DEFAULT_PROFILE };

    return { profile: normalizeLoadedProfile(parsed) };
  } catch {
    return { profile: DEFAULT_PROFILE };
  }
}

// PUBLIC_INTERFACE
export async function saveProfile(profile) {
  /**
   * Saves the user's profile to localStorage (best-effort).
   * Returns: { ok: boolean, error?: string }
   */
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        photoDataUrl: profile.photoDataUrl || "",
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        email: profile.email || "",
        location: profile.location || "",
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        linkedInUrl: profile.linkedInUrl || "",
        githubUrl: profile.githubUrl || ""
      })
    );
    return { ok: true };
  } catch (e) {
    const msg = e?.message ? String(e.message) : "Failed to save profile.";
    return { ok: false, error: msg };
  }
}
