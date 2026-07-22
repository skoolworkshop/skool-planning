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
        // Neutrale basis, wit als achtergrond
        zand: {
          50: "#FFFFFF",
          100: "#F7F7F6",
          200: "#F0F0EE",
          300: "#E4E4E1",
          400: "#A3A3A0",
          500: "#71716E",
          600: "#4A4A47",
          700: "#1C1C1A",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)",
      },
    },
  },
  plugins: [],
};
export default config;
