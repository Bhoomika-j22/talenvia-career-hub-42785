import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "../components/ui/Button";

/**
 * How It Works page.
 */

const STEPS = [
  {
    title: "Create Your Profile",
    description:
      "Build a complete professional profile with your details, education, skills, projects, experience, languages, and a profile summary. This becomes the foundation for matching and recommendations."
  },
  {
    title: "Discover Relevant Jobs",
    description:
      "See opportunities based on your profile, skills, and preferences. Explore roles, save jobs, and apply directly from the platform."
  },
  {
    title: "Prepare with Mock Tests & Practice",
    description:
      "Improve readiness through mock tests, skill-based assessments, and interview-focused practice designed to build consistency and confidence."
  },
  {
    title: "Track Applications in One Place",
    description:
      "Track every application across stages like saved, applied, interview, offer, and rejected—so you stay organized without spreadsheets."
  },
  {
    title: "Improve with AI Guidance",
    description:
      "Get AI-powered insights to understand skill gaps, improve your profile, prepare for interviews, and make better career decisions."
  }
];

function StepCard({ stepNumber, title, description }) {
  return (
    <article className="tv-card tv-howItWorksCard" aria-label={`Step ${stepNumber}: ${title}`}>
      <div className="tv-card__inner">
        <div className="tv-howItWorksStepRow">
          <div className="tv-howItWorksStepNumber" aria-hidden="true">
            {stepNumber}
          </div>

          <div style={{ minWidth: 0 }}>
            <h2 className="tv-howItWorksStepTitle">{title}</h2>
            <p className="tv-muted tv-howItWorksStepDesc">{description}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

// PUBLIC_INTERFACE
export function HowItWorksPage() {
  /** Explains the Talenvia user journey in clear, step-based cards. */
  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader tv-howItWorksHeader">
        <div className="tv-howItWorksHeader__text">
          <h1 className="tv-pageTitle">How Talenvia Works</h1>
          <p className="tv-pageSubtitle">
            A clear, step-by-step journey—from building your profile to improving your job readiness.
          </p>
        </div>

        <div className="tv-howItWorksHeader__actions">
          <Button as={NavLink} to="/" variant="primary">
            Explore Jobs
          </Button>
        </div>
      </header>

      <section aria-label="How Talenvia Works steps" className="tv-howItWorksSteps">
        {STEPS.map((s, idx) => (
          <StepCard key={s.title} stepNumber={idx + 1} title={s.title} description={s.description} />
        ))}
      </section>

      <div
        className="tv-card"
        style={{
          background: "rgba(255, 255, 255, 0.78)"
        }}
      >
        <div className="tv-card__inner">
          <p className="tv-muted" style={{ margin: 0, lineHeight: 1.65 }}>
            Tip: Keep your profile updated—Talenvia’s recommendations and insights work best when your skills and
            preferences reflect what you want next.
          </p>
        </div>
      </div>
    </div>
  );
}
