/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F5F0',
        'paper-dim': '#EFEBE2',
        ink: '#1C2321',
        'ink-soft': '#3A423E',
        registry: '#2E5339',
        'registry-soft': '#4A7259',
        stamp: '#B8622E',
        'stamp-soft': '#D48856',
        file: '#8B8578',
        'file-line': '#DDD8CB',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        'type-line': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'blink-cursor': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'stamp-in': {
          '0%': { opacity: '0', transform: 'scale(1.4) rotate(-8deg)' },
          '60%': { opacity: '1', transform: 'scale(0.94) rotate(-2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-2deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'type-line': 'type-line 0.9s steps(28, end) forwards',
        'blink-cursor': 'blink-cursor 1s step-end infinite',
        'stamp-in': 'stamp-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-up': 'fade-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
