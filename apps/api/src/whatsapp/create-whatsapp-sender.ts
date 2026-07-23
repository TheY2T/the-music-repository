import { Logger } from '@nestjs/common';
import type { WhatsAppOtpMessage } from './whatsapp.port';

const DEFAULT_GRAPH_VERSION = 'v21.0';
const DEFAULT_TEMPLATE_LANG = 'en';

/** A transport that can deliver a one-time passcode over WhatsApp. */
export interface WhatsAppTransport {
  send(message: WhatsAppOtpMessage): Promise<void>;
}

export interface WhatsAppTransportConfig {
  /** WhatsApp Business system-user access token. When unset (with `phoneNumberId`), the code is logged. */
  accessToken?: string;
  /** The Business phone-number id that sends the message. */
  phoneNumberId?: string;
  /** Name of the approved AUTHENTICATION-category template. */
  templateName?: string;
  /** Language code the template was approved in (e.g. `en`, `en_US`). */
  templateLang?: string;
  /** Graph API version segment (e.g. `v21.0`). */
  graphVersion?: string;
}

/**
 * Selects a WhatsApp transport from configuration: a Cloud API transport (posts an approved
 * authentication template carrying the code) when a token + sender phone-number id are set, otherwise a
 * transport that logs the code for local development. Shared by the Nest `WhatsAppModule` and the
 * module-scoped Better Auth instance, which reads `process.env` directly rather than Nest DI.
 */
export function createWhatsAppTransport({
  accessToken,
  phoneNumberId,
  templateName,
  templateLang = DEFAULT_TEMPLATE_LANG,
  graphVersion = DEFAULT_GRAPH_VERSION,
}: WhatsAppTransportConfig): WhatsAppTransport {
  if (accessToken && phoneNumberId && templateName) {
    const endpoint = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
    return {
      async send(message) {
        // Authentication template with a copy-code button: the code is passed both as the body
        // parameter (the visible message) and as the button parameter (what the button copies).
        const body = {
          messaging_product: 'whatsapp',
          to: message.to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [
              { type: 'body', parameters: [{ type: 'text', text: message.code }] },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: message.code }],
              },
            ],
          },
        };
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const detail = await response.text().catch(() => '');
          throw new Error(`WhatsApp Cloud API send failed (${response.status}): ${detail}`);
        }
      },
    };
  }

  const logger = new Logger('WhatsApp');
  return {
    async send(message) {
      logger.log(`[dev-whatsapp] to=${message.to} · code=${message.code}`);
    },
  };
}
