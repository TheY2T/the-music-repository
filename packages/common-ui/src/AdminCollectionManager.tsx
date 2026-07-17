import type { Locale } from '@TheY2T/tmr-i18n';
import { collectionManagerConfig } from './admin/collection-manager-config';
import { EntityManager } from './admin/EntityManager';

/** Island wrapper: builds the collections config client-side (configs hold functions/JSX, not
 * serializable as Astro props) and renders the generic manager. */
export default function AdminCollectionManager({ locale }: { locale: Locale }) {
  return <EntityManager config={collectionManagerConfig(locale)} />;
}
