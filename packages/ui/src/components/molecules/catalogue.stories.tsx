import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { ActiveFilters } from './active-filters';
import { CoverArt, type CoverArtMotif } from './cover-art';
import { type FacetGroup, FacetPanel } from './facet-panel';
import { FeaturedShelf } from './featured-shelf';
import { Hero } from './hero';
import { MediaCard } from './media-card';
import { StatTile } from './stat-tile';

const meta: Meta = {
  title: 'Molecules/Catalogue',
};
export default meta;

type Story = StoryObj;

const COVERS: { seed: string; title: string; subtitle: string; motif: CoverArtMotif }[] = [
  { seed: 'bwv-846', title: 'Prelude in C major, BWV 846', subtitle: 'J. S. Bach', motif: 'staff' },
  { seed: 'moonlight-sonata', title: 'Moonlight Sonata', subtitle: 'Beethoven', motif: 'keys' },
  { seed: 'asturias-leyenda', title: 'Asturias (Leyenda)', subtitle: 'Albéniz', motif: 'strings' },
  { seed: 'clair-de-lune', title: 'Clair de Lune', subtitle: 'Debussy', motif: 'record' },
  { seed: 'gymnopedie-1', title: 'Gymnopédie No. 1', subtitle: 'Satie', motif: 'auto' },
  { seed: 'canon-in-d', title: 'Canon in D', subtitle: 'Pachelbel', motif: 'auto' },
];

export const Covers: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {COVERS.map((c) => (
        <CoverArt
          key={c.seed}
          title={c.title}
          subtitle={c.subtitle}
          seed={c.seed}
          motif={c.motif}
        />
      ))}
    </div>
  ),
};

export const Media: Story = {
  render: () => (
    <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MediaCard
        title="Prelude in C major, BWV 846"
        href="#bwv-846"
        summary="The gentle arpeggiated opening of The Well-Tempered Clavier — a staple first Baroque study."
        typeLabel="Sheet music"
        difficultyLabel="Intermediate"
        tags={['Baroque', 'Piano', 'Public domain']}
      />
      <MediaCard
        title="Asturias (Leyenda)"
        href="#asturias"
        summary="Albéniz's fiery Spanish showpiece, endlessly transcribed for classical guitar."
        typeLabel="Sheet music"
        difficultyLabel="Advanced"
        tags={['Romantic', 'Guitar']}
        badgeSlot={
          <Badge variant="warning">
            <Icon name="lock" className="size-3" /> Premium
          </Badge>
        }
        actionSlot={
          <Button variant="ghost" size="icon" className="size-8" aria-label="Save to favorites">
            <Icon name="heart" className="size-4" />
          </Button>
        }
      />
      <MediaCard
        title="Gymnopédie No. 1"
        href="#gymnopedie"
        summary="Satie's wistful, slow waltz — deceptively simple and a favorite of beginners."
        typeLabel="Lesson"
        difficultyLabel="Beginner"
        tags={['Impressionist', 'Piano']}
      />
    </div>
  ),
};

const INITIAL_GROUPS: FacetGroup[] = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'sheet', label: 'Sheet music', count: 128, selected: true },
      { value: 'lesson', label: 'Lesson', count: 42, selected: false },
      { value: 'recording', label: 'Recording', count: 17, selected: false },
    ],
  },
  {
    key: 'genre',
    label: 'Genre',
    options: [
      { value: 'baroque', label: 'Baroque', count: 34, selected: true },
      { value: 'classical', label: 'Classical', count: 51, selected: false },
      { value: 'romantic', label: 'Romantic', count: 46, selected: false },
      { value: 'impressionist', label: 'Impressionist', count: 12, selected: false },
    ],
  },
  {
    key: 'instrument',
    label: 'Instrument',
    options: [
      { value: 'piano', label: 'Piano', count: 96, selected: false },
      { value: 'guitar', label: 'Guitar', count: 71, selected: false },
    ],
  },
  {
    key: 'topic',
    label: 'Topic',
    options: [
      { value: 'sight-reading', label: 'Sight-reading', count: 23, selected: false },
      { value: 'technique', label: 'Technique', count: 38, selected: false },
      { value: 'theory', label: 'Theory', count: 19, selected: false },
    ],
  },
];

export const Facets: Story = {
  render: () => {
    const [groups, setGroups] = useState(INITIAL_GROUPS);
    const toggle = (groupKey: string, value: string) =>
      setGroups((prev) =>
        prev.map((g) =>
          g.key === groupKey
            ? {
                ...g,
                options: g.options.map((o) =>
                  o.value === value ? { ...o, selected: !o.selected } : o,
                ),
              }
            : g,
        ),
      );
    return (
      <div className="max-w-xs">
        <FacetPanel groups={groups} onToggle={toggle} />
      </div>
    );
  },
};

export const Applied: Story = {
  render: () => {
    const [filters, setFilters] = useState(['Baroque', 'Piano', 'Public domain']);
    return (
      <ActiveFilters
        filters={filters.map((label) => ({
          key: label,
          label,
          removeLabel: `Remove ${label}`,
          onRemove: () => setFilters((prev) => prev.filter((f) => f !== label)),
        }))}
        onClear={() => setFilters([])}
        clearLabel="Clear all"
      />
    );
  },
};

export const Landing: Story = {
  render: () => (
    <Hero
      eyebrow="The Music Repository"
      title="A vintage catalogue of piano & guitar"
      subtitle="Browse public-domain sheet music, lessons, and recordings — thoughtfully catalogued and free to explore."
      actions={
        <>
          <Button>
            Browse catalogue <Icon name="arrow-right" className="size-4" />
          </Button>
          <Button variant="outline">Start a lesson</Button>
        </>
      }
      media={
        <CoverArt
          title="Featured pick"
          subtitle="Updated weekly"
          seed="hero-feature"
          motif="record"
        />
      }
    />
  ),
};

export const Shelf: Story = {
  render: () => (
    <FeaturedShelf
      title="Featured this week"
      action={
        <Button variant="link" size="sm">
          View all <Icon name="chevron-right" className="size-4" />
        </Button>
      }
    >
      {COVERS.map((c) => (
        <MediaCard
          key={c.seed}
          title={c.title}
          href={`#${c.seed}`}
          typeLabel="Sheet music"
          difficultyLabel="Intermediate"
          seed={c.seed}
        />
      ))}
    </FeaturedShelf>
  ),
};

export const Tiles: Story = {
  render: () => (
    <div className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
      <StatTile iconName="library" label="Catalogued" value="1,284" hint="pieces" />
      <StatTile iconName="flame" label="Streak" value="12" hint="days" />
      <StatTile iconName="headphones" label="Practice" value="340" hint="minutes" />
    </div>
  ),
};
