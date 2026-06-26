/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2ea043',
          greenHover: '#2c974b',
          greenDark: '#238636',
          black: '#ffffff',
          darkGray: '#f6f8fa',
          medGray: '#eaeef2',
          border: '#d0d7de',
          text: '#24292f',
          textMuted: '#57606a',
          white: '#24292f',
        },
      },
    },
  },
  plugins: [],
};