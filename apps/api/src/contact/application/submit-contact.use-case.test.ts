import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { MailSender } from '../../mail/mail.port';
import { SubmitContactUseCase } from './submit-contact.use-case';

function build(recipient = 'ops@example.com') {
  const mail = { send: vi.fn().mockResolvedValue(undefined) };
  const config = { get: vi.fn().mockReturnValue(recipient) };
  const useCase = new SubmitContactUseCase(
    mail as unknown as MailSender,
    config as unknown as ConfigService,
  );
  return { useCase, mail };
}

describe('SubmitContactUseCase', () => {
  it('emails the operator with the sender as reply-to', async () => {
    const { useCase, mail } = build();
    await useCase.execute({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Hello',
      message: 'Great site',
    });
    expect(mail.send).toHaveBeenCalledTimes(1);
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ops@example.com',
        replyTo: 'ada@example.com',
        subject: '[Contact] Hello',
        text: expect.stringContaining('Ada <ada@example.com>'),
      }),
    );
    expect(mail.send.mock.calls[0]?.[0]?.text).toContain('Great site');
  });

  it('silently drops a submission with a filled honeypot', async () => {
    const { useCase, mail } = build();
    const result = await useCase.execute({
      name: 'Bot',
      email: 'bot@spam.example',
      subject: 'Buy now',
      message: 'spam',
      company: 'AcmeBots',
    });
    expect(result).toEqual({ ok: true });
    expect(mail.send).not.toHaveBeenCalled();
  });
});
