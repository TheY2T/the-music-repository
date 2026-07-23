import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendOtpMock = vi.fn();
const verifyMock = vi.fn();

vi.mock('@TheY2T/tmr-web-acl/auth-client', () => ({
  authClient: {
    phoneNumber: {
      sendOtp: (...args: unknown[]) => sendOtpMock(...args),
      verify: (...args: unknown[]) => verifyMock(...args),
    },
  },
}));

import WhatsAppSignIn from './WhatsAppSignIn';

// The verify step navigates via window.location.href; capture it without a real navigation.
let hrefSpy: string;
const originalLocation = window.location;

beforeEach(() => {
  sendOtpMock.mockReset();
  sendOtpMock.mockResolvedValue({ data: {}, error: null });
  verifyMock.mockReset();
  verifyMock.mockResolvedValue({ data: {}, error: null });
  hrefSpy = '';
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      origin: 'http://localhost:4321',
      get href() {
        return hrefSpy;
      },
      set href(value: string) {
        hrefSpy = value;
      },
    },
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

async function reachCodeStep() {
  fireEvent.click(screen.getByText('Continue with WhatsApp'));
  fireEvent.change(screen.getByLabelText('Phone number'), {
    target: { value: '+61400000000' },
  });
  fireEvent.click(screen.getByText('Send code via WhatsApp'));
  await waitFor(() => expect(screen.getByLabelText('Enter the 6-digit code')).toBeTruthy());
}

describe('WhatsAppSignIn island', () => {
  it('starts collapsed as a single WhatsApp button', () => {
    render(<WhatsAppSignIn locale="en" />);
    expect(screen.getByText('Continue with WhatsApp')).toBeTruthy();
    expect(screen.queryByLabelText('Phone number')).toBeNull();
  });

  it('sends the code to the entered number, then shows the code step', async () => {
    render(<WhatsAppSignIn locale="en" />);
    fireEvent.click(screen.getByText('Continue with WhatsApp'));
    fireEvent.change(screen.getByLabelText('Phone number'), {
      target: { value: '+61400000000' },
    });
    fireEvent.click(screen.getByText('Send code via WhatsApp'));
    await waitFor(() => expect(sendOtpMock).toHaveBeenCalledTimes(1));
    expect(sendOtpMock.mock.calls[0][0]).toMatchObject({ phoneNumber: '+61400000000' });
    expect(screen.getByLabelText('Enter the 6-digit code')).toBeTruthy();
  });

  it('verifies the code and redirects to the callback destination', async () => {
    render(<WhatsAppSignIn locale="en" callbackURL="/dashboard" />);
    await reachCodeStep();
    fireEvent.change(screen.getByLabelText('Enter the 6-digit code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('Verify and sign in'));
    await waitFor(() => expect(verifyMock).toHaveBeenCalledTimes(1));
    expect(verifyMock.mock.calls[0][0]).toMatchObject({
      phoneNumber: '+61400000000',
      code: '123456',
    });
    await waitFor(() => expect(hrefSpy).toBe('http://localhost:4321/dashboard'));
  });

  it('surfaces a message when sending the code fails', async () => {
    sendOtpMock.mockResolvedValue({ data: null, error: { message: 'Invalid phone number' } });
    render(<WhatsAppSignIn locale="en" />);
    fireEvent.click(screen.getByText('Continue with WhatsApp'));
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByText('Send code via WhatsApp'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Invalid phone number'));
    // Stays on the phone step so the number can be corrected.
    expect(screen.getByLabelText('Phone number')).toBeTruthy();
  });

  it('surfaces a message when the code is wrong and stays on the code step', async () => {
    verifyMock.mockResolvedValue({ data: null, error: { message: 'Incorrect code' } });
    render(<WhatsAppSignIn locale="en" />);
    await reachCodeStep();
    fireEvent.change(screen.getByLabelText('Enter the 6-digit code'), {
      target: { value: '000000' },
    });
    fireEvent.click(screen.getByText('Verify and sign in'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Incorrect code'));
    expect(screen.getByLabelText('Enter the 6-digit code')).toBeTruthy();
    expect(hrefSpy).toBe('');
  });
});
