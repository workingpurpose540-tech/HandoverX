import { Folder, BadgeCheck, Clock, Sparkles } from 'lucide-react';
import type { WorkspaceDocument, WorkspaceMetricItem } from '../types/workspace';

export const workspaceMetricsData: WorkspaceMetricItem[] = [
  {
    id: 'total-docs',
    title: 'Total Documents',
    value: '28',
    icon: Folder,
    badgeText: '+4 uploaded today',
    badgeType: 'mint-text',
  },
  {
    id: 'verified-findings',
    title: 'Verified Findings',
    value: '42',
    icon: BadgeCheck,
    badgeText: '92% verified',
    badgeType: 'mint-pill',
  },
  {
    id: 'pending-reviews',
    title: 'Pending Reviews',
    value: '3',
    icon: Clock,
    badgeText: 'Action required',
    badgeType: 'pink-pill',
  },
  {
    id: 'last-analysis',
    title: 'Last Analysis',
    value: 'Today, 10:45 AM',
    icon: Sparkles,
    subtitle: 'AI Engine v2.4 • Parsed',
    badgeType: 'subtitle',
  },
];

export const initialWorkspaceDocuments: WorkspaceDocument[] = [
  {
    id: 'doc-1',
    name: 'Project_Requirements.pdf',
    versionLabel: 'v1.4 • Core Scope Specifications',
    format: 'PDF',
    size: '4.2 MB',
    uploadDate: 'Oct 24, 2024, 09:30 AM',
    status: 'processed',
  },
  {
    id: 'doc-2',
    name: 'Technical_Architecture.docx',
    versionLabel: 'v2.1 • Microservices Diagram Handover',
    format: 'DOCX',
    size: '12.8 MB',
    uploadDate: 'Oct 24, 2024, 08:15 AM',
    status: 'processed',
  },
  {
    id: 'doc-3',
    name: 'Development_Notes.md',
    versionLabel: 'Sprint Retrospectives & API Contracts',
    format: 'MD',
    size: '480 KB',
    uploadDate: 'Today, 10:12 AM',
    status: 'processing',
    statusProgress: 65,
  },
  {
    id: 'doc-4',
    name: 'Meeting_Summary.txt',
    versionLabel: 'Stakeholder Alignment Sync',
    format: 'TXT',
    size: '124 KB',
    uploadDate: 'Today, 10:40 AM',
    status: 'uploaded',
  },
  {
    id: 'doc-5',
    name: 'Design_System_Tokens_v2.md',
    versionLabel: 'Color, Spacing, and Elevation Specs',
    format: 'MD',
    size: '1.1 MB',
    uploadDate: 'Yesterday',
    status: 'processed',
  },
  {
    id: 'doc-6',
    name: 'Legacy_API_Schemas_Raw.json.txt',
    versionLabel: 'Parsing timed out: unexpected EOF schema',
    errorMessage: 'Parsing timed out: unexpected EOF schema',
    format: 'TXT',
    size: '8.4 MB',
    uploadDate: 'Oct 22, 2024',
    status: 'failed',
  },
];

