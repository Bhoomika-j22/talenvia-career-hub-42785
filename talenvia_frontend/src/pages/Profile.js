import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";

/**
 * User profile page:
 * - Local-only form state with localStorage persistence (kept as cache/fallback)
 * - Editable avatar (file input + preview)
 * - Skills as removable tags
 * - Professional links with basic URL validation
 * - Save action persists to Supabase tables: profiles, professional_links, skills (when configured + signed in)
 */

const STORAGE_KEY = "talenvia.profile.v1";

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

function isLikelyHttpUrl(value) {
  return value.trim() === "" || value.startsWith("http://") || value.startsWith("https://");
}

function normalizeSkill(s) {
  return s.trim().replace(/\s+/g, " ");
}

function isValidEmailMinimal(value) {
  // Minimal email check (not RFC strict). Good enough for UI gating.
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function trimmedOrEmpty(value) {
  return (value || "").trim();
}

// PUBLIC_INTERFACE
export function ProfilePage() {
  /** Profile page with editable details and local cache + Supabase persistence on Save. */

  const fileInputRef = useRef(null);
  const saveNoticeTimerRef = useRef(null);

  const initialProfile = useMemo(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PROFILE;
      const parsed = JSON.parse(raw);

      // Defensive merge to handle older/partial saved shapes.
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        skills: Array.isArray(parsed?.skills) ? parsed.skills : []
      };
    } catch {
      return DEFAULT_PROFILE;
    }
  }, []);

  const [profile, setProfile] = useState(initialProfile);

  const [saveNotice, setSaveNotice] = useState("");
  const [hasTriedSave, setHasTriedSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Used to render a small inline notice separate from the transient "Saved" pill.
  const [saveBlockingReason, setSaveBlockingReason] = useState(""); // "not_configured" | "not_signed_in" | ""

  // Centralized payload to persist (reused by effect + Save button).
  const persistProfileToLocalStorage = (nextProfile) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          photoDataUrl: nextProfile.photoDataUrl,
          fullName: nextProfile.fullName,
          phone: nextProfile.phone,
          email: nextProfile.email,
          location: nextProfile.location,
          skills: nextProfile.skills,
          linkedInUrl: nextProfile.linkedInUrl,
          githubUrl: nextProfile.githubUrl
        })
      );
    } catch {
      // If storage fails (quota/private mode), we silently continue without persistence.
    }
  };

  // Persist on any state change (cache) so refresh retains changes even if Supabase is unavailable.
  useEffect(() => {
    persistProfileToLocalStorage(profile);
  }, [profile]);

  useEffect(() => {
    // Cleanup save notice timer on unmount.
    return () => {
      if (saveNoticeTimerRef.current) window.clearTimeout(saveNoticeTimerRef.current);
    };
  }, []);

  const linkedInInvalid = !isLikelyHttpUrl(profile.linkedInUrl);
  const githubInvalid = !isLikelyHttpUrl(profile.githubUrl);

  // Required fields validation.
  const fullNameMissing = trimmedOrEmpty(profile.fullName).length === 0;
  const emailInvalid = !isValidEmailMinimal(profile.email);

  // Disable Save when invalid (also respects existing URL invalid states so we never "save" invalid links).
  const isSaveDisabled = fullNameMissing || emailInvalid || linkedInInvalid || githubInvalid;

  const canAddSkill = profile.skillDraft.trim().length > 0;

  const addSkill = () => {
    const next = normalizeSkill(profile.skillDraft);
    if (!next) return;

    // Avoid duplicates (case-insensitive).
    const exists = profile.skills.some((s) => s.toLowerCase() === next.toLowerCase());
    if (exists) {
      setProfile((p) => ({ ...p, skillDraft: "" }));
      return;
    }

    setProfile((p) => ({
      ...p,
      skills: [...p.skills, next],
      skillDraft: ""
    }));
  };

  const removeSkill = (skill) => {
    setProfile((p) => ({
      ...p,
      skills: p.skills.filter((s) => s !== skill)
    }));
  };

  const onPickPhoto = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) return;

    // Convert to data URL for preview + localStorage cache (small images recommended).
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setProfile((p) => ({ ...p, photoDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const showNotice = (message) => {
    setSaveNotice(message);
    if (saveNoticeTimerRef.current) window.clearTimeout(saveNoticeTimerRef.current);
    saveNoticeTimerRef.current = window.setTimeout(() => {
      setSaveNotice("");
    }, 2500);
  };

  const onSave = async () => {
    setHasTriedSave(true);
    setSaveNotice("");
    setSaveBlockingReason("");

    if (isSaveDisabled) {
      // Focus first invalid field for keyboard accessibility.
      if (fullNameMissing) {
        document.getElementById("tvProfileFullName")?.focus?.();
      } else if (emailInvalid) {
        document.getElementById("tvProfileEmail")?.focus?.();
      } else if (linkedInInvalid) {
        document.getElementById("tvLinkedInUrl")?.focus?.();
      } else if (githubInvalid) {
        document.getElementById("tvGithubUrl")?.focus?.();
      }
      return;
    }

    // If Supabase isn't configured, keep local save behavior (no "false negative" here).
    if (!isSupabaseConfigured || !supabase) {
      setSaveBlockingReason("not_configured");
      showNotice("Saved locally.");
      persistProfileToLocalStorage(profile);
      return;
    }

    setIsSaving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      if (!userId) {
        setSaveBlockingReason("not_signed_in");
        showNotice("Cannot save to cloud.");
        return;
      }

      const nowIso = new Date().toISOString();

      // --- Supabase persistence ---
      // 1) Upsert profiles (one row per user, keyed by user_id)
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          full_name: trimmedOrEmpty(profile.fullName),
          email: trimmedOrEmpty(profile.email),
          phone_number: trimmedOrEmpty(profile.phone) || null,
          location: trimmedOrEmpty(profile.location) || null,
          profile_photo_url: trimmedOrEmpty(profile.photoDataUrl) || null,
          updated_at: nowIso
        },
        { onConflict: "user_id" }
      );
      if (profileError) throw profileError;

      // 2) Upsert professional_links (one row per user)
      // Portfolio is not currently in the UI; send null to match schema.
      const { error: linksError } = await supabase.from("professional_links").upsert(
        {
          user_id: userId,
          linkedin_url: trimmedOrEmpty(profile.linkedInUrl) || null,
          github_url: trimmedOrEmpty(profile.githubUrl) || null,
          portfolio_url: null,
          updated_at: nowIso
        },
        { onConflict: "user_id" }
      );
      if (linksError) throw linksError;

      // 3) Sync skills: delete then insert unique skill rows.
      const { error: deleteSkillsError } = await supabase.from("skills").delete().eq("user_id", userId);
      if (deleteSkillsError) throw deleteSkillsError;

      const uniqueSkillNames = Array.from(
        new Set(profile.skills.map((s) => normalizeSkill(s)).filter((s) => !!s).map((s) => s.toLowerCase()))
      ).map((lower) => {
        // Preserve a nice-looking value: use the first matching original skill, otherwise use the lowercase value.
        const original = profile.skills.find((s) => normalizeSkill(s).toLowerCase() === lower) || lower;
        return normalizeSkill(original);
      });

      if (uniqueSkillNames.length > 0) {
        const rows = uniqueSkillNames.map((skillName) => ({
          user_id: userId,
          skill_name: skillName
        }));

        const { error: insertSkillsError } = await supabase.from("skills").insert(rows);
        if (insertSkillsError) throw insertSkillsError;
      }

      // Keep localStorage in sync as a UI cache (optional).
      persistProfileToLocalStorage(profile);

      showNotice("Saved");
    } catch (e) {
      // User-friendly error; avoid leaking internals.
      showNotice("Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">User Profile</h1>
          <p className="tv-pageSubtitle">Manage your personal details, skills, and professional links</p>

          {saveNotice ? (
            <div className="tv-saveNotice" role="status" aria-live="polite">
              {saveNotice}
            </div>
          ) : null}

          {saveBlockingReason === "not_configured" ? (
            <div className="tv-muted tv-small" style={{ marginTop: 10 }}>
              Cloud save is unavailable because Supabase is not configured for this environment. Your changes are stored
              locally in this browser.
            </div>
          ) : null}

          {saveBlockingReason === "not_signed_in" ? (
            <div className="tv-muted tv-small" style={{ marginTop: 10 }}>
              Supabase is configured, but you are not signed in. Sign in to save your profile to the cloud (your changes
              are still stored locally as a cache).
            </div>
          ) : null}
        </div>

        <div className="tv-row tv-profileHeaderActions">
          <Button
            variant="primary"
            onClick={() => {
              // Simple approach: page is always editable; this button can focus the first field.
              const el = document.getElementById("tvProfileFullName");
              el?.focus?.();
            }}
          >
            Edit Profile
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              fileInputRef.current?.click?.();
            }}
          >
            Upload Resume
          </Button>
        </div>
      </header>

      {/* Single continuous section (not multiple cards) */}
      <section className="tv-profileSection" aria-label="Profile details">
        <div className="tv-profileTop">
          <div className="tv-profileAvatarBlock">
            <div className="tv-avatar" aria-label="Profile photo preview">
              {profile.photoDataUrl ? (
                <img className="tv-avatar__img" src={profile.photoDataUrl} alt="Profile" />
              ) : (
                <div className="tv-avatar__placeholder" aria-hidden="true">
                  <span style={{ fontWeight: 800 }}>👤</span>
                </div>
              )}
            </div>

            <div className="tv-row" style={{ gap: 8 }}>
              <Button
                variant="ghost"
                onClick={() => {
                  fileInputRef.current?.click?.();
                }}
              >
                Edit photo
              </Button>

              {profile.photoDataUrl ? (
                <Button
                  variant="danger"
                  onClick={() => {
                    setProfile((p) => ({ ...p, photoDataUrl: "" }));
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </div>

            {/* Hidden file input for photo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onPickPhoto(e.target.files?.[0])}
              aria-label="Upload profile photo"
            />
          </div>

          <div className="tv-profileForm">
            <div className="tv-grid tv-grid--2">
              <div>
                <label className="tv-profileLabel" htmlFor="tvProfileFullName">
                  Full name <span className="tv-muted tv-small">(required)</span>
                </label>
                <input
                  id="tvProfileFullName"
                  className="tv-input"
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="e.g., Jordan Candidate"
                  autoComplete="name"
                  aria-invalid={hasTriedSave && fullNameMissing ? "true" : "false"}
                />
                {hasTriedSave && fullNameMissing ? (
                  <div className="tv-fieldError" role="alert">
                    Full name is required.
                  </div>
                ) : null}
              </div>

              <div>
                <label className="tv-profileLabel" htmlFor="tvProfilePhone">
                  Phone number
                </label>
                <input
                  id="tvProfilePhone"
                  className="tv-input"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g., +1 555 123 4567"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="tv-profileLabel" htmlFor="tvProfileEmail">
                  Email <span className="tv-muted tv-small">(required)</span>
                </label>
                <input
                  id="tvProfileEmail"
                  className="tv-input"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  placeholder="e.g., jordan@email.com"
                  autoComplete="email"
                  aria-invalid={hasTriedSave && emailInvalid ? "true" : "false"}
                />
                {hasTriedSave && emailInvalid ? (
                  <div className="tv-fieldError" role="alert">
                    Please enter a valid email address.
                  </div>
                ) : null}
              </div>

              <div>
                <label className="tv-profileLabel" htmlFor="tvProfileLocation">
                  Location
                </label>
                <input
                  id="tvProfileLocation"
                  className="tv-input"
                  value={profile.location}
                  onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g., Berlin, DE"
                  autoComplete="address-level2"
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="tv-profileDivider" />

        <div className="tv-profileBlock" aria-label="Skills">
          <div className="tv-profileBlock__header">
            <h2 className="tv-profileH2">Skills</h2>
            <p className="tv-muted tv-small" style={{ margin: 0 }}>
              Add your skills and remove them anytime.
            </p>
          </div>

          <div className="tv-profileSkillsRow">
            <div className="tv-profileSkillInput">
              <label className="tv-profileLabel" htmlFor="tvSkillInput">
                Add a skill
              </label>
              <div className="tv-row" style={{ gap: 10, alignItems: "stretch" }}>
                <input
                  id="tvSkillInput"
                  className="tv-input"
                  value={profile.skillDraft}
                  onChange={(e) => setProfile((p) => ({ ...p, skillDraft: e.target.value }))}
                  placeholder="e.g., React"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button variant="primary" onClick={addSkill} disabled={!canAddSkill}>
                  Add
                </Button>
              </div>
            </div>

            <div className="tv-profileTags" aria-label="Skill tags">
              {profile.skills.length === 0 ? (
                <span className="tv-muted tv-small">No skills added yet.</span>
              ) : (
                profile.skills.map((skill) => (
                  <span key={skill} className="tv-chip tv-tag">
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="tv-tag__remove"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      title={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <hr className="tv-profileDivider" />

        <div className="tv-profileBlock" aria-label="Professional links">
          <div className="tv-profileBlock__header">
            <h2 className="tv-profileH2">Professional links</h2>
            <p className="tv-muted tv-small" style={{ margin: 0 }}>
              Use full URLs starting with http:// or https://
            </p>
          </div>

          <div className="tv-grid tv-grid--2">
            <div>
              <label className="tv-profileLabel" htmlFor="tvLinkedInUrl">
                LinkedIn
              </label>
              <input
                id="tvLinkedInUrl"
                className="tv-input"
                type="url"
                value={profile.linkedInUrl}
                onChange={(e) => setProfile((p) => ({ ...p, linkedInUrl: e.target.value }))}
                placeholder="https://www.linkedin.com/in/username"
                aria-invalid={linkedInInvalid ? "true" : "false"}
              />
              {linkedInInvalid ? (
                <div className="tv-fieldError" role="alert">
                  Please enter a valid URL starting with http:// or https://
                </div>
              ) : null}
            </div>

            <div>
              <label className="tv-profileLabel" htmlFor="tvGithubUrl">
                GitHub
              </label>
              <input
                id="tvGithubUrl"
                className="tv-input"
                type="url"
                value={profile.githubUrl}
                onChange={(e) => setProfile((p) => ({ ...p, githubUrl: e.target.value }))}
                placeholder="https://github.com/username"
                aria-invalid={githubInvalid ? "true" : "false"}
              />
              {githubInvalid ? (
                <div className="tv-fieldError" role="alert">
                  Please enter a valid URL starting with http:// or https://
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Save action is last element in the single-section profile editor */}
        <div className="tv-row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={isSaveDisabled || isSaving}
            aria-disabled={isSaveDisabled || isSaving ? "true" : "false"}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </section>
    </div>
  );
}
