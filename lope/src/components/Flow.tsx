const STEPS = [
  {
    n: "STEP 01",
    title: "Listen",
    body: "A handful of human questions — how you want to learn, what pulls at you, where you are in life.",
  },
  {
    n: "STEP 02",
    title: "Reason",
    body: "Lope matches your answers against programs, formats, prerequisites, and transfer paths to find genuine fits.",
  },
  {
    n: "STEP 03",
    title: "Recommend",
    body: "One clear path with honest cost and timeline — plus alternatives, and the reasoning behind the pick.",
  },
  {
    n: "STEP 04",
    title: "Hand off",
    body: "A warm transfer to an application or a counselor who already knows your whole story.",
  },
];

export default function Flow() {
  return (
    <section className="bg-surface-2 py-[84px]">
      <div className="wrap">
        <div className="reveal">
          <span className="kicker">Under the hood</span>
          <h2 className="head">Four quiet steps behind one simple experience.</h2>
        </div>
        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="reveal rounded-[18px] border border-line bg-surface px-5 py-6"
            >
              <div
                className="text-[13px] font-bold tracking-[0.05em] tabular-nums"
                style={{ color: "var(--purple-bright)" }}
              >
                {s.n}
              </div>
              <h4 className="mb-2 mt-3 text-[17px] font-bold tracking-[-0.02em]">
                {s.title}
              </h4>
              <p className="text-sm leading-normal text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
