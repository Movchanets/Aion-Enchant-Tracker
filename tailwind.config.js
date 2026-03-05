/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "aion-bg": "#1a1a1d",
        "aion-card": "#2d2d34",
        "aion-border": "#3e3e4a",
        "aion-gold": "#d4af37",
        "aion-success": "#2ecc71",
        "aion-danger": "#e74c3c",
        "aion-text": "#e0e0e0",
        "aion-muted": "#888888",
        "aion-row": "#1f1f24",
      },
    },
  },
  plugins: [],
};
