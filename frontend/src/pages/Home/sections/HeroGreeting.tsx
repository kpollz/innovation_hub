import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertCircle, Lightbulb, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aceternity/AuroraBackground';
import type { User } from '@/types';

interface HeroGreetingProps {
  user: User | null;
  openProblems: number;
  activeRooms: number;
  liveEvents: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export const HeroGreeting: React.FC<HeroGreetingProps> = ({
  user,
  openProblems,
  activeRooms,
  liveEvents,
}) => {
  const { t } = useTranslation();
  const firstName = user?.full_name?.split(' ').pop() || user?.username || '';
  const greeting = getGreeting();

  const stats = [
    {
      label: t('userDashboard.open_problems'),
      value: openProblems,
      icon: AlertCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      path: '/problems',
    },
    {
      label: t('userDashboard.active_brainstorms'),
      value: activeRooms,
      icon: Lightbulb,
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      path: '/rooms',
    },
    {
      label: t('userDashboard.live_events'),
      value: liveEvents,
      icon: Trophy,
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      path: '/events',
    },
  ];

  return (
    <AuroraBackground intensity="medium" className="rounded-3xl">
      <div className="p-8 md:p-10">
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-2 tracking-tight"
          >
            {t(`userDashboard.greeting_${greeting}`, { name: firstName })}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-muted-foreground text-base md:text-lg mb-8"
          >
            {t('userDashboard.subtitle')}
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                >
                  <Link
                    to={stat.path}
                    className="block bg-white rounded-2xl p-5 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                      <span className="text-3xl font-semibold text-foreground">{stat.value}</span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
};
