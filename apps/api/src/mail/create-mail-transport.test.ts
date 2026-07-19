import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock('nodemailer', () => ({
  createTransport: (...args: unknown[]) => createTransport(...args),
}));

import { createMailTransport } from './create-mail-transport';

describe('createMailTransport', () => {
  beforeEach(() => {
    sendMail.mockReset();
    createTransport.mockClear();
  });

  it('delivers via SMTP when a connection string is provided', async () => {
    const transport = createMailTransport({
      smtpUrl: 'smtps://user:pass@host:465',
      from: 'a@b.co',
    });
    await transport.send({ to: 'to@x.co', subject: 'Hi', text: 'body' });
    expect(createTransport).toHaveBeenCalledWith('smtps://user:pass@host:465');
    expect(sendMail).toHaveBeenCalledWith({
      from: 'a@b.co',
      to: 'to@x.co',
      subject: 'Hi',
      text: 'body',
      html: undefined,
    });
  });

  it('logs instead of sending when no SMTP url is configured', async () => {
    const transport = createMailTransport({});
    await transport.send({ to: 'to@x.co', subject: 'Hi', text: 'body' });
    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
