import type { Locale } from '@TheY2T/tmr-i18n';
import { contentManagerConfig } from '@/components/admin/content-manager-config';
import { EntityManager } from '@/components/admin/EntityManager';

/** Island wrapper: builds the catalogue-content config client-side and renders the generic manager. */
export default function AdminContentManager({ locale }: { locale: Locale }) {
  return <EntityManager config={contentManagerConfig(locale)} />;
}
