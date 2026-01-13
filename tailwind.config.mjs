/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#001F3F',
          cyan: '#5AB9D3',
          'cyan-light': '#7CC8DD',
          'cyan-lighter': '#9ED7E7',
          'cyan-lightest': '#C0E6F1',
          'cyan-dark': '#3A97B7',
          'cyan-darker': '#2A7A92',
          white: '#FFFFFF',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E0E0E0',
          300: '#CBCED4',
          500: '#5a5a6e', // Improved contrast ratio (was #717182)
          700: '#333333',
          900: '#0F1419',
        },
        feedback: {
          success: '#0F7C3E',
          error: '#C41E3A',
          warning: '#E67E22',
          info: '#1E88E5',
        },
      },
      fontFamily: {
        primary: ['Inter', 'InterVariable', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', "'Helvetica Neue'", 'Arial', 'sans-serif'],
        mono: ["'Courier New'", 'Courier', 'monospace'],
      },
      fontSize: {
        display: '3.5rem', // 56px
        h1: '3rem', // 48px
        h2: '2.25rem', // 36px
        h3: '1.75rem', // 28px
        h4: '1.5rem', // 24px
        h5: '1.25rem', // 20px
        h6: '1.125rem', // 18px
        lg: '1.125rem', // 18px
        base: '1rem', // 16px
        sm: '0.875rem', // 14px
        xs: '0.75rem', // 12px
      },
      lineHeight: {
        tight: 1.2,
        snug: 1.3,
        normal: 1.5,
        relaxed: 1.6,
      },
      spacing: {
        '1': '0.25rem', // 4px
        '2': '0.5rem', // 8px
        '3': '0.75rem', // 12px
        '4': '1rem', // 16px
        '5': '1.25rem', // 20px
        '6': '1.5rem', // 24px
        '8': '2rem', // 32px
        '10': '2.5rem', // 40px
        '12': '3rem', // 48px
        '16': '4rem', // 64px
        '20': '5rem', // 80px
        '24': '6rem', // 96px
      },
      borderRadius: {
        sm: '0.25rem', // 4px
        md: '0.375rem', // 6px
        lg: '0.5rem', // 8px
        xl: '0.75rem', // 12px
        '2xl': '1rem', // 16px
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.1)',
        '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
        'brand-cyan': '0 10px 30px -5px rgba(90, 185, 211, 0.3)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
    },
  },
  plugins: [],
}

