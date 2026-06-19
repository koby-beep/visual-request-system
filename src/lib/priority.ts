import { Priority } from '@/types';

export function getPriority(date: string): Priority {
  const days = Math.ceil(
    (new Date(date + 'T00:00:00').getTime() - new Date().getTime()) / 86400000
  );
  if (days <= 1) return 'urgent';
  if (days <= 5) return 'high';
  if (days <= 14) return 'medium';
  return 'low';
}

export function getDaysLeft(date: string): number {
  return Math.ceil(
    (new Date(date + 'T00:00:00').getTime() - new Date().getTime()) / 86400000
  );
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  urgent: {
    label: 'Urgent',
    className: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900',
  },
  high: {
    label: 'High',
    className: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900',
  },
  medium: {
    label: 'Medium',
    className: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900',
  },
  low: {
    label: 'Low',
    className: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900',
  },
};

export const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low'];
