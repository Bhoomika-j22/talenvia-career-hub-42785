import React from "react";

/**
 * Card component used across pages.
 */

// PUBLIC_INTERFACE
export function Card({ title, subtitle, right, children, className = "" }) {
  /** A surfaced container with optional header. */
  return (
    <section className={`tv-card ${className}`.trim()}>
      <div className="tv-card__inner">
        {(title || subtitle || right) && (
          <header className="tv-pageHeader" style={{ margin: "0 0 12px" }}>
            <div>
              {title && <h2 className="tv-pageTitle" style={{ fontSize: 18, margin: 0 }}>{title}</h2>}
              {subtitle && <p className="tv-pageSubtitle" style={{ marginTop: 6 }}>{subtitle}</p>}
            </div>
            {right ? <div>{right}</div> : null}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
