import React, { useState, useMemo } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  UploadCloud,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Calendar,
  Layers,
  Sparkles,
  Quote,
} from 'lucide-react';

export interface HandoverReportViewProps {
  reportMarkdown: string | null;
  projectName?: string;
  onNavigateToUpload?: () => void;
}

interface ParsedFinding {
  title: string;
  description: string;
  evidenceStatus: 'source-supported' | 'inferred-needs-confirmation' | 'evidence-missing' | string;
  humanReview?: string;
  reviewerNote?: string;
  verificationNote?: string;
  sources: Array<{
    file: string;
    quote?: string;
    page?: string;
  }>;
}

interface ParsedSection {
  title: string;
  level: number;
  content: string[];
  findings: ParsedFinding[];
}

function cleanAndDecodeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#x20;/gi, ' ')
    .replace(/&#32;/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/\\([#*_`~[\]()>\-+!.])/g, '$1')
    .trim();
}

export const HandoverReportView: React.FC<HandoverReportViewProps> = ({
  reportMarkdown,
  projectName = 'Project Workspace',
  onNavigateToUpload,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'document' | 'raw'>('document');

  const sanitizedMarkdown = useMemo(() => {
    if (!reportMarkdown) return '';
    return cleanAndDecodeText(reportMarkdown);
  }, [reportMarkdown]);

  // Parse structured report sections for the executive document layout
  const parsedReport = useMemo(() => {
    if (!sanitizedMarkdown) return null;

    const lines = sanitizedMarkdown.split('\n');
    let title = projectName;
    const headerMeta: Record<string, string> = {};
    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection | null = null;
    let currentFinding: ParsedFinding | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      // H1 Main Title
      if (line.startsWith('# ')) {
        title = cleanAndDecodeText(line.replace(/^#\s+/, '').replace(/\s*—.*$/, ''));
        continue;
      }

      // Blockquote metadata header
      if (line.startsWith('>')) {
        const metaLine = line.replace(/^>\s*/, '').replace(/\\/g, '');
        const match = metaLine.match(/\*\*([^*:]+):\*\*\s*(.*)/);
        if (match) {
          headerMeta[match[1].trim()] = cleanAndDecodeText(match[2].replace(/\\/g, ''));
        }
        continue;
      }

      // H2 Section Title
      if (line.startsWith('## ')) {
        currentFinding = null;
        const sectionTitle = cleanAndDecodeText(line.replace(/^##\s+/, ''));
        currentSection = {
          title: sectionTitle,
          level: 2,
          content: [],
          findings: [],
        };
        sections.push(currentSection);
        continue;
      }

      // H3 Finding Title inside a section
      if (line.startsWith('### ')) {
        const findingTitle = cleanAndDecodeText(line.replace(/^###\s+/, ''));
        currentFinding = {
          title: findingTitle,
          description: '',
          evidenceStatus: 'source-supported',
          sources: [],
        };
        if (currentSection) {
          currentSection.findings.push(currentFinding);
        }
        continue;
      }

      // Evidence status badge line
      if (line.includes('Evidence Status:') || (!line.includes('Human Review:') && line.includes('Status:'))) {
        const lower = line.toLowerCase();
        let status = 'source-supported';
        if (lower.includes('evidence-missing') || lower.includes('evidence missing') || lower.includes('unverified')) {
          status = 'evidence-missing';
        } else if (lower.includes('inferred')) {
          status = 'inferred-needs-confirmation';
        }

        if (currentFinding) {
          currentFinding.evidenceStatus = status;
        }
        continue;
      }

      // Human review status line
      if (line.includes('Human Review:')) {
        const reviewText = cleanAndDecodeText(line.replace(/^-\s*\*\*Human Review:\*\*\s*/i, ''));
        if (currentFinding) {
          currentFinding.humanReview = reviewText;
        }
        continue;
      }

      // Reviewer note line
      if (line.includes('Reviewer Note:')) {
        const noteText = cleanAndDecodeText(line.replace(/^-\s*\*\*Reviewer Note:\*\*\s*/i, ''));
        if (currentFinding) {
          currentFinding.reviewerNote = noteText;
        }
        continue;
      }

      // Verification note
      if (line.startsWith('*Verification:') || line.startsWith('Verification:')) {
        const note = cleanAndDecodeText(line.replace(/^\*?Verification:\*?\s*/, ''));
        if (currentFinding) {
          currentFinding.verificationNote = note;
        }
        continue;
      }

      // Source reference
      if (line.startsWith('- Source:') || line.startsWith('* Source:')) {
        const sourceText = cleanAndDecodeText(line.replace(/^[-*]\s*Source:\s*/, ''));
        const parts = sourceText.split(/[—–-]\s*Quote:\s*/i);
        const filePart = parts[0]?.trim() || '';
        const quotePart = parts[1]?.trim() || '';

        // Extract page if present
        let file = filePart;
        let page: string | undefined;
        const pageMatch = filePart.match(/\(Page\s+([^)]+)\)/i);
        if (pageMatch) {
          page = `Page ${pageMatch[1]}`;
          file = filePart.replace(/\(Page\s+[^)]+\)/i, '').trim();
        }

        if (currentFinding) {
          currentFinding.sources.push({
            file,
            quote: quotePart ? cleanAndDecodeText(quotePart) : undefined,
            page,
          });
        }
        continue;
      }

      // Regular paragraph or finding description
      if (currentFinding && !currentFinding.description) {
        currentFinding.description = cleanAndDecodeText(line);
      } else if (currentSection && !currentFinding) {
        currentSection.content.push(cleanAndDecodeText(line));
      }
    }

    return { title, headerMeta, sections };
  }, [sanitizedMarkdown, projectName]);

  const handleCopy = () => {
    if (!sanitizedMarkdown) return;
    navigator.clipboard.writeText(sanitizedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!sanitizedMarkdown) return;
    const blob = new Blob([sanitizedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_handover_report.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!reportMarkdown) {
    return (
      <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center font-barlow select-none text-[#252923] shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#263B32]/10 border border-[#263B32]/25 flex items-center justify-center text-[#263B32] mb-3">
          <FileText className="w-5 h-5" />
        </div>
        <h3 className="text-[16px] font-semibold text-[#252923] mb-1">
          No Handover Report Generated Yet
        </h3>
        <p className="text-[12px] text-[#77766F] max-w-md mb-6 leading-relaxed">
          Upload project documents to automatically generate a comprehensive, structured HandoverX
          report complete with evidence verification and decision logs.
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

  const renderBadge = (status: string) => {
    switch (status) {
      case 'source-supported':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#263B32]/10 text-[#263B32] border border-[#263B32]/25 shrink-0 leading-none">
            <ShieldCheck className="w-3 h-3 text-[#263B32]" />
            <span>Source-supported</span>
          </span>
        );
      case 'evidence-missing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#B94A48]/10 text-[#B94A48] border border-[#B94A48]/25 shrink-0 leading-none">
            <AlertTriangle className="w-3 h-3 text-[#B94A48]" />
            <span>Evidence missing</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#D6A64F]/15 text-[#91621E] border border-[#D6A64F]/30 shrink-0 leading-none">
            <Clock className="w-3 h-3 text-[#91621E]" />
            <span>Inferred — Needs confirmation</span>
          </span>
        );
    }
  };

  const renderHumanReviewBadge = (text?: string) => {
    if (!text) return null;
    const lower = text.toLowerCase();
    if (lower.includes('approved')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#263B32]/10 text-[#263B32] border border-[#263B32]/25 shrink-0 leading-none">
          <Check className="w-3 h-3 text-[#263B32]" />
          <span>Approved</span>
        </span>
      );
    }
    if (lower.includes('changes requested') || lower.includes('changes-requested')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#D6A64F]/15 text-[#91621E] border border-[#D6A64F]/30 shrink-0 leading-none">
          <AlertTriangle className="w-3 h-3 text-[#91621E]" />
          <span>Changes Requested</span>
        </span>
      );
    }
    if (lower.includes('rejected')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#B94A48]/10 text-[#B94A48] border border-[#B94A48]/25 shrink-0 leading-none">
          <AlertTriangle className="w-3 h-3 text-[#B94A48]" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-[#E7E1D7] text-[#77766F] border border-[#E5E0D7] shrink-0 leading-none">
        <Clock className="w-3 h-3 text-[#77766F]" />
        <span>Pending Review</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4 font-barlow animate-fade-in pb-10 text-[#252923]">
      {/* Top Action & Mode Bar */}
      <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#263B32] to-[#C66A3D] flex items-center justify-center font-bold text-[12px] text-[#FFFFFF] shrink-0 shadow-xs">
            HX
          </div>
          <div className="flex flex-col">
            <h2 className="text-[15px] font-semibold text-[#252923] tracking-tight">
              Project Handover Report
            </h2>
            <span className="text-[10.5px] text-[#77766F]">
              Executive transition packet • Grounded in verified telemetry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#E7E1D7]/50 border border-[#E5E0D7] rounded-md p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode('document')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'document'
                  ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-2xs'
                  : 'text-[#77766F] hover:text-[#252923]'
              }`}
            >
              Document
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-2xs'
                  : 'text-[#77766F] hover:text-[#252923]'
              }`}
            >
              Raw Markdown
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] hover:bg-[#E7E1D7]/50 text-[#252923] text-[11px] font-medium transition-colors cursor-pointer leading-none"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#263B32]" />
                <span className="text-[#263B32] font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#77766F]" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] text-[11px] font-semibold transition-colors cursor-pointer shadow-xs leading-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      {viewMode === 'raw' ? (
        /* Raw Monospace Markdown View */
        <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-5 shadow-xs">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[#252923] bg-[#F7F5F0] p-4 rounded-lg border border-[#E5E0D7] overflow-x-auto selection:bg-[#C66A3D]/20">
            {sanitizedMarkdown}
          </pre>
        </div>
      ) : (
        /* Executive Document Layout */
        <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-6 text-[#252923]">
          {/* 1. Report Header Card */}
          <div className="border-b border-[#E5E0D7] pb-5 flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#77766F]">
                  HandoverX Technical Transition Report
                </span>
                <h1 className="text-[22px] sm:text-[24px] font-bold text-[#252923] tracking-tight mt-0.5">
                  {parsedReport?.title || projectName}
                </h1>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#263B32]/10 text-[#263B32] border border-[#263B32]/25 self-start sm:self-center leading-none">
                <Sparkles className="w-3 h-3 text-[#263B32]" />
                <span>Synthesis Complete</span>
              </span>
            </div>

            {/* Header Metadata Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-[#77766F] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#77766F] uppercase font-medium">Date</span>
                  <span className="text-[11.5px] font-semibold text-[#252923]">
                    {parsedReport?.headerMeta['Generation Date'] ||
                      new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg flex items-center gap-2.5">
                <Layers className="w-3.5 h-3.5 text-[#77766F] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#77766F] uppercase font-medium">
                    Ingested Documents
                  </span>
                  <span className="text-[11.5px] font-semibold text-[#252923]">
                    {parsedReport?.headerMeta['Source Documents Analyzed'] || 'Active Ingestion'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg flex items-center gap-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#263B32] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#77766F] uppercase font-medium">Engine</span>
                  <span className="text-[11.5px] font-semibold text-[#263B32]">
                    Gemini 3.5 Flash Grounded
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sections List */}
          {parsedReport?.sections.map((section, secIdx) => (
            <section key={secIdx} className="flex flex-col gap-3 border-b border-[#E5E0D7] pb-6 last:border-b-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[#263B32] rounded-xs" />
                <h2 className="text-[16px] font-bold text-[#252923] tracking-tight">
                  {section.title}
                </h2>
              </div>

              {/* General Section Prose */}
              {section.content.length > 0 && (
                <div className="flex flex-col gap-2 text-[12px] leading-relaxed text-[#252923]">
                  {section.content.map((p, pIdx) => (
                    <p key={pIdx} className="font-normal">
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {/* Findings Cards Grid */}
              {section.findings.length > 0 && (
                <div className="flex flex-col gap-3 mt-1">
                  {section.findings.map((finding, fIdx) => (
                    <div
                      key={fIdx}
                      className="bg-[#FFFFFF] border border-[#E5E0D7] rounded-lg p-3.5 flex flex-col gap-2.5 hover:border-[#C66A3D]/40 transition-colors shadow-2xs"
                    >
                      {/* Finding Title & Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <h3 className="text-[13px] font-semibold text-[#252923] leading-snug">
                          {finding.title}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {renderBadge(finding.evidenceStatus)}
                          {finding.humanReview && renderHumanReviewBadge(finding.humanReview)}
                        </div>
                      </div>

                      {/* Finding Description */}
                      {finding.description && (
                        <p className="text-[11.5px] text-[#252923] leading-relaxed">
                          {finding.description}
                        </p>
                      )}

                      {/* Reviewer Note */}
                      {finding.reviewerNote && (
                        <div className="text-[10.5px] text-[#77766F] italic bg-[#F7F5F0] px-2.5 py-1.5 rounded border border-[#E5E0D7]">
                          Reviewer note: {finding.reviewerNote}
                        </div>
                      )}

                      {/* Verification Note */}
                      {finding.verificationNote && (
                        <div className="text-[10.5px] text-[#77766F] flex items-center gap-1.5 font-medium">
                          <span>Verification:</span>
                          <span className="text-[#263B32] font-semibold">{finding.verificationNote}</span>
                        </div>
                      )}

                      {/* Source References & Quotations */}
                      {finding.sources.length > 0 && (
                        <div className="mt-1 pt-2 border-t border-[#E5E0D7] flex flex-col gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#77766F]">
                            Source Attribution & Evidence Quotes
                          </span>
                          {finding.sources.map((src, srcIdx) => (
                            <div
                              key={srcIdx}
                              className="p-2.5 bg-[#F7F5F0] border-l-2 border-[#C66A3D] rounded-r-md flex flex-col gap-1 text-[11px]"
                            >
                              <div className="flex items-center gap-2 text-[#252923] font-medium">
                                <FileText className="w-3.5 h-3.5 text-[#263B32]" />
                                <span>{src.file}</span>
                                {src.page && (
                                  <span className="px-1.5 py-0.2 bg-[#E7E1D7] text-[#77766F] rounded text-[9.5px] font-semibold">
                                    {src.page}
                                  </span>
                                )}
                              </div>
                              {src.quote && (
                                <div className="flex items-start gap-1.5 text-[#252923] italic mt-0.5">
                                  <Quote className="w-3 h-3 text-[#77766F] shrink-0 mt-0.5" />
                                  <span>&ldquo;{src.quote}&rdquo;</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Report Footer */}
          <div className="pt-3 border-t border-[#E5E0D7] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-[#77766F]">
            <span>HandoverX Knowledge Continuity Platform • Evidence Verified</span>
            <span>Generated with Gemini 3.5 Flash</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandoverReportView;
