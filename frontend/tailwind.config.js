/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        surface: {
          DEFAULT: "#0f0f1a",
          card:    "#1a1a2e",
          glass:   "rgba(255,255,255,0.05)",
        },
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(ellipse at 50% 0%, #4338ca55 0%, transparent 70%), radial-gradient(ellipse at 80% 80%, #818cf822 0%, transparent 60%)",
        "card-gradient":  "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
      },
      animation: {
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-in":   "bounceIn 0.6s ease-out forwards",
        "fade-in":     "fadeIn 0.4s ease-out forwards",
        "slide-up":    "slideUp 0.5s ease-out forwards",
        "spin-slow":   "spin 3s linear infinite",
        "ping-slow":   "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "scale-in":    "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "float":       "float 3s ease-in-out infinite",
        "number-pop":  "numberPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
      keyframes: {
        bounceIn: {
          "0%":   { transform: "scale(0.3)", opacity: "0" },
          "50%":  { transform: "scale(1.05)" },
          "70%":  { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        scaleIn: {
          "0%":   { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        numberPop: {
          "0%":   { transform: "scale(0.3) translateY(30px)", opacity: "0" },
          "60%":  { transform: "scale(1.1) translateY(-5px)", opacity: "1" },
          "100%": { transform: "scale(1)   translateY(0)",    opacity: "1" },
        },
      },
      boxShadow: {
        "glow":        "0 0 40px rgba(99, 102, 241, 0.4)",
        "glow-sm":     "0 0 20px rgba(99, 102, 241, 0.3)",
        "glow-green":  "0 0 40px rgba(74, 222, 128, 0.4)",
        "glass":       "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        "card":        "0 20px 60px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
}
