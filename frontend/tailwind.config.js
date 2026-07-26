/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f9fa',
          100: '#d5f0f3',
          200: '#aee2e8',
          300: '#75ccda',
          400: '#34afc4',
          500: '#008ba3', // Primary Medical Teal
          600: '#007086',
          700: '#065b6d',
          800: '#0c4a58',
          900: '#0e3e4b',
          950: '#052731',
        },
        slate: {
          850: '#151e2e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Hind Siliguri', 'system-ui', 'sans-serif'],
        bengali: ['Hind Siliguri', 'SolaimanLipi', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'card': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'card-hover': '0 0 0 1px rgba(0, 139, 163, 0.2), 0 10px 25px -5px rgba(0, 139, 163, 0.1)',
      }
    },
  },
  plugins: [],
}
