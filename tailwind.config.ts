import type { Config } from 'tailwindcss';

const BASE_COLORS = {
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  accent: {
    50: '#EEF9FF',
    100: '#D8F1FF',
    200: '#BAE7FF',
    300: '#8ADAFF',
    400: '#53C4FF',
    500: '#2BA6FF',
    600: '#1488FC',
    700: '#0D6FE8',
    800: '#1259BB',
    900: '#154E93',
    950: '#122F59',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  orange: {
    50: '#FFFAEB',
    100: '#FEEFC7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#792E0D',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
};

function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,
  alpha: {
    white: generateAlphaPalette(BASE_COLORS.white),
    gray: generateAlphaPalette(BASE_COLORS.gray[900]),
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
  },
};

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        ...COLOR_PRIMITIVES,
        bolt: {
          elements: {
            borderColor: 'var(--bolt-elements-borderColor)',
            borderColorActive: 'var(--bolt-elements-borderColorActive)',
            background: {
              depth: {
                1: 'var(--bolt-elements-bg-depth-1)',
                2: 'var(--bolt-elements-bg-depth-2)',
                3: 'var(--bolt-elements-bg-depth-3)',
                4: 'var(--bolt-elements-bg-depth-4)',
              },
            },
            textPrimary: 'var(--bolt-elements-textPrimary)',
            textSecondary: 'var(--bolt-elements-textSecondary)',
            textTertiary: 'var(--bolt-elements-textTertiary)',
            code: {
              background: 'var(--bolt-elements-code-background)',
              text: 'var(--bolt-elements-code-text)',
            },
            button: {
              primary: {
                background: 'var(--bolt-elements-button-primary-background)',
                backgroundHover: 'var(--bolt-elements-button-primary-backgroundHover)',
                text: 'var(--bolt-elements-button-primary-text)',
              },
              secondary: {
                background: 'var(--bolt-elements-button-secondary-background)',
                backgroundHover: 'var(--bolt-elements-button-secondary-backgroundHover)',
                text: 'var(--bolt-elements-button-secondary-text)',
              },
              danger: {
                background: 'var(--bolt-elements-button-danger-background)',
                backgroundHover: 'var(--bolt-elements-button-danger-backgroundHover)',
                text: 'var(--bolt-elements-button-danger-text)',
              },
            },
            item: {
              contentDefault: 'var(--bolt-elements-item-contentDefault)',
              contentActive: 'var(--bolt-elements-item-contentActive)',
              contentAccent: 'var(--bolt-elements-item-contentAccent)',
              contentDanger: 'var(--bolt-elements-item-contentDanger)',
              backgroundDefault: 'var(--bolt-elements-item-backgroundDefault)',
              backgroundActive: 'var(--bolt-elements-item-backgroundActive)',
              backgroundAccent: 'var(--bolt-elements-item-backgroundAccent)',
              backgroundDanger: 'var(--bolt-elements-item-backgroundDanger)',
            },
            actions: {
              background: 'var(--bolt-elements-actions-background)',
              code: {
                background: 'var(--bolt-elements-actions-code-background)',
              },
            },
            artifacts: {
              background: 'var(--bolt-elements-artifacts-background)',
              backgroundHover: 'var(--bolt-elements-artifacts-backgroundHover)',
              borderColor: 'var(--bolt-elements-artifacts-borderColor)',
              inlineCode: {
                background: 'var(--bolt-elements-artifacts-inlineCode-background)',
                text: 'var(--bolt-elements-artifacts-inlineCode-text)',
              },
            },
            messages: {
              background: 'var(--bolt-elements-messages-background)',
              linkColor: 'var(--bolt-elements-messages-linkColor)',
              code: {
                background: 'var(--bolt-elements-messages-code-background)',
              },
              inlineCode: {
                background: 'var(--bolt-elements-messages-inlineCode-background)',
                text: 'var(--bolt-elements-messages-inlineCode-text)',
              },
            },
            icon: {
              success: 'var(--bolt-elements-icon-success)',
              error: 'var(--bolt-elements-icon-error)',
              primary: 'var(--bolt-elements-icon-primary)',
              secondary: 'var(--bolt-elements-icon-secondary)',
              tertiary: 'var(--bolt-elements-icon-tertiary)',
            },
            preview: {
              addressBar: {
                background: 'var(--bolt-elements-preview-addressBar-background)',
                backgroundHover: 'var(--bolt-elements-preview-addressBar-backgroundHover)',
                backgroundActive: 'var(--bolt-elements-preview-addressBar-backgroundActive)',
                text: 'var(--bolt-elements-preview-addressBar-text)',
                textActive: 'var(--bolt-elements-preview-addressBar-textActive)',
              },
            },
            terminals: {
              background: 'var(--bolt-elements-terminals-background)',
              buttonBackground: 'var(--bolt-elements-terminals-buttonBackground)',
            },
            dividerColor: 'var(--bolt-elements-dividerColor)',
            loader: {
              background: 'var(--bolt-elements-loader-background)',
              progress: 'var(--bolt-elements-loader-progress)',
            },
            prompt: {
              background: 'var(--bolt-elements-prompt-background)',
            },
            sidebar: {
              dropdownShadow: 'var(--bolt-elements-sidebar-dropdownShadow)',
              buttonBackgroundDefault: 'var(--bolt-elements-sidebar-buttonBackgroundDefault)',
              buttonBackgroundHover: 'var(--bolt-elements-sidebar-buttonBackgroundHover)',
              buttonText: 'var(--bolt-elements-sidebar-buttonText)',
            },
            cta: {
              background: 'var(--bolt-elements-cta-background)',
              text: 'var(--bolt-elements-cta-text)',
            },
          },
        },
      },
      maxWidth: {
        chat: 'var(--chat-max-width)',
      },
      transitionTimingFunction: {
        'bolt-ease-cubic-bezier': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        '.transition-theme': {
          transition:
            'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1), color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.transition-smooth': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.transition-bounce': {
          transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        },
        '.kdb': {
          backgroundColor: 'var(--bolt-elements-code-background)',
          color: 'var(--bolt-elements-code-text)',
          paddingTop: '0.25rem',
          paddingBottom: '0.25rem',
          paddingLeft: '0.375rem',
          paddingRight: '0.375rem',
          borderRadius: '0.375rem',
        },
        '.text-balance': {
          textWrap: 'balance',
        },
        '.backdrop-blur-glass': {
          backdropFilter: 'blur(12px) saturate(180%)',
        },
      });
    },
  ],
} satisfies Config;
