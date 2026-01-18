import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Shared job search state for the app.
 * Keeps NavBar search and Home page search synchronized while using
 * a debounced "query" value for filtering.
 */

const JobsSearchContext = createContext(null);

// PUBLIC_INTERFACE
export function JobsSearchProvider({ children, debounceMs = 250 }) {
  /** Provides synchronized searchInput + debounced query to descendants. */
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");

  // Debounce input into query (used by job filtering/fetch).
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(searchInput);
    }, debounceMs);

    return () => window.clearTimeout(t);
  }, [searchInput, debounceMs]);

  const value = useMemo(
    () => ({
      searchInput,
      setSearchInput,
      query,
      setQuery,
      clear: () => {
        setSearchInput("");
        setQuery("");
      }
    }),
    [searchInput, query]
  );

  return <JobsSearchContext.Provider value={value}>{children}</JobsSearchContext.Provider>;
}

// PUBLIC_INTERFACE
export function useJobsSearch() {
  /** Hook to access the shared jobs search state. */
  const ctx = useContext(JobsSearchContext);
  if (!ctx) {
    throw new Error("useJobsSearch must be used within a JobsSearchProvider");
  }
  return ctx;
}
