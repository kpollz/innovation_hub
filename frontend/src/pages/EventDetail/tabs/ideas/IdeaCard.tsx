import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Trophy, Edit2, Link as LinkIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { timeAgo } from '@/utils/helpers';
import type { EventIdeaObject } from '@/types';

interface IdeaCardProps {
  idea: EventIdeaObject;
  onClick: () => void;
  canEdit: boolean;
  onEdit: (idea: EventIdeaObject) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onClick, canEdit, onEdit }) => {
  const { t } = useTranslation();

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
            {idea.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            {idea.team && (
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {idea.team.name}
              </span>
            )}
            {idea.source_type === 'linked' && (
              <span className="flex items-center gap-1 text-blue-500">
                <LinkIcon className="h-3 w-3" />
                {t('events.ideas.linked')}
              </span>
            )}
          </div>
        </div>

        {/* Score badge */}
        <div className="flex-shrink-0">
          {idea.total_score !== null ? (
            <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold text-yellow-700">{idea.total_score.toFixed(1)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
              <Star className="h-3.5 w-3.5 text-gray-300" />
              <span className="text-sm text-gray-400">—</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Avatar
            src={idea.author?.avatar_url}
            name={idea.author?.full_name || idea.author?.username}
            size="sm"
          />
          <span className="text-xs text-gray-500">
            {idea.author?.full_name || idea.author?.username}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {idea.score_count > 0 && (
            <span className="text-xs text-gray-400">
              {t('events.ideas.score_count', { count: idea.score_count })}
            </span>
          )}
          <span className="text-xs text-gray-400">{timeAgo(idea.created_at)}</span>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onEdit(idea); }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
