/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          app: '#F3F5F1',
          surface: '#FFFFFF',
          accent: '#EAF1EB',
          sidebar: '#202A24',
        },
        text: {
          primary: '#252D28',
          secondary: '#727D75',
          sidebar: '#DCE4DD',
        },
        accent: {
          DEFAULT: '#426B53',
          dark: '#31523F',
          light: '#EAF1EB',
        },
        border: {
          DEFAULT: '#E0E5DF',
          dark: '#303B33',
        },
        status: {
          pending: '#B78337',
          success: '#397754',
          error: '#B64C43',
          info: '#506E86',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
