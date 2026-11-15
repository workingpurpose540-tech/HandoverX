import React from 'react';
import type { WorkspaceMetricItem } from '../../types/workspace';

export interface WorkspaceMetricsProps {
  metrics: WorkspaceMetricItem[];
}

export const WorkspaceMetrics: React.FC<WorkspaceMetricsProps> = ({ metrics }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-barlow select-none">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl p-3 flex flex-col justify-between h-[96px] shadow-xs"
          >
            <div className="flex items-center justify-between text-[#77766F]">
              <span className="text-[11px] font-medium text-[#77766F] leading-none">
                {item.title}
              </span>
              <Icon className="w-3.5 h-3.5 text-[#77766F]" />
            </div>

            {item.badgeType === 'mint-text' && (
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[23px] text-[#252923] font-bold leading-tight tracking-tight">
                  {item.value}
                </span>
                <span className="text-[9.5px] font-semibold text-[#263B32]">
                  {item.badgeText}
                </span>
              </div>
            )}

            {item.badgeType === 'mint-pill' && (
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[23px] text-[#252923] font-bold leading-tight tracking-tight">
                  {item.value}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#263B32]/10 border border-[#263B32]/25 text-[#263B32] text-[9.5px] font-semibold leading-none">
                  {item.badgeText}
                </span>
              </div>
            )}

            {item.badgeType === 'pink-pill' && (
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[23px] text-[#252923] font-bold leading-tight tracking-tight">
                  {item.value}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#D6A64F]/15 border border-[#D6A64F]/30 text-[#91621E] text-[9.5px] font-semibold leading-none">
                  {item.badgeText}
                </span>
              </div>
            )}

            {item.badgeType === 'subtitle' && (
              <div className="flex flex-col mt-1">
                <span className="text-[20px] text-[#263B32] font-bold leading-tight tracking-tight">
                  {item.value}
                </span>
                <span className="text-[10px] text-[#77766F] mt-0.5 truncate leading-tight">
                  {item.subtitle}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default WorkspaceMetrics;
