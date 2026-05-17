/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--bg)",
          2: "var(--bg-2)",
          3: "var(--bg-3)",
          4: "var(--bg-4)",
        },
        border: {
          DEFAULT: "var(--border)",
          2: "var(--border-2)",
        },
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          dim: "var(--text-dim)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          2: "var(--accent-2)",
          dim: "var(--accent-dim)",
        },
        difficulty: {
          easy: "var(--green)",
          medium: "var(--yellow)",
          hard: "var(--red)",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        display: ["Syne", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "7px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
}

