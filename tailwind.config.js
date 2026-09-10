/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#fdf2f5',
          100: '#fbe6ec',
          200: '#f5ced9',
          300: '#efa2b8',
          400: '#e4698d',
          500: '#d53a66',
          600: '#be234d',
          700: '#a0173b',
          800: '#7d1234', // Primary brand color
          900: '#701432',
          950: '#410719',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
