import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  FileText,
  User,
  GitBranch,
  ShieldAlert,
  ArrowUpRight,
  UploadCloud,
  Clock,
  XCircle,
  AlertCircle,
  Edit3,
  MessageSquare,
  Loader2,
  Check,
  X,
  Filter,
  GitCompare,
} from 'lucide-react';
import type { AnalysisResult, AnalysisFinding, HumanReviewStatus } from '../../services/api';
import { EvidenceStatusBadge } from '../common/EvidenceStatusBadge';

export interface AiAnalysisViewProps {
  analysis: AnalysisResult | null;
  projectName?: string;
  projectId?: string;
  onNavigateToUpload?: () => void;
  onReviewFinding?: (
    findingId: string,
    status: HumanReviewStatus,
    comment?: string,
    editedTitle?: string,
    editedDescription?: string
  ) => Promise<void>;
}

export const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({
  analysis,
  projectName = 'Project Workspace',
  onNavigateToUpload,
  onReviewFinding,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | HumanReviewStatus>('all');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal / Inline Edit state
  const [editingFinding, setEditingFinding] = useState<{
    id: string;
    title: string;
    description: string;
    comment: string;
    targetStatus: HumanReviewStatus;
  } | null>(null);

  if (!analysis) {
    return (
      <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center font-barlow select-none text-[#252923] shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#263B32]/10 border border-[#263B32]/25 flex items-center justify-center text-[#263B32] mb-3">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="text-[16px] font-semibold text-[#252923] mb-1">
          No AI Analysis Available Yet
        </h3>
        <p className="text-[12px] text-[#77766F] max-w-md mb-6 leading-relaxed">
          Upload project documents (PDF, DOCX, TXT, MD) to trigger Gemini AI text extraction,
          evidence verification, and automatic handover knowledge synthesis.
        </p>
        <button
          type="button"
          onClick={onNavigateToUpload}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] text-[11.5px] font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Documents in Library</span>
        </button>
      </div>
    );
  }

  // Aggregate all findings for counts
  const allFindings = [
    ...(analysis.decisions || []),
    ...(analysis.tasks || []),
    ...(analysis.blockers || []),
    ...(analysis.dependencies || []),
    ...(analysis.people || []),
    ...(analysis.missingInformation || []),
  ];

  const approvedCount = allFindings.filter((f) => f.reviewStatus === 'approved').length;
  const changesCount = allFindings.filter((f) => f.reviewStatus === 'changes-requested').length;
  const rejectedCount = allFindings.filter((f) => f.reviewStatus === 'rejected').length;
  const pendingCount = allFindings.filter(
    (f) => !f.reviewStatus || f.reviewStatus === 'pending-review'
  ).length;

  const handleQuickStatus = async (finding: AnalysisFinding, status: HumanReviewStatus) => {
    if (!onReviewFinding || submittingId) return;
    setSubmittingId(finding.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      await onReviewFinding(finding.id, status, undefined, undefined, undefined);
      setActionSuccess(`Finding "${finding.title.slice(0, 30)}..." marked as ${status.replace('-', ' ')}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save review decision.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSaveEditAndReview = async () => {
    if (!editingFinding || !onReviewFinding || submittingId) return;
    setSubmittingId(editingFinding.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      await onReviewFinding(
        editingFinding.id,
        editingFinding.targetStatus,
        editingFinding.comment.trim() ? editingFinding.comment.trim() : undefined,
        editingFinding.title.trim() ? editingFinding.title.trim() : undefined,
        editingFinding.description.trim() ? editingFinding.description.trim() : undefined
      );
      setActionSuccess(`Review saved with status: ${editingFinding.targetStatus.replace('-', ' ')}.`);
      setEditingFinding(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save review decision.');
    } finally {
      setSubmittingId(null);
    }
  };

  const renderReviewStatusBadge = (status?: HumanReviewStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#263B32]/10 text-[#263B32] border border-[#263B32]/25 shrink-0 leading-none">
            <CheckCircle2 className="w-3 h-3 text-[#263B32]" />
            <span>Approved</span>
          </span>
        );
      case 'changes-requested':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#C66A3D]/12 text-[#C66A3D] border border-[#C66A3D]/30 shrink-0 leading-none">
            <AlertCircle className="w-3 h-3 text-[#C66A3D]" />
            <span>Changes Requested</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#B94A48]/12 text-[#B94A48] border border-[#B94A48]/30 shrink-0 leading-none">
            <XCircle className="w-3 h-3 text-[#B94A48]" />
            <span>Rejected</span>
          </span>
        );
      case 'pending-review':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-[#E7E1D7] text-[#77766F] border border-[#E5E0D7] shrink-0 leading-none">
            <Clock className="w-3 h-3 text-[#77766F]" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  const filterMatches = (f: AnalysisFinding): boolean => {
    if (activeFilter === 'all') return true;
    const s = f.reviewStatus || 'pending-review';
    return s === activeFilter;
  };

  const renderFindingCard = (finding: AnalysisFinding, category: string) => {
    const isCurrentSubmitting = submittingId === finding.id;
    const currentReviewStatus = finding.reviewStatus || 'pending-review';

    return (
      <div
        key={finding.id}
        className="bg-[#FFFFFF] border border-[#E5E0D7] rounded-lg p-3.5 flex flex-col gap-2.5 hover:border-[#C66A3D]/40 transition-colors select-none shadow-2xs"
      >
        {/* Top Header: Category & Dual Status Badges */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9.5px] font-mono text-[#77766F] uppercase">
              {category} • #{finding.id.slice(0, 8)}
            </span>
            <h4 className="text-[13px] font-semibold text-[#252923] leading-snug">
              {finding.title}
            </h4>
          </div>

          {/* Badges Container: Evidence Status + Human Review Status */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <EvidenceStatusBadge status={finding.evidenceStatus} />
            {renderReviewStatusBadge(finding.reviewStatus)}
          </div>
        </div>

        {/* Description */}
        <p className="text-[11.5px] text-[#252923] leading-relaxed">
          {finding.description}
        </p>

        {/* Verification Note (Evidence Grounding) */}
        {finding.verificationReason && (
          <div className="text-[10.5px] text-[#77766F] italic bg-[#F7F5F0] px-2.5 py-1.5 rounded border border-[#E5E0D7]">
            Verification note: {finding.verificationReason}
          </div>
        )}

        {/* Source Evidence Citations */}
        {finding.evidence && finding.evidence.length > 0 && (
          <div className="mt-1 pt-2 border-t border-[#E5E0D7] flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-[#77766F] uppercase tracking-wider">
              Document Evidence (Verbatim Citations)
            </span>
            {finding.evidence.map((ev, i) => (
              <div
                key={i}
                className="bg-[#F7F5F0] border border-[#E5E0D7] rounded p-2.5 text-[10.5px] flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-[#77766F]">
                  <span className="font-semibold text-[#252923] flex items-center gap-1 truncate">
                    <FileText className="w-3.5 h-3.5 text-[#263B32] shrink-0" />
                    {ev.sourceFile}
                  </span>
                  {ev.pageNumber && (
                    <span className="text-[#77766F] font-mono text-[9.5px]">
                      Page {ev.pageNumber}
                    </span>
                  )}
                </div>
                {ev.quote && (
                  <blockquote className="text-[#252923] italic border-l-2 border-[#C66A3D] pl-2 py-0.5 my-0.5 leading-relaxed">
                    &ldquo;{ev.quote}&rdquo;
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Review Audit Info (if reviewed) */}
        {finding.review && (
          <div className="mt-1 p-2 bg-[#F7F5F0] border border-[#E5E0D7] rounded text-[10.5px] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#77766F]">
              <span>
                Reviewed by{' '}
                <strong className="text-[#252923] font-semibold">
                  {finding.review.reviewerEmail || 'Team Reviewer'}
                </strong>
              </span>
              {finding.review.reviewedAt && (
                <span className="font-mono text-[9.5px]">
                  {new Date(finding.review.reviewedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
            {finding.review.comment && (
              <p className="text-[#252923] italic border-l border-[#E5E0D7] pl-2 mt-0.5">
                &ldquo;{finding.review.comment}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Functional Human Review Action Bar */}
        <div className="mt-2 pt-2.5 border-t border-[#E5E0D7] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Approve Button */}
            <button
              type="button"
              disabled={isCurrentSubmitting || currentReviewStatus === 'approved'}
              onClick={() => handleQuickStatus(finding, 'approved')}
              className={`px-2.5 py-1 rounded text-[10.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                currentReviewStatus === 'approved'
                  ? 'bg-[#263B32] text-[#FFFFFF] border border-[#263B32] cursor-default'
                  : 'bg-[#FFFFFF] hover:bg-[#263B32]/10 text-[#252923] border border-[#E5E0D7]'
              }`}
              title="Confirm that a human expert verified and approved this finding"
            >
              {isCurrentSubmitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              <span>Approve</span>
            </button>

            {/* Request Changes Button */}
            <button
              type="button"
              disabled={isCurrentSubmitting}
              onClick={() =>
                setEditingFinding({
                  id: finding.id,
                  title: finding.title,
                  description: finding.description,
                  comment: finding.review?.comment || '',
                  targetStatus: 'changes-requested',
                })
              }
              className={`px-2.5 py-1 rounded text-[10.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                currentReviewStatus === 'changes-requested'
                  ? 'bg-[#C66A3D] text-[#FFFFFF] border border-[#C66A3D]'
                  : 'bg-[#FFFFFF] hover:bg-[#C66A3D]/10 text-[#252923] border border-[#E5E0D7]'
              }`}
              title="Request modifications or further validation"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Request Changes</span>
            </button>

            {/* Reject Button */}
            <button
              type="button"
              disabled={isCurrentSubmitting || currentReviewStatus === 'rejected'}
              onClick={() => handleQuickStatus(finding, 'rejected')}
              className={`px-2.5 py-1 rounded text-[10.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                currentReviewStatus === 'rejected'
                  ? 'bg-[#B94A48] text-[#FFFFFF] border border-[#B94A48] cursor-default'
                  : 'bg-[#FFFFFF] hover:bg-[#B94A48]/10 text-[#252923] border border-[#E5E0D7]'
              }`}
              title="Mark finding as rejected or invalidated"
            >
              <X className="w-3 h-3" />
              <span>Reject</span>
            </button>
          </div>

          {/* Edit / Add Note Button */}
          <button
            type="button"
            disabled={isCurrentSubmitting}
            onClick={() =>
              setEditingFinding({
                id: finding.id,
                title: finding.title,
                description: finding.description,
                comment: finding.review?.comment || '',
                targetStatus: finding.reviewStatus || 'approved',
              })
            }
            className="px-2 py-1 rounded text-[10px] font-medium text-[#77766F] hover:text-[#263B32] hover:bg-[#E7E1D7]/50 transition-colors flex items-center gap-1 cursor-pointer"
            title="Edit finding text or add reviewer comments"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit / Feedback</span>
          </button>
        </div>
      </div>
    );
  };

  const sections = [
    {
      title: 'Key Decisions',
      icon: CheckCircle2,
      category: 'DECISION',
      items: (analysis.decisions || []).filter(filterMatches),
      emptyText: 'No decisions match the selected review filter.',
    },
    {
      title: 'Pending Tasks & Action Items',
      icon: ArrowUpRight,
      category: 'TASK',
      items: (analysis.tasks || []).filter(filterMatches),
      emptyText: 'No pending tasks match the selected review filter.',
    },
    {
      title: 'Blockers & Risks',
      icon: ShieldAlert,
      category: 'BLOCKER',
      items: (analysis.blockers || []).filter(filterMatches),
      emptyText: 'No blockers match the selected review filter.',
    },
    {
      title: 'System Dependencies',
      icon: GitBranch,
      category: 'DEPENDENCY',
      items: (analysis.dependencies || []).filter(filterMatches),
      emptyText: 'No dependencies match the selected review filter.',
    },
    {
      title: 'Key Stakeholders & Responsibilities',
      icon: User,
      category: 'PERSON',
      items: (analysis.people || []).filter(filterMatches),
      emptyText: 'No stakeholder findings match the selected review filter.',
    },
    {
      title: 'Missing Information & Questions',
      icon: HelpCircle,
      category: 'MISSING',
      items: (analysis.missingInformation || []).filter(filterMatches),
      emptyText: 'No documentation gaps match the selected review filter.',
    },
  ];

  return (
    <div className="flex flex-col gap-5 font-barlow animate-fade-in text-[#252923]">
      {/* Top Banner & Governance Overview */}
      <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-4 sm:p-5 flex flex-col gap-3 select-none shadow-xs text-[#252923]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#263B32]" />
            <h2 className="text-[16px] font-semibold text-[#252923]">
              Structured Findings & Human Review — {analysis.projectName || projectName}
            </h2>
          </div>

          {/* Quick Review Progress Pill */}
          <div className="flex items-center gap-2 text-[10.5px]">
            <span className="text-[#77766F]">Review Progress:</span>
            <span className="font-semibold text-[#263B32]">{approvedCount} approved</span>
            <span className="text-[#E5E0D7]">•</span>
            <span className="text-[#91621E] font-medium">{changesCount} changes</span>
            <span className="text-[#E5E0D7]">•</span>
            <span className="text-[#B94A48] font-medium">{rejectedCount} rejected</span>
            <span className="text-[#E5E0D7]">•</span>
            <span className="text-[#77766F]">{pendingCount} pending</span>
          </div>
        </div>

        {analysis.projectSummary && (
          <p className="text-[12px] text-[#252923] leading-relaxed max-w-4xl">
            {analysis.projectSummary}
          </p>
        )}

        {/* Feedback / Alert Notices */}
        {actionSuccess && (
          <div className="p-2.5 rounded-lg bg-[#263B32]/10 border border-[#263B32]/25 text-[#263B32] text-[11px] flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-2.5 rounded-lg bg-[#B94A48]/10 border border-[#B94A48]/25 text-[#B94A48] text-[11px] flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Interactive Filter Strip */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#E5E0D7] overflow-x-auto pb-0.5">
          <div className="flex items-center gap-1 text-[10.5px] text-[#77766F] mr-2 shrink-0">
            <Filter className="w-3 h-3" />
            <span>Filter by Review Status:</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded text-[10.5px] font-medium transition-all cursor-pointer shrink-0 ${
              activeFilter === 'all'
                ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-2xs'
                : 'bg-[#E7E1D7]/60 text-[#77766F] hover:text-[#252923]'
            }`}
          >
            All Findings ({allFindings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pending-review')}
            className={`px-2.5 py-1 rounded text-[10.5px] font-medium transition-all cursor-pointer shrink-0 ${
              activeFilter === 'pending-review'
                ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-2xs'
                : 'bg-[#E7E1D7]/60 text-[#77766F] hover:text-[#252923]'
            }`}
          >
            Pending Review ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('approved')}
            className={`px-2.5 py-1 rounded text-[10.5px] font-medium transition-all cursor-pointer shrink-0 ${
              activeFilter === 'approved'
                ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-2xs'
                : 'bg-[#E7E1D7]/60 text-[#77766F] hover:text-[#252923]'
            }`}
          >
            Approved ({approvedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('changes-requested')}
            className={`px-2.5 py-1 rounded text-[10.5px] font-medium transition-all cursor-pointer shrink-0 ${
              activeFilter === 'changes-requested'
                ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-2xs'
                : 'bg-[#E7E1D7]/60 text-[#77766F] hover:text-[#252923]'
            }`}
          >
            Changes Requested ({changesCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('rejected')}
            className={`px-2.5 py-1 rounded text-[10.5px] font-medium transition-all cursor-pointer shrink-0 ${
              activeFilter === 'rejected'
                ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-2xs'
                : 'bg-[#E7E1D7]/60 text-[#77766F] hover:text-[#252923]'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Cross-Document Conflicts & Contradictions Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#91621E]" />
            <h3 className="text-[14px] font-semibold text-[#252923]">
              Cross-Document Contradictions & Conflicts
            </h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border leading-none ${
                (analysis.conflicts || []).length > 0
                  ? 'bg-[#D6A64F]/15 border-[#D6A64F]/30 text-[#91621E]'
                  : 'bg-[#E7E1D7] border-[#E5E0D7] text-[#77766F]'
              }`}
            >
              {(analysis.conflicts || []).length}
            </span>
          </div>
        </div>

        {(!analysis.conflicts || analysis.conflicts.length === 0) ? (
          <div className="bg-[#FFFFFF]/70 border border-[#E5E0D7] rounded-lg p-3.5 text-[11px] text-[#252923] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#263B32] shrink-0" />
              <span>
                No cross-document contradictions identified across uploaded documentation.
              </span>
            </div>
            <span className="text-[10px] text-[#77766F] italic">
              Note: Absence of detected contradictions does not guarantee full reconciliation.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {analysis.conflicts.map((conflict, cIdx) => (
              <div
                key={conflict.id || cIdx}
                className="bg-[#FFFFFF] backdrop-blur-md border border-[#E5E0D7] rounded-lg p-4 flex flex-col gap-3 shadow-xs text-[#252923]"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9.5px] font-mono text-[#91621E] uppercase font-semibold">
                      CROSS-DOCUMENT CONFLICT • #{conflict.id.slice(0, 8)}
                    </span>
                    <h4 className="text-[13.5px] font-semibold text-[#252923]">
                      {conflict.title}
                    </h4>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold border shrink-0 leading-none ${
                      conflict.resolutionStatus === 'resolved'
                        ? 'bg-[#263B32]/10 text-[#263B32] border-[#263B32]/25'
                        : 'bg-[#D6A64F]/15 text-[#91621E] border-[#D6A64F]/30'
                    }`}
                  >
                    {conflict.resolutionStatus === 'resolved' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-[#263B32]" />
                        <span>Resolved by Human Reviewer</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-[#91621E]" />
                        <span>Unresolved — Human Decision Required</span>
                      </>
                    )}
                  </span>
                </div>

                <p className="text-[11.5px] text-[#252923] leading-relaxed">
                  {conflict.description}
                </p>

                {/* Conflicting Claims Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {(conflict.claims || []).map((cl, clIdx) => (
                    <div
                      key={clIdx}
                      className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#252923] uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#263B32]" />
                          <span>{cl.sourceFile}</span>
                          {cl.pageNumber && (
                            <span className="text-[#77766F] font-mono text-[9px]">
                              p.{cl.pageNumber}
                            </span>
                          )}
                        </span>
                        <EvidenceStatusBadge status={cl.evidenceStatus} />
                      </div>

                      <p className="text-[11.5px] font-medium text-[#252923]">
                        &ldquo;{cl.claim}&rdquo;
                      </p>

                      {cl.quote && (
                        <blockquote className="text-[10.5px] text-[#252923] italic border-l-2 border-[#C66A3D] pl-2 py-0.5 mt-0.5 leading-relaxed bg-[#FFFFFF] rounded-r">
                          &ldquo;{cl.quote}&rdquo;
                        </blockquote>
                      )}
                    </div>
                  ))}
                </div>

                {/* Audit trail / Review info */}
                {conflict.review && (
                  <div className="p-2 bg-[#F7F5F0] border border-[#E5E0D7] rounded text-[10.5px] flex flex-col gap-1">
                    <span className="text-[#77766F]">
                      Resolution recorded by{' '}
                      <strong className="text-[#252923] font-semibold">
                        {conflict.review.reviewerEmail || 'Team Reviewer'}
                      </strong>
                    </span>
                    {conflict.review.comment && (
                      <p className="text-[#252923] italic pl-2 border-l border-[#E5E0D7]">
                        Rationale: &ldquo;{conflict.review.comment}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Conflict Resolution Action Bar */}
                <div className="pt-2 border-t border-[#E5E0D7] flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10.5px] text-[#77766F] italic">
                    Human review required: HandoverX does not auto-select which document is authoritative.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submittingId === conflict.id}
                      onClick={() =>
                        setEditingFinding({
                          id: conflict.id,
                          title: conflict.title,
                          description: conflict.description,
                          comment: conflict.review?.comment || '',
                          targetStatus: 'approved',
                        })
                      }
                      className="px-3 py-1 rounded text-[10.5px] font-semibold bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Record human resolution rationale for this conflict"
                    >
                      <Check className="w-3 h-3" />
                      <span>{conflict.resolutionStatus === 'resolved' ? 'Edit Resolution' : 'Resolve Conflict'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Finding Sections */}
      <div className="flex flex-col gap-5">
        {sections.map((sec) => (
          <div key={sec.title} className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <sec.icon className="w-4 h-4 text-[#263B32]" />
                <h3 className="text-[14px] font-semibold text-[#252923]">{sec.title}</h3>
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-[#E7E1D7] border border-[#E5E0D7] text-[#77766F] leading-none">
                  {sec.items.length}
                </span>
              </div>
            </div>

            {sec.items.length === 0 ? (
              <div className="bg-[#FFFFFF]/60 border border-[#E5E0D7] rounded-lg p-3 text-[11px] text-[#77766F] italic">
                {sec.emptyText}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sec.items.map((item) => renderFindingCard(item, sec.category))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Inline Reviewer Edit / Feedback Dialog */}
      {editingFinding && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="bg-[#FFFFFF] border border-[#E5E0D7] rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4 text-[#252923] animate-fade-in">
            <div className="flex items-start justify-between border-b border-[#E5E0D7] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#263B32]" />
                <h3 className="text-[14px] font-semibold text-[#252923]">
                  Reviewer Decision & Corrections
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingFinding(null)}
                className="p-1 rounded text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7]/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Status Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] uppercase tracking-wider text-[#77766F] font-semibold">
                Set Human Review Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingFinding({ ...editingFinding, targetStatus: 'approved' })
                  }
                  className={`py-1.5 px-2 rounded text-[11px] font-semibold transition-all border ${
                    editingFinding.targetStatus === 'approved'
                      ? 'bg-[#263B32]/10 text-[#263B32] border-[#263B32]'
                      : 'bg-[#F7F5F0] text-[#77766F] border-[#E5E0D7] hover:bg-[#E7E1D7]/50'
                  }`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingFinding({ ...editingFinding, targetStatus: 'changes-requested' })
                  }
                  className={`py-1.5 px-2 rounded text-[11px] font-semibold transition-all border ${
                    editingFinding.targetStatus === 'changes-requested'
                      ? 'bg-[#D6A64F]/15 text-[#91621E] border-[#D6A64F]'
                      : 'bg-[#F7F5F0] text-[#77766F] border-[#E5E0D7] hover:bg-[#E7E1D7]/50'
                  }`}
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingFinding({ ...editingFinding, targetStatus: 'rejected' })
                  }
                  className={`py-1.5 px-2 rounded text-[11px] font-semibold transition-all border ${
                    editingFinding.targetStatus === 'rejected'
                      ? 'bg-[#B94A48]/10 text-[#B94A48] border-[#B94A48]'
                      : 'bg-[#F7F5F0] text-[#77766F] border-[#E5E0D7] hover:bg-[#E7E1D7]/50'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>

            {/* Title correction */}
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] uppercase tracking-wider text-[#77766F] font-semibold">
                Finding Title (Editable)
              </label>
              <input
                type="text"
                value={editingFinding.title}
                onChange={(e) =>
                  setEditingFinding({ ...editingFinding, title: e.target.value })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-[#F7F5F0] border border-[#E5E0D7] text-[#252923] text-[12px] focus:outline-none focus:border-[#263B32]"
              />
            </div>

            {/* Description correction */}
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] uppercase tracking-wider text-[#77766F] font-semibold">
                Finding Description (Editable)
              </label>
              <textarea
                rows={3}
                value={editingFinding.description}
                onChange={(e) =>
                  setEditingFinding({ ...editingFinding, description: e.target.value })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-[#F7F5F0] border border-[#E5E0D7] text-[#252923] text-[11.5px] focus:outline-none focus:border-[#263B32] resize-none"
              />
            </div>

            {/* Reviewer Note / Feedback */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-[#77766F] font-semibold">
                <MessageSquare className="w-3 h-3 text-[#263B32]" />
                <span>Reviewer Comment / Action Note</span>
              </div>
              <textarea
                rows={2}
                placeholder="Optional reviewer notes, rationale, or instructions for the team..."
                value={editingFinding.comment}
                onChange={(e) =>
                  setEditingFinding({ ...editingFinding, comment: e.target.value })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-[#F7F5F0] border border-[#E5E0D7] text-[#252923] text-[11.5px] focus:outline-none focus:border-[#263B32] resize-none placeholder:text-[#77766F]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D7]">
              <button
                type="button"
                onClick={() => setEditingFinding(null)}
                className="px-3 py-1.5 rounded-md text-[11.5px] text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7]/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingId === editingFinding.id}
                onClick={handleSaveEditAndReview}
                className="px-4 py-1.5 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] text-[11.5px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {submittingId === editingFinding.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Review Decision</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisView;