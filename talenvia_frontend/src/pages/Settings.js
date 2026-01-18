import React, { useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { getEnv } from "../config/env";

/**
 * Settings placeholder.
 */

// PUBLIC_INTERFACE
export function SettingsPage() {
  /** Settings page placeholder (local-only). */
  const env = useMemo(() => getEnv(), []);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div className="tv-grid" style={{ gap: 14 }}>
      <header className="tv-pageHeader">
        <div>
          <h1 className="tv-pageTitle">Settings</h1>
          <p className="tv-pageSubtitle">
            Configure your preferences. This scaffold stores settings in memory only.
          </p>
        </div>
        <Button variant="primary" onClick={() => {}}>
          Save (Mock)
        </Button>
      </header>

      <div className="tv-grid tv-grid--2">
        <Card title="Preferences">
          <label style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
            />
            Email alerts for new jobs
          </label>

          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
            />
            Weekly digest summary
          </label>

          <p className="tv-muted tv-small" style={{ marginBottom: 0 }}>
            Tip: connect these to backend preferences when available.
          </p>
        </Card>

        <Card title="Environment">
          <div className="tv-kv">
            <div>REACT_APP_API_BASE</div>
            <div>{env.apiBase || "—"}</div>
            <div>REACT_APP_BACKEND_URL</div>
            <div>{env.backendUrl || "—"}</div>
            <div>REACT_APP_WS_URL</div>
            <div>{env.wsUrl || "—"}</div>
            <div>REACT_APP_NODE_ENV</div>
            <div>{env.nodeEnv || "—"}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
