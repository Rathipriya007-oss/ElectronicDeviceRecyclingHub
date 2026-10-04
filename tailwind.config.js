/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#07100D',
        surface: {
          DEFAULT: '#0E1814',
          subtle: '#0E1814',
          elevated: '#13211B',
          hover: '#182922',
          card: '#0E1814',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.07)',
          subtle: 'rgba(255, 255, 255, 0.07)',
          gold: 'rgba(235, 211, 160, 0.3)',
          highlight: 'rgba(255, 255, 255, 0.12)',
        },
        primary: {
          light: '#EBD3A0',
          DEFAULT: '#C49A55',
          dark: '#A67C38',
          text: '#1A1409',
        },
        accent: {
          gold: '#EBD3A0',
          goldDark: '#C49A55',
          emerald: '#3FA17C', // Success / verified only
          teal: '#4FA3A5',    // Grade B
          amber: '#E0A94F',   // Grade C
          coral: '#D9776B',   // Grade D
        },
        content: {
          DEFAULT: '#F3EFE6',
          muted: '#8C9C94',
          subtle: '#5F7068',
        }
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'gold-sm': '0 0 12px -2px rgba(235, 211, 160, 0.2)',
        'gold-md': '0 4px 20px -2px rgba(196, 154, 85, 0.25)',
        'card': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'inner-highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #EBD3A0 0%, #C49A55 100%)',
        'gold-gradient-hover': 'linear-gradient(135deg, #F2DFB8 0%, #D4AA65 100%)',
        'gold-subtle': 'linear-gradient(135deg, rgba(235, 211, 160, 0.1) 0%, rgba(196, 154, 85, 0.03) 100%)',
        'radial-gold': 'radial-gradient(ellipse at top, rgba(235, 211, 160, 0.08) 0%, transparent 70%)',
      },
      animation: {
        'scan-laser': 'laser 2.4s ease-in-out infinite alternate',
      },
      keyframes: {
        laser: {
          '0%': { top: '0%', opacity: 0.7 },
          '50%': { opacity: 1 },
          '100%': { top: '100%', opacity: 0.7 },
        }
      }
    },
  },
  plugins: [],
}
