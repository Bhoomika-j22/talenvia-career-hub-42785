import React from "react";
import { Card } from "../components/ui/Card";

/**
 * About page.
 */

// PUBLIC_INTERFACE
export function AboutPage() {
  /** About Us page content for Talenvia. */
  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">About Talenvia</h1>
          <p className="tv-pageSubtitle">
            Helping early-career professionals build strong profiles and move forward with clarity.
          </p>
        </div>
      </header>

      <Card title="Who we are">
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, lineHeight: 1.65 }}>
            Built for students, freshers, and early-career professionals, Talenvia brings your career information into
            one place—so you can present your strengths clearly, stay prepared, and apply with confidence. We focus on
            practical career growth: structured profiles, skill visibility, and personalized job discovery that fits
            your goals.
          </p>

          <p style={{ margin: 0, lineHeight: 1.65 }}>
            Whether you are starting your first job search or refining your direction, Talenvia reduces the guesswork by
            matching you with relevant roles and offering AI-driven guidance to help you improve your readiness and make
            smarter career decisions.
          </p>
        </div>
      </Card>

      <Card title="Key features">
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Profile & skill management</div>
            <p className="tv-muted" style={{ margin: "6px 0 0", lineHeight: 1.65 }}>
              Maintain a structured profile that highlights your strengths. Organize skills clearly so recruiters and
              roles align with what you can actually deliver.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Resume upload and updates</div>
            <p className="tv-muted" style={{ margin: "6px 0 0", lineHeight: 1.65 }}>
              Keep your latest resume ready without rework. Update documents as you learn, build projects, and gain
              experience—so every application reflects your current story.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Job discovery and matching</div>
            <p className="tv-muted" style={{ margin: "6px 0 0", lineHeight: 1.65 }}>
              Find opportunities that fit your skills, level, and interests. Matching helps reduce noise so you spend
              time applying to roles that are relevant.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Career preferences & personalization</div>
            <p className="tv-muted" style={{ margin: "6px 0 0", lineHeight: 1.65 }}>
              Set what matters to you—locations, role types, and focus areas—and get recommendations that stay aligned
              as your goals evolve.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>AI-driven guidance and recommendations</div>
            <p className="tv-muted" style={{ margin: "6px 0 0", lineHeight: 1.65 }}>
              Receive practical suggestions to improve readiness, from role-aligned skills to next steps. Guidance is
              designed to help you progress with clarity and consistency.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Our promise">
        <p className="tv-muted" style={{ marginTop: 0, lineHeight: 1.65 }}>
          Talenvia is designed to be a trusted companion for steady growth and long-term career success.
        </p>
      </Card>
    </div>
  );
}
