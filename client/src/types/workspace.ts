import type React from 'react';

export type DocumentFormat = 'PDF' | 'DOCX' | 'TXT' | 'MD';
export type DocumentStatus = 'processed' | 'processing' | 'uploaded' | 'failed';
export type WorkspaceTab =
  | 'overview'
  | 'documents'
  | 'ai-analysis'
  | 'evidence-review'
  | 'handover-report';

export interface WorkspaceDocument {
  id: string;
  name: string;
  versionLabel?: string;
  format: DocumentFormat;
  size: string;
  uploadDate: string;
  status: DocumentStatus;
  statusProgress?: number;
  errorMessage?: string;
  isLive?: boolean;
  extractedText?: string;
}

export interface WorkspaceMetricItem {
  id: string;
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
  badgeType?: 'mint-text' | 'mint-pill' | 'pink-pill' | 'subtitle';
  subtitle?: string;
}

export interface DocumentFilterState {
  searchQuery: string;
  format: string;
  status: string;
  sortBy: string;
}

