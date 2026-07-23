import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        skool: {
          50: "#FFF6E8",
          100: "#FFEBCC",
          200: "#FFD69B",
          300: "#FFBF66",
          400: "#FCA92E",
          500: "#F49700",
          600: "#D98600",
          700: "#B06D00",
          800: "#8A5600",
          900: "#6B4300",
        },
        // Warme, rustige basis. Crème als achtergrond, wit voor kaarten.
        zand: {
          50: "#FDFBF7",
          100: "#F8F5EF",
          200: "#F1ECE3",
          300: "#E5DED2",
          400: "#A8A096",
          500: "#756E64",
          600: "#4A443C",
          700: "#231F1A",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(35,31,26,.04), 0 1px 3px rgba(35,31,26,.06)",
        zacht: "0 2px 8px rgba(35,31,26,.06)",
      },
    },
  },
  plugins: [],
};
export default config;
