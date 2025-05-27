/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors matching your app's theme
        'app-bg': '#28224a',
        'app-surface': '#3a335a',
        'app-primary': '#a259f7',
        'app-secondary': '#805ad5',
        'app-text': '#e6e0ff',
        'app-text-muted': '#9d8bbc',
        'app-text-accent': '#d4c1ff',
        'app-error': '#ffbaba',
        'app-success': '#90ee90',
      },
      fontFamily: {
        'app': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'app': '0 2px 8px rgba(0,0,0,0.15)',
        'app-lg': '0 4px 12px rgba(128, 90, 213, 0.4)',
      },
    },
  },
  plugins: [],
} 