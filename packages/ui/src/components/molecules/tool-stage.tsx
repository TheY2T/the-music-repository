import { type ReactNode, useState } from 'react';
import { useFullscreen } from '../../hooks/use-fullscreen';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export interface ToolStageProps {
  /** Already-localized label for the "enter fullscreen" control (i18n-by-prop; shown as a tooltip). */
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
  /** Extra controls rendered in the top toolbar (skin / handedness pickers). */
  toolbar?: ReactNode;
  className?: string;
  /**
   * Renders the tool body. Receives the live fullscreen + cinema flags (to size the canvas) plus the
   * `modeButtons` node (icon-only cinema/fullscreen controls) so the body can place them where it wants
   * — typically bottom-right, just above the caption.
   */
  children: (state: {
    isFullscreen: boolean;
    isCinema: boolean;
    modeButtons: ReactNode;
  }) => ReactNode;
}

/**
 * Wraps an interactive tool with view-mode affordances and an optional top toolbar:
 * - **Fullscreen** (native Fullscreen API) fills the whole screen.
 * - **Cinema mode** widens the tool to the browser width in-page (like a video player's theater mode)
 *   and enlarges it, without leaving the page.
 * The mode buttons are icon-only (labels on hover) and sit at the bottom-right of the view, mirroring a
 * video player. The render-prop hands the tool body the live `isFullscreen`/`isCinema` flags.
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
  const cinemaLabel = isCinema ? (cinemaExitLabel ?? exitLabel) : (cinemaEnterLabel ?? enterLabel);
  const fullscreenLabel = isFullscreen ? exitLabel : enterLabel;

  // Cinema is a windowed-only mode; fullscreen already takes over, so hide it there.
  const cinemaButton = showCinema && !isFullscreen;
  // Icon-only mode controls (labels on hover), for the body to attach to its player frame bottom-right.
  const modeButtons =
    cinemaButton || fullscreenButton ? (
      <div className="flex items-center justify-end gap-1">
        {cinemaButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCinema((c) => !c)}
            title={cinemaLabel}
            aria-label={cinemaLabel}
          >
            <Icon name="cinema" className="size-4" />
          </Button>
        )}
        {fullscreenButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggle}
            title={fullscreenLabel}
            aria-label={fullscreenLabel}
          >
            <Icon name={isFullscreen ? 'minimize' : 'maximize'} className="size-4" />
          </Button>
        )}
      </div>
    ) : null;

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
      {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}

      {/* In fullscreen the body grows to fill the remaining height; windowed/cinema layout is untouched. */}
      <div className={isFullscreen ? 'flex min-h-0 flex-1 flex-col' : 'contents'}>
        {children({ isFullscreen, isCinema, modeButtons })}
      </div>
    </div>
  );
}
