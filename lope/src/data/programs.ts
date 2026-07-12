export type Mode = "online" | "ground";

export interface Program {
  id: string;
  name: string;
  tags: string[];
  modes: Mode[];
  blurb: string;
}

export interface Interest {
  id: string;
  ico: string;
  label: string;
}

/** Illustrative program catalog — replace with real GCU program data. */
export const PROGRAMS: Program[] = [
  {
    id: "nursing",
    name: "B.S. Nursing (BSN)",
    tags: ["health"],
    modes: ["ground"],
    blurb:
      "GCU's pre-licensure nursing track pairs classroom science with simulation labs and clinical placements.",
  },
  {
    id: "rn-bsn",
    name: "RN to BSN",
    tags: ["health"],
    modes: ["online"],
    blurb:
      "Built for working registered nurses who want to advance without stepping away from the floor.",
  },
  {
    id: "health-admin",
    name: "B.S. Health Care Administration",
    tags: ["health", "business"],
    modes: ["online", "ground"],
    blurb:
      "The business of care — operations, policy, and leadership for the health systems that need it.",
  },
  {
    id: "psych",
    name: "B.S. Psychology",
    tags: ["helping", "health"],
    modes: ["online", "ground"],
    blurb:
      "The science of people, and a foundation for counseling, social work, and graduate study.",
  },
  {
    id: "counseling",
    name: "M.S. Clinical Mental Health Counseling",
    tags: ["helping"],
    modes: ["online", "ground"],
    blurb:
      "A licensure-track master's for those called to sit with people in their hardest moments.",
  },
  {
    id: "business",
    name: "B.S. Business Administration",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb:
      "A broad, flexible core — management, marketing, finance — for builders and future leaders.",
  },
  {
    id: "mba",
    name: "Master of Business Administration (MBA)",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb:
      "Accelerate into leadership, with emphases from finance to health systems management.",
  },
  {
    id: "accounting",
    name: "B.S. Accounting",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb:
      "CPA-aligned coursework with a clear line to a stable, in-demand profession.",
  },
  {
    id: "cs",
    name: "B.S. Computer Science",
    tags: ["tech"],
    modes: ["online", "ground"],
    blurb:
      "Algorithms, systems, and software engineering — the deep track for builders of technology.",
  },
  {
    id: "cyber",
    name: "B.S. Cybersecurity",
    tags: ["tech"],
    modes: ["online", "ground"],
    blurb:
      "Hands-on defense, ethical hacking, and a field that can't hire fast enough.",
  },
  {
    id: "it",
    name: "B.S. Information Technology",
    tags: ["tech", "business"],
    modes: ["online", "ground"],
    blurb:
      "The practical bridge between people and the systems they rely on every day.",
  },
  {
    id: "edu",
    name: "B.S. Elementary Education",
    tags: ["teaching"],
    modes: ["online", "ground"],
    blurb:
      "A teaching-licensure path from a university built on preparing educators.",
  },
  {
    id: "med",
    name: "M.Ed. in Educational Leadership",
    tags: ["teaching"],
    modes: ["online"],
    blurb:
      "For teachers ready to lead schools, districts, and the next generation of educators.",
  },
  {
    id: "cj",
    name: "B.S. Criminal Justice",
    tags: ["justice", "helping"],
    modes: ["online", "ground"],
    blurb:
      "Law, criminology, and public safety — for those who want to serve their community.",
  },
  {
    id: "ministry",
    name: "B.A. Christian Ministry",
    tags: ["ministry", "helping"],
    modes: ["online", "ground"],
    blurb:
      "Rooted in GCU's Christian heritage — theology, leadership, and a life of service.",
  },
  {
    id: "worship",
    name: "B.A. Worship Arts",
    tags: ["ministry", "arts"],
    modes: ["ground"],
    blurb:
      "Where musicianship meets ministry, on a campus with a thriving arts community.",
  },
];

export const INTERESTS: Interest[] = [
  { id: "health", ico: "🩺", label: "Health & Nursing" },
  { id: "business", ico: "💼", label: "Business & Leadership" },
  { id: "tech", ico: "💻", label: "Tech & Computing" },
  { id: "teaching", ico: "🍎", label: "Teaching & Education" },
  { id: "helping", ico: "🤝", label: "Counseling & Helping" },
  { id: "justice", ico: "⚖️", label: "Law & Justice" },
  { id: "ministry", ico: "✝️", label: "Ministry & Faith" },
  { id: "arts", ico: "🎨", label: "Arts & Media" },
];
