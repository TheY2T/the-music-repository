import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const submitContactMock = vi.fn();

vi.mock('@TheY2T/tmr-web-acl/contact-api', () => ({
  submitContact: (...args: unknown[]) => submitContactMock(...args),
}));

import ContactForm from './ContactForm';

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } });
}

describe('ContactForm island', () => {
  beforeEach(() => {
    submitContactMock.mockReset();
    submitContactMock.mockResolvedValue({ ok: true });
  });

  it('blocks submission until every required field is filled', () => {
    render(<ContactForm locale="en" />);
    fireEvent.click(screen.getByText('Send message'));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(submitContactMock).not.toHaveBeenCalled();
  });

  it('submits the message and shows a success note', async () => {
    render(<ContactForm locale="en" />);
    fill('Your name', 'Ada');
    fill('Your email', 'ada@example.com');
    fill('Subject', 'Hello');
    fill('Message', 'Lovely site');
    fireEvent.click(screen.getByText('Send message'));
    await waitFor(() => expect(submitContactMock).toHaveBeenCalledTimes(1));
    expect(submitContactMock.mock.calls[0]?.[0]).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Hello',
      message: 'Lovely site',
    });
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
