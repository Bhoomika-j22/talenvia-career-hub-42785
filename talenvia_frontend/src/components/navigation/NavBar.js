import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export function NavBar() {
  /** Header navigation with brand only (per request: remove menu, quick apply, and specified nav links). */
  return (
    <header className="tv-header">
      <div className="tv-header__left">
        <Link className="tv-brand" to="/" aria-label="Talenvia Home">
          <span className="tv-brand__mark" aria-hidden="true">
            <span className="tv-brand__markLetter" aria-hidden="true">
              T
            </span>
          </span>
          <span className="tv-brand__name">Talenvia</span>
        </Link>
      </div>

      {/* Intentionally empty: header navigation links removed per user request. */}
      <div className="tv-header__right" />
    </header>
  );
}
