import React, { useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { getMockTestSummary, formatMockTestLastAttempt } from "../services/mockTestsStore";
import { listMockTestsCatalog } from "../services/mockTestsData";

/**
 * Detailed mock test results page.
 * Reads attempt summary from localStorage-backed mockTestsStore by test id.
 */

const TEST_CATALOG = listMockTestsCatalog();

function safePercent(score, maxScore) {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100);
}

function formatDateTime(isoString) {
  const v = String(isoString || "").trim();
  if (!v) return "—";
  const t = Date.parse(v);
  if (Number.isNaN(t)) return "—";
  try {
    return new Date(t).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return v;
  }
}

function buildShareText({ title, score, maxScore, percent, attemptedAtIso }) {
  const lines = [
    `Talenvia Mock Test Results`,
    `Test: ${title}`,
    `Score: ${score}/${maxScore} (${percent}%)`,
    attemptedAtIso ? `Attempted: ${formatDateTime(attemptedAtIso)}` : null
  ].filter(Boolean);
  return lines.join("\n");
}

// PUBLIC_INTERFACE
export function MockTestResultsPage() {
  /** Shows the latest attempt summary for a given mock test id from localStorage. */
  const { id } = useParams();
  const navigate = useNavigate();

  const [copyStatus, setCopyStatus] = useState("");

  const testMeta = useMemo(() => TEST_CATALOG.find((t) => t.id === id) || null, [id]);

  const summary = useMemo(() => getMockTestSummary(id), [id]);

  const lastScore = summary?.lastScore;
  const bestScore = summary?.bestScore;

  const score = Number.isFinite(lastScore?.score) ? lastScore.score : 0;
  const maxScore =
    Number.isFinite(lastScore?.maxScore) && lastScore.maxScore > 0
      ? lastScore.maxScore
      : Number.isFinite(testMeta?.maxScore)
        ? testMeta.maxScore
        : 100;

  const percent = safePercent(score, maxScore);

  const hasAttempts = (summary?.attemptsCount || 0) > 0;

  const title = testMeta?.title || `Mock Test: ${id || "Unknown"}`;
  const attemptedAtIso = summary?.lastAttempt || null;

  const shareText = useMemo(
    () =>
      buildShareText({
        title,
        score,
        maxScore,
        percent,
        attemptedAtIso
      }),
    [title, score, maxScore, percent, attemptedAtIso]
  );

  const onCopy = async () => {
    setCopyStatus("");
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setCopyStatus("Copied to clipboard.");
      } else {
        // Best-effort fallback: select text via prompt
        window.prompt("Copy your results:", shareText);
        setCopyStatus("Copy prompt opened.");
      }
    } catch {
      window.prompt("Copy your results:", shareText);
      setCopyStatus("Copy prompt opened.");
    } finally {
      window.setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  const onShare = async () => {
    setCopyStatus("");
    try {
      if (navigator?.share) {
        await navigator.share({
          title: "Talenvia Mock Test Results",
          text: shareText
        });
        setCopyStatus("Share opened.");
      } else {
        await onCopy();
      }
    } catch {
      // User may cancel share; keep quiet but still provide a helpful fallback
      await onCopy();
    } finally {
      window.setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div style={{ minWidth: 0 }}>
          <h1 className="tv-pageTitle">Results</h1>
          <p className="tv-pageSubtitle">
            Review your most recent mock test attempt—scores are stored locally on this device.
          </p>

          {copyStatus ? (
            <div className="tv-saveNotice" role="status" aria-live="polite">
              {copyStatus}
            </div>
          ) : null}
        </div>

        <div className="tv-row" style={{ justifyContent: "flex-end" }}>
          <Button as={NavLink} to="/mock-tests" variant="ghost">
            Back to Mock Tests
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!id) return navigate("/mock-tests");
              navigate(`/mock-tests/${encodeURIComponent(id)}/start`);
            }}
          >
            Retake Test
          </Button>
        </div>
      </header>

      <div className="tv-grid tv-grid--2">
        <Card
          title={title}
          subtitle={
            testMeta
              ? `Duration: ${testMeta.durationMin} min • Max score: ${testMeta.maxScore}`
              : "Test details (local stub)"
          }
        >
          <div style={{ display: "grid", gap: 12 }}>
            {!hasAttempts ? (
              <div
                className="tv-card"
                style={{
                  border: "1px solid var(--tv-border)",
                  borderRadius: 14,
                  boxShadow: "none",
                  background: "rgba(255,255,255,0.75)"
                }}
                role="status"
                aria-live="polite"
              >
                <div className="tv-card__inner">
                  <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>No attempts found</div>
                  <p className="tv-muted" style={{ margin: "6px 0 0", lineHeight: 1.6 }}>
                    This test doesn’t have any saved attempts yet. Retake the test to generate a mock attempt and see
                    results here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="tv-card"
                  style={{
                    border: "1px solid var(--tv-border)",
                    borderRadius: 14,
                    boxShadow: "none",
                    background: "rgba(255,255,255,0.86)"
                  }}
                >
                  <div className="tv-card__inner">
                    <div className="tv-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, letterSpacing: "-0.02em", fontSize: 16 }}>Your score</div>
                        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>
                          {score}/{maxScore}{" "}
                          <span className="tv-muted" style={{ fontSize: 14, fontWeight: 800 }}>
                            ({percent}%)
                          </span>
                        </div>

                        <div className="tv-row" style={{ marginTop: 10 }}>
                          <span className="tv-chip">
                            <span aria-hidden="true">🕒</span> Attempted:{" "}
                            <strong>{formatMockTestLastAttempt(attemptedAtIso)}</strong>
                          </span>
                          <span className="tv-chip">
                            <span aria-hidden="true">📅</span> {formatDateTime(attemptedAtIso)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "grid", justifyItems: "end", gap: 8 }}>
                        <Button variant="ghost" onClick={onCopy} aria-label="Copy results">
                          Copy
                        </Button>
                        <Button variant="ghost" onClick={onShare} aria-label="Share results">
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tv-grid tv-grid--2">
                  <div
                    className="tv-card"
                    style={{
                      border: "1px solid var(--tv-border)",
                      borderRadius: 14,
                      boxShadow: "none"
                    }}
                  >
                    <div className="tv-card__inner">
                      <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Best score</div>
                      <p className="tv-muted" style={{ margin: "8px 0 0" }}>
                        {bestScore
                          ? `${bestScore.score}/${bestScore.maxScore} (${bestScore.percent}%)`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="tv-card"
                    style={{
                      border: "1px solid var(--tv-border)",
                      borderRadius: 14,
                      boxShadow: "none"
                    }}
                  >
                    <div className="tv-card__inner">
                      <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Attempts</div>
                      <p className="tv-muted" style={{ margin: "8px 0 0" }}>
                        {summary?.attemptsCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="tv-card" style={{ border: "1px solid var(--tv-border)", borderRadius: 14, boxShadow: "none" }}>
              <div className="tv-card__inner">
                <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>What’s next</div>
                <p className="tv-muted" style={{ margin: "6px 0 0", lineHeight: 1.65 }}>
                  Retake the test to improve your best score. In a full implementation, this page would also show
                  per-question feedback and recommended topics.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Summary (local storage)">
          <p className="tv-muted" style={{ marginTop: 0, lineHeight: 1.6 }}>
            This page reads your attempt data from <code>localStorage</code> via the existing mockTestsStore.
          </p>

          <div className="tv-kv" style={{ marginTop: 10 }}>
            <div>Test id</div>
            <div>{id || "—"}</div>

            <div>Test title</div>
            <div>{testMeta?.title || "—"}</div>

            <div>Last attempt</div>
            <div>{attemptedAtIso ? `${formatMockTestLastAttempt(attemptedAtIso)} (${formatDateTime(attemptedAtIso)})` : "—"}</div>

            <div>Last score</div>
            <div>{hasAttempts ? `${score}/${maxScore} (${percent}%)` : "—"}</div>

            <div>Best score</div>
            <div>{bestScore ? `${bestScore.score}/${bestScore.maxScore} (${bestScore.percent}%)` : "—"}</div>

            <div>Attempt count</div>
            <div>{summary?.attemptsCount || 0}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
