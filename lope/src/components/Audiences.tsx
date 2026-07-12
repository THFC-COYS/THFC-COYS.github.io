function LaneItem({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-[11px] text-[15px] leading-[1.45] text-ink-soft">
      <span
        className="mt-px grid h-5 w-5 flex-none place-items-center rounded-full text-xs text-white"
        style={{ background: color }}
      >
        ✦
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function Audiences() {
  return (
    <section className="py-[84px]" id="audiences">
      <div className="wrap">
        <div className="reveal">
          <span className="kicker">Online &amp; Ground</span>
          <h2 className="head">
            Two very different students. One guide that knows the difference.
          </h2>
          <p className="lede">
            The 18-year-old picturing dorm life and the working parent studying
            after bedtime need opposite things. Lope adapts its questions, its
            recommendations, and its next step to each — without ever feeling
            like two products.
          </p>
        </div>
        <div className="mt-11 grid gap-5 md:grid-cols-2">
          <div
            className="reveal rounded-card border border-line p-[30px]"
            style={{
              background:
                "linear-gradient(160deg, color-mix(in srgb, var(--copper) 12%, var(--surface)), var(--surface))",
            }}
          >
            <span
              className="inline-block rounded-full px-3 py-[5px] text-xs font-bold uppercase tracking-[0.05em]"
              style={{
                color: "var(--copper)",
                background: "color-mix(in srgb, var(--copper) 18%, transparent)",
              }}
            >
              On Campus · Ground
            </span>
            <h3 className="mt-4 text-[23px] tracking-[-0.02em]">
              For the traditional student
            </h3>
            <ul className="mt-[18px] grid list-none gap-3 p-0">
              <LaneItem color="var(--copper)">
                Leads with campus life, division-I athletics, majors, and the
                four-year picture — the things a first-time student is actually
                deciding between.
              </LaneItem>
              <LaneItem color="var(--copper)">
                Surfaces scholarships and the frozen-tuition promise early, so
                cost never becomes the silent reason a family walks away.
              </LaneItem>
              <LaneItem color="var(--copper)">
                Ends with a campus visit or an application — the next step that
                turns interest into a deposit.
              </LaneItem>
            </ul>
          </div>

          <div
            className="reveal rounded-card border border-line p-[30px]"
            style={{
              background:
                "linear-gradient(160deg, color-mix(in srgb, var(--purple) 14%, var(--surface)), var(--surface))",
            }}
          >
            <span
              className="inline-block rounded-full px-3 py-[5px] text-xs font-bold uppercase tracking-[0.05em]"
              style={{
                color: "var(--purple)",
                background: "color-mix(in srgb, var(--purple) 16%, transparent)",
              }}
            >
              Online
            </span>
            <h3 className="mt-4 text-[23px] tracking-[-0.02em]">For the working adult</h3>
            <ul className="mt-[18px] grid list-none gap-3 p-0">
              <LaneItem color="var(--purple)">
                Leads with flexibility, prior-credit transfer, and time-to-finish
                — the questions a busy adult asks before anything else.
              </LaneItem>
              <LaneItem color="var(--purple)">
                Estimates how much life experience and past coursework could
                shorten the path, right in the conversation.
              </LaneItem>
              <LaneItem color="var(--purple)">
                Ends with a fast, low-friction application and a real human
                counselor — because adults decide when they're ready, not when a
                form opens.
              </LaneItem>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
