/**
 * Mock Tests dataset (authoritative in-app source).
 *
 * NOTE:
 * - This file is intentionally separate from mockTestsStore.js (attempt persistence).
 * - Pages should read catalog/questions from here, and keep attempt history in localStorage store.
 */

// PUBLIC_INTERFACE
export const mockTests = [
  {
    id: 1,
    title: "Frontend Developer Test",
    skill: "React",
    totalQuestions: 5,
    duration: "10 mins",
    questions: [
      {
        id: 1,
        question: "What is JSX in React?",
        options: ["A JavaScript syntax extension", "A database", "A CSS framework", "A backend language"],
        correctAnswer: 0
      },
      {
        id: 2,
        question: "Which hook is used for state?",
        options: ["useEffect", "useState", "useRef", "useMemo"],
        correctAnswer: 1
      },
      {
        id: 3,
        question: "React is mainly used for?",
        options: ["Database management", "Backend development", "UI development", "Testing"],
        correctAnswer: 2
      },
      {
        id: 4,
        question: "What is Virtual DOM?",
        options: ["Real DOM", "Lightweight DOM copy", "Browser API", "Server DOM"],
        correctAnswer: 1
      },
      {
        id: 5,
        question: "Which company developed React?",
        options: ["Google", "Microsoft", "Facebook", "Amazon"],
        correctAnswer: 2
      }
    ]
  }
];

/**
 * UI-facing catalog derived from mockTests that matches the app's existing page expectations.
 * We keep stable string IDs for routing and persistence keys.
 */
function toSlugId(test) {
  const base = String(test?.title || test?.skill || test?.id || "mock_test")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return base || `mock_test_${String(test?.id ?? "unknown")}`;
}

function parseDurationMin(duration) {
  const v = String(duration || "").toLowerCase();
  const m = v.match(/(\d+)\s*min/);
  if (m) return Number(m[1]);
  // fallback: if it is just a number string
  const asNum = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(asNum) && asNum > 0 ? Math.round(asNum) : 10;
}

// PUBLIC_INTERFACE
export function listMockTestsCatalog() {
  /** Returns the mock tests catalog used by MockTests/Runner/Results pages. */
  return mockTests.map((t) => {
    const questionsCount = Array.isArray(t.questions) ? t.questions.length : Number(t.totalQuestions) || 0;
    return {
      id: toSlugId(t),
      sourceId: t.id,
      title: t.title,
      skill: t.skill,
      durationMin: parseDurationMin(t.duration),
      maxScore: questionsCount, // one point per question for now
      totalQuestions: questionsCount,
      questions: Array.isArray(t.questions) ? t.questions : []
    };
  });
}

// PUBLIC_INTERFACE
export function getMockTestByRouteId(routeId) {
  /** Returns a single test from the catalog by its route id, or null if not found. */
  const id = String(routeId || "").trim();
  if (!id) return null;
  return listMockTestsCatalog().find((t) => t.id === id) || null;
}
