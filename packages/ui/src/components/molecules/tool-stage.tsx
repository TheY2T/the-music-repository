import { type ReactNode, useState } from 'react';
import { useFullscreen } from '../../hooks/use-fullscreen';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export interface ToolStageProps {
  /** Already-localized label for the "enter fullscreen" control (i18n-by-prop). */
  enterLabel: string;
  /** Already-localized label for the "exit fullscreen" control. */
  exitLabel: string;
  /** Already-localized label for the "enter cinema mode" control. */
  cinemaEnterLabel?: string;
  /** Already-localized label for the "exit cinema mode" control. */
  cinemaExitLabel?: string;
  /** Hide the fullscreen control (e.g. when the customization flag is off). */
  showFullscreen?: boolean;
  /** Show the cinema-mode (theater) control. */
  showCinema?: boolean;
  /** Extra controls rendered in the toolbar to the left of the mode buttons. */
  toolbar?: ReactNode;
  className?: string;
  /** Renders the tool body; receives the live fullscreen + cinema state so it can grow the canvas. */
  children: (state: { isFullscreen: boolean; isCinema: boolean }) => ReactNode;
}

/**
 * Wraps an interactive tool with view-mode affordances and an optional toolbar:
 * - **Fullscreen** (native Fullscreen API) fills the whole screen.
 * - **Cinema mode** widens the tool to the browser width in-page (like a video player's theater mode)
 *   and enlarges it, without leaving the page.
 * The render-prop hands the tool body the live `isFullscreen`/`isCinema` flags so it can size its canvas.
 */
export function ToolStage({
  enterLabel,
  exitLabel,
  cinemaEnterLabel,
  cinemaExitLabel,
  showFullscreen = true,
  showCinema = false,
  toolbar,
  className,
  children,
}: ToolStageProps) {
  const { ref, isFullscreen, supported, toggle } = useFullscreen();
  const [cinema, setCinema] = useState(false);
  const fullscreenButton = showFullscreen && supported;
  // Cinema only applies while windowed; fullscreen takes over completely.
  const isCinema = cinema && !isFullscreen;

  return (
    <div
      ref={ref}
      data-fullscreen={isFullscreen ? '' : undefined}
      className={cn(
        'relative flex flex-col gap-3',
        isFullscreen && 'h-screen w-screen overflow-auto bg-background p-4',
        // Full-bleed to the browser width in-page (relies on a horizontally-centered parent).
        isCinema && 'ml-[calc(50%-50vw)] w-screen bg-background px-4 py-3',
        className,
      )}
    >
      {(toolbar || fullscreenButton || showCinema) && (
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {showCinema && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCinema((c) => !c)}
              className={cn(
                'gap-1.5',
                toolbar && !fullscreenButton && 'ml-auto',
                !toolbar && 'ml-auto',
              )}
            >
              <Icon name="cinema" className="size-4" />
              {isCinema ? (cinemaExitLabel ?? exitLabel) : (cinemaEnterLabel ?? enterLabel)}
            </Button>
          )}
          {fullscreenButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggle}
              className={cn('gap-1.5', toolbar && !showCinema && 'ml-auto')}
            >
              <Icon name={isFullscreen ? 'minimize' : 'maximize'} className="size-4" />
              {isFullscreen ? exitLabel : enterLabel}
            </Button>
          )}
        </div>
      )}
      {/* In fullscreen the body grows to fill the remaining height; windowed/cinema layout is untouched. */}
      <div className={isFullscreen ? 'flex min-h-0 flex-1 flex-col' : 'contents'}>
        {children({ isFullscreen, isCinema })}
      </div>
    </div>
  );
}
