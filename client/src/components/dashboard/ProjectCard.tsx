import React from 'react';
import type { StatusVariant } from '../../types/dashboard';

export interface ProjectCardProps {
  category?: string;
  code?: string;
  documentCount: number;
  title: string;
  status: string;
  statusVariant?: StatusVariant;
  description: string;
  progress: number;
  progressColorClass?: string;
  lastUploaded: string;
  lastUpdated: string;
  onClick?: () => void;
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  documentCount,
  title,
  status,
  description,
  progress,
  lastUploaded,
  lastUpdated,
  onClick,
  className = '',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const isAwaiting = status.toLowerCase().includes('awaiting');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-lg p-3.5 flex flex-col gap-2 transition-all hover:border-[#263B32]/35 hover:shadow-sm cursor-pointer font-barlow select-none ${className}`}
    >
      {/* Top Header Row: Title & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-[#252923] truncate leading-tight" title={title}>
          {title}
        </h3>

        <span
          className={`text-[9.5px] px-2 py-0.5 rounded-full font-medium leading-none ${
            isAwaiting
              ? 'bg-[#D6A64F]/15 border border-[#D6A64F]/30 text-[#8F6A17]'
              : 'bg-[#263B32]/10 border border-[#263B32]/25 text-[#263B32]'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Tags: Workspace & Documents */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9.5px] px-2 py-0.5 rounded bg-[#E7E1D7]/70 border border-[#E5E0D7] text-[#77766F] leading-none">
          Workspace
        </span>
        <span className="text-[9.5px] px-2 py-0.5 rounded bg-[#E7E1D7]/70 border border-[#E5E0D7] text-[#77766F] leading-none">
          {documentCount} document{documentCount === 1 ? '' : 's'}
        </span>
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#77766F] leading-normal line-clamp-1">
        {description}
      </p>

      {/* Handover Completeness with Gradient Progress Bar */}
      <div className="flex flex-col gap-1 mt-0.5">
        <div className="flex items-center justify-between text-[10px] leading-none">
          <span className="text-[#252923] font-medium">Handover completeness</span>
          <span className="text-[#252923] font-bold">{progress}%</span>
        </div>
        <div className="w-full h-[3px] bg-[#E7E1D7] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#263B32] via-[#34443B] to-[#C66A3D] transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Footer Metadata */}
      <div className="flex items-center justify-between pt-1 text-[9.5px] text-[#77766F]/80 leading-none">
        <span>Last uploaded: {lastUploaded}</span>
        <span>Updated {lastUpdated}</span>
      </div>
    </div>
  );
};

export default ProjectCard;
