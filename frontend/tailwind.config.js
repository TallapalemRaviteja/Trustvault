/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          midnight: '#0B1020',
          slate: '#121A2B',
          card: '#162137',
          cardHover: '#1B2945',
          border: '#1E2C48',
          borderSubtle: '#18243C',
          borderHover: '#2A3F66',
          electric: '#4F8CFF',
          cyan: '#42D9E8',
          text: '#F4F7FC',
          muted: '#9BA8BD',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'cyber-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.4), 0 1px 3px -1px rgba(79, 140, 255, 0.08)',
        'cyber-md': '0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -2px rgba(79, 140, 255, 0.12)',
        'cyber-lg': '0 16px 36px -6px rgba(0, 0, 0, 0.6), 0 4px 14px -3px rgba(66, 217, 232, 0.15)',
        'cyber-glow': '0 0 20px -3px rgba(79, 140, 255, 0.35)',
        'cyan-glow': '0 0 20px -3px rgba(66, 217, 232, 0.35)',
      },
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #4F8CFF 0%, #42D9E8 100%)',
        'gradient-dark': 'linear-gradient(180deg, #121A2B 0%, #0B1020 100%)',
        'gradient-card': 'linear-gradient(180deg, rgba(22, 33, 55, 0.7) 0%, rgba(18, 26, 43, 0.9) 100%)',
      }
    },
  },
  plugins: [],
}