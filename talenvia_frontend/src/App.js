import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

import { AppLayout } from "./layout/AppLayout";
import { HomePage } from "./pages/Home";
import { ProfilePage } from "./pages/Profile";
import { MockTestsPage } from "./pages/MockTests";
import { MockTestRunnerStubPage } from "./pages/MockTestRunnerStub";
import { MockTestResultsPage } from "./pages/MockTestResults";
import { ChallengesPage } from "./pages/Challenges";
import { SettingsPage } from "./pages/Settings";
import { AboutPage } from "./pages/About";
import { HowItWorksPage } from "./pages/HowItWorks";
import { NotFoundPage } from "./pages/NotFound";

/**
 * App entry for Talenvia frontend:
 * - Elegant themed layout shell
 * - Side drawer + header nav
 * - Scaffold routes/pages
 */

// PUBLIC_INTERFACE
function App() {
  /** Main application component for Talenvia. */
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/mock-tests" element={<MockTestsPage />} />
            <Route path="/mock-tests/:id/start" element={<MockTestRunnerStubPage />} />
            <Route path="/mock-tests/:id/results" element={<MockTestResultsPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
