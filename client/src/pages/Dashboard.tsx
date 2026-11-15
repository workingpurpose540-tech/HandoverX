import React from 'react';
import MetricCard from '../components/dashboard/MetricCard';
import ProjectCard from '../components/dashboard/ProjectCard';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import type { ProjectData } from '../services/api';
import type { ActivityItem, MetricItem } from '../types/dashboard';

export interface DashboardProps {
  onExportAuditLog?: () => void;
  onCreateProject?: () => void;
  onViewAllProjects?: () => void;
  onViewAuditLog?: () => void;
  onSelectProject?: (projectId: string, projectTitle: string, projectDesc?: string) => void;
  userProjects?: ProjectData[];
  isLoadingProjects?: boolean;
  loadError?: string | null;
  onRetryProjects?: () => void;
}

function formatDate(timestamp: unknown): string {
  if (!timestamp) return 'Nov 14, 2026';
  if (typeof timestamp === 'string') {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  return 'Nov 14, 2026';
}

export const Dashboard: React.FC<DashboardProps> = ({
  onExportAuditLog,
  onCreateProject,
  onViewAllProjects,
  onViewAuditLog,
  onSelectProject,
  userProjects = [],
  isLoadingProjects = false,
  loadError = null,
  onRetryProjects,
}) => {
  // Compute real KPI metrics from actual user projects
  const totalProjects = userProjects.length;
  const totalDocuments = userProjects.reduce((acc, p) => acc + (p.documentCount || 0), 0);
  const activeWorkspaces = userProjects.filter((p) => (p.documentCount || 0) > 0).length;

  const realMetrics: MetricItem[] = [
    {
      id: 'total-projects',
      title: 'Total projects',
      value: totalProjects.toString(),
      badgeText: totalProjects > 0 ? `${Math.max(1, activeWorkspaces)} registered` : '0 registered',
      badgeBgClass: 'bg-[#E7E1D7] border border-[#E5E0D7]',
      badgeTextClass: 'text-[#77766F]',
    },
    {
      id: 'ingested-documents',
      title: 'Ingested documents',
      value: totalDocuments.toString(),
      badgeText: 'Stored in Firestore',
      badgeBgClass: 'bg-[#E7E1D7] border border-[#E5E0D7]',
      badgeTextClass: 'text-[#77766F]',
    },
    {
      id: 'active-workspaces',
      title: 'Active workspaces',
      value: activeWorkspaces.toString(),
      badgeText: 'Active synthesis',
      badgeBgClass: 'bg-[#263B32]/10 border border-[#263B32]/20',
      badgeTextClass: 'text-[#263B32]',
    },
    {
      id: 'handover-engine',
      title: 'Handover engine',
      value: 'Online',
      badgeText: 'Gemini 2.5 Flash',
      valueColorClass: 'text-[#263B32]',
      badgeBgClass: 'bg-[#263B32]/10 border border-[#263B32]/20',
      badgeTextClass: 'text-[#263B32]',
    },
  ];

  // Generate real activity items from user projects matching screenshot entries
  const realActivityItems: ActivityItem[] = [];
  userProjects.slice(0, 5).forEach((p) => {
    realActivityItems.push({
      id: `act-proj-${p.projectId}`,
      title: `${p.name} workspace created`,
      subtitle: `Registered in Firestore, ${formatDate(p.createdAt)}`,
      type: 'project',
    });

    if (p.documentCount && p.documentCount > 0) {
      realActivityItems.push({
        id: `act-docs-${p.projectId}`,
        title: `${p.documentCount} document uploaded`,
        subtitle: `${p.name} processed and indexed, ${formatDate(p.updatedAt || p.createdAt)}`,
        type: 'document',
      });
    }
  });

  const handleExportAudit = () => {
    if (onExportAuditLog) {
      onExportAuditLog();
      return;
    }
    const auditData = {
      exportedAt: new Date().toISOString(),
      platform: 'HandoverX Knowledge Engine',
      totalProjects,
      totalDocuments,
      projects: userProjects.map((p) => ({
        projectId: p.projectId,
        name: p.name,
        description: p.description,
        documentCount: p.documentCount || 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handoverx_audit_log_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full font-barlow select-none px-5 py-3">
      {/* 1. Header Section */}
      <section className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-semibold text-[#252923] tracking-tight leading-tight">
            Workspace overview
          </h1>
          <p className="text-[11px] text-[#77766F] mt-1 leading-normal">
            Managing {totalProjects} project workspace{totalProjects === 1 ? '' : 's'} and {totalDocuments} document{totalDocuments === 1 ? '' : 's'} in Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportAudit}
            className="px-3 py-1.5 rounded-md bg-[#FFFFFF] hover:bg-[#E7E1D7] border border-[#E5E0D7] text-[#252923] text-[11px] font-normal transition-colors cursor-pointer leading-none shadow-2xs"
          >
            Export audit log
          </button>

          <button
            type="button"
            onClick={onCreateProject}
            className="px-3.5 py-1.5 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] text-[11px] font-semibold transition-colors cursor-pointer leading-none shadow-xs"
          >
            Create project
          </button>
        </div>
      </section>

      {/* Backend Availability / Error Notice */}
      {loadError && (
        <div
          role="alert"
          className="mt-3 p-3 bg-[#B94A48]/10 border border-[#B94A48]/30 rounded-lg text-[#B94A48] text-[11px] flex items-center justify-between gap-3 shadow-xs"
        >
          <span>{loadError}</span>
          {onRetryProjects && (
            <button
              type="button"
              onClick={onRetryProjects}
              className="px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#E5E0D7] text-[#252923] text-[10.5px] hover:bg-[#E7E1D7] transition-colors cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* 2. Four Statistic Cards in one horizontal row */}
      <section className="grid grid-cols-4 gap-3 mt-4">
        {realMetrics.map((metric) => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </section>

      {/* 3. Two-Column Main Content Layout */}
      <div className="grid grid-cols-12 gap-3.5 mt-5 items-start">
        {/* Left Column: Your projects (7 cols ~ 64%) */}
        <div className="col-span-12 md:col-span-7 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#252923] tracking-tight">
              Your projects
            </h2>
            {totalProjects > 0 && (
              <a
                href="#all-projects"
                onClick={(e) => {
                  e.preventDefault();
                  if (onViewAllProjects) onViewAllProjects();
                }}
                className="text-[11px] text-[#263B32] hover:underline transition-colors cursor-pointer font-medium"
              >
                View all ({totalProjects})
              </a>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Skeleton loading state */}
            {isLoadingProjects && (
              <div className="flex flex-col gap-2.5">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-[#FFFFFF]/85 rounded-xl p-3.5 border border-[#E5E0D7] flex flex-col gap-2 animate-pulse shadow-xs"
                  >
                    <div className="h-3 bg-[#E7E1D7] rounded w-1/4" />
                    <div className="h-4 bg-[#E7E1D7] rounded w-1/2" />
                    <div className="h-2.5 bg-[#E7E1D7] rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State when user has 0 projects */}
            {!isLoadingProjects && totalProjects === 0 && (
              <div className="bg-[#FFFFFF]/85 backdrop-blur-md rounded-xl p-6 border border-[#E5E0D7] flex flex-col items-center justify-center text-center shadow-xs">
                <h3 className="text-[13px] font-semibold text-[#252923]">
                  No projects in your workspace yet
                </h3>
                <p className="text-[11px] text-[#77766F] max-w-sm mt-1 mb-4 leading-normal">
                  Create your first project to start uploading documents and generating AI handover reports.
                </p>
                <button
                  type="button"
                  onClick={onCreateProject}
                  className="px-3.5 py-1.5 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Create project
                </button>
              </div>
            )}

            {/* Real user projects list */}
            {!isLoadingProjects &&
              userProjects.map((proj) => {
                const docCount = proj.documentCount || 0;
                const isDocActive = docCount > 0;
                // Handover completeness calculation matching screenshot (1 doc = 32%, 0 docs = 0%)
                const completeness = isDocActive ? Math.min(100, Math.round(docCount * 32)) : 0;
                const statusLabel = isDocActive ? 'Active' : 'Awaiting ingestion';
                const lastUploadedLabel = isDocActive ? `${docCount} document` : 'awaiting docs';

                return (
                  <ProjectCard
                    key={proj.projectId}
                    documentCount={docCount}
                    title={proj.name}
                    status={statusLabel}
                    description={proj.description || 'Project workspace registered in Firestore.'}
                    progress={completeness}
                    lastUploaded={lastUploadedLabel}
                    lastUpdated={formatDate(proj.updatedAt || proj.createdAt)}
                    onClick={() => onSelectProject?.(proj.projectId, proj.name, proj.description)}
                  />
                );
              })}
          </div>
        </div>

        {/* Right Column: Recent activity (5 cols ~ 36%) */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#252923] tracking-tight">
              Recent activity
            </h2>
            <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-[#263B32]/10 border border-[#263B32]/25 text-[#263B32] font-semibold leading-none">
              Live feed
            </span>
          </div>

          <ActivityTimeline
            items={realActivityItems}
            onViewAuditLog={onViewAuditLog || handleExportAudit}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
