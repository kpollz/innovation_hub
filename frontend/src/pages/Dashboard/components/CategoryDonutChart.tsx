import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const COLORS: Record<string, string> = {
  process: '#fbbd41',
  technical: '#2563eb',
  people: '#9333ea',
  tools: '#0891b2',
  patent: '#078a52',
};

interface CategoryDonutChartProps {
  data: Record<string, number>;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const entries = Object.entries(data).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  const chartData = entries.map(([category, count]) => ({
    name: t(`categories.${category}`, category),
    value: count,
    color: COLORS[category] || '#9ca3af',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle title={t('dashboard.hint_categories')}>{t('dashboard.problem_categories')}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">{t('common.no_data')}</p>
        ) : (
          <div>
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value}`, name]}
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 13,
                      border: '1px solid var(--border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    cursor="default"
                    isAnimationActive={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-foreground">{total}</span>
                  <span className="text-xs text-muted-foreground">{t('dashboard.problems')}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {chartData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
