import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#002020',
        green: '#00e676',
        red: '#ff5252',
        gray: '#94a3b8'
      },
      borderRadius: {
        card: '8px',
        btn: '4px'
      }
    }
  },
  plugins: []
} satisfies Config;
