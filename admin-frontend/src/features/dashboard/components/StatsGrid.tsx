import React from 'react';

interface Stat {
  label: string;
  value: string | number;
  trend: number;
  icon: React.ReactNode;
}

interface StatsGridProps {
  stats: Stat[];
}

export default function StatsGrid({ stats }: StatsGridProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white shadow-md rounded-lg p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">{stat.icon}</div>
            <div className={`text-sm font-semibold ${stat.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stat.trend >= 0 ? '+' : ''}{stat.trend}%
            </div>
          </div>
          <div className="text-gray-600 text-sm dark:text-gray-400">{stat.label}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}