import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DailyActivity } from '@/types';

interface ActivityOverTimeChartProps {
  data: DailyActivity[];
}

export const ActivityOverTimeChart: React.FC<ActivityOverTimeChartProps> = ({ data }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.activity_over_time')}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">{t('common.no_data')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barGap={2}>
              <XAxis
                dataKey="day_name"
                tick={{ fontSize: 12, fill: '#9f9b93' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9f9b93' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #dad4c8',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  fontSize: '13px',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
              />
              <Bar
                dataKey="problems"
                name={t('dashboard.problems')}
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
              <Bar
                dataKey="ideas"
                name={t('dashboard.ideas')}
                fill="#078a52"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
              <Bar
                dataKey="comments"
                name={t('dashboard.comments')}
                fill="#9333ea"
                radius={[4, 4, 0, 0]}
                opacity={0.65}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
