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
        // Space animations
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'twinkle-delayed': 'twinkle 4s ease-in-out infinite 1s',
        'twinkle-slow': 'twinkle 6s ease-in-out infinite 2s',
        'orbit': 'orbit 20s linear infinite',
        'orbit-reverse': 'orbit 25s linear infinite reverse',
        'orbit-slow': 'orbit 30s linear infinite',
        'shooting-star': 'shootingStar 3s ease-out infinite',
        'shooting-star-delayed': 'shootingStar 4s ease-out infinite 2s',
        'float': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 10s ease-in-out infinite 3s',
        'nebula-drift': 'nebulaDrift 15s ease-in-out infinite',
        'planet-glow': 'planetGlow 3s ease-in-out infinite alternate',
        // Warhammer 40K animations
        'warp-storm': 'warpStorm 8s ease-in-out infinite',
        'warp-lightning': 'warpLightning 2s ease-in-out infinite',
        'imperial-glow': 'imperialGlow 4s ease-in-out infinite alternate',
        'chaos-pulse': 'chaosPulse 3s ease-in-out infinite',
        'void-drift': 'voidDrift 12s linear infinite',
        'battle-spark': 'battleSpark 1.5s ease-out infinite',
        'plasma-glow': 'plasmaGlow 2.5s ease-in-out infinite alternate',
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
        // Space keyframes
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(100px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(100px) rotate(-360deg)' },
        },
        shootingStar: {
          '0%': {
            transform: 'translateX(-100px) translateY(-100px) rotate(-45deg)',
            opacity: '0',
          },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': {
            transform: 'translateX(100vw) translateY(100vh) rotate(-45deg)',
            opacity: '0',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)' },
        },
        nebulaDrift: {
          '0%, 100%': {
            transform: 'translateX(0px) translateY(0px) scale(1)',
            opacity: '0.1',
          },
          '33%': {
            transform: 'translateX(20px) translateY(-10px) scale(1.1)',
            opacity: '0.2',
          },
          '66%': {
            transform: 'translateX(-15px) translateY(15px) scale(0.9)',
            opacity: '0.15',
          },
        },
        planetGlow: {
          '0%': {
            boxShadow: '0 0 20px currentColor, inset 0 0 20px rgba(255, 255, 255, 0.1)',
          },
          '100%': {
            boxShadow: '0 0 40px currentColor, 0 0 60px currentColor, inset 0 0 20px rgba(255, 255, 255, 0.2)',
          },
        },
        // Warhammer 40K keyframes
        warpStorm: {
          '0%, 100%': {
            transform: 'scale(1) rotate(0deg)',
            opacity: '0.3',
            filter: 'hue-rotate(0deg)',
          },
          '33%': {
            transform: 'scale(1.2) rotate(120deg)',
            opacity: '0.7',
            filter: 'hue-rotate(60deg)',
          },
          '66%': {
            transform: 'scale(0.8) rotate(240deg)',
            opacity: '0.5',
            filter: 'hue-rotate(-30deg)',
          },
        },
        warpLightning: {
          '0%, 90%, 100%': { opacity: '0' },
          '10%, 15%, 25%, 30%': { opacity: '1' },
          '20%': { opacity: '0.5' },
        },
        imperialGlow: {
          '0%': {
            boxShadow: '0 0 15px #b8860b, 0 0 30px #b8860b, inset 0 0 10px rgba(184, 134, 11, 0.2)',
          },
          '100%': {
            boxShadow: '0 0 25px #d4761a, 0 0 50px #eaa64f, 0 0 75px #b8860b, inset 0 0 15px rgba(234, 166, 79, 0.3)',
          },
        },
        chaosPulse: {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 20px #dc2626, 0 0 40px #991b1b',
            filter: 'hue-rotate(0deg)',
          },
          '50%': {
            transform: 'scale(1.1)',
            boxShadow: '0 0 30px #b91c1c, 0 0 60px #dc2626, 0 0 90px #7f1d1d',
            filter: 'hue-rotate(20deg)',
          },
        },
        voidDrift: {
          '0%': { transform: 'translateX(-100px) translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateX(50px) translateY(-30px) rotate(90deg)' },
          '50%': { transform: 'translateX(100px) translateY(0px) rotate(180deg)' },
          '75%': { transform: 'translateX(50px) translateY(30px) rotate(270deg)' },
          '100%': { transform: 'translateX(-100px) translateY(0px) rotate(360deg)' },
        },
        battleSpark: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.5) rotate(0deg)',
          },
          '10%': {
            opacity: '1',
            transform: 'scale(1.2) rotate(45deg)',
          },
          '20%': {
            opacity: '0.8',
            transform: 'scale(0.8) rotate(90deg)',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(0.3) rotate(180deg)',
          },
        },
        plasmaGlow: {
          '0%': {
            boxShadow: '0 0 10px #3b82f6, 0 0 20px #1d4ed8, inset 0 0 5px rgba(59, 130, 246, 0.3)',
          },
          '100%': {
            boxShadow: '0 0 20px #60a5fa, 0 0 40px #3b82f6, 0 0 60px #1e40af, inset 0 0 10px rgba(96, 165, 250, 0.5)',
          },
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
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}