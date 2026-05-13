/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
        },
        semantic: {
          red: '#EF4444',
          orange: '#F59E0B',
          green: '#10B981',
        },
        neutral: {
          bg: '#FAFAF9',
          surface: '#FFFFFF',
          ink: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '13px',
        base: '14px',
        lg: '15px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.01em',
        normal: '0em',
      },
    },
  },
  plugins: [],
};
