const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Semantic tokens via CSS variables (Shadcn pattern) */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          /* Backward-compatible scale → Blueberry palette */
          50: 'var(--blueberry-50)',
          100: 'var(--blueberry-100)',
          200: 'var(--blueberry-200)',
          300: 'var(--blueberry-300)',
          400: 'var(--blueberry-400)',
          500: 'var(--blueberry-500)',
          600: 'var(--blueberry-600)',
          700: 'var(--blueberry-700)',
          800: 'var(--blueberry-800)',
          900: 'var(--blueberry-900)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          /* Backward-compatible scale → Pomegranate palette */
          50: 'var(--pomegranate-50)',
          100: 'var(--pomegranate-100)',
          500: 'var(--pomegranate-500)',
          600: 'var(--pomegranate-600)',
          700: 'var(--pomegranate-700)',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        /* Success → Matcha (same as primary family) */
        success: {
          50: 'var(--matcha-50)',
          100: 'var(--matcha-100)',
          500: 'var(--matcha-500)',
          600: 'var(--matcha-600)',
        },

        /* Warning → Lemon palette */
        warning: {
          50: 'var(--lemon-50)',
          100: 'var(--lemon-100)',
          500: 'var(--lemon-500)',
          600: 'var(--lemon-600)',
        },

        /* Danger → Pomegranate (same as destructive) */
        danger: {
          50: 'var(--pomegranate-50)',
          100: 'var(--pomegranate-100)',
          500: 'var(--pomegranate-500)',
          600: 'var(--pomegranate-600)',
        },

        /* Swatch palettes — available for direct use */
        matcha: {
          50: 'var(--matcha-50)',
          100: 'var(--matcha-100)',
          200: 'var(--matcha-200)',
          300: 'var(--matcha-300)',
          400: 'var(--matcha-400)',
          500: 'var(--matcha-500)',
          600: 'var(--matcha-600)',
          700: 'var(--matcha-700)',
          800: 'var(--matcha-800)',
          900: 'var(--matcha-900)',
        },
        lemon: {
          50: 'var(--lemon-50)',
          100: 'var(--lemon-100)',
          200: 'var(--lemon-200)',
          300: 'var(--lemon-300)',
          400: 'var(--lemon-400)',
          500: 'var(--lemon-500)',
          600: 'var(--lemon-600)',
          700: 'var(--lemon-700)',
          800: 'var(--lemon-800)',
          900: 'var(--lemon-900)',
        },
        slushie: {
          50: 'var(--slushie-50)',
          100: 'var(--slushie-100)',
          200: 'var(--slushie-200)',
          300: 'var(--slushie-300)',
          400: 'var(--slushie-400)',
          500: 'var(--slushie-500)',
          600: 'var(--slushie-600)',
          700: 'var(--slushie-700)',
          800: 'var(--slushie-800)',
          900: 'var(--slushie-900)',
        },
        ube: {
          50: 'var(--ube-50)',
          100: 'var(--ube-100)',
          200: 'var(--ube-200)',
          300: 'var(--ube-300)',
          400: 'var(--ube-400)',
          500: 'var(--ube-500)',
          600: 'var(--ube-600)',
          700: 'var(--ube-700)',
          800: 'var(--ube-800)',
          900: 'var(--ube-900)',
        },
        pomegranate: {
          50: 'var(--pomegranate-50)',
          100: 'var(--pomegranate-100)',
          200: 'var(--pomegranate-200)',
          300: 'var(--pomegranate-300)',
          400: 'var(--pomegranate-400)',
          500: 'var(--pomegranate-500)',
          600: 'var(--pomegranate-600)',
          700: 'var(--pomegranate-700)',
          800: 'var(--pomegranate-800)',
          900: 'var(--pomegranate-900)',
        },
        blueberry: {
          50: 'var(--blueberry-50)',
          100: 'var(--blueberry-100)',
          200: 'var(--blueberry-200)',
          300: 'var(--blueberry-300)',
          400: 'var(--blueberry-400)',
          500: 'var(--blueberry-500)',
          600: 'var(--blueberry-600)',
          700: 'var(--blueberry-700)',
          800: 'var(--blueberry-800)',
          900: 'var(--blueberry-900)',
        },
      },
      borderRadius: {
        standard: 'var(--radius-standard)',  /* 12px */
        feature: 'var(--radius-feature)',    /* 24px */
        section: 'var(--radius-section)',    /* 40px */
      },
      boxShadow: {
        /* Clay shadow system — multi-layer with hard offset */
        'clay-xs': '1px 1px 0 0 hsl(var(--foreground) / 0.08)',
        'clay-sm': '2px 2px 0 0 hsl(var(--foreground) / 0.08), 4px 4px 0 0 hsl(var(--foreground) / 0.04)',
        'clay': '3px 3px 0 0 hsl(var(--foreground) / 0.1), 6px 6px 0 0 hsl(var(--foreground) / 0.05)',
        'clay-md': '4px 4px 0 0 hsl(var(--foreground) / 0.1), 8px 8px 0 0 hsl(var(--foreground) / 0.05), 16px 16px 0 0 hsl(var(--foreground) / 0.03)',
        'clay-lg': '6px 6px 0 0 hsl(var(--foreground) / 0.12), 12px 12px 0 0 hsl(var(--foreground) / 0.06), 24px 24px 0 0 hsl(var(--foreground) / 0.03)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        /* Clay Typography Scale */
        'display-hero': ['5rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        'display-secondary': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        'section-heading': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'card-heading': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'feature-title': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        'body-lg': ['1.25rem', { lineHeight: '1.6' }],
        'body': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'caption': ['0.875rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'label-uppercase': ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.09em' }],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
