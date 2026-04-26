import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, AlertCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { TopContributor } from '@/types';

interface TopContributorsProps {
  contributors: TopContributor[];
}

export const TopContributors: React.FC<TopContributorsProps> = ({ contributors }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('dashboard.top_contributors')}</h2>
      {contributors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t('common.no_data')}</p>
      ) : (
        <div className="divide-y divide-border">
          {contributors.map((contributor, index) => (
            <div key={contributor.user.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary-100 text-primary-700 font-semibold text-xs">
                  {index + 1}
                </div>
                <Avatar src={contributor.user.avatar_url} name={contributor.user.full_name || contributor.user.username} size="sm" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {contributor.user.full_name || contributor.user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">{contributor.user.team || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 w-14">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-right w-7">{contributor.problems_count}</span>
                </span>
                <span className="flex items-center gap-1 w-14">
                  <Lightbulb className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-right w-7">{contributor.ideas_count}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
