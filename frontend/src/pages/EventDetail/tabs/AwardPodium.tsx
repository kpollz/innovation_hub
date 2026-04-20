import React from 'react';
import { Trophy } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { EventAward } from '@/types';

interface AwardPodiumProps {
  awards: EventAward[];
}

const rankColors: Record<number, { bg: string; border: string; badge: string; icon: string }> = {
  1: {
    bg: 'bg-gradient-to-t from-amber-100 to-amber-50',
    border: 'border-amber-300',
    badge: 'bg-amber-400 text-amber-900',
    icon: 'text-amber-500',
  },
  2: {
    bg: 'bg-gradient-to-t from-slate-200 to-slate-50',
    border: 'border-slate-300',
    badge: 'bg-slate-400 text-slate-900',
    icon: 'text-slate-400',
  },
  3: {
    bg: 'bg-gradient-to-t from-orange-100 to-orange-50',
    border: 'border-orange-300',
    badge: 'bg-orange-400 text-orange-900',
    icon: 'text-orange-400',
  },
};

const defaultColor = {
  bg: 'bg-gradient-to-t from-blue-100 to-blue-50',
  border: 'border-blue-200',
  badge: 'bg-blue-400 text-blue-900',
  icon: 'text-blue-400',
};

const podiumHeights: Record<number, string> = {
  1: 'h-40',
  2: 'h-28',
  3: 'h-20',
};

export const AwardPodium: React.FC<AwardPodiumProps> = ({ awards }) => {
  const sorted = [...awards].sort((a, b) => a.rank_order - b.rank_order);

  // Rearrange for podium display: [2nd, 1st, 3rd] for 3 awards
  let displayOrder = sorted;
  if (sorted.length === 3) {
    displayOrder = [sorted[1], sorted[0], sorted[2]];
  }

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 pt-6 pb-2">
      {displayOrder.map((award) => {
        const colors = rankColors[award.rank_order] || defaultColor;
        const height = podiumHeights[award.rank_order] || 'h-16';

        return (
          <div key={award.id} className="flex flex-col items-center min-w-[120px] max-w-[200px]">
            {/* Award name badge */}
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${colors.badge}`}>
              <Trophy className="h-3 w-3" />
              {award.name}
            </span>

            {/* Teams */}
            <div className="space-y-2 mb-2">
              {award.teams.map((team) => (
                <div key={team.team_id} className="flex flex-col items-center gap-1">
                  <Avatar
                    src={team.leader_avatar_url}
                    name={team.leader_name || team.team_name}
                    size="lg"
                  />
                  <span className="text-xs font-medium text-foreground text-center leading-tight">
                    {team.team_name}
                  </span>
                  {team.leader_name && (
                    <span className="text-[10px] text-muted-foreground">
                      {team.leader_name}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Podium block */}
            <div
              className={`w-full rounded-t-lg border-b-4 ${colors.border} ${colors.bg} ${height}`}
            />
          </div>
        );
      })}
    </div>
  );
};
