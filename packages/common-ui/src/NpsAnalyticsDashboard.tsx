import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Badge, Card, EmptyState, Icon, StatTile } from '@TheY2T/tmr-ui';
import type { NpsAnalytics, NpsResponseView } from '@TheY2T/tmr-web-acl/dto';
import { feedbackAdminApi } from '@TheY2T/tmr-web-acl/feedback-api';
import { useEffect, useState } from 'react';

/** Admin NPS dashboard: the headline score, segment counts, a monthly trend, and recent comments. */
export default function NpsAnalyticsDashboard({ locale }: { locale: Locale }) {
  const [analytics, setAnalytics] = useState<NpsAnalytics | null>(null);
  const [responses, setResponses] = useState<NpsResponseView[]>([]);

  useEffect(() => {
    feedbackAdminApi
      .npsAnalytics()
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
    feedbackAdminApi
      .npsResponses(1, 50)
      .then((page) => setResponses(page.items))
      .catch(() => setResponses([]));
  }, []);

  if (!analytics || analytics.responseCount === 0) {
    return <EmptyState title={t(locale, 'anps.noResponses')} />;
  }

  const maxCount = Math.max(1, ...analytics.trend.map((point) => point.responseCount));
  const comments = responses.filter((r) => r.comment);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile iconName="trending-up" label={t(locale, 'anps.score')} value={analytics.score} />
        <StatTile label={t(locale, 'anps.promoters')} value={analytics.promoters} />
        <StatTile label={t(locale, 'anps.passives')} value={analytics.passives} />
        <StatTile label={t(locale, 'anps.detractors')} value={analytics.detractors} />
        <StatTile label={t(locale, 'anps.responses')} value={analytics.responseCount} />
      </div>

      {analytics.trend.length > 0 ? (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-medium">{t(locale, 'anps.trend')}</h2>
          <ul className="space-y-2">
            {analytics.trend.map((point) => (
              <li key={point.period} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 tabular-nums text-muted-foreground">
                  {point.period}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(point.responseCount / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-medium tabular-nums">
                  {point.score}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium">{t(locale, 'anps.recent')}</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(locale, 'anps.noResponses')}</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((r) => (
              <li key={r.id} className="flex items-start gap-3">
                <Badge variant="secondary" className="tabular-nums">
                  {r.score}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm">{r.comment}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon name="user" className="size-3" />
                    {r.userEmail ?? r.userId}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
