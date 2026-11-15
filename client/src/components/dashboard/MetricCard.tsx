import React from 'react';

export interface MetricCardProps {
  title: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconBgClass?: string;
  iconTextClass?: string;
  badgeText: string;
  badgeIcon?: React.ComponentType<{ className?: string }>;
  badgeIconClass?: string;
  badgeBgClass?: string;
  badgeTextClass?: string;
  valueColorClass?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  badgeText,
  badgeBgClass = 'bg-[#E7E1D7] border border-[#E5E0D7]',
  badgeTextClass = 'text-[#77766F]',
  valueColorClass = 'text-[#252923]',
  className = '',
}) => {
  return (
    <div
      className={`bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-lg p-3 flex flex-col justify-between h-[96px] font-barlow select-none shadow-xs hover:border-[#263B32]/30 transition-all ${className}`}
    >
      <span className="text-[11px] font-normal text-[#77766F] leading-none">
        {title}
      </span>
      <div className={`text-[23px] font-bold leading-tight tracking-tight ${valueColorClass}`}>
        {value}
      </div>
      <div className="flex items-center">
        <span
          className={`inline-flex items-center text-[9.5px] px-2 py-0.5 rounded-full font-medium leading-none ${badgeBgClass} ${badgeTextClass}`}
        >
          {badgeText}
        </span>
      </div>
    </div>
  );
};

export default MetricCard;
