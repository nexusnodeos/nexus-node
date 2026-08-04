import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          deep: "#FFFFFF",
          panel: "#FBF6F0",
        },
        cyan: {
          brand: "#B15A2A",
        },
        gold: {
          brand: "#8C4620",
        },
        ink: {
          DEFAULT: "#241A14",
          soft: "#75604F",
        },
        line: {
          DEFAULT: "#E9DFD2",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(177, 90, 42, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(177, 90, 42, 0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
    },
  },
  plugins: [],
};

export default config;
