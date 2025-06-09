/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          light: '#3b82f6', // blue-500
          dark: '#1e40af', // blue-800
        },
        secondary: {
          DEFAULT: '#14b8a6', // teal-500
          light: '#5eead4', // teal-300
          dark: '#0f766e', // teal-800
        },
        accent: {
          DEFAULT: '#64748b', // slate-500
          light: '#cbd5e1', // slate-300
          dark: '#334155', // slate-800
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}

