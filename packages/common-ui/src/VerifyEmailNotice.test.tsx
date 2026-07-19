import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendVerificationEmailMock = vi.fn();

vi.mock('@TheY2T/tmr-web-acl/auth-client', () => ({
  sendVerificationEmail: (...args: unknown[]) => sendVerificationEmailMock(...args),
}));

import VerifyEmailNotice from './VerifyEmailNotice';

describe('VerifyEmailNotice island', () => {
  beforeEach(() => {
    sendVerificationEmailMock.mockReset();
    sendVerificationEmailMock.mockResolvedValue({ data: null, error: null });
  });

  it('resends a verification email for the entered address', async () => {
    render(<VerifyEmailNotice locale="en" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Resend verification email'));
    await waitFor(() => expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1));
    expect(sendVerificationEmailMock.mock.calls[0][0]).toMatchObject({
      email: 'user@example.com',
      callbackURL: '/',
    });
    await waitFor(() =>
      expect(
        screen.getByText('If your email needs verifying, a new link is on its way.'),
      ).toBeTruthy(),
    );
  });
});
