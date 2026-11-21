import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: 'var(--color-void)',
        crypt: 'var(--color-crypt)',
        shadow: 'var(--color-shadow)',
        ecto: 'var(--color-ecto)',
        specter: 'var(--color-specter)',
        crimson: 'var(--color-crimson)',
        'specter-text': 'var(--color-specter-text)',
        'crimson-text': 'var(--color-crimson-text)',
        bone: 'var(--color-bone)',
        ash: 'var(--color-ash)',
      },
      boxShadow: {
        ecto: 'var(--glow-ecto)',
        specter: 'var(--glow-specter)',
        crimson: 'var(--glow-crimson)',
      },
    },
  },
  plugins: [],
};
export default config;