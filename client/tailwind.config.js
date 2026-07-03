/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sleep: {
          50: '#f5f7fb',
          100: '#ebeff7',
          200: '#d3def0',
          300: '#abc2e2',
          400: '#7da1d0',
          500: '#587ebc',
          600: '#4364a2',
          700: '#385085',
          800: '#2b3f69',
          900: '#1b2640',
          950: '#0a0e1a', // Deep space dark background
        },
        dawn: {
          50: '#fffbf7',
          100: '#fff3e5',
          200: '#ffe3c7',
          300: '#ffcb99',
          400: '#ffaa61',
          500: '#ff8633',
          600: '#f56314',
          700: '#cc460a',
          800: '#a3380d',
          900: '#82300f',
          950: '#471604',
        },
        indigoCalm: {
          50: '#f4f4fe',
          100: '#ebebfc',
          200: '#dcdcfc',
          300: '#c2c2fa',
          400: '#9f9df5',
          500: '#7c76ee',
          600: '#6258e2',
          700: '#5044cc',
          800: '#4337aa',
          900: '#39308a',
          950: '#221b54',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 4s infinite ease-in-out',
        'float': 'float 6s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.015)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
