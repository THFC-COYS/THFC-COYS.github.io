const AGENTS = [
  {
    ico: "🎧",
    role: "Live",
    name: "Listener",
    body: 'Turns a few human answers — even free-text like “A24 films and thrifting” — into a real profile.',
    auto: false,
  },
  {
    ico: "🧭",
    role: "Live",
    name: "Matcher",
    body: "Ranks 46 programs across 9 GCU colleges by genuine fit, and explains the “why.”",
    auto: false,
  },
  {
    ico: "🌱",
    role: "Live",
    name: "Outcomes",
    body: "Attaches real careers, salary ranges, and the dream companies a student is chasing.",
    auto: false,
  },
  {
    ico: "✍️",
    role: "Autonomous",
    name: "Counselor",
    body: "Drafts the first outreach in the counselor’s voice the moment a conversation ends.",
    auto: true,
  },
  {
    ico: "🛰️",
    role: "Autonomous",
    name: "Stall-Watch",
    body: "Notices when a student pauses on cost and re-engages them automatically — before the lead goes cold.",
    auto: true,
  },
];

export default function Agents() {
  return (
    <section className="scroll-mt-16 bg-surface-2 py-[84px]" id="agents">
      <div className="wrap">
        <div className="reveal">
          <span className="kicker">Under the hood · Agentic by design</span>
          <h2 className="head">
            Not one chatbot — a small team of agents, working together.
          </h2>
          <p className="lede">
            Every Lope conversation runs through five specialized agents. Three respond
            while you talk; two keep working after you leave — drafting outreach and
            re-engaging students who go quiet, on their own.
          </p>
        </div>
        <div className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {AGENTS.map((a) => (
            <div
              key={a.name}
              className="reveal rounded-[18px] border border-line bg-surface p-[18px]"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div
                className="mb-3.5 grid h-[42px] w-[42px] place-items-center rounded-xl text-[21px]"
                style={{ background: "color-mix(in srgb, var(--purple) 12%, transparent)" }}
              >
                {a.ico}
              </div>
              <div
                className="text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ color: a.auto ? "var(--copper)" : "var(--purple-bright)" }}
              >
                {a.role}
              </div>
              <h4 className="mt-0.5 text-base tracking-[-0.02em]">{a.name}</h4>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">{a.body}</p>
              {a.auto && (
                <span
                  className="mt-3 inline-block rounded-full px-2.5 py-[3px] text-[11px] font-bold"
                  style={{
                    color: "var(--copper)",
                    background: "color-mix(in srgb, var(--copper) 15%, transparent)",
                  }}
                >
                  runs on its own
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
