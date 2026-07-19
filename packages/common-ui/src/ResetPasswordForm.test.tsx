import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const resetPasswordMock = vi.fn();

vi.mock('@TheY2T/tmr-web-acl/auth-client', () => ({
  resetPassword: (...args: unknown[]) => resetPasswordMock(...args),
}));

import ResetPasswordForm from './ResetPasswordForm';

describe('ResetPasswordForm island', () => {
  beforeEach(() => {
    resetPasswordMock.mockReset();
    resetPasswordMock.mockResolvedValue({ data: null, error: null });
  });

  it('shows an invalid-link message when no token is present', () => {
    render(<ResetPasswordForm locale="en" />);
    expect(
      screen.getByText('This reset link is invalid or has expired. Request a new one.'),
    ).toBeTruthy();
    expect(screen.queryByText('Reset password')).toBeNull();
  });

  it('blocks submission when the two passwords differ', () => {
    render(<ResetPasswordForm locale="en" token="tok-1" />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByText('Reset password'));
    expect(screen.getByText("The passwords don't match.")).toBeTruthy();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('submits the new password with the token from the link', async () => {
    render(<ResetPasswordForm locale="en" token="tok-1" />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByText('Reset password'));
    await waitFor(() => expect(resetPasswordMock).toHaveBeenCalledTimes(1));
    expect(resetPasswordMock.mock.calls[0][0]).toMatchObject({
      newPassword: 'password123',
      token: 'tok-1',
    });
  });

  it('shows an error when the reset is rejected', async () => {
    resetPasswordMock.mockResolvedValue({ data: null, error: { message: 'expired' } });
    render(<ResetPasswordForm locale="en" token="tok-1" />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByText('Reset password'));
    await waitFor(() => expect(screen.getByText('expired')).toBeTruthy());
  });
});
