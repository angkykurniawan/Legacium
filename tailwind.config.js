/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F242D',
        surface: '#EEF8FA',
        'surface-mint': '#E5F5F1',
        'neo-blue': '#0E6BA8',
        'neo-teal': '#3CC9B8',
        'neo-sky': '#9AD1F5',
        'neo-orange': '#E55827',
        'neo-yellow': '#F7C948',
        'neo-mint': '#66D7C5'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        neo: '0 4px 0 #0F242D',
        'neo-sm': '0 2.5px 0 #0F242D',
        'neo-lg': '0 5px 0 #0F242D',
        'neo-card': '2px 4px 0 #0F242D'
      },
      borderRadius: {
        '2xl': '1.15rem',
        '3xl': '1.5rem'
      }
    }
  },
  plugins: []
};
