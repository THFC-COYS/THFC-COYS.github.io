import type { Persona } from "../App";

const STATS = [
  { value: "24/7", label: "Always-on guidance" },
  { value: "~60s", label: "Curiosity → path" },
  { value: "2", label: "Modes, one experience", accent: true },
  { value: "200+", label: "Programs matched" },
];

const DOORS: { id: Exclude<Persona, null>; ico: string; title: string; sub: string }[] = [
  {
    id: "teen",
    ico: "🚀",
    title: "I'm starting out",
    sub: "High school-ish. Big dreams, zero idea how this works. Find who you'll become.",
  },
  {
    id: "adult",
    ico: "⚡",
    title: "I'm restarting",
    sub: "Job, family, real life. A degree that fits around all of it — not the other way around.",
  },
];

export default function Hero({
  persona,
  onPickPersona,
}: {
  persona: Persona;
  onPickPersona: (p: Persona) => void;
}) {
  const pickDoor = (p: Exclude<Persona, null>) => {
    onPickPersona(p);
    document.getElementById("meet")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden pb-10 pt-24 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-[10%] -top-[20%] z-0 h-[620px] blur-[6px]"
        style={{
          background:
            "radial-gradient(46% 55% at 30% 20%, var(--aura-1), transparent 70%), radial-gradient(42% 50% at 78% 30%, var(--aura-2), transparent 72%)",
        }}
      />
      <div className="wrap relative z-10">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
          style={{
            color: "var(--purple)",
            background: "color-mix(in srgb, var(--purple) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--purple) 24%, transparent)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--green)",
              boxShadow: "0 0 0 3px color-mix(in srgb, var(--green) 22%, transparent)",
            }}
          />
          Concept prototype · Grand Canyon University
        </span>

        <h1 className="mx-auto mt-[22px] max-w-[12ch] text-[clamp(44px,8.5vw,92px)] leading-[0.98]">
          Every future{" "}
          <span
            style={{
              background:
                "linear-gradient(105deg, var(--purple) 10%, var(--purple-bright) 55%, var(--copper) 130%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            Lope
          </span>{" "}
          deserves a guide.
        </h1>

        <p className="mx-auto mt-[22px] max-w-[46ch] text-[clamp(18px,2.4vw,23px)] leading-[1.45] tracking-[-0.015em] text-ink-soft">
          Lope is GCU's AI enrollment concierge, built on one mission: make
          finding your future as easy as sending a text.
        </p>

        <div className="mx-auto mt-[34px] grid max-w-[640px] gap-3.5 text-left sm:grid-cols-2">
          {DOORS.map((d) => (
            <button
              key={d.id}
              onClick={() => pickDoor(d.id)}
              className="cursor-pointer rounded-[20px] border-[1.5px] bg-surface p-5 text-left transition-transform hover:-translate-y-0.5"
              style={{
                fontFamily: "inherit",
                borderColor: persona === d.id ? "var(--purple)" : "var(--line)",
                boxShadow:
                  persona === d.id
                    ? "0 0 0 4px color-mix(in srgb, var(--purple) 14%, transparent)"
                    : "var(--shadow-sm)",
              }}
            >
              <span className="text-[26px]" aria-hidden>
                {d.ico}
              </span>
              <b className="mt-2.5 block text-lg tracking-[-0.02em] text-ink">{d.title}</b>
              <span className="mt-1 block text-[13.5px] leading-[1.4] text-ink-faint">
                {d.sub}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-center">
          <button
            className="btn btn-ghost"
            onClick={() => {
              onPickPersona("teen");
              window.dispatchEvent(new Event("lope:autoplay"));
            }}
          >
            ▶ Watch Lope work{" "}
            <span className="text-[13px] font-medium text-ink-faint">· auto-demo</span>
          </button>
        </div>
        <p className="mt-4 text-[13px] text-ink-faint">
          No forms. No phone tag. 60 seconds to a real answer.{" "}
          <a
            href="#agents"
            className="font-semibold no-underline"
            style={{ color: "var(--purple-bright)" }}
          >
            See the agents →
          </a>
        </p>

        <div className="reveal mx-auto mt-11 grid max-w-[860px] grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-line bg-line sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-surface px-4 py-5 text-center">
              <b
                className="block text-[clamp(24px,3.4vw,32px)] tracking-[-0.03em] tabular-nums"
                style={s.accent ? { color: "var(--copper)" } : undefined}
              >
                {s.value}
              </b>
              <span className="text-[12.5px] text-ink-faint">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
