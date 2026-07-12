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
  college: string;
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
    id: "business",
    name: "B.S. Business Administration",
    college: "Colangelo College of Business",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb: "A broad, flexible core — management, marketing, finance — for builders and future leaders.",
    outcomes: {
      roles: [
        { title: "Operations Manager", range: "$70–100K" },
        { title: "Business Analyst", range: "$65–95K" },
        { title: "Project Coordinator", range: "$55–80K" },
      ],
      employers: ["American Express", "State Farm", "Vanguard", "Amazon", "USAA"],
      personal: "The confidence to lead — a foundation you can build any career, or company, on.",
      spiritual: "Leadership as service: doing business with integrity in a world that notices.",
    },
  },
  {
    id: "marketing",
    name: "B.S. Marketing",
    college: "Colangelo College of Business",
    tags: ["business", "arts"],
    modes: ["online", "ground"],
    blurb: "Brand strategy, digital campaigns, and consumer insight for the storytellers of business.",
    outcomes: {
      roles: [
        { title: "Marketing Coordinator", range: "$50–70K" },
        { title: "Brand Manager", range: "$70–110K" },
        { title: "Digital Marketing Lead", range: "$65–100K" },
      ],
      employers: ["Nike", "American Express", "Adobe", "PetSmart", "local agencies"],
      personal: "Turn the brands you obsess over into the work you do all day.",
      spiritual: "Persuasion with honesty — telling true stories that actually help people choose well.",
    },
  },
  {
    id: "finance",
    name: "B.S. Finance and Economics",
    college: "Colangelo College of Business",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb: "Markets, investment, and economic analysis for the numbers-driven decision maker.",
    outcomes: {
      roles: [
        { title: "Financial Analyst", range: "$65–95K" },
        { title: "Investment Associate", range: "$70–110K" },
        { title: "Risk Analyst", range: "$65–90K" },
      ],
      employers: ["Charles Schwab", "Vanguard", "JPMorgan", "Northern Trust", "American Express"],
      personal: "Learn how money really moves — a skill that pays for the rest of your life.",
      spiritual: "Stewardship at scale: handling resources wisely and for good.",
    },
  },
  {
    id: "accounting",
    name: "B.S. Accounting",
    college: "Colangelo College of Business",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb: "CPA-aligned coursework with a clear line to a stable, in-demand profession.",
    outcomes: {
      roles: [
        { title: "Staff Accountant", range: "$55–75K" },
        { title: "Auditor", range: "$60–85K" },
        { title: "CPA / Senior Accountant", range: "$75–110K" },
      ],
      employers: ["Deloitte", "PwC", "EY", "KPMG", "Northern Trust"],
      personal: "A profession of trust with a clear ladder and lifelong demand.",
      spiritual: "Integrity as a daily practice — being the person whose numbers everyone can believe.",
    },
  },
  {
    id: "biz-analytics",
    name: "B.S. Business Analytics",
    college: "Colangelo College of Business",
    tags: ["business", "tech"],
    modes: ["online", "ground"],
    blurb: "Where business meets data — turn spreadsheets and dashboards into decisions.",
    outcomes: {
      roles: [
        { title: "Business Intelligence Analyst", range: "$70–100K" },
        { title: "Data Analyst", range: "$65–95K" },
        { title: "Operations Analyst", range: "$60–85K" },
      ],
      employers: ["Amazon", "Intel", "American Express", "Deloitte", "Charles Schwab"],
      personal: "Be the person in the room who can prove what actually works.",
      spiritual: "Truth-telling with data — decisions grounded in reality, not guesswork.",
    },
  },
  {
    id: "sports-biz",
    name: "B.S. Sports Management",
    college: "Colangelo College of Business",
    tags: ["business", "health"],
    modes: ["online", "ground"],
    blurb: "The business behind the game — operations, marketing, and management in sport.",
    outcomes: {
      roles: [
        { title: "Athletics Operations Coordinator", range: "$45–65K" },
        { title: "Sports Marketing Manager", range: "$60–90K" },
        { title: "Facility / Event Manager", range: "$55–80K" },
      ],
      employers: ["Phoenix Suns", "Arizona Diamondbacks", "Nike", "collegiate athletics", "event & venue firms"],
      personal: "Stay close to the game you love — build a career around it.",
      spiritual: "Serving teams and communities through the unifying power of sport.",
    },
  },
  {
    id: "mba",
    name: "Master of Business Administration (MBA)",
    college: "Colangelo College of Business",
    tags: ["business"],
    modes: ["online", "ground"],
    blurb: "Accelerate into leadership, with emphases from finance to health systems management.",
    outcomes: {
      roles: [
        { title: "Senior Manager", range: "$100–140K" },
        { title: "Director of Operations", range: "$110–160K" },
        { title: "Product Manager", range: "$110–150K" },
      ],
      employers: ["Intel", "American Express", "Honeywell", "Deloitte", "Charles Schwab"],
      personal: "The credential that turns “someday” leadership into a title and a team.",
      spiritual: "Influence multiplied — servant leadership at the scale of whole organizations.",
    },
  },
  {
    id: "nursing",
    name: "B.S. Nursing (BSN)",
    college: "College of Nursing and Health Care Professions",
    tags: ["health"],
    modes: ["ground"],
    blurb: "GCU’s pre-licensure nursing track pairs classroom science with simulation labs and clinical placements.",
    outcomes: {
      roles: [
        { title: "Registered Nurse", range: "$75–95K" },
        { title: "ICU / Critical Care Nurse", range: "$80–105K" },
        { title: "Nurse Educator", range: "$85–110K" },
      ],
      employers: ["Mayo Clinic", "Banner Health", "HonorHealth", "Dignity Health", "Phoenix Children’s"],
      personal: "The steadiness that comes from knowing you can walk into someone’s worst day and make it better.",
      spiritual: "Healing as ministry — caring for the whole person, body and spirit.",
    },
  },
  {
    id: "rn-bsn",
    name: "RN to BSN",
    college: "College of Nursing and Health Care Professions",
    tags: ["health"],
    modes: ["online"],
    blurb: "Built for working registered nurses who want to advance without stepping away from the floor.",
    outcomes: {
      roles: [
        { title: "Charge Nurse", range: "$85–105K" },
        { title: "Nurse Manager", range: "$95–125K" },
        { title: "Clinical Case Manager", range: "$75–95K" },
      ],
      employers: ["Mayo Clinic", "Banner Health", "HCA Healthcare", "Kaiser Permanente", "Ascension"],
      personal: "Growth without giving up the bedside — leadership that honors what you’ve already earned.",
      spiritual: "Your years of service become stewardship — mentoring the nurses coming up behind you.",
    },
  },
  {
    id: "msn",
    name: "Master of Science in Nursing (MSN)",
    college: "College of Nursing and Health Care Professions",
    tags: ["health"],
    modes: ["online"],
    blurb: "Advance into leadership, education, or informatics with a graduate nursing degree.",
    outcomes: {
      roles: [
        { title: "Nurse Leader", range: "$100–130K" },
        { title: "Nurse Educator", range: "$85–110K" },
        { title: "Nursing Informatics Specialist", range: "$90–120K" },
      ],
      employers: ["Banner Health", "Mayo Clinic", "HonorHealth", "universities", "health systems"],
      personal: "Shape how care is delivered, not just deliver it.",
      spiritual: "Leading caregivers well so patients are served well.",
    },
  },
  {
    id: "health-admin",
    name: "B.S. Health Care Administration",
    college: "College of Nursing and Health Care Professions",
    tags: ["health", "business"],
    modes: ["online", "ground"],
    blurb: "The business of care — operations, policy, and leadership for the health systems that need it.",
    outcomes: {
      roles: [
        { title: "Health Services Manager", range: "$80–115K" },
        { title: "Practice Manager", range: "$65–90K" },
        { title: "Patient Experience Lead", range: "$60–85K" },
      ],
      employers: ["Banner Health", "UnitedHealth Group", "CVS Health", "Cigna", "HonorHealth"],
      personal: "A seat at the table where care gets decided.",
      spiritual: "Serving the servants: building systems that let caregivers do their calling well.",
    },
  },
  {
    id: "public-health",
    name: "B.S. Public Health",
    college: "College of Nursing and Health Care Professions",
    tags: ["health", "helping"],
    modes: ["online", "ground"],
    blurb: "Population health, epidemiology, and community wellness — care beyond the bedside.",
    outcomes: {
      roles: [
        { title: "Community Health Worker", range: "$45–60K" },
        { title: "Health Educator", range: "$50–70K" },
        { title: "Epidemiology Assistant", range: "$55–75K" },
      ],
      employers: ["Maricopa County Public Health", "Banner Health", "CDC-affiliated agencies", "nonprofits", "school districts"],
      personal: "Care for whole communities, not one patient at a time.",
      spiritual: "Loving your neighbor at the scale of a whole city.",
    },
  },
  {
    id: "health-sciences",
    name: "B.S. Health Sciences (Pre-Professional)",
    college: "College of Nursing and Health Care Professions",
    tags: ["health", "science"],
    modes: ["online", "ground"],
    blurb: "A flexible pre-med / pre-PA / pre-PT foundation for the future of healthcare.",
    outcomes: {
      roles: [
        { title: "Medical Assistant", range: "$40–55K" },
        { title: "Clinical Research Coordinator", range: "$55–75K" },
        { title: "Pre-Med / Pre-PA track", range: "varies" },
      ],
      employers: ["Mayo Clinic", "Banner Health", "medical & PA schools", "research labs", "clinics"],
      personal: "The launchpad for the health career you’ve pictured since you were a kid.",
      spiritual: "Preparing to heal — a calling worth years of preparation.",
    },
  },
  {
    id: "exercise-science",
    name: "B.S. Exercise Science",
    college: "College of Nursing and Health Care Professions",
    tags: ["health"],
    modes: ["ground"],
    blurb: "The science of movement — for future trainers, therapists, and performance coaches.",
    outcomes: {
      roles: [
        { title: "Exercise Physiologist", range: "$50–70K" },
        { title: "Strength & Conditioning Coach", range: "$45–70K" },
        { title: "Rehab Aide (Pre-PT)", range: "$40–55K" },
      ],
      employers: ["EXOS", "Banner Health", "collegiate & pro athletics", "physical therapy clinics", "wellness centers"],
      personal: "You already care about how bodies work — that’s the whole field.",
      spiritual: "Stewarding the body as a gift, and helping others do the same.",
    },
  },
  {
    id: "dnp",
    name: "Doctor of Nursing Practice (DNP)",
    college: "College of Nursing and Health Care Professions",
    tags: ["health"],
    modes: ["online"],
    blurb: "The terminal practice degree for nurse leaders shaping the future of care.",
    outcomes: {
      roles: [
        { title: "DNP-Prepared Nurse Leader", range: "$110–150K" },
        { title: "Director of Nursing", range: "$120–160K" },
        { title: "Clinical Program Director", range: "$115–150K" },
      ],
      employers: ["Mayo Clinic", "Banner Health", "large health systems", "universities"],
      personal: "The top of your profession — where policy and practice meet.",
      spiritual: "Shepherding the people who care for everyone else.",
    },
  },
  {
    id: "psych",
    name: "B.S. Psychology",
    college: "College of Humanities and Social Sciences",
    tags: ["helping", "health", "science"],
    modes: ["online", "ground"],
    blurb: "The science of people, and a foundation for counseling, social work, and graduate study.",
    outcomes: {
      roles: [
        { title: "Behavioral Health Technician", range: "$40–55K" },
        { title: "Case Manager", range: "$45–60K" },
        { title: "People / HR Specialist", range: "$55–75K" },
      ],
      employers: ["Banner Health", "Terros Health", "Southwest Behavioral & Health", "Phoenix Children’s", "school districts"],
      personal: "A deeper understanding of people — starting with yourself.",
      spiritual: "Seeing every person as made with worth and purpose.",
    },
  },
  {
    id: "counseling",
    name: "M.S. Clinical Mental Health Counseling",
    college: "College of Humanities and Social Sciences",
    tags: ["helping"],
    modes: ["online", "ground"],
    blurb: "A licensure-track master’s for those called to sit with people in their hardest moments.",
    outcomes: {
      roles: [
        { title: "Licensed Professional Counselor", range: "$60–85K" },
        { title: "Clinical Therapist", range: "$60–90K" },
        { title: "Community Counselor", range: "$55–75K" },
      ],
      employers: ["Terros Health", "Southwest Behavioral & Health", "Phoenix Children’s", "private practice", "church counseling centers"],
      personal: "Work that ends most days knowing someone left more whole than they arrived.",
      spiritual: "A vocation of presence — sitting with people in darkness and pointing toward hope.",
    },
  },
  {
    id: "cj",
    name: "B.S. Criminal Justice",
    college: "College of Humanities and Social Sciences",
    tags: ["justice", "helping"],
    modes: ["online", "ground"],
    blurb: "Law, criminology, and public safety — for those who want to serve their community.",
    outcomes: {
      roles: [
        { title: "Police Officer", range: "$55–80K" },
        { title: "Probation Officer", range: "$50–70K" },
        { title: "Federal Agent track", range: "$60–100K" },
      ],
      employers: ["Phoenix Police Dept.", "Maricopa County", "Arizona DPS", "FBI", "Dept. of Homeland Security"],
      personal: "Purpose you can feel — protecting neighbors and standing for what’s right.",
      spiritual: "Justice and mercy held together, serving your community with honor.",
    },
  },
  {
    id: "forensic-psych",
    name: "B.S. Forensic Psychology",
    college: "College of Humanities and Social Sciences",
    tags: ["justice", "helping", "science"],
    modes: ["online", "ground"],
    blurb: "Where psychology meets the justice system — the real version of the shows you binge.",
    outcomes: {
      roles: [
        { title: "Victim Advocate", range: "$40–55K" },
        { title: "Corrections Counselor", range: "$45–65K" },
        { title: "Forensic Case Analyst", range: "$50–70K" },
      ],
      employers: ["Maricopa County", "Arizona DOC", "victim-services nonprofits", "courts", "FBI"],
      personal: "Bring understanding to the places that need it most.",
      spiritual: "Sharp, fair minds serving both the victim and the accused.",
    },
  },
  {
    id: "communications",
    name: "B.A. Communications",
    college: "College of Humanities and Social Sciences",
    tags: ["arts", "business"],
    modes: ["online", "ground"],
    blurb: "Media, messaging, and public relations for natural storytellers and connectors.",
    outcomes: {
      roles: [
        { title: "Communications Specialist", range: "$50–70K" },
        { title: "Public Relations Coordinator", range: "$50–72K" },
        { title: "Social Media Manager", range: "$50–80K" },
      ],
      employers: ["local & national brands", "nonprofits", "PR agencies", "sports organizations", "media outlets"],
      personal: "You already run a brand — imagine it with a real engine behind it.",
      spiritual: "Words that build up rather than tear down.",
    },
  },
  {
    id: "english",
    name: "B.A. English Literature",
    college: "College of Humanities and Social Sciences",
    tags: ["arts", "teaching"],
    modes: ["online", "ground"],
    blurb: "Great books, sharp writing, and the analytical mind employers quietly prize.",
    outcomes: {
      roles: [
        { title: "Content Writer / Editor", range: "$50–75K" },
        { title: "Technical Writer", range: "$60–90K" },
        { title: "Teacher (with cert.)", range: "$45–65K" },
      ],
      employers: ["publishers", "tech & marketing teams", "school districts", "nonprofits", "media outlets"],
      personal: "Learn to think and write clearly — the skill under every other skill.",
      spiritual: "Language as a craft, and stories as a way to tell the truth.",
    },
  },
  {
    id: "elem-ed",
    name: "B.S. Elementary Education",
    college: "College of Education",
    tags: ["teaching"],
    modes: ["online", "ground"],
    blurb: "A teaching-licensure path from a university built on preparing educators.",
    outcomes: {
      roles: [
        { title: "Elementary Teacher", range: "$45–65K" },
        { title: "Reading Specialist", range: "$50–70K" },
        { title: "Curriculum Coordinator", range: "$60–85K" },
      ],
      employers: ["Deer Valley USD", "Peoria USD", "Chandler USD", "Great Hearts Academies", "BASIS Charter Schools"],
      personal: "A classroom of lives you shape for decades.",
      spiritual: "Teaching as calling — every student made with a purpose you help uncover.",
    },
  },
  {
    id: "special-ed",
    name: "B.S. Special Education",
    college: "College of Education",
    tags: ["teaching", "helping"],
    modes: ["online", "ground"],
    blurb: "Prepare to teach and advocate for students with the greatest need — and the greatest reward.",
    outcomes: {
      roles: [
        { title: "Special Education Teacher", range: "$48–68K" },
        { title: "Behavior Interventionist", range: "$45–62K" },
        { title: "Inclusion Specialist", range: "$55–75K" },
      ],
      employers: ["Arizona school districts", "charter networks", "private schools", "early-intervention programs"],
      personal: "Be the teacher a family never forgets.",
      spiritual: "Showing up for the students the world too often overlooks.",
    },
  },
  {
    id: "secondary-ed",
    name: "B.S. Secondary Education",
    college: "College of Education",
    tags: ["teaching"],
    modes: ["online", "ground"],
    blurb: "Teach the subject you love to the students who’ll remember you for it.",
    outcomes: {
      roles: [
        { title: "High School Teacher", range: "$46–66K" },
        { title: "Content-Area Lead", range: "$55–75K" },
        { title: "Instructional Coach", range: "$60–82K" },
      ],
      employers: ["Arizona school districts", "Great Hearts Academies", "BASIS Charter Schools", "private schools"],
      personal: "Turn your favorite subject into your life’s work.",
      spiritual: "Investing in teenagers at the moment they’re deciding who to become.",
    },
  },
  {
    id: "med-leadership",
    name: "M.Ed. in Educational Leadership",
    college: "College of Education",
    tags: ["teaching"],
    modes: ["online"],
    blurb: "For teachers ready to lead schools, districts, and the next generation of educators.",
    outcomes: {
      roles: [
        { title: "Assistant Principal", range: "$75–100K" },
        { title: "Principal", range: "$90–130K" },
        { title: "Instructional Coach", range: "$65–85K" },
      ],
      employers: ["Phoenix-area districts", "Great Hearts Academies", "BASIS Charter Schools", "charter networks", "private schools"],
      personal: "From changing one classroom to changing a whole school’s culture.",
      spiritual: "Shepherding teachers and students alike — leadership that serves first.",
    },
  },
  {
    id: "cs",
    name: "B.S. Computer Science",
    college: "College of Science, Engineering and Technology",
    tags: ["tech"],
    modes: ["online", "ground"],
    blurb: "Algorithms, systems, and software engineering — the deep track for builders of technology.",
    outcomes: {
      roles: [
        { title: "Software Engineer", range: "$90–140K" },
        { title: "Machine Learning Engineer", range: "$120–180K" },
        { title: "Systems Developer", range: "$85–130K" },
      ],
      employers: ["Microsoft", "Amazon", "Intel", "GoDaddy", "American Express"],
      personal: "The power to build things millions of people use.",
      spiritual: "Creation reflecting the Creator — technology that genuinely serves people.",
    },
  },
  {
    id: "cyber",
    name: "B.S. Cybersecurity",
    college: "College of Science, Engineering and Technology",
    tags: ["tech", "justice"],
    modes: ["online", "ground"],
    blurb: "Hands-on defense, ethical hacking, and a field that can’t hire fast enough.",
    outcomes: {
      roles: [
        { title: "Security Analyst", range: "$80–115K" },
        { title: "Penetration Tester", range: "$95–140K" },
        { title: "Security Engineer", range: "$100–150K" },
      ],
      employers: ["Northrop Grumman", "RTX (Raytheon)", "Wells Fargo", "CrowdStrike", "Deloitte"],
      personal: "The quiet confidence of being the one who protects everyone else.",
      spiritual: "Guardianship as calling — defending communities from harm they never see.",
    },
  },
  {
    id: "software-dev",
    name: "B.S. Software Development",
    college: "College of Science, Engineering and Technology",
    tags: ["tech"],
    modes: ["online", "ground"],
    blurb: "Build real applications end to end — the fastest route from idea to shipped product.",
    outcomes: {
      roles: [
        { title: "Software Developer", range: "$85–130K" },
        { title: "Full-Stack Engineer", range: "$95–145K" },
        { title: "Mobile Developer", range: "$90–135K" },
      ],
      employers: ["GoDaddy", "Amazon", "Microsoft", "Carvana", "startups"],
      personal: "The people who build the apps you love sit in these classes first.",
      spiritual: "Making things that work well — craftsmanship as worship.",
    },
  },
  {
    id: "it",
    name: "B.S. Information Technology",
    college: "College of Science, Engineering and Technology",
    tags: ["tech", "business"],
    modes: ["online", "ground"],
    blurb: "The practical bridge between people and the systems they rely on every day.",
    outcomes: {
      roles: [
        { title: "Systems Administrator", range: "$65–95K" },
        { title: "Network Engineer", range: "$75–110K" },
        { title: "Cloud Administrator", range: "$80–120K" },
      ],
      employers: ["Insight Enterprises", "Avnet", "State Farm", "Banner Health", "Charles Schwab"],
      personal: "Every organization runs on what you know.",
      spiritual: "Faithful in the unseen things — keeping the systems people depend on running.",
    },
  },
  {
    id: "mech-eng",
    name: "B.S. Mechanical Engineering",
    college: "College of Science, Engineering and Technology",
    tags: ["tech", "science"],
    modes: ["ground"],
    blurb: "Design and build real machines — from engines to robotics — in GCU’s engineering labs.",
    outcomes: {
      roles: [
        { title: "Mechanical Engineer", range: "$70–100K" },
        { title: "Design Engineer", range: "$72–105K" },
        { title: "Manufacturing Engineer", range: "$70–98K" },
      ],
      employers: ["Honeywell", "Northrop Grumman", "RTX (Raytheon)", "Intel", "Boeing"],
      personal: "Build the physical things the future is made of.",
      spiritual: "Bringing order and usefulness out of raw materials.",
    },
  },
  {
    id: "elec-eng",
    name: "B.S. Electrical Engineering",
    college: "College of Science, Engineering and Technology",
    tags: ["tech", "science"],
    modes: ["ground"],
    blurb: "Circuits, power, and embedded systems — the invisible backbone of modern life.",
    outcomes: {
      roles: [
        { title: "Electrical Engineer", range: "$75–105K" },
        { title: "Embedded Systems Engineer", range: "$85–120K" },
        { title: "Power Systems Engineer", range: "$78–110K" },
      ],
      employers: ["Intel", "Honeywell", "Northrop Grumman", "APS", "RTX (Raytheon)"],
      personal: "Understand and build the systems that power everything.",
      spiritual: "Precision work that quietly serves millions.",
    },
  },
  {
    id: "biomed-eng",
    name: "B.S. Biomedical Engineering",
    college: "College of Science, Engineering and Technology",
    tags: ["tech", "science", "health"],
    modes: ["ground"],
    blurb: "Where engineering meets medicine — design the devices that save lives.",
    outcomes: {
      roles: [
        { title: "Biomedical Engineer", range: "$75–110K" },
        { title: "Medical Device Engineer", range: "$85–120K" },
        { title: "Clinical Engineer", range: "$78–108K" },
      ],
      employers: ["Medtronic", "Banner Health", "Mayo Clinic", "medical-device firms", "research labs"],
      personal: "Engineer the tools that let doctors do the impossible.",
      spiritual: "Technology in direct service of healing.",
    },
  },
  {
    id: "biology",
    name: "B.S. Biology",
    college: "College of Natural Sciences",
    tags: ["science", "health"],
    modes: ["online", "ground"],
    blurb: "Life science from cells to ecosystems — and a strong pre-med / research foundation.",
    outcomes: {
      roles: [
        { title: "Laboratory Technician", range: "$45–62K" },
        { title: "Research Associate", range: "$50–72K" },
        { title: "Pre-Med track", range: "varies" },
      ],
      employers: ["Mayo Clinic", "TGen", "Banner Health", "research universities", "biotech firms"],
      personal: "Understand how living things work — then go heal or discover.",
      spiritual: "Wonder at creation, studied closely.",
    },
  },
  {
    id: "chemistry",
    name: "B.S. Chemistry",
    college: "College of Natural Sciences",
    tags: ["science"],
    modes: ["ground"],
    blurb: "The central science — hands-on lab work for future researchers, pharmacists, and doctors.",
    outcomes: {
      roles: [
        { title: "Chemist", range: "$55–80K" },
        { title: "Quality Control Analyst", range: "$50–72K" },
        { title: "Pre-Pharmacy track", range: "varies" },
      ],
      employers: ["TGen", "biotech & pharma firms", "research labs", "manufacturing", "universities"],
      personal: "Work at the level where matter itself is understood.",
      spiritual: "Studying the building blocks of a made world.",
    },
  },
  {
    id: "forensic-science",
    name: "B.S. Forensic Science",
    college: "College of Natural Sciences",
    tags: ["science", "justice"],
    modes: ["ground"],
    blurb: "Lab science in service of justice — the real work behind every true-crime case.",
    outcomes: {
      roles: [
        { title: "Forensic Lab Technician", range: "$50–72K" },
        { title: "Crime Scene Analyst", range: "$52–75K" },
        { title: "Toxicology Assistant", range: "$50–70K" },
      ],
      employers: ["Arizona DPS crime lab", "Maricopa County", "FBI", "medical examiner offices", "private labs"],
      personal: "The rigorous, real version of the cases you can’t stop watching.",
      spiritual: "Careful truth-seeking that gives victims a voice.",
    },
  },
  {
    id: "math",
    name: "B.S. Mathematics",
    college: "College of Natural Sciences",
    tags: ["science", "tech"],
    modes: ["online", "ground"],
    blurb: "Pure and applied math — the language behind data, engineering, and finance.",
    outcomes: {
      roles: [
        { title: "Data Analyst", range: "$65–95K" },
        { title: "Actuarial track", range: "$70–110K" },
        { title: "Math Teacher (with cert.)", range: "$46–66K" },
      ],
      employers: ["insurance & finance firms", "tech companies", "school districts", "research labs"],
      personal: "Master the skill that quietly unlocks the highest-demand fields.",
      spiritual: "Finding the elegant order woven through everything.",
    },
  },
  {
    id: "christian-min",
    name: "B.A. Christian Ministry",
    college: "College of Theology",
    tags: ["ministry", "helping"],
    modes: ["online", "ground"],
    blurb: "Rooted in GCU’s Christian heritage — theology, leadership, and a life of service.",
    outcomes: {
      roles: [
        { title: "Youth Pastor", range: "$40–60K" },
        { title: "Ministry Director", range: "$45–70K" },
        { title: "Chaplain", range: "$50–75K" },
      ],
      employers: ["local churches & church plants", "Young Life", "Compassion International", "Food for the Hungry", "hospital chaplaincies"],
      personal: "Alignment — when what you do all week is who you are.",
      spiritual: "A life poured out for the Kingdom, equipped to serve well.",
    },
  },
  {
    id: "youth-min",
    name: "B.A. Youth Ministry",
    college: "College of Theology",
    tags: ["ministry", "helping", "teaching"],
    modes: ["online", "ground"],
    blurb: "Prepare to lead, mentor, and disciple the next generation.",
    outcomes: {
      roles: [
        { title: "Youth Pastor", range: "$40–60K" },
        { title: "Camp / Program Director", range: "$42–62K" },
        { title: "Discipleship Coordinator", range: "$40–58K" },
      ],
      employers: ["local churches", "Young Life", "camps & conference ministries", "Christian schools"],
      personal: "Invest in students at the age everything is being decided.",
      spiritual: "Walking alongside young people as they meet their purpose.",
    },
  },
  {
    id: "divinity",
    name: "Master of Divinity (MDiv)",
    college: "College of Theology",
    tags: ["ministry"],
    modes: ["online"],
    blurb: "The graduate degree for pastors, chaplains, and ministry leaders.",
    outcomes: {
      roles: [
        { title: "Lead Pastor", range: "$50–80K" },
        { title: "Chaplain", range: "$50–75K" },
        { title: "Ministry Executive", range: "$55–85K" },
      ],
      employers: ["churches & denominations", "hospital & military chaplaincy", "nonprofits", "seminaries"],
      personal: "Go deep — the full preparation for a life of ministry.",
      spiritual: "Answering the call with your whole mind and heart.",
    },
  },
  {
    id: "worship",
    name: "B.A. Worship Arts",
    college: "College of Arts and Media",
    tags: ["ministry", "arts"],
    modes: ["ground"],
    blurb: "Where musicianship meets ministry, on a campus with a thriving arts community.",
    outcomes: {
      roles: [
        { title: "Worship Leader", range: "$40–65K" },
        { title: "Music Director", range: "$45–70K" },
        { title: "Production Director", range: "$50–80K" },
      ],
      employers: ["local & multisite churches", "Christian media & labels", "touring ministries", "conference & event teams"],
      personal: "Making music that matters, with a craft that grows every week.",
      spiritual: "Leading people into worship — artistry offered back to the One who gave it.",
    },
  },
  {
    id: "digital-film",
    name: "B.A. Digital Film",
    college: "College of Arts and Media",
    tags: ["arts"],
    modes: ["ground"],
    blurb: "Write, shoot, and edit — hands-on filmmaking for visual storytellers.",
    outcomes: {
      roles: [
        { title: "Video Editor", range: "$50–75K" },
        { title: "Cinematographer", range: "$50–85K" },
        { title: "Production Coordinator", range: "$45–70K" },
      ],
      employers: ["Netflix & studios", "local production houses", "ad agencies", "churches & nonprofits", "streaming teams"],
      personal: "Story is a craft, and crafts can be careers.",
      spiritual: "Telling true stories that move people toward what’s good.",
    },
  },
  {
    id: "graphic-design",
    name: "B.A. Advertising and Graphic Design",
    college: "College of Arts and Media",
    tags: ["arts", "business"],
    modes: ["online", "ground"],
    blurb: "Brand identity, visual design, and campaigns — creativity with a commercial edge.",
    outcomes: {
      roles: [
        { title: "Graphic Designer", range: "$50–72K" },
        { title: "UX / Product Designer", range: "$70–110K" },
        { title: "Art Director", range: "$70–105K" },
      ],
      employers: ["Adobe", "design & ad agencies", "Nike", "in-house brand teams", "startups"],
      personal: "Turn the eye you already have into a career.",
      spiritual: "Beauty and clarity as a way to serve the people who see your work.",
    },
  },
  {
    id: "music",
    name: "B.A. Music",
    college: "College of Arts and Media",
    tags: ["arts"],
    modes: ["ground"],
    blurb: "Performance, composition, and production for serious musicians.",
    outcomes: {
      roles: [
        { title: "Performer / Session Musician", range: "varies" },
        { title: "Music Producer", range: "$45–80K" },
        { title: "Music Educator (with cert.)", range: "$45–65K" },
      ],
      employers: ["labels & studios", "touring acts", "churches", "schools", "media & film scoring"],
      personal: "Give your gift the training it deserves.",
      spiritual: "Offering your craft as something bigger than yourself.",
    },
  },
  {
    id: "dba",
    name: "Doctor of Business Administration (DBA)",
    college: "College of Doctoral Studies",
    tags: ["business"],
    modes: ["online"],
    blurb: "The terminal business degree for executives, consultants, and professors.",
    outcomes: {
      roles: [
        { title: "Executive / VP", range: "$140–200K" },
        { title: "Management Consultant", range: "$120–180K" },
        { title: "Business Professor", range: "$90–130K" },
      ],
      employers: ["consulting firms", "universities", "corporations", "own practice"],
      personal: "The top of the business world — and the classroom.",
      spiritual: "Wisdom and leadership poured back into others.",
    },
  },
  {
    id: "edd",
    name: "Doctor of Education (EdD) in Organizational Leadership",
    college: "College of Doctoral Studies",
    tags: ["teaching", "business"],
    modes: ["online"],
    blurb: "Lead organizations and institutions — the doctorate for change-makers.",
    outcomes: {
      roles: [
        { title: "Superintendent / Cabinet Leader", range: "$110–160K" },
        { title: "University Administrator", range: "$100–150K" },
        { title: "Org. Leadership Consultant", range: "$100–150K" },
      ],
      employers: ["school districts", "universities", "nonprofits", "corporations"],
      personal: "Lead at the level where whole systems change.",
      spiritual: "Servant leadership carried to its fullest expression.",
    },
  },
  {
    id: "phd-psych",
    name: "Ph.D. in General Psychology",
    college: "College of Doctoral Studies",
    tags: ["helping", "science"],
    modes: ["online"],
    blurb: "Research, teach, and shape the field — the doctorate for scholars of the mind.",
    outcomes: {
      roles: [
        { title: "University Professor", range: "$75–120K" },
        { title: "Researcher", range: "$70–110K" },
        { title: "Program Evaluator", range: "$75–105K" },
      ],
      employers: ["universities", "research institutes", "health systems", "government agencies"],
      personal: "Add to what humanity actually knows about people.",
      spiritual: "Pursuing truth about the human person, made in God’s image.",
    },
  },
];

export interface Obsession {
  id: string;
  ico: string;
  label: string;
  tags: string[];
  /** Dream brands the student obsesses over — surfaced as "could take you to …". */
  companies: string[];
  /** Hook line woven into the "why Lope picked this" explanation. */
  hook: string;
}

/** Obsessions: brands, products, hobbies, rabbit holes — the real person behind the application. */
export const OBSESSIONS: Obsession[] = [
  { id: "gaming", ico: "🎮", label: "Gaming", tags: ["tech"], companies: ["Riot Games", "Epic Games", "Xbox", "Electronic Arts"], hook: "the people who build the games you love sit in these classes first" },
  { id: "pcs", ico: "🖥️", label: "Building PCs", tags: ["tech"], companies: ["NVIDIA", "AMD", "Intel", "Microsoft"], hook: "you already think in systems — this just makes it official" },
  { id: "apple", ico: "📱", label: "Apple & tech drops", tags: ["tech", "business"], companies: ["Apple", "Google", "Microsoft"], hook: "the companies you follow hire exactly this degree" },
  { id: "space", ico: "🚀", label: "SpaceX & space", tags: ["tech"], companies: ["SpaceX", "Blue Origin", "NASA", "Lockheed Martin"], hook: "the teams launching rockets recruit straight from this field" },
  { id: "ev", ico: "⚡", label: "Tesla & EVs", tags: ["tech", "business"], companies: ["Tesla", "Rivian", "Lucid Motors"], hook: "the future you keep reading about is built by people with this degree" },
  { id: "sports", ico: "🏀", label: "Sports & training", tags: ["health", "business"], companies: ["Nike", "Under Armour", "pro sports teams"], hook: "careers around the game go deeper than playing it" },
  { id: "fitness", ico: "🏋️", label: "Fitness & nutrition", tags: ["health"], companies: ["Peloton", "WHOOP", "EXOS"], hook: "you already care about how bodies work — that's the whole field" },
  { id: "medshows", ico: "🩺", label: "Medical shows", tags: ["health"], companies: ["Mayo Clinic", "Banner Health", "HonorHealth"], hook: "you've binge-studied the vocabulary — now make it real" },
  { id: "film", ico: "🎬", label: "Film & Netflix", tags: ["arts"], companies: ["Netflix", "Disney", "A24"], hook: "story is a craft, and crafts can be careers" },
  { id: "music", ico: "🎵", label: "Music & production", tags: ["arts", "ministry"], companies: ["Spotify", "Universal Music", "Elevation Worship"], hook: "rooms full of people making music can be your day job" },
  { id: "creator", ico: "📸", label: "Content creating", tags: ["arts", "business"], companies: ["YouTube", "TikTok", "Adobe"], hook: "you already run a brand — imagine it with a business engine behind it" },
  { id: "sneakers", ico: "👟", label: "Nike & sneaker culture", tags: ["business", "arts"], companies: ["Nike", "StockX", "adidas"], hook: "the brands you track are marketing machines — learn to drive one" },
  { id: "investing", ico: "💸", label: "Investing & hustles", tags: ["business"], companies: ["Charles Schwab", "Fidelity", "JPMorgan"], hook: "you're already doing the homework — this adds the credentials" },
  { id: "truecrime", ico: "🕵️", label: "True crime", tags: ["justice", "helping"], companies: ["FBI", "Homeland Security", "county DA offices"], hook: "the real version of those cases needs sharp, fair minds" },
  { id: "volunteer", ico: "❤️", label: "Volunteering & missions", tags: ["ministry", "helping", "teaching"], companies: ["Compassion International", "Red Cross", "Teach For America"], hook: "you keep showing up for people — there's a career in that" },
  { id: "church", ico: "🙏", label: "Church & worship team", tags: ["ministry"], companies: ["multisite churches", "Young Life"], hook: "what you do on Sundays can be what you do every day" },
];

export const INTERESTS: Interest[] = [
  { id: "health", ico: "🩺", label: "Health & Nursing" },
  { id: "business", ico: "💼", label: "Business & Leadership" },
  { id: "tech", ico: "💻", label: "Tech & Engineering" },
  { id: "science", ico: "🔬", label: "Science & Research" },
  { id: "teaching", ico: "🍎", label: "Teaching & Education" },
  { id: "helping", ico: "🤝", label: "Counseling & Helping" },
  { id: "justice", ico: "⚖️", label: "Law & Justice" },
  { id: "ministry", ico: "✝️", label: "Ministry & Faith" },
  { id: "arts", ico: "🎨", label: "Arts & Media" },
];
