/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Usa 'class' para controlar el modo oscuro manualmente
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === Tokens claros ===
        bg: "var(--bg)",
        surface1: "var(--surface-1)",
        surface2: "var(--surface-2)",
        surface3: "var(--surface-3)",
        border: "var(--border-1)",
        text1: "var(--text-1)",
        text2: "var(--text-2)",
        muted: "var(--muted)",

        // === Tokens oscuros ===
        "bg-dark": "var(--bg-dark)",
        "surface1-dark": "var(--surface-1-dark)",
        "surface2-dark": "var(--surface-2-dark)",
        "surface3-dark": "var(--surface-3-dark)",
        "border-dark": "var(--border-1-dark)",
        "text1-dark": "var(--text-1-dark)",
        "text2-dark": "var(--text-2-dark)",
        "muted-dark": "var(--muted-dark)",

        // === Colores personalizados ===
        emerald: {
          DEFAULT: "#0B5150", // color principal Loannel
          light: "#22c55e",
        },
        zinc: {
          950: "#09090b",
          900: "#18181b",
          800: "#27272a",
          700: "#3f3f46",
          600: "#52525b",
          500: "#71717a",
          400: "#a1a1aa",
          300: "#d4d4d8",
          200: "#e4e4e7",
          100: "#f4f4f5",
          50: "#fafafa",
        },
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.08)",
        "soft-dark": "0 1px 3px rgba(255,255,255,0.05)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
