import { listJobs } from "./mockJobs";

/**
 * Jobs HTTP API service (Arbeitnow public job board).
 *
 * Requirements:
 * - Fetch from https://api.arbeitnow.com/api/job-board-api (no API key).
 * - Handle pagination if available (initial page only).
 * - Normalize jobs to at least: { id, title, company, location, tags, url }.
 * - Keep Home.js usage unchanged: it calls getJobs() and expects { jobs, usedFallback } shape.
 * - Provide graceful fallback to existing mock data on network/error.
 *
 * Notes:
 * - Search/filtering remains client-side; we do not send the query to Arbeitnow.
 * - We avoid adding new dependencies; uses native fetch.
 */

const ARBEITNOW_BASE_URL = "https://api.arbeitnow.com/api/job-board-api";

function normalizeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((t) => normalizeString(t)).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function computePostedDaysAgoFromDate(dateValue) {
  const v = normalizeString(dateValue);
  if (!v) return 0;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
}

function buildArbeitnowUrl({ page } = {}) {
  // Arbeitnow supports pagination via ?page=... (based on their documented response fields).
  // Per request, we only fetch the initial page (page 1).
  const url = new URL(ARBEITNOW_BASE_URL);
  if (page != null) url.searchParams.set("page", String(page));
  return url.toString();
}

function normalizeArbeitnowJob(raw, index) {
  const id = normalizeString(raw?.slug || raw?.id) || `arbeitnow_job_${index + 1}`;

  const title = normalizeString(raw?.title) || "Untitled role";
  const company = normalizeString(raw?.company_name) || "Unknown company";
  const location = normalizeString(raw?.location) || "—";

  const tags = normalizeTags(raw?.tags);

  // Arbeitnow provides a direct URL and also a "slug". Prefer url if present.
  const url = normalizeString(raw?.url);

  // Keep extra fields used by current UI cards/modal (backwards compatible)
  const type = "Full-time"; // Arbeitnow doesn't reliably provide this; keep a harmless default
  const level = "—"; // Not provided; keep placeholder
  const salary = "—"; // Not provided
  const postedDaysAgo = computePostedDaysAgoFromDate(raw?.created_at);

  // API provides rich HTML in description. UI currently renders plain text.
  // We keep it as a string; consumers can choose to sanitize/strip if needed later.
  const description =
    normalizeString(raw?.description) || "No description provided.";

  return {
    // Required normalized fields
    id,
    title,
    company,
    location,
    tags,
    url,

    // Existing UI expectations
    type,
    level,
    salary,
    postedDaysAgo,
    description
  };
}

async function fetchJobsFromArbeitnowInitialPage() {
  const url = buildArbeitnowUrl({ page: 1 });

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Arbeitnow request failed (${res.status}). ${text ? `Response: ${text}` : ""}`.trim());
  }

  const payload = await res.json().catch(() => null);

  // Arbeitnow response shape (documented) includes:
  // { data: [...], links: {...}, meta: {...} }
  const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : null;

  if (!Array.isArray(list)) {
    throw new Error("Arbeitnow response shape was not recognized (expected payload.data array).");
  }

  return list.map((j, idx) => normalizeArbeitnowJob(j, idx));
}

// PUBLIC_INTERFACE
export async function getJobs() {
  /**
   * Fetches job listings from Arbeitnow (initial page only).
   *
   * Returns:
   * - { jobs: Array<Job>, source: "api" | "mock", usedFallback: boolean, error?: string }
   *
   * Behavior:
   * - If Arbeitnow request fails (network/CORS/shape) -> returns mock data and exposes error message.
   */
  try {
    const jobs = await fetchJobsFromArbeitnowInitialPage();
    return { jobs, source: "api", usedFallback: false };
  } catch (e) {
    const jobs = await listJobs({ query: "" });
    const msg = e?.message ? String(e.message) : "Failed to fetch jobs from Arbeitnow.";
    return { jobs, source: "mock", usedFallback: true, error: msg };
  }
}
