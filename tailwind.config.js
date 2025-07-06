/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./login.html",
    "./profile.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(120deg, #f6d365 0%, #fda085 100%)",
        "gradient-animated":
          "linear-gradient(270deg, #f6d365, #fda085, #fbc2eb, #a1c4fd, #f6d365)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
