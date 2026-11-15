/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        barlow: ["Barlow", "sans-serif"],
      },
      colors: {
        hx: {
          bg: "#F7F5F0",
          surface: "#FFFFFF",
          "surface-sand": "#E7E1D7",
          brand: "#263B32",
          "brand-secondary": "#34443B",
          accent: "#C66A3D",
          amber: "#D6A64F",
          text: "#252923",
          muted: "#77766F",
          border: "#E5E0D7",
          error: "#B94A48",
          // Mapped aliases for backwards-compatibility
          base: "#F7F5F0",
          pink: "#263B32",
          "pink-text": "#FFFFFF",
          cyan: "#34443B",
          purple: "#263B32",
          orange: "#C66A3D",
          blue: "#263B32",
          "cyan-blue": "#34443B",
          rose: "#C66A3D",
          "dark-red": "#B94A48",
        },
      },
    },
  },
  plugins: [],
};
