import { Button } from '@TheY2T/tmr-ui';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import WidgetPickerDialog from './WidgetPickerDialog';

// The picker is a controlled modal, so the story owns the open state and a trigger to reopen it.
const meta: Meta = { title: 'Common UI/DashboardSpaces/WidgetPickerDialog' };
export default meta;

export const Default: StoryObj = {
  render: function WidgetPickerDemo() {
    const [open, setOpen] = useState(true);
    const [added, setAdded] = useState<string[]>([]);
    return (
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Add widget
        </Button>
        {added.length > 0 && (
          <p className="text-sm text-muted-foreground">Added: {added.join(', ')}</p>
        )}
        <WidgetPickerDialog
          locale="en"
          open={open}
          onOpenChange={setOpen}
          onAdd={(type) => setAdded((prev) => [...prev, type])}
        />
      </div>
    );
  },
};
