import { useEffect, useState } from "react";
import { SEED_LEADS, STATUS_META, type Lead } from "../data/leads";

const BADGE_STYLES: Record<string, React.CSSProperties> = {
  ready: {
    color: "var(--green)",
    background: "color-mix(in srgb, var(--green) 14%, transparent)",
  },
  stalled: {
    color: "var(--copper)",
    background: "color-mix(in srgb, var(--copper) 16%, transparent)",
  },
  undecided: {
    color: "var(--purple-bright)",
    background: "color-mix(in srgb, var(--purple) 12%, transparent)",
  },
};

function Badge({
  status,
  sent,
  autoNudged,
}: {
  status: Lead["status"];
  sent?: boolean;
  autoNudged?: boolean;
}) {
  const label = sent ? "✓ Contacted" : autoNudged ? "🛰️ Auto-nudged" : STATUS_META[status].label;
  const style = sent ? BADGE_STYLES.ready : autoNudged ? BADGE_STYLES.stalled : BADGE_STYLES[status];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-[3px] text-[11px] font-bold tracking-[0.03em]"
      style={style}
    >
      {label}
    </span>
  );
}

const CARDS = [
  {
    ico: "🧊",
    title: "Zero cold leads",
    body: 'No more "Hi, I saw you filled out a form." Every profile arrives with the whole story — what they chose, where they lingered, what they\'re afraid of — so the first call feels like the second.',
  },
  {
    ico: "🎬",
    title: "Stalls become plays",
    body: "Paused at cost at midnight? Lope flags it, names the hesitation, and suggests the play — scholarship math, transfer credit, a campus visit — before the lead goes cold.",
  },
  {
    ico: "⚡",
    title: "Minutes, not days",
    body: "The first hello is drafted from the conversation the second it ends. Counselors approve, personalize, send — response time collapses from days to minutes, and speed wins enrollments.",
  },
];

export default function MissionControl() {
  const [leads, setLeads] = useState<Lead[]>(SEED_LEADS);
  const [selectedId, setSelectedId] = useState(SEED_LEADS[0].id);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  /* Live leads from the concierge land at the top of the queue. */
  useEffect(() => {
    const onLead = (e: Event) => {
      const lead = (e as CustomEvent<Lead>).detail;
      setLeads((prev) => [lead, ...prev]);
      setSelectedId(lead.id);
    };
    window.addEventListener("lope:lead", onLead);
    return () => window.removeEventListener("lope:lead", onLead);
  }, []);

  /* Stall-Watch agent: autonomously re-engages a lead that stalled on cost. */
  useEffect(() => {
    const autoNudge = () => {
      setLeads((prev) => {
        let fired = false;
        const next = prev.map((l) => {
          if (l.id !== "l2" || l.autoNudged || sentIds.has(l.id)) return l;
          fired = true;
          return {
            ...l,
            status: "ready" as const,
            time: "just now · auto",
            autoNudged: true,
            momentum: [
              ...l.momentum,
              "🛰️ Stall-Watch agent auto-sent a scholarship-math text (11:59pm)",
              "Marcus opened it and replied — re-engaged",
            ],
            signal:
              "Stall-Watch re-engaged him automatically with real cost numbers. He's warm again — you close it.",
            draft:
              "Hi Marcus — following up on that cost breakdown Lope sent you. With transfer credit and RN partnership discounts, your real number is a lot lower than the sticker. Want to hop on a 10-minute call this week and lock in your start date?",
          };
        });
        if (fired) {
          setSelectedId("l2");
          setToast("🛰️ Stall-Watch agent re-engaged Marcus T. automatically");
          setTimeout(() => setToast(""), 4200);
        }
        return next;
      });
    };
    const timer = setTimeout(autoNudge, 14000);
    window.addEventListener("lope:autonudge", autoNudge);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("lope:autonudge", autoNudge);
    };
  }, [sentIds]);

  const sel = leads.find((l) => l.id === selectedId) ?? leads[0];
  const readyCount = leads.filter((l) => l.status === "ready" && !sentIds.has(l.id)).length;
  const stalledCount = leads.filter(
    (l) => l.status === "stalled" && !sentIds.has(l.id),
  ).length;

  const approve = () => setSentIds((prev) => new Set(prev).add(sel.id));
  const snooze = () =>
    setLeads((prev) => {
      const rest = prev.filter((l) => l.id !== sel.id);
      return [...rest, sel];
    });

  return (
    <>
      <div>
        <div
          className="overflow-hidden rounded-[28px] border border-line bg-surface"
          style={{ boxShadow: "var(--shadow)" }}
        >
          {/* header */}
          <div
            className="flex flex-wrap items-center gap-3 border-b border-line px-[22px] py-4"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--purple) 6%, var(--surface)), var(--surface))",
            }}
          >
            <div
              className="grid h-10 w-10 flex-none place-items-center rounded-xl font-bold text-white"
              style={{
                background: "linear-gradient(150deg, var(--purple), var(--purple-bright))",
              }}
              aria-hidden
            >
              MC
            </div>
            <div>
              <b className="text-[15px]">Mission Control — Enrollment</b>
              <span className="block text-[12.5px] text-ink-faint">Live queue · today</span>
            </div>
            <div className="ml-auto flex flex-wrap gap-2.5">
              {[
                [String(leads.length), "New today"],
                [String(readyCount), "Ready now"],
                [String(stalledCount), "Stalled"],
                ["4m", "Avg first reply"],
              ].map(([v, label]) => (
                <div
                  key={label}
                  className="rounded-xl border border-line bg-surface-2 px-3 py-[7px] text-center"
                >
                  <b className="block text-[17px] tracking-[-0.02em] tabular-nums">{v}</b>
                  <span className="text-[10.5px] uppercase tracking-[0.05em] text-ink-faint">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* body */}
          <div className="grid min-h-[420px] md:grid-cols-[300px_1fr]">
            {/* queue */}
            <div className="flex flex-col gap-2 border-b border-line p-3 md:border-b-0 md:border-r">
              {leads.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className="cursor-pointer rounded-[14px] border-[1.5px] p-3 text-left transition-colors"
                  style={{
                    fontFamily: "inherit",
                    borderColor: l.id === sel.id ? "var(--purple)" : "var(--line)",
                    background:
                      l.id === sel.id
                        ? "color-mix(in srgb, var(--purple) 8%, var(--surface))"
                        : "var(--surface-2)",
                  }}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <b className="text-[15px] tracking-[-0.01em] text-ink">{l.name}</b>
                    <span className="whitespace-nowrap text-[11.5px] text-ink-faint">
                      {l.time}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-ink-soft">{l.program}</span>
                  <span className="mt-2 block">
                    <Badge status={l.status} sent={sentIds.has(l.id)} autoNudged={l.autoNudged} />
                  </span>
                </button>
              ))}
            </div>

            {/* detail */}
            <div className="p-[22px]">
              <h4 className="flex flex-wrap items-center gap-2.5 text-xl font-bold tracking-[-0.02em]">
                {sel.name}{" "}
                <Badge
                  status={sel.status}
                  sent={sentIds.has(sel.id)}
                  autoNudged={sel.autoNudged}
                />
              </h4>
              <div className="mt-1 text-[13px] text-ink-faint">
                {sel.program} ·{" "}
                {sel.mode === "online"
                  ? "Online"
                  : sel.mode === "ground"
                    ? "On Campus"
                    : "Exploring both"}{" "}
                · {sel.persona === "adult" ? "Working adult" : "First-time student"}
              </div>
              <div
                className="mt-3.5 rounded-[14px] px-3.5 py-3 text-sm leading-normal text-ink-soft"
                style={{
                  background: "color-mix(in srgb, var(--copper) 10%, var(--surface))",
                  border: "1px solid color-mix(in srgb, var(--copper) 25%, transparent)",
                }}
              >
                <b style={{ color: "var(--copper)" }}>
                  {sel.autoNudged && !sentIds.has(sel.id) ? "🛰️ Stall-Watch agent:" : "Lope's read:"}
                </b>{" "}
                {sel.signal}
              </div>

              <div
                className="mt-[18px] text-xs font-bold uppercase tracking-[0.06em]"
                style={{ color: "var(--purple-bright)" }}
              >
                Momentum — from first click
              </div>
              <ul className="mt-2.5 list-none p-0">
                {sel.momentum.map((s, i) => (
                  <li
                    key={i}
                    className="relative pb-2.5 pl-[18px] text-[13.5px] text-ink-soft"
                  >
                    <span
                      aria-hidden
                      className="absolute left-1 top-1.5 h-[7px] w-[7px] rounded-full"
                      style={{ background: "var(--purple-bright)" }}
                    />
                    {i < sel.momentum.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute bottom-0 left-[7px] top-[15px] w-[1.5px] bg-line"
                      />
                    )}
                    {s}
                  </li>
                ))}
              </ul>

              <div
                className="mt-[18px] text-xs font-bold uppercase tracking-[0.06em]"
                style={{ color: "var(--purple-bright)" }}
              >
                First hello — drafted for you
              </div>
              <div className="mt-2.5 rounded-[14px] border border-line bg-surface-2 px-4 py-3.5 text-sm leading-relaxed">
                {sel.draft}
              </div>
              <div className="mt-2 text-[11.5px] text-ink-faint">
                Drafted from the full conversation · every word editable · nothing sends
                without you
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                {sentIds.has(sel.id) ? (
                  <span
                    className="inline-flex items-center gap-2 text-sm font-bold"
                    style={{ color: "var(--green)" }}
                  >
                    ✓ Sent — logged, follow-up scheduled
                  </span>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={approve}>
                      Approve &amp; send
                    </button>
                    <button className="btn btn-ghost" onClick={snooze}>
                      Snooze 1 hr
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3.5 text-center text-xs text-ink-faint">
          Simulated queue with illustrative students. Finish the Lope conversation above and
          your own profile lands here — exactly what a counselor would see. Nothing is
          actually sent or stored.
        </p>

        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="reveal rounded-card border border-line bg-surface p-7"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div
                className="mb-[18px] grid h-11 w-11 place-items-center rounded-[13px] text-[22px]"
                style={{ background: "color-mix(in srgb, var(--purple) 12%, transparent)" }}
              >
                {c.ico}
              </div>
              <h3 className="text-xl tracking-[-0.02em]">{c.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-[22px] left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-[14px] px-[18px] py-3 text-sm font-semibold text-white"
          style={{
            background: "color-mix(in srgb, var(--purple) 92%, black)",
            boxShadow: "0 14px 34px -12px rgba(40,20,80,.6)",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
