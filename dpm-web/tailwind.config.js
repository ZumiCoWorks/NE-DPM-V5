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
          red: '#ed1c24', // NavEase Red
          redHover: '#b2151b', // Darker Red for Hover
          gray: {
            dark: '#3D3D3D',
            light: '#F5F5F5',
          },
          yellow: '#FFD700',
        },
        // NavEaze Landing Page Colors
        'naveaze-red': '#FF4D32',
        'logic-blue': '#3B82F6',
        'ultra-dark': '#0A0A0A',
        // Primary color scheme
        primary: {
          DEFAULT: '#ed1c24', // NavEase Red
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#3D3D3D',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#ed1c24', // NavEase Red
          foreground: '#FFFFFF',
        },
        highlight: {
          DEFAULT: '#FFD700',
          foreground: '#000000',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
