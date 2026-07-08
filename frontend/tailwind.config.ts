import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf3",
          100: "#d6f9e1",
          200: "#aef1c7",
          300: "#78e3a6",
          400: "#43cd82",
          500: "#1fb367",
          600: "#158f53",
          700: "#137245",
          800: "#135a38",
          900: "#114a30",
        },
      },
    },
  },
  plugins: [],
};

export default config;
