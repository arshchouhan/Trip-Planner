/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1f2937', // Slate 800
        'secondary': '#f9fafb', // Gray 50
        'accent': '#14b8a6', // Teal 500
        'accent-hover': '#0d9488' // Teal 600
      }
    },
  },
  plugins: [],
}
