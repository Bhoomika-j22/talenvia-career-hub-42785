import React from "react";
import { NavLink } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

// PUBLIC_INTERFACE
export function NotFoundPage() {
  /** 404 page for unmatched routes. */
  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">Page not found</h1>
          <p className="tv-pageSubtitle">That route doesn’t exist in this scaffold.</p>
        </div>
        <Button as={NavLink} to="/" variant="primary">
          Go Home
        </Button>
      </header>

      <Card title="Tip">
        <p style={{ marginTop: 0 }} className="tv-muted">
          Use the side menu to navigate between the scaffold pages.
        </p>
      </Card>
    </div>
  );
}
