import type { Meta, StoryObj } from '@storybook/react-vite';
import { Music } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { CardGrid } from './card-grid';
import { Chip } from './chip';
import { EmptyState } from './empty-state';
import { Field } from './field';
import { FormActions } from './form-actions';
import { PageHeader } from './page-header';
import { SearchField } from './search-field';
import { SegmentedToggle } from './segmented-toggle';
import { StatCard } from './stat-card';

const meta: Meta = {
  title: 'Molecules',
};
export default meta;

type Story = StoryObj;

export const Fields: Story = {
  render: () => (
    <form className="flex max-w-sm flex-col gap-4">
      <Field label="Title" htmlFor="t" required>
        <Input id="t" placeholder="Prelude in C" />
      </Field>
      <Field label="Slug" htmlFor="s" description="Lowercase, hyphenated." error="Already taken">
        <Input id="s" defaultValue="prelude-in-c" />
      </Field>
      <FormActions>
        <Button variant="ghost">Cancel</Button>
        <Button>Save</Button>
      </FormActions>
    </form>
  ),
};

export const Search: Story = {
  render: () => {
    const [q, setQ] = useState('bach');
    return (
      <div className="max-w-sm">
        <SearchField
          placeholder="Search catalogue…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ('')}
        />
      </div>
    );
  },
};

export const Chips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip>Baroque</Chip>
      <Chip variant="muted">Etude</Chip>
      <Chip active interactive>
        Selected
      </Chip>
    </div>
  ),
};

export const Segmented: Story = {
  render: () => {
    const [v, setV] = useState<'en' | 'zh'>('en');
    return (
      <SegmentedToggle
        aria-label="Language"
        value={v}
        onValueChange={setV}
        options={[
          { value: 'en', label: 'EN' },
          { value: 'zh', label: '中文' },
        ]}
      />
    );
  },
};

export const Stats: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <StatCard label="Streak" value="12" hint="days" />
      <StatCard label="Practice" value="340" hint="minutes" />
      <StatCard label="Completed" value="27" />
    </div>
  ),
};

export const Grid: Story = {
  render: () => (
    <CardGrid>
      {['Prelude', 'Fugue', 'Sonata', 'Etude'].map((t) => (
        <li key={t}>
          <Card className="p-4">{t}</Card>
        </li>
      ))}
    </CardGrid>
  ),
};

export const Empty: Story = {
  render: () => (
    <EmptyState
      icon={<Music className="h-6 w-6" />}
      title="No favorites yet"
      description="Heart a piece to save it here."
      action={<Button size="sm">Browse catalogue</Button>}
    />
  ),
};

export const Header: Story = {
  render: () => (
    <PageHeader
      back={{ href: '#', label: 'Tools' }}
      title="Chord analyzer"
      subtitle="Analyze and reharmonize a progression."
      actions={<Button size="sm">Save</Button>}
    />
  ),
};
