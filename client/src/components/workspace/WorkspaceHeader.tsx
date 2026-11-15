import React, { useState } from 'react';
import { ChevronRight, Clock, Settings, X, Copy, Check, ShieldCheck, Moon, Sun } from 'lucide-react';
import type { WorkspaceTab } from '../../types/workspace';
import { useTheme } from '../../context/useTheme';

export interface WorkspaceHeaderProps {
  projectId?: string;
  projectName?: string;
  projectDescription?: string;
  activeTab?: WorkspaceTab;
  onTabChange?: (tab: WorkspaceTab) => void;
  onNavigateDashboard?: () => void;
  onNavigateMyProjects?: () => void;
  onProjectSettings?: () => void;
  documentCount?: number;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  projectId,
  projectName = 'Project Workspace',
  projectDescription = 'Technical handover workspace registered in Firestore.',
  activeTab = 'documents',
  onTabChange,
  onNavigateDashboard,
  onNavigateMyProjects,
  onProjectSettings,
  documentCount = 0,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleCopyProjectId = () => {
    if (!projectId) return;
    navigator.clipboard.writeText(projectId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleOpenSettings = () => {
    if (onProjectSettings) {
      onProjectSettings();
    } else {
      setShowSettingsModal(true);
    }
  };

  const tabs: { id: WorkspaceTab; label: string; badge?: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'documents',
      label: 'Documents',
      badge: (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold leading-none ${
            activeTab === 'documents'
              ? 'bg-[#263B32] text-[#FFFFFF]'
              : 'bg-[#E7E1D7]/70 text-[#77766F]'
          }`}
        >
          {documentCount}
        </span>
      ),
    },
    {
      id: 'ai-analysis',
      label: 'AI Analysis',
      badge: <span className="w-1.5 h-1.5 rounded-full bg-[#263B32] inline-block" />,
    },
    { id: 'evidence-review', label: 'Evidence Review' },
    { id: 'handover-report', label: 'Handover Report' },
  ];

  return (
    <section className="w-full bg-transparent border-b border-[#E5E0D7] px-4 sm:px-6 pt-2 pb-0 font-barlow relative select-none">
      <div className="max-w-[1360px] mx-auto flex flex-col gap-2">
        {/* Breadcrumb Navigation */}
        <nav
          className="flex items-center gap-1.5 text-[#77766F] text-[11px] font-medium"
          aria-label="Breadcrumbs"
        >
          <button
            type="button"
            onClick={onNavigateDashboard}
            className="hover:text-[#263B32] transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#77766F]/50 shrink-0" />
          <button
            type="button"
            onClick={onNavigateMyProjects || onNavigateDashboard}
            className="hover:text-[#263B32] transition-colors cursor-pointer"
          >
            My Projects
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#77766F]/50 shrink-0" />
          <span className="text-[#252923] font-medium truncate max-w-xs">{projectName}</span>
        </nav>

        {/* Title & Core Meta Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[22px] font-semibold text-[#252923] tracking-tight leading-tight">
                {projectName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#263B32]/10 border border-[#263B32]/20 text-[#263B32] text-[10px] font-medium leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#263B32] animate-pulse" />
                Active Synthesis
              </span>
              {projectId && (
                <span className="text-[10px] font-mono text-[#77766F] px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] select-all leading-none">
                  ID: #{projectId.slice(0, 8)}
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-[#77766F] max-w-3xl leading-relaxed">
              {projectDescription}
            </p>
          </div>

          {/* Meta Controls & Settings Action */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#77766F] bg-[#FFFFFF]/85 backdrop-blur-md px-2.5 py-1.5 rounded-md border border-[#E5E0D7] shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#263B32] shrink-0" />
              <span>Grounded in Firestore</span>
              <span className="text-[#E5E0D7]">•</span>
              <span className="text-[#252923] font-medium">Workspace Admin</span>
            </div>

            <button
              type="button"
              onClick={handleOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] hover:bg-[#E7E1D7]/60 text-[#252923] text-[11px] font-normal transition-colors cursor-pointer leading-none shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-[#263B32]" />
              <span>Project Settings</span>
            </button>
          </div>
        </div>

        {/* Workspace Sub-Navigation Tabs */}
        <div className="flex items-center gap-6 pt-3 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`pb-2.5 text-[12px] transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-[#252923] font-semibold border-[#263B32]'
                    : 'text-[#77766F] hover:text-[#252923] border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge}
              </button>
            );
          })}
        </div>
      </div>

      {/* Project Settings / Info Modal */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-barlow animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#FFFFFF]/95 backdrop-blur-xl border border-[#E5E0D7] rounded-xl shadow-2xl p-5 flex flex-col gap-4 text-[#252923]">
            <div className="flex items-center justify-between border-b border-[#E5E0D7] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#263B32]" />
                <h3 className="text-[15px] font-semibold text-[#252923]">Project Settings & Info</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7]/50 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#77766F] font-semibold block mb-0.5">
                  Project Name
                </span>
                <span className="font-semibold text-[#252923]">{projectName}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#77766F] font-semibold block mb-0.5">
                  Description
                </span>
                <span className="text-[#77766F] leading-relaxed">{projectDescription}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#77766F] font-semibold block mb-0.5">
                  Firestore Project ID
                </span>
                <div className="flex items-center gap-2 bg-[#F7F5F0] border border-[#E5E0D7] rounded-md p-2 text-[11px] font-mono">
                  <span className="truncate flex-1 text-[#252923]">{projectId || 'None'}</span>
                  {projectId && (
                    <button
                      type="button"
                      onClick={handleCopyProjectId}
                      className="p-1 rounded text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7] transition-colors"
                      title="Copy ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-[#263B32]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-3 bg-[#F7F5F0] border border-[#E5E0D7] rounded-lg">
                  <span className="text-[10.5px] text-[#77766F] block">Ingested Documents</span>
                  <span className="text-[18px] font-bold text-[#252923] mt-0.5 block">{documentCount}</span>
                </div>
                <div className="p-3 bg-[#263B32]/5 border border-[#263B32]/20 rounded-lg">
                  <span className="text-[10.5px] text-[#263B32] block">AI Engine</span>
                  <span className="text-[13px] font-semibold text-[#263B32] flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Gemini 2.5 Flash
                  </span>
                </div>
              </div>

              {/* Theme Toggle Section */}
              <div className="pt-2 border-t border-[#E5E0D7]">
                <span className="text-[10px] uppercase tracking-wider text-[#77766F] font-semibold block mb-1.5">
                  Appearance Theme
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-between p-2 rounded-md border text-[11px] transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-[#263B32] bg-[#263B32]/10 text-[#263B32] font-semibold'
                        : 'border-[#E5E0D7] bg-[#F7F5F0] text-[#77766F] hover:border-[#263B32]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-[#263B32]" />
                      <span>Dark Mode</span>
                    </div>
                    {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#263B32]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-between p-2 rounded-md border text-[11px] transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'border-[#263B32] bg-[#263B32]/10 text-[#263B32] font-semibold'
                        : 'border-[#E5E0D7] bg-[#F7F5F0] text-[#77766F] hover:border-[#263B32]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-[#D6A64F]" />
                      <span>Light Mode</span>
                    </div>
                    {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#263B32]" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E0D7] flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-3.5 py-1.5 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WorkspaceHeader;
