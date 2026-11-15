import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  FileText,
  Folder,
  BadgeCheck,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import WorkspaceMetrics from '../components/workspace/WorkspaceMetrics';
import DocumentUploadZone from '../components/workspace/DocumentUploadZone';
import DocumentTable from '../components/workspace/DocumentTable';
import DocumentDetailsDrawer from '../components/workspace/DocumentDetailsDrawer';
import AnalysisSummaryCard from '../components/workspace/AnalysisSummaryCard';
import AiAnalysisView from '../components/workspace/AiAnalysisView';
import HandoverReportView from '../components/workspace/HandoverReportView';
import EvidenceReviewView from '../components/workspace/EvidenceReviewView';
import {
  uploadDocumentsApi,
  getProjectHandoverApi,
  submitFindingReviewApi,
} from '../services/api';
import type { AnalysisResult, AnalysisFinding, HumanReviewStatus } from '../services/api';
import type {
  WorkspaceTab,
  WorkspaceDocument,
  DocumentFormat,
  WorkspaceMetricItem,
} from '../types/workspace';
import { useAuth } from '../context/useAuth';

export interface ProjectWorkspaceProps {
  projectId?: string;
  projectName?: string;
  projectDescription?: string;
  onNavigateDashboard?: () => void;
  onNavigateMyProjects?: () => void;
  onCreateProject?: () => void;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(ts?: string | unknown): string {
  if (!ts) return 'Uploaded';
  if (typeof ts === 'string') {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  return 'Uploaded';
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  projectId,
  projectName = 'Project Workspace',
  projectDescription = 'Unified project documentation, architecture decisions, and AI handover reports.',
  onNavigateDashboard,
  onNavigateMyProjects,
  onCreateProject,
}) => {
  const { getIdToken } = useAuth();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('documents');
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);

  // Loading & network state
  const [isLoadingHandover, setIsLoadingHandover] = useState(false);
  const [handoverError, setHandoverError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);

  // Document details drawer states
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<WorkspaceDocument | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [detailsDrawerInitialTab, setDetailsDrawerInitialTab] = useState<'overview' | 'findings'>(
    'overview'
  );

  // Fetch persisted project handover data from Firestore on mount/projectId change
  useEffect(() => {
    let ignore = false;
    if (!projectId) {
      return;
    }

    getIdToken().then((token) => {
      if (!token || ignore) return;
      setIsLoadingHandover(true);
      setHandoverError(null);
      getProjectHandoverApi(projectId, token)
        .then((res) => {
          if (ignore) return;
          if (res.success && res.handover) {
            const persistedDocs: WorkspaceDocument[] = (res.handover.documents || []).map((d) => ({
              id: d.documentId,
              name: d.originalName,
              versionLabel: `${d.format.toUpperCase()} • ${d.pageCount} page(s)`,
              format: (d.format?.toUpperCase() as DocumentFormat) || 'PDF',
              size: formatFileSize(d.size),
              uploadDate: formatTimestamp(d.createdAt),
              status: 'processed',
              isLive: true,
              extractedText: d.extractedTextPreview || undefined,
            }));

            setDocuments(persistedDocs);
            setAnalysisResult(res.handover.analysis);
            setReportMarkdown(res.handover.report);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setHandoverError(
              err instanceof Error
                ? err.message
                : 'Unable to connect to the HandoverX backend server. Please verify the server is running.'
            );
            console.error('Failed to load project handover:', err);
          }
        })
        .finally(() => {
          if (!ignore) {
            setIsLoadingHandover(false);
          }
        });
    });

    return () => {
      ignore = true;
    };
  }, [projectId, getIdToken]);

  const handleRetryHandover = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingHandover(true);
    setHandoverError(null);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await getProjectHandoverApi(projectId, token, true);
      if (res.success && res.handover) {
        const persistedDocs: WorkspaceDocument[] = (res.handover.documents || []).map((d) => ({
          id: d.documentId,
          name: d.originalName,
          versionLabel: `${d.format.toUpperCase()} • ${d.pageCount} page(s)`,
          format: (d.format?.toUpperCase() as DocumentFormat) || 'PDF',
          size: formatFileSize(d.size),
          uploadDate: formatTimestamp(d.createdAt),
          status: 'processed',
          isLive: true,
          extractedText: d.extractedTextPreview || undefined,
        }));

        setDocuments(persistedDocs);
        setAnalysisResult(res.handover.analysis);
        setReportMarkdown(res.handover.report);
      }
    } catch (err) {
      setHandoverError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the HandoverX backend server. Please verify the server is running.'
      );
      console.error('Failed to retry project handover:', err);
    } finally {
      setIsLoadingHandover(false);
    }
  }, [projectId, getIdToken]);

  // Compute real metrics dynamically from persisted data
  let verifiedFindingsCount = 0;
  let inferredFindingsCount = 0;

  if (analysisResult) {
    type FindingCategoryKey =
      | 'decisions'
      | 'tasks'
      | 'blockers'
      | 'dependencies'
      | 'people'
      | 'missingInformation';

    const categories: FindingCategoryKey[] = [
      'decisions',
      'tasks',
      'blockers',
      'dependencies',
      'people',
      'missingInformation',
    ];
    for (const cat of categories) {
      const items = analysisResult[cat];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.evidenceStatus === 'source-supported') {
            verifiedFindingsCount++;
          } else if (item.evidenceStatus === 'inferred-needs-confirmation') {
            inferredFindingsCount++;
          }
        }
      }
    }
  }

  const realMetrics: WorkspaceMetricItem[] = [
    {
      id: 'total-docs',
      title: 'Total Documents',
      value: documents.length.toString(),
      icon: Folder,
      badgeText: documents.length > 0 ? `${documents.length} persisted` : '0 documents',
      badgeType: 'mint-text',
    },
    {
      id: 'verified-findings',
      title: 'Source-Supported Findings',
      value: verifiedFindingsCount.toString(),
      icon: BadgeCheck,
      badgeText: 'Verified Quotes',
      badgeType: 'mint-pill',
    },
    {
      id: 'pending-reviews',
      title: 'Inferred Findings',
      value: inferredFindingsCount.toString(),
      icon: Clock,
      badgeText: inferredFindingsCount > 0 ? 'Needs review' : 'None flagged',
      badgeType: 'pink-pill',
    },
    {
      id: 'last-analysis',
      title: 'Handover Synthesis',
      value: analysisResult ? 'Synthesized' : 'Pending',
      icon: Sparkles,
      subtitle: analysisResult
        ? 'AI Engine v2.4 • Grounded'
        : 'Upload documents to run analysis',
      badgeType: 'subtitle',
    },
  ];

  const handleOpenDocDetails = (doc: WorkspaceDocument) => {
    setSelectedDocForDetails(doc);
    setDetailsDrawerInitialTab('overview');
    setIsDetailsDrawerOpen(true);
  };

  const handleOpenDocFindings = (doc: WorkspaceDocument) => {
    setSelectedDocForDetails(doc);
    setDetailsDrawerInitialTab('findings');
    setIsDetailsDrawerOpen(true);
  };

  const handleUploadFiles = async (files: File[]) => {
    if (isUploading) return;

    if (!projectId) {
      setUploadError(
        'Document upload requires a real Firestore project. Please select or create a project.'
      );
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessNotice(null);

    // Read client-side text previews for text/markdown files
    const textMap = new Map<string, string>();
    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.txt') || lower.endsWith('.md')) {
        try {
          const text = await file.text();
          textMap.set(file.name, text);
        } catch {
          // Ignore
        }
      }
    }

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('Authentication session expired. Please sign in again.');
      }

      const response = await uploadDocumentsApi(projectId, files, idToken);

      // Map API documents to WorkspaceDocument
      const newlyUploaded: WorkspaceDocument[] = (response.documents || []).map((doc) => ({
        id: doc.documentId,
        name: doc.originalName,
        versionLabel: `Live Upload • ${doc.pageCount} page(s) analyzed`,
        format: (doc.format?.toUpperCase() as DocumentFormat) || 'PDF',
        size: formatFileSize(doc.size),
        uploadDate: 'Just now',
        status: 'processed',
        isLive: true,
        extractedText: doc.extractedTextPreview || textMap.get(doc.originalName),
      }));

      // Prepend newly uploaded documents
      setDocuments((prev) => [...newlyUploaded, ...prev]);

      // Save Analysis & Handover Report
      if (response.analysis) {
        setAnalysisResult(response.analysis);
      }
      if (response.report) {
        setReportMarkdown(response.report);
      }

      setUploadSuccessNotice(
        `Successfully analyzed and persisted ${response.totalDocuments} document(s) in Firestore.`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReviewFinding = async (
    findingId: string,
    status: HumanReviewStatus,
    comment?: string,
    editedTitle?: string,
    editedDescription?: string
  ) => {
    if (!projectId) {
      throw new Error('Project ID is required.');
    }
    const token = await getIdToken();
    if (!token) {
      throw new Error('Authentication expired. Please sign in again.');
    }

    let findingTitle: string | undefined;
    if (analysisResult) {
      const allFindings = [
        ...(analysisResult.decisions || []),
        ...(analysisResult.tasks || []),
        ...(analysisResult.blockers || []),
        ...(analysisResult.dependencies || []),
        ...(analysisResult.people || []),
        ...(analysisResult.missingInformation || []),
      ];
      const match = allFindings.find((f) => f.id === findingId);
      if (match) {
        findingTitle = match.title;
      }
    }

    const res = await submitFindingReviewApi(
      projectId,
      findingId,
      {
        status,
        comment,
        findingTitle,
        editedTitle,
        editedDescription,
      },
      token
    );

    if (res.success) {
      if (res.analysis) {
        setAnalysisResult(res.analysis);
      } else if (analysisResult) {
        const updateItem = (item: AnalysisFinding): AnalysisFinding => {
          if (item.id === findingId) {
            return {
              ...item,
              title: (editedTitle && editedTitle.trim()) ? editedTitle.trim() : item.title,
              description:
                (editedDescription && editedDescription.trim())
                  ? editedDescription.trim()
                  : item.description,
              reviewStatus: status,
              review: res.review,
            };
          }
          return item;
        };

        setAnalysisResult({
          ...analysisResult,
          decisions: (analysisResult.decisions || []).map(updateItem),
          tasks: (analysisResult.tasks || []).map(updateItem),
          blockers: (analysisResult.blockers || []).map(updateItem),
          dependencies: (analysisResult.dependencies || []).map(updateItem),
          people: (analysisResult.people || []).map(updateItem),
          missingInformation: (analysisResult.missingInformation || []).map(updateItem),
        });
      }

      if (res.report) {
        setReportMarkdown(res.report);
      }
    }
  };

  return (
    <div className="w-full bg-transparent min-h-full font-barlow flex flex-col">
      {/* Top Workspace Context Header */}
      <WorkspaceHeader
        projectId={projectId}
        projectName={projectName}
        projectDescription={projectDescription}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateMyProjects={onNavigateMyProjects}
        documentCount={documents.length}
      />

      {/* Main Content Canvas */}
      <div className="max-w-[1360px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Backend Handover Fetch Error Banner */}
        {handoverError && (
          <div className="bg-[#B94A48]/10 border border-[#B94A48]/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#B94A48] text-[13px] animate-fade-in shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#B94A48]" />
              <div className="flex flex-col">
                <span className="font-semibold text-[14px] text-[#252923]">Unable to load project workspace data</span>
                <span className="text-[12px] text-[#77766F] mt-0.5">{handoverError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetryHandover}
              className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] text-[#B94A48] text-[12px] font-semibold border border-[#B94A48]/30 hover:bg-[#B94A48]/10 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Error Notification Banner */}
        {uploadError && (
          <div className="bg-[#B94A48]/10 border border-[#B94A48]/25 rounded-xl p-4 flex items-start justify-between gap-3 text-[#B94A48] text-[13px] animate-fade-in shadow-xs backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#B94A48]" />
              <div className="flex flex-col">
                <span className="font-semibold text-[14px] text-[#252923]">Document Upload Error</span>
                <span className="text-[12px] text-[#77766F] mt-0.5">{uploadError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-[#77766F] hover:text-[#252923] p-1 rounded cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Notification Banner */}
        {uploadSuccessNotice && (
          <div className="bg-[#263B32]/10 border border-[#263B32]/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#263B32] text-[13px] animate-fade-in shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#263B32]" />
              <span className="font-medium text-[#252923]">{uploadSuccessNotice}</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setActiveTab('ai-analysis')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#263B32] text-[#FFFFFF] text-[12px] font-semibold hover:bg-[#34443B] transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>View Findings</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('handover-report')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E0D7] text-[#252923] text-[12px] font-medium hover:bg-[#E7E1D7]/50 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#263B32]" />
                <span>View Report</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadSuccessNotice(null)}
                className="text-[#77766F] hover:text-[#252923] p-1 rounded ml-1 cursor-pointer"
                aria-label="Dismiss message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Documents Library */}
        {activeTab === 'documents' && (
          <>
            {/* Section 1: 4 Compact Workspace Metrics */}
            <WorkspaceMetrics metrics={realMetrics} />

            {/* Section 2: Drag & Drop Upload Zone */}
            <DocumentUploadZone
              projectId={projectId}
              isUploading={isUploading}
              isSampleProject={false}
              onUploadFiles={handleUploadFiles}
              onCreateProjectClick={onCreateProject}
            />

            {/* Section 3: Analysis Summary Card (if analysis is available) */}
            {analysisResult && (
              <AnalysisSummaryCard
                analysis={analysisResult}
                onNavigateTab={setActiveTab}
                documentCount={documents.length}
              />
            )}

            {/* Section 4: Unified Document Library Table */}
            {isLoadingHandover ? (
              <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-8 h-8 rounded-full border-2 border-[#263B32] border-t-transparent animate-spin mb-3" />
                <span className="text-[13px] text-[#77766F] font-medium">
                  Loading persisted project documents...
                </span>
              </div>
            ) : (
              <DocumentTable
                documents={documents}
                onSelectDocument={handleOpenDocDetails}
                onViewFindings={handleOpenDocFindings}
              />
            )}
          </>
        )}

        {/* Tab 2: AI Analysis */}
        {activeTab === 'ai-analysis' && (
          <AiAnalysisView
            analysis={analysisResult}
            projectName={projectName}
            projectId={projectId}
            onNavigateToUpload={() => setActiveTab('documents')}
            onReviewFinding={handleReviewFinding}
          />
        )}

        {/* Tab 3: Evidence Review */}
        {activeTab === 'evidence-review' && (
          <EvidenceReviewView
            analysis={analysisResult}
            onNavigateToUpload={() => setActiveTab('documents')}
          />
        )}

        {/* Tab 4: Handover Report */}
        {activeTab === 'handover-report' && (
          <HandoverReportView
            reportMarkdown={reportMarkdown}
            projectName={projectName}
            onNavigateToUpload={() => setActiveTab('documents')}
          />
        )}

        {/* Tab 5: Overview */}
        {activeTab === 'overview' && (
          <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-6 sm:p-8 flex flex-col gap-5 font-barlow text-[#252923] shadow-xs">
            <div className="flex flex-col gap-1 border-b border-[#E5E0D7] pb-4">
              <span className="text-[11px] uppercase tracking-wider text-[#77766F] font-semibold">
                Project Overview & Status
              </span>
              <h3 className="text-[20px] font-bold text-[#252923]">{projectName}</h3>
              <p className="text-[13px] text-[#77766F] max-w-3xl leading-relaxed">
                {projectDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[11px] text-[#77766F] uppercase font-semibold">
                  Firestore Project ID
                </span>
                <span className="text-[13px] font-mono text-[#263B32] font-semibold break-all">
                  {projectId || 'No Firestore Project ID'}
                </span>
                <span className="text-[11px] text-[#263B32] mt-1 font-medium">
                  Active Firestore Record
                </span>
              </div>

              <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[11px] text-[#77766F] uppercase font-semibold">
                  Persisted Documents
                </span>
                <span className="text-[20px] font-bold text-[#252923]">
                  {documents.length}
                </span>
                <span className="text-[11px] text-[#77766F]">
                  Stored in Firestore documents subcollection
                </span>
              </div>

              <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[11px] text-[#77766F] uppercase font-semibold">
                  Synthesis Status
                </span>
                <span className="text-[14px] font-semibold text-[#252923]">
                  {analysisResult ? 'AI Analysis Available' : 'Awaiting Document Upload'}
                </span>
                <span className="text-[11px] text-[#77766F]">Powered by Gemini 3.5 Flash</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className="px-4 py-2 rounded-lg bg-[#263B32] text-[#FFFFFF] text-[13px] font-semibold hover:bg-[#34443B] transition-colors cursor-pointer"
              >
                Go to Documents Library
              </button>
              {analysisResult && (
                <button
                  type="button"
                  onClick={() => setActiveTab('handover-report')}
                  className="px-4 py-2 rounded-lg bg-[#FFFFFF] border border-[#E5E0D7] text-[#252923] text-[13px] font-medium hover:bg-[#E7E1D7]/50 transition-colors cursor-pointer"
                >
                  View Handover Report
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Document Details & Findings Drawer */}
      <DocumentDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        document={selectedDocForDetails}
        analysis={analysisResult}
        initialTab={detailsDrawerInitialTab}
        onNavigateToAnalysisTab={() => setActiveTab('ai-analysis')}
      />
    </div>
  );
};

export default ProjectWorkspace;
