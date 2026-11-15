import React from 'react';
import { ShieldCheck, CheckCircle2, HelpCircle, FileText, UploadCloud } from 'lucide-react';
import type { AnalysisResult, AnalysisFindingEvidence } from '../../services/api';

export interface EvidenceReviewViewProps {
  analysis: AnalysisResult | null;
  onNavigateToUpload?: () => void;
}

interface EvidenceRow extends AnalysisFindingEvidence {
  findingTitle: string;
  findingCategory: string;
}

export const EvidenceReviewView: React.FC<EvidenceReviewViewProps> = ({
  analysis,
  onNavigateToUpload,
}) => {
  if (!analysis) {
    return (
      <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center font-barlow select-none text-[#252923] shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#263B32]/10 border border-[#263B32]/25 flex items-center justify-center text-[#263B32] mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-[16px] font-semibold text-[#252923] mb-1">
          No Evidence Extracted Yet
        </h3>
        <p className="text-[12px] text-[#77766F] max-w-md mb-6 leading-relaxed">
          Upload project documents to cross-reference evidence quotes and verify claims against source files.
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

  // Flatten all evidence items across categories
  const evidenceList: EvidenceRow[] = [];
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
    { key: 'people', label: 'Role' },
    { key: 'missingInformation', label: 'Gap' },
  ];

  for (const cat of categories) {
    const list = analysis[cat.key];
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item.evidence && Array.isArray(item.evidence)) {
          for (const ev of item.evidence) {
            evidenceList.push({
              ...ev,
              findingTitle: item.title,
              findingCategory: cat.label,
            });
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 font-barlow animate-fade-in text-[#252923] select-none">
      <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#263B32]/10 border border-[#263B32]/25 text-[#263B32] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#252923]">
              Source Evidence Audit Log
            </h2>
            <span className="text-[11px] text-[#77766F]">
              {evidenceList.length} evidence quotes cross-referenced with source files
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11.5px] min-w-[720px]">
            <thead>
              <tr className="border-b border-[#E5E0D7] bg-[#F7F5F0] text-[10px] text-[#77766F] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Source Document</th>
                <th className="py-2.5 px-4 font-medium">Related Finding</th>
                <th className="py-2.5 px-4 font-medium">Direct Quote</th>
                <th className="py-2.5 px-4 font-medium">Location</th>
                <th className="py-2.5 px-4 font-medium text-right">Quote Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D7] text-[#252923]">
              {evidenceList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#77766F] text-[11px]">
                    No explicit quotes were cited in the analyzed documents.
                  </td>
                </tr>
              ) : (
                evidenceList.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-[#E7E1D7]/40 transition-colors">
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#263B32] shrink-0" />
                        <span className="truncate max-w-[180px]">{ev.sourceFile}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] uppercase font-mono text-[#77766F]">
                          {ev.findingCategory}
                        </span>
                        <span className="font-medium text-[#252923] truncate max-w-[200px]">
                          {ev.findingTitle}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <blockquote className="italic text-[#252923]/90 border-l-2 border-[#C66A3D] pl-2 max-w-sm text-[11px] leading-relaxed">
                        &ldquo;{ev.quote}&rdquo;
                      </blockquote>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[10px] text-[#77766F]">
                      {ev.pageNumber ? `Page ${ev.pageNumber}` : ev.section || 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {ev.verified ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#263B32]/10 text-[#263B32] text-[9.5px] font-medium border border-[#263B32]/25 leading-none"
                          title="Exact verbatim quote verified in source text"
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#263B32]" />
                          Quote Verified
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D6A64F]/15 text-[#8F6A17] text-[9.5px] font-medium border border-[#D6A64F]/30 leading-none"
                          title="Extracted by AI; verbatim quote not confirmed"
                        >
                          <HelpCircle className="w-3 h-3 text-[#D6A64F]" />
                          Quote Unverified
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EvidenceReviewView;
