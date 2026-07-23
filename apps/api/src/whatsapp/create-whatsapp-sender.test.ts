import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWhatsAppTransport } from './create-whatsapp-sender';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createWhatsAppTransport', () => {
  it('logs (never calls the Cloud API) when no sender is configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const transport = createWhatsAppTransport({});
    await transport.send({ to: '+61400000000', code: '123456' });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts an authentication-template message carrying the code to the Graph API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const transport = createWhatsAppTransport({
      accessToken: 'token-abc',
      phoneNumberId: '55501234',
      templateName: 'otp_code',
      templateLang: 'en',
      graphVersion: 'v21.0',
    });
    await transport.send({ to: '+61400000000', code: '123456' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v21.0/55501234/messages');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer token-abc');

    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      messaging_product: 'whatsapp',
      to: '+61400000000',
      type: 'template',
      template: { name: 'otp_code', language: { code: 'en' } },
    });
    // The code rides in both the body parameter and the copy-code button parameter.
    expect(JSON.stringify(body.template.components)).toContain('123456');
  });

  it('throws when the Cloud API rejects the send', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('bad template', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    const transport = createWhatsAppTransport({
      accessToken: 'token-abc',
      phoneNumberId: '55501234',
      templateName: 'otp_code',
    });

    await expect(transport.send({ to: '+61400000000', code: '123456' })).rejects.toThrow(
      /WhatsApp Cloud API send failed \(400\)/,
    );
  });
});
