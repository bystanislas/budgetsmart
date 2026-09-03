/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Charte APEX AFRICA.
        apex: {
          navy: '#1A3557', ink: '#122845', steel: '#2E5480', mist: '#D6E4F0',
          gold: '#B8860B', sun: '#D9A93C', light: '#F0C75E', cream: '#FDF6E3',
          orange: '#E07B22', green: '#1E6B3C', mint: '#D4EDDA',
          red: '#8B1A1A', blush: '#F8D7DA', teal: '#10706B', slate: '#404040',
          wedding: '#9C3A5F',
        },
        // Gris chauds : fonds, bordures, textes secondaires.
        surface: {
          0: '#ffffff', 50: '#fbfbfc', 100: '#f5f6f8', 200: '#eceef2',
          300: '#dfe3e9', 400: '#c3c9d4', 500: '#8b93a3', 600: '#626b7c',
          700: '#454d5c', 800: '#2c333f', 900: '#1a1f28',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        // Ombres très douces : la hiérarchie repose sur les bordures, pas sur le relief.
        card: '0 1px 2px rgba(16, 24, 40, 0.04)',
        raised: '0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)',
        pop: '0 16px 40px -12px rgba(16, 24, 40, 0.18), 0 4px 12px -4px rgba(16, 24, 40, 0.08)',
        focus: '0 0 0 3px rgba(242, 134, 13, 0.18)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'none' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in .16s ease-out',
        'slide-up': 'slide-up .2s cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
}
