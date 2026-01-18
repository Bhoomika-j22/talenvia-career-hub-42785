import React from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { NavLink } from "react-router-dom";

/**
 * How It Works page.
 */

// PUBLIC_INTERFACE
export function HowItWorksPage() {
  /** Explains Talenvia flows (placeholder). */
  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">How It Works</h1>
          <p className="tv-pageSubtitle">
            A simple loop: discover roles, practice skills, track your story, and apply with elegance.
          </p>
        </div>
        <Button as={NavLink} to="/" variant="primary">
          Explore Jobs
        </Button>
      </header>

      <div className="tv-grid tv-grid--2">
        <Card title="1) Discover" subtitle="Search curated job listings.">
          <p style={{ marginTop: 0 }} className="tv-muted">
            Use filters to narrow by role, location, and tags. Save roles that match your goals.
          </p>
        </Card>

        <Card title="2) Prepare" subtitle="Mock tests and targeted practice.">
          <p style={{ marginTop: 0 }} className="tv-muted">
            Warm up with short assessments and learn from feedback. Track patterns over time.
          </p>
        </Card>

        <Card title="3) Challenge" subtitle="Gamified tasks that build momentum.">
          <p style={{ marginTop: 0 }} className="tv-muted">
            Earn badges and XP while improving practical skills (UI, debugging, design thinking).
          </p>
        </Card>

        <Card title="4) Apply" subtitle="Use quick actions and a polished profile.">
          <p style={{ marginTop: 0 }} className="tv-muted">
            Package your story: profile, resume, and learnings. Apply confidently and iterate.
          </p>
        </Card>
      </div>
    </div>
  );
}
