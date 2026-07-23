import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        skool: {
          50: "#FFF5E8",
          100: "#FFE8CC",
          200: "#FFD09B",
          300: "#FFB566",
          400: "#FB9A2E",
          500: "#F47900",
          600: "#DB6C00",
          700: "#B25700",
          800: "#8C4500",
          900: "#6D3600",
        },
        // Witte basis met een neutraal grijs voor randen en bijschriften.
        zand: {
          50: "#FFFFFF",
          100: "#F7F7F5",
          200: "#EDEDEA",
          300: "#DFDFDB",
          400: "#A3A29E",
          500: "#71706C",
          600: "#454440",
          700: "#1F1E1C",
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
