import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestPasswordResetMock = vi.fn();

vi.mock('@TheY2T/tmr-web-acl/auth-client', () => ({
  requestPasswordReset: (...args: unknown[]) => requestPasswordResetMock(...args),
}));

import ForgotPasswordForm from './ForgotPasswordForm';

describe('ForgotPasswordForm island', () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset();
    requestPasswordResetMock.mockResolvedValue({ data: null, error: null });
  });

  it('requests a reset with the entered email and a reset-password redirect', async () => {
    render(<ForgotPasswordForm locale="en" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Send reset link'));
    await waitFor(() => expect(requestPasswordResetMock).toHaveBeenCalledTimes(1));
    expect(requestPasswordResetMock.mock.calls[0][0]).toMatchObject({
      email: 'user@example.com',
      redirectTo: `${window.location.origin}/reset-password`,
    });
  });

  it('shows a neutral confirmation that never reveals whether the account exists', async () => {
    render(<ForgotPasswordForm locale="en" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Send reset link'));
    await waitFor(() =>
      expect(
        screen.getByText('If an account exists for that email, a reset link is on its way.'),
      ).toBeTruthy(),
    );
  });

  it('surfaces a generic error when the request fails', async () => {
    requestPasswordResetMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    render(<ForgotPasswordForm locale="en" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Send reset link'));
    await waitFor(() =>
      expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy(),
    );
  });
});
