import React from "react";
import { Card } from "../components/ui/Card";

/**
 * About page.
 */

// PUBLIC_INTERFACE
export function AboutPage() {
  /** About Us page placeholder. */
  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">About Us</h1>
          <p className="tv-pageSubtitle">
            Talenvia is designed to make job discovery feel calm, focused, and rewarding.
          </p>
        </div>
      </header>

      <Card title="Our mission">
        <p style={{ marginTop: 0, lineHeight: 1.55 }}>
          We blend curated job discovery with skills practice—mock tests, challenges, and a structured profile—so you can
          search, learn, and apply with confidence.
        </p>
      </Card>

      <div className="tv-grid tv-grid--2">
        <Card title="What we value">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Clarity over noise</li>
            <li>Accessibility and inclusivity</li>
            <li>Elegant, simple workflows</li>
          </ul>
        </Card>

        <Card title="Current state">
          <p className="tv-muted" style={{ marginTop: 0 }}>
            This is an initial frontend scaffold. Data is mocked and no backend is required to run the UI.
          </p>
        </Card>
      </div>
    </div>
  );
}
