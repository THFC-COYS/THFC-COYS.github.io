export type Mode = "online" | "ground";

export interface Role {
  title: string;
  range: string; // illustrative salary range
}

/** What the degree means for a student's life — the three GCU dimensions. */
export interface Outcomes {
  roles: Role[];
  employers: string[];
  personal: string;
  spiritual: string;
}

export interface Program {
  id: string;
  name: string;
  tags: string[];
  modes: Mode[];
  blurb: string;
  outcomes: Outcomes;
}

export interface Interest {
  id: string;
  ico: string;
  label: string;
}

/**
 * Illustrative program catalog — replace with real GCU program data.
 * Roles, salary ranges, and employers are illustrative examples of the field,
 * not placement guarantees or partnerships.
 */
export const PROGRAMS: Program[] = [
  {
    id: "nursing",
    name: "B.S. Nursing (BSN)",
    tags: ["health"],
    modes: ["ground"],
    blurb:
      "GCU's pre-licensure nursing track pairs classroom science with simulation labs and clinical placements.",
    outcomes: {
      roles: [
        { title: "Registered Nurse", range: "$75–95K" },
        { title: "ICU / Critical Care Nurse", range: "$80–105K" },
        { title: "Nurse Educator", range: "$85–110K" },
      ],
      employers: ["Mayo Clinic", "Banner Health", "HonorHealth", "Dignity Health", "Phoenix Children's"],
      personal:
        "The steadiness that comes from knowing you can walk into someone's worst day and make it better.",
      spiritual:
        "Healing as ministry — caring for the whole person, body and spirit, the way you were called to.",
    },
  },
  {
    id: "rn-bsn",
    name: "RN to BSN",
    tags: ["health"],
    modes: ["online"],
    blurb:
      "Built for working registered nurses who want to advance without stepping away from the floor.",
    outcomes: {
      roles: [
        { title: "Charge Nurse", range: "$85–105K" },
        { title: "Nurse Manager", range: "$95–125K" },
        { title: "Clinical Case Manager", range: "$75–95K" },
      ],
      employers: ["Mayo Clinic", "Banner Health", "HCA Healthcare", "Kaiser Permanente", "Ascension"],
      personal:
        "Growth without giving up the bedside — leadership that honors the experience you've already earned.",
      spiritual:
        "Your years of service become stewardship — mentoring the nurses coming up behind you.",
    },
  },
  {
    id: "health-admin",
    name: "B.S. Health Care Administration",
    tags: ["health", "business"],
    modes: ["online", "ground"],
    blurb:
      "The business of care — operations, policy, and leadership for the health systems that need it.",
    outcomes: {
      roles: [
        { title: "Health Services Manager", range: "$80–115K" },
        { title: "Practice Manager", range: "$65–90K" },
        { title: "Patient Experience Lead", range: "$60–85K" },
      ],
      employers: ["Banner Health", "UnitedHealth Group", "CVS Health", "Cigna", "HonorHealth"],
      personal:
        "A seat at the table where care gets decided — and a career that grows as health systems grow.",
      spiritual:
        "Serving the servants: building systems that let caregivers do their calling well.",
    },
  },
  {
    id: "psych",
    name: "B.S. Psychology",
    tags: ["helping", "health"],
    modes: ["online", "ground"],
    blurb:
      "The science of people, and a foundation for counseling, social work, and graduate study.",
    outcomes: {
      roles: [
        { title: "Behavioral Health Technician", range: "$40–55K" },
        { title: "Case Manager", range: "$45–60K" },
        { title: "People / HR Specialist", range: "$55–75K" },
      ],
      employers: ["Banner Health", "Terros Health", "Southwest Behavioral & Health", "Phoenix Children's", "school districts"],
      personal: "A deeper understanding of people — starting with yourself.",
      spiritual:
        "Seeing every person as made with worth and purpose, and learning how to help them find it.",
    },
  },
  {
    id: "counseling",
    name: "M.S. Clinical Mental Health Counseling",
    tags: ["helping"],
    modes: ["online", "ground"],
    blurb:
      "A licensure-track master's for those called to sit with people in their hardest moments.",
    outcomes: {
      roles: [
        { title: "Licensed Professional Counselor", range: "$60–85K" },
        { title: "Clinical Therapist", range: "$60–90K" },
        { title: "Community Counselor", range: "$55–75K" },
      ],
      employers: ["Terros Health", "Southwest Behavioral & Health", "Phoenix Children's", "private practice", "church counseling centers"],
      personal:
        "Work that ends most days knowing someone left your office more whole than they arrived.",
      spiritual:
        "A vocation of presence — sitting with people in darkness and pointing toward hope.",
    },
  },
  {
    id: "business",
    name: "B.S. Business Administration",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb:
      "A broad, flexible core — management, marketing, finance — for builders and future leaders.",
    outcomes: {
      roles: [
        { title: "Operations Manager", range: "$70–100K" },
        { title: "Marketing Manager", range: "$70–110K" },
        { title: "Business Analyst", range: "$65–95K" },
      ],
      employers: ["American Express", "State Farm", "Vanguard", "Amazon", "USAA"],
      personal:
        "The confidence to lead — a foundation you can build any career, or company, on.",
      spiritual:
        "Leadership as service: doing business with integrity in a world that notices.",
    },
  },
  {
    id: "mba",
    name: "Master of Business Administration (MBA)",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb:
      "Accelerate into leadership, with emphases from finance to health systems management.",
    outcomes: {
      roles: [
        { title: "Senior Manager", range: "$100–140K" },
        { title: "Director of Operations", range: "$110–160K" },
        { title: "Product Manager", range: "$110–150K" },
      ],
      employers: ["Intel", "American Express", "Honeywell", "Deloitte", "Charles Schwab"],
      personal:
        "The credential that turns 'someday' leadership into a title and a team.",
      spiritual:
        "Influence multiplied — servant leadership at the scale of whole organizations.",
    },
  },
  {
    id: "accounting",
    name: "B.S. Accounting",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb:
      "CPA-aligned coursework with a clear line to a stable, in-demand profession.",
    outcomes: {
      roles: [
        { title: "Staff Accountant", range: "$55–75K" },
        { title: "Auditor", range: "$60–85K" },
        { title: "CPA / Senior Accountant", range: "$75–110K" },
      ],
      employers: ["Deloitte", "PwC", "EY", "KPMG", "Northern Trust"],
      personal: "A profession of trust with a clear ladder and lifelong demand.",
      spiritual:
        "Integrity as a daily practice — being the person whose numbers everyone can believe.",
    },
  },
  {
    id: "cs",
    name: "B.S. Computer Science",
    tags: ["tech"],
    modes: ["online", "ground"],
    blurb:
      "Algorithms, systems, and software engineering — the deep track for builders of technology.",
    outcomes: {
      roles: [
        { title: "Software Engineer", range: "$90–140K" },
        { title: "Machine Learning Engineer", range: "$120–180K" },
        { title: "Systems Developer", range: "$85–130K" },
      ],
      employers: ["Microsoft", "Amazon", "Intel", "GoDaddy", "American Express"],
      personal:
        "The power to build things millions of people use — a career that compounds like the code you ship.",
      spiritual:
        "Creation reflecting the Creator — building technology that genuinely serves people.",
    },
  },
  {
    id: "cyber",
    name: "B.S. Cybersecurity",
    tags: ["tech"],
    modes: ["online", "ground"],
    blurb:
      "Hands-on defense, ethical hacking, and a field that can't hire fast enough.",
    outcomes: {
      roles: [
        { title: "Security Analyst", range: "$80–115K" },
        { title: "Penetration Tester", range: "$95–140K" },
        { title: "Security Engineer", range: "$100–150K" },
      ],
      employers: ["Northrop Grumman", "RTX (Raytheon)", "Wells Fargo", "CrowdStrike", "Deloitte"],
      personal:
        "The quiet confidence of being the one who protects everyone else.",
      spiritual:
        "Guardianship as calling — defending communities from harm they never see.",
    },
  },
  {
    id: "it",
    name: "B.S. Information Technology",
    tags: ["tech", "business"],
    modes: ["online", "ground"],
    blurb:
      "The practical bridge between people and the systems they rely on every day.",
    outcomes: {
      roles: [
        { title: "Systems Administrator", range: "$65–95K" },
        { title: "Network Engineer", range: "$75–110K" },
        { title: "Cloud Administrator", range: "$80–120K" },
      ],
      employers: ["Insight Enterprises", "Avnet", "State Farm", "Banner Health", "Charles Schwab"],
      personal:
        "Every organization runs on what you know — you'll never wonder if you're needed.",
      spiritual:
        "Faithful in the unseen things — keeping the systems people depend on running.",
    },
  },
  {
    id: "edu",
    name: "B.S. Elementary Education",
    tags: ["teaching"],
    modes: ["online", "ground"],
    blurb:
      "A teaching-licensure path from a university built on preparing educators.",
    outcomes: {
      roles: [
        { title: "Elementary Teacher", range: "$45–65K" },
        { title: "Reading Specialist", range: "$50–70K" },
        { title: "Curriculum Coordinator", range: "$60–85K" },
      ],
      employers: ["Deer Valley USD", "Peoria USD", "Chandler USD", "Great Hearts Academies", "BASIS Charter Schools"],
      personal:
        "A classroom of lives you shape for decades — few careers echo this long.",
      spiritual:
        "Teaching as calling — every student made with a purpose you get to help uncover.",
    },
  },
  {
    id: "med",
    name: "M.Ed. in Educational Leadership",
    tags: ["teaching"],
    modes: ["online"],
    blurb:
      "For teachers ready to lead schools, districts, and the next generation of educators.",
    outcomes: {
      roles: [
        { title: "Assistant Principal", range: "$75–100K" },
        { title: "Principal", range: "$90–130K" },
        { title: "Instructional Coach", range: "$65–85K" },
      ],
      employers: ["Phoenix-area districts", "Great Hearts Academies", "BASIS Charter Schools", "charter networks", "private schools"],
      personal:
        "From changing one classroom to changing a whole school's culture.",
      spiritual:
        "Shepherding teachers and students alike — leadership that serves first.",
    },
  },
  {
    id: "cj",
    name: "B.S. Criminal Justice",
    tags: ["justice", "helping"],
    modes: ["online", "ground"],
    blurb:
      "Law, criminology, and public safety — for those who want to serve their community.",
    outcomes: {
      roles: [
        { title: "Police Officer", range: "$55–80K" },
        { title: "Probation Officer", range: "$50–70K" },
        { title: "Federal Agent track", range: "$60–100K" },
      ],
      employers: ["Phoenix Police Dept.", "Maricopa County", "Arizona DPS", "FBI", "Dept. of Homeland Security"],
      personal:
        "Purpose you can feel — protecting neighbors and standing for what's right.",
      spiritual:
        "Justice and mercy held together, serving your community with honor.",
    },
  },
  {
    id: "ministry",
    name: "B.A. Christian Ministry",
    tags: ["ministry", "helping"],
    modes: ["online", "ground"],
    blurb:
      "Rooted in GCU's Christian heritage — theology, leadership, and a life of service.",
    outcomes: {
      roles: [
        { title: "Youth Pastor", range: "$40–60K" },
        { title: "Ministry Director", range: "$45–70K" },
        { title: "Chaplain", range: "$50–75K" },
      ],
      employers: ["local churches & church plants", "Young Life", "Compassion International", "Food for the Hungry", "hospital chaplaincies"],
      personal: "Alignment — when what you do all week is who you are.",
      spiritual:
        "A life poured out for the Kingdom, equipped with theology and leadership to serve well.",
    },
  },
  {
    id: "worship",
    name: "B.A. Worship Arts",
    tags: ["ministry", "arts"],
    modes: ["ground"],
    blurb:
      "Where musicianship meets ministry, on a campus with a thriving arts community.",
    outcomes: {
      roles: [
        { title: "Worship Leader", range: "$40–65K" },
        { title: "Music Director", range: "$45–70K" },
        { title: "Production Director", range: "$50–80K" },
      ],
      employers: ["local & multisite churches", "Christian media & labels", "touring ministries", "conference & event teams", "schools & camps"],
      personal:
        "Making music that matters, with a craft that grows every week.",
      spiritual:
        "Leading people into worship — artistry offered back to the One who gave it.",
    },
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
