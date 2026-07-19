import { ApiDataProvider } from '@TheY2T/tmr-web-acl/api-data';
import type { Decorator, Preview } from '@storybook/react-vite';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { handlers } from '../src/msw-handlers';
import '../src/storybook.css';

// Mock the API in the browser so fetch-driven islands render dummy data. Unhandled requests bypass
// (a component hitting an unmocked endpoint just shows its own empty/loading state, not an error).
initialize({ onUnhandledRequest: 'bypass' });

// AESTHETIC → `data-theme` on <html>, MODE → the `.dark` class (ADR 0021) — same two axes as prod.
const withTheme: Decorator = (Story, context) => {
  const mode = context.globals.theme ?? 'light';
  const aesthetic = context.globals.aesthetic ?? 'hybrid';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', aesthetic);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }
  // No forced min-height — the wrapper fits its content so small components (a button, a switcher)
  // don't sit in a full-viewport-tall empty canvas. Full-page components size themselves.
  return (
    <div className="bg-background text-foreground p-8 font-body">
      <Story />
    </div>
  );
};

// Smart components (catalogue/collections/dashboards) read data through the web-acl data-access port.
// Provide it so they mount; with no dev API running they show their own loading/empty states.
const withProviders: Decorator = (Story) => (
  <ApiDataProvider>
    <Story />
  </ApiDataProvider>
);

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [withProviders, withTheme],
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
    msw: { handlers },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
