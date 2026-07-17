import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gallery } from './gallery';
import { sampleProps } from './sample-props';

// Every component in @TheY2T/tmr-musickit-ui, rendered in an error-bounded grid with a broad bag of
// dummy props. Fetch-driven islands pull dummy data from MSW; a few bespoke-prop components degrade to
// a graceful note (they have curated per-component stories instead).
const modules = import.meta.glob('../../musickit-ui/src/**/*.tsx');

const meta: Meta = { title: 'MusicKit UI/Gallery (all components)' };
export default meta;

export const AllComponents: StoryObj = {
  render: () => <Gallery modules={modules} props={sampleProps} />,
};
