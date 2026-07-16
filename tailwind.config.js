/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        tamil: ['Noto Sans Tamil', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
        sans: ['Outfit', 'DM Sans', 'sans-serif'],
      },
      colors: {
        soil: {
          50: '#fdf8f0',
          100: '#f9edd8',
          200: '#f0d4a8',
          300: '#e4b472',
          400: '#d4883a',
          500: '#c06820',
          600: '#a05018',
          700: '#7d3c14',
          800: '#5e2e10',
          900: '#3d1e0a',
        },
        leaf: {
          50: '#f0faf0',
          100: '#d8f2d8',
          200: '#a8e4a8',
          300: '#6dd06d',
          400: '#38b238',
          500: '#228822',
          600: '#1a6e1a',
          700: '#145414',
          800: '#0e3c0e',
          900: '#082608',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e3fe',
          300: '#7ccdf9',
          400: '#36b2f3',
          500: '#0c96e0',
          600: '#0074be',
          700: '#005a9a',
          800: '#004070',
          900: '#002a4a',
        }
      }
    },
  },
  plugins: [],
}
