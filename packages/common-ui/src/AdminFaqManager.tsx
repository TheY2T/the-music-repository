import type { Locale } from '@TheY2T/tmr-i18n';
import { EntityManager } from './admin/EntityManager';
import { faqManagerConfig } from './admin/faq-manager-config';

/** Island wrapper: builds the FAQ config client-side and renders the generic manager. */
export default function AdminFaqManager({ locale }: { locale: Locale }) {
  return <EntityManager config={faqManagerConfig(locale)} />;
}
