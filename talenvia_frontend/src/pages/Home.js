import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useJobsSearch } from "../context/JobsSearchContext";
import { getJobs } from "../services/jobsApi";

/**
 * Home page: Job listings + quick filters.
 *
 * Now connected to an HTTP API (with graceful mock fallback).
 * Search remains client-side using the shared JobsSearchContext query.
 */

// PUBLIC_INTERFACE
export function HomePage() {
  /** Home page showing job listings from API (fallback to mock). */
  const { searchInput, setSearchInput, query, clear } = useJobsSearch();

  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Non-blocking messaging: if we fall back to mock, show a subtle notice.
  const [loadMessage, setLoadMessage] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    let canceled = false;

    async function run() {
      setLoading(true);
      setLoadMessage("");

      try {
        const res = await getJobs();
        if (canceled) return;

        setAllJobs(Array.isArray(res?.jobs) ? res.jobs : []);

        if (res?.usedFallback) {
          // Keep it subtle; do not block the UI or remove mock behavior.
          setLoadMessage(res?.error ? `Showing mock jobs: ${res.error}` : "Showing mock jobs (API unavailable).");
        } else {
          // Optional small status that API is used; keep quiet to avoid noise.
          setLoadMessage("");
        }
      } catch (e) {
        // Should be rare because getJobs already falls back, but keep resilient.
        if (canceled) return;
        setAllJobs([]);
        setLoadMessage(e?.message ? String(e.message) : "Failed to load jobs.");
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    run();

    return () => {
      canceled = true;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allJobs;

    return allJobs.filter((j) => {
      const hay = `${j.title} ${j.company} ${j.location} ${(j.tags || []).join(" ")} ${j.type} ${j.level}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allJobs, query]);

  const stats = useMemo(() => {
    const total = filteredJobs.length;
    const remote = filteredJobs.filter((j) => String(j.location || "").toLowerCase().includes("remote")).length;
    return { total, remote };
  }, [filteredJobs]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div style={{ minWidth: 0 }}>
          <h1 className="tv-pageTitle">Job Listings</h1>
          <p className="tv-pageSubtitle">
            Discover roles curated for an elegant job search experience. Use search to filter listings.
          </p>

          {loadMessage ? (
            <div className="tv-saveNotice" role="status" aria-live="polite">
              {loadMessage}
            </div>
          ) : null}

          {/* Search is intentionally placed in the header area above listings (per request). */}
          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="tvHomeJobSearch"
              className="tv-small"
              style={{ display: "block", fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6 }}
            >
              Search jobs
            </label>

            <div className="tv-row" style={{ gap: 10, alignItems: "stretch" }}>
              <input
                id="tvHomeJobSearch"
                className="tv-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, company, location, or tag…"
                autoComplete="off"
                inputMode="search"
              />

              <Button
                variant="ghost"
                onClick={clear}
                disabled={!searchInput && !query}
                aria-disabled={!searchInput && !query ? "true" : "false"}
              >
                Clear
              </Button>
            </div>

            <div className="tv-muted tv-small" style={{ marginTop: 8 }}>
              {hasQuery ? (
                <span role="status" aria-live="polite">
                  Showing results for <strong>{query.trim()}</strong>
                </span>
              ) : (
                <span>Tip: try “react”, “berlin”, “sql”…</span>
              )}
            </div>
          </div>
        </div>

        <div className="tv-row">
          <span className="tv-chip">
            <span aria-hidden="true">📌</span> Total: <strong>{stats.total}</strong>
          </span>
          <span className="tv-chip">
            <span aria-hidden="true">🌍</span> Remote: <strong>{stats.remote}</strong>
          </span>
        </div>
      </header>

      <div className="tv-grid tv-grid--2" aria-label="Job results">
        {(loading ? Array.from({ length: 2 }).map((_, idx) => ({ id: `loading_${idx}` })) : filteredJobs).map((job) =>
          loading ? (
            <div key={job.id} className="tv-card">
              <div className="tv-card__inner">
                <div className="tv-chip" style={{ width: "fit-content" }}>
                  Loading…
                </div>
                <div style={{ height: 10 }} />
                <div style={{ height: 16, background: "rgba(55,65,81,0.10)", borderRadius: 8, width: "70%" }} />
                <div style={{ height: 10 }} />
                <div style={{ height: 12, background: "rgba(55,65,81,0.08)", borderRadius: 8, width: "55%" }} />
              </div>
            </div>
          ) : (
            <article key={job.id} className="tv-card">
              <div className="tv-card__inner">
                <div className="tv-row" style={{ justifyContent: "space-between" }}>
                  <span className="tv-chip">
                    <span aria-hidden="true">⏱️</span> {job.postedDaysAgo}d ago
                  </span>
                  <span className="tv-chip">
                    <span aria-hidden="true">💼</span> {job.type}
                  </span>
                </div>

                <h3 style={{ margin: "10px 0 4px", letterSpacing: "-0.02em" }}>{job.title}</h3>
                <p className="tv-muted" style={{ margin: "0 0 10px" }}>
                  <strong>{job.company}</strong> • {job.location} • {job.level}
                </p>

                <div className="tv-row" style={{ marginBottom: 10 }}>
                  {(job.tags || []).map((t) => (
                    <span key={t} className="tv-chip">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="tv-row" style={{ justifyContent: "space-between" }}>
                  <span className="tv-chip">
                    <span aria-hidden="true">💰</span> {job.salary}
                  </span>
                  <Button variant="primary" onClick={() => setSelectedJob(job)}>
                    View
                  </Button>
                </div>
              </div>
            </article>
          )
        )}
      </div>

      {!loading && filteredJobs.length === 0 ? (
        <div className="tv-card" role="status" aria-live="polite">
          <div className="tv-card__inner">
            <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>No results</div>
            <p className="tv-muted" style={{ margin: "6px 0 0", lineHeight: 1.6 }}>
              Try a different keyword, or clear the search to see all listings.
            </p>
          </div>
        </div>
      ) : null}

      <Modal
        open={!!selectedJob}
        title={selectedJob ? selectedJob.title : "Job details"}
        onClose={() => setSelectedJob(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedJob(null)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setSelectedJob(null)}>
              Save (Mock)
            </Button>
          </>
        }
      >
        {selectedJob ? (
          <>
            <p style={{ marginTop: 0 }} className="tv-muted">
              <strong>{selectedJob.company}</strong> • {selectedJob.location} • {selectedJob.type} • {selectedJob.level}
            </p>
            <div className="tv-row" style={{ marginBottom: 10 }}>
              {(selectedJob.tags || []).map((t) => (
                <span key={t} className="tv-chip">
                  {t}
                </span>
              ))}
            </div>
            <p style={{ lineHeight: 1.5 }}>{selectedJob.description}</p>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
