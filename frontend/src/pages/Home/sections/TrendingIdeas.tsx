import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ThumbsUp } from 'lucide-react';
import type { Idea } from '@/types';

interface TrendingIdeasProps {
  ideas: Idea[];
}

export const TrendingIdeas: React.FC<TrendingIdeasProps> = ({ ideas }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-foreground">{t('userDashboard.trending_ideas')}</h2>
        <Link
          to="/rooms"
          className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:underline"
        >
          {t('userDashboard.view_all')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {ideas.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">{t('userDashboard.no_ideas')}</p>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => navigate(`/ideas/${idea.id}`)}
              className="flex items-start gap-4 p-4 rounded-xl bg-secondary border border-border cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground mb-1 line-clamp-1">{idea.title}</h3>
                {idea.summary && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{idea.summary}</p>
                )}
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    {idea.vote_avg?.toFixed(1) || '0.0'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {idea.likes_count || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
