import React from 'react';

export type StatusVariant = 'verified' | 'pending' | 'neutral';

export interface MetricItem {
  id: string;
  title: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconBgClass?: string;
  iconTextClass?: string;
  badgeText: string;
  badgeIcon?: React.ComponentType<{ className?: string }>;
  badgeIconClass?: string;
  badgeBgClass?: string;
  badgeTextClass?: string;
  valueColorClass?: string;
}

export interface ProjectItem {
  id: string;
  category: string;
  code: string;
  documentCount: number;
  title: string;
  status: string;
  statusVariant: StatusVariant;
  description: string;
  progress: number;
  progressColorClass?: string;
  lastUploaded: string;
  lastUpdated: string;
}

export interface ActivityItem {
  id: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconBgClass?: string;
  iconTextClass?: string;
  title: string;
  subtitle: string;
  type?: 'project' | 'document';
}
