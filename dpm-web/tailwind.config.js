/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // NavEaze Brand Colors
        brand: {
          black: '#000000',
          white: '#FFFFFF',
          red: '#E63946',
          gray: {
            dark: '#3D3D3D',
            light: '#F5F5F5',
          },
          yellow: '#FFD700',
        },
        // Primary color scheme
        primary: {
          DEFAULT: '#000000',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#3D3D3D',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#E63946',
          foreground: '#FFFFFF',
        },
        highlight: {
          DEFAULT: '#FFD700',
          foreground: '#000000',
        },
      },
    },
  },
  plugins: [],
};
