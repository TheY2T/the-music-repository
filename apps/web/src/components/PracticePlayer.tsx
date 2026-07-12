import { useEffect, useRef, useState } from 'react';

/** Set pitch-preservation across browsers (standard + vendor-prefixed). */
function setPreservesPitch(audio: HTMLAudioElement, value: boolean) {
  const a = audio as HTMLAudioElement & {
    preservesPitch?: boolean;
    mozPreservesPitch?: boolean;
    webkitPreservesPitch?: boolean;
  };
  a.preservesPitch = value;
  a.mozPreservesPitch = value;
  a.webkitPreservesPitch = value;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return '0:00';
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PracticePlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [src, setSrc] = useState('');
  const [fileName, setFileName] = useState('');
  const [rate, setRate] = useState(1);
  const [preserve, setPreserve] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);

  // Apply rate + pitch preservation whenever they change.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.playbackRate = rate;
    setPreservesPitch(audio, preserve);
  }, [rate, preserve, src]);

  // A–B loop: jump back to A when playback passes B.
  function onTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    setTime(audio.currentTime);
    if (loopA !== null && loopB !== null && loopB > loopA && audio.currentTime >= loopB) {
      audio.currentTime = loopA;
    }
  }

  function loadFile(file: File) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setFileName(file.name);
    setLoopA(null);
    setLoopB(null);
    setSrc(url);
  }

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    },
    [],
  );

  return (
    <div className="space-y-5">
      <label className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-medium">
        Load an audio file
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              loadFile(file);
            }
          }}
        />
      </label>
      {fileName ? <span className="ml-3 text-sm text-muted-foreground">{fileName}</span> : null}

      {src ? (
        <>
          {/* biome-ignore lint/a11y/useMediaCaption: user-supplied practice audio has no captions. */}
          <audio
            ref={audioRef}
            src={src}
            controls
            className="w-full"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={onTimeUpdate}
          />

          <div className="flex flex-wrap items-end gap-4">
            <label className="space-y-1 text-sm">
              <span className="block font-medium" data-help="rhythm">
                Speed {rate.toFixed(2)}×
              </span>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-48"
                aria-label="Playback speed"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preserve}
                onChange={(e) => setPreserve(e.target.checked)}
              />
              Preserve pitch
            </label>
            <button
              type="button"
              onClick={() => setRate(1)}
              className="rounded-md border border-border px-3 py-1 text-sm"
            >
              Reset speed
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium">A–B loop:</span>
            <button
              type="button"
              onClick={() => setLoopA(time)}
              className="rounded-md border border-border px-3 py-1"
            >
              Set A {loopA !== null ? `(${formatTime(loopA)})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setLoopB(time)}
              className="rounded-md border border-border px-3 py-1"
            >
              Set B {loopB !== null ? `(${formatTime(loopB)})` : ''}
            </button>
            <button
              type="button"
              onClick={() => {
                setLoopA(null);
                setLoopB(null);
              }}
              className="rounded-md border border-border px-3 py-1"
            >
              Clear
            </button>
            <span className="text-muted-foreground tabular-nums">
              {formatTime(time)} / {formatTime(duration)}
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Load an audio file (a backing track, a song you're learning) to practise with.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Slow a track down without changing its pitch (browser-native time-stretch) and loop a tricky
        section (Set A, then B). Everything runs locally — your file never leaves the browser.
      </p>
    </div>
  );
}
