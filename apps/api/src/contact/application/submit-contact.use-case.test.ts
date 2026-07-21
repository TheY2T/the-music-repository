import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { MailSender } from '../../mail/mail.port';
import { CaptchaFailedError } from '../domain/errors/captcha-failed.error';
import type { CaptchaVerifier } from './ports/captcha-verifier.port';
import { SubmitContactUseCase } from './submit-contact.use-case';

function build(recipient = 'ops@example.com', captchaOk = true) {
  const mail = { send: vi.fn().mockResolvedValue(undefined) };
  const config = { get: vi.fn().mockReturnValue(recipient) };
  const captcha = { verify: vi.fn().mockResolvedValue(captchaOk) };
  const useCase = new SubmitContactUseCase(
    mail as unknown as MailSender,
    config as unknown as ConfigService,
    captcha as unknown as CaptchaVerifier,
  );
  return { useCase, mail, captcha };
}

describe('SubmitContactUseCase', () => {
  it('emails the operator with the sender as reply-to', async () => {
    const { useCase, mail } = build();
    await useCase.execute({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Hello',
      message: 'Great site',
      turnstileToken: 'tok',
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
    const { useCase, mail, captcha } = build();
    const result = await useCase.execute({
      name: 'Bot',
      email: 'bot@spam.example',
      subject: 'Buy now',
      message: 'spam',
      company: 'AcmeBots',
    });
    expect(result).toEqual({ ok: true });
    expect(mail.send).not.toHaveBeenCalled();
    // Honeypot short-circuits before the captcha check.
    expect(captcha.verify).not.toHaveBeenCalled();
  });

  it('rejects a submission that fails the anti-bot check', async () => {
    const { useCase, mail } = build('ops@example.com', false);
    await expect(
      useCase.execute({ name: 'A', email: 'a@x.co', subject: 'S', message: 'M' }),
    ).rejects.toBeInstanceOf(CaptchaFailedError);
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('passes the token and client IP to the verifier', async () => {
    const { useCase, captcha } = build();
    await useCase.execute(
      { name: 'A', email: 'a@x.co', subject: 'S', message: 'M', turnstileToken: 'tok' },
      '203.0.113.7',
    );
    expect(captcha.verify).toHaveBeenCalledWith('tok', '203.0.113.7');
  });
});
