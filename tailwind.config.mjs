/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        spectra: {
          50: "#f4f9f8",
          100: "#dcebe9",
          200: "#b9d6d2",
          300: "#8ebab6",
          400: "#679a98",
          500: "#4d7f7e",
          600: "#3c6565",
          700: "#365858",
          800: "#2c4243",
          900: "#273a39",
          950: "#131f20",
        },
        "spicy-mix": {
          50: "#f8f6f2",
          100: "#ebe6da",
          200: "#d6cab1",
          300: "#c1ab88",
          400: "#b2966d",
          500: "#a6805a",
          600: "#91694e",
          700: "#855b49",
          800: "#65453b",
          900: "#543b33",
          950: "#2f1e19",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#2c4243",
          secondary: "#65453b",
          accent: "#b9d6d2",
          neutral: "#273a39",
          "base-content": "#131f20",
        },
      },
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#679a98",
          secondary: "#65453b",
          accent: "#2c4243",
          neutral: "#273a39",
          "base-content": "#f8f6f2",
        },
      },
    ],
  },
};
