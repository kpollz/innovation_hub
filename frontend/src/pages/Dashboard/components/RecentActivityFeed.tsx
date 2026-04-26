import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/utils/helpers';
import type { ActivityItem } from '@/types';

interface RecentActivityFeedProps {
  items: ActivityItem[];
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  problem_created: { icon: AlertCircle, color: '#2563eb', bgColor: 'bg-blue-100' },
  idea_created: { icon: Lightbulb, color: '#fbbd41', bgColor: 'bg-amber-100' },
  comment_added: { icon: MessageCircle, color: '#9333ea', bgColor: 'bg-purple-100' },
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ items }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recent_activity')}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">{t('dashboard.no_activity')}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.problem_created;
              const Icon = config.icon;
              const actorName = item.actor.full_name || item.actor.username;

              let text = '';
              if (item.type === 'problem_created') {
                text = t('dashboard.activity_problem', { name: actorName, title: item.target_title });
              } else if (item.type === 'idea_created') {
                text = t('dashboard.activity_idea', { name: actorName, title: item.target_title });
              } else if (item.type === 'comment_added') {
                text = t('dashboard.activity_comment', { name: actorName, title: item.target_title });
              }

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'problem_created') navigate(`/problems/${item.target_id}`);
                    else if (item.type === 'idea_created') navigate(`/ideas/${item.target_id}`);
                  }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar src={item.actor.avatar_url} name={actorName} size="xs" />
                      <span className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
