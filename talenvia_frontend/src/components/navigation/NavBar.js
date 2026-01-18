import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Button } from "../ui/Button";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/profile", label: "Profile" },
  { to: "/mock-tests", label: "Mock Tests" },
  { to: "/challenges", label: "Challenges" }
];

// PUBLIC_INTERFACE
export function NavBar({ onOpenDrawer, onOpenQuickAction }) {
  /** Header navigation with brand, desktop nav, and mobile drawer toggle. */
  return (
    <header className="tv-header">
      <div className="tv-header__left">
        <Button variant="ghost" onClick={onOpenDrawer} aria-label="Open menu">
          Menu
        </Button>

        <Link className="tv-brand" to="/" aria-label="Talenvia Home">
          <span className="tv-brand__mark" aria-hidden="true" />
          <span className="tv-brand__name">Talenvia</span>
        </Link>
      </div>

      <nav className="tv-header__nav" aria-label="Primary">
        {NAV_ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => `tv-btn tv-btn--ghost ${isActive ? "isActive" : ""}`}
            style={({ isActive }) => ({
              borderColor: isActive ? "rgba(244, 114, 182, 0.35)" : undefined,
              background: isActive ? "rgba(244, 114, 182, 0.10)" : undefined
            })}
          >
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="tv-header__right">
        <Button variant="primary" onClick={onOpenQuickAction}>
          Quick Apply
        </Button>
      </div>
    </header>
  );
}
