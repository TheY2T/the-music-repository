import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signUpEmailMock = vi.fn();
const signInSocialMock = vi.fn();
const signInOauth2Mock = vi.fn();

vi.mock('@TheY2T/tmr-web-acl/auth-client', () => ({
  authClient: {
    signUp: { email: (...args: unknown[]) => signUpEmailMock(...args) },
    signIn: {
      social: (...args: unknown[]) => signInSocialMock(...args),
      oauth2: (...args: unknown[]) => signInOauth2Mock(...args),
    },
  },
}));

import SignUpForm from './SignUpForm';

function fillForm() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
}

describe('SignUpForm island', () => {
  beforeEach(() => {
    signUpEmailMock.mockReset();
    signUpEmailMock.mockResolvedValue({ data: {}, error: null });
    signInSocialMock.mockReset();
    signInSocialMock.mockResolvedValue({ error: null });
    signInOauth2Mock.mockReset();
    signInOauth2Mock.mockResolvedValue({ error: null });
  });

  it('creates the account and shows a verify-your-email confirmation', async () => {
    render(<SignUpForm locale="en" />);
    fillForm();
    fireEvent.click(screen.getByText('Create account'));
    await waitFor(() => expect(signUpEmailMock).toHaveBeenCalledTimes(1));
    expect(signUpEmailMock.mock.calls[0][0]).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password123',
    });
    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeTruthy());
  });

  it('surfaces the error when sign-up fails', async () => {
    signUpEmailMock.mockResolvedValue({ data: null, error: { message: 'Email already in use' } });
    render(<SignUpForm locale="en" />);
    fillForm();
    fireEvent.click(screen.getByText('Create account'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Email already in use'));
  });

  it('omits the social buttons unless enabled', () => {
    const { rerender } = render(<SignUpForm locale="en" />);
    expect(screen.queryByText('Continue with Google')).toBeNull();
    rerender(<SignUpForm locale="en" showSocial />);
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.getByText('Continue with Facebook')).toBeTruthy();
  });

  it('gates each provider on its own flag', () => {
    const { rerender } = render(<SignUpForm locale="en" showSocial />);
    // auth.social covers Google/Facebook only — the Microsoft buttons stay hidden.
    expect(screen.queryByText('Continue with Microsoft')).toBeNull();
    expect(screen.queryByText('Continue with a work or school account')).toBeNull();

    rerender(<SignUpForm locale="en" showMicrosoft />);
    expect(screen.getByText('Continue with Microsoft')).toBeTruthy();
    expect(screen.queryByText('Continue with Google')).toBeNull();
    expect(screen.queryByText('Continue with a work or school account')).toBeNull();

    rerender(<SignUpForm locale="en" showMicrosoftWork />);
    expect(screen.getByText('Continue with a work or school account')).toBeTruthy();
    expect(screen.queryByText('Continue with Microsoft')).toBeNull();
  });

  it('starts the provider OAuth flow when a social button is clicked', async () => {
    render(<SignUpForm locale="en" showSocial />);
    fireEvent.click(screen.getByText('Continue with Google'));
    await waitFor(() => expect(signInSocialMock).toHaveBeenCalledTimes(1));
    expect(signInSocialMock.mock.calls[0][0]).toMatchObject({ provider: 'google' });
  });

  it('starts the personal Microsoft flow via the social provider', async () => {
    render(<SignUpForm locale="en" showMicrosoft />);
    fireEvent.click(screen.getByText('Continue with Microsoft'));
    await waitFor(() => expect(signInSocialMock).toHaveBeenCalledTimes(1));
    expect(signInSocialMock.mock.calls[0][0]).toMatchObject({ provider: 'microsoft' });
    expect(signInOauth2Mock).not.toHaveBeenCalled();
  });

  it('starts the work/school Microsoft flow via the Entra ID generic-OAuth provider', async () => {
    render(<SignUpForm locale="en" showMicrosoftWork />);
    fireEvent.click(screen.getByText('Continue with a work or school account'));
    await waitFor(() => expect(signInOauth2Mock).toHaveBeenCalledTimes(1));
    expect(signInOauth2Mock.mock.calls[0][0]).toMatchObject({ providerId: 'microsoft-entra-id' });
    expect(signInSocialMock).not.toHaveBeenCalled();
  });

  it('surfaces a message when a social sign-in fails instead of silently resetting', async () => {
    signInSocialMock.mockResolvedValue({ error: { message: 'Provider not found' } });
    render(<SignUpForm locale="en" showSocial />);
    fireEvent.click(screen.getByText('Continue with Google'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Provider not found'));
  });
});
