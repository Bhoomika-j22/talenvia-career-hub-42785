import React from "react";
import { NavLink } from "react-router-dom";

const MENU = [
  { to: "/", label: "Home", icon: "🏷️" },
  { to: "/profile", label: "User Profile", icon: "👤" },
  // Jobs/Home: Job listings live on the Home page route in this scaffold.
  { to: "/", label: "Jobs", icon: "💼" },
  { to: "/mock-tests", label: "Mock Tests", icon: "📝" },
  { to: "/challenges", label: "Challenges", icon: "🏆" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
  { to: "/about", label: "About Us", icon: "✨" },
  { to: "/how-it-works", label: "How It Works", icon: "🧭" }
];

// PUBLIC_INTERFACE
export function SideDrawer({ open, onClose }) {
  /** Responsive drawer; on mobile becomes overlay panel. */
  return (
    <>
      {open ? <div className="tv-drawerBackdrop" onMouseDown={onClose} aria-hidden="true" /> : null}
      <aside className={`tv-drawer ${open ? "isOpen" : ""}`} aria-label="Sidebar menu">
        <div className="tv-drawer__panel">
          <div className="tv-drawer__sectionTitle">Navigate</div>
          <nav className="tv-menu">
            {MENU.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                className="tv-menuItem"
                onClick={onClose}
                end={m.to === "/"}
              >
                <span className="tv-menuIcon" aria-hidden="true">
                  {m.icon}
                </span>
                <span style={{ fontWeight: 700 }}>{m.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="tv-drawer__sectionTitle" style={{ marginTop: 14 }}>
            Status
          </div>
          <div className="tv-card" style={{ background: "rgba(255,255,255,0.75)" }}>
            <div className="tv-card__inner">
              <div className="tv-row" style={{ justifyContent: "space-between" }}>
                <span className="tv-chip">
                  <span aria-hidden="true">🟢</span> UI Ready
                </span>
                <span className="tv-chip">
                  <span aria-hidden="true">🧪</span> Mock data
                </span>
              </div>
              <p className="tv-muted tv-small" style={{ margin: "10px 0 0" }}>
                Talenvia currently runs without a backend for this scaffold. Pages use mock services and placeholders.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
