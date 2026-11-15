import React from 'react';
import { Sparkles, ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import type { AnalysisResult } from '../../services/api';
import type { WorkspaceTab } from '../../types/workspace';

export interface AnalysisSummaryCardProps {
  analysis: AnalysisResult;
  onNavigateTab: (tab: WorkspaceTab) => void;
  documentCount?: number;
}

export const AnalysisSummaryCard: React.FC<AnalysisSummaryCardProps> = ({
  analysis,
  onNavigateTab,
  documentCount,
}) => {
  const decisionsCount = analysis.decisions?.length || 0;
  const tasksCount = analysis.tasks?.length || 0;
  const blockersCount = analysis.blockers?.length || 0;
  const dependenciesCount = analysis.dependencies?.length || 0;
  const totalFindings = decisionsCount + tasksCount + blockersCount + dependenciesCount;

  return (
    <section className="w-full bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-5 shadow-xs font-barlow relative overflow-hidden select-none animate-fade-in text-[#252923]">
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#C66A3D]/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

      <div className="flex flex-col gap-4 relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D7] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#263B32]/10 border border-[#263B32]/25 text-[#263B32] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-[#252923]">
                  Gemini AI Handover Synthesis Complete
                </h3>
                <span className="px-2 py-0.2 rounded-full bg-[#263B32]/10 text-[#263B32] text-[9.5px] font-semibold border border-[#263B32]/25 leading-none">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-[#77766F] mt-0.5">
                {documentCount ? `${documentCount} documents ingested & cross-referenced` : 'Document findings extracted'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('ai-analysis')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] text-[11px] font-semibold transition-colors cursor-pointer shadow-xs leading-none"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <span>Explore findings</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('handover-report')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] hover:bg-[#E7E1D7]/50 text-[#252923] text-[11px] font-medium transition-colors cursor-pointer leading-none"
            >
              <FileText className="w-3.5 h-3.5 text-[#77766F]" />
              <span>Read report</span>
            </button>
          </div>
        </div>

        {/* Project Summary */}
        {analysis.projectSummary && (
          <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-3">
            <span className="text-[10px] uppercase tracking-wider text-[#77766F] font-semibold block mb-1">
              Project Executive Summary
            </span>
            <p className="text-[12px] text-[#252923] leading-relaxed">
              {analysis.projectSummary}
            </p>
          </div>
        )}

        {/* Synthesis Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-0.5">
          <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-[#77766F] uppercase font-medium">Key Decisions</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-[20px] font-bold text-[#252923] leading-none">{decisionsCount}</span>
              <span className="text-[9.5px] font-semibold text-[#263B32]">Recorded</span>
            </div>
          </div>

          <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-[#77766F] uppercase font-medium">Pending Tasks</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-[20px] font-bold text-[#252923] leading-none">{tasksCount}</span>
              <span className="text-[9.5px] font-semibold text-[#91621E]">To complete</span>
            </div>
          </div>

          <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-[#77766F] uppercase font-medium">Blockers & Risks</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-[20px] font-bold text-[#252923] leading-none">{blockersCount}</span>
              <span className="text-[9.5px] font-semibold text-[#B94A48]">Flagged</span>
            </div>
          </div>

          <div className="bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-[#77766F] uppercase font-medium">Total Findings</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-[20px] font-bold text-[#252923] leading-none">{totalFindings}</span>
              <span className="text-[9.5px] font-semibold text-[#263B32]">Synthesized</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalysisSummaryCard;
