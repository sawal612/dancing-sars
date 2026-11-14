/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        accent: {
          DEFAULT: '#0891B2',
          light: '#06B6D4',
          dark: '#0E7490',
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          600: '#0891B2',
          700: '#0E7490',
        },
        primaryText: '#0F172A',
        secondaryText: '#64748B',
        borderCol: '#E2E8F0',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace', 'ui-monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

