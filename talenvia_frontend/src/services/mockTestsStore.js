/**
 * Mock test persistence service (local-only).
 *
 * Stores per-test attempts in localStorage so the Mock Tests UI can show:
 * - lastAttempt timestamp
 * - best score
 * - last score
 * - number of attempts
 *
 * Data model:
 * {
 *   version: 1,
 *   tests: {
 *     [testId]: {
 *       id: string,
 *       attempts: Array<{ score: number, maxScore: number, attemptedAt: string }>
 *     }
 *   }
 * }
 */

const STORAGE_KEY = "talenvia.mockTests.v1";

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clampScore(score, maxScore) {
  const s = Number.isFinite(score) ? score : 0;
  const m = Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 100;
  return {
    score: Math.max(0, Math.min(s, m)),
    maxScore: m
  };
}

function readState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, tests: {} };
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== "object") return { version: 1, tests: {} };
    if (parsed.version !== 1 || typeof parsed.tests !== "object" || !parsed.tests) return { version: 1, tests: {} };
    return parsed;
  } catch {
    return { version: 1, tests: {} };
  }
}

function writeState(next) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { ok: true };
  } catch (e) {
    const msg = e?.message ? String(e.message) : "Failed to write mock tests to localStorage.";
    return { ok: false, error: msg };
  }
}

function isoNow() {
  return new Date().toISOString();
}

function formatRelativeTime(isoString) {
  const v = (isoString || "").trim();
  if (!v) return "—";

  const t = Date.parse(v);
  if (Number.isNaN(t)) return "—";

  const diffMs = Date.now() - t;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 20) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function percent(score, maxScore) {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100);
}

// PUBLIC_INTERFACE
export function getMockTestSummary(testId) {
  /** Returns summary data for a given testId from localStorage attempts. */
  const id = String(testId || "").trim();
  if (!id) {
    return {
      testId: "",
      attemptsCount: 0,
      lastAttempt: null,
      lastScore: null,
      bestScore: null
    };
  }

  const state = readState();
  const entry = state.tests?.[id];
  const attempts = Array.isArray(entry?.attempts) ? entry.attempts : [];

  if (attempts.length === 0) {
    return {
      testId: id,
      attemptsCount: 0,
      lastAttempt: null,
      lastScore: null,
      bestScore: null
    };
  }

  const last = attempts[attempts.length - 1];
  const best = attempts.reduce((acc, a) => {
    if (!acc) return a;
    const accPct = percent(acc.score, acc.maxScore);
    const aPct = percent(a.score, a.maxScore);
    return aPct >= accPct ? a : acc;
  }, null);

  return {
    testId: id,
    attemptsCount: attempts.length,
    lastAttempt: last?.attemptedAt || null,
    lastScore: last ? { score: last.score, maxScore: last.maxScore, percent: percent(last.score, last.maxScore) } : null,
    bestScore: best ? { score: best.score, maxScore: best.maxScore, percent: percent(best.score, best.maxScore) } : null
  };
}

// PUBLIC_INTERFACE
export function listMockTestSummaries(testIds) {
  /** Returns an object mapping testId -> summary. */
  const ids = Array.isArray(testIds) ? testIds : [];
  return ids.reduce((acc, id) => {
    const key = String(id || "").trim();
    if (!key) return acc;
    acc[key] = getMockTestSummary(key);
    return acc;
  }, {});
}

// PUBLIC_INTERFACE
export function recordMockTestAttempt(testId, { score, maxScore } = {}) {
  /** Records a new attempt for testId and persists to localStorage. Returns { ok, error?, summary }. */
  const id = String(testId || "").trim();
  if (!id) return { ok: false, error: "Missing testId." };

  const { score: s, maxScore: m } = clampScore(score, maxScore);

  const state = readState();
  const prev = state.tests?.[id];
  const attempts = Array.isArray(prev?.attempts) ? prev.attempts : [];

  const next = {
    version: 1,
    tests: {
      ...(state.tests || {}),
      [id]: {
        id,
        attempts: [
          ...attempts,
          {
            score: s,
            maxScore: m,
            attemptedAt: isoNow()
          }
        ]
      }
    }
  };

  const res = writeState(next);
  if (!res.ok) return { ok: false, error: res.error || "Failed to save attempt." };

  return { ok: true, summary: getMockTestSummary(id) };
}

// PUBLIC_INTERFACE
export function clearMockTestHistory(testId) {
  /** Clears attempts for a single testId (or all tests if no id provided). */
  const state = readState();

  if (!testId) {
    return writeState({ version: 1, tests: {} });
  }

  const id = String(testId || "").trim();
  if (!id) return { ok: false, error: "Missing testId." };

  const nextTests = { ...(state.tests || {}) };
  delete nextTests[id];

  return writeState({ version: 1, tests: nextTests });
}

// PUBLIC_INTERFACE
export function formatMockTestLastAttempt(lastAttemptIso) {
  /** Formats lastAttempt ISO timestamp into a small relative string for UI. */
  return formatRelativeTime(lastAttemptIso);
}
