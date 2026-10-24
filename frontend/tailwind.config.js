/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#94bcdd',
          400: '#5e9bcb',
          500: '#387eb7',
          600: '#27649a',
          700: '#20507d',
          800: '#1d4468',
          900: '#0f2338',
          950: '#091523',
        },
        navy: {
          800: '#0d1b2a',
          900: '#0a1118',
          950: '#050a0f',
        },
        accent: {
          teal: '#0ea5e9',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
