import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ThumbsUp, Lightbulb, BrainCircuit } from 'lucide-react';
import type { Problem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PROBLEM_CATEGORIES, PROBLEM_STATUSES } from '@/utils/constants';
import { timeAgo } from '@/utils/helpers';

interface ProblemCardProps {
  problem: Problem;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem }) => {
  const category = PROBLEM_CATEGORIES.find((c) => c.value === problem.category);
  const status = PROBLEM_STATUSES.find((s) => s.value === problem.status);

  return (
    <Card hoverable>
      <Link to={`/problems/${problem.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {category && (
                <Badge variant="info" size="sm">
                  {category.label}
                </Badge>
              )}
              {status && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{timeAgo(problem.created_at)}</span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {problem.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {problem.summary || problem.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {problem.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                {problem.insights_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {problem.comments_count || 0}
              </span>
            </div>

            {problem.rooms?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary-600">
                <BrainCircuit className="h-3.5 w-3.5" />
                {problem.rooms.length} room{problem.rooms.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-700">
                {(problem.author?.full_name || problem.author?.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-700">{problem.author?.full_name || problem.author?.username || 'Unknown'}</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};
