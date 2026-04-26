import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/utils/helpers';
import { PROBLEM_STATUSES } from '@/utils/constants';
import type { Problem } from '@/types';

interface RecentProblemsProps {
  problems: Problem[];
}

export const RecentProblems: React.FC<RecentProblemsProps> = ({ problems }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-foreground">{t('userDashboard.recent_problems')}</h2>
        <Link
          to="/problems"
          className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:underline"
        >
          {t('userDashboard.view_all')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {problems.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">{t('userDashboard.no_problems')}</p>
      ) : (
        <div className="space-y-3">
          {problems.map((problem) => {
            const statusCfg = PROBLEM_STATUSES.find(s => s.value === problem.status);
            const authorName = problem.author?.full_name || problem.author?.username || 'Unknown';
            return (
              <div
                key={problem.id}
                onClick={() => navigate(`/problems/${problem.id}`)}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer group"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                  style={{
                    backgroundColor:
                      problem.status === 'open' ? '#ca8a04' :
                      problem.status === 'discussing' ? '#6366f1' :
                      problem.status === 'brainstorming' ? '#3b82f6' :
                      problem.status === 'solved' ? '#22c55e' :
                      '#9ca3af',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {problem.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Avatar src={problem.author?.avatar_url} name={authorName} size="xs" />
                      {authorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {problem.comments_count || 0}
                    </span>
                    <span>{timeAgo(problem.created_at)}</span>
                  </div>
                </div>
                {statusCfg && (
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
