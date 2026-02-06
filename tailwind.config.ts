import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0B1E3B",
        gold: "#C9A24D",
        cream: "#F5F1E8",
      },
    },
  },
  plugins: [],
};
export default config;
