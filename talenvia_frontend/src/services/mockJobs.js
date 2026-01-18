/**
 * Mock jobs service.
 * This container does not assume a backend exists; we keep data local and async-shaped.
 */

const MOCK_JOBS = [
  {
    id: "job_001",
    title: "Frontend Engineer (React)",
    company: "Talenvia Labs",
    location: "Remote (EU-friendly)",
    type: "Full-time",
    level: "Mid",
    tags: ["React", "UI", "Performance"],
    salary: "$75k–$110k",
    postedDaysAgo: 2,
    description:
      "Build elegant, accessible UI components and help shape a delightful job search experience for candidates."
  },
  {
    id: "job_002",
    title: "Backend Engineer (Node)",
    company: "Aurora Hiring",
    location: "Berlin, DE (Hybrid)",
    type: "Full-time",
    level: "Senior",
    tags: ["Node.js", "APIs", "PostgreSQL"],
    salary: "€85k–€120k",
    postedDaysAgo: 5,
    description:
      "Design scalable APIs and support a fast iteration cycle with strong engineering fundamentals."
  },
  {
    id: "job_003",
    title: "Data Analyst (Career Insights)",
    company: "CareerCraft",
    location: "London, UK (On-site)",
    type: "Contract",
    level: "Junior",
    tags: ["SQL", "Dashboards", "Storytelling"],
    salary: "£350/day",
    postedDaysAgo: 1,
    description:
      "Help candidates understand their market fit through curated analytics and clear storytelling."
  }
];

// PUBLIC_INTERFACE
export async function listJobs({ query = "" } = {}) {
  /** List jobs using in-memory mock data. */
  const q = query.trim().toLowerCase();

  // Simulate network latency
  await new Promise((r) => setTimeout(r, 250));

  const filtered = !q
    ? MOCK_JOBS
    : MOCK_JOBS.filter((j) => {
        const hay = `${j.title} ${j.company} ${j.location} ${j.tags.join(" ")}`.toLowerCase();
        return hay.includes(q);
      });

  return filtered;
}
