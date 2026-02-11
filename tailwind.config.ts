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
        // R-MAIL Formal Brown Theme
        rmail: {
          // Core Neutrals
          'espresso': '#1B1A17',      // Primary Background
          'mocha': '#23201B',          // Surface / Panels
          'slate': '#2A2621',          // Secondary Surface
          'ash': '#3A342C',            // Borders / Dividers
          // Typography
          'offwhite': '#D6D3CD',       // Primary Text
          'taupe': '#AFA99F',          // Secondary Text
          'sand': '#8E8579',           // Disabled / Meta
          // Functional Accents
          'steel': '#4FC1FF',          // Primary Action
          'azure': '#3794FF',          // Links / Focus
        },
      },
    },
  },
  plugins: [],
};
export default config;
