/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1B19',
        paper: {
          DEFAULT: '#F5F1E6',
          dark: '#EAE3D2',
        },
        line: '#D9CFB8',
        ticket: {
          // Primary brand accent — CTAs, prices, active stamp.
          50: '#FBEAE9',
          100: '#F5CBC9',
          300: '#E67A76',
          500: '#D62828',
          600: '#B81F1F',
          700: '#8F1717',
        },
        cook: {
          // "Preparing" stamp.
          100: '#FBE6C4',
          500: '#F2A93B',
          700: '#B87A1E',
        },
        route: {
          // "Picked up / on the way" stamp + the route-line motif.
          100: '#DCE6F7',
          500: '#2E5EAA',
          700: '#1F3F73',
        },
        pass: {
          // "Delivered / available" stamp.
          100: '#DCEEDD',
          500: '#3A7D44',
          700: '#275A2E',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        ticket: '4px',
      },
    },
  },
  plugins: [],
};
