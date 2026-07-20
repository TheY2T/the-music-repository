import type { ReactNode } from 'react';
import { useFullscreen } from '../../hooks/use-fullscreen';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export interface ToolStageProps {
  /** Already-localized label for the "enter fullscreen" control (i18n-by-prop). */
  enterLabel: string;
  /** Already-localized label for the "exit fullscreen" control. */
  exitLabel: string;
  /** Hide the fullscreen control (e.g. when the customization flag is off). */
  showFullscreen?: boolean;
  /** Extra controls rendered in the toolbar to the left of the fullscreen button. */
  toolbar?: ReactNode;
  className?: string;
  /** Renders the tool body; receives the live fullscreen state so it can grow the canvas. */
  children: (state: { isFullscreen: boolean }) => ReactNode;
}

/**
 * Wraps an interactive tool with a native-fullscreen affordance and an optional toolbar. In fullscreen
 * the stage fills the viewport with an opaque background; the render-prop hands the tool body the
 * `isFullscreen` flag so a fixed-height canvas can switch to a fill layout.
 */
export function ToolStage({
  enterLabel,
  exitLabel,
  showFullscreen = true,
  toolbar,
  className,
  children,
}: ToolStageProps) {
  const { ref, isFullscreen, supported, toggle } = useFullscreen();
  const fullscreenButton = showFullscreen && supported;
  return (
    <div
      ref={ref}
      data-fullscreen={isFullscreen ? '' : undefined}
      className={cn(
        'relative flex flex-col gap-3',
        isFullscreen && 'h-screen w-screen overflow-auto bg-background p-4',
        className,
      )}
    >
      {(toolbar || fullscreenButton) && (
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {fullscreenButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggle}
              className={cn('gap-1.5', toolbar && 'ml-auto')}
            >
              <Icon name={isFullscreen ? 'minimize' : 'maximize'} className="size-4" />
              {isFullscreen ? exitLabel : enterLabel}
            </Button>
          )}
        </div>
      )}
      {/* In fullscreen the body grows to fill the remaining height; windowed layout is untouched. */}
      <div className={isFullscreen ? 'flex min-h-0 flex-1 flex-col' : 'contents'}>
        {children({ isFullscreen })}
      </div>
    </div>
  );
}
