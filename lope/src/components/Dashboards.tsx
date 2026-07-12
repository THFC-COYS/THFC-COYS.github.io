import { useEffect, useState } from "react";
import StudentDashboard from "./StudentDashboard";
import MissionControl from "./MissionControl";

type View = "student" | "counselor";

export default function Dashboards() {
  const [view, setView] = useState<View>("student");

  useEffect(() => {
    const onShow = (e: Event) => {
      const which = (e as CustomEvent<View>).detail;
      if (which === "student" || which === "counselor") {
        setView(which);
        document.getElementById("dashboards")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("lope:showdash", onShow);
    return () => window.removeEventListener("lope:showdash", onShow);
  }, []);

  const TabButton = ({ id, label }: { id: View; label: string }) => (
    <button
      onClick={() => setView(id)}
      className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-[18px] py-[9px] text-sm font-bold transition-all"
      style={{
        fontFamily: "inherit",
        background: view === id ? "var(--surface)" : "transparent",
        color: view === id ? "var(--ink)" : "var(--ink-soft)",
        boxShadow: view === id ? "var(--shadow-sm)" : "none",
      }}
    >
      {label}
    </button>
  );

  return (
    <section className="scroll-mt-16 py-[84px]" id="dashboards">
      <div className="wrap">
        <div className="reveal">
          <span className="kicker">Two connected dashboards</span>
          <h2 className="head">One journey, seen from both sides.</h2>
          <p className="lede">
            Lope is really two dashboards sharing one brain: a student home that walks each
            person from first click to first day of class, and a counselor command center that
            lights up the instant a student needs a human. What the student does on the left,
            the counselor sees on the right.
          </p>
          <div
            className="mt-[26px] inline-flex gap-1 rounded-[14px] border border-line p-[5px]"
            style={{ background: "var(--surface-2)" }}
            role="tablist"
          >
            <TabButton id="student" label="🎓 Student view" />
            <TabButton id="counselor" label="🧭 Counselor view" />
          </div>
        </div>

        {/* Both stay mounted so live leads + agents keep working while hidden. */}
        <div className="mt-[26px]" hidden={view !== "student"}>
          <StudentDashboard />
        </div>
        <div className="mt-[26px]" hidden={view !== "counselor"}>
          <MissionControl />
        </div>
      </div>
    </section>
  );
}
