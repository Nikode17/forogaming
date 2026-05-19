import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ────────────────────────────────────────────────────────────
        // Tokens semánticos del sistema de paletas.
        // Consumen las variables CSS definidas en globals.css.
        // Ver PALETAS_SPEC.md para catálogo y arquitectura.
        // ────────────────────────────────────────────────────────────
        'bg-base':        'rgb(var(--color-bg-base) / <alpha-value>)',
        'bg-elevated':    'rgb(var(--color-bg-elevated) / <alpha-value>)',
        'bg-overlay':     'rgb(var(--color-bg-overlay) / <alpha-value>)',

        'border-default': 'rgb(var(--color-border-default) / <alpha-value>)',
        'border-strong':  'rgb(var(--color-border-strong) / <alpha-value>)',

        'text-primary':   'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-muted':     'rgb(var(--color-text-muted) / <alpha-value>)',

        'accent':         'rgb(var(--color-accent-default) / <alpha-value>)',
        'accent-hover':   'rgb(var(--color-accent-hover) / <alpha-value>)',
        'accent-fg':      'rgb(var(--color-accent-fg) / <alpha-value>)',

        'success':        'rgb(var(--color-success) / <alpha-value>)',
        'warning':        'rgb(var(--color-warning) / <alpha-value>)',
        'danger':         'rgb(var(--color-danger) / <alpha-value>)',

        // ────────────────────────────────────────────────────────────
        // Overrides parciales de Tailwind defaults (Opción C híbrida).
        // Solo se mapean los valores estructurales más usados para que
        // las clases gray-* e indigo-* hardcoded en componentes ya
        // existentes se theme-icen automáticamente con la paleta activa.
        // El resto de la escala (gray-50, gray-200, gray-500, gray-600,
        // otros indigo) mantiene defaults de Tailwind y queda disponible
        // para uso contextual intencional (badges, hovers específicos).
        // ────────────────────────────────────────────────────────────
        gray: {
          100: 'rgb(var(--color-text-primary) / <alpha-value>)',
          300: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          400: 'rgb(var(--color-text-muted) / <alpha-value>)',
          700: 'rgb(var(--color-border-strong) / <alpha-value>)',
          800: 'rgb(var(--color-bg-overlay) / <alpha-value>)',
          900: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
          950: 'rgb(var(--color-bg-base) / <alpha-value>)',
        },

        indigo: {
          500: 'rgb(var(--color-accent-hover) / <alpha-value>)',
          600: 'rgb(var(--color-accent-default) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}

export default config
