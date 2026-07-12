import { useEffect, useMemo, useState } from "react";
import { INTERESTS, PROGRAMS, type Program } from "../data/programs";

type ModeChoice = "ground" | "online" | "either";
type Stage = "hs" | "some" | "working" | "transfer" | "military";
type Step =
  | { kind: "mode" }
  | { kind: "interests" }
  | { kind: "stage" }
  | { kind: "name" }
  | { kind: "thinking" }
  | { kind: "result"; programId: string }
  | { kind: "handoff"; via: "application" | "counselor" };

interface Answers {
  mode: ModeChoice | null;
  interests: string[];
  stage: Stage | null;
  name: string;
}

const EMPTY: Answers = { mode: null, interests: [], stage: null, name: "" };

/* ---------- matching logic ---------- */

function score(p: Program, a: Answers): number {
  let s = 0;
  if (a.mode === "either") s += 2;
  else if (a.mode && p.modes.includes(a.mode)) s += 5;
  else s -= 4;
  a.interests.forEach((t) => {
    if (p.tags.includes(t)) s += 4;
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

function MatchCell({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-faint">
        {label}
      </span>
      <b
        className="mt-1 block text-[21px] tracking-[-0.02em] tabular-nums"
        style={accent ? { color: "var(--copper)" } : undefined}
      >
        {value}
      </b>
      {note && <small className="mt-0.5 block text-xs text-ink-faint">{note}</small>}
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

export default function Concierge() {
  const [step, setStep] = useState<Step>({ kind: "mode" });
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [thinkLine, setThinkLine] = useState("");

  const progressIndex =
    step.kind === "mode"
      ? 0
      : step.kind === "interests"
        ? 1
        : step.kind === "stage"
          ? 2
          : 3;

  const statusText =
    step.kind === "mode"
      ? "Question 1 of 4"
      : step.kind === "interests"
        ? "Question 2 of 4"
        : step.kind === "stage"
          ? "Question 3 of 4"
          : step.kind === "name"
            ? "Last one"
            : step.kind === "thinking"
              ? "Thinking…"
              : step.kind === "result"
                ? "Your match"
                : "Warm handoff";

  const rankedPrograms = useMemo(() => ranked(answers), [answers]);

  /* thinking animation → result */
  useEffect(() => {
    if (step.kind !== "thinking") return;
    const stageLine: Record<Stage, string> = {
      transfer: "Estimating transfer credit you could bring…",
      some: "Looking at degree-completion paths…",
      working: "Prioritizing flexible, evening-friendly options…",
      military: "Checking military & veteran benefits…",
      hs: "Mapping a first-time-student path…",
    };
    const lines = [
      "Reading your answers…",
      "Scanning 200+ programs…",
      answers.mode === "online"
        ? "Filtering for online formats…"
        : answers.mode === "ground"
          ? "Filtering for on-campus formats…"
          : "Weighing online and on-campus options…",
      answers.stage ? stageLine[answers.stage] : "Mapping your path…",
      "Ranking your best fits…",
    ];
    let i = 0;
    const id = setInterval(() => {
      if (i < lines.length) {
        setThinkLine(lines[i]);
        i++;
      } else {
        clearInterval(id);
        setStep({ kind: "result", programId: rankedPrograms[0].id });
      }
    }, THINK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [step.kind, answers, rankedPrograms]);

  const restart = () => {
    setAnswers(EMPTY);
    setStep({ kind: "mode" });
  };

  return (
    <section className="py-[84px] scroll-mt-16" id="meet">
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
              {[0, 1, 2, 3].map((i) => (
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
                  First things first — how do you want to learn?
                </div>
                <p className="mt-2 text-[15.5px] text-ink-soft">
                  There's no wrong answer. It just helps me point you the right way.
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
                  What pulls at you?
                </div>
                <p className="mt-2 text-[15.5px] text-ink-soft">
                  Pick anything that sparks something — choose as many as you like.
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
                    onClick={() => setStep({ kind: "interests" })}
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
                  What should I call you?
                </div>
                <p className="mt-2 text-[15.5px] text-ink-soft">
                  Optional — but a path feels more like yours with a name on it.
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

            {step.kind === "thinking" && (
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
                  {answers.name ? `${answers.name.trim()}, matching` : "Matching"} you to
                  the right GCU path…
                </p>
                <div className="mt-3.5 min-h-5 text-sm text-ink-faint">{thinkLine}</div>
              </div>
            )}

            {step.kind === "result" &&
              (() => {
                const program =
                  PROGRAMS.find((p) => p.id === step.programId) ?? rankedPrograms[0];
                const alternatives = rankedPrograms
                  .filter((p) => p.id !== program.id)
                  .slice(0, 2);
                const t = timeline(program, answers);
                const c = cost(program, answers);
                const name = answers.name.trim();
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
                      Found your best-fit path
                    </div>
                    <div className="mt-3 text-[clamp(24px,4vw,34px)] font-bold tracking-[-0.03em]">
                      {name ? `${name}, here's` : "Here's"} your path:
                      <br />
                      {program.name}
                    </div>
                    <p className="mt-2 text-base text-ink-soft">{program.blurb}</p>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <MatchCell label="Format" value={chosenMode(program, answers)} />
                      <MatchCell label="Time to finish" value={t.label} note={t.note} />
                      <MatchCell label="Est. cost" value={c.label} note={c.note} accent />
                    </div>
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
                    {alternatives.length > 0 && (
                      <div className="mt-[18px] text-sm text-ink-faint">
                        Also worth a look:{" "}
                        {alternatives.map((a, i) => (
                          <span key={a.id}>
                            {i > 0 && " · "}
                            <button
                              className="cursor-pointer border-none bg-transparent p-0 font-semibold"
                              style={{ color: "var(--purple-bright)", fontFamily: "inherit" }}
                              onClick={() => setStep({ kind: "result", programId: a.id })}
                            >
                              {a.name}
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <ResultActions
                      onHandoff={(via) => setStep({ kind: "handoff", via })}
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
                <p className="mt-5 text-sm text-ink-faint">
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
