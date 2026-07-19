/**
 * Business identity for the site operator — the single source of truth for the trading name,
 * ABN, contact point, and legal-page metadata. The footer, the About/legal pages, and the
 * schema.org Organization structured data all read from here so the details never drift.
 *
 * The operator is an Australian sole trader; there is no ACN (sole traders don't have one).
 */
export const business = {
  /** Registered trading name. */
  tradingName: 'Michael Hewett',
  /** Australian Business Number, grouped for display (11 digits, standard 2-3-3-3 spacing). */
  abn: '31 769 705 046',
  /** ABN without spacing — for machine-readable structured data. */
  abnRaw: '31769705046',
  /** Contact point for privacy access/correction requests, complaints, and general enquiries. */
  contactEmail: 'michael.hewett.87@gmail.com',
  /** Date the current privacy policy and terms take effect. */
  effectiveDate: '19 July 2026',
  /** Australian state whose law governs the terms of service. */
  governingLawState: 'Victoria',
} as const;

export type Business = typeof business;
