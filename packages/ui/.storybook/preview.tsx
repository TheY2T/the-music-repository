import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/styles/globals.css';

// A global toolbar toggle to preview every component in light + dark, matching the app's
// `.dark`-class strategy (set on <html> pre-paint in production).
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
  return (
    <div className="bg-background text-foreground min-h-svh p-8">
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Light / dark theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
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
