/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        "primary-dark": "#4338CA",
        "primary-light": "#EDE9FE",
        amber: { 600: "#D97706" },
        bg: "#0F0F13",
        card: "#1A1A24",
        "card-border": "#2A2A3A",
      },
      fontFamily: {
        display: ["'Clash Display'", "sans-serif"],
        body: ["'Satoshi'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
