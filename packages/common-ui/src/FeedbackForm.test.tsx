import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const submitFeedbackMock = vi.fn();

vi.mock('@TheY2T/tmr-web-acl/feedback-api', () => ({
  submitFeedback: (...args: unknown[]) => submitFeedbackMock(...args),
}));

import FeedbackForm from './FeedbackForm';

describe('FeedbackForm island', () => {
  beforeEach(() => {
    submitFeedbackMock.mockReset();
    submitFeedbackMock.mockResolvedValue({ id: 'f1' });
  });

  it('prompts anonymous visitors to sign in instead of showing the form', () => {
    render(<FeedbackForm locale="en" signedIn={false} />);
    expect(screen.getByText('Please sign in to send feedback.')).toBeTruthy();
    expect(screen.queryByText('Send feedback')).toBeNull();
  });

  it('offers the bug type only when bug reports are enabled', () => {
    const { rerender } = render(<FeedbackForm locale="en" signedIn bugsEnabled={false} />);
    expect(screen.queryByText('Bug report')).toBeNull();
    rerender(<FeedbackForm locale="en" signedIn bugsEnabled />);
    expect(screen.getByText('Bug report')).toBeTruthy();
  });

  it('blocks submission with an empty message', () => {
    render(<FeedbackForm locale="en" signedIn />);
    fireEvent.click(screen.getByText('Send feedback'));
    expect(screen.getByText('Please enter your feedback.')).toBeTruthy();
    expect(submitFeedbackMock).not.toHaveBeenCalled();
  });

  it('submits the feedback and shows a success message', async () => {
    render(<FeedbackForm locale="en" signedIn />);
    fireEvent.change(screen.getByPlaceholderText("Tell me what's on your mind…"), {
      target: { value: 'Add a metronome' },
    });
    fireEvent.click(screen.getByText('Send feedback'));
    await waitFor(() => expect(submitFeedbackMock).toHaveBeenCalledTimes(1));
    expect(submitFeedbackMock.mock.calls[0][0]).toMatchObject({
      type: 'idea',
      message: 'Add a metronome',
    });
    await waitFor(() =>
      expect(screen.getByText('Thanks — your feedback has been sent.')).toBeTruthy(),
    );
  });
});
