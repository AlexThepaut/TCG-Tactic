/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fdf4ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          900: '#581c87',
        },
        // Cyberpunk neon color system
        neon: {
          cyan: {
            50: '#e6ffff',
            100: '#b3ffff',
            200: '#80ffff',
            300: '#4dffff',
            400: '#1affff',
            500: '#00ffff',   // Pure cyan
            600: '#00e6e6',
            700: '#00cccc',
            800: '#00b3b3',
            900: '#009999',
          },
          blue: {
            50: '#e6f3ff',
            100: '#b3d9ff',
            200: '#80bfff',
            300: '#4da6ff',
            400: '#1a8cff',
            500: '#0099ff',   // Electric blue
            600: '#0088e6',
            700: '#0077cc',
            800: '#0066b3',
            900: '#005599',
          },
          pink: {
            50: '#ffe6f3',
            100: '#ffb3d9',
            200: '#ff80bf',
            300: '#ff4da6',
            400: '#ff1a8c',
            500: '#ff0099',   // Hot pink
            600: '#e60088',
            700: '#cc0077',
            800: '#b30066',
            900: '#990055',
          },
          green: {
            50: '#e6ffec',
            100: '#b3ffcc',
            200: '#80ffac',
            300: '#4dff8c',
            400: '#1aff6c',
            500: '#00ff66',   // Neon green
            600: '#00e65c',
            700: '#00cc52',
            800: '#00b348',
            900: '#00993e',
          },
        },
        // Futuristic game-specific faction colors
        humans: {
          50: '#e6f3ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#0099ff',   // Electric blue
          600: '#0088e6',   // Primary neon blue
          700: '#0077cc',   // Secondary neon blue
          800: '#0066b3',
          900: '#005599',
          glow: '#0099ff',
        },
        aliens: {
          50: '#ffe6f3',
          100: '#ffb3d9',
          200: '#ff80bf',
          300: '#ff4da6',
          400: '#ff1a8c',
          500: '#ff0099',   // Hot pink
          600: '#e60088',   // Primary neon pink
          700: '#cc0077',   // Secondary neon pink
          800: '#b30066',
          900: '#990055',
          glow: '#ff0099',
        },
        robots: {
          50: '#e6ffec',
          100: '#b3ffcc',
          200: '#80ffac',
          300: '#4dff8c',
          400: '#1aff6c',
          500: '#00ff66',   // Neon green
          600: '#00e65c',   // Primary neon green
          700: '#00cc52',   // Secondary neon green
          800: '#00b348',
          900: '#00993e',
          glow: '#00ff66',
        },
        // Cyberpunk backgrounds and surfaces
        cyber: {
          black: '#000000',
          dark: '#0a0a0a',
          darker: '#050505',
          surface: '#1a1a1a',
          elevated: '#2a2a2a',
          border: '#333333',
          muted: '#666666',
        },
        // Game UI colors - cyberpunk themed
        grid: {
          border: '#00ffff',     // Neon cyan borders
          cell: '#0a0a0a',       // Dark cyber cells
          hover: '#1a1a1a',      // Hover state
          glow: '#00ffff80',     // Semi-transparent glow
        },
      },
      fontFamily: {
        sans: ['Exo 2', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        cyber: ['Orbitron', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'neon-glow': 'neonGlow 2s ease-in-out infinite alternate',
        'neon-pulse': 'neonPulse 1.5s ease-in-out infinite',
        'cyber-flicker': 'cyberFlicker 0.15s ease-in-out infinite alternate',
        'scanline': 'scanline 2s linear infinite',
        'holographic': 'holographic 3s ease-in-out infinite',
        'glitch': 'glitch 0.3s ease-in-out infinite',
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
        neonGlow: {
          '0%': {
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
            filter: 'brightness(1)'
          },
          '100%': {
            boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
            filter: 'brightness(1.2)'
          },
        },
        neonPulse: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor'
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor'
          },
        },
        cyberFlicker: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.98' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        holographic: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            filter: 'hue-rotate(0deg)'
          },
          '50%': {
            backgroundPosition: '100% 50%',
            filter: 'hue-rotate(30deg)'
          },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
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