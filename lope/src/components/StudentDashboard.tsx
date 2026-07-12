import { useEffect, useState } from "react";

export interface SavedPath {
  name: string;
  college: string;
  pay: string;
}

export interface StudentUpdate {
  name: string;
  program: string;
  college: string;
  paths: SavedPath[];
  counselorText: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  tag?: string;
}

const JOURNEY: { label: string; key: string }[] = [
  { label: "Explore", key: "explore" },
  { label: "Match", key: "match" },
  { label: "Apply", key: "apply" },
  { label: "Financial aid", key: "fafsa" },
  { label: "Enroll", key: "talk" },
  { label: "Start", key: "orient" },
];

const NEXT: Record<
  string,
  { ico: string; title: string; desc: string; tip: string; btn: string }
> = {
  apply: { ico: "📝", title: "Submit your application", desc: "~15 minutes — Lope pre-filled everything you told it. No re-typing your story.", tip: "🧭 Matcher agent: do this before Friday's priority deadline to keep scholarships open.", btn: "Start application" },
  transcripts: { ico: "📄", title: "Send your transcripts", desc: "Request them from your school. Lope will tell you the moment they arrive.", tip: "Unofficial copies are fine to get started.", btn: "Mark done" },
  fafsa: { ico: "💰", title: "Complete the FAFSA", desc: "GCU's school code is pre-loaded. Most students qualify for more aid than they expect.", tip: "💰 This unlocks your real, personalized cost number.", btn: "Mark done" },
  talk: { ico: "📞", title: "Talk to your counselor", desc: "Alex already has your whole story — 15 minutes to map the finish line.", tip: "Ask about scholarships for your major.", btn: "Mark done" },
  orient: { ico: "🎓", title: "Register for orientation", desc: "Meet your cohort and lock in your first-semester schedule.", tip: "Last step before day one — almost a Lope!", btn: "Mark done" },
  done: { ico: "🎉", title: "You're enrolled — welcome to GCU!", desc: "Everything's checked off. Your journey from “just curious” to Lope is complete.", tip: "See you on day one. 💜", btn: "" },
};

const SEED_CHECKLIST: ChecklistItem[] = [
  { id: "explore", label: "Explore programs", done: true },
  { id: "match", label: "Match with a path", done: true },
  { id: "apply", label: "Start your application", done: false, tag: "~15 min" },
  { id: "transcripts", label: "Send your transcripts", done: false },
  { id: "fafsa", label: "Complete the FAFSA (financial aid)", done: false },
  { id: "talk", label: "Talk to your counselor", done: false },
  { id: "orient", label: "Register for orientation", done: false },
];

const SEED_PATHS: SavedPath[] = [
  { name: "B.S. Cybersecurity", college: "College of Science, Engineering and Technology", pay: "$80–115K" },
  { name: "B.S. Computer Science", college: "College of Science, Engineering and Technology", pay: "$90–140K" },
  { name: "B.S. Information Technology", college: "College of Science, Engineering and Technology", pay: "$65–95K" },
];

export default function StudentDashboard() {
  const [name, setName] = useState("Jordan");
  const [college, setCollege] = useState("College of Science, Engineering and Technology");
  const [paths, setPaths] = useState<SavedPath[]>(SEED_PATHS);
  const [primary, setPrimary] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(SEED_CHECKLIST);
  const [counselorText, setCounselorText] = useState(
    "Hi Jordan! I saw Cybersecurity is your top match — great pick, and the field can't hire fast enough. I've got your whole Lope conversation in front of me, so we can pick up right where you left off. Want to knock out your application together this week?",
  );

  const program = paths[primary]?.name ?? "your path";

  useEffect(() => {
    const onStudent = (e: Event) => {
      const d = (e as CustomEvent<StudentUpdate>).detail;
      setName(d.name);
      setCollege(d.college);
      setPaths(d.paths.length ? d.paths : SEED_PATHS);
      setPrimary(0);
      setCounselorText(d.counselorText);
      setChecklist((prev) =>
        prev.map((c) =>
          ["apply", "transcripts", "fafsa", "talk", "orient"].includes(c.id)
            ? { ...c, done: false }
            : c,
        ),
      );
    };
    window.addEventListener("lope:student", onStudent);
    return () => window.removeEventListener("lope:student", onStudent);
  }, []);

  const isDone = (id: string) => checklist.find((c) => c.id === id)?.done ?? false;
  const firstUndone =
    ["apply", "transcripts", "fafsa", "talk", "orient"].find((id) => !isDone(id)) ?? "done";
  const next = NEXT[firstUndone];
  const toggle = (id: string) =>
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  const complete = (id: string) =>
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: true } : c)));

  return (
    <div
      className="overflow-hidden rounded-[28px] border border-line bg-surface"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div
        className="border-b border-line px-6 py-[22px]"
        style={{
          background:
            "linear-gradient(140deg, color-mix(in srgb, var(--purple) 10%, var(--surface)), var(--surface))",
        }}
      >
        <b className="text-xl tracking-[-0.02em]">Welcome back, {name} 👋</b>
        <div className="mt-0.5 text-sm text-ink-soft">
          Your journey to <b>{program}</b>
          {college && ` · ${college}`}
        </div>
      </div>

      <div className="grid gap-[22px] p-6 sm:p-6">
        {/* stepper */}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.06em]" style={{ color: "var(--purple-bright)" }}>
            Your journey — research to enrollment
          </div>
          <div className="mt-3 grid grid-cols-3 gap-x-1.5 gap-y-3.5 sm:grid-cols-6">
            {JOURNEY.map((s, i) => {
              const done = isDone(s.key);
              const now = !done && (i === 0 || isDone(JOURNEY[i - 1].key));
              return (
                <div key={s.key} className="text-center">
                  <div
                    className="mx-auto mb-2 grid h-[30px] w-[30px] place-items-center rounded-full text-[13px] font-bold"
                    style={{
                      background: done ? "var(--green)" : now ? "var(--purple)" : "var(--surface-2)",
                      border: `2px solid ${done ? "var(--green)" : now ? "var(--purple)" : "var(--line)"}`,
                      color: done || now ? "#fff" : "var(--ink-faint)",
                      boxShadow: now ? "0 0 0 4px color-mix(in srgb, var(--purple) 18%, transparent)" : "none",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <small
                    className="text-xs font-semibold"
                    style={{ color: done || now ? "var(--ink)" : "var(--ink-faint)" }}
                  >
                    {s.label}
                  </small>
                </div>
              );
            })}
          </div>
        </div>

        {/* next step */}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.06em]" style={{ color: "var(--purple-bright)" }}>
            Your next step
          </div>
          <div
            className="mt-2.5 flex flex-wrap items-start gap-4 rounded-[18px] px-5 py-[18px]"
            style={{
              background:
                "linear-gradient(120deg, color-mix(in srgb, var(--copper) 15%, var(--surface)), var(--surface))",
              border: "1px solid color-mix(in srgb, var(--copper) 30%, transparent)",
            }}
          >
            <span className="text-2xl">{next.ico}</span>
            <div className="min-w-[180px] flex-1">
              <b className="text-[16.5px] tracking-[-0.01em]">{next.title}</b>
              <p className="mt-1.5 text-[13.5px] leading-normal text-ink-soft">{next.desc}</p>
              <div className="mt-2 text-[12.5px] font-semibold" style={{ color: "var(--copper)" }}>
                {next.tip}
              </div>
            </div>
            {next.btn && (
              <button
                className="btn btn-primary self-center"
                onClick={() => firstUndone !== "done" && complete(firstUndone)}
              >
                {next.btn} <span aria-hidden>→</span>
              </button>
            )}
          </div>
        </div>

        {/* saved paths */}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.06em]" style={{ color: "var(--purple-bright)" }}>
            Your saved paths{" "}
            <span className="font-medium normal-case tracking-normal text-ink-faint">· tap to make primary</span>
          </div>
          <div className="mt-2.5 grid gap-2.5">
            {paths.map((p, i) => {
              const isPrimary = i === primary;
              return (
                <button
                  key={p.name}
                  onClick={() => setPrimary(i)}
                  className="flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-3.5 py-3 text-left"
                  style={{
                    borderColor: isPrimary ? "var(--purple)" : "var(--line)",
                    background: isPrimary
                      ? "color-mix(in srgb, var(--purple) 8%, var(--surface))"
                      : "var(--surface-2)",
                  }}
                >
                  <span
                    className="w-5 text-center text-[15px]"
                    style={{ color: isPrimary ? "var(--purple)" : "var(--ink-faint)" }}
                  >
                    {isPrimary ? "★" : "☆"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[14.5px] tracking-[-0.01em]">{p.name}</b>
                    <small className="text-[12.5px] text-ink-faint">{p.college}</small>
                  </span>
                  {p.pay && (
                    <span
                      className="hidden text-[13.5px] font-bold tabular-nums sm:inline"
                      style={{ color: "var(--copper)" }}
                    >
                      {p.pay}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* checklist */}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.06em]" style={{ color: "var(--purple-bright)" }}>
            Your checklist
          </div>
          <div className="mt-2.5 grid gap-2">
            {checklist.map((c) => (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-[11px] hover:bg-surface"
              >
                <span
                  className="grid h-[22px] w-[22px] flex-none place-items-center rounded-[7px] border-2 text-[13px] text-white"
                  style={{
                    background: c.done ? "var(--green)" : "transparent",
                    borderColor: c.done ? "var(--green)" : "var(--line)",
                  }}
                >
                  {c.done ? "✓" : ""}
                </span>
                <span
                  className="text-[14.5px]"
                  style={{
                    color: c.done ? "var(--ink-faint)" : "var(--ink)",
                    textDecoration: c.done ? "line-through" : "none",
                  }}
                >
                  {c.label}
                </span>
                {c.tag && !c.done && (
                  <span className="ml-auto text-[11px] text-ink-faint">{c.tag}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* counselor message */}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.06em]" style={{ color: "var(--purple-bright)" }}>
            Message from your counselor
          </div>
          <div className="mt-2.5 rounded-2xl border border-line bg-surface-2 px-[18px] py-4">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-[34px] w-[34px] place-items-center rounded-[10px] text-[13px] font-bold text-white"
                style={{ background: "linear-gradient(150deg, var(--purple), var(--purple-bright))" }}
              >
                A
              </span>
              <div>
                <b className="text-sm">Alex — your GCU counselor</b>
                <span className="block text-xs text-ink-faint">replies in ~4 minutes</span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{counselorText}</p>
            <div className="mt-3">
              <button className="btn btn-ghost" onClick={() => complete("talk")}>
                Reply to Alex
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-faint">
          🌱 Your Outcomes agent is working in the background — it flagged 3 new scholarships for
          your major this week.
        </p>
      </div>
    </div>
  );
}
