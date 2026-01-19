import { getEnv, isValidUrl } from "../config/env";
import { listJobs } from "./mockJobs";

/**
 * Jobs HTTP API service.
 *
 * Requirements:
 * - Read base URL from env (prefer REACT_APP_API_BASE or REACT_APP_BACKEND_URL via getEnv()).
 * - Expose getJobs() for fetching listings.
 * - Keep a graceful fallback to mock data if API URL is missing or request fails.
 *
 * Notes:
 * - This app intentionally keeps search/filtering client-side; getJobs does not send query to backend.
 * - We avoid adding new dependencies; uses native fetch.
 */

function normalizeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((t) => normalizeString(t)).filter(Boolean);
  if (typeof value === "string") {
    // Accept comma-separated tags if backend sends a single string
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function coerceNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computePostedDaysAgoFromDate(dateValue) {
  const v = normalizeString(dateValue);
  if (!v) return null;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return null;
  const diffDays = Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
  return diffDays;
}

function normalizeJob(raw, index) {
  // Target shape must match the existing Home page UI expectations (mockJobs.js).
  const title = normalizeString(raw?.title || raw?.jobTitle || raw?.position);
  const company = normalizeString(raw?.company || raw?.companyName || raw?.employer);
  const location = normalizeString(raw?.location || raw?.city || raw?.workLocation);
  const type = normalizeString(raw?.type || raw?.employmentType || raw?.jobType) || "Full-time";
  const level = normalizeString(raw?.level || raw?.seniority || raw?.experienceLevel) || "—";

  const tags = normalizeTags(raw?.tags || raw?.skills || raw?.keywords);
  const salary = normalizeString(raw?.salary || raw?.compensation || raw?.payRange) || "—";

  const postedDaysAgo =
    coerceNumber(raw?.postedDaysAgo, NaN) ||
    computePostedDaysAgoFromDate(raw?.postedAt || raw?.createdAt || raw?.datePosted) ||
    0;

  const description =
    normalizeString(raw?.description || raw?.summary || raw?.details) || "No description provided.";

  const id =
    normalizeString(raw?.id || raw?._id || raw?.job_id || raw?.jobId) || `api_job_${index + 1}`;

  return {
    id,
    title: title || "Untitled role",
    company: company || "Unknown company",
    location: location || "—",
    type,
    level,
    tags,
    salary,
    postedDaysAgo,
    description
  };
}

function deriveApiBaseUrl() {
  const env = getEnv();
  // Per request: prefer existing REACT_APP_API_BASE, then REACT_APP_BACKEND_URL
  const base = env?.apiBase || env?.backendUrl;
  if (!isValidUrl(base)) return undefined;
  return base.replace(/\/+$/, "");
}

function buildJobsUrl(apiBase) {
  // Conservative default endpoint. If backend differs, set REACT_APP_API_BASE to include full path,
  // or keep it at root and implement /jobs in backend.
  // Example: https://api.example.com/jobs
  return `${apiBase}/jobs`;
}

async function fetchJobsFromApi(apiBase) {
  const url = buildJobsUrl(apiBase);

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Jobs request failed (${res.status}). ${text ? `Response: ${text}` : ""}`.trim());
  }

  const payload = await res.json().catch(() => null);

  // Accept multiple common shapes:
  // - array of jobs
  // - { jobs: [...] }
  // - { data: [...] }
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.jobs) ? payload.jobs : Array.isArray(payload?.data) ? payload.data : null;

  if (!Array.isArray(list)) {
    throw new Error("Jobs response shape was not recognized (expected an array).");
  }

  return list.map((j, idx) => normalizeJob(j, idx));
}

// PUBLIC_INTERFACE
export async function getJobs() {
  /**
   * Fetches job listings.
   *
   * Returns:
   * - { jobs: Array<Job>, source: "api" | "mock", usedFallback: boolean, error?: string }
   *
   * Behavior:
   * - If API base URL missing/invalid -> returns mock data.
   * - If API request fails -> returns mock data AND exposes error message.
   */
  const apiBase = deriveApiBaseUrl();

  if (!apiBase) {
    const jobs = await listJobs({ query: "" });
    return { jobs, source: "mock", usedFallback: true, error: "API base URL is not configured." };
  }

  try {
    const jobs = await fetchJobsFromApi(apiBase);
    return { jobs, source: "api", usedFallback: false };
  } catch (e) {
    const jobs = await listJobs({ query: "" });
    const msg = e?.message ? String(e.message) : "Failed to fetch jobs from API.";
    return { jobs, source: "mock", usedFallback: true, error: msg };
  }
}
