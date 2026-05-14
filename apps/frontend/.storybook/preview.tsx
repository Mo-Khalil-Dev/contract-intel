import type { Preview } from '@storybook/react-vite';

// Global app styles — DM Sans / DM Mono fonts, design tokens, Tailwind.
// Without this, stories render in browser-default Times New Roman with
// no design tokens loaded.
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#fafaf9' },
        { name: 'white', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
};

export default preview;