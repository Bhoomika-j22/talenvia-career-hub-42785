import React from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

/**
 * Mock tests placeholder.
 */

// PUBLIC_INTERFACE
export function MockTestsPage() {
  /** Mock tests page placeholder. */
  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">Mock Tests</h1>
          <p className="tv-pageSubtitle">
            Practice interview-style questions with timed sessions and feedback (mocked).
          </p>
        </div>
        <Button variant="primary">Start New Test</Button>
      </header>

      <div className="tv-grid tv-grid--2">
        <Card title="Recommended">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>React Fundamentals (20 min)</li>
            <li>Behavioral STAR Practice (15 min)</li>
            <li>SQL Basics (25 min)</li>
          </ul>
        </Card>

        <Card title="Recent Activity">
          <p className="tv-muted" style={{ marginTop: 0 }}>
            No real history yet. This area will show scores, retakes, and learning notes.
          </p>
          <div className="tv-row">
            <span className="tv-chip">Last score: —</span>
            <span className="tv-chip">Streak: —</span>
          </div>
        </Card>
      </div>

      <Card title="How it works (preview)">
        <p style={{ marginTop: 0, lineHeight: 1.5 }}>
          Choose a topic, run a timed test, then review solutions and highlight gaps. In this scaffold we keep everything
          local and non-persistent.
        </p>
      </Card>
    </div>
  );
}
