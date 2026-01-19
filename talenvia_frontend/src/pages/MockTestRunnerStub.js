import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { recordMockTestAttempt } from "../services/mockTestsStore";
import { listMockTestsCatalog } from "../services/mockTestsData";

/**
 * Lightweight mock test "runner" stub.
 * This scaffold does not implement a full test-taking flow; this page exists
 * to demonstrate the navigation to Results while using the existing localStorage store.
 */

const TEST_CATALOG = listMockTestsCatalog();

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function generatePlausibleScore(maxScore) {
  const m = Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 10;
  // Slightly biased to "not terrible" so UI feels realistic, still random.
  const raw = Math.round((0.35 + Math.random() * 0.65) * m);
  return clamp(raw, 0, m);
}

// PUBLIC_INTERFACE
export function MockTestRunnerStubPage() {
  /** Simulated test runner to record an attempt and navigate to results. */
  const { id } = useParams();
  const navigate = useNavigate();

  const testMeta = useMemo(() => TEST_CATALOG.find((t) => t.id === id) || null, [id]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!id) navigate("/mock-tests");
  }, [id, navigate]);

  const onComplete = () => {
    const maxScore = testMeta?.maxScore ?? 10;
    const score = generatePlausibleScore(maxScore);

    const res = recordMockTestAttempt(id, { score, maxScore });
    if (!res.ok) {
      setToast(res.error || "Failed to save attempt.");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }

    navigate(`/mock-tests/${encodeURIComponent(id)}/results`);
  };

  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div style={{ minWidth: 0 }}>
          <h1 className="tv-pageTitle">{testMeta?.title || "Mock Test"}</h1>
          <p className="tv-pageSubtitle">
            This is a lightweight test flow stub. Click “Complete” to simulate a finished attempt and open the Results page.
          </p>
          {toast ? (
            <div className="tv-saveNotice" role="status" aria-live="polite">
              {toast}
            </div>
          ) : null}
        </div>

        <div className="tv-row" style={{ justifyContent: "flex-end" }}>
          <Button as={NavLink} to="/mock-tests" variant="ghost">
            Back
          </Button>
          <Button variant="primary" onClick={onComplete}>
            Complete (Simulate)
          </Button>
        </div>
      </header>

      <Card title="Session overview" subtitle="A demonstration-only flow; no real questions are shown.">
        <div className="tv-row" style={{ marginBottom: 10 }}>
          <span className="tv-chip">
            <span aria-hidden="true">🧾</span> Test id: <strong>{id || "—"}</strong>
          </span>
          <span className="tv-chip">
            <span aria-hidden="true">⏱️</span> Duration: <strong>{testMeta?.durationMin ?? "—"} min</strong>
          </span>
          <span className="tv-chip">
            <span aria-hidden="true">🎯</span> Max score: <strong>{testMeta?.maxScore ?? "—"}</strong>
          </span>
        </div>

        <div
          className="tv-card"
          style={{
            border: "1px solid var(--tv-border)",
            borderRadius: 14,
            boxShadow: "none",
            background: "rgba(255,255,255,0.80)"
          }}
        >
          <div className="tv-card__inner">
            <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>How this stub works</div>
            <p className="tv-muted" style={{ margin: "6px 0 0", lineHeight: 1.65 }}>
              On completion, we record an attempt into <code>localStorage</code> using <code>recordMockTestAttempt</code> and
              navigate to <code>/mock-tests/:id/results</code>. This demonstrates the detailed Results page without changing
              the existing mock data model.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
