import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f6ff",
          100: "#e2ebff",
          500: "#3d5ef5",
          600: "#2c46d6",
          700: "#2236ab",
        },
      },
    },
  },
  plugins: [],
};
export default config;
