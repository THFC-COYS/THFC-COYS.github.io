export type LeadStatus = "ready" | "stalled" | "undecided";

export interface Lead {
  id: string;
  name: string;
  persona: "teen" | "adult";
  mode: "online" | "ground" | "either";
  program: string;
  time: string;
  status: LeadStatus;
  momentum: string[];
  signal: string;
  draft: string;
  /** Set when the autonomous Stall-Watch agent has re-engaged this lead. */
  autoNudged?: boolean;
}

export const STATUS_META: Record<LeadStatus, { cls: string; label: string }> = {
  ready: { cls: "ready", label: "🔥 Reach out now" },
  stalled: { cls: "stalled", label: "💤 Stalled at cost" },
  undecided: { cls: "undecided", label: "🧭 Needs a human" },
};

/** Illustrative counselor queue — in production this is fed by live Lope conversations. */
export const SEED_LEADS: Lead[] = [
  {
    id: "l1",
    name: "Maya R.",
    persona: "teen",
    mode: "ground",
    program: "B.S. Nursing (BSN)",
    time: "2m ago",
    status: "ready",
    momentum: [
      "Opened Lope from an Instagram ad",
      "Chose On Campus",
      "Picked Health & Nursing",
      "Matched B.S. Nursing (BSN)",
      'Tapped "Start my application"',
    ],
    signal:
      "Finished the full conversation and tapped Apply. Strike while it's warm — confirm receipt and offer a visit.",
    draft:
      "Hi Maya! I saw you just matched with our BSN program — that's my favorite conversation to have. I can hold a spot for a campus visit this Friday and walk you through scholarships (most first-years qualify for more than they expect). Want me to set it up?",
  },
  {
    id: "l2",
    name: "Marcus T.",
    persona: "adult",
    mode: "online",
    program: "RN to BSN",
    time: "14m ago",
    status: "stalled",
    momentum: [
      "Opened Lope at 11:42pm",
      "Chose Online",
      "Picked Health & Nursing",
      "Matched RN to BSN",
      "Paused on the cost estimate — 4 minutes",
      "Left without finishing",
    ],
    signal:
      "Stalled on the cost screen at midnight. Money is the question — answer it first, before anything else.",
    draft:
      "Hi Marcus — night-shift schedule? I work with a lot of RNs who do this program between shifts. One thing you may not have seen: with transfer credit and our RN partnership discounts, most working nurses pay well under sticker. Give me 10 minutes this week and I'll run your real number?",
  },
  {
    id: "l3",
    name: "Sofia G.",
    persona: "teen",
    mode: "either",
    program: "B.S. Psychology",
    time: "38m ago",
    status: "undecided",
    momentum: [
      "Third visit this week",
      "Explored Psychology, then Counseling",
      "Compared online vs. campus twice",
      "Didn't finish the conversation",
    ],
    signal:
      "Third visit, torn between two paths and two formats. Needs a human conversation, not another quiz.",
    draft:
      "Hi Sofia! Lope told me you've been weighing Psychology — and that you keep coming back (that usually means it matters). No pressure and no pitch: want 15 minutes to talk through where each path actually leads? I'll bring a map.",
  },
  {
    id: "l4",
    name: "David K.",
    persona: "adult",
    mode: "online",
    program: "Master of Business Administration (MBA)",
    time: "1h ago",
    status: "ready",
    momentum: [
      "Scanned a QR code at a base transition fair",
      "Chose Online",
      "Picked Business & Leadership",
      "Matched MBA",
      "Asked about military benefits",
      "Requested a counselor",
    ],
    signal:
      "Veteran, benefits question answered, asked for a human. He's ready — call, don't email.",
    draft:
      "David — thank you for your service, and good news: your benefits cover more of the MBA than most veterans expect. I've got your whole Lope conversation in front of me, so you won't repeat a word of it. I'm free at 2 or 4 today — which works?",
  },
];
