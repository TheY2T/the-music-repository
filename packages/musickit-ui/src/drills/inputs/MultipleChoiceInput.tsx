import StaffNotePrompt from '../../StaffNotePrompt';
import OptionGrid from './OptionGrid';
import type { DrillInputProps } from './types';

/** Multiple-choice answer input: a visual prompt (staff / text) plus a locking option grid. */
export default function MultipleChoiceInput({ item, answered, onAnswer }: DrillInputProps) {
  const { presentation } = item;
  return (
    <div className="space-y-6">
      {presentation.kind === 'staff' ? (
        <div className="flex justify-center">
          <StaffNotePrompt step={presentation.step} />
        </div>
      ) : presentation.kind === 'text' ? (
        <p className="text-center text-lg font-medium">{presentation.prompt}</p>
      ) : null}
      <OptionGrid
        options={item.options ?? []}
        expected={item.expected}
        answered={answered}
        onAnswer={onAnswer}
      />
    </div>
  );
}
