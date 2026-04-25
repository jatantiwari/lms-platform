/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f9e0c7',
          100: '#f2c98f',
          200: '#f1a85b',
          300: '#e88d32',
          400: '#e07723',
          500: '#d66e1a',
          600: '#c65b16',
          700: '#a84b13',
          800: '#8a3b10',
          900: '#6b2c0d',
        },
        secondary: {
          50: '#f9d0d0',
          100: '#f4b3b3',
          200: '#f07f7f',
          300: '#e64f4f',
          400: '#e02929',
          500: '#ef4444',
          600: '#d33f3f',
          700: '#b23737',
          800: '#8a2c2c',
          900: '#651d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
