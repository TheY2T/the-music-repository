import { describe, expect, it, vi } from 'vitest';
import { releaseAudioFocus, requestAudioFocus } from './audio';

// The single-active-audio coordinator: only one source holds focus; taking it stops the previous holder.
describe('audio focus', () => {
  it('stops the previous holder when a new source takes focus', () => {
    const stopA = vi.fn();
    const stopB = vi.fn();
    requestAudioFocus(stopA);
    requestAudioFocus(stopB);
    expect(stopA).toHaveBeenCalledTimes(1);
    expect(stopB).not.toHaveBeenCalled();
    releaseAudioFocus(stopB); // leave focus clear for the next test
  });

  it('does not stop a source that re-requests focus it already holds', () => {
    const stopA = vi.fn();
    requestAudioFocus(stopA);
    requestAudioFocus(stopA);
    expect(stopA).not.toHaveBeenCalled();
    releaseAudioFocus(stopA);
  });

  it('ignores a release from a source that is not the current holder', () => {
    const stopA = vi.fn();
    const stopB = vi.fn();
    requestAudioFocus(stopA);
    releaseAudioFocus(stopB); // B never held focus → no effect
    requestAudioFocus(stopB); // taking focus should still stop A
    expect(stopA).toHaveBeenCalledTimes(1);
    releaseAudioFocus(stopB);
  });
});
