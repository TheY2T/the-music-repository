import { useThemeColors } from '@TheY2T/tmr-music-core/pixi/use-theme-colors';
import { supportsWebGL, usePrefersReducedMotion } from '@TheY2T/tmr-music-core/pixi/use-webgl';
import { Badge, Card } from '@TheY2T/tmr-ui';

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/**
 * The WebGL environment the Pixi tools render into: hardware support, the reduced-motion preference, and
 * the live CSS-token → Pixi colour bridge (`useThemeColors`). Switch the theme in the top bar and the
 * swatches update, mirroring what the Pixi scenes read.
 */
export default function PixiInspector() {
  const colors = useThemeColors();
  const reducedMotion = usePrefersReducedMotion();
  const webgl = supportsWebGL();

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant={webgl ? 'success' : 'destructive'}>
          WebGL {webgl ? 'supported' : 'unavailable'}
        </Badge>
        <Badge variant={reducedMotion ? 'warning' : 'secondary'}>
          reduced-motion {reducedMotion ? 'on' : 'off'}
        </Badge>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Theme colours (live bridge)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(colors).map(([name, value]) => (
            <div key={name} className="flex items-center gap-2 text-xs">
              <span
                className="size-6 shrink-0 rounded border border-border"
                style={{ background: hex(value) }}
              />
              <span className="truncate">
                {name} <span className="font-mono text-muted-foreground">{hex(value)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
