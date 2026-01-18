import React from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

/**
 * Challenges placeholder.
 */

// PUBLIC_INTERFACE
export function ChallengesPage() {
  /** Challenges page placeholder. */
  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">Challenges</h1>
          <p className="tv-pageSubtitle">
            Gamified tasks that sharpen your skills—complete challenges to earn badges (mocked).
          </p>
        </div>
        <Button variant="primary">View Leaderboard</Button>
      </header>

      <div className="tv-grid tv-grid--3">
        <Card title="UI Polish Sprint" subtitle="30 min • Beginner">
          <p className="tv-muted" style={{ marginTop: 0 }}>
            Improve spacing, typography, and accessibility in a small UI.
          </p>
          <div className="tv-row">
            <span className="tv-chip">Badge: Rose</span>
            <span className="tv-chip">XP: 120</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Button variant="ghost">Open</Button>
          </div>
        </Card>

        <Card title="API Debug Quest" subtitle="45 min • Intermediate">
          <p className="tv-muted" style={{ marginTop: 0 }}>
            Trace request flows, handle errors, and stabilize an API integration.
          </p>
          <div className="tv-row">
            <span className="tv-chip">Badge: Amber</span>
            <span className="tv-chip">XP: 220</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Button variant="ghost">Open</Button>
          </div>
        </Card>

        <Card title="System Design Canvas" subtitle="60 min • Advanced">
          <p className="tv-muted" style={{ marginTop: 0 }}>
            Draft a high-level architecture for a feature and discuss tradeoffs.
          </p>
          <div className="tv-row">
            <span className="tv-chip">Badge: Violet</span>
            <span className="tv-chip">XP: 320</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Button variant="ghost">Open</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
