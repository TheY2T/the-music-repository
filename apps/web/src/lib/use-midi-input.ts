import { useEffect, useRef, useState } from 'react';

export interface MidiState {
  /** The browser exposes the Web MIDI API. */
  supported: boolean;
  /** At least one MIDI input is connected. */
  connected: boolean;
  deviceName: string | null;
}

/**
 * Subscribe to Web MIDI note on/off across all connected inputs. `onNote(midi, isOn, velocity)` fires
 * for each note message. Dependency-free (uses the built-in DOM Web MIDI types); degrades gracefully
 * when the API or a device is absent.
 */
export function useMidiInput(
  onNote: (midi: number, isOn: boolean, velocity: number) => void,
): MidiState {
  // Start `false` so SSR and the first client render agree (no hydration mismatch); the effect
  // promotes it to `true` on the client when the Web MIDI API is actually present.
  const [state, setState] = useState<MidiState>({
    supported: false,
    connected: false,
    deviceName: null,
  });
  const onNoteRef = useRef(onNote);
  useEffect(() => {
    onNoteRef.current = onNote;
  }, [onNote]);

  useEffect(() => {
    if (!('requestMIDIAccess' in navigator)) {
      return;
    }
    setState((prev) => ({ ...prev, supported: true }));
    let access: MIDIAccess | null = null;

    const handleMessage = (event: MIDIMessageEvent) => {
      if (!event.data) {
        return;
      }
      const status = event.data[0];
      const note = event.data[1];
      const velocity = event.data[2];
      const command = status & 0xf0;
      if (command === 0x90 && velocity > 0) {
        onNoteRef.current(note, true, velocity);
      } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        onNoteRef.current(note, false, velocity);
      }
    };

    const wire = (a: MIDIAccess) => {
      const inputs = [...a.inputs.values()];
      for (const input of inputs) {
        input.onmidimessage = handleMessage;
      }
      setState({
        supported: true,
        connected: inputs.length > 0,
        deviceName: inputs[0]?.name ?? null,
      });
    };

    navigator
      .requestMIDIAccess()
      .then((a) => {
        access = a;
        wire(a);
        a.onstatechange = () => wire(a);
      })
      .catch(() => {
        // Permission denied / unavailable — stay in the "no device" state.
      });

    return () => {
      if (access) {
        for (const input of access.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  }, []);

  return state;
}
