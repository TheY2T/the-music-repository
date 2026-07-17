import type { Meta, StoryObj } from '@storybook/react-vite';
import RecentlyViewedStrip from './RecentlyViewedStrip';

// Real catalogue slugs from the seed content so the chips read meaningfully.
const ITEMS = [
  { slug: '12-bar-blues-in-a', title: '12-Bar Blues in A', href: '#' },
  { slug: 'bach-minuet-in-g', title: 'Bach — Minuet in G', href: '#' },
  { slug: 'amazing-grace-trad', title: 'Amazing Grace', href: '#' },
  { slug: 'aloha-oe-ukulele', title: 'Aloha ʻOe (ukulele)', href: '#' },
];

const meta: Meta = { title: 'MusicKit UI/RecentlyViewedStrip' };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <RecentlyViewedStrip
      title="Recently viewed"
      clearLabel="Clear"
      items={ITEMS}
      onClear={() => {}}
    />
  ),
};
