const FEATURES = [
  {
    ico: "🎯",
    title: "Match, don't market",
    body: "Lope reasons over 200+ GCU programs, format availability, prerequisites, and transfer credit to recommend a fit — and explains why in plain language a 17-year-old and a 40-year-old both trust.",
  },
  {
    ico: "🧭",
    title: "Always the next step",
    body: "Every conversation ends with one clear action — an application, a counselor, a campus visit — never a dead end. Momentum is the whole game.",
  },
  {
    ico: "🤝",
    title: "Warm handoff",
    body: "When a human should take over, Lope passes the full context to an enrollment counselor. No student ever repeats their story. No lead goes cold overnight.",
  },
  {
    ico: "🌎",
    title: "Meets them anywhere",
    body: "A phone at midnight, a laptop in a library, a QR code at a college fair. Same guide, same memory, same warmth across every doorway into GCU.",
  },
  {
    ico: "📊",
    title: "Enrollment intelligence",
    body: "Every conversation teaches the team what prospective students actually ask, where they hesitate, and which programs are heating up — insight that used to take a quarter to surface.",
  },
  {
    ico: "🛡️",
    title: "Honest by design",
    body: "Lope shows real cost estimates and time-to-finish up front, never overstates outcomes, and hands sensitive questions to people. Trust is the acquisition strategy.",
  },
];

export default function Platform() {
  return (
    <section className="bg-surface-2 py-[84px]" id="platform">
      <div className="wrap">
        <div className="reveal">
          <span className="kicker">The platform</span>
          <h2 className="head">
            Recruiting used to be a funnel. Lope makes it a relationship.
          </h2>
          <p className="lede">
            Under the friendly surface is an enrollment engine — one that meets a
            student the moment they're curious, remembers them, and hands the
            counseling team a warm, ready conversation instead of a cold lead.
          </p>
        </div>
        <div className="mt-11 grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="reveal rounded-card border border-line bg-surface p-7"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div
                className="mb-[18px] grid h-11 w-11 place-items-center rounded-[13px] text-[22px]"
                style={{ background: "color-mix(in srgb, var(--purple) 12%, transparent)" }}
              >
                {f.ico}
              </div>
              <h3 className="text-xl tracking-[-0.02em]">{f.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
