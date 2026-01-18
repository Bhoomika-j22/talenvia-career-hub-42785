import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { listJobs } from "../services/mockJobs";

/**
 * Home page: Job listings + quick filters (mock).
 */

// PUBLIC_INTERFACE
export function HomePage() {
  /** Home page showing job listings from mock service. */
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  const stats = useMemo(() => {
    const total = jobs.length;
    const remote = jobs.filter((j) => j.location.toLowerCase().includes("remote")).length;
    return { total, remote };
  }, [jobs]);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    listJobs({ query })
      .then((data) => {
        if (!canceled) setJobs(data);
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [query]);

  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">Job Listings</h1>
          <p className="tv-pageSubtitle">
            Discover roles curated for an elegant job search experience. Use search to filter mock listings.
          </p>
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

      <Card
        title="Search"
        subtitle="Try: react, berlin, sql…"
        right={
          <Button variant="ghost" onClick={() => setQuery("")} disabled={!query}>
            Clear
          </Button>
        }
      >
        <input
          className="tv-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, location, or tag…"
          aria-label="Search jobs"
        />
      </Card>

      <div className="tv-grid tv-grid--2">
        {(loading ? Array.from({ length: 2 }).map((_, idx) => ({ id: `loading_${idx}` })) : jobs).map((job) =>
          loading ? (
            <div key={job.id} className="tv-card">
              <div className="tv-card__inner">
                <div className="tv-chip" style={{ width: "fit-content" }}>Loading…</div>
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
                  {job.tags.map((t) => (
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
              {selectedJob.tags.map((t) => (
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
