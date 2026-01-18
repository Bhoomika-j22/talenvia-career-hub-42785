import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useJobsSearch } from "../../context/JobsSearchContext";

// PUBLIC_INTERFACE
export function NavBar() {
  /** Header navigation with brand and global job search input. */
  const { searchInput, setSearchInput, clear } = useJobsSearch();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

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

        <div className="tv-headerSearch" role="search" aria-label="Search jobs">
          <label htmlFor="tvHeaderJobSearch" className="tv-srOnly">
            Search jobs
          </label>
          <input
            id="tvHeaderJobSearch"
            className="tv-input tv-headerSearch__input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => {
              // If user starts searching from another page, bring them to Home
              // so results are immediately visible.
              if (!isHome) navigate("/");
            }}
            placeholder="Search jobs…"
            autoComplete="off"
            inputMode="search"
          />

          <button
            type="button"
            className="tv-headerSearch__clear"
            onClick={clear}
            disabled={!searchInput}
            aria-disabled={!searchInput ? "true" : "false"}
            aria-label="Clear search"
            title="Clear"
          >
            ×
          </button>
        </div>
      </div>

      {/* Intentionally empty: header navigation links removed per user request. */}
      <div className="tv-header__right" />
    </header>
  );
}
