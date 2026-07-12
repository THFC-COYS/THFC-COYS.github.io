function toggleTheme() {
  const root = document.documentElement;
  let cur = root.getAttribute("data-theme");
  if (!cur) {
    cur = matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  root.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
}

export function BrandMark() {
  return (
    <span
      className="grid h-[26px] w-[26px] place-items-center rounded-lg text-[15px] text-white"
      style={{
        background: "linear-gradient(150deg, var(--purple), var(--purple-bright))",
        boxShadow: "0 4px 12px -4px var(--purple)",
      }}
    >
      L
    </span>
  );
}

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-line"
      style={{
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        background: "color-mix(in srgb, var(--ground) 78%, transparent)",
      }}
    >
      <div className="wrap flex h-14 items-center justify-between">
        <div className="flex items-center gap-2.5 font-bold tracking-tight">
          <BrandMark />
          <span>
            Lope{" "}
            <small className="font-medium tracking-normal text-ink-faint">
              · GCU Enrollment
            </small>
          </span>
        </div>
        <nav className="flex items-center gap-[22px] text-sm text-ink-soft">
          <a className="hidden no-underline hover:text-ink md:inline" href="#meet">
            Meet Lope
          </a>
          <a className="hidden no-underline hover:text-ink md:inline" href="#platform">
            Platform
          </a>
          <a className="hidden no-underline hover:text-ink md:inline" href="#audiences">
            Online &amp; Ground
          </a>
          <a className="hidden no-underline hover:text-ink md:inline" href="#counselor">
            Counselors
          </a>
          <button
            className="grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-[10px] border border-line bg-surface text-[15px] text-ink-soft"
            onClick={toggleTheme}
            aria-label="Toggle light or dark theme"
          >
            ◐
          </button>
        </nav>
      </div>
    </header>
  );
}
