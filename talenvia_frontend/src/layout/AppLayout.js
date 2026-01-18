import React, { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavBar } from "../components/navigation/NavBar";
import { SideDrawer } from "../components/navigation/SideDrawer";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { getEnv } from "../config/env";

/**
 * App layout shell: header + responsive drawer + main content + global modal pattern.
 */

// PUBLIC_INTERFACE
export function AppLayout() {
  /** Shared app layout wrapper used for all main routes. */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const location = useLocation();

  const env = useMemo(() => getEnv(), []);

  return (
    <div className="tv-shell">
      <NavBar
        onOpenDrawer={() => setDrawerOpen((v) => !v)}
        onOpenQuickAction={() => setQuickActionOpen(true)}
      />

      <div className="tv-content">
        <SideDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <main className="tv-main" aria-label="Main content">
          <Outlet />
          <div style={{ marginTop: 18 }} className="tv-muted tv-small">
            <div className="tv-kv">
              <div>Route</div>
              <div>{location.pathname}</div>
              <div>API Base</div>
              <div>{env.apiBase || "— (not set)"}</div>
              <div>Backend URL</div>
              <div>{env.backendUrl || "— (not set)"}</div>
            </div>
          </div>
        </main>
      </div>

      <Modal
        open={quickActionOpen}
        title="Quick Apply (Mock)"
        onClose={() => setQuickActionOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setQuickActionOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Mock action
                setQuickActionOpen(false);
              }}
            >
              Submit
            </Button>
          </>
        }
      >
        <p style={{ marginTop: 0 }} className="tv-muted">
          This is a modal pattern example. In a real implementation, this could collect a resume, cover note, and target job.
        </p>

        <label style={{ display: "block", fontWeight: 700, margin: "12px 0 6px" }}>
          Role you’re applying for
        </label>
        <input className="tv-input" placeholder="e.g., Frontend Engineer (React)" />

        <label style={{ display: "block", fontWeight: 700, margin: "12px 0 6px" }}>
          Notes
        </label>
        <textarea className="tv-input" rows={4} placeholder="A short note about your interest…" />
      </Modal>
    </div>
  );
}
