import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gallery } from './gallery';
import { sampleProps } from './sample-props';

// Every component in @TheY2T/tmr-common-ui (shell chrome + account/admin/billing/auth), rendered in an
// error-bounded grid with a broad bag of dummy props. Fetch-driven islands pull dummy data from MSW.
const modules = import.meta.glob('../../common-ui/src/**/*.tsx');

const meta: Meta = { title: 'Common UI/Gallery (all components)' };
export default meta;

export const AllComponents: StoryObj = {
  render: () => <Gallery modules={modules} props={sampleProps} />,
};
