import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { loadProfile, saveProfile } from "../services/profileStore";

/**
 * User profile page:
 * - Local form state
 * - Loads from Firestore when configured (fallbacks to local cache/default)
 * - Saves via Firestore upsert (with read-through local cache)
 * - Editable avatar (file input + preview)
 * - Skills as removable tags
 * - Professional links with basic URL validation
 *
 * IMPORTANT:
 * - UI text/content is kept intact.
 * - localStorage is no longer the primary persistence layer; it is only used as a read-through cache/migration fallback.
 */

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
  /** Profile page with editable details and Firestore persistence (fallback to cache). */

  const fileInputRef = useRef(null);
  const saveNoticeTimerRef = useRef(null);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const [saveNotice, setSaveNotice] = useState("");
  const [hasTriedSave, setHasTriedSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const linkedInInvalid = !isLikelyHttpUrl(profile.linkedInUrl);
  const githubInvalid = !isLikelyHttpUrl(profile.githubUrl);

  const fullNameMissing = trimmedOrEmpty(profile.fullName).length === 0;
  const emailInvalid = !isValidEmailMinimal(profile.email);

  const isSaveDisabled = fullNameMissing || emailInvalid || linkedInInvalid || githubInvalid;

  const canAddSkill = profile.skillDraft.trim().length > 0;

  useEffect(() => {
    let cancelled = false;

    async function runLoad() {
      setIsLoading(true);
      setLoadError("");
      try {
        const res = await loadProfile();
        if (cancelled) return;
        setProfile(res?.profile ? { ...DEFAULT_PROFILE, ...res.profile } : DEFAULT_PROFILE);
      } catch {
        if (cancelled) return;
        setLoadError("Failed to load profile. Using local data if available.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    runLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveNoticeTimerRef.current) window.clearTimeout(saveNoticeTimerRef.current);
    };
  }, []);

  const addSkill = () => {
    const next = normalizeSkill(profile.skillDraft);
    if (!next) return;

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

    if (isSaveDisabled) {
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

    setIsSaving(true);
    try {
      const res = await saveProfile(profile);

      if (res?.ok) {
        showNotice("Saved");
      } else {
        // Keep UX graceful. Avoid changing existing UI copy beyond this notice.
        showNotice(res?.error ? `Error: ${res.error}` : "Error: Failed to save");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const headerRight = useMemo(() => {
    return (
      <div className="tv-row tv-profileHeaderActions">
        <Button
          variant="primary"
          onClick={() => {
            const el = document.getElementById("tvProfileFullName");
            el?.focus?.();
          }}
        >
          Edit Profile
        </Button>
      </div>
    );
  }, []);

  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">User Profile</h1>
          <p className="tv-pageSubtitle">Manage your personal details, skills, and professional links</p>

          {isLoading ? (
            <div className="tv-saveNotice" role="status" aria-live="polite">
              Loading...
            </div>
          ) : saveNotice ? (
            <div className="tv-saveNotice" role="status" aria-live="polite">
              {saveNotice}
            </div>
          ) : loadError ? (
            <div className="tv-saveNotice" role="status" aria-live="polite">
              {loadError}
            </div>
          ) : null}
        </div>

        {headerRight}
      </header>

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
