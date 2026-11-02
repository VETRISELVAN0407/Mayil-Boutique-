/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        peacock: {
          deep: '#0f3d2e',
          teal: '#0f5a3f',
          blue: '#174A8B',
          emerald: '#176B50',
          gold: '#E3BF72',
          50: '#e8f7f9',
          100: '#c4edf1',
          200: '#8fdce3',
          500: '#0f5a3f',
          600: '#0b4a3a',
          700: '#0a2d22',
        },
        ivory: {
          DEFAULT: '#FBF7EF',
        },
        surface: '#FFFFFF',
        brand: {
          primary: '#202A2B',
          secondary: '#697575',
          border: '#E8E0D3',
          sale: '#A43D42',
          success: '#277A53',
          gold: '#C6A15B',
        },
        navy: {
          DEFAULT: '#202A2B',
        },
        gold: {
          500: '#C6A15B',
          600: '#b08d47',
        },
        sale: {
          DEFAULT: '#A43D42',
        },
        success: {
          DEFAULT: '#277A53',
        },
      },
      fontFamily: {
        serif: ['Mayil Digits', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      boxShadow: {
        card: '0 2px 12px rgba(7,63,70,0.08)',
        'card-hover': '0 8px 32px rgba(7,63,70,0.14)',
        nav: '0 2px 16px rgba(7,63,70,0.10)',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};
