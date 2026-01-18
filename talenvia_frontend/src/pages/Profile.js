import React from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

/**
 * User profile placeholder page.
 */

// PUBLIC_INTERFACE
export function ProfilePage() {
  /** User profile page placeholder. */
  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">User Profile</h1>
          <p className="tv-pageSubtitle">
            Manage your resume, preferences, saved jobs, and progress. (Scaffold placeholder)
          </p>
        </div>
        <div className="tv-row">
          <Button variant="primary">Edit Profile</Button>
          <Button variant="ghost">Upload Resume</Button>
        </div>
      </header>

      <div className="tv-grid tv-grid--2">
        <Card title="Overview">
          <div className="tv-kv">
            <div>Name</div>
            <div>Jordan Candidate</div>
            <div>Role</div>
            <div>Frontend Engineer</div>
            <div>Focus</div>
            <div>React • Accessibility • UI Systems</div>
          </div>
        </Card>

        <Card title="Progress">
          <div className="tv-row">
            <span className="tv-chip">Mock Tests: 3</span>
            <span className="tv-chip">Challenges: 5</span>
            <span className="tv-chip">Saved Jobs: 2</span>
          </div>
          <p className="tv-muted" style={{ marginBottom: 0 }}>
            Connect this panel to real user metrics when a backend is available.
          </p>
        </Card>
      </div>

      <Card title="Saved Items" subtitle="A placeholder list for saved jobs/tests.">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Frontend Engineer (React) — Talenvia Labs</li>
          <li>System Design Mock Test — Level 2</li>
        </ul>
      </Card>
    </div>
  );
}
