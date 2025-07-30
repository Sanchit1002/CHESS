/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        // Existing animation
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        // Added animations
        'shimmer': 'shimmer 1.5s linear infinite',
        'fade-in-fast': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        // Existing keyframes
        'glow-pulse': {
          '0%, 100%': {
            textShadow: '0 0 8px currentColor'
          },
          '50%': {
            textShadow: '0 0 20px currentColor, 0 0 10px currentColor'
          },
        },
        // Added keyframes
        'shimmer': {
          '0%': { transform: 'translateX(-150%) skewX(-12deg)' },
          '100%': { transform: 'translateX(150%) skewX(-12deg)' },
        },
        'fadeIn': {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};