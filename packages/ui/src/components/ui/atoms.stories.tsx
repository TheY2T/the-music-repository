import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Checkbox } from './checkbox';
import { Icon, type IconName } from './icon';
import { Input } from './input';
import { Label } from './label';
import { Progress } from './progress';
import { Select } from './select';
import { Separator } from './separator';
import { Textarea } from './textarea';

const meta: Meta = {
  title: 'Atoms',
};
export default meta;

type Story = StoryObj;

export const Buttons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Locked</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

export const Cards: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>A surface panel built from tokens.</CardDescription>
      </CardHeader>
      <CardContent>Body content sits here.</CardContent>
    </Card>
  ),
};

export const FormControls: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" placeholder="A few words…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instrument">Instrument</Label>
        <Select id="instrument">
          <option>Piano</option>
          <option>Guitar</option>
        </Select>
      </div>
      <label htmlFor="subscribe" className="flex items-center gap-2 text-sm">
        <Checkbox id="subscribe" defaultChecked /> Subscribe
      </label>
    </div>
  ),
};

const ICON_NAMES: IconName[] = [
  'arrow-left',
  'arrow-right',
  'check',
  'flame',
  'heart',
  'lock',
  'music',
  'party-popper',
  'piano',
  'play',
  'refresh',
  'search',
  'square',
  'x',
];

export const Icons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {ICON_NAMES.map((name) => (
          <div key={name} className="flex w-20 flex-col items-center gap-1 text-muted-foreground">
            <Icon name={name} className="size-6 text-foreground" />
            <span className="text-xs">{name}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <Icon name="heart" className="size-4" />
        <Icon name="heart" className="size-6 fill-current text-red-500" />
        <Icon name="lock" className="size-8 text-warning" />
        {/* Meaningful icon: labelled for assistive tech */}
        <button type="button" className="rounded p-1 text-muted-foreground hover:text-foreground">
          <Icon name="x" label="Close" className="size-4" />
        </button>
      </div>
    </div>
  ),
};

export const Feedback: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <Progress value={62} />
      <Separator />
      <p className="text-sm text-muted-foreground">Separator above.</p>
    </div>
  ),
};
