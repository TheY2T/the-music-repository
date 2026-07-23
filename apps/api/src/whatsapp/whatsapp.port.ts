export interface WhatsAppOtpMessage {
  /** Recipient phone number in E.164 form (e.g. `+61412345678`). */
  to: string;
  /** The one-time passcode to deliver. */
  code: string;
}

/**
 * WhatsAppSender (ADR 0012) — the capability of delivering a one-time passcode over WhatsApp. Bound to
 * `CloudApiWhatsAppSender` when a WhatsApp Business sender is configured
 * (`WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`), else `LogWhatsAppSender` (dev/CI — logs the
 * code, sends nothing). App code depends only on this port, never on the Cloud API.
 */
export abstract class WhatsAppSender {
  abstract send(message: WhatsAppOtpMessage): Promise<void>;
}
