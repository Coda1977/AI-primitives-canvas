/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#F5F0E8',
        'text-primary': '#1A1A1A',
        'accent-yellow': '#FFD60A',
        'accent-blue': '#003566',
        'text-secondary': '#4A4A4A',
      }
    },
  },
  plugins: [],
}
