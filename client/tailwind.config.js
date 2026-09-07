/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        // Colan Primary Cobalt Blue
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // Primary Colan Blue
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Deep Navy for Admin Sidebar (Reference Bottom-Left)
        navy: {
          950: '#070C18',
          900: '#0B132B',
          850: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'btn': '12px',
        'input': '12px',
        'card': '20px',
        'modal': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 10px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
        'modal': '0 24px 60px -12px rgba(15, 23, 42, 0.18)',
        'food-selected': '0 0 0 2px #2563EB, 0 8px 25px -4px rgba(37, 99, 235, 0.22)',
        'glow-blue': '0 0 24px rgba(37, 99, 235, 0.25)',
        'glass': '0 8px 30px 0 rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
