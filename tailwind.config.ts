import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Het oranje uit het beeldmerk, de S in het logo
        skool: {
          50: "#FFF7E9",
          100: "#FEEDCE",
          200: "#FDD99C",
          300: "#FBC367",
          400: "#F7AE33",
          500: "#F49700",
          600: "#D88500",
          700: "#B06B00",
          800: "#8A5400",
          900: "#6C4200",
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
