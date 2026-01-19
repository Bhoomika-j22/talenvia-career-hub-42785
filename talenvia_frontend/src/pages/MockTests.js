import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import {
  clearMockTestHistory,
  formatMockTestLastAttempt,
  listMockTestSummaries,
  recordMockTestAttempt
} from "../services/mockTestsStore";
import { listMockTestsCatalog } from "../services/mockTestsData";

/**
 * Mock tests page with local persistence:
 * - records attempts to localStorage
 * - shows last attempt + scores in UI
 */

const TESTS = listMockTestsCatalog();

function scoreLabel(scoreObj) {
  if (!scoreObj) return "—";
  return `${scoreObj.score}/${scoreObj.maxScore} (${scoreObj.percent}%)`;
}

// PUBLIC_INTERFACE
export function MockTestsPage() {
  /** Mock tests page showing locally persisted attempts. */
  const navigate = useNavigate();
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [uiNonce, setUiNonce] = useState(0); // force refresh after localStorage writes
  const [toast, setToast] = useState("");

  const summaries = useMemo(() => {
    // uiNonce is intentionally included so UI refreshes after record/clear operations.
    void uiNonce;
    return listMockTestSummaries(TESTS.map((t) => t.id));
  }, [uiNonce]);

  const selectedTest = useMemo(() => TESTS.find((t) => t.id === selectedTestId) || null, [selectedTestId]);

  const recent = useMemo(() => {
    // Build a recent activity list from summaries by lastAttempt.
    const rows = TESTS.map((t) => {
      const s = summaries[t.id];
      return {
        id: t.id,
        title: t.title,
        lastAttempt: s?.lastAttempt || null,
        lastScore: s?.lastScore || null,
        bestScore: s?.bestScore || null,
        attemptsCount: s?.attemptsCount || 0
      };
    });

    rows.sort((a, b) => {
      const ta = a.lastAttempt ? Date.parse(a.lastAttempt) : 0;
      const tb = b.lastAttempt ? Date.parse(b.lastAttempt) : 0;
      return tb - ta;
    });

    return rows;
  }, [summaries]);

  const overall = useMemo(() => {
    const attempted = recent.filter((r) => r.attemptsCount > 0);
    if (attempted.length === 0) {
      return { lastScoreLabel: "—", streakLabel: "—", lastAttemptLabel: "—" };
    }

    const mostRecent = attempted[0];
    return {
      lastScoreLabel: scoreLabel(mostRecent.lastScore),
      lastAttemptLabel: formatMockTestLastAttempt(mostRecent.lastAttempt),
      // Simple "streak" placeholder: number of distinct tests attempted.
      streakLabel: `${attempted.length} topic${attempted.length === 1 ? "" : "s"}`
    };
  }, [recent]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const onStartTest = (testId) => {
    const t = TESTS.find((x) => x.id === testId);
    if (!t) return;

    // This scaffold does not implement a real test flow yet.
    // We simulate an attempt for persistence/UI by generating a plausible score.
    const score = Math.max(0, Math.min(t.maxScore, Math.floor(Math.random() * (t.maxScore + 1))));

    const res = recordMockTestAttempt(testId, { score, maxScore: t.maxScore });
    if (!res.ok) {
      showToast(res.error || "Failed to save attempt.");
      return;
    }

    setUiNonce((n) => n + 1);
    showToast(`Saved attempt: ${t.title} • ${score}/${t.maxScore}`);

    // After completion, go to detailed results page for this test.
    navigate(`/mock-tests/${encodeURIComponent(testId)}/results`);
  };

  const onClearAll = () => {
    const res = clearMockTestHistory();
    if (!res?.ok) {
      showToast(res?.error || "Failed to clear history.");
      return;
    }
    setUiNonce((n) => n + 1);
    showToast("Cleared mock test history.");
  };

  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">Mock Tests</h1>
          <p className="tv-pageSubtitle">Practice interview-style questions with timed sessions and feedback (mocked).</p>

          {toast ? (
            <div className="tv-saveNotice" role="status" aria-live="polite">
              {toast}
            </div>
          ) : null}
        </div>

        <div className="tv-row" style={{ justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClearAll} aria-label="Clear mock test history">
            Reset History
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (TESTS.length > 0) setSelectedTestId(TESTS[0].id);
            }}
            disabled={TESTS.length === 0}
            aria-disabled={TESTS.length === 0 ? "true" : "false"}
          >
            Start New Test
          </Button>
        </div>
      </header>

      <div className="tv-grid tv-grid--2">
        <Card title="Recommended" subtitle="Saved locally on this device">
          <div style={{ display: "grid", gap: 10 }}>
            {TESTS.map((t) => {
              const s = summaries[t.id];
              const lastAttempt = s?.lastAttempt ? formatMockTestLastAttempt(s.lastAttempt) : "—";
              const best = scoreLabel(s?.bestScore);

              return (
                <div
                  key={t.id}
                  className="tv-card"
                  style={{
                    border: "1px solid var(--tv-border)",
                    borderRadius: 14,
                    boxShadow: "none"
                  }}
                >
                  <div className="tv-card__inner">
                    <div className="tv-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
                          {t.title} <span className="tv-muted">({t.durationMin} min)</span>
                        </div>

                        <div className="tv-row" style={{ marginTop: 8 }}>
                          <span className="tv-chip">
                            <span aria-hidden="true">🕒</span> Last: <strong>{lastAttempt}</strong>
                          </span>
                          <span className="tv-chip">
                            <span aria-hidden="true">🏅</span> Best: <strong>{best}</strong>
                          </span>
                          <span className="tv-chip">
                            <span aria-hidden="true">🧾</span> Attempts: <strong>{s?.attemptsCount || 0}</strong>
                          </span>
                        </div>
                      </div>

                      <Button variant="primary" onClick={() => navigate(`/mock-tests/${encodeURIComponent(t.id)}/start`)}>
                        Start
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Recent Activity">
          <p className="tv-muted" style={{ marginTop: 0 }}>
            This activity is stored in <code>localStorage</code> for this browser only.
          </p>

          <div className="tv-row" style={{ marginBottom: 10 }}>
            <span className="tv-chip">Last score: {overall.lastScoreLabel}</span>
            <span className="tv-chip">Streak: {overall.streakLabel}</span>
            <span className="tv-chip">Last attempt: {overall.lastAttemptLabel}</span>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {recent.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="tv-card"
                style={{ border: "1px solid var(--tv-border)", borderRadius: 14, boxShadow: "none" }}
              >
                <div className="tv-card__inner">
                  <div className="tv-row" style={{ justifyContent: "space-between" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>{r.title}</div>
                      <div className="tv-row" style={{ marginTop: 8 }}>
                        <span className="tv-chip">
                          <span aria-hidden="true">🕒</span> {formatMockTestLastAttempt(r.lastAttempt)}
                        </span>
                        <span className="tv-chip">
                          <span aria-hidden="true">✅</span> Last: <strong>{scoreLabel(r.lastScore)}</strong>
                        </span>
                        <span className="tv-chip">
                          <span aria-hidden="true">🏅</span> Best: <strong>{scoreLabel(r.bestScore)}</strong>
                        </span>
                      </div>
                    </div>

                    <Button variant="ghost" onClick={() => navigate(`/mock-tests/${encodeURIComponent(r.id)}/start`)}>
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="How it works (preview)">
        <p style={{ marginTop: 0, lineHeight: 1.5 }}>
          Choose a topic, run a timed test, then review solutions and highlight gaps. In this scaffold we keep everything
          local and persist attempts to <strong>localStorage</strong> so you can see your last score and last attempt.
        </p>
      </Card>

      <Modal
        open={!!selectedTest}
        title={selectedTest ? selectedTest.title : "Mock Test"}
        onClose={() => setSelectedTestId(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedTestId(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (selectedTest) onStartTest(selectedTest.id);
              }}
            >
              Start & Save Attempt (Mock)
            </Button>
          </>
        }
      >
        {selectedTest ? (
          <>
            <p className="tv-muted" style={{ marginTop: 0, lineHeight: 1.6 }}>
              Duration: <strong>{selectedTest.durationMin} min</strong> • Max score: <strong>{selectedTest.maxScore}</strong>
            </p>

            {(() => {
              const s = summaries[selectedTest.id];
              return (
                <div className="tv-row" style={{ marginTop: 10 }}>
                  <span className="tv-chip">Attempts: {s?.attemptsCount || 0}</span>
                  <span className="tv-chip">Last: {formatMockTestLastAttempt(s?.lastAttempt || null)}</span>
                  <span className="tv-chip">Last score: {scoreLabel(s?.lastScore)}</span>
                  <span className="tv-chip">Best: {scoreLabel(s?.bestScore)}</span>
                </div>
              );
            })()}

            <p className="tv-muted" style={{ marginTop: 14, lineHeight: 1.6 }}>
              Note: this is a UI scaffold. Clicking “Start & Save Attempt” simulates a test run and persists an attempt
              locally so your dashboard updates.
            </p>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
