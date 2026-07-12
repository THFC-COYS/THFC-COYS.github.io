export default function Voices() {
  return (
    <section className="py-[84px]">
      <div className="wrap">
        <div className="reveal">
          <span className="kicker">Why we built it</span>
          <h2 className="head">A president's mandate, an Apple marketer's obsession.</h2>
          <p className="lede">
            This platform came out of one conviction: the first thing a
            prospective student experiences from GCU shouldn't be a sales funnel
            — it should feel like the university already believes in them.
          </p>
        </div>
        <div className="mt-11 grid gap-5 md:grid-cols-2">
          <div
            className="reveal rounded-card border border-line bg-surface p-[30px]"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <p className="text-lg leading-relaxed tracking-[-0.015em]">
              "A student's very first interaction with GCU is a promise about
              every one after it. If we can make the moment they're curious feel
              personal, generous, and honest, we've already started their
              education — before they ever enroll."
            </p>
            <div className="mt-[22px] flex items-center gap-3">
              <span
                className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl font-bold text-white"
                style={{
                  background: "linear-gradient(150deg, var(--purple), var(--purple-bright))",
                }}
              >
                P
              </span>
              <div>
                <b className="block text-[15px]">Office of the President</b>
                <span className="text-[13px] text-ink-faint">Grand Canyon University</span>
              </div>
            </div>
          </div>

          <div
            className="reveal rounded-card border border-line bg-surface p-[30px]"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <p className="text-lg leading-relaxed tracking-[-0.015em]">
              "At Apple, we never sold features — we removed anxiety and handed
              people a better version of themselves. Lope does that for
              enrollment. Strip out the forms and the jargon, and what's left is
              a student saying, finally, someone gets me."
            </p>
            <div className="mt-[22px] flex items-center gap-3">
              <span
                className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl font-bold text-white"
                style={{ background: "linear-gradient(150deg, var(--copper), #f0b27a)" }}
              >
                M
              </span>
              <div>
                <b className="block text-[15px]">Chief Marketing Advisor</b>
                <span className="text-[13px] text-ink-faint">
                  Former Apple product marketing lead
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
