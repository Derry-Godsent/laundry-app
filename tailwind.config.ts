// tailwind.config.ts
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // We'll add your Chapman design tokens here next
    },
  },
  plugins: [animate],
}