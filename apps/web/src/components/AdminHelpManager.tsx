import type { Locale } from '@TheY2T/tmr-i18n';
import { EntityManager } from '@/components/admin/EntityManager';
import { helpManagerConfig } from '@/components/admin/help-manager-config';

/** Island wrapper: builds the help-topics config client-side and renders the generic manager. */
export default function AdminHelpManager({ locale }: { locale: Locale }) {
  return <EntityManager config={helpManagerConfig(locale)} />;
}
