import { useEffect, useMemo, useRef, useState } from "react";
import { INTERESTS, OBSESSIONS, PROGRAMS, type Program } from "../data/programs";
import type { Persona } from "../App";
import type { Lead } from "../data/leads";
import { localInterpret, EMPTY_INTERPRETATION, type Interpretation } from "../lib/interpret";
import type { StudentUpdate } from "./StudentDashboard";

type ModeChoice = "ground" | "online" | "either";
type Stage = "hs" | "some" | "working" | "transfer" | "military";
type Step =
  | { kind: "mode" }
  | { kind: "interests" }
  | { kind: "obsessions" }
  | { kind: "stage" }
  | { kind: "name" }
  | { kind: "thinking" }
  | { kind: "result"; programId: string }
  | { kind: "handoff"; via: "application" | "counselor" };

interface Answers {
  mode: ModeChoice | null;
  interests: string[];
  obsessions: string[];
  custom: Interpretation;
  stage: Stage | null;
  name: string;
}

const EMPTY: Answers = {
  mode: null,
  interests: [],
  obsessions: [],
  custom: EMPTY_INTERPRETATION,
  stage: null,
  name: "",
};

/* ---------- matching logic ---------- */

function score(p: Program, a: Answers): number {
  let s = 0;
  if (a.mode === "either") s += 2;
  else if (a.mode && p.modes.includes(a.mode)) s += 5;
  else s -= 4;
  a.interests.forEach((t) => {
    if (p.tags.includes(t)) s += 4;
  });
  // obsession overlap — softer signal, but it breaks ties with who the student actually is
  a.obsessions.forEach((id) => {
    const ob = OBSESSIONS.find((o) => o.id === id);
    ob?.tags.forEach((t) => {
      if (p.tags.includes(t)) s += 2;
    });
  });
  // free-text interpretation carries the same weight as a picked obsession
  a.custom.tags.forEach((t) => {
    if (p.tags.includes(t)) s += 2;
  });
  const isGrad = /M\.|MBA|Master/.test(p.name);
  if (a.stage === "hs" && isGrad) s -= 5;
  if (a.stage === "working" && isGrad) s += 1;
  return s;
}

function ranked(a: Answers): Program[] {
  return [...PROGRAMS].sort((x, y) => score(y, a) - score(x, a));
}

function chosenMode(p: Program, a: Answers): string {
  if (a.mode === "either")
    return p.modes.includes("online") ? "Online or Campus" : "On Campus";
  return a.mode === "online" ? "Online" : "On Campus";
}

function timeline(p: Program, a: Answers): { label: string; note: string } {
  const isGrad = /M\.|MBA|Master/.test(p.name);
  if (isGrad) return { label: "~1.5–2 yrs", note: "graduate" };
  switch (a.stage) {
    case "transfer":
      return { label: "~2–3 yrs", note: "with transfer credit" };
    case "some":
      return { label: "~2.5–3.5 yrs", note: "finishing your degree" };
    case "military":
      return { label: "~3–4 yrs", note: "benefits applied" };
    case "working":
      return { label: "~4 yrs", note: "part-time friendly" };
    default:
      return { label: "4 yrs", note: "full-time" };
  }
}

function cost(p: Program, a: Answers): { label: string; note: string } {
  // Illustrative only — replace with real GCU tuition data.
  if (chosenMode(p, a) === "Online")
    return { label: "$8–$12K/yr*", note: "before aid" };
  return { label: "$16.5K/yr*", note: "frozen tuition, before scholarships" };
}

function whyText(p: Program, a: Answers): string {
  const bits: string[] = [];
  const modeTxt =
    a.mode === "online"
      ? "you told me you want to learn online, and this runs fully online"
      : a.mode === "ground"
        ? "you're after the on-campus experience, and this lives on our Phoenix campus"
        : "it works whether you choose online or on campus";
  bits.push(`You said ${modeTxt}.`);
  const matched = INTERESTS.filter(
    (it) => a.interests.includes(it.id) && p.tags.includes(it.id),
  ).map((it) => it.label.toLowerCase());
  if (matched.length) {
    const nice =
      matched.length === 1
        ? matched[0]
        : matched.length === 2
          ? `${matched[0]} and ${matched[1]}`
          : `${matched.slice(0, -1).join(", ")}, and ${matched[matched.length - 1]}`;
    bits.push(`It lines up with your interest in ${nice}.`);
  }
  const obMatch = OBSESSIONS.find(
    (ob) => a.obsessions.includes(ob.id) && ob.tags.some((t) => p.tags.includes(t)),
  );
  if (obMatch) {
    bits.push(`And you're obsessed with ${obMatch.label.toLowerCase()} — ${obMatch.hook}.`);
  } else if (a.custom.labels.length && a.custom.tags.some((t) => p.tags.includes(t))) {
    bits.push(
      `You mentioned ${a.custom.labels.join(" and ").toLowerCase()} — that lines up with this field more than you'd expect.`,
    );
  }
  const stageTxt: Record<Stage, string> = {
    hs: "As someone finishing high school, this is a clean four-year start.",
    some: "Since you already have some college, we can build on the credits you've earned.",
    working:
      "Because you're balancing work and life, the flexible format is built around your schedule.",
    transfer: "With credits to transfer, you could shorten the road ahead meaningfully.",
    military: "Your military benefits can be applied directly toward this path.",
  };
  if (a.stage) bits.push(stageTxt[a.stage]);
  return bits.join(" ");
}

/** Dream companies: brands from the student's obsessions whose field matches this program. */
function dreamCompanies(p: Program, a: Answers): string[] {
  const set: string[] = [];
  a.obsessions.forEach((id) => {
    const ob = OBSESSIONS.find((o) => o.id === id);
    if (!ob) return;
    if (ob.tags.some((t) => p.tags.includes(t))) {
      ob.companies.forEach((c) => {
        if (!set.includes(c)) set.push(c);
      });
    }
  });
  if (a.custom.tags.some((t) => p.tags.includes(t))) {
    a.custom.companies.forEach((c) => {
      if (!set.includes(c)) set.push(c);
    });
  }
  return set.slice(0, 4);
}

/** The ranked top-3 pick list; tapping a row re-selects the hero program. */
function TopThree({
  programs,
  selectedId,
  answers,
  onSelect,
}: {
  programs: Program[];
  selectedId: string;
  answers: Answers;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <b
        className="mt-6 block text-[13px] uppercase tracking-[0.06em]"
        style={{ color: "var(--purple-bright)" }}
      >
        Your 3 best-fit paths — tap any to explore
      </b>
      <div className="mt-3 grid gap-2.5">
        {programs.map((p, i) => {
          const role = p.outcomes.roles[0];
          const dreams = dreamCompanies(p, answers);
          const selected = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="flex items-center gap-3.5 rounded-2xl border-[1.5px] px-[15px] py-[13px] text-left transition-colors"
              style={{
                fontFamily: "inherit",
                borderColor: selected ? "var(--purple)" : "var(--line)",
                background: selected
                  ? "color-mix(in srgb, var(--purple) 9%, var(--surface))"
                  : "var(--surface-2)",
              }}
            >
              <span
                className="grid h-7 w-7 flex-none place-items-center rounded-[9px] text-sm font-bold text-white tabular-nums"
                style={{
                  background: "linear-gradient(150deg, var(--purple), var(--purple-bright))",
                }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[15.5px] tracking-[-0.01em] text-ink">{p.name}</b>
                {dreams.length ? (
                  <span
                    className="mt-0.5 block text-[12.5px] font-semibold"
                    style={{ color: "var(--copper)" }}
                  >
                    → Could take you to {dreams.slice(0, 3).join(" · ")}
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[12.5px] text-ink-faint">
                    {p.blurb.split("—")[0].split(".")[0]}
                  </span>
                )}
              </span>
              <span className="hidden flex-none text-right sm:block">
                <b
                  className="block text-sm tabular-nums"
                  style={{ color: "var(--copper)" }}
                >
                  {role.range}
                </b>
                <span className="text-[11.5px] text-ink-faint">
                  {chosenMode(p, answers)}
                </span>
              </span>
              <span
                className="w-5 flex-none text-center font-bold"
                style={{ color: "var(--purple)", opacity: selected ? 1 : 0 }}
                aria-hidden
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Broadcast a finished conversation to Mission Control's live queue. */
function dispatchLead(
  program: Program,
  a: Answers,
  persona: Persona,
  via: "application" | "counselor",
) {
  const isAdult =
    persona === "adult" ||
    ["working", "military", "transfer", "some"].includes(a.stage ?? "");
  const interests = INTERESTS.filter((it) => a.interests.includes(it.id)).map(
    (it) => it.label,
  );
  const obsessions = OBSESSIONS.filter((ob) => a.obsessions.includes(ob.id)).map(
    (ob) => ob.label,
  );
  const name = a.name.trim();
  const lead: Lead = {
    id: `you-${Date.now()}`,
    name: `${name || "You"} ✦`,
    persona: isAdult ? "adult" : "teen",
    mode: a.mode === "either" || a.mode === null ? "either" : a.mode,
    program: program.name,
    time: "just now",
    status: "ready",
    momentum: [
      "Opened Lope",
      a.mode === "online"
        ? "Chose Online"
        : a.mode === "ground"
          ? "Chose On Campus"
          : "Exploring both formats",
      interests.length ? `Picked ${interests.join(", ")}` : "Explored programs",
      obsessions.length
        ? `Obsessed with: ${obsessions.join(", ")}`
        : a.custom.raw
          ? `In their words: "${a.custom.raw}"`
          : "Skipped obsessions",
      `Matched ${program.name}`,
      via === "application" ? "Started an application" : "Requested a counselor",
    ],
    signal:
      via === "application"
        ? "Completed Lope and started an application just now. Confirm receipt within the hour — speed seals it."
        : "Completed Lope and asked for a human just now. The next voice they hear should be yours.",
    draft: `Hi ${name || "there"}! I just read your conversation with Lope — ${program.name} lines up with what you told us${interests.length ? ` about ${interests[0].toLowerCase()}` : ""}. I can answer the real questions (cost, timeline, next steps) in one quick chat. When works for you?${obsessions.length ? ` P.S. — you mentioned ${obsessions[0].toLowerCase()}; there's more overlap with this program than you'd think. Ask me.` : ""}`,
  };
  window.dispatchEvent(new CustomEvent("lope:lead", { detail: lead }));
}

/** Populate the student dashboard from a finished conversation. */
function dispatchStudent(program: Program, a: Answers, top3: Program[]) {
  const name = a.name.trim() || "there";
  const src = top3.length ? top3 : [program];
  const paths = src.slice(0, 3).map((p) => ({
    name: p.name,
    college: p.college,
    pay: p.outcomes.roles[0]?.range ?? "",
  }));
  const update: StudentUpdate = {
    name,
    program: program.name,
    college: program.college,
    paths,
    counselorText: `Hi ${name}! I saw ${program.name} is your top match — I've got your whole Lope conversation in front of me, so we can pick up right where you left off. Want to knock out your application together this week?`,
  };
  window.dispatchEvent(new CustomEvent("lope:student", { detail: update }));
}

/* ---------- small UI pieces ---------- */

function OptionButton({
  ico,
  title,
  sub,
  selected,
  onClick,
}: {
  ico: string;
  title: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3.5 rounded-2xl border-[1.5px] px-[18px] py-4 text-left transition-all hover:-translate-y-px"
      style={{
        borderColor: selected ? "var(--purple)" : "var(--line)",
        background: selected
          ? "color-mix(in srgb, var(--purple) 10%, var(--surface))"
          : "var(--surface-2)",
        color: "var(--ink)",
        fontFamily: "inherit",
      }}
    >
      <span className="w-[30px] flex-none text-center text-[22px]">{ico}</span>
      <span>
        <b className="block text-base tracking-[-0.01em]">{title}</b>
        {sub && <small className="text-[13px] text-ink-faint">{sub}</small>}
      </span>
      <span
        className="ml-auto grid h-[22px] w-[22px] flex-none place-items-center rounded-full text-[13px] text-white"
        style={{
          border: `2px solid ${selected ? "var(--purple)" : "var(--line)"}`,
          background: selected ? "var(--purple)" : "transparent",
        }}
      >
        {selected ? "✓" : ""}
      </span>
    </button>
  );
}

function classYear(p: Program, a: Answers): number {
  const isGrad = /M\.|MBA|Master/.test(p.name);
  const years = isGrad
    ? 2
    : ({ hs: 4, some: 3, working: 4, transfer: 3, military: 4 }[a.stage ?? "hs"] ?? 4);
  return new Date().getFullYear() + years;
}

function FutureCard({ program, answers }: { program: Program; answers: Answers }) {
  const role = program.outcomes.roles[0];
  const t = timeline(program, answers);
  const c = cost(program, answers);
  const name = answers.name.trim();
  return (
    <div
      className="relative mt-5 overflow-hidden rounded-[22px] p-6 text-white"
      style={{
        background:
          "linear-gradient(140deg, #3A1770 0%, #522398 45%, #7C4DD4 80%, #B77BFF 115%)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 80% at 85% 10%, rgba(240,168,92,0.35), transparent 60%)",
        }}
      />
      <div className="relative flex flex-wrap justify-between gap-2.5 text-[11px] uppercase tracking-[0.14em] opacity-85">
        <span>Future Lope ✦ Grand Canyon University</span>
        <span>Class of {classYear(program, answers)}</span>
      </div>
      <div className="relative mt-3.5 text-[clamp(26px,5vw,38px)] font-extrabold leading-[1.08] tracking-[-0.03em]">
        {name && (
          <>
            {name}
            <br />
          </>
        )}
        Future {role.title}
      </div>
      <div className="relative mt-1.5 text-[15px] opacity-90">
        {program.name} · {chosenMode(program, answers)}
      </div>
      {program.college && (
        <div className="relative mt-0.5 text-[13px] opacity-70">{program.college}</div>
      )}
      <div className="relative mt-[18px] flex flex-wrap gap-[22px]">
        {[
          ["Earning power", role.range],
          ["Time to finish", t.label],
          ["Est. cost", c.label],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-[11px] uppercase tracking-[0.08em] opacity-75">
              {label}
            </span>
            <b className="text-xl tracking-[-0.02em] tabular-nums">{value}</b>
          </div>
        ))}
      </div>
      <div className="relative mt-4 border-l-[3px] border-white/40 pl-3 text-[13.5px] leading-normal opacity-90">
        {program.outcomes.spiritual}
      </div>
    </div>
  );
}

function LifeOutcomes({ program }: { program: Program }) {
  const o = program.outcomes;
  const dims = [
    {
      ico: "💼",
      label: "Professional",
      text: "A field with real demand and a clear ladder — see the roles and employers below.",
    },
    { ico: "🌱", label: "Personal", text: o.personal },
    { ico: "✝️", label: "Spiritual", text: o.spiritual },
  ];
  return (
    <div className="mt-[22px]">
      <b
        className="text-[13px] uppercase tracking-[0.06em]"
        style={{ color: "var(--purple-bright)" }}
      >
        What this path means for your life
      </b>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {dims.map((d) => (
          <div key={d.label} className="rounded-2xl border border-line bg-surface-2 p-4">
            <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.05em] text-ink">
              <span aria-hidden>{d.ico}</span> {d.label}
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{d.text}</p>
          </div>
        ))}
      </div>

      <b
        className="mt-6 block text-[13px] uppercase tracking-[0.06em]"
        style={{ color: "var(--purple-bright)" }}
      >
        Where Lopes land
      </b>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {o.roles.map((r) => (
          <div key={r.title} className="rounded-2xl border border-line bg-surface-2 p-4">
            <b className="block text-[15px] leading-tight tracking-[-0.01em]">{r.title}</b>
            <span
              className="mt-1 block text-sm font-semibold tabular-nums"
              style={{ color: "var(--copper)" }}
            >
              {r.range}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-[13px] text-ink-faint">Teams that hire from this field:</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {o.employers.map((e) => (
          <span
            key={e}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-soft"
          >
            {e}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Roles, salary ranges, and employers are illustrative examples of the field — not
        placement guarantees, partnerships, or endorsements.
      </p>
    </div>
  );
}

function ResultActions({
  onHandoff,
  onRestart,
}: {
  onHandoff: (via: "application" | "counselor") => void;
  onRestart: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button className="btn btn-primary" onClick={() => onHandoff("application")}>
        Start my application <span aria-hidden>→</span>
      </button>
      <button className="btn btn-ghost" onClick={() => onHandoff("counselor")}>
        Talk to a counselor
      </button>
      <button className="btn btn-ghost" onClick={onRestart}>
        Start over
      </button>
    </div>
  );
}

/* ---------- main component ---------- */

const THINK_INTERVAL_MS = 620;

export default function Concierge({ persona }: { persona: Persona }) {
  const [step, setStep] = useState<Step>({ kind: "mode" });
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [thinkIdx, setThinkIdx] = useState(0);

  /** Persona-adaptive copy: P(teenText, adultText[, neutralText]) */
  const P = (teen: string, adult: string, neutral?: string) =>
    persona === "teen" ? teen : persona === "adult" ? adult : (neutral ?? adult);

  const progressIndex =
    step.kind === "mode"
      ? 0
      : step.kind === "interests"
        ? 1
        : step.kind === "obsessions"
          ? 2
          : step.kind === "stage"
            ? 3
            : 4;

  const statusText =
    step.kind === "mode"
      ? "Question 1 of 5"
      : step.kind === "interests"
        ? "Question 2 of 5"
        : step.kind === "obsessions"
          ? "Question 3 of 5"
          : step.kind === "stage"
            ? "Question 4 of 5"
            : step.kind === "name"
              ? "Last one"
              : step.kind === "thinking"
                ? "Thinking…"
                : step.kind === "result"
                  ? "Your match"
                  : "Warm handoff";

  const rankedPrograms = useMemo(() => ranked(answers), [answers]);

  /* thinking = agents working, one at a time, then → result */
  useEffect(() => {
    if (step.kind !== "thinking") return;
    setThinkIdx(0);
    let i = 0;
    const total = 4;
    const id = setInterval(() => {
      i += 1;
      setThinkIdx(i);
      if (i >= total) {
        clearInterval(id);
        setTimeout(
          () => setStep({ kind: "result", programId: rankedPrograms[0].id }),
          400,
        );
      }
    }, THINK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [step.kind, rankedPrograms]);

  const restart = () => {
    setAnswers(EMPTY);
    setStep({ kind: "mode" });
  };

  /* ---- auto-demo: drive the whole flow hands-free ---- */
  const autoTimers = useRef<number[]>([]);
  const [autoOn, setAutoOn] = useState(false);
  const clearAuto = () => {
    autoTimers.current.forEach((t) => clearTimeout(t));
    autoTimers.current = [];
  };
  const stopAuto = () => {
    clearAuto();
    setAutoOn(false);
  };
  useEffect(() => {
    const onAuto = () => {
      clearAuto();
      setAutoOn(true);
      const a: Answers = {
        mode: null,
        interests: [],
        obsessions: [],
        custom: EMPTY_INTERPRETATION,
        stage: null,
        name: "",
      };
      setAnswers(a);
      setStep({ kind: "mode" });
      document.getElementById("meet")?.scrollIntoView({ behavior: "smooth", block: "start" });
      const seq: [number, () => void][] = [
        [500, () => { a.mode = "ground"; setAnswers({ ...a }); }],
        [1100, () => setStep({ kind: "interests" })],
        [1200, () => { a.interests = ["tech", "science"]; setAnswers({ ...a }); }],
        [1100, () => setStep({ kind: "obsessions" })],
        [1200, () => { a.custom = localInterpret("space and building rockets"); setAnswers({ ...a }); }],
        [1100, () => setStep({ kind: "stage" })],
        [1200, () => { a.stage = "hs"; setAnswers({ ...a }); }],
        [1100, () => setStep({ kind: "name" })],
        [1200, () => { a.name = "Jordan"; setAnswers({ ...a }); }],
        [900, () => setStep({ kind: "thinking" })],
        [4400, () => {
          const program = ranked(a)[0];
          dispatchLead(program, a, "teen", "counselor");
          dispatchStudent(program, a, ranked(a).slice(0, 3));
          setStep({ kind: "handoff", via: "counselor" });
          window.dispatchEvent(new CustomEvent("lope:showdash", { detail: "counselor" }));
        }],
        [1800, () => { window.dispatchEvent(new Event("lope:autonudge")); setAutoOn(false); }],
      ];
      let t = 0;
      seq.forEach(([d, fn]) => {
        t += d;
        autoTimers.current.push(window.setTimeout(fn, t));
      });
    };
    window.addEventListener("lope:autoplay", onAuto);
    return () => {
      window.removeEventListener("lope:autoplay", onAuto);
      clearAuto();
    };
  }, []);

  return (
    <section className="py-[84px] scroll-mt-16" id="meet">
      {autoOn && (
        <div
          className="fixed left-1/2 top-[68px] z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full py-[9px] pl-4 pr-[10px] text-[13.5px] font-semibold text-white"
          style={{
            background: "color-mix(in srgb, var(--purple) 92%, black)",
            boxShadow: "0 12px 30px -10px rgba(40,20,80,.55)",
          }}
        >
          <span className="dot-bob h-2 w-2 rounded-full bg-white" /> Auto-demo playing
          <button
            className="cursor-pointer rounded-full border-none px-3 py-1.5 text-[12.5px] font-bold text-white"
            style={{ background: "rgba(255,255,255,.16)", fontFamily: "inherit" }}
            onClick={stopAuto}
          >
            Stop
          </button>
        </div>
      )}
      <div className="wrap">
        <div className="reveal">
          <span className="kicker">Meet Lope</span>
          <h2 className="head">Try the concierge. It's the whole product.</h2>
          <p className="lede">
            Lope doesn't hand you a catalog and wish you luck. It asks a few
            human questions, then it recommends — with reasons. Answer honestly;
            there are no wrong answers.
          </p>
        </div>

        <div
          className="reveal relative mt-10 overflow-hidden rounded-[28px] border border-line bg-surface"
          style={{ boxShadow: "var(--shadow)" }}
        >
          {/* header */}
          <div
            className="flex items-center gap-3 border-b border-line px-6 py-[18px]"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--purple) 6%, var(--surface)), var(--surface))",
            }}
          >
            <div
              className="grid h-10 w-10 flex-none place-items-center rounded-xl font-bold text-white"
              style={{
                background: "linear-gradient(150deg, var(--purple), var(--purple-bright))",
                boxShadow: "0 6px 16px -6px var(--purple)",
              }}
            >
              L
            </div>
            <div>
              <b className="text-[15px]">Lope</b>
              <span className="block text-[12.5px] text-ink-faint">{statusText}</span>
            </div>
            <div className="ml-auto flex gap-1.5" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <i
                  key={i}
                  className="h-[5px] w-[26px] rounded transition-colors duration-300"
                  style={{
                    background: i <= progressIndex ? "var(--purple-bright)" : "var(--line)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* body */}
          <div className="min-h-[300px] px-5 py-6 sm:px-7 sm:py-8">
            {step.kind === "mode" && (
              <div className="step-fade" key="mode">
                <div className="text-[clamp(21px,3vw,27px)] font-bold tracking-[-0.025em]">
                  {P(
                    "How do you picture college?",
                    "How does school fit your life?",
                    "First things first — how do you want to learn?",
                  )}
                </div>
                <p className="mt-2 text-[15.5px] text-ink-soft">
                  {P(
                    "Dorms and game days, or a degree from your bedroom — no wrong answers here.",
                    "Campus energy or 11pm-after-everything flexible — whatever actually works.",
                    "There's no wrong answer. It just helps me point you the right way.",
                  )}
                </p>
                <div className="mt-[22px] grid gap-3 sm:grid-cols-2">
                  <OptionButton
                    ico="🏛️"
                    title="On campus"
                    sub="The full experience in Phoenix, AZ"
                    selected={answers.mode === "ground"}
                    onClick={() => setAnswers({ ...answers, mode: "ground" })}
                  />
                  <OptionButton
                    ico="💻"
                    title="Online"
                    sub="Flexible, from wherever life is"
                    selected={answers.mode === "online"}
                    onClick={() => setAnswers({ ...answers, mode: "online" })}
                  />
                  <OptionButton
                    ico="🤔"
                    title="Not sure yet"
                    sub="Show me what fits either way"
                    selected={answers.mode === "either"}
                    onClick={() => setAnswers({ ...answers, mode: "either" })}
                  />
                </div>
                <div className="mt-[26px] flex items-center gap-3">
                  <button
                    className="btn btn-primary ml-auto"
                    disabled={!answers.mode}
                    onClick={() => setStep({ kind: "interests" })}
                  >
                    Continue <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            )}

            {step.kind === "interests" && (
              <div className="step-fade" key="interests">
                <div className="text-[clamp(21px,3vw,27px)] font-bold tracking-[-0.025em]">
                  {P("What's your thing?", "What pulls at you?")}
                </div>
                <p className="mt-2 text-[15.5px] text-ink-soft">
                  {P(
                    "Pick what you'd actually love doing all day — as many as you want.",
                    "Pick anything that sparks something — choose as many as you like.",
                  )}
                </p>
                <div className="mt-[22px] grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                  {INTERESTS.map((it) => {
                    const selected = answers.interests.includes(it.id);
                    return (
                      <OptionButton
                        key={it.id}
                        ico={it.ico}
                        title={it.label}
                        selected={selected}
                        onClick={() =>
                          setAnswers({
                            ...answers,
                            interests: selected
                              ? answers.interests.filter((x) => x !== it.id)
                              : [...answers.interests, it.id],
                          })
                        }
                      />
                    );
                  })}
                </div>
                <div className="mt-[26px] flex items-center gap-3">
                  <button
                    className="cursor-pointer border-none bg-transparent p-2 text-sm text-ink-faint hover:text-ink"
                    onClick={() => setStep({ kind: "mode" })}
                  >
                    ← Back
                  </button>
                  <button
                    className="btn btn-primary ml-auto"
                    disabled={answers.interests.length === 0}
                    onClick={() => setStep({ kind: "obsessions" })}
                  >
                    Continue <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            )}

            {step.kind === "obsessions" && (
              <div className="step-fade" key="obsessions">
                <div className="text-[clamp(21px,3vw,27px)] font-bold tracking-[-0.025em]">
                  {P(
                    "What are you obsessed with right now?",
                    "Outside of work, what pulls your attention?",
                    "What are you into outside of school and work?",
                  )}
                </div>
                <p className="mt-2 text-[15.5px] text-ink-soft">
                  {P(
                    "Brands, hobbies, rabbit holes — the stuff you could talk about for an hour. This is the good data.",
                    "Hobbies, brands, podcasts — the things that make time disappear. They say more than a transcript does.",
                    "The things you gravitate to say a lot about where you'll thrive. Pick a few.",
                  )}
                </p>
                <div className="mt-[22px] grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                  {OBSESSIONS.map((ob) => {
                    const selected = answers.obsessions.includes(ob.id);
                    return (
                      <OptionButton
                        key={ob.id}
                        ico={ob.ico}
                        title={ob.label}
                        selected={selected}
                        onClick={() =>
                          setAnswers({
                            ...answers,
                            obsessions: selected
                              ? answers.obsessions.filter((x) => x !== ob.id)
                              : [...answers.obsessions, ob.id],
                          })
                        }
                      />
                    );
                  })}
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    maxLength={80}
                    placeholder={P(
                      "Or say it in your own words — “A24 films, thrifting, my church band…”",
                      "Or type it — “woodworking, my kids’ school, home renovation…”",
                      "Or tell me in your own words…",
                    )}
                    value={answers.custom.raw}
                    onChange={(e) =>
                      setAnswers({ ...answers, custom: localInterpret(e.target.value) })
                    }
                    className="w-full rounded-[14px] border-[1.5px] border-line bg-surface-2 px-[18px] py-3.5 text-[15px] text-ink outline-none focus:border-purple"
                    style={{ fontFamily: "inherit", letterSpacing: "-0.01em" }}
                  />
                  {answers.custom.labels.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="w-full text-xs text-ink-faint">✨ Lope heard:</span>
                      {answers.custom.labels.map((l) => (
                        <span
                          key={l}
                          className="rounded-full border px-3 py-1.5 text-[13px] font-medium"
                          style={{
                            borderColor: "color-mix(in srgb, var(--purple) 35%, var(--line))",
                            color: "var(--purple-bright)",
                          }}
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-[26px] flex items-center gap-3">
                  <button
                    className="cursor-pointer border-none bg-transparent p-2 text-sm text-ink-faint hover:text-ink"
                    onClick={() => setStep({ kind: "interests" })}
                  >
                    ← Back
                  </button>
                  <button
                    className="cursor-pointer border-none bg-transparent p-2 text-sm text-ink-faint hover:text-ink"
                    onClick={() => {
                      setAnswers({ ...answers, obsessions: [], custom: EMPTY_INTERPRETATION });
                      setStep({ kind: "stage" });
                    }}
                  >
                    Skip
                  </button>
                  <button
                    className="btn btn-primary ml-auto"
                    disabled={answers.obsessions.length === 0 && answers.custom.tags.length === 0}
                    onClick={() => setStep({ kind: "stage" })}
                  >
                    Continue <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            )}

            {step.kind === "stage" && (
              <div className="step-fade" key="stage">
                <div className="text-[clamp(21px,3vw,27px)] font-bold tracking-[-0.025em]">
                  Where are you in the journey?
                </div>
                <p className="mt-2 text-[15.5px] text-ink-soft">
                  This tells me how to talk timelines, credit, and cost.
                </p>
                <div className="mt-[22px] grid gap-3">
                  {(
                    [
                      ["hs", "🎓", "Finishing high school", "Starting my first degree"],
                      ["some", "🔁", "Some college, no degree", "I'd love to finish what I started"],
                      ["working", "⏰", "Working adult", "Fitting school around real life"],
                      ["transfer", "🔄", "Transferring", "I have credits to bring with me"],
                      ["military", "🎖️", "Military / Veteran", "Using my benefits toward a degree"],
                    ] as [Stage, string, string, string][]
                  ).map(([id, ico, title, sub]) => (
                    <OptionButton
                      key={id}
                      ico={ico}
                      title={title}
                      sub={sub}
                      selected={answers.stage === id}
                      onClick={() => setAnswers({ ...answers, stage: id })}
                    />
                  ))}
                </div>
                <div className="mt-[26px] flex items-center gap-3">
                  <button
                    className="cursor-pointer border-none bg-transparent p-2 text-sm text-ink-faint hover:text-ink"
                    onClick={() => setStep({ kind: "obsessions" })}
                  >
                    ← Back
                  </button>
                  <button
                    className="btn btn-primary ml-auto"
                    disabled={!answers.stage}
                    onClick={() => setStep({ kind: "name" })}
                  >
                    Continue <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            )}

            {step.kind === "name" && (
              <div className="step-fade" key="name">
                <div className="text-[clamp(21px,3vw,27px)] font-bold tracking-[-0.025em]">
                  {P("Last one — what do we call you?", "What should I call you?")}
                </div>
                <p className="mt-2 text-[15.5px] text-ink-soft">
                  {P(
                    "Optional. But your Future Card looks way better with your name on it.",
                    "Optional — but a path feels more like yours with a name on it.",
                  )}
                </p>
                <div className="mt-[22px]">
                  <input
                    autoFocus
                    type="text"
                    autoComplete="given-name"
                    placeholder="Your first name"
                    maxLength={24}
                    value={answers.name}
                    onChange={(e) => setAnswers({ ...answers, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setStep({ kind: "thinking" });
                    }}
                    className="w-full rounded-[14px] border-[1.5px] border-line bg-surface-2 px-[18px] py-[15px] text-lg text-ink outline-none focus:border-purple"
                    style={{ fontFamily: "inherit", letterSpacing: "-0.01em" }}
                  />
                </div>
                <div className="mt-[26px] flex items-center gap-3">
                  <button
                    className="cursor-pointer border-none bg-transparent p-2 text-sm text-ink-faint hover:text-ink"
                    onClick={() => setStep({ kind: "stage" })}
                  >
                    ← Back
                  </button>
                  <button
                    className="btn btn-primary ml-auto"
                    onClick={() => setStep({ kind: "thinking" })}
                  >
                    Build my path <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            )}

            {step.kind === "thinking" &&
              (() => {
                const passion =
                  answers.custom.labels[0]?.toLowerCase() ??
                  OBSESSIONS.find((o) => o.id === answers.obsessions[0])?.label.toLowerCase();
                const thinkAgents = [
                  { ico: "🎧", name: "Listener", line: "Building your profile from your answers…" },
                  { ico: "🧭", name: "Matcher", line: "Ranking 46 programs across 9 colleges…" },
                  {
                    ico: "🌱",
                    name: "Outcomes",
                    line: passion
                      ? `Connecting ${passion} to real careers & companies…`
                      : "Attaching careers, salaries & companies…",
                  },
                  { ico: "✍️", name: "Counselor", line: "Drafting your warm handoff…" },
                ];
                return (
                  <div className="step-fade py-[30px] text-center" key="thinking">
                    <div className="mb-[18px] inline-flex gap-2">
                      {[0, 1, 2].map((i) => (
                        <i
                          key={i}
                          className="dot-bob block h-3 w-3 rounded-full"
                          style={{ background: "var(--purple-bright)" }}
                        />
                      ))}
                    </div>
                    <p className="text-ink-soft">
                      {answers.name ? `${answers.name.trim()}, my` : "My"} agents are building
                      your path…
                    </p>
                    <div className="mx-auto mt-4 grid max-w-[340px] gap-[7px] text-left">
                      {thinkAgents.map((a, i) => {
                        const on = thinkIdx >= i;
                        return (
                          <div
                            key={a.name}
                            className="flex items-center gap-2.5 text-[13px] transition-all"
                            style={{ opacity: on ? 1 : 0.4, color: on ? "var(--ink-soft)" : "var(--ink-faint)" }}
                          >
                            <span
                              className="grid h-4 w-4 flex-none place-items-center rounded-full text-[10px]"
                              style={{
                                background: on ? "var(--purple)" : "var(--surface-2)",
                                border: `1px solid ${on ? "var(--purple)" : "var(--line)"}`,
                                color: on ? "#fff" : "inherit",
                              }}
                            >
                              {a.ico}
                            </span>
                            <b className="font-semibold">{a.name}</b>
                            <span className="text-ink-faint">·</span>
                            <span>{a.line}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            {step.kind === "result" &&
              (() => {
                const top3 = rankedPrograms.slice(0, 3);
                const program =
                  top3.find((p) => p.id === step.programId) ?? top3[0];
                const dreams = dreamCompanies(program, answers);
                const selOb = OBSESSIONS.find(
                  (ob) =>
                    answers.obsessions.includes(ob.id) &&
                    ob.tags.some((t) => program.tags.includes(t)),
                );
                return (
                  <div className="step-fade" key={`result-${program.id}`}>
                    <div
                      className="flex items-center gap-2.5 text-sm font-semibold"
                      style={{ color: "var(--green)" }}
                    >
                      <span
                        className="grid h-[22px] w-[22px] place-items-center rounded-full text-[13px] text-white"
                        style={{ background: "var(--green)" }}
                      >
                        ✓
                      </span>
                      {P(
                        "Found you — here are your 3 best-fit paths.",
                        "Here are your 3 best-fit paths.",
                        "Here are your 3 best-fit paths.",
                      )}
                    </div>
                    <FutureCard program={program} answers={answers} />
                    <p className="mt-2.5 text-center text-xs text-ink-faint">
                      📸{" "}
                      {P(
                        "Screenshot your Future Card — it belongs on your story.",
                        "Screenshot your Future Card — pin it where Monday mornings can see it.",
                        "Screenshot your Future Card.",
                      )}
                    </p>
                    {dreams.length > 0 && selOb && (
                      <div
                        className="mt-3.5 flex items-start gap-3 rounded-2xl px-4 py-3.5"
                        style={{
                          background:
                            "linear-gradient(120deg, color-mix(in srgb, var(--copper) 16%, var(--surface)), var(--surface))",
                          border: "1px solid color-mix(in srgb, var(--copper) 30%, transparent)",
                        }}
                      >
                        <span className="text-[22px] leading-tight" aria-hidden>
                          ✨
                        </span>
                        <p className="text-[14.5px] leading-normal text-ink-soft">
                          Because you're into{" "}
                          <b className="text-ink">{selOb.label.toLowerCase()}</b>, this path
                          points straight at teams like{" "}
                          <span className="font-bold" style={{ color: "var(--copper)" }}>
                            {dreams.join(" · ")}
                          </span>
                          .
                        </p>
                      </div>
                    )}
                    <TopThree
                      programs={top3}
                      selectedId={program.id}
                      answers={answers}
                      onSelect={(id) => setStep({ kind: "result", programId: id })}
                    />
                    <p className="mt-5 text-base text-ink-soft">{program.blurb}</p>
                    <div
                      className="mt-[22px] rounded-2xl px-5 py-[18px]"
                      style={{
                        background: "color-mix(in srgb, var(--purple) 7%, var(--surface))",
                        border:
                          "1px solid color-mix(in srgb, var(--purple) 20%, transparent)",
                      }}
                    >
                      <b
                        className="text-[13px] uppercase tracking-[0.06em]"
                        style={{ color: "var(--purple-bright)" }}
                      >
                        Why Lope picked this
                      </b>
                      <p className="mt-2 text-[15.5px] leading-relaxed text-ink-soft">
                        {whyText(program, answers)}
                      </p>
                    </div>
                    <LifeOutcomes program={program} />
                    <ResultActions
                      onHandoff={(via) => {
                        dispatchLead(program, answers, persona, via);
                        dispatchStudent(program, answers, rankedPrograms.slice(0, 3));
                        setStep({ kind: "handoff", via });
                      }}
                      onRestart={restart}
                    />
                  </div>
                );
              })()}

            {step.kind === "handoff" && (
              <div className="step-fade py-[10px] text-center" key="handoff">
                <div
                  className="flex items-center justify-center gap-2.5 text-sm font-semibold"
                  style={{ color: "var(--green)" }}
                >
                  <span
                    className="grid h-[22px] w-[22px] place-items-center rounded-full text-[13px] text-white"
                    style={{ background: "var(--green)" }}
                  >
                    ✓
                  </span>
                  {step.via === "application" ? "Application started" : "Counselor notified"}
                </div>
                <div className="mt-3.5 text-[clamp(24px,4vw,34px)] font-bold tracking-[-0.03em]">
                  Nice work, {answers.name.trim() || "there"}.
                </div>
                <p className="mx-auto mt-3 max-w-[44ch] text-ink-soft">
                  {step.via === "application"
                    ? "I've started an application with everything you told me pre-filled — no re-typing your story. In the real GCU experience, you'd pick up right here."
                    : "I'm connecting you with a GCU enrollment counselor who already has our whole conversation. You'll never have to start over."}
                </p>
                <div className="mt-6 flex justify-center">
                  <button className="btn btn-ghost" onClick={restart}>
                    Try another path
                  </button>
                </div>
                <p className="mt-5 flex flex-wrap justify-center gap-4 text-sm">
                  <button
                    className="cursor-pointer border-none bg-transparent p-0 font-semibold"
                    style={{ color: "var(--purple-bright)", fontFamily: "inherit" }}
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("lope:showdash", { detail: "student" }))
                    }
                  >
                    Open your student dashboard →
                  </button>
                  <button
                    className="cursor-pointer border-none bg-transparent p-0 font-semibold"
                    style={{ color: "var(--purple-bright)", fontFamily: "inherit" }}
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("lope:showdash", { detail: "counselor" }))
                    }
                  >
                    See what your counselor sees →
                  </button>
                </p>
                <p className="mt-2.5 text-sm text-ink-faint">
                  This is a concept prototype — no application is actually submitted and
                  nothing is sent.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
