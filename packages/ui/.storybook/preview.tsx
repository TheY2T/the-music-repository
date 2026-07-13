import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/styles/globals.css';

// Global toolbar toggles to preview every component across the two theme axes used in production
// (ADR 0021): AESTHETIC → `data-theme` on <html>, MODE → the `.dark` class.
const withTheme: Decorator = (Story, context) => {
  const mode = context.globals.theme ?? 'light';
  const aesthetic = context.globals.aesthetic ?? 'hybrid';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', aesthetic);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }
  return (
    <div className="bg-background text-foreground min-h-svh p-8 font-body">
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    aesthetic: {
      description: 'Vintage aesthetic',
      defaultValue: 'hybrid',
      toolbar: {
        title: 'Aesthetic',
        icon: 'paintbrush',
        items: [
          { value: 'hybrid', title: 'Hybrid' },
          { value: 'heritage', title: 'Heritage' },
          { value: 'warm-minimal', title: 'Warm-minimal' },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Light / dark mode',
      defaultValue: 'light',
      toolbar: {
        title: 'Mode',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
