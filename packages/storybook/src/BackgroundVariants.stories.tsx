import AmbientBackground from '@TheY2T/tmr-common-ui/AmbientBackground';
import DashboardBackground from '@TheY2T/tmr-common-ui/DashboardBackground';
import { BACKGROUND_STYLES } from '@TheY2T/tmr-web-acl/dashboard-background';
import type { Meta, StoryObj } from '@storybook/react-vite';

// The personalizable dashboard backdrop (ADR 0022) has a `style` enumeration
// (staff · waves · roll · bokeh, + none). `bokeh` is the ambient-hero scene. Each is shown here in a
// sized box; DashboardBackground fills its parent (h-full w-full).
const meta: Meta = { title: 'Common UI/DashboardBackground' };
export default meta;

const STYLES = BACKGROUND_STYLES.filter((s) => s !== 'none');

function Swatch({ style }: { style: (typeof STYLES)[number] }) {
  return (
    <div className="space-y-2">
      <p className="font-display text-sm text-muted-foreground capitalize">{style}</p>
      <div className="relative h-56 w-full overflow-hidden rounded-lg border border-border bg-card">
        <DashboardBackground style={style} intensity={70} />
      </div>
    </div>
  );
}

export const AllStyles: StoryObj = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-2">
      {STYLES.map((style) => (
        <Swatch key={style} style={style} />
      ))}
    </div>
  ),
};

export const Staff: StoryObj = { render: () => <Swatch style="staff" /> };
export const Waves: StoryObj = { render: () => <Swatch style="waves" /> };
export const Roll: StoryObj = { render: () => <Swatch style="roll" /> };
export const Bokeh: StoryObj = { name: 'Bokeh (ambient)', render: () => <Swatch style="bokeh" /> };

// AmbientBackground is the standalone home-hero drift (also needs a sized, relative parent).
export const Ambient: StoryObj = {
  name: 'AmbientBackground (home hero)',
  render: () => (
    <div className="space-y-2">
      <p className="font-display text-sm text-muted-foreground">AmbientBackground</p>
      <div className="relative h-56 w-full overflow-hidden rounded-lg border border-border bg-card">
        <AmbientBackground />
      </div>
    </div>
  ),
};
