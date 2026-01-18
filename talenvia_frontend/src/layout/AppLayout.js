import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { NavBar } from "../components/navigation/NavBar";
import { SideDrawer } from "../components/navigation/SideDrawer";

/**
 * App layout shell: header + responsive drawer + main content.
 */

// PUBLIC_INTERFACE
export function AppLayout() {
  /** Shared app layout wrapper used for all main routes. */
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="tv-shell">
      <NavBar />

      <div className="tv-content">
        <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <main className="tv-main" aria-label="Main content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
