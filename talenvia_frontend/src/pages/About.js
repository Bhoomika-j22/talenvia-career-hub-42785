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

      <div className="tv-grid tv-grid--2">
        <Card title="Key features">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.65 }}>
            <li>Profile and skill management to showcase what you can do</li>
            <li>Resume upload with easy updates as you grow</li>
            <li>Job discovery and matching based on your skills and interests</li>
            <li>Career preferences and personalization for better recommendations</li>
            <li>AI-driven guidance through mentor-like insights and role suggestions</li>
          </ul>
        </Card>
      </div>

      <Card title="Our promise">
        <p className="tv-muted" style={{ marginTop: 0, lineHeight: 1.65 }}>
          Talenvia is designed to be a trusted companion for steady growth and long-term career success.
        </p>
      </Card>
    </div>
  );
}
