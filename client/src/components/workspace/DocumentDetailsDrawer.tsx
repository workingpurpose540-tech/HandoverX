import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  FileText,
  FileCode,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  HardDrive,
  Hash,
  ExternalLink,
} from 'lucide-react';
import type { WorkspaceDocument } from '../../types/workspace';
import type { AnalysisResult, AnalysisFinding } from '../../services/api';
import { EvidenceStatusBadge } from '../common/EvidenceStatusBadge';

export interface DocumentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: WorkspaceDocument | null;
  analysis: AnalysisResult | null;
  initialTab?: 'overview' | 'findings';
  onNavigateToAnalysisTab?: () => void;
}

export const DocumentDetailsDrawer: React.FC<DocumentDetailsDrawerProps> = ({
  isOpen,
  onClose,
  document,
  analysis,
  initialTab = 'overview',
  onNavigateToAnalysisTab,
}) => {
  const [userTab, setUserTab] = useState<'overview' | 'findings' | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const activeTab = userTab ?? initialTab;

  const handleClose = useCallback(() => {
    setUserTab(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !document) {
    return null;
  }

  // Filter findings that reference this specific document by documentId or sourceFile
  const associatedFindings: { category: string; finding: AnalysisFinding }[] = [];

  if (analysis) {
    type FindingCategoryKey =
      | 'decisions'
      | 'tasks'
      | 'blockers'
      | 'dependencies'
      | 'people'
      | 'missingInformation';

    const categories: { key: FindingCategoryKey; label: string }[] = [
      { key: 'decisions', label: 'Decision' },
      { key: 'tasks', label: 'Task' },
      { key: 'blockers', label: 'Blocker' },
      { key: 'dependencies', label: 'Dependency' },
      { key: 'people', label: 'Stakeholder' },
      { key: 'missingInformation', label: 'Missing Info' },
    ];

    for (const cat of categories) {
      const items = analysis[cat.key];
      if (Array.isArray(items)) {
        for (const item of items) {
          const matches = (item.evidence || []).some(
            (ev) =>
              (ev.documentId && ev.documentId === document.id) ||
              (ev.sourceFile &&
                ev.sourceFile.toLowerCase() === document.name.toLowerCase())
          );
          if (matches) {
            associatedFindings.push({
              category: cat.label,
              finding: item,
            });
          }
        }
      }
    }
  }

  const handleCopyId = () => {
    if (!document) return;
    navigator.clipboard.writeText(document.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const renderFileIcon = () => {
    switch (document.format) {
      case 'PDF':
        return (
          <div className="w-9 h-9 rounded-lg bg-[#B94A48]/10 border border-[#B94A48]/25 text-[#B94A48] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'DOCX':
        return (
          <div className="w-9 h-9 rounded-lg bg-[#263B32]/10 border border-[#263B32]/25 text-[#263B32] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'MD':
        return (
          <div className="w-9 h-9 rounded-lg bg-[#C66A3D]/10 border border-[#C66A3D]/25 text-[#C66A3D] flex items-center justify-center shrink-0">
            <FileCode className="w-4 h-4" />
          </div>
        );
      case 'TXT':
      default:
        return (
          <div className="w-9 h-9 rounded-lg bg-[#E7E1D7] border border-[#E5E0D7] text-[#77766F] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
    }
  };

  const renderStatusBadge = () => {
    switch (document.status) {
      case 'processed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#263B32]/10 text-[#263B32] text-[10px] font-semibold border border-[#263B32]/25 leading-none">
            <CheckCircle2 className="w-3 h-3" />
            Processed & Indexed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D6A64F]/15 text-[#91621E] text-[10px] font-semibold border border-[#D6A64F]/30 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D6A64F] animate-pulse" />
            Processing ({document.statusProgress || 65}%)
          </span>
        );
      case 'uploaded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E7E1D7] text-[#77766F] text-[10px] font-medium border border-[#E5E0D7] leading-none">
            <Clock className="w-3 h-3" />
            Uploaded
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#B94A48]/10 text-[#B94A48] text-[10px] font-semibold border border-[#B94A48]/25 leading-none">
            <AlertTriangle className="w-3 h-3" />
            Parsing Failed
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-barlow antialiased animate-fade-in select-none">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-[#FFFFFF] backdrop-blur-2xl border-l border-[#E5E0D7] shadow-2xl flex flex-col z-50 text-[#252923] animate-slide-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E0D7] bg-[#F7F5F0] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {renderFileIcon()}
            <div className="flex flex-col min-w-0">
              <h2
                className="text-[15px] font-semibold text-[#252923] truncate max-w-sm"
                title={document.name}
              >
                {document.name}
              </h2>
              {document.versionLabel && (
                <span className="text-[11px] text-[#77766F]">
                  {document.versionLabel}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7]/50 transition-colors cursor-pointer shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs inside Drawer */}
        <div className="flex items-center border-b border-[#E5E0D7] px-5 bg-transparent shrink-0">
          <button
            type="button"
            onClick={() => setUserTab('overview')}
            className={`py-2.5 text-[12px] font-medium transition-colors border-b-2 mr-6 cursor-pointer ${
              activeTab === 'overview'
                ? 'text-[#263B32] border-[#263B32] font-semibold'
                : 'text-[#77766F] hover:text-[#252923] border-transparent'
            }`}
          >
            Document Overview
          </button>
          <button
            type="button"
            onClick={() => setUserTab('findings')}
            className={`py-2.5 text-[12px] font-medium transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'findings'
                ? 'text-[#263B32] border-[#263B32] font-semibold'
                : 'text-[#77766F] hover:text-[#252923] border-transparent'
            }`}
          >
            <span>Findings & Evidence</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold leading-none ${
                associatedFindings.length > 0
                  ? 'bg-[#263B32] text-[#FFFFFF]'
                  : 'bg-[#E7E1D7] text-[#77766F]'
              }`}
            >
              {associatedFindings.length}
            </span>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4">
          {activeTab === 'overview' ? (
            <>
              {/* Document Metadata Grid */}
              <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-3.5 flex flex-col gap-2.5">
                <span className="text-[10px] uppercase tracking-wider text-[#77766F] font-semibold">
                  File Attributes & Status
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="flex items-center gap-2 text-[#77766F]">
                    <HardDrive className="w-3.5 h-3.5 text-[#77766F] shrink-0" />
                    <span className="text-[#77766F]">Size:</span>
                    <span className="font-medium text-[#252923]">{document.size}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[#77766F]">
                    <Calendar className="w-3.5 h-3.5 text-[#77766F] shrink-0" />
                    <span className="text-[#77766F]">Uploaded:</span>
                    <span className="font-medium text-[#252923]">{document.uploadDate}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[#77766F]">
                    <Hash className="w-3.5 h-3.5 text-[#77766F] shrink-0" />
                    <span className="text-[#77766F]">Document ID:</span>
                    <span className="font-mono text-[10.5px] text-[#252923] truncate max-w-[120px]">
                      {document.id}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7]/50 cursor-pointer"
                      title="Copy Document ID"
                    >
                      {copiedId ? (
                        <Check className="w-3 h-3 text-[#263B32]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[#77766F]">
                    <span className="text-[#77766F]">Status:</span>
                    {renderStatusBadge()}
                  </div>
                </div>

                {document.errorMessage && (
                  <div className="mt-2 p-2.5 bg-[#B94A48]/10 border border-[#B94A48]/25 rounded text-[#B94A48] text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{document.errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Extracted Text Section */}
              <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#77766F] font-semibold">
                    Extracted Text & Ingestion Content
                  </span>
                  {document.extractedText && document.extractedText.trim().length > 0 ? (
                    <span className="text-[10px] text-[#77766F]">
                      {document.extractedText.length >= 10000
                        ? 'Preview (first 10,000 chars)'
                        : `${document.extractedText.length} characters`}
                    </span>
                  ) : null}
                </div>

                {document.extractedText && document.extractedText.trim().length > 0 ? (
                  <pre className="mt-1 p-3 bg-[#FFFFFF] border border-[#E5E0D7] rounded text-[11px] text-[#252923] font-mono whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
                    {document.extractedText}
                  </pre>
                ) : (
                  <div className="p-3 bg-[#FFFFFF] border border-[#E5E0D7] rounded text-[11px] text-[#77766F] leading-relaxed">
                    <p>
                      {document.status === 'failed'
                        ? 'Text extraction failed for this document. No extracted content is available.'
                        : 'No extracted text preview is available for this document (file may be empty or contain unscannable media).'}
                    </p>
                    <p className="mt-1.5 text-[10.5px] text-[#77766F]">
                      Exact verbatim evidence quotes extracted from this document are indexed in the{' '}
                      <button
                        type="button"
                        onClick={() => setUserTab('findings')}
                        className="text-[#263B32] underline hover:no-underline font-medium cursor-pointer"
                      >
                        Findings & Evidence tab
                      </button>
                      .
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions Card */}
              <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-3.5 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-[12px] font-semibold text-[#252923]">
                    Associated Findings ({associatedFindings.length})
                  </h4>
                  <p className="text-[10.5px] text-[#77766F]">
                    {associatedFindings.length > 0
                      ? 'Review extracted decisions, tasks, and blockers citing this file.'
                      : 'No specific findings cite this document in the current analysis.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setUserTab('findings')}
                  className="px-3 py-1 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                >
                  View Findings
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Tab 2: Findings & Evidence */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-[#252923]">
                      Findings Sourced from &ldquo;{document.name}&rdquo;
                    </h3>
                    <p className="text-[10px] text-[#77766F]">
                      Filtered exclusively by document ID &lsquo;{document.id.slice(0, 8)}...&rsquo; and filename.
                    </p>
                  </div>

                  {onNavigateToAnalysisTab && associatedFindings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onNavigateToAnalysisTab();
                      }}
                      className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#263B32] hover:underline cursor-pointer"
                    >
                      <span>Full Analysis Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {associatedFindings.length === 0 ? (
                  <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-9 h-9 rounded-full bg-[#E7E1D7] border border-[#E5E0D7] flex items-center justify-center text-[#77766F] mb-2">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-[13px] font-semibold text-[#252923]">
                      No Associated Findings for This Document
                    </h4>
                    <p className="text-[11px] text-[#77766F] max-w-sm mt-1 leading-relaxed">
                      The AI synthesis did not extract explicit decisions, tasks, blockers, or dependencies citing{' '}
                      <strong className="text-[#252923]">{document.name}</strong>.
                    </p>
                    <p className="text-[10px] text-[#77766F] mt-2">
                      This file may contain supplementary material or was not cited in the current analysis run.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {associatedFindings.map(({ category, finding }) => {
                      const docEvidence = (finding.evidence || []).filter(
                        (e) =>
                          e.documentId === document.id ||
                          e.sourceFile.toLowerCase() === document.name.toLowerCase()
                      );

                      return (
                        <div
                          key={finding.id}
                          className="bg-[#FFFFFF] border border-[#E5E0D7] rounded-lg p-3 flex flex-col gap-2 hover:border-[#C66A3D]/40 transition-colors shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9.5px] font-mono text-[#77766F] uppercase">
                                {category} • #{finding.id}
                              </span>
                              <h4 className="text-[12.5px] font-semibold text-[#252923] leading-snug">
                                {finding.title}
                              </h4>
                            </div>

                            <EvidenceStatusBadge status={finding.evidenceStatus} />
                          </div>

                          <p className="text-[11.5px] text-[#252923] leading-relaxed">
                            {finding.description}
                          </p>

                          {finding.verificationReason && (
                            <div className="text-[10.5px] text-[#77766F] italic bg-[#F7F5F0] px-2.5 py-1.5 rounded border border-[#E5E0D7]">
                              Verification: {finding.verificationReason}
                            </div>
                          )}

                          {docEvidence.length > 0 && (
                            <div className="mt-1 pt-2 border-t border-[#E5E0D7] flex flex-col gap-1.5">
                              <span className="text-[9.5px] uppercase font-semibold text-[#77766F] tracking-wider">
                                Direct Quote in this Document:
                              </span>
                              {docEvidence.map((ev, i) => (
                                <div
                                  key={i}
                                  className="bg-[#F7F5F0] border border-[#E5E0D7] rounded p-2 text-[10.5px]"
                                >
                                  {ev.pageNumber && (
                                    <span className="text-[9.5px] font-mono text-[#77766F] block mb-0.5">
                                      Page {ev.pageNumber}
                                    </span>
                                  )}
                                  <blockquote className="italic text-[#252923] border-l-2 border-[#C66A3D] pl-2 py-0.5 leading-relaxed">
                                    &ldquo;{ev.quote}&rdquo;
                                  </blockquote>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#E5E0D7] bg-[#F7F5F0] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-1.5 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] hover:bg-[#E7E1D7]/50 text-[#252923] text-[11px] transition-colors cursor-pointer"
          >
            Close Details
          </button>

          {activeTab === 'overview' ? (
            <button
              type="button"
              onClick={() => setUserTab('findings')}
              className="px-3.5 py-1.5 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] text-[11px] font-semibold transition-colors cursor-pointer"
            >
              View Findings ({associatedFindings.length})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setUserTab('overview')}
              className="px-3.5 py-1.5 rounded-md bg-[#E7E1D7] hover:bg-[#E7E1D7]/80 text-[#252923] text-[11px] font-medium transition-colors cursor-pointer"
            >
              Back to Overview
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailsDrawer;
