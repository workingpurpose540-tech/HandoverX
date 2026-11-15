import React from 'react';

export interface ProgressBarProps {
  label?: string;
  value: number;
  barColorClass?: string;
  showValue?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label = 'Handover completeness',
  value,
  barColorClass = 'bg-gradient-to-r from-[#263B32] via-[#34443B] to-[#C66A3D]',
  showValue = true,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`flex flex-col gap-1 mt-1 font-barlow ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-[10px] leading-none">
          {label && <span className="text-[#77766F] font-medium">{label}</span>}
          {showValue && <span className="text-[#252923] font-bold">{clampedValue}%</span>}
        </div>
      )}
      <div className="w-full h-[4px] bg-[#E7E1D7] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
