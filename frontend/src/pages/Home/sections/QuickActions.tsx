import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Lightbulb, Trophy } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actions = [
    {
      label: t('userDashboard.share_problem'),
      icon: Plus,
      primary: true,
      onClick: () => navigate('/problems/new'),
    },
    {
      label: t('userDashboard.create_brainstorm'),
      icon: Lightbulb,
      primary: false,
      onClick: () => navigate('/rooms'),
    },
    {
      label: t('userDashboard.join_event'),
      icon: Trophy,
      primary: false,
      onClick: () => navigate('/events'),
    },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('userDashboard.quick_actions')}</h2>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:-translate-y-0.5 ${
                action.primary
                  ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md'
                  : 'bg-card border border-border text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className={`w-4 h-4 ${!action.primary ? 'text-amber-500' : ''}`} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
