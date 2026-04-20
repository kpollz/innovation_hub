import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ThumbsUp, Lightbulb, BrainCircuit, Lock } from 'lucide-react';
import type { Problem } from '@/types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PROBLEM_CATEGORIES, PROBLEM_STATUSES } from '@/utils/constants';
import { timeAgo } from '@/utils/helpers';
import { extractTextFromTipTap } from '@/utils/tiptap';

interface ProblemCardProps {
  problem: Problem;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem }) => {
  const category = PROBLEM_CATEGORIES.find((c) => c.value === problem.category);
  const status = PROBLEM_STATUSES.find((s) => s.value === problem.status);

  return (
    <Card hoverable className="h-full">
      <Link to={`/problems/${problem.id}`} className="flex flex-col h-full">
        {/* Top: Tags & badges */}
        <div className="px-5 pt-5 pb-3">
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
              {problem.visibility === 'private' && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500" title="Private">
                  <Lock className="h-3 w-3" />
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{timeAgo(problem.created_at)}</span>
          </div>
        </div>

        {/* Middle: Content (flex-1 fills remaining space) */}
        <div className="px-5 flex-1">
          <h3 className="text-feature-title font-semibold text-gray-900 mb-2 line-clamp-2">
            {problem.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {problem.summary || extractTextFromTipTap(problem.content)}
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
        </div>

        {/* Bottom: Author (pinned to bottom) */}
        <div className="px-5 pb-5 pt-4 mt-auto border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Avatar src={problem.author?.avatar_url} name={problem.author?.full_name || problem.author?.username} size="sm" />
            <span className="text-sm text-gray-700">{problem.author?.full_name || problem.author?.username || 'Unknown'}</span>
          </div>
        </div>
      </Link>
    </Card>
  );
};
