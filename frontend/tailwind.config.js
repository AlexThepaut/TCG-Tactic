/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warhammer 40K Inspired Dark Theme
        imperial: {
          50: '#fef7f0',   // Bone white
          100: '#fcedd5',  // Parchment
          200: '#f7d0a4',  // Aged ivory
          300: '#eaa64f',  // Imperial gold
          400: '#d4761a',  // Deep gold
          500: '#b8860b',  // Dark goldenrod
          600: '#9b6914',  // Bronze
          700: '#7c4f0d',  // Dark bronze
          800: '#5c3a0a',  // Deep bronze
          900: '#3d2707',  // Shadow bronze
        },
        void: {
          50: '#f8fafc',   // Lightest void
          100: '#f1f5f9',  // Light void
          200: '#e2e8f0',  // Pale void
          300: '#cbd5e1',  // Void gray
          400: '#94a3b8',  // Medium void
          500: '#64748b',  // Dark void
          600: '#475569',  // Deeper void
          700: '#334155',  // Deep void
          800: '#1e293b',  // Abyss
          900: '#0f172a',  // Black void
        },
        blood: {
          50: '#fef2f2',   // Pale blood
          100: '#fee2e2',  // Light blood
          200: '#fecaca',  // Crimson glow
          300: '#fca5a5',  // Fresh blood
          400: '#f87171',  // Bright blood
          500: '#ef4444',  // Blood red
          600: '#dc2626',  // Dark blood
          700: '#b91c1c',  // Deep blood
          800: '#991b1b',  // Dried blood
          900: '#7f1d1d',  // Black blood
        },
        // Game-specific faction colors reimagined for 40K aesthetic
        humans: {
          50: '#f0f4f8',   // Imperial white
          100: '#d9e2ec',  // Light steel
          200: '#bcccdc',  // Steel blue
          300: '#9fb3c8',  // Military blue
          400: '#829ab1',  // Deep military
          500: '#627d98',  // Imperial steel
          600: '#486581',  // Dark steel
          700: '#334e68',  // Battle steel
          800: '#243b53',  // War steel
          900: '#102a43',  // Midnight steel
        },
        aliens: {
          50: '#f2f0ff',   // Pale void
          100: '#e0dcff',  // Light warp
          200: '#c7bfff',  // Warp glow
          300: '#a99eff',  // Psychic energy
          400: '#8b7dff',  // Deep warp
          500: '#6d5cff',  // Void purple
          600: '#5a46e5',  // Dark warp
          700: '#4c35cc',  // Deep psychic
          800: '#3d27b3',  // Warp shadow
          900: '#2e1a99',  // Void black
        },
        robots: {
          50: '#fff2f0',   // Light mars
          100: '#ffe0dc',  // Mars dust
          200: '#ffc4bb',  // Rust glow
          300: '#ff9e91',  // Active rust
          400: '#ff7961',  // Forge fire
          500: '#ff5722',  // Mars red
          600: '#e64a19',  // Forge red
          700: '#d84315',  // Deep forge
          800: '#bf360c',  // Machine red
          900: '#a52a00',  // Dark machine
        },
        // Gothic UI colors
        gothic: {
          black: '#000000',      // Pure black
          darkest: '#0a0a0a',    // Near black
          darker: '#1a1a1a',     // Very dark
          dark: '#2a2a2a',       // Dark
          medium: '#3a3a3a',     // Medium dark
          light: '#4a4a4a',      // Light dark
          lighter: '#5a5a5a',    // Lighter
          steel: '#666666',      // Steel gray
          silver: '#888888',     // Silver
          chrome: '#aaaaaa',     // Chrome
        },
        grid: {
          border: '#1a1a1a',  // Gothic dark borders
          cell: '#0f0f0f',     // Deep black cells
          hover: '#2a2a2a',    // Gothic hover
          glow: '#ff5722',     // Mars glow
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Space Grotesk', 'system-ui', 'sans-serif'], // Futuristic display font
        gothic: ['Cinzel', 'serif'], // Gothic serif for imperial text
        tech: ['Rajdhani', 'sans-serif'], // Tech/military font
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flicker': 'flicker 3s linear infinite',
        'scan': 'scan 2s linear infinite',
        'hologram': 'hologram 4s ease-in-out infinite',
        'ember': 'ember 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glow: {
          '0%': {
            filter: 'drop-shadow(0 0 2px currentColor)',
            transform: 'scale(1)'
          },
          '100%': {
            filter: 'drop-shadow(0 0 6px currentColor) drop-shadow(0 0 10px currentColor)',
            transform: 'scale(1.02)'
          },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
          '75%': { opacity: '0.9' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        hologram: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        ember: {
          '0%': { boxShadow: '0 0 5px #ff5722' },
          '100%': { boxShadow: '0 0 15px #ff5722, 0 0 25px #ff5722' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      aspectRatio: {
        'card': '63/88', // Standard playing card ratio
        'grid': '5/3',  // Game grid ratio
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}