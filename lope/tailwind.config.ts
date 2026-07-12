import type { Config } from "tailwindcss";

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "var(--ground)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",
        line: "var(--line)",
        purple: {
          DEFAULT: "var(--purple)",
          bright: "var(--purple-bright)",
          deep: "var(--purple-deep)",
        },
        copper: "var(--copper)",
        success: "var(--green)",
      },
      borderRadius: {
        card: "22px",
      },
      maxWidth: {
        wrap: "1080px",
      },
    },
  },
  plugins: [],
} satisfies Config;
