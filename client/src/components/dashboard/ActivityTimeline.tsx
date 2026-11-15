import React from 'react';
import type { ActivityItem } from '../../types/dashboard';

export interface ActivityTimelineProps {
  items: ActivityItem[];
  onViewAuditLog?: () => void;
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  items,
  onViewAuditLog,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-lg p-3.5 flex flex-col justify-between font-barlow select-none shadow-xs ${className}`}
    >
      {items.length === 0 ? (
        <div className="py-6 text-center text-[#77766F] text-[11px] flex flex-col items-center gap-1">
          <span className="font-medium text-[#252923]">No activity logged yet</span>
          <span className="text-[10px] text-[#77766F]">
            Create a project and upload documents to track events.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const isDoc = item.type === 'document' || item.id.includes('doc') || item.title.toLowerCase().includes('document');
            return (
              <div key={item.id} className="flex items-start gap-2.5">
                {/* Refined bullet dot */}
                <span
                  className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                    isDoc
                      ? 'bg-[#D6A64F] ring-2 ring-[#D6A64F]/25'
                      : 'bg-[#263B32] ring-2 ring-[#263B32]/20'
                  }`}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-medium text-[#252923] leading-tight truncate">
                    {item.title}
                  </span>
                  <span className="text-[9.5px] text-[#77766F] mt-0.5 leading-tight">
                    {item.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Link */}
      <div className="mt-3 pt-2.5 border-t border-[#E5E0D7] text-center">
        <button
          type="button"
          onClick={onViewAuditLog}
          className="text-[10px] text-[#77766F] hover:text-[#263B32] transition-colors cursor-pointer bg-transparent border-0 p-0 font-medium"
        >
          Export or view full audit log
        </button>
      </div>
    </div>
  );
};

export default ActivityTimeline;
