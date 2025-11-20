/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "!./src/index.html" // Landing page uses default Tailwind + custom classes
  ],
  theme: {
    extend: {
      // Color Palette from Design Tokens
      colors: {
        neutral: {
          0: '#FFFFFF',
          50: '#F9FAFB',
          100: '#F2F4F7',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        primary: {
          50: '#EEF6FF',
          100: '#D9ECFF',
          200: '#B7D7FF',
          300: '#8ABEFF',
          400: '#5AA3FF',
          500: '#2F85FF',
          600: '#1E6CE0',
          700: '#1554B3',
          800: '#0E3D86',
          900: '#082858',
        },
        accentA: {
          100: '#EAFBF1',
          300: '#7ADFA6',
          500: '#22C55E',
          600: '#16A34A',
          700: '#16A34A',
        },
        accentB: {
          100: '#FFF4E5',
          300: '#FFC275',
          500: '#FB923C',
          700: '#EA580C',
        },
        danger: {
          100: '#FEECEC',
          300: '#F68A8A',
          500: '#EF4444',
          700: '#DC2626',
        },
        info: {
          100: '#E8F5FF',
          300: '#7CC5FF',
          500: '#3B82F6',
          700: '#2563EB',
        },
      },

      // Font Families
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
      },

      // Font Sizes
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.33' }],
        '3xl': ['28px', { lineHeight: '1.33' }],
        '4xl': ['32px', { lineHeight: '1.2' }],
        '5xl': ['40px', { lineHeight: '1.2' }],
        '6xl': ['48px', { lineHeight: '1.2' }],
      },

      // Font Weights
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // Letter Spacing
      letterSpacing: {
        tight: '-0.2px',
        normal: '0px',
        wide: '0.2px',
      },

      // Spacing (extends default Tailwind)
      spacing: {
        '1': '2px',
        '2': '4px',
        '3': '8px',
        '4': '12px',
        '5': '16px',
        '6': '20px',
        '7': '24px',
        '8': '32px',
        '9': '40px',
        '10': '48px',
        '11': '56px',
        '12': '64px',
      },

      // Border Radius
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },

      // Border Width
      borderWidth: {
        hairline: '0.5px',
        DEFAULT: '1px',
        2: '2px',
      },

      // Box Shadows (Elevation)
      boxShadow: {
        xs: '0 1px 2px rgba(16, 24, 40, 0.06)',
        sm: '0 2px 6px rgba(16, 24, 40, 0.08)',
        md: '0 8px 24px rgba(16, 24, 40, 0.10)',
        lg: '0 12px 32px rgba(16, 24, 40, 0.12)',
      },

      // Opacity
      opacity: {
        '0': '0',
        '10': '0.1',
        '20': '0.2',
        '40': '0.4',
        '60': '0.6',
        '80': '0.8',
        '100': '1.0',
      },

      // Z-Index
      zIndex: {
        base: '0',
        raised: '10',
        sticky: '20',
        overlay: '40',
        modal: '80',
        toast: '100',
      },

      // Animation Durations
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
      },

      // Animation Timing Functions
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1.2)',
      },

      // Max Width
      maxWidth: {
        container: '1280px',
        hero: '1040px',
        modal: '720px',
      },

      // Component-specific heights
      height: {
        input: '40px',
        'button-sm': '36px',
        'button-md': '40px',
        'button-lg': '48px',
        topbar: '64px',
        'sidebar-item': '44px',
        'table-row': '48px',
        'tab': '40px',
        'badge': '24px',
      },

      // Component-specific widths
      width: {
        sidebar: '280px',
      },

      // Backdrop Blur
      backdropBlur: {
        modal: '4px',
      },

      // Background Colors (Semantic Roles)
      backgroundColor: {
        'page': '#F9FAFB', // neutral-50
        'surface': '#FFFFFF', // neutral-0
        'subtle': '#F2F4F7', // neutral-100
      },

      // Text Colors (Semantic Roles)
      textColor: {
        'primary-text': '#1F2937', // neutral-800
        'secondary-text': '#4B5563', // neutral-600
        'inverse': '#FFFFFF', // neutral-0
      },

      // Border Colors (Semantic Roles)
      borderColor: {
        'subtle': '#E5E7EB', // neutral-200
        'strong': '#D1D5DB', // neutral-300
      },

      // Keyframes for custom animations
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0.2, 0, 0, 1)',
        'slide-up': 'slide-up 200ms cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [
    // Custom plugin for component utilities
    function({ addComponents, theme }) {
      addComponents({
        // Card Component
        '.card': {
          backgroundColor: theme('colors.neutral.0'),
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.8'),
          boxShadow: theme('boxShadow.md'),
          border: `1px solid ${theme('colors.neutral.200')}`,
        },
        '.card-hover': {
          transition: `box-shadow ${theme('transitionDuration.base')} ${theme('transitionTimingFunction.standard')}`,
          '&:hover': {
            boxShadow: theme('boxShadow.lg'),
          },
        },

        // Button Variants
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme('borderRadius.md'),
          fontFamily: theme('fontFamily.sans'),
          fontWeight: theme('fontWeight.semibold'),
          transition: `all ${theme('transitionDuration.base')} ${theme('transitionTimingFunction.standard')}`,
          cursor: 'pointer',
          '&:disabled': {
            opacity: theme('opacity.50'),
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.600'),
          color: theme('colors.neutral.0'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.primary.700'),
          },
        },
        '.btn-secondary': {
          backgroundColor: 'color-mix(in srgb, #1E6CE0 10%, #FFFFFF)',
          color: theme('colors.primary.600'),
          border: `1px solid ${theme('colors.neutral.200')}`,
          '&:hover:not(:disabled)': {
            backgroundColor: 'color-mix(in srgb, #1E6CE0 15%, #FFFFFF)',
          },
        },
        '.btn-ghost': {
          backgroundColor: 'transparent',
          color: theme('colors.neutral.800'),
          '&:hover:not(:disabled)': {
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
          },
        },

        // Input Component
        '.input': {
          height: theme('height.input'),
          borderRadius: theme('borderRadius.md'),
          backgroundColor: theme('colors.neutral.0'),
          border: `1px solid ${theme('colors.neutral.200')}`,
          padding: '0 16px',
          fontSize: theme('fontSize.base')[0],
          color: theme('colors.neutral.800'),
          transition: `all ${theme('transitionDuration.base')} ${theme('transitionTimingFunction.standard')}`,
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px color-mix(in srgb, #1E6CE0 35%, transparent)`,
            borderColor: theme('colors.primary.600'),
          },
          '&::placeholder': {
            color: theme('colors.neutral.600'),
          },
        },

        // Badge Component
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          height: theme('height.badge'),
          paddingLeft: '10px',
          paddingRight: '10px',
          borderRadius: theme('borderRadius.full'),
          fontSize: theme('fontSize.sm')[0],
          fontWeight: theme('fontWeight.medium'),
        },
        '.badge-info': {
          backgroundColor: theme('colors.info.100'),
          color: theme('colors.info.700'),
        },
        '.badge-success': {
          backgroundColor: theme('colors.accentA.100'),
          color: theme('colors.accentA.700'),
        },
        '.badge-warn': {
          backgroundColor: theme('colors.accentB.100'),
          color: theme('colors.accentB.700'),
        },
        '.badge-error': {
          backgroundColor: theme('colors.danger.100'),
          color: theme('colors.danger.700'),
        },

        // KPI Tile Component
        '.kpi-tile': {
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.7'),
          backgroundColor: theme('colors.neutral.0'),
          boxShadow: theme('boxShadow.md'),
        },
        '.kpi-value': {
          fontFamily: theme('fontFamily.mono'),
          fontSize: theme('fontSize.4xl')[0],
          fontWeight: theme('fontWeight.bold'),
          color: theme('colors.neutral.800'),
        },
        '.kpi-trend-up': {
          color: theme('colors.accentA.600'),
        },
        '.kpi-trend-down': {
          color: theme('colors.danger.600'),
        },

        // Table Component
        '.table-row': {
          height: theme('height.table-row'),
          transition: `background-color ${theme('transitionDuration.fast')} ${theme('transitionTimingFunction.standard')}`,
          '&:hover': {
            backgroundColor: 'color-mix(in srgb, #1E6CE0 4%, transparent)',
          },
        },

        // Modal Component
        '.modal': {
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.lg'),
          backgroundColor: theme('colors.neutral.0'),
          padding: theme('spacing.8'),
          maxWidth: theme('maxWidth.modal'),
        },
        '.modal-backdrop': {
          backgroundColor: 'rgba(17, 24, 39, 0.45)',
          backdropFilter: 'blur(4px)',
        },

        // Progress Bar
        '.progress': {
          height: '8px',
          borderRadius: theme('borderRadius.full'),
          backgroundColor: theme('colors.neutral.100'),
          overflow: 'hidden',
        },
        '.progress-bar': {
          height: '100%',
          backgroundColor: theme('colors.primary.600'),
          transition: `width ${theme('transitionDuration.base')} ${theme('transitionTimingFunction.standard')}`,
        },
      });
    },
  ],
};
