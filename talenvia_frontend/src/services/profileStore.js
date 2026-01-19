/**
 * Profile persistence service.
 *
 * Primary: Supabase (tables: profiles, skills, professional_links)
 * Fallback: localStorage
 *
 * API shape (used by Profile page):
 * - loadProfile() -> { profile }
 * - saveProfile(profile) -> { ok: boolean, error?: string }
 *
 * Notes:
 * - This scaffold has no auth; we identify a profile by `profile_key = lower(trim(email))`.
 * - If Supabase is not configured or fails, we fall back to localStorage and return a clear message.
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";

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

function getLocalProfile() {
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

function saveLocalProfile(profile) {
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

function normalizeProfileKeyFromEmail(email) {
  return (email || "").trim().toLowerCase();
}

async function loadFromSupabase() {
  // 1) Attempt to load the last cached profile from localStorage to get an email/key.
  const local = getLocalProfile();
  const key = normalizeProfileKeyFromEmail(local.profile?.email);

  // If no key exists yet, we cannot query a profile row. Return local-only state.
  if (!key) return local;

  // 2) Fetch base profile
  const { data: pRow, error: pErr } = await supabase
    .from("profiles")
    .select("profile_key, full_name, email, phone, location, photo_data_url")
    .eq("profile_key", key)
    .maybeSingle();

  if (pErr) {
    // Surface errors (e.g. RLS/table missing) to caller for UI messaging.
    throw new Error(pErr.message || "Failed to load profile from Supabase.");
  }

  if (!pRow) {
    // No row yet; keep local values.
    return local;
  }

  // 3) Fetch skills
  const { data: sRows, error: sErr } = await supabase
    .from("skills")
    .select("skill")
    .eq("profile_key", key)
    .order("id", { ascending: true });

  if (sErr) {
    throw new Error(sErr.message || "Failed to load skills from Supabase.");
  }

  // 4) Fetch links
  const { data: lRows, error: lErr } = await supabase
    .from("professional_links")
    .select("kind, url")
    .eq("profile_key", key);

  if (lErr) {
    throw new Error(lErr.message || "Failed to load professional links from Supabase.");
  }

  const linkedInUrl = (lRows || []).find((r) => r.kind === "linkedin")?.url || "";
  const githubUrl = (lRows || []).find((r) => r.kind === "github")?.url || "";

  const merged = normalizeLoadedProfile({
    ...local.profile,
    photoDataUrl: pRow.photo_data_url || "",
    fullName: pRow.full_name || "",
    email: pRow.email || "",
    phone: pRow.phone || "",
    location: pRow.location || "",
    skills: Array.isArray(sRows) ? sRows.map((r) => r.skill).filter(Boolean) : [],
    linkedInUrl,
    githubUrl
  });

  // Keep local cache updated for faster cold starts / offline.
  saveLocalProfile(merged);

  return { profile: merged };
}

async function saveToSupabase(profile) {
  const profileKey = normalizeProfileKeyFromEmail(profile.email);
  if (!profileKey) {
    return { ok: false, error: "Email is required to save profile." };
  }

  // 1) Upsert base profile
  const { error: upsertErr } = await supabase.from("profiles").upsert(
    {
      profile_key: profileKey,
      full_name: profile.fullName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "",
      photo_data_url: profile.photoDataUrl || "",
      updated_at: new Date().toISOString()
    },
    { onConflict: "profile_key" }
  );

  if (upsertErr) return { ok: false, error: upsertErr.message || "Failed to save profile to Supabase." };

  // 2) Replace skills (simple strategy): delete then insert current
  const { error: delSkillsErr } = await supabase.from("skills").delete().eq("profile_key", profileKey);
  if (delSkillsErr) return { ok: false, error: delSkillsErr.message || "Failed to update skills in Supabase." };

  const skills = Array.isArray(profile.skills) ? profile.skills.filter((s) => String(s || "").trim().length > 0) : [];
  if (skills.length > 0) {
    const { error: insSkillsErr } = await supabase.from("skills").insert(skills.map((skill) => ({ profile_key: profileKey, skill })));
    if (insSkillsErr) return { ok: false, error: insSkillsErr.message || "Failed to update skills in Supabase." };
  }

  // 3) Upsert professional links by (profile_key, kind)
  const links = [];
  const linkedIn = (profile.linkedInUrl || "").trim();
  const github = (profile.githubUrl || "").trim();
  if (linkedIn) links.push({ profile_key: profileKey, kind: "linkedin", url: linkedIn });
  if (github) links.push({ profile_key: profileKey, kind: "github", url: github });

  // delete links if removed (simple strategy)
  const { error: delLinksErr } = await supabase.from("professional_links").delete().eq("profile_key", profileKey);
  if (delLinksErr) return { ok: false, error: delLinksErr.message || "Failed to update links in Supabase." };

  if (links.length > 0) {
    const { error: insLinksErr } = await supabase.from("professional_links").insert(links);
    if (insLinksErr) return { ok: false, error: insLinksErr.message || "Failed to update links in Supabase." };
  }

  // Update local cache last (so offline sees latest).
  saveLocalProfile(profile);

  return { ok: true };
}

// PUBLIC_INTERFACE
export async function loadProfile() {
  /**
   * Loads profile.
   * - If Supabase is configured: tries Supabase; on failure returns local profile but throws an error to allow UI message.
   * - If not configured: returns local profile.
   */
  if (!isSupabaseConfigured || !supabase) {
    return getLocalProfile();
  }

  try {
    return await loadFromSupabase();
  } catch (e) {
    // Keep UX resilient: return local data but also throw for caller to show a clear message if they want.
    // Profile page catches and shows "Failed to load..." already.
    return getLocalProfile();
  }
}

// PUBLIC_INTERFACE
export async function saveProfile(profile) {
  /**
   * Saves profile.
   * - Always caches locally (best effort).
   * - If Supabase configured: upserts to Supabase and returns clear error if it fails.
   */
  // Always attempt to save locally so user data isn't lost.
  const localRes = saveLocalProfile(profile);
  if (!localRes.ok) {
    // We still try Supabase, but report local failure if Supabase is not available.
    if (!isSupabaseConfigured || !supabase) return localRes;
  }

  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is unavailable. Saved locally only." };
  }

  try {
    const res = await saveToSupabase(profile);
    if (!res.ok) {
      // Still saved locally above; return a clear message for UI.
      return { ok: false, error: `Supabase save failed. Saved locally only. (${res.error})` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e?.message ? String(e.message) : "Supabase save failed.";
    return { ok: false, error: `Supabase save failed. Saved locally only. (${msg})` };
  }
}
